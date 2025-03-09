from django.db import models
from accounts.models import User


class Course(models.Model):
    """
    Represents a course in the e-learning system.

    Attributes:
        title: The title of the course
        description: Detailed description of the course content
        teacher: The user who created and teaches the course
        created_at: Timestamp of when the course was created
        updated_at: Timestamp of the last update
        is_active: Status flag indicating if the course is active
    """

    title = models.CharField(
        max_length=255,
        help_text='The title of the course'
    )
    description = models.TextField(
        help_text='Detailed description of the course content'
    )
    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="courses_taught",
        help_text='The user who created and teaches the course'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Timestamp of when the course was created'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text='Timestamp of the last update'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Status flag indicating if the course is active'
    )

    def __str__(self):
        """
        Returns a string representation of the course.

        Returns:
            str: The course title
        """
        return str(self.title)


class CourseMaterial(models.Model):
    """
    Represents a material resource associated with a course.

    Attributes:
        course: The course this material belongs to
        title: The title/name of the material
        file: The actual file resource
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
        """
        Returns a string representation of the material.

        Returns:
            str: Formatted string with material title and course
        """
        return f'Course Material: {self.title} (Course: {self.course.title})'


class Enrollment(models.Model):
    """
    Represents a student's enrollment in a course.

    Attributes:
        student: The user enrolled in the course
        course: The course the student is enrolled in
        enrolled_at: Timestamp of when the enrollment was created
        is_completed: Status flag indicating if the course is completed
        completed_at: Timestamp of when the course was completed
    """

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="enrolled_courses",
        help_text='The user enrolled in the course'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="enrolled_students",
        help_text='The course the student is enrolled in'
    )
    enrolled_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Timestamp of when the enrollment was created'
    )
    is_completed = models.BooleanField(
        default=False,
        help_text='Status flag indicating if the course is completed'
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Timestamp of when the course was completed'
    )

    def __str__(self):
        """
        Returns a string representation of the enrollment.

        Returns:
            str: Formatted string with student username and course title
        """
        return f"{self.student.username} - {self.course.title}"


class Feedback(models.Model):
    """
    Represents feedback given by a student for a course.

    Attributes:
        student: The user who gave the feedback
        course: The course the feedback is for
        comment: The feedback content
        created_at: Timestamp of when the feedback was created
    """

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="feedbacks_given",
        help_text='The user who gave the feedback'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="feedbacks_received",
        help_text='The course the feedback is for'
    )
    comment = models.TextField(
        help_text='The feedback content'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Timestamp of when the feedback was created'
    )

    def __str__(self):
        """
        Returns a string representation of the feedback.

        Returns:
            str: Formatted string with student username and course title
        """
        return f"Feedback by {self.student.username} for {self.course.title}"
