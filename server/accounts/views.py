# pylint: disable=E1101
from rest_framework import viewsets, generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action

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


class UserDashboardView(viewsets.ViewSet):
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
        user.status = request.data.get("status", user.status)
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
        if "photo" in request.FILES:
            user.photo = request.FILES["photo"]
            user.save()
        return Response(
            {"photo": request.build_absolute_uri(user.photo.url)},
            status=status.HTTP_200_OK,
        )


class UserProfileView(viewsets.ViewSet):

    def list(self, request):
        queryset = User.objects.all()
        serializer = UserSerializer(queryset, many=True)
        return Response(
            [
                {
                    "photo": (
                        request.build_absolute_uri(user["photo"].url)
                        if user["photo"]
                        else None
                    ),
                    "role": user["role"],
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "username": user["username"],
                    "status": user["status"],
                }
                for user in serializer.data
            ],
            status=status.HTTP_200_OK,
        )

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
