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

    def has_object_permission(self, request, view, obj):
        # Works with Course objects or objects with a course attribute
        if isinstance(obj, Course):
            return request.user.is_authenticated and obj.teacher == request.user
        elif hasattr(obj, "course"):
            return request.user.is_authenticated and obj.course.teacher == request.user
        return False


class IsEnrolledStudent(permissions.BasePermission):
    """
    Custom permission to only allow students enrolled in a specific course to access it.
    """

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


class ReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow read-only methods.
    """

    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS


class IsTeacherOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow teachers full access but only read-only access to others.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role == "teacher"


class IsCourseTeacherOrEnrolledStudent(permissions.BasePermission):
    """
    Custom permission to allow course teachers full access and enrolled students read-only access.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        # Course teacher has full access
        if request.user.role == "teacher":
            if isinstance(obj, Course):
                return obj.teacher == request.user
            elif hasattr(obj, "course"):
                return obj.course.teacher == request.user

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
