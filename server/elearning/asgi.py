"""
ASGI config for elearning project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
import django

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "elearning.settings")
django.setup()

from notifications.routing import websocket_urlpatterns as notification_websocket_urlpatterns
from chat.routing import websocket_urlpatterns as chat_websocket_urlpatterns

# Initialize Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "elearning.settings")
django.setup()

# Combine WebSocket URL patterns from different apps
websocket_urlpatterns = notification_websocket_urlpatterns + chat_websocket_urlpatterns

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# Main ASGI Application Configuration
application = ProtocolTypeRouter(
    """
    Protocol type router that handles both HTTP and WebSocket connections
    """
    {
        # HTTP protocol handler
        "http": django_asgi_app,
        
        # WebSocket protocol handler with combined URL patterns
        "websocket": URLRouter(websocket_urlpatterns),
    }
)
