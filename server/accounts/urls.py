from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, UserRegistrationView, UserLogoutView

router = DefaultRouter()
router.register(r"users", UserViewSet)

urlpatterns = [
    path("api/register/", UserRegistrationView.as_view(), name="user-register"),
    path("api/logout/", UserLogoutView.as_view(), name="user-logout"),
    path("api/", include(router.urls)),
]
