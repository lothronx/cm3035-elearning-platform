from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from courses.models import Feedback
from courses.serializers import FeedbackSerializer
from api.permissions import (
    IsCourseTeacherOrEnrolledStudent,
    IsEnrolledStudent,
    IsOwner,
)


class FeedbackViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing course feedback with different permission levels:
    - GET /courses/{course_id}/feedback/: Course teacher and enrolled students can view feedback
    - POST /courses/{course_id}/feedback/: Only enrolled students can post feedback
    - DELETE /courses/{course_id}/feedback/{id}/: Only the feedback owner can delete
    """

    permission_classes = [IsAuthenticated]
    serializer_class = FeedbackSerializer

    def get_queryset(self):
        """Return feedback for the specified course"""
        course_pk = self.kwargs.get("course_pk")
        return Feedback.objects.filter(course_id=course_pk).order_by("-created_at")

    def get_permissions(self):
        """
        Set permissions based on action:
        - list, retrieve: IsAuthenticated & IsCourseTeacherOrEnrolledStudent
        - create: IsAuthenticated & IsEnrolledStudent
        - destroy: IsAuthenticated & IsOwner
        """
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [IsAuthenticated, IsCourseTeacherOrEnrolledStudent]
        elif self.action == "create":
            self.permission_classes = [IsAuthenticated, IsEnrolledStudent]
        else:
            self.permission_classes = [IsAuthenticated, IsOwner]

        return super().get_permissions()

    def perform_create(self, serializer):
        """Associate the feedback with the current user and course"""
        course_pk = self.kwargs.get("course_pk")
        serializer.save(student=self.request.user, course_id=course_pk)
