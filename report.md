# Report: eLearning Web Application

CM3035 - Advanced Web Development

Student Name: Yue Wu

Date: March 10, 2025

## 1. Introduction

Brief overview of the project's purpose and scope.
Key objectives:
Develop a Django-based eLearning platform with user roles (students/teachers).
Implement RESTful APIs, WebSocket communication, and real-time features.
Demonstrate mastery of Django, Celery, Django Channels, authentication, and database design.

## 2. Application Design and Implementation

## 2.1 Database Schema

Models and Relationships :
Describe User (custom user model), Student, Teacher, Course, Enrollment, Feedback, StatusUpdate, CourseMaterial, and ChatMessage models.
Include an ER diagram (e.g., using draw.io ) to visualize relationships.
Normalization : Explain how you avoided redundancy (e.g., separating CourseMaterial from Course).

## 2.2 User Authentication and Permissions

How users register/login (Django’s built-in auth + custom roles).
Role-based access control:
Teachers can create courses, view enrolled students, and block users.
Students can enroll in courses, leave feedback, and post status updates.

## 2.3 REST API

Endpoints for user data (e.g., /api/users/, /api/courses/).
Use of Django REST Framework (serializers, viewsets, permissions).
Example API request/response (e.g., retrieving course details).

## 2.4 Real-Time Features (WebSockets)

Chat System :
Implementation using Django Channels (consumers, routing).
How WebSocket connections handle real-time messaging between users.
Notifications:
Student enrollment notifications for teachers.
Course material updates for students.

## 2.5 Additional Features

Course enrollment workflow.
Feedback system for courses.
Status updates on user profiles.
File uploads for course materials (PDFs/images).

## 3. Technical Implementation

## 3.1 Key Code Snippets

Highlight critical code sections (e.g., WebSocket consumer, REST API serializer, model methods).
Example:

Example: WebSocket consumer for chat

class ChatConsumer(AsyncWebsocketConsumer):
async def connect(self):
self.room_name = self.scope['url_route']['kwargs']['course_id']
await self.channel_layer.group_add(self.room_name, self.channel_name)
await self.accept()

## 3.2 Testing

Unit Tests : Describe tests for models, views, and APIs (e.g., test_course_creation, test_student_enrollment).
Test Coverage : Tools used (e.g., pytest, Django’s test client).
Instructions to run tests:
bash
复制
1
python manage.py test

## 3.3 Challenges and Solutions

Example:
Challenge : Real-time notifications for course updates.
Solution : Used Celery for asynchronous tasks + Django Channels for WebSocket communication.

## 4. Critical Evaluation

## 4.1 Strengths

Robust role-based access control.
Scalable WebSocket implementation for real-time features.
Clean REST API design.

## 4.2 Weaknesses

Limited WebSocket features (e.g., no audio/video streaming).
Minimal frontend styling (if applicable).

## 4.3 Future Improvements

Add a whiteboard feature for teachers.
Implement automated grading for assignments.

## 5. Setup and Usage Instructions

## 5.1 Installation

For frontend, run:

```bash
cd client
npm install
npm run dev
```

For backend, this project is using:

Please open another terminal and run:

```bash
cd server
conda create --name elearning-project python=3.12.9
conda activate elearning-project
pip install -r requirements.txt
daphne -b 0.0.0.0 -p 8000 elearning.asgi:application
```

To run unit tests, open another terminal and run:

```bash
cd server
coverage run manage.py test
coverage report
```

## 5.2 Running the App

Start Django server:
bash
复制
1
python manage.py runserver
Start Redis/Celery:
bash
复制
1
2
redis-server
celery -A elearning worker --loglevel=info

## 5.3 Login Credentials

Admin: admin / password
Teacher: teacher1 / elearning
Student: student1 / elearning

## 6. Conclusion

Summary of achievements (e.g., met all R1-R5 requirements).
Key learning outcomes (Django Channels, REST APIs, database design).

## 7. Appendices

## 7.1 Appendix A: Full ER diagram

![ERD](ERD.jpg)

## 7.2 Appendix B: Test results/output.

## 7.3 Appendix C: requirements.txt contents.
