"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: number;
  name: string;
  is_active: boolean;
}

interface CourseCardProps {
  course: Course;
  isTeacher: boolean;
}

export function CourseCard({ course, isTeacher }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`} className="group block">
      <div className="rounded-xl border-dashed border-2 border-background bg-background-light p-4 shadow-sm transition-all duration-300 hover:bg-primary/10 hover:shadow-md">
        <div className="mb-3 flex items-center">
          <Badge variant={course.is_active ? "default" : "outline"}>
            {isTeacher
              ? course.is_active
                ? "Active"
                : "Deactivated"
              : course.is_active
              ? "Enrolled"
              : "Completed"}
          </Badge>
        </div>

        <h3 className="text-base font-medium text-secondary group-hover:text-secondary">
          {course.name}
        </h3>
      </div>
    </Link>
  );
}
