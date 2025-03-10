from rest_framework import serializers
from django.urls import reverse
from .models import ChatMessage


class ChatFileSerializer(serializers.Serializer):
    """Serializer for chat message file attachments.
    
    This serializer handles the presentation of file attachments in chat messages,
    providing a consistent format for file metadata including type, title, and URL.
    
    Attributes:
        id (int): The ID of the chat message containing the file
        type (str): The file extension/type (e.g., 'pdf', 'jpg')
        title (str): The original filename
        url (str): The absolute URL to access the file
    """
    
    id = serializers.IntegerField()
    type = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()

    def get_type(self, obj):
        """Extract the file type from the filename."""
        if obj.file:
            return obj.file.name.split('.')[-1].lower()
        return None

    def get_title(self, obj):
        """Get the original filename without the path."""
        if obj.file:
            return obj.file.name.split('/')[-1]
        return None

    def get_url(self, obj):
        """Generate the absolute URL for the file.
        
        Uses the request context to build an absolute URI if available,
        otherwise falls back to the relative URL.
        """
        if obj.file:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages.
    
    This serializer handles both the serialization and validation of chat messages.
    It supports both text messages and file attachments, and includes helper fields
    like isSender to assist the frontend in message display.
    
    The serializer is used by both the REST API endpoints and WebSocket consumers
    to ensure consistent message formatting across all communication channels.
    
    Attributes:
        isSender (bool): Whether the current user is the sender of the message
        file (ChatFileSerializer): Nested serializer for file attachments
    """
    
    isSender = serializers.SerializerMethodField()
    file = ChatFileSerializer(source='*', read_only=True)

    def get_isSender(self, obj):
        """Determine if the current user is the sender of the message."""
        request = self.context.get('request')
        if request and request.user:
            return obj.sender == request.user
        return False

    def validate(self, data):
        """Validate that either message content or file is provided.
        
        This ensures that empty messages cannot be sent, requiring either
        text content or a file attachment.
        
        Args:
            data: The data to validate
            
        Returns:
            The validated data if valid
            
        Raises:
            ValidationError: If neither content nor file is provided
        """
        if not data.get('content') and not self.context['request'].FILES.get('file'):
            raise serializers.ValidationError("Either content or file must be provided")
        return data

    class Meta:
        model = ChatMessage
        fields = ['id', 'isSender', 'content', 'timestamp', 'file']
        read_only_fields = ['id', 'timestamp']
