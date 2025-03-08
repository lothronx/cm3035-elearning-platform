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
        Set permissions based on action:
        - list, search: IsAuthenticated & IsTeacher
        - retrieve: IsAuthenticated
        """
        if self.action in ["list", "search"]:
            self.permission_classes = [IsAuthenticated, IsTeacher]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def list(self, request):
        """
        List all users - only accessible to teachers
        Excludes superusers and staff users for security reasons
        """
        # Exclude superusers and admin users from the results, also exclude the current user
        users = User.objects.filter(is_superuser=False, is_staff=False).exclude(
            id=request.user.id
        )
        serializer = UserSerializer(users, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

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
                queryset = Course.objects.filter(teacher=user, is_active=True).exclude(
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
                queryset = Enrollment.objects.filter(student=user, is_completed=False)
                enrollments = EnrollmentSerializer(queryset, many=True).data
                courses = [
                    {
                        "id": enrollment["course_id"],
                        "name": enrollment["course"],
                    }
                    for enrollment in enrollments
                ]

            # Serialize user data
            serializer = UserSerializer(user, context={"request": request})
            response_data = serializer.data
            response_data["courses"] = courses

            return Response(response_data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=False, methods=["get"])
    def search(self, request):
        """Search for active users by name or username. Only accessible by teachers."""
        query = request.query_params.get("q", "")
        if not query:
            return Response(
                {"error": "Search query is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only search for active users
        queryset = (
            User.objects.exclude(
                Q(is_superuser=True)
                | Q(is_staff=True)  # Exclude admin users per security requirements
            )
            .filter(
                Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
                | Q(username__icontains=query)
            )
            .distinct()
        )

        # Return only specified fields
        user_data = []
        for user in queryset:
            user_data.append(
                {
                    "id": user.id,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                }
            )
        return Response(user_data)
