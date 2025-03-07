import os
import django

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "elearning.settings")
django.setup()

# Import models after setting up Django
from django.core.files import File
from accounts.models import User
from courses.models import Course, CourseMaterial, Enrollment, Feedback
from chat.models import ChatMessage, FileUpload
from notifications.models import Notification


def populate():
    """p
    Populate the database with sample data for testing.
    """
    # Create Teachers
    with open("1.jpg", "rb") as f:
        teacher1 = User.objects.create_user(
            username="teacher1",
            email="teacher1@elearning.org",
            password="elearning",
            role="teacher",
            first_name="John",
            last_name="Doe",
            photo=File(f),
            status="Teaching Advanced Web Development",
        )

    with open("2.jpg", "rb") as f:
        teacher2 = User.objects.create_user(
            username="teacher2",
            email="teacher2@elearning.org",
            password="elearning",
            role="teacher",
            first_name="Jane",
            last_name="Smith",
            photo=File(f),
            status="Teaching Mobile Development",
        )

    # Create Students
    with open("3.jpg", "rb") as f:
        student1 = User.objects.create_user(
            username="student1",
            email="student1@elearning.org",
            password="elearning",
            role="student",
            first_name="Alice",
            last_name="Johnson",
            photo=File(f),
            status="Learning Python",
        )

    with open("4.jpg", "rb") as f:
        student2 = User.objects.create_user(
            username="student2",
            email="student2@elearning.org",
            password="elearning",
            role="student",
            first_name="Bob",
            last_name="Williams",
            photo=File(f),
            status="Learning AdvancedWeb Development",
        )

    with open("5.jpg", "rb") as f:
        student3 = User.objects.create_user(
            username="student3",
            email="student3@elearning.org",
            password="elearning",
            role="student",
            first_name="Charlie",
            last_name="Brown",
            photo=File(f),
            status="Learning Mobile Development",
        )

    with open("6.jpg", "rb") as f:
        student4 = User.objects.create_user(
            username="student4",
            email="student4@elearning.org",
            password="elearning",
            role="student",
            first_name="David",
            last_name="Miller",
            photo=File(f),
            status="Today is a good day",
        )

    with open("7.jpg", "rb") as f:
        student5 = User.objects.create_user(
            username="student5",
            email="student5@elearning.org",
            password="elearning",
            role="student",
            first_name="Eve",
            last_name="Wilson",
            photo=File(f),
            status="Working on final project",
        )

    # Create Courses
    course1 = Course.objects.create(
        title="Advanced Web Development",
        description="Learn advanced web development with django and django rest framework",
        teacher=teacher1,
        is_active=True,
    )
    course2 = Course.objects.create(
        title="Mobile Development",
        description="Build cross platform mobile applications with react native and expo",
        teacher=teacher2,
        is_active=True,
    )

    # Enroll Students in Courses
    Enrollment.objects.create(student=student1, course=course1)
    Enrollment.objects.create(student=student2, course=course1)
    Enrollment.objects.create(student=student3, course=course1)

    Enrollment.objects.create(student=student3, course=course2)
    Enrollment.objects.create(student=student4, course=course2)
    Enrollment.objects.create(student=student5, course=course2)

    # Add Course Materials
    with open("awd-syllabus.pdf", "rb") as f:
        material1 = CourseMaterial.objects.create(
            course=course1,
            title="AWD Syllabus",
            file=File(f),
            is_active=True,
        )

    with open("AWD-CW2-v2.pdf", "rb") as f:
        material2 = CourseMaterial.objects.create(
            course=course1,
            title="AWD Final Requirements",
            file=File(f),
            is_active=True,
        )

    with open("md-syllabus.pdf", "rb") as f:
        material3 = CourseMaterial.objects.create(
            course=course2,
            title="MD Syllabus",
            file=File(f),
            is_active=True,
        )

    # Add Feedback
    Feedback.objects.create(
        student=student1,
        course=course1,
        comment="AWD is a Great course! Very informative.",
    )
    Feedback.objects.create(
        student=student2,
        course=course1,
        comment="AWD is a Great course! Excellent teaching style!",
    )
    Feedback.objects.create(
        student=student3,
        course=course2,
        comment="MD is a Great course! Very informative.",
    )
    Feedback.objects.create(
        student=student4,
        course=course2,
        comment="MD is a Great course! Excellent teaching style!",
    )

    # Add Chat Messages
    message1 = ChatMessage.objects.create(
        sender=student1,
        receiver=teacher1,
        content="Hi, I saw the syllabus for AWD, when is the next class?",
        message_type="text",
    )
    message2 = ChatMessage.objects.create(
        sender=teacher1,
        receiver=student1,
        content="Next class is on Friday at 10 AM.",
        message_type="text",
    )

    # Attach Files to Chat Messages
    with open("awd-syllabus.pdf", "rb") as f:
        FileUpload.objects.create(chat_message=message1, file=File(f))

    # Add Notifications
    Notification.objects.create(
        recipient=teacher1,
        message=f"{student1.username} has enrolled in {course1.title}.",
    )
    Notification.objects.create(
        recipient=teacher1,
        message=f"{student2.username} has enrolled in {course1.title}.",
    )
    Notification.objects.create(
        recipient=teacher1,
        message=f"{student3.username} has enrolled in {course1.title}.",
    )
    Notification.objects.create(
        recipient=teacher2,
        message=f"{student3.username} has enrolled in {course2.title}.",
    )
    Notification.objects.create(
        recipient=teacher2,
        message=f"{student4.username} has enrolled in {course2.title}.",
    )
    Notification.objects.create(
        recipient=teacher2,
        message=f"{student5.username} has enrolled in {course2.title}.",
    )
    Notification.objects.create(
        recipient=student1, message=f"New material uploaded for {course1.title}."
    )
    Notification.objects.create(
        recipient=student2, message=f"New material uploaded for {course1.title}."
    )
    Notification.objects.create(
        recipient=student3, message=f"New material uploaded for {course1.title}."
    )
    Notification.objects.create(
        recipient=student3, message=f"New material uploaded for {course2.title}."
    )
    Notification.objects.create(
        recipient=student4, message=f"New material uploaded for {course2.title}."
    )
    Notification.objects.create(
        recipient=student5, message=f"New material uploaded for {course2.title}."
    )

    print("Database populated with sample data!")


if __name__ == "__main__":
    populate()
