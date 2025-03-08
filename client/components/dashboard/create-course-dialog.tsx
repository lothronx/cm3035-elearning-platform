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

interface CreateCourseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; description: string }) => Promise<void>;
  isSubmitting?: boolean;
  error?: string;
}

export function CreateCourseDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  error,
}: CreateCourseDialogProps) {
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setCourseTitle("");
      setCourseDescription("");
    }
  }, [isOpen]);

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
    if (!open) {
      setCourseTitle("");
      setCourseDescription("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="course-title">Course Title</Label>
            <Input
              id="course-title"
              value={courseTitle || ""}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="Enter course title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course-description">Course Description</Label>
            <Textarea
              id="course-description"
              value={courseDescription || ""}
              onChange={(e) => setCourseDescription(e.target.value)}
              placeholder="Enter course description"
              rows={5}
            />
          </div>
        </div>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
