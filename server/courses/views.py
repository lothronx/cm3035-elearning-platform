# from rest_framework import viewsets, status
# from rest_framework.response import Response
# from rest_framework.decorators import action

# from courses.models import Course
# from courses.serializers import CourseSerializer
# from api.permissions import (
#     IsTeacher,
#     IsCourseTeacher,
#     IsAuthenticated,
#     IsCourseTeacherOrEnrolledStudent,
# )


# class CourseViewSet(viewsets.ModelViewSet):
#     serializer_class = CourseSerializer

#     def get_queryset(self):
#         user = self.request.user
#         if user.role == "teacher":
#             return Course.objects.filter(teacher=user)
#         elif user.role == "student":
#             enrolled_courses = Enrollment.objects.filter(student=user).values_list(
#                 "course_id", flat=True
#             )
#             return Course.objects.filter(id__in=enrolled_courses)
#         return Course.objects.none()

#     def get_permissions(self):
#         if self.action in ["create"]:
#             permission_classes = [IsTeacher]
#         elif self.action in ["update", "partial_update", "destroy"]:
#             permission_classes = [IsCourseTeacher]
#         elif self.action in ["list", "retrieve"]:
#             permission_classes = [IsAuthenticated]
#         else:
#             permission_classes = [IsAuthenticated]
#         return [permission() for permission in permission_classes]

#     def perform_create(self, serializer):
#         serializer.save(teacher=self.request.user)


# class CourseMaterialViewSet(viewsets.ModelViewSet):
#     serializer_class = CourseMaterialSerializer

#     def get_queryset(self):
#         course_id = self.kwargs.get("course_id")
#         user = self.request.user

#         if not course_id:
#             return CourseMaterial.objects.none()

#         try:
#             course = Course.objects.get(id=course_id)

#             # Teachers can see their own course materials
#             if user.role == "teacher" and course.teacher == user:
#                 return CourseMaterial.objects.filter(course=course)

#             # Students can see materials for courses they're enrolled in
#             elif (
#                 user.role == "student"
#                 and Enrollment.objects.filter(student=user, course=course).exists()
#             ):
#                 return CourseMaterial.objects.filter(course=course, is_active=True)

#         except Course.DoesNotExist:
#             pass

#         return CourseMaterial.objects.none()

#     def get_permissions(self):
#         if self.action in ["create", "update", "partial_update", "destroy"]:
#             permission_classes = [IsCourseTeacher]
#         elif self.action in ["list", "retrieve"]:
#             permission_classes = [IsCourseTeacherOrEnrolledStudent]
#         else:
#             permission_classes = [IsAuthenticated]
#         return [permission() for permission in permission_classes]

#     def perform_create(self, serializer):
#         course_id = self.kwargs.get("course_id")
#         course = Course.objects.get(id=course_id)
#         serializer.save(course=course)


# class EnrollmentViewSet(viewsets.ModelViewSet):
#     serializer_class = EnrollmentSerializer

#     def get_queryset(self):
#         user = self.request.user

#         if user.role == "teacher":
#             # Teachers can see enrollments for their courses
#             taught_courses = Course.objects.filter(teacher=user).values_list(
#                 "id", flat=True
#             )
#             return Enrollment.objects.filter(course_id__in=taught_courses)
#         elif user.role == "student":
#             # Students can see their own enrollments
#             return Enrollment.objects.filter(student=user)

#         return Enrollment.objects.none()

#     def get_permissions(self):
#         if self.action == "create":
#             # Anyone authenticated can enroll (you might want to restrict this)
#             permission_classes = [IsAuthenticated]
#         elif self.action in ["update", "partial_update"]:
#             # Only teachers of the course can update enrollment status
#             permission_classes = [IsCourseTeacher]
#         elif self.action == "destroy":
#             # Students can unenroll themselves, teachers can remove students
#             permission_classes = [IsOwner | IsCourseTeacher]
#         elif self.action in ["list", "retrieve"]:
#             permission_classes = [IsAuthenticated]
#         else:
#             permission_classes = [IsAuthenticated]
#         return [permission() for permission in permission_classes]
