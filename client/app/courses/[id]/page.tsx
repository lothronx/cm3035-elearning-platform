"use client";
import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ChatBox } from "@/components/chat-box";
import CourseDetails from "@/components/courses/course-details";
import CourseTabs from "@/components/courses/course-tabs";
import { checkAuthStatus, handleUnauthorized } from "@/lib/auth";
import { AccessDenied } from "@/components/access-denied";
import { useUser } from "@/contexts/user-context";
import { fetchCourse } from "@/utils/course-utils";

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { userRole, userID } = useUser();
  const [isCourseTeacher, setIsCourseTeacher] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [isEnrolledStudents, setIsEnrolledStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    const loadCourse = async () => {
      const isAuthenticated = await checkAuthStatus();

      if (!isAuthenticated) {
        handleUnauthorized(router);
        return;
      }

      try {
        const data = await fetchCourse(courseId);
        setIsCourseTeacher(data.teacher.id === userID);
        setIsStudent(userRole === "student");
        setIsEnrolledStudents(data.is_enrolled || false);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "permission_denied") {
            setPermissionDenied(true);
          } else if (error.message === "course_not_found") {
            setError("This course doesn't exist");
          } else {
            setError("Failed to load course. Please try again later.");
            toast.error("Failed to fetch course details. Please try again.");
          }
        }
        console.error("Error fetching course:", error);
      }
    };

    loadCourse();
  }, [courseId, router, userID, userRole]);

  if (permissionDenied) {
    return (
      <AccessDenied message="You do not have permission to view this course. This course is currently inactive and can only be accessed by the course teacher." />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background dark:bg-slate-950">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex justify-center items-center h-64">
            <p className="text-destructive text-2xl">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Toaster position="top-right" />
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-16">
        <div className="space-y-8">
          <CourseDetails
            courseId={courseId}
            isCourseTeacher={isCourseTeacher}
            isStudent={isStudent}
          />
          {(isEnrolledStudents || isCourseTeacher) && (
            <CourseTabs
              courseId={courseId}
              isCourseTeacher={isCourseTeacher}
              isEnrolledStudents={isEnrolledStudents}
            />
          )}
        </div>
      </div>
      <ChatBox />
    </div>
  );
}
