from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework.exceptions import ValidationError

from accounts.models import User
from accounts.serializers import UserSerializer


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
