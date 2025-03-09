"use client";
import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar/navbar";
import CourseDetails from "@/components/courses/course-details";
import CourseTabs from "@/components/courses/course-tabs";
import { checkAuthStatus, handleUnauthorized } from "@/lib/auth";
import { AccessDenied } from "@/components/access-denied";
import { useUser } from "@/contexts/user-context";
import { fetchCourse } from "@/utils/course-utils"; // Added missing import

export default function CourseDetailPage() {
  // Get the router and params from the Next.js navigation context
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  // Get the current user from the user context
  const { user } = useUser();

  // State variables for user permissions
  const [isCourseTeacher, setIsCourseTeacher] = useState(false); // Is current user the course teacher?
  const [isStudent, setIsStudent] = useState(false); // Is current user a student?
  const [isEnrolledStudents, setIsEnrolledStudents] = useState(false); // Is current user enrolled in course?

  // Error handling states
  const [error, setError] = useState<string | null>(null); // Error message for course loading
  const [permissionDenied, setPermissionDenied] = useState(false); // Access denied flag

  /**
   * Effect hook to load course data and check permissions
   * Runs when courseId or user changes
   */
  useEffect(() => {
    const loadCourse = async () => {
      // Check user authentication
      const isAuthenticated = await checkAuthStatus();

      if (!isAuthenticated) {
        handleUnauthorized(router);
        return;
      }

      try {
        // Fetch course data and update permission states
        const data = await fetchCourse(courseId);
        setIsCourseTeacher(data.teacher.id === user?.id);
        setIsStudent(user?.role === "student");
        setIsEnrolledStudents(data.is_enrolled || false);
      } catch (error) {
        // Handle different error cases
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
  }, [courseId, router, user]);

  // Render access denied page if user doesn't have permission
  if (permissionDenied) {
    return (
      <AccessDenied message="You do not have permission to view this course. This course is currently inactive and can only be accessed by the course teacher." />
    );
  }

  // Render error page if course loading failed
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

  // Main page render with course details and tabs
  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Toaster position="bottom-right" />
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
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
    </div>
  );
}
