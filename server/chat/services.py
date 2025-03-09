from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


def notify_new_message(sender, receiver):
    """
    Send a real-time notification to the receiver about a new message
    
    Args:
        sender: User who sent the message
        receiver: User who should receive the notification
    """
    try:
        # Get the sender's name
        sender_name = sender.get_full_name() or sender.username
        
        # Create notification message
        message = f"You received a new message from {sender_name}"
        
        # Get channel layer
        channel_layer = get_channel_layer()
        
        # Send to receiver's chat channel
        receiver_group = f"user_{receiver.id}_chat"
        
        # Send notification via WebSocket
        async_to_sync(channel_layer.group_send)(
            receiver_group,
            {
                "type": "notification_message",
                "message": {
                    "type": "new_message",
                    "content": message,
                    "sender_id": sender.id,
                    "sender_name": sender_name
                }
            }
        )
    except Exception as e:
        logger.error(f"Error sending chat notification: {str(e)}")