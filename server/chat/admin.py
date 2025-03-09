from django.contrib import admin
from .models import ChatMessage, FileUpload


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("sender", "receiver", "content", "timestamp")
    list_filter = ("sender", "receiver", "timestamp")
    search_fields = ("sender__username", "receiver__username", "content")
    ordering = ("-timestamp",)


@admin.register(FileUpload)
class FileUploadAdmin(admin.ModelAdmin):
    list_display = ("chat_message", "file", "uploaded_at")
    search_fields = (
        "chat_message__sender__username",
        "chat_message__receiver__username",
    )
    ordering = ("-uploaded_at",)
