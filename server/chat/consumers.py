import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from asgiref.sync import sync_to_async

User = get_user_model()
logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time chat operations.

    This consumer handles:
    - WebSocket connections with JWT authentication
    - Real-time message notifications
    - Read status updates
    - Chat session updates

    All chat operations except read status updates should be performed via HTTP API.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None  # Authenticated user
        self.group_name = None  # Channel group name for this user

    async def connect(self):
        """
        Handle WebSocket connection.

        Authenticates user using JWT token from query string.
        Adds user to their personal chat group.
        Closes connection if authentication fails.
        """
        # Get token from query string
        query_string = self.scope.get("query_string", b"").decode()
        token = None
        if query_string:
            try:
                # Parse query string into dictionary
                params = dict(
                    item.split("=") for item in query_string.split("&") if "=" in item
                )
                token = params.get("token")
            except Exception as e:
                logger.error(f"Error parsing query string: {str(e)}")

        if not token:
            await self.close()
            return

        try:
            # Validate token and get user
            access_token = AccessToken(token)
            user_id = access_token["user_id"]
            self.user = await self.get_user(user_id)

            # Join user's chat group
            self.group_name = f"user_{user_id}_chat"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()

        except (TokenError, User.DoesNotExist) as e:
            logger.error(f"Authentication failed: {str(e)}")
            await self.close()

    async def disconnect(self, close_code):
        """
        Handle WebSocket disconnection.

        Removes user from their chat group when they disconnect.
        """
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    @sync_to_async
    def get_user(self, user_id):
        """
        Get user by ID.

        Args:
            user_id: ID of the user to retrieve

        Returns:
            User: The user object
        """
        return User.objects.get(id=user_id)

    async def receive(self, text_data):
        """
        Handle incoming WebSocket messages.

        Only processes read status updates. All other operations should use HTTP API.
        """
        if not self.user:
            return

        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            # WebSocket now only handles read status updates - everything else should use API
            if message_type == "mark_read":
                await self.handle_mark_read(data)
            else:
                logger.warning(
                    f"Unsupported WebSocket message type: {message_type}. Use API endpoints instead."
                )
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "error",
                            "error": "This operation should be performed via HTTP API",
                        }
                    )
                )
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "Failed to process your request"}
                )
            )

    async def handle_mark_read(self, data):
        """
        Handle marking messages as read for a specific chat.

        Args:
            data: Dictionary containing chat_id and other relevant information
        """
        try:
            chat_id = data.get("chat_id")
            if not chat_id:
                return

            # Mark messages as read and check if any unread messages remain
            has_unread, any_unread_sessions = await self.mark_messages_read(chat_id)

            # Send update to the user about read status
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "read_status_update",
                        "chat_id": chat_id,
                        "has_unread": has_unread,
                        "all_read": not any_unread_sessions,
                        "any_unread_sessions": any_unread_sessions,
                    }
                )
            )

        except Exception as e:
            logger.error(f"Error marking messages as read: {str(e)}")
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "Failed to mark messages as read"}
                )
            )

    async def chat_message(self, event):
        """
        Handle chat message event from channel layer.

        Args:
            event: Dictionary containing message data
        """
        await self.send(text_data=json.dumps(event))

    async def notification_message(self, event):
        """
        Handle notification message event from channel layer.

        Args:
            event: Dictionary containing notification data
        """
        await self.send(text_data=json.dumps(event))

    async def chat_sessions_updated(self, event):
        """
        Notify client that chat sessions have been updated and should be refreshed via API.
        """
        await self.send(text_data=json.dumps({"type": "chat_sessions_updated"}))

    async def chat_message_notification(self, event):
        """
        Send notification for new message received (used when message is created via API).

        Args:
            event: Dictionary containing message data
        """
        await self.send(
            text_data=json.dumps({"type": "chat_message", "message": event["message"]})
        )
