"use client";

import { Button } from "@/components/ui/button";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Course {
  id: number;
  name: string;
  progress?: number;
  lastAccessed?: Date;
}

interface EnrolledCoursesProps {
  courses: Course[];
}

export function EnrolledCourses({ courses }: EnrolledCoursesProps) {
  return (
    <Card className="overflow-hidden border-none bg-background-light shadow-sm transition-all duration-300 dark:bg-slate-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium text-secondary">My Courses</CardTitle>
      </CardHeader>
      <CardContent>
        {courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="group block">
                <div className="rounded-xl border border-slate-200 bg-background p-4 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary/30">
                  <div className="mb-3 flex items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <BookOpen className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-medium text-secondary group-hover:text-secondary">
                    {course.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
            <BookOpen className="mb-2 h-12 w-12 text-primary dark:text-slate-600" />
            <h3 className="text-lg font-medium text-secondary">No courses yet</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Browse and enroll in courses to get started
            </p>
            <Button variant="outline" className="mt-4 bg-secondary text-primary-foreground">
              Browse Courses
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
