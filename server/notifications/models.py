"""
Notification Model
==================

This model represents notifications sent to users in the e-learning platform.
"""

from django.db import models
from accounts.models import User


class Notification(models.Model):
    """
    Model representing user notifications.

    Attributes:
        recipient (User): The user receiving the notification
        message (str): The notification content
        is_read (bool): Whether the notification has been read
        created_at (datetime): When the notification was created
    """

    # The user receiving the notification
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
        help_text="The user who will receive this notification"
    )

    # The content of the notification
    message = models.TextField(
        help_text="The message content of the notification"
    )

    # Whether the notification has been read
    is_read = models.BooleanField(
        default=False,
        help_text="Indicates if the notification has been viewed by the user"
    )

    # When the notification was created
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="The date and time when the notification was created"
    )

    def __str__(self):
        """
        String representation of the notification.

        Returns:
            str: A formatted string showing recipient and truncated message
        """
        return f"Notification for {self.recipient.username}: {self.message[:50]}..."
