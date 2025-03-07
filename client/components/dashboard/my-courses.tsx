"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/contexts/user-context";

interface Course {
  id: number;
  name: string;
  is_active: boolean;
}

interface MyCoursesProps {
  courses: Course[];
}

export function MyCourses({ courses }: MyCoursesProps) {
  const { userRole } = useUser();
  const isTeacher = userRole === "teacher";
  const title = isTeacher ? "Teaching" : "Enrolled";

  return (
    <Card className="overflow-hidden border-none bg-background-light shadow-sm transition-all duration-300 dark:bg-slate-900">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-2xl font-medium text-secondary">{title}</CardTitle>
        {isTeacher && courses.length > 0 && (
          <Link href="/courses/create">
            <Button variant="outline" className="bg-secondary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Create New Course
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="group block">
                <div className="rounded-xl border-dashed border-2 border-background bg-background-light p-4 shadow-sm transition-all duration-300 hover:bg-primary/10 hover:shadow-md ">
                  <div className="mb-3 flex items-center">
                    <Badge variant={course.is_active ? "default" : "outline"}>
                      {isTeacher
                        ? course.is_active
                          ? "Active"
                          : "Deactivated"
                        : course.is_active
                        ? "Enrolled"
                        : "Completed"}
                    </Badge>
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
            <h3 className="text-lg font-medium text-secondary">
              {isTeacher ? "No courses created yet" : "No courses yet"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isTeacher
                ? "Create your first course to get started"
                : "Browse and enroll in courses to get started"}
            </p>
            <Link href={isTeacher ? "/courses/create" : "/courses"}>
              <Button variant="outline" className="mt-4 bg-secondary text-primary-foreground">
                {isTeacher ? "Create Course" : "Browse Courses"}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
