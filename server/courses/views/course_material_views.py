from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from courses.models import CourseMaterial
from courses.serializers import CourseMaterialSerializer
from api.permissions import IsCourseTeacher, IsCourseTeacherOrEnrolledStudent
from notifications.services import create_course_material_notification


class CourseMaterialViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing course materials.

    Supports CRUD operations for course materials within a specific course.
    Uses nested routing: /courses/{course_pk}/materials/

    Permissions:
    - List/Retrieve: Authenticated users who are either teachers or enrolled students
    - Create/Update/Delete: Authenticated teachers only
    """

    serializer_class = CourseMaterialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return only active course materials for the specified course.

        Returns:
            QuerySet: Filtered materials ordered by upload date (newest first)
        """
        course_pk = self.kwargs.get("course_pk")
        return CourseMaterial.objects.filter(
            course_id=course_pk, is_active=True, course__is_active=True
        ).order_by("-uploaded_at")

    def get_permissions(self):
        """
        Set permissions based on action type.

        Returns:
            list: Appropriate permission classes for the current action
        """
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [
                IsAuthenticated,
                IsCourseTeacherOrEnrolledStudent,
            ]
        else:
            self.permission_classes = [IsAuthenticated, IsCourseTeacher]

        return super().get_permissions()

    def perform_destroy(self, instance):
        """
        Perform soft deletion by setting is_active to False.

        Args:
            instance (CourseMaterial): The material to be soft deleted
        """
        instance.is_active = False
        instance.save()

    def destroy(self, request, *args, **kwargs):
        """
        Override destroy to return success message after soft deletion.

        Returns:
            Response: JSON response with success status and message
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"status": "success", "message": "Material deleted successfully"},
            status=status.HTTP_200_OK,
        )

    def perform_create(self, serializer):
        """
        Create new course material with course_id from URL parameters.

        Args:
            serializer (CourseMaterialSerializer): Validated serializer instance

        Returns:
            CourseMaterial: The newly created material instance
        """
        course_pk = self.kwargs.get("course_pk")
        return serializer.save(course_id=course_pk, is_active=True)

    def create(self, request, *args, **kwargs):
        """
        Handle material creation and send notification.

        Returns:
            Response: JSON response with success status and message
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        material = self.perform_create(serializer)

        # Send notification to course participants
        create_course_material_notification(material.course)
        return Response(
            {"status": "success", "message": "Material uploaded successfully"},
            status=status.HTTP_201_CREATED,
        )
