import os
import tempfile
from io import BytesIO
from PIL import Image

from django.test import override_settings
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile

from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

import factory
from factory.django import DjangoModelFactory

User = get_user_model()

# ===== FACTORIES =====

class UserFactory(DjangoModelFactory):
    """
    Factory for creating User instances for testing
    """
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f"testuser{n}")
    password = factory.PostGenerationMethodCall('set_password', 'Password@123')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")
    role = 'student'
    status = "I am a test user"


class TeacherFactory(UserFactory):
    """
    Factory for creating Teacher instances
    """
    role = 'teacher'


# ===== TEST CASES =====

class UserRegistrationTests(APITestCase):
    """
    Test user registration functionality
    """
    def setUp(self):
        self.url = reverse('register')
        self.valid_user_data = {
            'username': 'newstudent',
            'password': 'SecurePass123!',
            'first_name': 'John',
            'last_name': 'Doe',
            'role': 'student'
        }
        self.valid_teacher_data = {
            'username': 'newteacher',
            'password': 'SecurePass123!',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'role': 'teacher'
        }
    
    def test_student_registration_success(self):
        """Test successful student registration"""
        response = self.client.post(self.url, self.valid_user_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
        # Verify user was created with correct data
        user = User.objects.get(username='newstudent')
        self.assertEqual(user.first_name, 'John')
        self.assertEqual(user.last_name, 'Doe')
        self.assertEqual(user.role, 'student')
    
    def test_teacher_registration_success(self):
        """Test successful teacher registration"""
        response = self.client.post(self.url, self.valid_teacher_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
        # Verify user was created with correct data
        user = User.objects.get(username='newteacher')
        self.assertEqual(user.role, 'teacher')
    
    def test_registration_invalid_username(self):
        """Test registration with invalid username"""
        # Too short username
        data = self.valid_user_data.copy()
        data['username'] = 'test'  # Less than 6 characters
        
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
        
        # Special characters in username
        data['username'] = 'test@user!'
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
    
    def test_registration_invalid_password(self):
        """Test registration with invalid password"""
        # Too short password
        data = self.valid_user_data.copy()
        data['password'] = 'short'  # Less than 8 characters
        
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
        
        # Password without enough complexity
        data['password'] = 'onlyletters'  # Only letters
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
    
    def test_registration_invalid_name(self):
        """Test registration with invalid name data"""
        data = self.valid_user_data.copy()
        
        # Invalid first name with numbers
        data['first_name'] = 'John123'
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('first_name', response.data)
        
        # Invalid last name with special characters
        data['first_name'] = 'John'
        data['last_name'] = 'Doe@Test'
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('last_name', response.data)
    
    def test_registration_duplicate_username(self):
        """Test registration with existing username"""
        # Create first user
        self.client.post(self.url, self.valid_user_data, format='json')
        
        # Try to create second user with same username
        duplicate_data = self.valid_teacher_data.copy()
        duplicate_data['username'] = self.valid_user_data['username']
        
        response = self.client.post(self.url, duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
        self.assertIn('exist', response.data['username'].lower())


class UserLogoutTests(APITestCase):
    """
    Test user logout functionality
    """
    def setUp(self):
        self.url = reverse('logout')
        self.user = UserFactory()
        self.refresh_token = RefreshToken.for_user(self.user)
    
    def test_logout_success(self):
        """Test successful logout"""
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Logout with valid refresh token
        response = self.client.post(
            self.url, 
            {'refresh': str(self.refresh_token)}, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('detail', response.data)
        self.assertIn('logged out', response.data['detail'].lower())
    
    def test_logout_missing_token(self):
        """Test logout without providing refresh token"""
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Attempt logout without token
        response = self.client.post(self.url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)
        self.assertIn('required', response.data['detail'].lower())
    
    def test_logout_invalid_token(self):
        """Test logout with invalid refresh token"""
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Attempt logout with invalid token
        response = self.client.post(
            self.url, 
            {'refresh': 'invalid-token'}, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)
    
    def test_logout_unauthenticated(self):
        """Test logout without authentication"""
        # No authentication
        response = self.client.post(
            self.url, 
            {'refresh': str(self.refresh_token)}, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DashboardTests(APITestCase):
    """
    Test dashboard functionality
    """
    def setUp(self):
        self.url = reverse('user-dashboard-list')
        self.student = UserFactory()
        self.teacher = TeacherFactory()
    
    def test_dashboard_student(self):
        """Test dashboard access for student"""
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.student.id)
        self.assertEqual(response.data['username'], self.student.username)
        self.assertEqual(response.data['role'], 'student')
        self.assertIn('courses', response.data)
    
    def test_dashboard_teacher(self):
        """Test dashboard access for teacher"""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.teacher.id)
        self.assertEqual(response.data['username'], self.teacher.username)
        self.assertEqual(response.data['role'], 'teacher')
        self.assertIn('courses', response.data)
    
    def test_dashboard_unauthenticated(self):
        """Test dashboard access without authentication"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_update_status(self):
        """Test updating user status"""
        self.client.force_authenticate(user=self.student)
        url = reverse('user-dashboard-patch-status')
        
        response = self.client.patch(url, {'status': 'New status update'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'New status update')
        
        # Verify database updated
        self.student.refresh_from_db()
        self.assertEqual(self.student.status, 'New status update')
    
    def test_update_status_invalid(self):
        """Test updating user status with invalid data"""
        self.client.force_authenticate(user=self.student)
        url = reverse('user-dashboard-patch-status')
        
        # Test with missing status
        response = self.client.patch(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test with non-string status
        response = self.client.patch(url, {'status': 123}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test with too long status
        long_status = 'x' * 300  # More than 255 characters
        response = self.client.patch(url, {'status': long_status}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserPhotoUploadTests(APITestCase):
    """
    Test user photo upload functionality
    """
    def setUp(self):
        self.url = reverse('user-dashboard-patch-photo')
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)
    
    def generate_photo_file(self):
        """Helper to generate a test image file"""
        file = BytesIO()
        image = Image.new('RGB', (100, 100), color='red')
        image.save(file, 'png')
        file.name = 'test.png'
        file.seek(0)
        return SimpleUploadedFile(file.name, file.read(), content_type='image/png')
    
    @override_settings(MEDIA_ROOT=tempfile.mkdtemp())
    def test_upload_photo_success(self):
        """Test successful photo upload"""
        test_photo = self.generate_photo_file()
        
        response = self.client.patch(
            self.url,
            {'photo': test_photo},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('photo', response.data)
        
        # Verify database updated
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.photo)
    
    def test_upload_photo_missing(self):
        """Test photo upload without providing photo"""
        response = self.client.patch(self.url, {}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)
        self.assertIn('no photo', response.data['detail'].lower())


class UserViewSetTests(APITestCase):
    """
    Test UserViewSet functionality
    """
    def setUp(self):
        self.list_url = reverse('members-list')
        self.teacher = TeacherFactory()
        self.student1 = UserFactory()
        self.student2 = UserFactory()
        self.admin = UserFactory(is_staff=True, is_superuser=True)
    
    def test_list_users_as_teacher(self):
        """Test listing users as a teacher"""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Two students, not including admin or self
        
        usernames = [user['username'] for user in response.data]
        self.assertIn(self.student1.username, usernames)
        self.assertIn(self.student2.username, usernames)
        self.assertNotIn(self.teacher.username, usernames)  # Should not include self
        self.assertNotIn(self.admin.username, usernames)  # Should not include admin
    
    def test_list_users_as_student(self):
        """Test listing users as a student (should be denied)"""
        self.client.force_authenticate(user=self.student1)
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_retrieve_user(self):
        """Test retrieving a specific user"""
        self.client.force_authenticate(user=self.teacher)
        url = reverse('members-detail', args=[self.student1.id])
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.student1.id)
        self.assertEqual(response.data['username'], self.student1.username)
        self.assertIn('courses', response.data)
    
    def test_retrieve_admin_user(self):
        """Test retrieving an admin user (should return 404)"""
        self.client.force_authenticate(user=self.teacher)
        url = reverse('members-detail', args=[self.admin.id])
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_search_users(self):
        """Test searching for users"""
        self.client.force_authenticate(user=self.teacher)
        search_url = f"{self.list_url}search/?q={self.student1.first_name}"
        
        response = self.client.get(search_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)
        self.assertEqual(response.data[0]['id'], self.student1.id)
    
    def test_search_users_as_student(self):
        """Test searching for users as a student (should be denied)"""
        self.client.force_authenticate(user=self.student1)
        search_url = f"{self.list_url}search/?q={self.student2.first_name}"
        
        response = self.client.get(search_url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_search_users_empty_query(self):
        """Test searching for users with empty query"""
        self.client.force_authenticate(user=self.teacher)
        search_url = f"{self.list_url}search/?q="
        
        response = self.client.get(search_url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)