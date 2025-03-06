from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from courses.models import Course, CourseMaterial, Enrollment, Feedback
from .serializers import (
    CourseSerializer,
    CourseMaterialSerializer,
    EnrollmentSerializer,
    FeedbackSerializer,
)


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Automatically set the teacher as the logged-in user
        serializer.save(teacher=self.request.user)

class CourseMaterialViewSet(viewsets.ModelViewSet):
    queryset = CourseMaterial.objects.all()
    serializer_class = CourseMaterialSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Automatically set the course as the logged-in user
        serializer.save(course=self.request.user)

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Automatically set the student as the logged-in user
        serializer.save(student=self.request.user)


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]
    def perform_create(self, serializer):
        # Automatically set the student as the logged-in user
        serializer.save(student=self.request.user)
