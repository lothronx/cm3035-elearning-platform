"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { UserX } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CourseEnrollment,
  deleteEnrollments,
  fetchCourseEnrollments,
} from "@/utils/course-enrollments-utils";

interface CourseEnrollmentsProps {
  courseId: string;
  isCourseTeacher: boolean;
}

export function CourseEnrollments({ courseId, isCourseTeacher }: CourseEnrollmentsProps) {
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [, setError] = useState<string>();

  useEffect(() => {
    loadEnrollments();
  }, [courseId]);

  const loadEnrollments = async () => {
    try {
      const data = await fetchCourseEnrollments(courseId);
      setEnrollments(data);
      setSelectedStudents([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load enrollments");
    }
  };

  const handleSelectStudent = (studentId: number) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      }
      return [...prev, studentId];
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === enrollments.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(enrollments.map((e) => e.student.id));
    }
  };

  const handleRemoveSelected = async () => {
    if (!selectedStudents.length) return;

    try {
      setIsLoading(true);
      await deleteEnrollments(courseId, selectedStudents);
      await loadEnrollments();
      setRemoveDialogOpen(false);
      toast.success("Students removed successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove students");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <Card className="overflow-hidden border-none bg-background-light shadow-sm transition-all duration-300 dark:bg-slate-900">
      <CardHeader className="px-8">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-secondary">Enrolled Students</CardTitle>
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
              {isCourseTeacher && (
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Checkbox
                    checked={selectedStudents.length === enrollments.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </div>
              )}
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent hover:text-accent-foreground">
                  <div className="flex items-center space-x-4">
                    {isCourseTeacher && (
                      <Checkbox
                        checked={selectedStudents.includes(enrollment.student.id)}
                        onCheckedChange={() => handleSelectStudent(enrollment.student.id)}
                      />
                    )}
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {getInitials(enrollment.student.first_name, enrollment.student.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/members/${enrollment.student.id}`}
                        className="font-medium hover:underline">
                        {enrollment.student.first_name} {enrollment.student.last_name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        Enrolled on {format(new Date(enrollment.enrolled_at), "MMM d, yyyy")}
                      </p>
                      {enrollment.is_completed && (
                        <p className="text-sm text-green-600">
                          Completed on{" "}
                          {enrollment.completed_at &&
                            format(new Date(enrollment.completed_at), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Remove Students Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Students</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedStudents.length} student
              {selectedStudents.length !== 1 ? "s" : ""} from this course? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveSelected} disabled={isLoading}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
