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
    ViewSet for handling student course enrollment operations.

    Provides endpoints for:
    - Enrolling in a course
    - Unenrolling from a course

    Requires authentication and student permissions.
    """

    permission_classes = [IsAuthenticated, IsStudent]

    def create(self, request, course_pk=None):
        """
        Enroll the authenticated student in a course.

        Args:
            request: The HTTP request object
            course_pk: Primary key of the course to enroll in

        Returns:
            Response: HTTP response with enrollment status
                     or error message
        """
        try:
            # Retrieve the course object
            course = Course.objects.get(pk=course_pk)

            # Validate course is active
            if not course.is_active:
                return Response(
                    {"error": "Cannot enroll in an inactive course"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check for existing enrollment
            if Enrollment.objects.filter(course=course, student=request.user).exists():
                return Response(
                    {"error": "Already enrolled in this course"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create new enrollment
            enrollment = Enrollment.objects.create(
                course=course,
                student=request.user,
            )

            # Notify teacher about new enrollment
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
        """
        Unenroll the authenticated student from a course.

        Args:
            request: The HTTP request object
            course_pk: Primary key of the course to unenroll from

        Returns:
            Response: HTTP response with unenrollment status
                     or error message
        """
        try:
            # Retrieve and delete the enrollment
            enrollment = Enrollment.objects.get(
                course_id=course_pk, student=request.user
            )

            # Store course and student details for notification
            course = enrollment.course
            student = request.user

            enrollment.delete()

            # Notify teacher about unenrollment
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
