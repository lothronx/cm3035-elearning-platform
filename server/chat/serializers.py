from rest_framework import serializers
from django.urls import reverse
from .models import ChatMessage


class ChatFileSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    type = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()

    def get_type(self, obj):
        if obj.file:
            return obj.file.name.split('.')[-1].lower()
        return None

    def get_title(self, obj):
        if obj.file:
            return obj.file.name.split('/')[-1]
        return None

    def get_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None


class ChatMessageSerializer(serializers.ModelSerializer):
    isSender = serializers.SerializerMethodField()
    file = ChatFileSerializer(source='*', read_only=True)

    def get_isSender(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.sender == request.user
        return False

    def validate(self, data):
        if not data.get('content') and not self.context['request'].FILES.get('file'):
            raise serializers.ValidationError("Either content or file must be provided")
        return data

    class Meta:
        model = ChatMessage
        fields = ['id', 'isSender', 'content', 'timestamp', 'file']
        read_only_fields = ['id', 'timestamp']
