from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from courses.models import Enrollment
from courses.serializers import EnrollmentSerializer
from api.permissions import IsEnrolledStudent
from django.utils import timezone


class StudentCourseProgressViewSet(viewsets.ViewSet):
    """
    ViewSet for managing course progress for enrolled students.

    Provides endpoints for:
    - Toggling course completion status

    Requires authentication and enrollment verification.
    """

    permission_classes = [IsAuthenticated, IsEnrolledStudent]
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        """
        Get enrollments for the current student in the specified course.

        Returns:
            QuerySet: Filtered enrollments for the current student
                     and specified course
        """
        # Get course ID from URL parameters
        course_pk = self.kwargs.get("course_pk")
        # Filter enrollments for current user and course
        return Enrollment.objects.filter(course_id=course_pk, student=self.request.user)

    @action(detail=False, methods=["patch"])
    def toggle_completion(self, request, course_pk=None):
        """
        Toggle the completion status of a course for the enrolled student.

        Args:
            request: The HTTP request object
            course_pk: Primary key of the course to toggle completion for

        Returns:
            Response: HTTP response with updated enrollment status
                     or error message
        """
        try:
            # Retrieve the enrollment record
            enrollment = Enrollment.objects.get(
                course_id=course_pk, student=request.user
            )

            # Toggle completion status
            enrollment.is_completed = not enrollment.is_completed

            # Update completion timestamp
            if enrollment.is_completed:
                enrollment.completed_at = timezone.now()
            else:
                enrollment.completed_at = None

            # Save changes to database
            enrollment.save()

            # Serialize the updated enrollment
            serializer = self.serializer_class(enrollment)

            return Response(
                {
                    "status": "success",
                    "message": f'Course marked as {"completed" if enrollment.is_completed else "incomplete"}',
                    "enrollment": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        except Enrollment.DoesNotExist:
            return Response(
                {"error": "Not enrolled in this course"},
                status=status.HTTP_404_NOT_FOUND,
            )
