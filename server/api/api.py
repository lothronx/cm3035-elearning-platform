from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserRegistrationView, UserLogoutView, UserDashboardView, UserProfileView

router = DefaultRouter()
router.register(r'dashboard', UserDashboardView, basename='user-dashboard')
router.register(r'members', UserProfileView, basename='user-profile')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
]
