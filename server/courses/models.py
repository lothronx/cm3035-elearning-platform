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
    """
    Represents a material resource associated with a course.

    Attributes:
        course: The course this material belongs to (foreign key to Course model)
        title: The title/name of the material
        file: The actual file resource (stored in 'course_materials/' directory)
        uploaded_at: Timestamp of when the material was uploaded
        is_active: Status flag indicating if the material is active
    """
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='materials',
        help_text='The course this material belongs to'
    )
    title = models.CharField(
        max_length=255,
        help_text='The title/name of the material'
    )
    file = models.FileField(
        upload_to='course_materials/',
        help_text='The actual file resource'
    )
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Timestamp of when the material was uploaded'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Status flag indicating if the material is active'
    )

    def __str__(self):
        """Returns a string representation of the material."""
        return f'Course Material: {self.title} (Course: {self.course.title})'


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
