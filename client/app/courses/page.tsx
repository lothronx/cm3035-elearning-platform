"use client";

import { Toaster, toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { CourseCard } from "@/components/courses/course-card";
import { useState } from "react";

// Sample course data
const initialCourses = [
  {
    id: 1,
    icon: "code",
    title: "Introduction to Web Development",
    description: "Learn the fundamentals of HTML, CSS, and JavaScript to build modern websites.",
    teacher: "Sarah Johnson",
    updated_at: "2023-11-15T10:30:00Z",
    studentCount: 1243,
    enrolled: false,
  },
  {
    id: 2,
    icon: "fileText",
    title: "Advanced JavaScript Patterns",
    description:
      "Master advanced JavaScript concepts including closures, prototypes, and design patterns.",
    teacher: "Michael Chen",
    updated_at: "2023-12-01T14:45:00Z",
    studentCount: 856,
    enrolled: true,
  },
  {
    id: 3,
    icon: "bookOpen",
    title: "React for Beginners",
    description: "Start your journey with React and learn to build interactive user interfaces.",
    teacher: "Emily Rodriguez",
    updated_at: "2024-01-10T09:15:00Z",
    studentCount: 2105,
    enrolled: false,
  },
  {
    id: 4,
    icon: "code",
    title: "Full Stack Development with Next.js",
    description: "Build complete web applications with Next.js, React, and Node.js.",
    teacher: "David Wilson",
    updated_at: "2024-02-05T16:20:00Z",
    studentCount: 978,
    enrolled: false,
  },
  {
    id: 5,
    icon: "fileText",
    title: "TypeScript Fundamentals",
    description: "Learn how to use TypeScript to build type-safe JavaScript applications.",
    teacher: "Jessica Lee",
    updated_at: "2024-01-25T11:00:00Z",
    studentCount: 645,
    enrolled: false,
  },
  {
    id: 6,
    icon: "bookOpen",
    title: "UI/UX Design Principles",
    description:
      "Understand the core principles of creating effective and beautiful user interfaces.",
    teacher: "Robert Martinez",
    updated_at: "2023-12-20T13:30:00Z",
    studentCount: 1567,
    enrolled: true,
  },
];

export default function CourseList() {
  const [courses, setCourses] = useState(initialCourses);

  // Function to handle course enrollment
  const handleEnroll = (courseId: number) => {
    setCourses(
      courses.map((course) => (course.id === courseId ? { ...course, enrolled: true } : course))
    );
  };

  const handleOpenCourse = (courseId: number) => {
    console.log("Opening course:", courseId)
    toast.error("Failed to open course. Please try again later.");
  };

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Toaster position="top-right" />
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-2xl font-bold mb-8 text-secondary">Available Courses</h1>
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
    </div>
  );
}
