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
import datetime

User = get_user_model()
channel_layer = get_channel_layer()


class ChatMessageViewSet(viewsets.ModelViewSet):
    """ViewSet for handling chat message operations.

    This ViewSet provides endpoints for managing chat messages between users, including:
    - Listing chat sessions
    - Retrieving chat history with specific users
    - Sending messages (both text and files)
    - Marking messages as read
    - Initializing new chat sessions
    """
    permission_classes = [IsAuthenticated]  # Ensures only authenticated users can access chat functionality
    serializer_class = ChatMessageSerializer  # Serializer class for chat message objects
    http_method_names = ["get", "post"]  # Limit available HTTP methods to GET and POST

    def get_queryset(self):
        """Get the queryset of chat messages for the current user.

        Returns:
            QuerySet: All chat messages where the current user is either sender or receiver,
                     ordered by timestamp (newest first).
        """
        user = self.request.user
        # Return messages where user is either sender or receiver
        return ChatMessage.objects.filter(Q(sender=user) | Q(receiver=user)).order_by(
            "-timestamp"
        )

    def list(self, request):
        """GET /api/chat/ - Get all chat sessions for current user"""
        chat_sessions = ChatMessage.get_chat_sessions(request.user)
        return Response(chat_sessions)

    def retrieve(self, request, pk=None):
        """Get chat messages between the current user and another user.

        Args:
            request: The HTTP request object
            pk (int): The ID of the other user to get chat messages with

        Returns:
            Response: Serialized chat messages between the two users

        Raises:
            404: If the specified user does not exist
        """
        try:
            other_user = User.objects.get(id=pk)
            current_user = request.user

            # Get all messages between the two users
            messages = ChatMessage.get_chat_messages(current_user, other_user).order_by(
                "timestamp"
            )

            serializer = self.get_serializer(
                messages, many=True, context={"request": request}
            )
            return Response(serializer.data)

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

    def create(self, request, *args, **kwargs):
        """Send a message to a specific user.

        This endpoint handles both text messages and file uploads. While WebSocket
        is preferred for text-only messages, this endpoint serves as a fallback
        and remains the primary method for file uploads.

        Args:
            request: The HTTP request object containing:
                - receiver (int): ID of the user to send the message to
                - content (str, optional): Text content of the message
                - file (File, optional): File attachment

        Returns:
            Response: The created message data if successful

        Raises:
            400: If receiver ID is invalid or missing, or if message data is invalid
            404: If the receiver does not exist
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

    @action(methods=["post"], detail=False)
    def mark_chat_read(self, request):
        """Mark all messages from a specific user as read.

        Args:
            request: The HTTP request object containing:
                - chat_id (int): ID of the user whose messages to mark as read

        Returns:
            Response: Success message and unread sessions status

        Raises:
            400: If chat_id is missing
            404: If the specified user does not exist
            500: For any other unexpected errors
        """
        try:
            chat_id = request.data.get("chat_id")
            if not chat_id:
                return Response(
                    {"error": "chat_id is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Get the other user
            try:
                other_user = User.objects.get(id=chat_id)
            except User.DoesNotExist:
                return Response(
                    {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
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
                    },
                },
            )

            return Response(
                {
                    "message": "All messages marked as read",
                    "any_unread_sessions": any_unread_sessions,
                }
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(methods=["post"], detail=False)
    def initialize(self, request):
        """Initialize a chat session with a specific user.

        Args:
            request: The HTTP request object containing:
                - chat_id (int): ID of the user to initialize chat with

        Returns:
            Response: Chat session data including user details and message history

        Raises:
            400: If chat_id is missing
            404: If the specified user does not exist
        """
        try:
            chat_id = request.data.get("chat_id")
            if not chat_id:
                return Response(
                    {"error": "chat_id is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Check if user exists
            try:
                chat_partner = User.objects.get(id=chat_id)
            except User.DoesNotExist:
                return Response(
                    {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
                )

            # Return success - no need to create any records yet,
            # actual messages will be created when the user sends something
            return Response(
                {
                    "id": chat_partner.id,
                    "name": chat_partner.get_full_name() or chat_partner.username,
                }
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
