"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { deleteEnrollments, fetchCourseEnrollments } from "@/utils/course-enrollments-utils";
import { EnrollmentCard } from "@/components/courses/enrollment-card";
import { EnrollmentRemoveDialog } from "@/components/courses/enrollment-remove-dialog";
import { UserX } from "lucide-react";

interface CourseEnrollment {
  id: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
  };
  enrolled_at: string;
  is_completed: boolean;
  completed_at?: string;
}

interface CourseEnrollmentsProps {
  courseId: string;
  isCourseTeacher: boolean;
}

export function CourseEnrollments({ courseId, isCourseTeacher }: CourseEnrollmentsProps) {
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const fetchEnrollments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchCourseEnrollments(courseId);
      setEnrollments(
        data.map((enrollment) => ({
          ...enrollment,
          id: enrollment.id.toString(),
          student: {
            ...enrollment.student,
            id: enrollment.student.id.toString(),
          },
          completed_at: enrollment.completed_at ?? undefined,
        }))
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch enrollments");
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleSelectStudent = useCallback((studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  }, []);

  const handleSelectAll = () => {
    if (selectedStudents.length === enrollments.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(enrollments.map((e) => e.student.id));
    }
  };

  const handleRemoveStudents = async () => {
    try {
      setIsLoading(true);
      await deleteEnrollments(
        courseId,
        selectedStudents.map((id) => Number(id))
      );
      await fetchEnrollments();
      setRemoveDialogOpen(false);
      toast.success("Students removed successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove students");
    } finally {
      setIsLoading(false);
      setRemoveDialogOpen(false);
      setSelectedStudents([]);
    }
  };

  return (
    <Card className="overflow-hidden border-none bg-background-light shadow-sm transition-all duration-300 dark:bg-slate-900">
      {/* title */}
      <CardHeader className="px-8">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-secondary">Enrolled Students</CardTitle>

          {/* Remove button */}
          {isCourseTeacher && selectedStudents.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setRemoveDialogOpen(true)}
              disabled={isLoading}
              className="hover:bg-destructive/90">
              <UserX className="mr-2 h-4 w-4" />
              Remove Selected ({selectedStudents.length})
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-8">
        <ScrollArea className="h-[400px] pr-4">
          {enrollments.length === 0 ? (
            <p className="text-center text-muted-foreground">No students enrolled</p>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              {isCourseTeacher && (
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Checkbox
                    checked={selectedStudents.length === enrollments.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </div>
              )}

              {/* Enrollment Cards */}
              {enrollments.map((enrollment) => (
                <EnrollmentCard
                  key={enrollment.id}
                  enrollment={enrollment}
                  isCourseTeacher={isCourseTeacher}
                  selectedStudents={selectedStudents}
                  handleSelectStudent={handleSelectStudent}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* remove dialog */}
      <EnrollmentRemoveDialog
        removeDialogOpen={removeDialogOpen}
        setRemoveDialogOpen={setRemoveDialogOpen}
        handleRemoveStudents={handleRemoveStudents}
        selectedStudents={selectedStudents}
        isLoading={isLoading}
      />
    </Card>
  );
}
