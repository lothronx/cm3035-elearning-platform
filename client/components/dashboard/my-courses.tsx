"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/contexts/user-context";
import { useState } from "react";
import { CourseFormDialog } from "@/components/courses/course-form-dialog";
import { CourseCard } from "@/components/dashboard/course-card";
import { EmptyCourse } from "@/components/dashboard/empty-course";

interface Course {
  id: number;
  name: string;
  is_active: boolean;
}

interface MyCoursesProps {
  courses: Course[];
  onCreateCourse: (data: { title: string; description: string }) => Promise<void>;
}

export function MyCourses({ courses, onCreateCourse }: MyCoursesProps) {
  const { user } = useUser();
  const isTeacher = user?.role === "teacher";
  const title = isTeacher ? "Teaching" : "Enrolled";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreateCourse = async (data: { title: string; description: string }) => {
    setIsSubmitting(true);
    setError("");

    try {
      await onCreateCourse(data);
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="overflow-hidden border-none bg-background-light shadow-sm transition-all duration-300 ">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-2xl font-medium text-secondary">{title}</CardTitle>
        {isTeacher && courses.length > 0 && (
          <Button
            variant="outline"
            className="bg-secondary text-primary-foreground"
            onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Course
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} isTeacher={isTeacher} />
            ))}
          </div>
        ) : (
          <EmptyCourse isTeacher={isTeacher} onCreateClick={() => setIsModalOpen(true)} />
        )}
      </CardContent>

      <CourseFormDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateCourse}
        isSubmitting={isSubmitting}
        error={error}
        mode="create"
      />
    </Card>
  );
}
