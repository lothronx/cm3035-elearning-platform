# pylint: disable=E1101
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from courses.models import Course, Enrollment
from courses.serializers import CourseSerializer
from api.permissions import IsTeacher, IsCourseTeacher


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "teacher":
            return Course.objects.filter(teacher=user)
        elif user.role == "student":
            enrolled_courses = Enrollment.objects.filter(student=user).values_list(
                "course_id", flat=True
            )
            return Course.objects.filter(id__in=enrolled_courses)
        return Course.objects.none()

    def get_permissions(self):
        if self.action in ["create"]:
            permission_classes = [IsTeacher]
        elif self.action in ["update", "partial_update", "destroy"]:
            permission_classes = [IsCourseTeacher]
        elif self.action in ["list", "retrieve"]:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)
