from django.db import models
from accounts.models import User


class ChatMessage(models.Model):
    MESSAGE_TYPE_CHOICES = (
        ("text", "Text"),
        ("file", "File"),
    )
    sender: User = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="messages_sent"
    )
    receiver: User = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="messages_received"
    )
    content = models.TextField()
    message_type = models.CharField(
        max_length=10, choices=MESSAGE_TYPE_CHOICES, default="text"
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        sender_username = getattr(self.sender, "username", "Unknown User")
        receiver_username = getattr(self.receiver, "username", "Unknown User")
        return f"Message from {sender_username} to {receiver_username}"


class FileUpload(models.Model):
    chat_message = models.ForeignKey(
        ChatMessage, on_delete=models.CASCADE, related_name="files"
    )
    file = models.FileField(upload_to="chat_files/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"File attached to message with ID {getattr(self.chat_message, 'pk', 'Unknown ID')}"
