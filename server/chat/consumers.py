import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import ChatMessage
from asgiref.sync import sync_to_async
from .services import notify_new_message

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
            if data.get("type") == "chat_message":
                await self.handle_chat_message(data)
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")

    async def handle_chat_message(self, data):
        try:
            receiver_id = data.get("receiver_id")
            content = data.get("content")
            if not receiver_id or not content:
                return

            # Save and send message
            message = await self.save_message(receiver_id, content)
            if message:
                # Send to receiver's group
                # For the receiver, set isSender to False
                receiver_message = message.copy()
                receiver_message["isSender"] = False
                
                await self.channel_layer.group_send(
                    f"user_{receiver_id}_chat",
                    {"type": "chat_message", "message": receiver_message},
                )

                # Send notification
                await self.notify_receiver(message["receiver_id"])

                # Confirm to sender
                await self.send(
                    text_data=json.dumps({"type": "message_sent", "message": message})
                )

        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "Failed to send message"}
                )
            )

    @sync_to_async
    def save_message(self, receiver_id, content):
        try:
            receiver = User.objects.get(id=receiver_id)
            message = ChatMessage.objects.create(
                sender=self.user, receiver=receiver, content=content
            )

            # Create a chat_id using user ids to match API format
            # This should be the same logic used by the API to determine chat ID
            chat_id = receiver_id  # Assuming chat_id is the other user's ID
            
            return {
                "id": message.id,
                "sender_id": self.user.id,
                "sender_name": self.user.get_full_name() or self.user.username,
                "receiver_id": receiver.id,
                "chat_id": chat_id,  # Add chat_id field
                "isSender": True,     # Add isSender field for sender
                "content": content,
                "timestamp": message.timestamp.isoformat(),
                "file": {            # Add file structure to match API format
                    "id": None,
                    "type": None, 
                    "title": None,
                    "url": None
                }
            }
        except User.DoesNotExist:
            logger.error(f"Receiver {receiver_id} not found")
            return None

    @sync_to_async
    def notify_receiver(self, receiver_id):
        try:
            receiver = User.objects.get(id=receiver_id)
            notify_new_message(self.user, receiver)
        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")

    async def chat_message(self, event):
        """Handle chat message event from channel layer"""
        await self.send(text_data=json.dumps(event))

    async def notification_message(self, event):
        """Handle notification message event from channel layer"""
        await self.send(text_data=json.dumps(event))
