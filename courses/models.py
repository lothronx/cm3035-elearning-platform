from django.db import models
from accounts.models import User


class Course(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    teacher = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="courses_taught"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return str(self.title)


class CourseMaterial(models.Model):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="materials"
    )
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="course_materials/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} - {self.course.title}"


class Enrollment(models.Model):
    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="enrolled_courses"
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="enrolled_students"
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.student.username} - {self.course.title}"


class Feedback(models.Model):
    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="feedbacks_given"
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="feedbacks_received"
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback by {self.student.username} for {self.course.title}"
