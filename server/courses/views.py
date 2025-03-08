# pylint: disable=E1101
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from courses.models import Course, CourseMaterial
from courses.serializers import (
    CourseSerializer,
    CourseListSerializer,
    CourseDetailSerializer,
    CourseMaterialSerializer,
)
from api.permissions import IsTeacher, IsCourseTeacher, IsCourseTeacherOrEnrolledStudent


class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing courses with different permission levels based on user roles:
    - GET /courses/: All authenticated users can view active courses
    - POST /courses/: Only teachers can create courses
    - GET /courses/{id}/: All authenticated users can view active courses, only course teachers can view inactive
    - PATCH /courses/{id}/: Only the course teacher can update
    - PATCH /courses/{id}/toggle_activation/: Only the course teacher can toggle activation
    """

    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return appropriate queryset based on user role and request method:
        - For teachers: include their own courses (active and inactive)
        - For students/other users: include only active courses
        - Exclude superusers and staff users from results
        """
        user = self.request.user

        # Base queryset excluding admin users
        base_queryset = Course.objects.exclude(
            Q(teacher__is_superuser=True) | Q(teacher__is_staff=True)
        ).order_by("-updated_at")

        # For list view, show different courses based on role
        if self.action == "list":
            if user.role == "teacher":
                # Teachers see all active courses plus their own courses (active or not)
                return base_queryset.filter(
                    Q(is_active=True) | Q(teacher=user)
                ).distinct()
            else:
                # Students and others see only active courses
                return base_queryset.filter(is_active=True)

        # For retrieve/update, handle permissions in get_object
        return base_queryset

    def get_object(self):
        """
        Override get_object to enforce permissions:
        - Teachers can access their own courses (active or inactive)
        - Other users can only access active courses
        """
        obj = super().get_object()
        user = self.request.user

        # Only course teacher can access inactive courses
        if not obj.is_active and (user.role != "teacher" or obj.teacher != user):
            self.permission_denied(
                self.request,
                message="You do not have permission to access this inactive course.",
            )

        self.check_object_permissions(self.request, obj)
        return obj

    def get_serializer_class(self):
        """Return appropriate serializer based on the request method and action"""
        if self.action == "list":
            return CourseListSerializer
        elif self.action == "retrieve":
            return CourseDetailSerializer
        return CourseSerializer

    def get_permissions(self):
        """
        Set permissions based on action:
        - list, retrieve: IsAuthenticated
        - create: IsAuthenticated & IsTeacher
        - update, partial_update, destroy: IsAuthenticated & IsCourseTeacher
        """
        if self.action == "create":
            self.permission_classes = [IsAuthenticated, IsTeacher]
        elif self.action in ["update", "partial_update", "destroy"]:
            self.permission_classes = [IsAuthenticated, IsCourseTeacher]
        else:
            self.permission_classes = [IsAuthenticated]

        return super().get_permissions()

    def perform_create(self, serializer):
        """Assign the current user as the teacher when creating a course"""
        serializer.save(teacher=self.request.user)

    def partial_update(self, request, *args, **kwargs):
        """
        Handle PATCH requests to update course details (title, description).
        Only the course teacher can perform this action.
        """
        course = self.get_object()
        serializer = self.get_serializer(course, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Use CourseDetailSerializer to include all necessary fields for frontend
        detail_serializer = CourseDetailSerializer(course, context={"request": request})

        # Return the updated course data
        return Response(detail_serializer.data, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["patch"],
        permission_classes=[IsAuthenticated, IsCourseTeacher],
    )
    def toggle_activation(self, request, pk=None):
        """Toggle the activation status of a course. Only the course teacher can perform this action."""
        course = self.get_object()

        course.is_active = not course.is_active
        course.save()

        return Response(
            {
                "status": "success",
                "is_active": course.is_active,
                "message": f'Course {"activated" if course.is_active else "deactivated"} successfully',
            },
            status=status.HTTP_200_OK,
        )


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
            self.permission_classes = [
                IsAuthenticated,
                IsCourseTeacherOrEnrolledStudent,
            ]
        else:  # create, update, partial_update, destroy
            self.permission_classes = [IsAuthenticated, IsCourseTeacher]

        return super().get_permissions()

    def perform_create(self, serializer):
        """
        Associate the material with the specified course when creating.
        Also updates the course's updated_at timestamp.
        """
        course_pk = self.kwargs.get("course_pk")
        course = Course.objects.get(pk=course_pk)

        # Check if the user has permission to add materials to this course
        self.check_object_permissions(self.request, course)

        # Save the material
        serializer.save(course=course, is_active=True)

        # Update the course's updated_at timestamp
        from django.utils import timezone

        course.updated_at = timezone.now()
        course.save(update_fields=["updated_at"])

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete the material by setting is_active=False instead of removing from database.
        """
        material = self.get_object()
        # Check if the user has permission to delete this material
        self.check_object_permissions(request, material)

        # Soft delete by setting is_active to False
        material.is_active = False
        material.save()

        return Response(
            {"message": "Material successfully removed"},
            status=status.HTTP_204_NO_CONTENT,
        )

    def list(self, request, *args, **kwargs):
        """
        List course materials with permission check on the course.
        """
        course_pk = self.kwargs.get("course_pk")
        course = Course.objects.get(pk=course_pk)

        # Check if the user has permission to access this course's materials
        self.check_object_permissions(request, course)

        return super().list(request, *args, **kwargs)
