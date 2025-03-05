from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    recipient = serializers.StringRelatedField()  # Display recipient's username

    class Meta:
        model = Notification
        fields = ["id", "recipient", "message", "is_read", "created_at"]
        read_only_fields = ["id", "created_at"]
