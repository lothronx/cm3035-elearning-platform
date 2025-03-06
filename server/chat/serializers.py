from rest_framework import serializers
from .models import ChatMessage, FileUpload


class FileUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileUpload
        fields = ["id", "chat_message", "file", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField()  # Display sender's username
    receiver = serializers.StringRelatedField()  # Display receiver's username
    files = FileUploadSerializer(
        many=True, read_only=True
    )  # Nested serializer for files

    class Meta:
        model = ChatMessage
        fields = [
            "id",
            "sender",
            "receiver",
            "content",
            "message_type",
            "timestamp",
            "files",
        ]
        read_only_fields = ["id", "timestamp"]
