from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from courses.models import Course
from courses.serializers import (
    CourseSerializer,
    CourseListSerializer,
    CourseDetailSerializer,
)
from api.permissions import IsTeacher, IsCourseTeacher


class CourseViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing courses.

    Supports CRUD operations for courses with additional custom actions:
    - toggle_activation: Activate/deactivate a course
    - search: Search for courses by title

    Permissions:
    - List/Retrieve: Authenticated users
    - Create: Authenticated teachers
    - Update/Delete: Authenticated course teachers
    """

    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return appropriate queryset based on user role and request method.

        Returns:
            QuerySet: Filtered courses excluding admin users
        """
        # Base queryset excluding admin users
        base_queryset = Course.objects.exclude(
            Q(teacher__is_superuser=True) | Q(teacher__is_staff=True)
        ).order_by("-updated_at")

        # For list view, show only active courses
        if self.action == "list":
            return base_queryset.filter(is_active=True)

        return base_queryset

    def get_object(self):
        """
        Override get_object to enforce permissions.

        Returns:
            Course: The requested course object

        Raises:
            PermissionDenied: If user tries to access inactive course they don't teach
        """
        obj = super().get_object()
        user = self.request.user

        # Only course teacher can access inactive courses
        if not obj.is_active and obj.teacher != user:
            self.permission_denied(
                self.request,
                message="You do not have permission to access this inactive course.",
            )

        self.check_object_permissions(self.request, obj)
        return obj

    def get_serializer_class(self):
        """
        Return appropriate serializer based on the request method and action.

        Returns:
            Serializer: The appropriate serializer class
        """
        if self.action == "list":
            return CourseListSerializer
        elif self.action == "retrieve":
            return CourseDetailSerializer
        return CourseSerializer

    def get_permissions(self):
        """
        Set permissions based on action type.

        Returns:
            list: Appropriate permission classes for the current action
        """
        if self.action == "create":
            self.permission_classes = [IsAuthenticated, IsTeacher]
        elif self.action in ["update", "partial_update", "destroy"]:
            self.permission_classes = [IsAuthenticated, IsCourseTeacher]
        else:
            self.permission_classes = [IsAuthenticated]

        return super().get_permissions()

    def perform_create(self, serializer):
        """
        Create new course with current user as teacher.

        Args:
            serializer (CourseSerializer): Validated serializer instance
        """
        serializer.save(teacher=self.request.user)

    def partial_update(self, request, *args, **kwargs):
        """
        Handle PATCH requests to update course details.

        Returns:
            Response: Updated course data with detailed serializer
        """
        course = self.get_object()

        serializer = self.get_serializer(course, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Use CourseDetailSerializer to include all necessary fields for frontend
        detail_serializer = CourseDetailSerializer(course, context={"request": request})

        return Response(detail_serializer.data, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["patch"],
        permission_classes=[IsAuthenticated, IsCourseTeacher],
    )
    def toggle_activation(self, request, pk=None):
        """
        Toggle the activation status of a course.

        Returns:
            Response: JSON response with new activation status
        """
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

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def search(self, request):
        """
        Search for courses by title.

        Returns:
            Response: List of matching courses with limited fields
        """
        query = request.query_params.get("q", "")
        if not query:
            return Response(
                {"error": "Search query is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Search for courses matching query, including inactive courses for teachers
        queryset = (
            Course.objects.filter(Q(title__icontains=query))
            .filter(Q(is_active=True) | Q(teacher=request.user))
            .distinct()
            .order_by("-updated_at")
        )

        # Return only specified fields
        course_data = [
            {
                "id": course.id,
                "title": course.title,
                "description": course.description,
                "is_active": course.is_active,
            }
            for course in queryset
        ]
        return Response(course_data)
