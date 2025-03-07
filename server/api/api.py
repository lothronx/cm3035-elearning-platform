from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers

# Import user-related views from the existing api/views.py
from accounts.views import (
    UserRegistrationView,
    UserLogoutView,
    UserDashboardView,
    UserProfileView,
)

# Import ViewSets from each app
# from courses.views import CourseViewSet, CourseMaterialViewSet, EnrollmentViewSet
# from chat.views import ChatMessageViewSet


router = DefaultRouter()

# User-related routes
router.register(r"dashboard", UserDashboardView, basename="user-dashboard")
router.register(r"members", UserProfileView, basename="user-profile")


# Course-related routes
# router.register(r"courses", CourseViewSet, basename="courses")

# Nested router for course materials
# courses_router = routers.NestedSimpleRouter(router, r"courses", lookup="course")
# courses_router.register(
#     r"materials", CourseMaterialViewSet, basename="course-materials"
# )
# courses_router.register(
#     r"enrollments", EnrollmentViewSet, basename="course-enrollments"
# )

# Chat routes
# router.register(r"messages", ChatMessageViewSet, basename="messages")

# Notification routes


urlpatterns = [
    path("", include(router.urls)),
    path("auth/register/", UserRegistrationView.as_view(), name="register"),
    path("auth/logout/", UserLogoutView.as_view(), name="logout"),
]
