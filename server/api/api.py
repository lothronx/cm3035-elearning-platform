"""
API Routing Configuration for the eLearning Platform

This file defines all API endpoints and their corresponding views using Django REST Framework routers.
It includes both top-level and nested routes for various application features.
"""

# Core Framework Imports
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers

# Application Imports
# User Accounts
from accounts.views import (
    UserRegistrationView,
    UserLogoutView,
    DashboardViewSet,
    UserViewSet,
)

# Courses & Learning
from courses.views import (
    CourseViewSet,
    CourseMaterialViewSet,
    FeedbackViewSet,
    EnrollmentViewSet,
    StudentEnrollmentViewSet,
    StudentCourseProgressViewSet,
)

# Notifications
from notifications.views import NotificationViewSet

# Chat
from chat.views import ChatMessageViewSet

# Main router for top-level endpoints
router = DefaultRouter()

"""
Primary router handling top-level API endpoints
"""

# User Management Routes
router.register(r"members", UserViewSet, basename="members")
router.register(r"dashboard", DashboardViewSet, basename="user-dashboard")

# Course Management Routes
router.register(r"courses", CourseViewSet, basename="courses")

# Nested routers for course-related resources
courses_router = routers.NestedSimpleRouter(router, r"courses", lookup="course")

"""
Nested router for resources that belong to specific courses
"""

# Course Materials
courses_router.register(
    r"materials", CourseMaterialViewSet, basename="course-materials"
)

# Course Feedback
courses_router.register(r"feedback", FeedbackViewSet, basename="course-feedback")

# Enrollment Management
courses_router.register(
    r"enrollments", EnrollmentViewSet, basename="course-enrollments"
)

# Student Enrollment
courses_router.register(
    r"student-enrollment", StudentEnrollmentViewSet, basename="student-enrollment"
)

# Student Progress Tracking
courses_router.register(
    r"progress", StudentCourseProgressViewSet, basename="student-progress"
)

# Chat
router.register(r"chat", ChatMessageViewSet, basename="chat")

# Notifications
router.register(r"notifications", NotificationViewSet, basename="notifications")

# API URL Patterns
urlpatterns = [
    path("", include(router.urls)),
    path("", include(courses_router.urls)),
    path("auth/register/", UserRegistrationView.as_view(), name="register"),
    path("auth/logout/", UserLogoutView.as_view(), name="logout"),
]
