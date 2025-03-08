# pylint: disable=E1101
from django.utils import timezone
from rest_framework import viewsets, status, mixins
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from courses.models import Course, Enrollment
from courses.serializers import (
    CourseSerializer,
    CourseListSerializer,
    CourseDetailSerializer,
)
from api.permissions import IsTeacher, IsCourseTeacher


class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing courses with different permission levels based on user roles:
    - GET /courses/: All authenticated users can view active courses
    - POST /courses/: Only teachers can create courses
    - GET /courses/{id}/: All authenticated users can view active courses, only course teachers can view inactive
    - PATCH /courses/{id}/: Only the course teacher can update
    - DELETE /courses/{id}/: Only the course teacher can set is_active to False
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
        )

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

        # For retrieve/update/destroy, handle permissions in get_object
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

    def perform_update(self, serializer):
        """Update the course"""
        serializer.save()

    def perform_destroy(self, instance):
        """Soft delete by setting is_active to False instead of actual deletion"""
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
