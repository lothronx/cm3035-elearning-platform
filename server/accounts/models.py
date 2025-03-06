from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ("student", "Student"),
        ("teacher", "Teacher"),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    photo = models.ImageField(upload_to="profile_photos/", null=True, blank=True)
    status = models.TextField(null=True, blank=True)
