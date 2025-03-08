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
        # Get the user from the scope (should be populated by our TokenAuthMiddleware)
        self.user = self.scope["user"]
        
        # Log connection attempt for debugging
        logger.info("WebSocket connection attempt - Auth status: %s", self.user.is_authenticated)
        
        # Accept the connection first (important for debugging)
        await self.accept()
        
        # For proper production use, we should only proceed if user is authenticated
        if not self.user.is_authenticated or isinstance(self.user, AnonymousUser):
            logger.warning("Non-authenticated user attempted to connect to notifications")
            await self.close(code=4003)  # 4003 = Unauthorized
            return
            
        # Get the authenticated user's ID
        user_id = self.user.id
        logger.info("Authenticated user connected: %s", user_id)
            
        # Create a user-specific group name
        self.group_name = f"user_{user_id}_notifications"
        
        # Join the group - this must match EXACTLY what's in services.py
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        # Send confirmation to client
        await self.send(text_data=json.dumps({
            'type': 'connection_status',
            'status': 'connected',
            'user_id': user_id,
            'group': self.group_name
        }))
    
    async def disconnect(self, close_code):
        # Log disconnection
        logger.info("WebSocket disconnected with code: %s", close_code)
        
        # Leave group on disconnect
        if self.group_name:
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
    
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
            message_content = event.get('message', '')
            notification_id = event.get('notification_id')
            
            # Log the notification being sent
            logger.info("Sending notification (ID: %s) to client", notification_id)
            
            # Send message to WebSocket
            await self.send(text_data=json.dumps({
                'type': 'notification',
                'message': message_content,
                'notification_id': notification_id
            }))
        except Exception as e:
            logger.error("Error sending notification: %s", str(e))
