from django.db import models
from django.db.models import Q
from accounts.models import User


class ChatMessage(models.Model):
    """Model representing a chat message between two users.

    This model stores chat messages exchanged between users in the e-learning platform.
    Messages can contain text content and/or file attachments. Each message tracks its
    read status to support real-time chat notifications.

    Attributes:
        sender (User): User who sent the message
        receiver (User): User who received the message
        content (str, optional): Text content of the message
        file (File, optional): Attached file, if any
        timestamp (datetime): When the message was sent
        is_read (bool): Whether the message has been read by the receiver
    """

    # User relationships
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="messages_sent",
        help_text="User who sent the message",
    )
    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="messages_received",
        help_text="User who received the message",
    )

    # Message content
    content = models.TextField(
        null=True, blank=True, help_text="Text content of the message"
    )
    file = models.FileField(
        upload_to="chat_files/",
        null=True,
        blank=True,
        help_text="Optional file attachment",
    )

    # Metadata
    timestamp = models.DateTimeField(
        auto_now_add=True, help_text="When the message was sent"
    )
    is_read = models.BooleanField(
        default=False, help_text="Whether the message has been read by the receiver"
    )

    class Meta:
        indexes = [
            models.Index(fields=["sender", "receiver", "timestamp"]),
            models.Index(fields=["receiver", "is_read"]),
        ]

    def __str__(self):
        """Return a string representation of the message."""
        return f"Message from {self.sender.get_full_name()} to {self.receiver.get_full_name()}"

    @classmethod
    def get_chat_messages(cls, user1, user2):
        """Get messages exchanged between two users.

        Args:
            user1 (User): First user in the conversation
            user2 (User): Second user in the conversation

        Returns:
            QuerySet: Messages between the two users
        """
        return cls.objects.filter(
            Q(sender=user1, receiver=user2) | Q(sender=user2, receiver=user1)
        )

    @classmethod
    def get_chat_sessions(cls, user):
        """Get all chat sessions for a user with their latest messages and unread status.

        Args:
            user (User): The user to get chat sessions for

        Returns:
            List[dict]: A list of dictionaries with chat session information including:
                - id: The chat partner's user ID
                - name: The chat partner's full name or username
                - last_message: Content of the last message or 'Sent a file'
                - is_unread: Whether there are unread messages from this partner
        """
        # Get unique chat partners
        chat_partners = User.objects.filter(
            Q(messages_sent__receiver=user) | Q(messages_received__sender=user)
        ).distinct()

        chat_sessions = []
        for partner in chat_partners:
            # Get the latest message
            latest_message = (
                cls.objects.filter(
                    Q(sender=user, receiver=partner) | Q(sender=partner, receiver=user)
                )
                .order_by("-timestamp")
                .first()
            )

            # Check for unread messages
            has_unread = cls.objects.filter(
                sender=partner, receiver=user, is_read=False
            ).exists()

            # Add timestamp for sorting
            timestamp = latest_message.timestamp if latest_message else None

            chat_sessions.append(
                {
                    "id": partner.id,
                    "name": partner.get_full_name() or partner.username,
                    "last_message": (
                        latest_message.content[:25] + "..."
                        if latest_message.content and len(latest_message.content) > 25
                        else (
                            (latest_message.content or "Sent a file")
                            if latest_message
                            else ""
                        )
                    ),
                    "is_unread": has_unread,
                    "_timestamp": timestamp,  # Internal field for sorting
                }
            )

        # Sort by timestamp (newest first) and remove the temporary _timestamp field
        sorted_sessions = sorted(
            chat_sessions,
            key=lambda x: x["_timestamp"] or datetime.datetime.min,
            reverse=True,
        )

        for session in sorted_sessions:
            if "_timestamp" in session:
                del session["_timestamp"]

        return sorted_sessions
