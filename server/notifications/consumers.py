import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.group_name = None

    async def connect(self):
        # Accept the connection first (important for debugging)
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

        # Manually parse the token to get user_id
        try:
            # Simple JWT token parsing - middle part contains payload
            import base64
            import json

            # Split the token into parts
            parts = token.split(".")
            if len(parts) != 3:
                logger.warning("Invalid token format")
                return

            # Get the payload part (middle part)
            payload_encoded = parts[1]

            # Add padding if needed
            payload_encoded += "=" * ((4 - len(payload_encoded) % 4) % 4)

            # Decode the payload
            payload_bytes = base64.urlsafe_b64decode(payload_encoded)
            payload = json.loads(payload_bytes)

            # Extract user_id
            user_id = payload.get("user_id")
            if not user_id:
                logger.warning("No user_id in token payload")
                return

            logger.info("WebSocket authenticated for user: %s", user_id)

            # Create a user-specific group name - MUST match services.py
            self.group_name = f"user_{user_id}_notifications"

            # Join the group
            await self.channel_layer.group_add(self.group_name, self.channel_name)

            # Send confirmation to client
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "connection_status",
                        "status": "connected",
                        "user_id": user_id,
                    }
                )
            )

        except Exception as e:
            logger.error("Error processing token: %s", str(e))

    async def disconnect(self, close_code):
        # Log disconnection
        logger.info("WebSocket disconnected with code: %s", close_code)

        # Leave group on disconnect - safely check if group_name exists
        if hasattr(self, "group_name") and self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Receive message from WebSocket
    async def receive(self, text_data, bytes_data=None):
        try:
            # Parse the received JSON data
            text_data_json = json.loads(text_data)
            logger.info("Received message: %s", text_data_json)
            # We're not doing anything with this data for now
        except Exception as e:
            logger.error("Error processing message: %s", str(e))

    # Receive message from group
    async def notification_message(self, event):
        try:
            message_content = event.get("message", "")
            notification_id = event.get("notification_id")

            # Log the notification being sent
            logger.info("Sending notification (ID: %s) to client", notification_id)

            # Send message to WebSocket
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "notification",
                        "message": message_content,
                        "notification_id": notification_id,
                    }
                )
            )
        except Exception as e:
            logger.error("Error sending notification: %s", str(e))
