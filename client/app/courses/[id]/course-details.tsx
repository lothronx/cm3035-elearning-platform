"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Edit, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseFormDialog } from "@/components/courses/course-form-dialog";
import { CourseActivationDialog } from "@/components/courses/course-activation-dialog";
import {
  fetchCourse,
  handleActivationToggle,
  handleEdit,
  handleEnroll,
  handleLeave,
  handleComplete,
} from "@/utils/course-utils";

interface Course {
  id: number;
  title: string;
  description: string;
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_enrolled: boolean | null;
  is_completed: boolean | null;
}

interface CourseDetailsProps {
  courseId: string;
  isCourseTeacher: boolean;
  isStudent: boolean;
}

export default function CourseDetails({
  courseId,
  isCourseTeacher,
  isStudent,
}: CourseDetailsProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [formattedCreatedAt, setFormattedCreatedAt] = useState("");
  const [formattedUpdatedAt, setFormattedUpdatedAt] = useState("");

  const loadCourse = async () => {
    setLoading(true);
    try {
      const data = await fetchCourse(courseId);
      setCourse(data);
      setFormattedCreatedAt(format(new Date(data.created_at), "MMM d, yyyy"));
      setFormattedUpdatedAt(format(new Date(data.updated_at), "MMM d, yyyy 'at' h:mm a"));
    } catch (error) {
      console.error("Error fetching course:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const onEnroll = async () => {
    try {
      if (course?.is_enrolled) {
        await handleLeave(courseId);
        toast.success("Successfully left course");
      } else {
        await handleEnroll(courseId);
        toast.success("Successfully enrolled in course");
      }
      // Refresh course data
      await loadCourse();
    } catch (error) {
      toast.error(course?.is_enrolled ? "Failed to leave course" : "Failed to enroll in course");
      console.error("Error updating enrollment:", error);
    }
  };

  const onComplete = async () => {
    try {
      await handleComplete(courseId);
      // Refresh course data
      await loadCourse();
      toast.success(
        course?.is_completed ? "Course marked as incomplete" : "Course marked as complete"
      );
    } catch (error) {
      toast.error("Failed to update course completion status");
      console.error("Error updating completion status:", error);
    }
  };

  const onActivationToggle = async () => {
    try {
      const result = await handleActivationToggle(courseId);
      setCourse((prevCourse) =>
        prevCourse ? { ...prevCourse, is_active: result.is_active } : null
      );
    } catch (error) {
      console.error("Error updating course status:", error);
      toast.error("Failed to update course status");
    }
  };

  const onEdit = async (data: { title: string; description: string }) => {
    try {
      setIsSubmitting(true);
      setFormError(undefined);
      const result = await handleEdit(courseId, data);
      setCourse((prevCourse) => {
        if (!prevCourse) return null;
        return {
          ...prevCourse,
          ...result,
        };
      });
      setEditDialogOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update course");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  if (!course) {
    return null;
  }

  return (
    <>
      <Card className="overflow-hidden border-none bg-background-light shadow-sm transition-all duration-300 dark:bg-slate-900">
        {/* title and description */}
        <CardHeader className="px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-3xl font-bold text-secondary">{course.title}</CardTitle>
                {!course.is_active && (
                  <Badge variant="destructive" className="ml-2">
                    Inactive
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Taught by {course.teacher.first_name} {course.teacher.last_name}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start">

              {/* Enrollment/Leave button, Completion button */}
              {isStudent && (
                <div className="flex gap-2">
                  <Button
                    onClick={onEnroll}
                    size="sm"
                    variant={course.is_enrolled ? "outline" : "default"}>
                    {course.is_enrolled ? "Leave Course" : "Enroll Now"}
                  </Button>
                  {course.is_enrolled && (
                    <Button
                      onClick={onComplete}
                      size="sm"
                      variant={course.is_completed ? "outline" : "default"}>
                      {course.is_completed ? "Mark as Incomplete" : "Mark as Complete"}
                    </Button>
                  )}
                </div>
              )}

              {/* Edit and activation buttons */}
              {isCourseTeacher && (
                <>
                  <Button variant="secondary" onClick={() => setEditDialogOpen(true)} size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <CourseActivationDialog course={course} onActivationToggle={onActivationToggle} />
                </>
              )}
            </div>
          </div>
        </CardHeader>

        {/* course metadata */}
        <CardContent className="px-8">
          <p className="text-muted-foreground">{course.description}</p>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Created {formattedCreatedAt}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Last updated {formattedUpdatedAt}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <CourseFormDialog
        isOpen={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        initialData={{
          title: course.title,
          description: course.description,
        }}
        onSubmit={onEdit}
        isSubmitting={isSubmitting}
        error={formError}
      />
    </>
  );
}
