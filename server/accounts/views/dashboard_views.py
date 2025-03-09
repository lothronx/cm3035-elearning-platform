from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q

from courses.models import Course, Enrollment
from courses.serializers import CourseSerializer, EnrollmentSerializer


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        user = request.user
        courses = []

        if user.role == "teacher":
            # For teachers, get courses they teach
            # Exclude admin users from results per security requirements
            queryset = Course.objects.filter(teacher=user).exclude(
                Q(teacher__is_superuser=True) | Q(teacher__is_staff=True)
            ).order_by("-is_active")
            courses_taught = CourseSerializer(queryset, many=True).data
            courses = [
                {
                    "id": course["id"],
                    "name": course["title"],
                    "is_active": course["is_active"],
                }
                for course in courses_taught
            ]
        else:
            # For students, get enrolled courses
            # Exclude admin users from results per security requirements
            queryset = Enrollment.objects.filter(student=user).exclude(
                Q(course__teacher__is_superuser=True) | Q(course__teacher__is_staff=True)
            ).order_by("is_completed")
            enrollments = EnrollmentSerializer(queryset, many=True).data
            courses = [
                {
                    "id": enrollment["course_id"],
                    "name": enrollment["course"],
                    "is_active": not enrollment["is_completed"],
                }
                for enrollment in enrollments
            ]

        return Response(
            {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "username": user.username,
                "role": user.role,
                "photo": (
                    request.build_absolute_uri(user.photo.url) if user.photo else None
                ),
                "status": user.status,
                "courses": courses,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["patch"], url_path="patch-status")
    def patch_status(self, request):
        user = request.user
        new_status = request.data.get("status")

        # Validate the status value - ensure it's a string and not too long
        if new_status:
            if not isinstance(new_status, str):
                return Response(
                    {"detail": "Status must be a text description"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Add a maximum length check if needed
            if len(new_status) > 255:
                return Response(
                    {
                        "detail": "Status description is too long (maximum 500 characters)"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.status = new_status
            user.save()

        return Response(
            {
                "status": user.status,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["patch"], url_path="patch-photo")
    def patch_photo(self, request):
        user = request.user

        if "photo" not in request.FILES:
            return Response(
                {"detail": "No photo provided in the request"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user.photo = request.FILES["photo"]
            user.save()

            # Check if the photo was successfully saved
            if user.photo:
                return Response(
                    {"photo": request.build_absolute_uri(user.photo.url)},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"detail": "Failed to save the photo"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        except Exception as e:
            return Response(
                {"detail": f"Error updating photo: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
