"use client";

import * as React from "react";
import { CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { CourseResult } from "@/types/search";

interface SearchCourseItemProps {
  course: CourseResult;
  onSelect: (courseId: number) => void;
}

/**
 * Renders a single course search result
 */
export function SearchCourseItem({ course, onSelect }: SearchCourseItemProps) {
  const handleSelect = React.useCallback(() => {
    onSelect(course.id);
  }, [course.id, onSelect]);

  return (
    <div>
      <CommandItem
        value={`course-${course.id}-${course.title}`}
        onSelect={handleSelect}
        className="flex items-center justify-between cursor-pointer">
        <div className="flex-1">
          <p className="font-medium">{course.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
        </div>
        {!course.is_active && <Badge variant="destructive">Inactive</Badge>}
      </CommandItem>
    </div>
  );
}
