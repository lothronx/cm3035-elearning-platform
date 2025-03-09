# pylint: disable=E1101
from rest_framework import serializers
from .models import Course, CourseMaterial, Enrollment, Feedback


class TeacherSerializer(serializers.Serializer):
    """
    Serializer for displaying teacher's basic information.

    Fields:
        id: Teacher's unique identifier
        first_name: Teacher's first name
        last_name: Teacher's last name
    """

    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class StudentSerializer(serializers.Serializer):
    """
    Serializer for displaying student's basic information.

    Fields:
        id: Student's unique identifier
        first_name: Student's first name
        last_name: Student's last name
    """

    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class CourseSerializer(serializers.ModelSerializer):
    """
    Serializer for Course model with detailed information.

    Includes teacher details through TeacherSerializer.
    """

    teacher = TeacherSerializer(read_only=True)

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "teacher",
            "created_at",
            "updated_at",
            "is_active",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CourseListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing courses with additional enrollment information.

    Includes:
        - Teacher details
        - Number of enrolled students
        - Enrollment status for current user
        - Completion status for current user
    """

    teacher = TeacherSerializer(read_only=True)
    enrolled_students_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "teacher",
            "updated_at",
            "enrolled_students_count",
            "is_enrolled",
            "is_completed",
        ]

    def get_enrolled_students_count(self, obj):
        """
        Get the count of students enrolled in the course.

        Args:
            obj: Course instance

        Returns:
            int: Number of enrolled students
        """
        return obj.enrolled_students.count()

    def get_is_enrolled(self, obj):
        """
        Check if the current user is enrolled in the course.

        Args:
            obj: Course instance

        Returns:
            bool: True if enrolled, None if not a student or not authenticated
        """
        request = self.context.get("request")
        if request and request.user.is_authenticated and request.user.role == "student":
            return Enrollment.objects.filter(course=obj, student=request.user).exists()
        return None

    def get_is_completed(self, obj):
        """
        Check if the current user has completed the course.

        Args:
            obj: Course instance

        Returns:
            bool: True if completed, None if not enrolled or not a student
        """
        request = self.context.get("request")
        if request and request.user.is_authenticated and request.user.role == "student":
            try:
                enrollment = Enrollment.objects.get(course=obj, student=request.user)
                return enrollment.is_completed
            except Enrollment.DoesNotExist:
                return None
        return None


class CourseDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed course information.

    Includes:
        - Teacher details
        - Enrollment status for current user
        - Completion status for current user
    """

    teacher = TeacherSerializer(read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "teacher",
            "created_at",
            "updated_at",
            "is_active",
            "is_enrolled",
            "is_completed",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "is_active"]

    def get_is_enrolled(self, obj):
        """
        Check if the current user is enrolled in the course.

        Args:
            obj: Course instance

        Returns:
            bool: True if enrolled, None if not a student or not authenticated
        """
        request = self.context.get("request")
        if request and request.user.is_authenticated and request.user.role == "student":
            return Enrollment.objects.filter(course=obj, student=request.user).exists()
        return None

    def get_is_completed(self, obj):
        """
        Check if the current user has completed the course.

        Args:
            obj: Course instance

        Returns:
            bool: True if completed, None if not enrolled or not a student
        """
        request = self.context.get("request")
        if request and request.user.is_authenticated and request.user.role == "student":
            try:
                enrollment = Enrollment.objects.get(course=obj, student=request.user)
                return enrollment.is_completed
            except Enrollment.DoesNotExist:
                return None
        return None


class CourseMaterialSerializer(serializers.ModelSerializer):
    """
    Serializer for CourseMaterial model.

    Includes:
        - Course title instead of ID
        - Material details
    """

    course = serializers.StringRelatedField()

    class Meta:
        model = CourseMaterial
        fields = ["id", "course", "title", "file", "uploaded_at", "is_active"]
        read_only_fields = ["id", "uploaded_at"]


class EnrollmentSerializer(serializers.ModelSerializer):
    """
    Serializer for Enrollment model.

    Includes:
        - Student details
        - Course title and ID
        - Enrollment status
    """

    student = StudentSerializer(read_only=True)
    course = serializers.StringRelatedField()
    course_id = serializers.PrimaryKeyRelatedField(source="course", read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "student",
            "course",
            "course_id",
            "enrolled_at",
            "is_completed",
            "completed_at",
        ]
        read_only_fields = ["id", "enrolled_at", "completed_at"]


class FeedbackSerializer(serializers.ModelSerializer):
    """
    Serializer for Feedback model.

    Includes:
        - Student details
        - Feedback content
        - Creation timestamp
    """

    student = StudentSerializer(read_only=True)

    class Meta:
        model = Feedback
        fields = ["id", "student", "comment", "created_at"]
        read_only_fields = ["id", "created_at"]
