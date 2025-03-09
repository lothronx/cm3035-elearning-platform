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

    with open("3.jpg", "rb") as f:
        teacher3 = User.objects.create_user(
            username="teacher3",
            email="teacher3@elearning.org",
            password="elearning",
            role="teacher",
            first_name="Bob",
            last_name="Williams",
            photo=File(f),
            status="Teaching Python",
        )
    # Create Students
    with open("4.jpg", "rb") as f:
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

    with open("5.jpg", "rb") as f:
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

    with open("6.jpg", "rb") as f:
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

    with open("7.jpg", "rb") as f:
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

    with open("8.jpg", "rb") as f:
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

    with open("9.jpg", "rb") as f:
        student6 = User.objects.create_user(
            username="student6",
            email="student6@elearning.org",
            password="elearning",
            role="student",
            first_name="Frank",
            last_name="Johnson",
            photo=File(f),
            status="Learning Python",
        )

    with open("10.jpg", "rb") as f:
        student7 = User.objects.create_user(
            username="student7",
            email="student7@elearning.org",
            password="elearning",
            role="student",
            first_name="Grace",
            last_name="Davis",
            photo=File(f),
            status="Learning Go",
        )

    with open("11.jpg", "rb") as f:
        student8 = User.objects.create_user(
            username="student8",
            email="student8@elearning.org",
            password="elearning",
            role="student",
            first_name="Hannah",
            last_name="Miller",
            photo=File(f),
            status="Learning Rust",
        )

    with open("12.jpg", "rb") as f:
        student9 = User.objects.create_user(
            username="student9",
            email="student9@elearning.org",
            password="elearning",
            role="student",
            first_name="Isla",
            last_name="White",
            photo=File(f),
            status="Learning C++",
        )

    with open("13.jpg", "rb") as f:
        student10 = User.objects.create_user(
            username="student10",
            email="student10@elearning.org",
            password="elearning",
            role="student",
            first_name="Jack",
            last_name="Brown",
            photo=File(f),
            status="Learning JS",
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
        teacher=teacher1,
        is_active=True,
    )

    course3 = Course.objects.create(
        title="Data Structures and Algorithms",
        description="Learn data structures and algorithms for efficient problem solving",
        teacher=teacher1,
        is_active=True,
    )
    course4 = Course.objects.create(
        title="Computer Systems",
        description="Learn computer systems and architecture for efficient programming",
        teacher=teacher2,
        is_active=True,
    )
    course5 = Course.objects.create(
        title="Database Management",
        description="Learn database management with SQL and NoSQL databases",
        teacher=teacher2,
        is_active=True,
    )
    course6 = Course.objects.create(
        title="Operating Systems",
        description="Learn operating systems concepts and implementation",
        teacher=teacher2,
        is_active=True,
    )
    course7 = Course.objects.create(
        title="Artificial Intelligence",
        description="Learn artificial intelligence concepts and implementation",
        teacher=teacher3,
        is_active=True,
    )
    course8 = Course.objects.create(
        title="Machine Learning",
        description="Learn machine learning concepts and implementation",
        teacher=teacher3,
        is_active=True,
    )
    course9 = Course.objects.create(
        title="Computer Networks",
        description="Learn computer networks concepts and implementation",
        teacher=teacher3,
        is_active=True,
    )
    course10 = Course.objects.create(
        title="Software Engineering",
        description="Learn software engineering concepts and implementation",
        teacher=teacher1,
        is_active=False,
    )

    # Enroll Students in Courses
    import random

    courses = [
        course1,
        course2,
        course3,
        course4,
        course5,
        course6,
        course7,
        course8,
        course9,
        course10,
    ]
    students = [
        student1,
        student2,
        student3,
        student4,
        student5,
        student6,
        student7,
        student8,
        student9,
        student10,
    ]

    for course in courses:
        num_students = random.randint(3, 7)
        enrolled_students = random.sample(students, num_students)
        for student in enrolled_students:
            Enrollment.objects.create(student=student, course=course)

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

    # Add Chat Messages
    message1 = ChatMessage.objects.create(
        sender=student1,
        receiver=teacher1,
        content="Hi, I saw the syllabus for AWD, when is the next class?",
    )
    message2 = ChatMessage.objects.create(
        sender=teacher1,
        receiver=student1,
        content="Next class is on Friday at 10 AM.",
    )

    # Attach Files to Chat Messages
    with open("awd-syllabus.pdf", "rb") as f:
        FileUpload.objects.create(chat_message=message1, file=File(f))

    print("Database populated with sample data!")


if __name__ == "__main__":
    populate()
