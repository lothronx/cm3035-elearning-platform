import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import ChatMessage
from asgiref.sync import sync_to_async
from .services import create_chat_notification

User = get_user_model()
logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.group_name = None

    async def connect(self):
        # Accept the connection first
        await self.accept()

        # Extract token from query string
        query_string = self.scope.get("query_string", b"").decode()

        # Extract token from query parameters
        token = None
        if query_string:
            try:
                params = dict(
                    item.split("=") for item in query_string.split("&") if "=" in item
                )
                token = params.get("token")
            except Exception as e:
                logger.error("Error parsing WebSocket query string: %s", str(e))

        # Log connection without token
        if not token:
            logger.warning("WebSocket connected without token")
            return

        # Parse and validate the token using DRF SimpleJWT
        try:
            # Validate and decode the token
            access_token = AccessToken(token)
            user_id = access_token["user_id"]

            if not user_id:
                logger.warning("No user_id in token payload")
                return

            # Get user object
            self.user = await self.get_user(user_id)
            logger.info("WebSocket authenticated for user: %s", user_id)

            # Create a user-specific group name
            self.group_name = f"user_{user_id}_chat"

            # Join the group
            await self.channel_layer.group_add(self.group_name, self.channel_name)

            # Send confirmation to client
            await self.send(text_data=json.dumps({
                "type": "connection_status",
                "status": "connected",
                "user_id": user_id,
            }))

        except TokenError as e:
            logger.error("Invalid token: %s", str(e))
        except Exception as e:
            logger.error("Error processing token: %s", str(e))

    async def disconnect(self, close_code):
        # Log disconnection
        logger.info("WebSocket disconnected with code: %s", close_code)

        # Leave group on disconnect
        if hasattr(self, "group_name") and self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    @sync_to_async
    def get_user(self, user_id):
        return User.objects.get(id=user_id)

    # Receive message from WebSocket
    async def receive(self, text_data):
        if not self.user:
            logger.warning("Unauthenticated user attempting to send messages")
            return

        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "chat_message":
                await self.handle_chat_message(data)
            elif message_type == "mark_read":
                # Future functionality for marking messages as read
                pass

        except json.JSONDecodeError:
            logger.error("Invalid JSON received from client")
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")

    async def handle_chat_message(self, data):
        try:
            receiver_id = data.get("receiver_id")
            content = data.get("content")
            message_type = data.get("message_type", "text")

            if not receiver_id or not content:
                logger.warning("Missing data in chat message request")
                return

            # Save message to database
            message = await self.save_message(receiver_id, content, message_type)

            # Prepare message for sending
            message_data = {
                "type": "chat_message",
                "message": {
                    "id": message["id"],
                    "sender_id": message["sender_id"],
                    "sender_name": message["sender_name"],
                    "content": message["content"],
                    "message_type": message["message_type"],
                    "timestamp": message["timestamp"],
                }
            }

            # Send to the recipient's group
            recipient_group = f"user_{receiver_id}_chat"
            await self.channel_layer.group_send(recipient_group, message_data)

            # Create notification for the receiver
            await self.create_notification(message)

            # Send back to sender as confirmation
            await self.send(text_data=json.dumps({
                "type": "message_sent",
                "message": message_data["message"]
            }))

        except Exception as e:
            logger.error(f"Error sending chat message: {str(e)}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Failed to send message"
            }))

    @sync_to_async
    def save_message(self, receiver_id, content, message_type):
        try:
            receiver = User.objects.get(id=receiver_id)
            message = ChatMessage.objects.create(
                sender=self.user,
                receiver=receiver,
                content=content,
                message_type=message_type
            )
            
            # Return message data as dict
            return {
                "id": message.id,
                "sender_id": self.user.id,
                "sender_name": self.user.username,
                "receiver_id": receiver.id,
                "content": message.content,
                "message_type": message.message_type,
                "timestamp": message.timestamp.isoformat(),
            }
        except User.DoesNotExist:
            logger.error(f"Receiver with ID {receiver_id} not found")
            raise

    @sync_to_async
    def create_notification(self, message):
        """Create a notification for the message recipient"""
        try:
            receiver = User.objects.get(id=message["receiver_id"])
            sender_name = self.user.username
            
            notification_message = f"New message from {sender_name}"
            if message["message_type"] == "text":
                # Add a preview of the message content (first 30 chars)
                preview = message["content"][:30]
                if len(message["content"]) > 30:
                    preview += "..."
                notification_message += f": {preview}"
            else:
                # For file messages
                notification_message += f": New {message['message_type']} attachment"
                
            # Create the actual notification
            create_chat_notification(receiver, notification_message, self.user.id)
        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")

    # Handle chat message event from channel layer
    async def chat_message(self, event):
        message = event.get("message", {})
        
        await self.send(text_data=json.dumps({
            "type": "new_message",
            "message": message
        }))
        
    # Handle notification messages from services
    async def notification_message(self, event):
        message = event.get("message", {})
        
        await self.send(text_data=json.dumps(message))
