# pylint: disable=E1101
from rest_framework import viewsets, status, mixins
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from courses.models import Course, CourseMaterial, Feedback, Enrollment
from courses.serializers import (
    CourseSerializer,
    CourseListSerializer,
    CourseDetailSerializer,
    CourseMaterialSerializer,
    FeedbackSerializer,
    EnrollmentSerializer,
)
from api.permissions import (
    IsTeacher,
    IsCourseTeacher,
    IsEnrolledStudent,
    IsCourseTeacherOrEnrolledStudent,
    IsOwner,
    IsStudent,
)


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

    @action(detail=False, methods=["get"])
    def search(self, request):
        """Search for courses based on title or description"""
        query = request.query_params.get("q", "")
        if not query:
            return Response(
                {"error": "Search query is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Base queryset excluding admin users
        queryset = (
            Course.objects.exclude(
                Q(teacher__is_superuser=True) | Q(teacher__is_staff=True)
            )
            .filter(Q(title__icontains=query) | Q(description__icontains=query))
            .order_by("-updated_at")
        )

        # Filter based on user role and active status
        if request.user.role != "teacher":
            queryset = queryset.filter(is_active=True)
        else:
            queryset = queryset.filter(
                Q(is_active=True) | Q(teacher=request.user)
            ).distinct()

        serializer = CourseListSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response(serializer.data)


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


class FeedbackViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing course feedback with different permission levels:
    - GET /courses/{course_id}/feedback/: Course teacher and enrolled students can view feedback
    - POST /courses/{course_id}/feedback/: Only enrolled students can post feedback
    - DELETE /courses/{course_id}/feedback/{id}/: Only the feedback owner can delete
    """

    permission_classes = [IsAuthenticated]
    serializer_class = FeedbackSerializer

    def get_queryset(self):
        """Return feedback for the specified course"""
        course_pk = self.kwargs.get("course_pk")
        return Feedback.objects.filter(course_id=course_pk).order_by("-created_at")

    def get_permissions(self):
        """
        Set permissions based on action:
        - list, retrieve: IsAuthenticated & IsCourseTeacherOrEnrolledStudent
        - create: IsAuthenticated & IsEnrolledStudent
        - destroy: IsAuthenticated & IsOwner
        """
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [
                IsAuthenticated,
                IsCourseTeacherOrEnrolledStudent,
            ]
        elif self.action == "create":
            self.permission_classes = [IsAuthenticated, IsEnrolledStudent]
        elif self.action == "destroy":
            self.permission_classes = [IsAuthenticated, IsOwner]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Associate the feedback with the current user and course"""
        course_pk = self.kwargs.get("course_pk")
        course = Course.objects.get(pk=course_pk)
        serializer.save(student=self.request.user, course=course)


class EnrollmentViewSet(
    mixins.ListModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    """
    ViewSet for managing course enrollments with different permission levels:
    - GET /courses/{course_id}/enrollments/: Course teacher and enrolled students can view enrollments
    - DELETE /courses/{course_id}/enrollments/: Only course teacher can bulk delete enrollments
    """

    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "delete"]  # Only allow GET and DELETE methods

    def get_queryset(self):
        """Return enrollments for the specified course, excluding admin users"""
        course_pk = self.kwargs.get("course_pk")
        return (
            Enrollment.objects.filter(course_id=course_pk)
            .exclude(Q(student__is_superuser=True) | Q(student__is_staff=True))
            .select_related("student")
            .order_by("enrolled_at")
        )

    def get_permissions(self):
        """
        Set permissions based on action:
        - list, retrieve: IsAuthenticated & IsCourseTeacherOrEnrolledStudent
        - destroy: IsAuthenticated & IsCourseTeacher
        """
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [
                IsAuthenticated,
                IsCourseTeacherOrEnrolledStudent,
            ]
        else:  # destroy
            self.permission_classes = [IsAuthenticated, IsCourseTeacher]
        return super().get_permissions()

    def delete(self, request, *args, **kwargs):
        """Handle bulk deletion of enrollments"""
        course_pk = self.kwargs.get("course_pk")
        student_ids = request.data.get("student_ids", [])

        if not student_ids:
            return Response(
                {"error": "No student IDs provided for deletion"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the course and check permissions
        course = Course.objects.get(pk=course_pk)
        self.check_object_permissions(request, course)

        # Delete enrollments for the specified students, excluding admin users
        deleted_count = (
            Enrollment.objects.filter(course_id=course_pk, student_id__in=student_ids)
            .exclude(Q(student__is_superuser=True) | Q(student__is_staff=True))
            .delete()[0]
        )

        return Response(
            {
                "status": "success",
                "message": f"Successfully deleted {deleted_count} enrollment(s)",
                "deleted_count": deleted_count,
            },
            status=status.HTTP_200_OK,
        )

    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class StudentEnrollmentViewSet(viewsets.ViewSet):
    """
    ViewSet for students to manage their own course enrollments:
    - POST /courses/{course_id}/student-enrollment/: Student can enroll in a course
    - DELETE /courses/{course_id}/student-enrollment/: Student can unenroll from a course
    """

    permission_classes = [IsAuthenticated, IsStudent]

    def create(self, request, course_pk=None):
        """Handle enrollment creation"""
        try:
            # Check if course exists, is active, and not taught by admin
            course = Course.objects.exclude(
                Q(teacher__is_superuser=True) | Q(teacher__is_staff=True)
            ).get(pk=course_pk, is_active=True)
        except Course.DoesNotExist:
            return Response(
                {"detail": "Course not found or inactive"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if student is already enrolled
        if Enrollment.objects.filter(student=request.user, course=course).exists():
            return Response(
                {"detail": "Already enrolled in this course"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create enrollment
        enrollment = Enrollment.objects.create(
            student=request.user, course=course, is_completed=False
        )

        return Response(
            EnrollmentSerializer(enrollment).data, status=status.HTTP_201_CREATED
        )

    def delete(self, request, course_pk=None):
        """Handle unenrollment"""
        try:
            # Get enrollment excluding admin/superuser courses
            enrollment = (
                Enrollment.objects.filter(student=request.user, course_id=course_pk)
                .exclude(
                    Q(course__teacher__is_superuser=True)
                    | Q(course__teacher__is_staff=True)
                )
                .get()
            )

            enrollment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Enrollment.DoesNotExist:
            return Response(
                {"detail": "Not enrolled in this course"},
                status=status.HTTP_404_NOT_FOUND,
            )


class StudentCourseProgressViewSet(viewsets.GenericViewSet):
    """
    ViewSet for enrolled students to manage their course progress:
    - PATCH /courses/{course_id}/progress/: Toggle course completion status
    """

    permission_classes = [IsAuthenticated, IsEnrolledStudent]
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        """Return enrollments for the current student and specified course"""
        course_pk = self.kwargs.get("course_pk")
        return Enrollment.objects.filter(student=self.request.user, course_id=course_pk)

    @action(detail=False, methods=["patch"])
    def toggle_completion(self, request, course_pk=None):
        """Toggle the completion status of a course for the enrolled student"""
        try:
            enrollment = self.get_queryset().get()
        except Enrollment.DoesNotExist:
            return Response(
                {"detail": "Not enrolled in this course"},
                status=status.HTTP_404_NOT_FOUND,
            )

        enrollment.is_completed = not enrollment.is_completed
        enrollment.save()

        serializer = self.get_serializer(enrollment)
        return Response(serializer.data, status=status.HTTP_200_OK)
