"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CourseMaterial, fetchCourseMaterials } from "@/utils/course-material-utils";
import { MaterialCard } from "./material-card";
import { MaterialUploadDialog } from "./material-upload-dialog";

interface CourseMaterialsProps {
  courseId: string;
  isCourseTeacher: boolean;
}

export function CourseMaterials({ courseId, isCourseTeacher }: CourseMaterialsProps) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [, setError] = useState<string>();

  useEffect(() => {
    loadMaterials();
  }, [courseId]);

  const loadMaterials = async () => {
    try {
      const data = await fetchCourseMaterials(courseId);
      setMaterials(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load materials");
    }
  };

  return (
    <Card className="overflow-hidden border-none bg-background-light shadow-sm transition-all duration-300 dark:bg-slate-900">
      {/* title and upload button */}
      <CardHeader className="px-8">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-secondary">Course Materials</CardTitle>
          {isCourseTeacher && (
            <MaterialUploadDialog courseId={courseId} onMaterialUploaded={loadMaterials} />
          )}
        </div>
      </CardHeader>

      <CardContent className="px-8">
        {/* materials list */}
        <ScrollArea className="h-[400px] pr-4">
          {materials.length === 0 ? (
            <p className="text-center text-muted-foreground">No materials available</p>
          ) : (
            <div className="space-y-4">
              {materials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  courseId={courseId}
                  isCourseTeacher={isCourseTeacher}
                  onMaterialDeleted={loadMaterials}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
