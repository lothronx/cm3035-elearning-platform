from django.db import models
from accounts.models import User


class Notification(models.Model):
    recipient: User = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        recipient_username = getattr(self.recipient, "username", "Unknown User")
        return f"Notification for {recipient_username}: {str(self.message)[:50]}"
