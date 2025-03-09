"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CourseActivationDialogProps {
  course: {
    is_active: boolean;
  };
  onActivationToggle: () => void;
}

export function CourseActivationDialog({ course, onActivationToggle }: CourseActivationDialogProps) {
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  return (
    <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={course.is_active ? "destructive" : "default"} size="sm">
          <AlertTriangle className="mr-2 h-4 w-4" />
          {course.is_active ? "Archive" : "Activate"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course.is_active ? "Archive" : "Activate"} Course</DialogTitle>
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
            onClick={onActivationToggle}
          >
            {course.is_active ? "Archive" : "Activate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
