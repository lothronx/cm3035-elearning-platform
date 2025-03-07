from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserRegistrationView, UserLogoutView, UserDashboardView

router = DefaultRouter()

urlpatterns = [
    path("register/", UserRegistrationView.as_view(), name="user-register"),
    path("logout/", UserLogoutView.as_view(), name="user-logout"),
    path("dashboard/", UserDashboardView.as_view(), name="user-dashboard"),
]
