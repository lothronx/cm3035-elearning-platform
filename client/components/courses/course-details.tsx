"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Edit, AlertTriangle, Calendar, Clock } from "lucide-react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CourseFormDialog } from "@/components/courses/course-form-dialog";
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
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
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
      setDeactivateDialogOpen(false);
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
      <Toaster position="bottom-right" />
      <Card className="overflow-hidden border-none bg-background-light shadow-sm transition-all duration-300 dark:bg-slate-900">
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

              {isCourseTeacher && (
                <>
                  <Button variant="secondary" onClick={() => setEditDialogOpen(true)} size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant={course.is_active ? "destructive" : "default"} size="sm">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        {course.is_active ? "Archive" : "Activate"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {course.is_active ? "Archive" : "Activate"} Course
                        </DialogTitle>
                        <DialogDescription>
                          {course.is_active
                            ? "Are you sure you want to archive this course? Other people will no longer be able to access it."
                            : "Are you sure you want to activate this course? Other people will be able to access it."}
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          variant={course.is_active ? "destructive" : "default"}
                          onClick={onActivationToggle}>
                          {course.is_active ? "Archive" : "Activate"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-8">
          <div className="space-y-4">
            <p className="text-muted-foreground">{course.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Created {formattedCreatedAt}
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Last updated {formattedUpdatedAt}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CourseFormDialog
        isOpen={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={onEdit}
        isSubmitting={isSubmitting}
        error={formError}
        initialData={{
          title: course.title,
          description: course.description,
        }}
        mode="edit"
      />
    </>
  );
}
