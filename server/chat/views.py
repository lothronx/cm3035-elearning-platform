from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import ChatMessage, FileUpload
from .serializers import ChatMessageSerializer, FileUploadSerializer


class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Automatically set the sender as the logged-in user
        serializer.save(sender=self.request.user)


class FileUploadViewSet(viewsets.ModelViewSet):
    queryset = FileUpload.objects.all()
    serializer_class = FileUploadSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Automatically set the chat message as the logged-in user
        serializer.save(chat_message=self.request.user)
