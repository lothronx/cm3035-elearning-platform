"use client";

import { Toaster, toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { CourseCard } from "@/components/courses/course-card";
import { useEffect, useState } from "react";
import { ChatBox } from "@/components/chat-box";
import { useRouter } from "next/navigation";
import { handleUnauthorized, fetchWithAuth, checkAuthStatus } from "@/lib/auth";

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  teacher: Teacher;
  updated_at: string;
  enrolled_students_count: number;
  is_enrolled: boolean | null;
  is_completed: boolean | null;
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const isAuthenticated = await checkAuthStatus();

      if (!isAuthenticated) {
        handleUnauthorized(router);
        return;
      }

      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/`);
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      toast.error("Failed to load courses. Please try again later.");
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle course enrollment
  const handleEnroll = async (courseId: number) => {
    try {
      const isAuthenticated = await checkAuthStatus();

      if (!isAuthenticated) {
        handleUnauthorized(router);
        return;
      }

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/enroll/`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to enroll in course");
      }

      // Refresh courses after enrollment
      await fetchCourses();
      toast.success("Successfully enrolled in course!");
    } catch (error) {
      toast.error("Failed to enroll in course. Please try again later.");
      console.error("Error enrolling in course:", error);
    }
  };

  const handleOpenCourse = (courseId: number) => {
    window.location.href = `/courses/${courseId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-slate-950">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Toaster position="top-right" />
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-2xl font-bold mb-8 text-secondary">All Courses</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEnroll={handleEnroll}
              onOpenCourse={handleOpenCourse}
            />
          ))}
        </div>
      </div>
      <ChatBox />
    </div>
  );
}
