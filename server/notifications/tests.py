"""
Notification Tests
=================

This module contains comprehensive tests for the notification system,
including models, views, services, and WebSocket consumers.
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from channels.testing import WebsocketCommunicator
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken
from courses.models import Course, Enrollment
from .models import Notification
from .consumers import NotificationConsumer
from .services import (
    create_notification,
    create_course_enrollment_notification,
    create_course_unenrollment_notification,
    create_course_material_notification,
)
from asgiref.sync import sync_to_async

User = get_user_model()


class NotificationModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )

    def test_notification_creation(self):
        """Test basic notification creation."""
        notification = Notification.objects.create(
            recipient=self.user, message="Test notification"
        )
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.message, "Test notification")
        self.assertFalse(notification.is_read)
        self.assertIsNotNone(notification.created_at)

    def test_notification_str_representation(self):
        """Test the string representation of a notification."""
        notification = Notification.objects.create(
            recipient=self.user, message="Test notification"
        )
        expected_str = f"Notification for {self.user.username}: Test notification..."
        self.assertEqual(str(notification), expected_str)


class NotificationServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.teacher = User.objects.create_user(
            username="teacher", password="testpass123"
        )
        self.course = Course.objects.create(
            title="Test Course",
            description="Test Description",
            teacher=self.teacher,
        )
        self.enrollment = Enrollment.objects.create(
            course=self.course, student=self.user
        )

    def test_create_notification(self):
        """Test basic notification creation through service."""
        notification = create_notification(self.user, "Test message")
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.message, "Test message")

    def test_create_course_enrollment_notification(self):
        """Test enrollment notification creation."""
        notification = create_course_enrollment_notification(self.enrollment)
        self.assertEqual(notification.recipient, self.teacher)
        self.assertIn(self.user.username, notification.message)
        self.assertIn(self.course.title, notification.message)

    def test_create_course_unenrollment_notification(self):
        """Test unenrollment notification creation."""
        notification = create_course_unenrollment_notification(self.course, self.user)
        self.assertEqual(notification.recipient, self.teacher)
        self.assertIn(self.user.username, notification.message)
        self.assertIn(self.course.title, notification.message)

    def test_create_course_material_notification(self):
        """Test course material notification creation."""
        notifications = create_course_material_notification(self.course)
        self.assertEqual(len(notifications), 1)
        self.assertEqual(notifications[0].recipient, self.user)
        self.assertIn(self.course.title, notifications[0].message)


class NotificationViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.token = str(AccessToken.for_user(self.user))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.notification = Notification.objects.create(
            recipient=self.user, message="Test notification"
        )

    def test_list_notifications(self):
        """Test listing notifications."""
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)



@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
)
class NotificationConsumerTests(TestCase):
    @sync_to_async
    def create_test_user(self):
        return User.objects.create_user(username="testuser", password="testpass123")

    async def test_consumer_connection(self):
        """Test WebSocket connection and authentication."""
        user = await self.create_test_user()
        token = str(AccessToken.for_user(user))

        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(), f"/ws/notifications/?token={token}"
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Test receiving a notification
        await communicator.send_json_to({"type": "test.message"})
        response = await communicator.receive_json_from()
        self.assertIn("type", response)

        await communicator.disconnect()
