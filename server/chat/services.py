from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatSession, ChatMessage
import json

User = get_user_model()


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        await self.accept()
        await self.join_user_channel()

    async def disconnect(self, close_code):
        await self.leave_user_channel()

    async def receive_json(self, content):
        message_type = content.get("type")
        if message_type == "chat_message":
            await self.handle_chat_message(content)
        elif message_type == "read_messages":
            await self.handle_read_messages(content)

    async def chat_message(self, event):
        await self.send_json(event["message"])

    @database_sync_to_async
    def save_message(self, session_id, content):
        session = ChatSession.objects.get(id=session_id)
        message = ChatMessage.objects.create(
            session=session, sender=self.user, content=content
        )
        return {
            "id": message.id,
            "content": message.content,
            "sender_id": message.sender.id,
            "sender_name": message.sender.username,
            "created_at": message.created_at.isoformat(),
            "read": message.read,
        }

    @database_sync_to_async
    def get_or_create_session(self, other_user_id):
        other_user = User.objects.get(id=other_user_id)
        session = (
            ChatSession.objects.filter(participants=self.user)
            .filter(participants=other_user)
            .first()
        )
        if not session:
            session = ChatSession.objects.create()
            session.participants.add(self.user, other_user)
        return session.id

    async def join_user_channel(self):
        await self.channel_layer.group_add(f"user_{self.user.id}", self.channel_name)

    async def leave_user_channel(self):
        await self.channel_layer.group_discard(
            f"user_{self.user.id}", self.channel_name
        )

    async def handle_chat_message(self, content):
        other_user_id = content.get("recipient_id")
        message_content = content.get("content")

        session_id = await self.get_or_create_session(other_user_id)
        message_data = await self.save_message(session_id, message_content)

        message_event = {
            "type": "chat_message",
            "message": {
                "type": "new_message",
                "session_id": session_id,
                "message": message_data,
            },
        }

        # Send to recipient
        await self.channel_layer.group_send(f"user_{other_user_id}", message_event)

        # Send back to sender
        await self.send_json(message_event["message"])

    @database_sync_to_async
    def mark_messages_as_read(self, session_id):
        ChatMessage.objects.filter(session_id=session_id, read=False).exclude(
            sender=self.user
        ).update(read=True)

    async def handle_read_messages(self, content):
        session_id = content.get("session_id")
        await self.mark_messages_as_read(session_id)
