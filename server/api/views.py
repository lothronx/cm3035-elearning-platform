# pylint: disable=E1101
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from accounts.models import User
from accounts.serializers import UserSerializer
from courses.serializers import CourseSerializer, EnrollmentSerializer
from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from courses.models import Enrollment


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
            # Return a custom error message for username uniqueness
            if "username" in e.detail:
                return Response(
                    {"error": "Username already exists."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Get the token from the request
            token = request.data.get("token")
            OutstandingToken.objects.filter(
                token=token
            ).delete()  # This will remove the token from the database
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserDashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.photo:
            photo_url = request.build_absolute_uri(user.photo.url)
        else:
            photo_url = None

        queryset = Enrollment.objects.filter(student=user)
        enrollments = EnrollmentSerializer(queryset, many=True).data
        courses = [{"id": enrollment["course_id"], "name": enrollment["course"]} for enrollment in enrollments]
        return Response(
            {
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "photo": photo_url,
                "status": user.status,
                "courses": courses,
            },
            status=status.HTTP_200_OK,
        )
