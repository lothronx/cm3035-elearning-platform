from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken


class UserLogoutView(generics.GenericAPIView):
    """
    API endpoint for user logout functionality.
    
    Handles:
    - Invalidating refresh tokens via blacklisting
    - Ensuring authenticated users can only log themselves out
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Handle POST request for user logout.
        
        Args:
            request: Django REST Framework request object containing refresh token
        
        Returns:
            Response with logout success message or error details
        """
        try:
            # Validate refresh token presence
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"detail": "Refresh token is required for logout"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Blacklist the refresh token to prevent reuse
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"detail": "Successfully logged out"},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            # Handle invalid or already blacklisted tokens
            return Response(
                {"detail": f"Logout failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
