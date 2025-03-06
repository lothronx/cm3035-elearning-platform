from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet,
    CourseMaterialViewSet,
    EnrollmentViewSet,
    FeedbackViewSet,
)

router = DefaultRouter()
router.register(r"courses", CourseViewSet)
router.register(r"materials", CourseMaterialViewSet)
router.register(r"enrollments", EnrollmentViewSet)
router.register(r"feedback", FeedbackViewSet)

urlpatterns = [
    path("api/", include(router.urls)),
]
