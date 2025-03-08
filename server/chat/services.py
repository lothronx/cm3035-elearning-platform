from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from .models import ChatMessage
from notifications.services import create_notification
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


def create_chat_notification(recipient, message, sender_id):
    """
    Create a notification for a chat message and send a real-time websocket message
    
    Args:
        recipient: User who should receive the notification
        message: Content of the notification message
        sender_id: ID of the user who sent the chat message
    
    Returns:
        Notification object that was created
    """
    # Create a notification in the database using the notifications app
    try:
        notification = create_notification(recipient, message)
        
        # Send a real-time message via WebSocket to the chat channel
        channel_layer = get_channel_layer()
        
        # Send to user's chat channel
        user_chat_group = f"user_{recipient.id}_chat"
        
        try:
            async_to_sync(channel_layer.group_send)(
                user_chat_group,
                {
                    "type": "notification_message",
                    "message": {
                        "type": "new_message_notification",
                        "notification_id": notification.id,
                        "message": message,
                        "sender_id": sender_id
                    }
                }
            )
        except Exception as e:
            logger.error(f"Error sending chat notification via WebSocket: {str(e)}")
            
        return notification
    except Exception as e:
        logger.error(f"Error creating chat notification: {str(e)}")
        raise


def get_unread_message_count(user):
    """
    Get the count of unread messages for a user
    
    Args:
        user: User to check unread messages for
    
    Returns:
        int: Count of unread messages
    """
    try:
        # Count messages where user is the receiver and has unread messages
        # Note: We would need to add a 'read' field to the ChatMessage model to implement this
        # For now, we'll return 0 as a placeholder
        return 0
    except Exception as e:
        logger.error(f"Error getting unread message count: {str(e)}")
        return 0


def mark_messages_as_read(sender_id, receiver_id):
    """
    Mark all messages between two users as read
    
    Args:
        sender_id: ID of the message sender
        receiver_id: ID of the message receiver (current user)
        
    Returns:
        int: Number of messages marked as read
    """
    try:
        # For future implementation when we add a 'read' field to ChatMessage model
        # count = ChatMessage.objects.filter(sender_id=sender_id, receiver_id=receiver_id, read=False).update(read=True)
        # return count
        return 0
    except Exception as e:
        logger.error(f"Error marking messages as read: {str(e)}")
        return 0
