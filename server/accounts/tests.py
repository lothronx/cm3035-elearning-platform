from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import User


class UserTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("user-register")
        self.login_url = reverse("user-login")
        self.logout_url = reverse("user-logout")
        self.user_data = {
            "username": "testuser",
            "password": "testpassword",
            "email": "testuser@example.com",
            "first_name": "Test",
            "last_name": "User",
            "role": "student",
        }

    def test_user_registration(self):
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, "testuser")

    def test_user_login(self):
        self.client.post(self.register_url, self.user_data)
        response = self.client.post(
            self.login_url, {"username": "testuser", "password": "testpassword"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_user_logout(self):
        self.client.post(self.register_url, self.user_data)
        login_response = self.client.post(
            self.login_url, {"username": "testuser", "password": "testpassword"}
        )
        token = login_response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + token)
        response = self.client.post(self.logout_url, {"token": token})
        if response.status_code != status.HTTP_205_RESET_CONTENT:
            print("Logout response data:", response.data)  # Debugging line
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)
