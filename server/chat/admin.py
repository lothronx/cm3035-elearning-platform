from django.contrib import admin
from .models import ChatMessage


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("sender", "receiver", "content", "file", "is_read", "timestamp")
    list_filter = ("sender", "receiver", "timestamp")
    search_fields = ("sender__username", "receiver__username", "content")
    ordering = ("-timestamp",)
