"""
Notification Views
=================

This module contains views for handling notifications in the e-learning platform,
including listing, marking as read, and other notification-related operations.
"""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling notifications.

    Provides endpoints for:
    - Listing unread notifications
    - Marking all notifications as read
    - Marking a single notification as read
    """

    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    http_method_names = ["get", "post", "patch"]

    def get_queryset(self):
        """
        Get the queryset of notifications for the authenticated user.

        Returns:
            QuerySet: Notifications for the current user, ordered by creation date
        """
        return Notification.objects.filter(recipient=self.request.user).order_by(
            "-created_at"
        )

    def list(self, request: Request) -> Response:
        """
        List all unread notifications for the authenticated user.

        Args:
            request: The incoming HTTP request

        Returns:
            Response: Serialized notification data
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="mark_all_read")
    def mark_all_read(self, request: Request) -> Response:
        """
        Mark all unread notifications as read.

        Args:
            request: The incoming HTTP request

        Returns:
            Response: Success status
        """
        queryset = self.get_queryset()
        queryset.update(is_read=True)
        return Response({"status": "success"}, status=status.HTTP_200_OK)

    def partial_update(self, request: Request, pk: str = None) -> Response:
        """
        Mark a specific notification as read.

        Args:
            request: The incoming HTTP request
            pk: Primary key of the notification to update

        Returns:
            Response: Success status or error message
        """
        try:
            notification = self.get_queryset().get(id=pk)
            notification.is_read = True
            notification.save()
            return Response({"status": "success"}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND
            )
