from django.db import models
from accounts.models import User


class ChatMessage(models.Model):
    MESSAGE_TYPE_CHOICES = (
        ("text", "Text"),
        ("file", "File"),
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="messages_sent"
    )
    receiver = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="messages_received"
    )
    content = models.TextField()
    message_type = models.CharField(
        max_length=10, choices=MESSAGE_TYPE_CHOICES, default="text"
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender.username} to {self.receiver.username}"


class FileUpload(models.Model):
    chat_message = models.ForeignKey(
        ChatMessage, on_delete=models.CASCADE, related_name="files"
    )
    file = models.FileField(upload_to="chat_files/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"File attached to {self.chat_message.id}"
