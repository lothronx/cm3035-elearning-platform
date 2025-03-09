from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from courses.models import Course


class APITestBase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Create test user
        cls.user = User.objects.create_user(
            id=1, username="testuser", password="testpass123", role="teacher",
            email="test@example.com", first_name="Test", last_name="User"
        )
        # Create test course
        cls.course = Course.objects.create(
            id=1, title="Test Course", description="Test Course Description", teacher=cls.user
        )
    
    def setUp(self):
        # Get token for authentication
        self.refresh = RefreshToken.for_user(self.user)
        self.access_token = str(self.refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')


class UserAPITests(APITestBase):
    def test_user_registration(self):
        # Clear existing credentials to test as anonymous
        self.client.credentials()
        
        url = reverse("register")
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password2': 'newpass123',  # Confirm password field
            'first_name': 'New',
            'last_name': 'User',
            'role': 'student'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_user_logout(self):
        url = reverse("logout")
        # Include refresh token in request
        data = {'refresh': str(self.refresh)}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class CourseAPITests(APITestBase):
    def test_course_list(self):
        url = reverse("courses-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_course_detail(self):
        url = reverse("courses-detail", args=[self.course.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class NestedCourseAPITests(APITestBase):
    def test_course_materials_list(self):
        url = reverse("course-materials-list", args=[self.course.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_course_feedback_list(self):
        url = reverse("course-feedback-list", args=[self.course.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ChatAPITests(APITestBase):
    def test_chat_list(self):
        url = reverse("chat-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class NotificationAPITests(APITestBase):
    def test_notification_list(self):
        url = reverse("notifications-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
