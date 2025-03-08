from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from courses.models import Course, Enrollment
from api.permissions import IsStudent
from notifications.services import (
    create_course_enrollment_notification,
    create_course_unenrollment_notification,
)


class StudentEnrollmentViewSet(viewsets.ViewSet):
    """
    ViewSet for students to manage their own course enrollments:
    - POST /courses/{course_id}/student-enrollment/: Student can enroll in a course
    - DELETE /courses/{course_id}/student-enrollment/: Student can unenroll from a course
    """

    permission_classes = [IsAuthenticated, IsStudent]

    def create(self, request, course_pk=None):
        """Handle enrollment creation"""
        try:
            course = Course.objects.get(pk=course_pk)

            # Check if course is active
            if not course.is_active:
                return Response(
                    {"error": "Cannot enroll in an inactive course"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if student is already enrolled
            if Enrollment.objects.filter(course=course, student=request.user).exists():
                return Response(
                    {"error": "Already enrolled in this course"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create enrollment
            enrollment = Enrollment.objects.create(
                course=course,
                student=request.user,
            )

            # Send notification to the teacher
            create_course_enrollment_notification(enrollment)

            return Response(
                {
                    "status": "success",
                    "message": "Successfully enrolled in the course",
                    "enrollment_id": enrollment.id,
                },
                status=status.HTTP_201_CREATED,
            )

        except Course.DoesNotExist:
            return Response(
                {"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND
            )

    def delete(self, request, course_pk=None):
        """Handle unenrollment"""
        try:
            enrollment = Enrollment.objects.get(
                course_id=course_pk, student=request.user
            )

            # Get course before deleting enrollment
            course = enrollment.course
            student = request.user

            enrollment.delete()

            # Send notification to the teacher about student leaving
            create_course_unenrollment_notification(course, student)

            return Response(
                {
                    "status": "success",
                    "message": "Successfully unenrolled from the course",
                },
                status=status.HTTP_200_OK,
            )

        except Enrollment.DoesNotExist:
            return Response(
                {"error": "Not enrolled in this course"},
                status=status.HTTP_404_NOT_FOUND,
            )
