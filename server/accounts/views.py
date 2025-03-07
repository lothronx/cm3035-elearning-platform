# pylint: disable=E1101
from rest_framework import viewsets, generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action

from api.permissions import IsTeacher
from accounts.models import User
from accounts.serializers import UserSerializer
from courses.models import Enrollment, Course
from courses.serializers import CourseSerializer, EnrollmentSerializer


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        validated_data = request.data.copy()
        validated_data["role"] = request.data.get("role")
        serializer = self.get_serializer(data=validated_data)

        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            user = serializer.instance  # Get the created user instance
            access = AccessToken.for_user(user)  # Generate access token for the user
            refresh = RefreshToken.for_user(user)  # Generate refresh token for the user
            return Response(
                {
                    "access": str(access),
                    "refresh": str(refresh),
                },
                status=status.HTTP_201_CREATED,
            )
        except ValidationError as e:
            # Extract and format validation errors
            error_details = {}

            # Handle username uniqueness error specifically
            if "username" in e.detail and "unique" in str(e.detail["username"]).lower():
                error_details["username"] = "Username already exists."
            else:
                # Process all validation errors
                for field, errors in e.detail.items():
                    if isinstance(errors, list):
                        error_details[field] = errors[0]
                    else:
                        error_details[field] = str(errors)

            # If no specific errors were identified, provide a generic message
            if not error_details:
                error_details["error"] = "Registration failed. Please check your input."

            return Response(error_details, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Get the refresh token from the request
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"detail": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Blacklist the refresh token
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"detail": "Successfully logged out"}, status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"detail": "Invalid token or token has been blacklisted already"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        user = request.user
        courses = []

        if user.role == "teacher":
            # For teachers, get courses they teach
            queryset = Course.objects.filter(teacher=user)
            courses_taught = CourseSerializer(queryset, many=True).data
            courses = [
                {"id": course["id"], "name": course["title"]}
                for course in courses_taught
            ]
        else:
            # For students, get enrolled courses
            queryset = Enrollment.objects.filter(student=user)
            enrollments = EnrollmentSerializer(queryset, many=True).data
            courses = [
                {"id": enrollment["course_id"], "name": enrollment["course"]}
                for enrollment in enrollments
            ]

        return Response(
            {
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "photo": (
                    request.build_absolute_uri(user.photo.url) if user.photo else None
                ),
                "status": user.status,
                "courses": courses,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["patch"], url_path="patch-status")
    def patch_status(self, request):
        user = request.user
        new_status = request.data.get("status")

        # Validate the status value - ensure it's a string and not too long
        if new_status:
            if not isinstance(new_status, str):
                return Response(
                    {"detail": "Status must be a text description"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Add a maximum length check if needed
            if len(new_status) > 255:
                return Response(
                    {
                        "detail": "Status description is too long (maximum 500 characters)"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.status = new_status
            user.save()

        return Response(
            {
                "status": user.status,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["patch"], url_path="patch-photo")
    def patch_photo(self, request):
        user = request.user

        if "photo" not in request.FILES:
            return Response(
                {"detail": "No photo provided in the request"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user.photo = request.FILES["photo"]
            user.save()

            # Check if the photo was successfully saved
            if user.photo:
                return Response(
                    {"photo": request.build_absolute_uri(user.photo.url)},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"detail": "Failed to save the photo"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        except Exception as e:
            return Response(
                {"detail": f"Error updating photo: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


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
        Excludes superusers for security reasons
        """
        # Exclude superusers and admin users from the results
        users = User.objects.filter(is_superuser=False, is_staff=False)
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
            courses = []

            if user.role == "teacher":
                # For teachers, get courses they teach
                queryset = Course.objects.filter(teacher=user)
                courses_taught = CourseSerializer(queryset, many=True).data
                courses = [
                    {"id": course["id"], "name": course["title"]}
                    for course in courses_taught
                ]
            else:
                # For students, get enrolled courses
                queryset = Enrollment.objects.filter(student=user)
                enrollments = EnrollmentSerializer(queryset, many=True).data
                courses = [
                    {"id": enrollment["course_id"], "name": enrollment["course"]}
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
