from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework.exceptions import ValidationError

from accounts.models import User
from accounts.serializers import UserSerializer


class UserRegistrationView(generics.CreateAPIView):
    """
    API endpoint for user registration functionality.
    
    Handles:
    - New user account creation
    - JWT token generation upon successful registration
    - Comprehensive validation error handling
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        """
        Handle POST request for user registration.
        
        Args:
            request: Django REST Framework request object containing user data
            *args: Additional positional arguments
            **kwargs: Additional keyword arguments
        
        Returns:
            Response with JWT tokens on success or error details on failure
        """
        # Prepare validated data with role information
        validated_data = request.data.copy()
        validated_data["role"] = request.data.get("role")

        # Initialize serializer with validated data
        serializer = self.get_serializer(data=validated_data)

        try:
            # Validate and create user
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)

            # Generate JWT tokens for the new user
            user = serializer.instance
            access = AccessToken.for_user(user)
            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "access": str(access),
                    "refresh": str(refresh),
                },
                status=status.HTTP_201_CREATED,
            )

        except ValidationError as e:
            # Process and format validation errors
            error_details = self._process_validation_errors(e)
            return Response(error_details, status=status.HTTP_400_BAD_REQUEST)

    def _process_validation_errors(self, validation_error):
        """
        Process validation errors into a user-friendly format.
        
        Args:
            validation_error: ValidationError exception instance
        
        Returns:
            Dictionary of processed error messages
        """
        error_details = {}

        # Handle username uniqueness error specifically
        if "username" in validation_error.detail and \
                "unique" in str(validation_error.detail["username"]).lower():
            error_details["username"] = "Username already exists."
        else:
            # Process all validation errors
            for field, errors in validation_error.detail.items():
                if isinstance(errors, list):
                    error_details[field] = errors[0]
                else:
                    error_details[field] = str(errors)

        # Provide generic message if no specific errors were identified
        if not error_details:
            error_details["error"] = "Registration failed. Please check your input."

        return error_details
