import json
import tempfile
from datetime import datetime
from channels.testing import WebsocketCommunicator
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken
from channels.layers import get_channel_layer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from channels.testing import WebsocketCommunicator
from .consumers import ChatConsumer
from .models import ChatMessage
from .serializers import ChatMessageSerializer
from .services import notify_new_message

User = get_user_model()


class ChatMessageAPITestCase(APITestCase):
    """Test cases for chat message HTTP API endpoints"""

    def setUp(self):
        # Create test users
        self.user1 = User.objects.create_user(username="user1", password="pass1")
        self.user2 = User.objects.create_user(username="user2", password="pass2")

        # Create some test messages
        self.message1 = ChatMessage.objects.create(
            sender=self.user1, receiver=self.user2, content="Hello from user1"
        )
        self.message2 = ChatMessage.objects.create(
            sender=self.user2, receiver=self.user1, content="Hi user1!"
        )

        # Authenticate user1
        self.client.force_authenticate(user=self.user1)

    def test_list_chat_sessions(self):
        """Test getting all chat sessions for current user"""
        response = self.client.get("/api/chat/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            len(response.data), 1
        )  # Should have one chat session with user2

    def test_get_chat_history(self):
        """Test getting chat history with specific user"""
        response = self.client.get(f"/api/chat/{self.user2.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)  # Should have two messages

    def test_send_text_message(self):
        """Test sending a text message"""
        data = {"receiver": self.user2.id, "content": "Test message"}
        response = self.client.post("/api/chat/", data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["content"], "Test message")

    def test_send_file_message(self):
        """Test sending a message with file attachment"""
        with tempfile.NamedTemporaryFile(suffix=".txt") as temp_file:
            temp_file.write(b"Test file content")
            temp_file.seek(0)

            data = {
                "receiver": self.user2.id,
                "content": "File message",
                "file": temp_file,
            }
            response = self.client.post("/api/chat/", data, format="multipart")
            self.assertEqual(response.status_code, 201)
            self.assertIsNotNone(response.data["file"])

    def test_mark_messages_read(self):
        """Test marking messages as read"""
        data = {"chat_id": self.user2.id}
        response = self.client.post("/api/chat/mark_chat_read/", data)
        self.assertEqual(response.status_code, 200)

    def test_invalid_receiver(self):
        """Test sending message to invalid receiver"""
        data = {"receiver": 999, "content": "Test message"}  # Non-existent user ID
        response = self.client.post("/api/chat/", data)
        self.assertEqual(response.status_code, 404)


class ChatConsumerTestCase(TransactionTestCase):
    """Test cases for WebSocket chat consumer"""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Initialize channel layer
        cls.channel_layer = get_channel_layer()

    def setUp(self):
        """Synchronous setup - create basic test data"""
        super().setUp()
        # Create test users
        self.user1 = User.objects.create_user(username="user1", password="pass1")
        self.user2 = User.objects.create_user(username="user2", password="pass2")

        # Generate JWT token for user1
        self.token = str(AccessToken.for_user(self.user1))

    async def test_connect_with_valid_token(self):
        """Test WebSocket connection with valid JWT token"""
        communicator = WebsocketCommunicator(
            ChatConsumer.as_asgi(), f"/ws/chat/?token={self.token}"
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()

    async def test_connect_without_token(self):
        """Test WebSocket connection without token"""
        communicator = WebsocketCommunicator(ChatConsumer.as_asgi(), "/ws/chat/")
        connected, _ = await communicator.connect()
        self.assertFalse(connected)

    async def test_chat_message_notification(self):
        """Test receiving chat message notification"""
        # Connect to WebSocket
        communicator = WebsocketCommunicator(
            ChatConsumer.as_asgi(), f"/ws/chat/?token={self.token}"
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Simulate sending message notification through channel layer
        message_data = {
            "id": 1,
            "sender_id": self.user2.id,
            "sender_name": "user2",
            "content": "Test notification",
            "timestamp": datetime.now().isoformat(),
        }
        await self.channel_layer.group_send(
            f"user_{self.user1.id}_chat",
            {"type": "chat_message_notification", "message": message_data},
        )

        # Verify notification received
        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "chat_message")
        self.assertEqual(response["message"]["content"], "Test notification")

        await communicator.disconnect()


class ChatServicesTestCase(TransactionTestCase):
    """Test cases for chat service functions"""

    async def asyncSetUp(self):
        # Create test users
        self.user1 = await database_sync_to_async(User.objects.create_user)(
            username="user1",
            password="pass1",
            first_name="First",
            last_name="User"
        )
        self.user2 = await database_sync_to_async(User.objects.create_user)(
            username="user2",
            password="pass2"
        )
        self.channel_layer = get_channel_layer()

    async def test_notify_new_message_with_content(self):
        """Test notification with specific content"""
        await self.asyncSetUp()
        test_content = "Test message content"
        group_name = f"user_{self.user2.id}_chat"
        channel_name = "test_channel"

        # Subscribe to the group
        await self.channel_layer.group_add(group_name, channel_name)

        # Send notification
        await database_sync_to_async(notify_new_message)(self.user1, self.user2, test_content)

        # Get the message from the channel layer
        message = await self.channel_layer.receive(channel_name)
        self.assertEqual(message["type"], "notification_message")
        self.assertEqual(message["message"]["type"], "new_message")
        self.assertEqual(message["message"]["content"], test_content)
        self.assertEqual(message["message"]["sender_id"], self.user1.id)
        self.assertEqual(message["message"]["sender_name"], "First User")

        # Cleanup
        await self.channel_layer.group_discard(group_name, channel_name)

    async def test_notify_new_message_without_content(self):
        """Test notification with default content"""
        await self.asyncSetUp()
        group_name = f"user_{self.user2.id}_chat"
        channel_name = "test_channel"

        # Subscribe to the group
        await self.channel_layer.group_add(group_name, channel_name)

        # Send notification
        await database_sync_to_async(notify_new_message)(self.user1, self.user2)

        # Get the message from the channel layer
        message = await self.channel_layer.receive(channel_name)
        self.assertEqual(message["type"], "notification_message")
        self.assertEqual(message["message"]["type"], "new_message")
        self.assertEqual(
            message["message"]["content"],
            "You received a new message from First User"
        )

        # Cleanup
        await self.channel_layer.group_discard(group_name, channel_name)

    async def test_notify_new_message_with_username_fallback(self):
        """Test notification uses username when full name not available"""
        await self.asyncSetUp()
        group_name = f"user_{self.user1.id}_chat"
        channel_name = "test_channel"

        # Subscribe to the group
        await self.channel_layer.group_add(group_name, channel_name)

        # Send notification
        await database_sync_to_async(notify_new_message)(self.user2, self.user1)

        # Get the message from the channel layer
        message = await self.channel_layer.receive(channel_name)
        self.assertEqual(message["message"]["sender_name"], "user2")
        self.assertEqual(
            message["message"]["content"],
            "You received a new message from user2"
        )

        # Cleanup
        await self.channel_layer.group_discard(group_name, channel_name)
