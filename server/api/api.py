from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers

# Import user-related views from the existing api/views.py
from accounts.views import (
    UserRegistrationView,
    UserLogoutView,
    DashboardViewSet,
    UserViewSet,
)

# Import ViewSets from each app
from courses.views import (
    CourseViewSet,
    CourseMaterialViewSet,
    FeedbackViewSet,
    EnrollmentViewSet,
    StudentEnrollmentViewSet,
    StudentCourseProgressViewSet,
)

# Import notification views
from notifications.views import NotificationViewSet

# Import chat views
from chat.views import ChatMessageViewSet, FileUploadViewSet


router = DefaultRouter()

# User-related routes
router.register(r"members", UserViewSet, basename="members")
router.register(r"dashboard", DashboardViewSet, basename="user-dashboard")


# Course-related routes
router.register(r"courses", CourseViewSet, basename="courses")

# Nested router for course materials
courses_router = routers.NestedSimpleRouter(router, r"courses", lookup="course")
courses_router.register(
    r"materials", CourseMaterialViewSet, basename="course-materials"
)
courses_router.register(r"feedback", FeedbackViewSet, basename="course-feedback")
courses_router.register(
    r"enrollments", EnrollmentViewSet, basename="course-enrollments"
)
courses_router.register(
    r"student-enrollment", StudentEnrollmentViewSet, basename="student-enrollment"
)
courses_router.register(
    r"progress", StudentCourseProgressViewSet, basename="student-progress"
)

# Chat routes
router.register(r"chat", ChatMessageViewSet, basename="chat")
router.register(r"uploads", FileUploadViewSet, basename="uploads")

# Notification routes
router.register(r"notifications", NotificationViewSet, basename="notifications")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(courses_router.urls)),
    path("auth/register/", UserRegistrationView.as_view(), name="register"),
    path("auth/logout/", UserLogoutView.as_view(), name="logout"),
]
