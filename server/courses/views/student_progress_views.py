from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from courses.models import Enrollment
from courses.serializers import EnrollmentSerializer
from api.permissions import IsEnrolledStudent


class StudentCourseProgressViewSet(viewsets.ViewSet):
    """
    ViewSet for enrolled students to manage their course progress:
    - PATCH /courses/{course_id}/progress/: Toggle course completion status
    """

    permission_classes = [IsAuthenticated, IsEnrolledStudent]
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        """Return enrollments for the current student and specified course"""
        course_pk = self.kwargs.get("course_pk")
        return Enrollment.objects.filter(
            course_id=course_pk, student=self.request.user
        )

    @action(detail=False, methods=["patch"])
    def toggle_completion(self, request, course_pk=None):
        """Toggle the completion status of a course for the enrolled student"""
        try:
            enrollment = Enrollment.objects.get(
                course_id=course_pk, student=request.user
            )

            enrollment.is_completed = not enrollment.is_completed
            enrollment.save()

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
