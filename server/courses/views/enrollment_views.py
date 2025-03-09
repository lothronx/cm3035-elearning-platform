from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from courses.models import Enrollment
from courses.serializers import EnrollmentSerializer
from api.permissions import IsCourseTeacher, IsCourseTeacherOrEnrolledStudent


class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing course enrollments.

    Supports:
    - Viewing enrollments for a specific course
    - Bulk deletion of enrollments

    Permissions:
    - List/Retrieve: Authenticated users who are either teachers or enrolled students
    - Delete: Authenticated course teachers only
    """

    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "delete"]

    def get_queryset(self):
        """
        Return enrollments for the specified course.

        Returns:
            QuerySet: Filtered enrollments excluding admin users
        """
        course_pk = self.kwargs.get("course_pk")
        return Enrollment.objects.filter(course_id=course_pk).exclude(
            Q(student__is_superuser=True) | Q(student__is_staff=True)
        ).order_by("-enrolled_at")

    def get_permissions(self):
        """
        Set permissions based on action type.

        Returns:
            list: Appropriate permission classes for the current action
        """
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [IsAuthenticated, IsCourseTeacherOrEnrolledStudent]
        else:
            self.permission_classes = [IsAuthenticated, IsCourseTeacher]

        return super().get_permissions()

    def delete(self, request, *args, **kwargs):
        """
        Handle bulk deletion of enrollments.

        Args:
            request: The HTTP request containing student_ids in the body

        Returns:
            Response: JSON response with deletion status
        """
        course_pk = self.kwargs.get("course_pk")
        student_ids = request.data.get("student_ids", [])

        if not student_ids:
            return Response(
                {"error": "No student IDs provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Delete enrollments for the specified students in this course
        enrollments = Enrollment.objects.filter(
            course_id=course_pk, student_id__in=student_ids
        )
        deleted_count = enrollments.count()
        enrollments.delete()

        return Response(
            {
                "status": "success",
                "message": f"Successfully removed {deleted_count} student(s) from the course",
            },
            status=status.HTTP_200_OK,
        )

    def get_serializer_context(self):
        """
        Add request to serializer context.

        Returns:
            dict: Serializer context with request object
        """
        context = super().get_serializer_context()
        context["request"] = self.request
        return context
