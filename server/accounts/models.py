from django.contrib.auth.models import AbstractUser
from django.db import models

# User extends AbstractUser. we will use the build-in fields:
# - username
# - password
# - first_name
# - last_name
# - is_active (didn't really use it as of now)
# and contain the following extra fields:
# - role: Student or Teacher
# - photo: Profile photo
# - status: User status
class User(AbstractUser):
    ROLE_CHOICES = (
        ("student", "Student"),
        ("teacher", "Teacher"),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    photo = models.ImageField(upload_to="profile_photos/", null=True, blank=True)
    status = models.TextField(null=True, blank=True)
