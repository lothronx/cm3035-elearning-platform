"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Link href={`/courses/${course.id}`}>
      <Card className="h-full bg-background-light transition-all duration-300 hover:bg-primary/10 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <Badge variant={course.is_active ? "default" : "secondary"}>
            {isTeacher
              ? course.is_active
                ? "Active"
                : "Archived"
              : course.is_active
              ? "Enrolled"
              : "Completed"}
          </Badge>
        </CardHeader>

        <CardTitle className="text-base font-medium text-secondary group-hover:text-secondary px-7">
          {course.name}
        </CardTitle>
      </Card>
    </Link>
  );
}
