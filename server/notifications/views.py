from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling notifications
    Provides GET (list), POST (mark all read), and PATCH (mark single read) endpoints
    """

    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    http_method_names = ["get", "post", "patch"]

    def get_queryset(self):
        """Get unread notifications for the authenticated user"""
        return (
            Notification.objects.filter(recipient=self.request.user)
            .filter(is_read=False)
            .order_by("-created_at")
        )

    def list(self, request):
        """GET: List all unread notifications for the authenticated user"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="mark_all_read")
    def mark_all_read(self, request):
        """POST: Mark all notifications as read"""
        queryset = self.get_queryset()
        queryset.update(is_read=True)
        return Response({"status": "success"}, status=status.HTTP_200_OK)

    def partial_update(self, request, pk=None):
        """PATCH: Mark a specific notification as read"""
        try:
            notification = self.get_queryset().get(id=pk)
            notification.is_read = True
            notification.save()
            return Response({"status": "success"}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND
            )
