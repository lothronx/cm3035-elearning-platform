from rest_framework import serializers
from .models import ChatMessage, FileUpload


class FileUploadSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = FileUpload
        fields = ["id", "title", "url"]
    
    def get_title(self, obj):
        # Extract the file name from the file path
        return obj.file.name.split('/')[-1]
    
    def get_url(self, obj):
        request = self.context.get('request')
        if request is not None:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(
        source="sender.get_full_name", read_only=True
    )  # Display sender's full name
    sender_id = serializers.IntegerField(
        source="sender.id", read_only=True
    )  # Explicitly include sender ID
    receiver = serializers.CharField(
        source="receiver.get_full_name", read_only=True
    )  # Display receiver's full name
    receiver_id = serializers.IntegerField(
        source="receiver.id", read_only=True
    )  # Explicitly include receiver ID
    files = FileUploadSerializer(
        many=True, read_only=True
    )  # Nested serializer for files

    class Meta:
        model = ChatMessage
        fields = [
            "id",
            "sender",
            "sender_id",
            "receiver",
            "receiver_id",
            "content",
            "timestamp",
            "files",
            "is_read",
        ]
        read_only_fields = ["id", "timestamp"]
