"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyCourseProps {
  isTeacher: boolean;
  onCreateClick: () => void;
}

export function EmptyCourse({ isTeacher, onCreateClick }: EmptyCourseProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
      <BookOpen className="mb-2 h-12 w-12 text-primary dark:text-slate-600" />
      <h3 className="text-lg font-medium text-secondary">
        {isTeacher ? "No courses created yet" : "No courses yet"}
      </h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {isTeacher
          ? "Create your first course to get started"
          : "Browse and enroll in courses to get started"}
      </p>
      {isTeacher ? (
        <Button
          variant="outline"
          className="mt-4 bg-secondary text-primary-foreground"
          onClick={onCreateClick}>
          Create Course
        </Button>
      ) : (
        <Link href="/courses">
          <Button variant="outline" className="mt-4 bg-secondary text-primary-foreground">
            Browse Courses
          </Button>
        </Link>
      )}
    </div>
  );
}
