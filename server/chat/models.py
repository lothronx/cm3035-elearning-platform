from django.db import models
from accounts.models import User


class ChatMessage(models.Model):
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="messages_sent"
    )
    receiver = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="messages_received"
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Message from {self.sender.get_full_name()} to {self.receiver.get_full_name()}"


class FileUpload(models.Model):
    chat_message = models.ForeignKey(
        ChatMessage, on_delete=models.CASCADE, related_name="files"
    )
    file = models.FileField(upload_to="chat_files/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"File attached to {self.chat_message.id}"
