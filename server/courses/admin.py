from django.contrib import admin
from .models import Course, CourseMaterial, Enrollment, Feedback


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "description",
        "teacher",
        "created_at",
        "updated_at",
        "is_active",
    )
    list_filter = ("is_active", "teacher")
    search_fields = ("title", "description", "teacher__username")
    ordering = ("-created_at",)


@admin.register(CourseMaterial)
class CourseMaterialAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "uploaded_at", "is_active")
    list_filter = ("is_active", "course")
    search_fields = ("title", "course__title")
    ordering = ("-uploaded_at",)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "enrolled_at", "is_completed", "completed_at")
    list_filter = ("is_completed", "course")
    search_fields = ("student__username", "course__title")
    ordering = ("-enrolled_at",)


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "comment", "created_at")
    list_filter = ("course",)
    search_fields = ("student__username", "course__title", "comment")
    ordering = ("-created_at",)
