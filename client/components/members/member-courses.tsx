"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Course } from "@/types/member";
export interface MemberCoursesProps {
  courses: Course[];
  userRole: string;
}
export function MemberCourses({ courses, userRole }: MemberCoursesProps) {
  const title = userRole === "teacher" ? "Teaching" : "Enrolled";

  return (
    <Card className="overflow-hidden border-none bg-background-light shadow-sm transition-all duration-300 dark:bg-slate-900">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-2xl font-medium text-secondary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="group block">
                <Card className="h-full bg-background-light transition-all duration-300 hover:bg-primary/10 hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-start gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <span className="text-base font-medium text-secondary">{course.name}</span>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
            <BookOpen className="mb-2 h-12 w-12 text-primary dark:text-slate-600" />
            <h3 className="text-lg font-medium text-secondary">No courses</h3>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
