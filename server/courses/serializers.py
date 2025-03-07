from rest_framework import serializers
from .models import Course, CourseMaterial, Enrollment, Feedback


class CourseSerializer(serializers.ModelSerializer):
    teacher = (
        serializers.StringRelatedField()
    )  # Display teacher's username instead of ID

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


class CourseMaterialSerializer(serializers.ModelSerializer):
    course = serializers.StringRelatedField()  # Display course title instead of ID

    class Meta:
        model = CourseMaterial
        fields = ["id", "course", "title", "file", "uploaded_at", "is_active"]
        read_only_fields = ["id", "uploaded_at"]


class EnrollmentSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField()  # Display student's username
    course = serializers.StringRelatedField()  # Display course title
    course_id = serializers.PrimaryKeyRelatedField(source='course', read_only=True)

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
