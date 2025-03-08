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
        - Exclude superusers and staff users from results
        """
        # Base queryset excluding admin users
        base_queryset = Course.objects.exclude(
            Q(teacher__is_superuser=True) | Q(teacher__is_staff=True)
        ).order_by("-updated_at")

        # For list view, show only active courses
        if self.action == "list":
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

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def search(self, request):
        

        query = request.query_params.get("q", "")
        if not query:
            return Response(
                {"error": "Search query is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = (
            Course.objects.filter(Q(title__icontains=query))
            .filter(Q(is_active=True) | Q(teacher=request.user))
            .distinct()
            .order_by("-updated_at")
        )

        # Return only specified fields
        course_data = []
        for course in queryset:
            course_data.append(
                {
                    "id": course.id,
                    "title": course.title,
                    "description": course.description,
                    "is_active": course.is_active,
                }
            )
        return Response(course_data)
