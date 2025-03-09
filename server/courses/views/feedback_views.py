from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers

from courses.models import Feedback
from courses.serializers import FeedbackSerializer
from api.permissions import (
    IsCourseTeacherOrEnrolledStudent,
    IsEnrolledStudent,
    IsOwner,
)


class FeedbackViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing course feedback.

    Supports CRUD operations for course feedback with:
    - List/Retrieve: Accessible to course teachers and enrolled students
    - Create: Only for enrolled students
    - Delete: Only for feedback owners
    """

    permission_classes = [IsAuthenticated]
    serializer_class = FeedbackSerializer

    def get_queryset(self):
        """
        Return feedback for the specified course.

        Returns:
            QuerySet: Filtered feedback ordered by creation date (newest first)
        """
        course_pk = self.kwargs.get("course_pk")
        return Feedback.objects.filter(course_id=course_pk).order_by("-created_at")

    def get_permissions(self):
        """
        Set permissions based on action type.

        Returns:
            list: Appropriate permission classes for the current action
        """
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [IsAuthenticated, IsCourseTeacherOrEnrolledStudent]
        elif self.action == "create":
            self.permission_classes = [IsAuthenticated, IsEnrolledStudent]
        else:
            self.permission_classes = [IsAuthenticated, IsOwner]

        return super().get_permissions()

    def perform_create(self, serializer):
        """
        Create new feedback associated with current user and course.

        Args:
            serializer (FeedbackSerializer): Validated serializer instance
        """
        comment = serializer.validated_data.get('comment', '')
        if len(comment) > 1000:
            raise serializers.ValidationError({'comment': 'Ensure this field has no more than 1000 characters.'})
        course_pk = self.kwargs.get("course_pk")
        serializer.save(student=self.request.user, course_id=course_pk)
