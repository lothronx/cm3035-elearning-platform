from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import ChatMessage
from .serializers import ChatMessageSerializer

User = get_user_model()


class ChatMessageViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ChatMessageSerializer
    http_method_names = ["get", "post"]

    def get_queryset(self):
        user = self.request.user
        return ChatMessage.objects.filter(Q(sender=user) | Q(receiver=user)).order_by(
            "-timestamp"
        )

    def list(self, request):
        """GET /api/chat/ - Get all chat sessions for current user"""
        user = request.user

        # Get all users who have chatted with the current user
        chat_partners = User.objects.filter(
            Q(messages_sent__receiver=user) | Q(messages_received__sender=user)
        ).distinct()

        # For each chat partner, get their latest message and unread status
        chat_sessions = []
        for partner in chat_partners:
            latest_message = (
                ChatMessage.objects.filter(
                    (Q(sender=user) & Q(receiver=partner))
                    | (Q(sender=partner) & Q(receiver=user))
                )
                .order_by("-timestamp")
                .first()
            )

            # Check if there are any unread messages from this partner
            has_unread = ChatMessage.objects.filter(
                sender=partner, receiver=user, is_read=False
            ).exists()

            chat_sessions.append(
                {
                    "id": partner.id,
                    "name": partner.get_full_name() or partner.username,
                    "last_message": latest_message.content or "Sent a file",
                    "is_unread": has_unread,
                }
            )

        return Response(chat_sessions)

    def retrieve(self, request, pk=None):
        """GET /api/chat/{id}/ - Get chat messages with a specific user"""
        try:
            other_user = User.objects.get(id=pk)
            current_user = request.user

            # Get all messages between the two users
            messages = ChatMessage.objects.filter(
                (Q(sender=current_user) & Q(receiver=other_user))
                | (Q(sender=other_user) & Q(receiver=current_user))
            ).order_by("timestamp")

            # Mark all messages in this chat session as read
            messages.filter(is_read=False).update(is_read=True)

            serializer = self.get_serializer(
                messages, many=True, context={"request": request}
            )
            return Response(serializer.data)

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

    def create(self, request, *args, **kwargs):
        """POST /api/chat/ - Send a message to a specific user

        Body parameters:
        - receiver: ID of the user to send the message to
        - content: Text content of the message (optional if file is present)
        - file: File attachment (optional if content is present)
        """
        try:
            try:
                receiver_id = int(request.data.get("receiver"))
            except (TypeError, ValueError):
                return Response(
                    {"error": "Invalid receiver ID"}, status=status.HTTP_400_BAD_REQUEST
                )

            if not receiver_id:
                return Response(
                    {"error": "Receiver ID is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            receiver = User.objects.get(id=receiver_id)
            serializer = self.get_serializer(
                data=request.data, context={"request": request}
            )

            if serializer.is_valid():
                message = serializer.save(sender=request.user, receiver=receiver)

                # Handle file upload if present
                if "file" in request.FILES:
                    message.file = request.FILES["file"]
                    message.save()

                return Response(
                    self.get_serializer(message, context={"request": request}).data,
                    status=status.HTTP_201_CREATED,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except User.DoesNotExist:
            return Response(
                {"error": "Receiver not found"}, status=status.HTTP_404_NOT_FOUND
            )
