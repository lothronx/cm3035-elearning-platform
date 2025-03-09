import os
import tempfile
from datetime import datetime, timezone
from io import BytesIO
from PIL import Image

from django.test import override_settings
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile

from rest_framework.test import APITestCase
from rest_framework import status

import factory
from factory.django import DjangoModelFactory

from courses.models import Course, CourseMaterial, Enrollment, Feedback
from accounts.tests import UserFactory, TeacherFactory

# ===== FACTORIES =====

class CourseFactory(DjangoModelFactory):
    """
    Factory for creating Course instances for testing
    """
    class Meta:
        model = Course
    
    title = factory.Sequence(lambda n: f"Test Course {n}")
    description = factory.Faker('paragraph')
    teacher = factory.SubFactory(TeacherFactory)
    is_active = True


class CourseMaterialFactory(DjangoModelFactory):
    """
    Factory for creating CourseMaterial instances for testing
    """
    class Meta:
        model = CourseMaterial
    
    course = factory.SubFactory(CourseFactory)
    title = factory.Sequence(lambda n: f"Test Material {n}")
    is_active = True

    @factory.post_generation
    def file(self, create, extracted, **kwargs):
        if not create:
            return

        # Create a test file
        file = BytesIO()
        file.write(b'Test file content')
        file.seek(0)
        self.file = SimpleUploadedFile('test.txt', file.read())


class EnrollmentFactory(DjangoModelFactory):
    """
    Factory for creating Enrollment instances for testing
    """
    class Meta:
        model = Enrollment
    
    student = factory.SubFactory(UserFactory)
    course = factory.SubFactory(CourseFactory)
    is_completed = False


class FeedbackFactory(DjangoModelFactory):
    """
    Factory for creating Feedback instances for testing
    """
    class Meta:
        model = Feedback
    
    student = factory.SubFactory(UserFactory)
    course = factory.SubFactory(CourseFactory)
    comment = factory.Faker('paragraph')


# ===== TEST CASES =====

class CourseTests(APITestCase):
    """
    Test course management functionality
    """
    def setUp(self):
        self.teacher = TeacherFactory()
        self.student = UserFactory()
        self.course = CourseFactory(teacher=self.teacher)
        self.list_url = reverse('courses-list')
        self.detail_url = reverse('courses-detail', args=[self.course.id])
    
    def test_list_courses_as_teacher(self):
        """Test listing courses as a teacher"""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], self.course.title)
    
    def test_list_courses_as_student(self):
        """Test listing courses as a student"""
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('is_enrolled' in response.data[0])
        self.assertFalse(response.data[0]['is_enrolled'])
    
    def test_create_course_as_teacher(self):
        """Test course creation as a teacher"""
        self.client.force_authenticate(user=self.teacher)
        data = {
            'title': 'New Course',
            'description': 'Course description'
        }
        
        response = self.client.post(self.list_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Course.objects.count(), 2)
        self.assertEqual(response.data['title'], 'New Course')
        self.assertEqual(response.data['teacher']['id'], self.teacher.id)
    
    def test_create_course_as_student(self):
        """Test course creation as a student (should be denied)"""
        self.client.force_authenticate(user=self.student)
        data = {
            'title': 'New Course',
            'description': 'Course description'
        }
        
        response = self.client.post(self.list_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_course(self):
        """Test course update by teacher"""
        self.client.force_authenticate(user=self.teacher)
        data = {'title': 'Updated Course'}
        
        response = self.client.patch(self.detail_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Course')
    
    def test_toggle_course_activation(self):
        """Test toggling course activation status"""
        self.client.force_authenticate(user=self.teacher)
        url = reverse('courses-toggle-activation', args=[self.course.id])
        
        response = self.client.patch(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])
    
    def test_search_courses(self):
        """Test course search functionality"""
        self.client.force_authenticate(user=self.student)
        url = f"{self.list_url}search/?q={self.course.title}"
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], self.course.title)


class CourseMaterialTests(APITestCase):
    """
    Test course material functionality
    """
    def setUp(self):
        self.teacher = TeacherFactory()
        self.student = UserFactory()
        self.course = CourseFactory(teacher=self.teacher)
        self.material = CourseMaterialFactory(course=self.course)
        self.enrollment = EnrollmentFactory(student=self.student, course=self.course)
        
        self.list_url = reverse('course-materials-list', args=[self.course.id])
        self.detail_url = reverse('course-materials-detail', 
                                 args=[self.course.id, self.material.id])
    
    def generate_test_file(self):
        """Helper to generate a test file"""
        file = BytesIO()
        file.write(b'Test file content')
        file.seek(0)
        return SimpleUploadedFile('test.txt', file.read())
    
    def test_list_materials_as_teacher(self):
        """Test listing materials as teacher"""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], self.material.title)
    
    def test_list_materials_as_enrolled_student(self):
        """Test listing materials as enrolled student"""
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    @override_settings(MEDIA_ROOT=tempfile.mkdtemp())
    def test_upload_material(self):
        """Test material upload by teacher"""
        self.client.force_authenticate(user=self.teacher)
        
        data = {
            'title': 'New Material',
            'file': self.generate_test_file()
        }
        
        response = self.client.post(self.list_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'success')
    
    def test_delete_material(self):
        """Test material deletion (soft delete)"""
        self.client.force_authenticate(user=self.teacher)
        
        response = self.client.delete(self.detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.material.refresh_from_db()
        self.assertFalse(self.material.is_active)


class EnrollmentTests(APITestCase):
    """
    Test enrollment functionality
    """
    def setUp(self):
        self.teacher = TeacherFactory()
        self.student = UserFactory()
        self.course = CourseFactory(teacher=self.teacher)
        
        self.enroll_url = reverse('student-enrollment-list', args=[self.course.id])
        self.list_url = reverse('course-enrollments-list', args=[self.course.id])
    
    def test_student_enrollment(self):
        """Test student enrolling in a course"""
        self.client.force_authenticate(user=self.student)
        
        response = self.client.post(self.enroll_url)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Enrollment.objects.filter(
            student=self.student, course=self.course
        ).exists())
    
    def test_student_unenrollment(self):
        """Test student unenrolling from a course"""
        enrollment = EnrollmentFactory(student=self.student, course=self.course)
        self.client.force_authenticate(user=self.student)
        
        response = self.client.delete(self.enroll_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Enrollment.objects.filter(id=enrollment.id).exists())
    
    def test_view_enrollments_as_teacher(self):
        """Test viewing course enrollments as teacher"""
        EnrollmentFactory(student=self.student, course=self.course)
        self.client.force_authenticate(user=self.teacher)
        
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['student']['id'], self.student.id)
    
    def test_bulk_unenrollment(self):
        """Test bulk unenrollment by teacher"""
        enrollment = EnrollmentFactory(student=self.student, course=self.course)
        self.client.force_authenticate(user=self.teacher)
        
        response = self.client.delete(
            self.list_url,
            {'student_ids': [self.student.id]},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Enrollment.objects.filter(id=enrollment.id).exists())


class FeedbackTests(APITestCase):
    """
    Test feedback functionality
    """
    def setUp(self):
        self.teacher = TeacherFactory()
        self.student = UserFactory()
        self.course = CourseFactory(teacher=self.teacher)
        self.enrollment = EnrollmentFactory(student=self.student, course=self.course)
        
        self.list_url = reverse('course-feedback-list', args=[self.course.id])
    
    def test_create_feedback(self):
        """Test feedback creation by enrolled student"""
        self.client.force_authenticate(user=self.student)
        data = {'comment': 'Great course!'}
        
        response = self.client.post(self.list_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Feedback.objects.count(), 1)
        self.assertEqual(Feedback.objects.first().comment, 'Great course!')
    
    def test_create_feedback_unenrolled(self):
        """Test feedback creation by unenrolled student"""
        unenrolled_student = UserFactory()
        self.client.force_authenticate(user=unenrolled_student)
        data = {'comment': 'Great course!'}
        
        response = self.client.post(self.list_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_list_feedback(self):
        """Test feedback listing"""
        feedback = FeedbackFactory(student=self.student, course=self.course)
        self.client.force_authenticate(user=self.teacher)
        
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['comment'], feedback.comment)
    
    def test_delete_feedback(self):
        """Test feedback deletion by owner"""
        feedback = FeedbackFactory(student=self.student, course=self.course)
        self.client.force_authenticate(user=self.student)
        
        url = reverse('course-feedback-detail', 
                      args=[self.course.id, feedback.id])
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Feedback.objects.count(), 0)