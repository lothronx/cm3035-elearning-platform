# pylint: disable=E1101
from rest_framework import serializers
from .models import Course, CourseMaterial, Enrollment, Feedback


class TeacherSerializer(serializers.Serializer):
    """Serializer for displaying teacher's name"""

    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class CourseSerializer(serializers.ModelSerializer):
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
        return obj.enrolled_students.count()

    def get_is_enrolled(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated and request.user.role == "student":
            return Enrollment.objects.filter(course=obj, student=request.user).exists()
        return None

    def get_is_completed(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated and request.user.role == "student":
            try:
                enrollment = Enrollment.objects.get(course=obj, student=request.user)
                return enrollment.is_completed
            except Enrollment.DoesNotExist:
                return None
        return None


class CourseDetailSerializer(serializers.ModelSerializer):
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
        request = self.context.get("request")
        if request and request.user.is_authenticated and request.user.role == "student":
            return Enrollment.objects.filter(course=obj, student=request.user).exists()
        return None

    def get_is_completed(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated and request.user.role == "student":
            try:
                enrollment = Enrollment.objects.get(course=obj, student=request.user)
                return enrollment.is_completed
            except Enrollment.DoesNotExist:
                return None
        return None


class CourseMaterialSerializer(serializers.ModelSerializer):
    course = serializers.StringRelatedField()  # Display course title instead of ID

    class Meta:
        model = CourseMaterial
        fields = ["id", "course", "title", "file", "uploaded_at", "is_active"]
        read_only_fields = ["id", "uploaded_at"]


class EnrollmentSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField()  # Display student's username
    course = serializers.StringRelatedField()  # Display course title
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
    student = serializers.StringRelatedField()  # Display student's username
    course = serializers.StringRelatedField()  # Display course title

    class Meta:
        model = Feedback
        fields = ["id", "student", "course", "comment", "created_at"]
        read_only_fields = ["id", "created_at"]
