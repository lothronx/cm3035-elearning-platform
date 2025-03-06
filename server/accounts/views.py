# api/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from accounts.models import User
from .serializers import UserSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Teachers can see all users; students can only see their own profile
        user = self.request.user
        if user.role == "teacher":
            return User.objects.all()
        return User.objects.filter(id=user.id)

    def get_permissions(self):
        if self.action == "create":  # Allow unauthenticated users to register
            return []
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save()
