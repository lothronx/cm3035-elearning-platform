"""
Notification Consumers
=====================

This module contains WebSocket consumers for handling real-time notifications.
"""

import json
import logging
from typing import Optional
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time notifications.

    Handles:
    - Authentication via JWT tokens
    - Group management for user-specific notifications
    - Receiving and broadcasting notifications
    """

    def __init__(self, *args, **kwargs):
        """Initialize the consumer with empty user and group name."""
        super().__init__(*args, **kwargs)
        self.user: Optional[User] = None
        self.group_name: Optional[str] = None

    async def connect(self):
        """
        Handle WebSocket connection.

        Steps:
        1. Accept the connection
        2. Extract and validate JWT token from query parameters
        3. Add user to their notification group
        4. Send connection confirmation
        """
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

        except TokenError as e:
            logger.error("Invalid token: %s", str(e))
        except Exception as e:
            logger.error("Error processing token: %s", str(e))

    async def disconnect(self, close_code):
        """
        Handle WebSocket disconnection.

        Args:
            close_code: The WebSocket close code
        """
        # Log disconnection
        logger.info("WebSocket disconnected with code: %s", close_code)

        # Leave group on disconnect - safely check if group_name exists
        if hasattr(self, "group_name") and self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data, bytes_data=None):
        """
        Handle incoming WebSocket messages.

        Args:
            text_data: The received text data
            bytes_data: The received binary data (not used)
        """
        try:
            # Parse the received JSON data
            text_data_json = json.loads(text_data)
            logger.info("Received message: %s", text_data_json)
            # We're not doing anything with this data for now
        except Exception as e:
            logger.error("Error processing message: %s", str(e))

    async def notification_message(self, event):
        """
        Handle notification messages from the group.

        Args:
            event: The event containing notification data
        """
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
