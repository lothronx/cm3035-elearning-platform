"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { BookOpen, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CourseCardProps {
  course: {
    id: number;
    title: string;
    description: string;
    teacher: {
      id: number;
      first_name: string;
      last_name: string;
    };
    updated_at: string;
    enrolled_students_count: number;
    is_enrolled: boolean | null;
    is_completed: boolean | null;
  };
  onEnroll: (courseId: number) => void;
  onOpenCourse: (courseId: number) => void;
}

export function CourseCard({ course, onEnroll, onOpenCourse }: CourseCardProps) {
  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <Card
      onClick={() => onOpenCourse(course.id)}
      className="flex flex-col h-full bg-background-light transition-all duration-300 hover:bg-primary/10 hover:shadow-md">
      <CardHeader className="flex flex-row items-start gap-4">
        <div className="bg-primary text-primary-foreground p-3 rounded-full">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-secondary">{course.title}</h3>
          <p className="text-sm text-muted-foreground">
            by {course.teacher.first_name} {course.teacher.last_name}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground">{course.description}</p>
        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground ">
          <Calendar className="h-4 w-4" />
          <span>Updated {formatDate(course.updated_at)}</span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{course.enrolled_students_count.toLocaleString()} students</span>
        </div>
      </CardContent>
      {course.is_enrolled !== null && (
        <CardFooter>
          <Button
            className="w-full disabled:bg-secondary"
            disabled={course.is_enrolled}
            onClick={(e) => {
              e.stopPropagation();
              onEnroll(course.id);
            }}>
            {course.is_enrolled ? (course.is_completed ? "Completed" : "Enrolled") : "Enroll Now"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
