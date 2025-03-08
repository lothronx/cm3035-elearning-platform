from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q

from api.permissions import IsTeacher
from accounts.models import User
from accounts.serializers import UserSerializer
from courses.models import Course, Enrollment
from courses.serializers import CourseSerializer, EnrollmentSerializer


class UserViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """
        Instantiate and return the list of permissions that this view requires.
        - For list action (GET /members/), only teachers can access
        - For retrieve action (GET /members/[id]), any authenticated user can access
        """
        if self.action == "list":
            permission_classes = [IsAuthenticated, IsTeacher]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def list(self, request):
        """
        List all users - only accessible to teachers
        Returns photos, role, first_name, last_name, username, status
        Excludes superusers and staff users for security reasons
        """
        # Exclude superusers and admin users from the results, also exclude the current user
        users = User.objects.filter(is_superuser=False, is_staff=False).exclude(
            id=request.user.id
        )
        user_data = []

        for user in users:
            user_data.append(
                {
                    "id": user.id,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                    "status": user.status,
                    "photo": (
                        request.build_absolute_uri(user.photo.url)
                        if user.photo
                        else None
                    ),
                }
            )

        return Response(user_data, status=status.HTTP_200_OK)

    def retrieve(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)

            # Check if the requested user is an admin/superuser
            if user.is_superuser or user.is_staff:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            courses = []

            if user.role == "teacher":
                # For teachers, get the active courses they teach
                # Exclude courses where teacher is admin/superuser
                queryset = Course.objects.filter(
                    teacher=user,
                    is_active=True
                ).exclude(
                    Q(teacher__is_superuser=True) | Q(teacher__is_staff=True)
                )
                courses_taught = CourseSerializer(queryset, many=True).data
                courses = [
                    {
                        "id": course["id"],
                        "name": course["title"],
                    }
                    for course in courses_taught
                ]
            else:
                # For students, get enrolled but not completed courses
                # Exclude courses where teacher is admin/superuser
                queryset = Enrollment.objects.filter(
                    student=user,
                    is_completed=False
                ).exclude(
                    Q(course__teacher__is_superuser=True) | Q(course__teacher__is_staff=True)
                )
                enrollments = EnrollmentSerializer(queryset, many=True).data
                courses = [
                    {
                        "id": enrollment["course_id"],
                        "name": enrollment["course"],
                    }
                    for enrollment in enrollments
                ]

            return Response(
                {
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                    "photo": (
                        request.build_absolute_uri(user.photo.url)
                        if user.photo
                        else None
                    ),
                    "status": user.status,
                    "courses": courses,
                },
                status=status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(
        detail=False, methods=["get"], permission_classes=[IsAuthenticated, IsTeacher]
    )
    def search(self, request):
        """Search for students by name or username. Only accessible by teachers."""
        query = request.query_params.get("q", "")
        if not query:
            return Response(
                {"error": "Search query is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only search for students, exclude admin users and other teachers
        queryset = (
            User.objects.filter(role="student")
            .exclude(
                Q(is_superuser=True)
                | Q(is_staff=True)  # Exclude admin users per security requirements
            )
            .filter(
                Q(username__icontains=query)
                | Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
            )
            .order_by("username")
        )

        serializer = UserSerializer(queryset, many=True)
        return Response(serializer.data)
