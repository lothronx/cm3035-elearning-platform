"""
Notification Routing
====================

This module defines the WebSocket routing configuration for the NotificationConsumer.
"""

from django.urls import path
from notifications.consumers import NotificationConsumer

websocket_urlpatterns = [
    path("ws/notifications/", NotificationConsumer.as_asgi()),
]
