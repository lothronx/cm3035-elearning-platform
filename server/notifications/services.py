from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from .models import Notification
from courses.models import Enrollment

User = get_user_model()


def create_notification(recipient, message):
    """
    Create a notification and send it to the recipient via WebSocket

    Args:
        recipient: User who should receive the notification
        message: Content of the notification

    Returns:
        Notification: The created notification object
    """

    # Create notification in the database
    notification = Notification(recipient=recipient, message=message)
    notification.save()

    # Send notification via WebSocket
    channel_layer = get_channel_layer()
    group_name = f"user_{recipient.id}_notifications"

    try:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "notification_message",
                "message": message,
                "notification_id": notification.id,
            },
        )
    except Exception as e:
        raise

    return notification


def create_course_enrollment_notification(enrollment):
    course = enrollment.course
    student = enrollment.student
    teacher = course.teacher

    message = f"{student.get_full_name() or student.username} has enrolled in your course: {course.title}"

    return create_notification(recipient=teacher, message=message)


def create_course_unenrollment_notification(course, student):
    teacher = course.teacher

    message = f"{student.get_full_name() or student.username} has left your course: {course.title}"

    return create_notification(recipient=teacher, message=message)


def create_course_material_notification(course):
    message = f"A new material has been uploaded to your course: {course.title}"
    
    # Create notifications for all enrolled students
    notifications = []
    for enrollment in Enrollment.objects.filter(course=course):
        notifications.append(
            create_notification(recipient=enrollment.student, message=message)
        )

    return notifications
