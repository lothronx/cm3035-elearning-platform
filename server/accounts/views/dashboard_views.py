from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q

from courses.models import Course, Enrollment
from courses.serializers import CourseSerializer, EnrollmentSerializer


class DashboardViewSet(viewsets.ViewSet):
    """
    API endpoint that provides dashboard functionality for both teachers and students.

    Includes:
    - Course listings based on user role
    - Status updates
    - Profile photo updates
    """

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        Retrieve dashboard information for the authenticated user.

        Returns:
        - User details
        - List of courses (taught for teachers, enrolled for students)
        """
        user = request.user
        courses = self._get_user_courses(user)

        return Response(
            {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "username": user.username,
                "role": user.role,
                "photo": (
                    request.build_absolute_uri(user.photo.url) if user.photo else None
                ),
                "status": user.status,
                "courses": courses,
            },
            status=status.HTTP_200_OK,
        )

    def _get_user_courses(self, user):
        """
        Helper method to get courses based on user role.

        Args:
            user: The authenticated user object

        Returns:
            List of course dictionaries with id, name, and active status
        """
        if user.role == "teacher":
            return self._get_teacher_courses(user)
        return self._get_student_courses(user)

    def _get_teacher_courses(self, teacher):
        """
        Get courses taught by a teacher, excluding admin-taught courses.

        Args:
            teacher: The teacher user object

        Returns:
            List of course dictionaries
        """
        queryset = (
            Course.objects.filter(teacher=teacher)
            .exclude(Q(teacher__is_superuser=True) | Q(teacher__is_staff=True))
            .order_by("-is_active")
        )
        courses_taught = CourseSerializer(queryset, many=True).data
        return [
            {
                "id": course["id"],
                "name": course["title"],
                "is_active": course["is_active"],
            }
            for course in courses_taught
        ]

    def _get_student_courses(self, student):
        """
        Get courses enrolled by a student, excluding admin-taught courses.

        Args:
            student: The student user object

        Returns:
            List of course dictionaries
        """
        queryset = (
            Enrollment.objects.filter(student=student)
            .exclude(
                Q(course__teacher__is_superuser=True)
                | Q(course__teacher__is_staff=True)
            )
            .order_by("is_completed")
        )
        enrollments = EnrollmentSerializer(queryset, many=True).data
        return [
            {
                "id": enrollment["course_id"],
                "name": enrollment["course"],
                "is_active": not enrollment["is_completed"],
            }
            for enrollment in enrollments
        ]

    @action(detail=False, methods=["patch"], url_path="patch-status")
    def patch_status(self, request):
        """
        Update the user's status.

        Validates:
        - Status must be a string
        - Status length must be <= 255 characters
        """
        user = request.user
        new_status = request.data.get("status")

        if not new_status:
            return Response(
                {"detail": "Status is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(new_status, str):
            return Response(
                {"detail": "Status must be a text description"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_status) > 255:
            return Response(
                {"detail": "Status description is too long (maximum 255 characters)"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.status = new_status
        user.save()

        return Response(
            {"status": user.status},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["patch"], url_path="patch-photo")
    def patch_photo(self, request):
        """
        Update the user's profile photo.

        Validates:
        - Photo must be provided in request.FILES
        """
        user = request.user

        if "photo" not in request.FILES:
            return Response(
                {"detail": "No photo provided in the request"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user.photo = request.FILES["photo"]
            user.save()

            if user.photo:
                return Response(
                    {"photo": request.build_absolute_uri(user.photo.url)},
                    status=status.HTTP_200_OK,
                )
            return Response(
                {"detail": "Failed to save the photo"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as e:
            return Response(
                {"detail": f"Error updating photo: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
