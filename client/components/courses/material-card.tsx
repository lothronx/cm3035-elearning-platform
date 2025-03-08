"use client";

import { format } from "date-fns";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MaterialDeleteDialog } from "./material-delete-dialog";
import { CourseMaterial } from "@/utils/course-material-utils";

interface MaterialCardProps {
  material: CourseMaterial;
  courseId: string;
  isCourseTeacher: boolean;
  onMaterialDeleted: () => void;
}

export function MaterialCard({
  material,
  courseId,
  isCourseTeacher,
  onMaterialDeleted,
}: MaterialCardProps) {
  return (
    <div
      key={material.id}
      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent hover:text-accent-foreground">
      <div className="flex items-center space-x-4">
        <FileText className="h-5 w-5" />
        <div>
          <h4 className="font-medium">{material.title}</h4>
          <p className="text-sm text-muted-foreground">
            Uploaded on {format(new Date(material.uploaded_at), "MMM d, yyyy")}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="hover:bg-background hover:text-foreground">
          <a href={material.file} target="_blank" rel="noopener noreferrer">
            Download
          </a>
        </Button>
        {isCourseTeacher && (
          <MaterialDeleteDialog
            courseId={courseId}
            material={material}
            onMaterialDeleted={onMaterialDeleted}
          />
        )}
      </div>
    </div>
  );
}
