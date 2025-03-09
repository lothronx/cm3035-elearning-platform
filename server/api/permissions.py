# pylint: disable=E1101
from rest_framework import permissions
from courses.models import Course, Enrollment


class IsTeacher(permissions.BasePermission):
    """
    Custom permission to only allow teachers to access the view.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "teacher"


class IsStudent(permissions.BasePermission):
    """
    Custom permission to only allow students to access the view.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "student"


class IsCourseTeacher(permissions.BasePermission):
    """
    Custom permission to only allow the teacher of a specific course to access or modify it.
    """

    def has_permission(self, request, view):
        # Basic authentication and role check
        if not request.user.is_authenticated or request.user.role != "teacher":
            return False

        # For detail views (update, delete), we need to check the course ID from the URL
        if view.action in ['update', 'partial_update', 'destroy'] and 'pk' in view.kwargs:
            course_pk = view.kwargs.get('pk')
            if not course_pk:
                return False
            # Check if user is the teacher of this course
            return Course.objects.filter(id=course_pk, teacher=request.user).exists()
            
        # For nested views, get course_pk from URL parameters
        course_pk = view.kwargs.get("course_pk")
        if not course_pk:
            return False

        # Check if user is the course teacher
        return Course.objects.filter(id=course_pk, teacher=request.user).exists()

    def has_object_permission(self, request, view, obj):
        # Basic authentication and role check
        if not request.user.is_authenticated or request.user.role != "teacher":
            return False
            
        # Works with Course objects or objects with a course attribute
        if isinstance(obj, Course):
            return obj.teacher.id == request.user.id
        elif hasattr(obj, "course"):
            return obj.course.teacher.id == request.user.id
        return False


class IsEnrolledStudent(permissions.BasePermission):
    """
    Custom permission to only allow students enrolled in a specific course to access it.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated or request.user.role != "student":
            return False

        # Get course_pk from URL parameters
        course_pk = view.kwargs.get("course_pk")
        if not course_pk:
            return False

        # Check if student is enrolled in the course
        return Enrollment.objects.filter(
            student=request.user, course_id=course_pk
        ).exists()

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated or request.user.role != "student":
            return False

        # For Course objects
        if isinstance(obj, Course):
            return Enrollment.objects.filter(student=request.user, course=obj).exists()
        # For objects related to a course (materials, feedback, etc.)
        elif hasattr(obj, "course"):
            return Enrollment.objects.filter(
                student=request.user, course=obj.course
            ).exists()
        return False


class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to access or modify it.
    Works with any model that has a user, student, sender, or recipient field.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        # Check common ownership fields
        for field in ["user", "student", "sender", "recipient"]:
            if hasattr(obj, field):
                return getattr(obj, field) == request.user
        return False


class IsCourseTeacherOrEnrolledStudent(permissions.BasePermission):
    """
    Custom permission to allow course teachers full access and enrolled students read-only access.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Get course_pk from URL parameters
        course_pk = view.kwargs.get("course_pk")
        if not course_pk:
            return False

        # Course teacher has full access
        if request.user.role == "teacher":
            return Course.objects.filter(id=course_pk, teacher=request.user).exists()

        # Enrolled student has read-only access
        if (
            request.method in permissions.SAFE_METHODS
            and request.user.role == "student"
        ):
            return Enrollment.objects.filter(
                student=request.user, course_id=course_pk
            ).exists()

        return False

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        # Course teacher has full access
        if request.user.role == "teacher":
            if isinstance(obj, Course):
                return obj.teacher.id == request.user.id
            elif hasattr(obj, "course"):
                return obj.course.teacher.id == request.user.id

        # Enrolled student has read-only access
        if (
            request.method in permissions.SAFE_METHODS
            and request.user.role == "student"
        ):
            if isinstance(obj, Course):
                return Enrollment.objects.filter(
                    student=request.user, course=obj
                ).exists()
            elif hasattr(obj, "course"):
                return Enrollment.objects.filter(
                    student=request.user, course=obj.course
                ).exists()

        return False
