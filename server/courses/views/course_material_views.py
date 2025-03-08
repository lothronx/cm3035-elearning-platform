from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from courses.models import CourseMaterial
from courses.serializers import CourseMaterialSerializer
from api.permissions import IsCourseTeacher, IsCourseTeacherOrEnrolledStudent


class CourseMaterialViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing course materials with different permission levels:
    - GET /courses/{course_id}/materials/: Course teacher and enrolled students can view active materials
    - POST /courses/{course_id}/materials/: Only course teacher can upload materials
    - DELETE /courses/{course_id}/materials/{id}/: Only course teacher can soft-delete materials
    """

    serializer_class = CourseMaterialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return only active course materials for the specified course.
        """
        course_pk = self.kwargs.get("course_pk")
        # Only return active materials, ordered by upload date (newest first)
        return CourseMaterial.objects.filter(
            course_id=course_pk, is_active=True
        ).order_by("-uploaded_at")

    def get_permissions(self):
        """
        Set permissions based on action:
        - list, retrieve: IsAuthenticated & IsCourseTeacherOrEnrolledStudent
        - create: IsAuthenticated & IsCourseTeacher
        - update, partial_update, destroy: IsAuthenticated & IsCourseTeacher
        """
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [IsAuthenticated, IsCourseTeacherOrEnrolledStudent]
        else:
            self.permission_classes = [IsAuthenticated, IsCourseTeacher]

        return super().get_permissions()

    def perform_destroy(self, instance):
        """
        Soft delete by setting is_active to False instead of actual deletion
        """
        instance.is_active = False
        instance.save()

    def destroy(self, request, *args, **kwargs):
        """
        Override destroy to return a success message after soft deletion
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"status": "success", "message": "Material deleted successfully"},
            status=status.HTTP_200_OK,
        )
