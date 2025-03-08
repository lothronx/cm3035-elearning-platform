"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface CourseFormData {
  title: string;
  description: string;
}

interface CourseFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CourseFormData) => Promise<void>;
  isSubmitting?: boolean;
  error?: string;
  initialData?: CourseFormData;
  mode?: "create" | "edit";
}

export function CourseFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  error,
  initialData,
  mode = "create",
}: CourseFormDialogProps) {
  const [courseTitle, setCourseTitle] = useState(initialData?.title || "");
  const [courseDescription, setCourseDescription] = useState(initialData?.description || "");

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setCourseTitle(initialData.title);
      setCourseDescription(initialData.description);
    }
  }, [initialData]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      if (initialData && mode === "edit") {
        setCourseTitle(initialData.title);
        setCourseDescription(initialData.description);
      } else {
        setCourseTitle("");
        setCourseDescription("");
      }
    }
  }, [isOpen, initialData, mode]);

  const handleSubmit = async () => {
    if (!courseTitle.trim() || !courseDescription.trim()) {
      return;
    }

    await onSubmit({
      title: courseTitle.trim(),
      description: courseDescription.trim(),
    });
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open && mode === "create") {
      setCourseTitle("");
      setCourseDescription("");
    }
  };

  const dialogTitle = mode === "create" ? "Create New Course" : "Edit Course";
  const submitButtonText =
    mode === "create"
      ? isSubmitting
        ? "Creating..."
        : "Create Course"
      : isSubmitting
      ? "Saving..."
      : "Save Changes";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-background-light">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="course-title">Course Title</Label>
            <Input
              id="course-title"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="Enter course title"
              className="bg-background-light"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course-description">Course Description</Label>
            <Textarea
              id="course-description"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              placeholder="Enter course description"
              className="bg-background-light"
              rows={5}
            />
          </div>
        </div>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {submitButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
