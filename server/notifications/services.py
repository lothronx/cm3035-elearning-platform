from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from .models import Notification

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
    
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "notification_message",
            "message": message,
            "notification_id": notification.id
        }
    )
    
    return notification


def create_course_enrollment_notification(enrollment):
    """
    Create a notification for the teacher when a student enrolls in their course
    
    Args:
        enrollment: Enrollment object
        
    Returns:
        Notification: The created notification object
    """
    course = enrollment.course
    student = enrollment.student
    teacher = course.teacher
    
    message = f"{student.get_full_name() or student.username} has enrolled in your course: {course.title}"
    
    return create_notification(recipient=teacher, message=message)
