import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import ChatMessage
from asgiref.sync import sync_to_async
from .services import notify_new_message
from django.db.models import Q

User = get_user_model()
logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.group_name = None

    async def connect(self):
        # Get token from query string
        query_string = self.scope.get("query_string", b"").decode()
        token = None
        if query_string:
            try:
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
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    @sync_to_async
    def get_user(self, user_id):
        return User.objects.get(id=user_id)

    async def receive(self, text_data):
        if not self.user:
            return

        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            # WebSocket now only handles read status updates - everything else should use API
            if message_type == "mark_read":
                await self.handle_mark_read(data)
            else:
                logger.warning(f"Unsupported WebSocket message type: {message_type}. Use API endpoints instead.")
                await self.send(
                    text_data=json.dumps(
                        {"type": "error", "error": "This operation should be performed via HTTP API"}
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
        """Handle marking messages as read for a specific chat"""
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

    @sync_to_async
    def mark_messages_read(self, chat_id):
        """Mark all messages from a specific sender as read"""
        try:
            # Get the other user (chat partner)
            other_user = User.objects.get(id=chat_id)

            # Mark all unread messages from this user as read
            ChatMessage.objects.filter(
                sender=other_user, receiver=self.user, is_read=False
            ).update(is_read=True)

            # Check if there are still unread messages from this chat partner
            has_unread = ChatMessage.objects.filter(
                sender=other_user, receiver=self.user, is_read=False
            ).exists()

            # Check if there are any unread messages from any chat partner
            any_unread_sessions = ChatMessage.objects.filter(
                receiver=self.user, is_read=False
            ).exists()

            return has_unread, any_unread_sessions

        except User.DoesNotExist:
            logger.error(f"User {chat_id} not found")
            return False, False

    async def chat_message(self, event):
        """Handle chat message event from channel layer"""
        await self.send(text_data=json.dumps(event))

    async def notification_message(self, event):
        """Handle notification message event from channel layer"""
        await self.send(text_data=json.dumps(event))

    async def chat_sessions_updated(self, event):
        """Notify client that chat sessions have been updated and should be refreshed via API"""
        await self.send(text_data=json.dumps({"type": "chat_sessions_updated"}))

    async def chat_message_notification(self, event):
        """Send notification for new message received (used when message is created via API)"""
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event["message"]
        }))
