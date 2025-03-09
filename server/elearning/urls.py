"""
Main URL Configuration for the eLearning Platform

This file defines the root URL patterns for the Django project,
including authentication endpoints, API routes, and admin interface.
"""

# Django Core Imports
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# JWT Authentication Views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    # Collection of all URL patterns for the eLearning platform
    # Admin Interface
    path("admin/", admin.site.urls),

    # Authentication Endpoints
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/verify/", TokenVerifyView.as_view(), name="token_verify"),

    # API Routes
    path("api/", include("api.api")),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
