from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import ChatMessage
from .serializers import ChatMessageSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

User = get_user_model()
channel_layer = get_channel_layer()


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
        """GET /api/chat/ - Get all chat sessions for current user

        This endpoint now serves as a fallback for when WebSocket is not available.
        The primary method for getting chat sessions is via WebSocket.
        """
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
                    "last_message": (
                        latest_message.content or "Sent a file"
                        if latest_message
                        else ""
                    ),
                    "is_unread": has_unread,
                }
            )

        return Response(chat_sessions)

    def retrieve(self, request, pk=None):
        """GET /api/chat/{id}/ - Get chat messages with a specific user

        This endpoint now serves as a fallback for when WebSocket is not available.
        The primary method for getting chat history is via WebSocket.
        """
        try:
            other_user = User.objects.get(id=pk)
            current_user = request.user

            # Get all messages between the two users
            messages = ChatMessage.objects.filter(
                (Q(sender=current_user) & Q(receiver=other_user))
                | (Q(sender=other_user) & Q(receiver=current_user))
            ).order_by("timestamp")

            # Mark all messages in this chat session as read
            messages.filter(
                sender=other_user, receiver=current_user, is_read=False
            ).update(is_read=True)

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

        This endpoint handles both text messages and file uploads.
        For text-only messages, WebSocket is the preferred method, but this endpoint
        serves as a fallback when WebSocket is not available.
        For file uploads, this endpoint is still the primary method.

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

                # Format message data for WebSocket
                sender_name = request.user.get_full_name() or request.user.username
                file_data = None
                if message.file and message.file.name:
                    file_data = {
                        "id": message.id,
                        "title": message.file.name.split("/")[-1],
                        "url": message.file.url,
                    }
                
                message_data = {
                    "id": message.id,
                    "sender_id": request.user.id,
                    "sender_name": sender_name,
                    "receiver_id": receiver.id,
                    "content": message.content,
                    "timestamp": message.timestamp.isoformat(),
                    "file": file_data,
                }
                
                # Send notification to receiver's WebSocket
                async_to_sync(channel_layer.group_send)(
                    f"user_{receiver_id}_chat",
                    {"type": "chat_message_notification", "message": message_data},
                )
                
                # Notify both sender and receiver to refresh their chat sessions
                for user_id in [request.user.id, receiver_id]:
                    async_to_sync(channel_layer.group_send)(
                        f"user_{user_id}_chat",
                        {"type": "chat_sessions_updated"},
                    )

                return Response(
                    self.get_serializer(message, context={"request": request}).data,
                    status=status.HTTP_201_CREATED,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except User.DoesNotExist:
            return Response(
                {"error": "Receiver not found"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(methods=["post"], detail=True)
    def mark_as_read(self, request, pk=None):
        """POST /api/chat/{id}/mark_as_read/ - Mark a message as read"""
        try:
            message = ChatMessage.objects.get(id=pk)
            if message.receiver == request.user:
                message.is_read = True
                message.save()
                return Response({"message": "Message marked as read"})
            else:
                return Response(
                    {"error": "You are not the receiver of this message"},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except ChatMessage.DoesNotExist:
            return Response(
                {"error": "Message not found"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(methods=["post"], detail=False)
    def mark_chat_read(self, request):
        """POST /api/chat/mark_chat_read/ - Mark all messages from a specific user as read"""
        try:
            chat_id = request.data.get("chat_id")
            if not chat_id:
                return Response(
                    {"error": "chat_id is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Get the other user
            try:
                other_user = User.objects.get(id=chat_id)
            except User.DoesNotExist:
                return Response(
                    {"error": "User not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Mark all messages from the other user as read
            unread_messages = ChatMessage.objects.filter(
                sender=other_user, receiver=request.user, is_read=False
            )
            unread_messages.update(is_read=True)
            
            # Check if there are any unread messages left from any sender
            any_unread_sessions = ChatMessage.objects.filter(
                receiver=request.user, is_read=False
            ).exists()
            
            # Send WebSocket notification about read status update
            async_to_sync(channel_layer.group_send)(
                f"user_{request.user.id}_chat",
                {
                    "type": "chat_message", 
                    "message": {
                        "type": "read_status_update",
                        "chat_id": chat_id,
                        "has_unread": False,
                        "all_read": not any_unread_sessions,
                        "any_unread_sessions": any_unread_sessions,
                    }
                }
            )
            
            return Response({
                "message": "All messages marked as read",
                "any_unread_sessions": any_unread_sessions
            })
            
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    @action(methods=["post"], detail=False)
    def initialize(self, request):
        """POST /api/chat/initialize/ - Initialize a chat with a specific user"""
        try:
            chat_id = request.data.get("chat_id")
            if not chat_id:
                return Response(
                    {"error": "chat_id is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Check if user exists
            try:
                chat_partner = User.objects.get(id=chat_id)
            except User.DoesNotExist:
                return Response(
                    {"error": "User not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Return success - no need to create any records yet,
            # actual messages will be created when the user sends something
            return Response({
                "id": chat_partner.id,
                "name": chat_partner.get_full_name() or chat_partner.username,
            })
            
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
