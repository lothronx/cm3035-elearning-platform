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
    """
    API endpoint for user management functionality.
    
    Handles:
    - Listing and searching users
    - Retrieving user details with associated courses
    - Access control based on user roles
    """
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
        # Exclude superusers, admin users, and the current user
        users = User.objects.filter(is_superuser=False, is_staff=False).exclude(
            id=request.user.id
        )
        serializer = UserSerializer(users, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def retrieve(self, request, pk=None):
        """
        Retrieve detailed information about a specific user
        
        Includes:
        - User details
        - Associated courses based on user role
        """
        try:
            user = User.objects.get(pk=pk)

            # Prevent access to admin/superuser profiles
            if user.is_superuser or user.is_staff:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Get courses based on user role
            courses = self._get_user_courses(user)

            # Serialize user data with courses
            serializer = UserSerializer(user, context={"request": request})
            response_data = serializer.data
            response_data["courses"] = courses

            return Response(response_data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    def _get_user_courses(self, user):
        """
        Helper method to get courses based on user role
        
        Args:
            user: The user object to get courses for
        
        Returns:
            List of course dictionaries
        """
        if user.role == "teacher":
            # Get active courses taught by teacher
            queryset = Course.objects.filter(teacher=user, is_active=True).exclude(
                Q(teacher__is_superuser=True) | Q(teacher__is_staff=True)
            )
            courses_taught = CourseSerializer(queryset, many=True).data
            return [
                {
                    "id": course["id"],
                    "name": course["title"],
                }
                for course in courses_taught
            ]
        else:
            # Get enrolled but not completed courses for student
            queryset = Enrollment.objects.filter(student=user, is_completed=False)
            enrollments = EnrollmentSerializer(queryset, many=True).data
            return [
                {
                    "id": enrollment["course_id"],
                    "name": enrollment["course"],
                }
                for enrollment in enrollments
            ]

    @action(detail=False, methods=["get"])
    def search(self, request):
        """
        Search for active users by name or username
        
        Only accessible by teachers
        """
        query = request.query_params.get("q", "")
        if not query:
            return Response(
                {"error": "Search query is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Search for active non-admin users
        queryset = (
            User.objects.exclude(
                Q(is_superuser=True) | Q(is_staff=True)
            )
            .filter(
                Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
                | Q(username__icontains=query)
            )
            .distinct()
        )

        # Return essential user information
        user_data = [
            {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
            }
            for user in queryset
        ]
        return Response(user_data)
