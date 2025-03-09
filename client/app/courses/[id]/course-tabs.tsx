"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseMaterials } from "@/app/courses/[id]/course-materials";
import { CourseEnrollments } from "@/app/courses/[id]/course-enrollments";
import { CourseFeedback } from "@/app/courses/[id]/course-feedback";
import { FileText, Users, MessageSquare } from "lucide-react";

interface CourseTabsProps {
  courseId: string;
  isCourseTeacher: boolean;
  isEnrolledStudents: boolean;
}

export default function CourseTabs({
  courseId,
  isCourseTeacher,
  isEnrolledStudents,
}: CourseTabsProps) {
  const [activeTab, setActiveTab] = useState("materials");

  return (
    <Tabs
      defaultValue="materials"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full">

      {/* tabs */}
      <TabsList className="grid grid-cols-3 mb-2 w-full bg-background-light ">
        <TabsTrigger value="materials" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Materials</span>
        </TabsTrigger>
        <TabsTrigger value="students" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Students</span>
        </TabsTrigger>
        <TabsTrigger value="feedback" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Feedback</span>
        </TabsTrigger>
      </TabsList>

      {/* tabs content */}
      <TabsContent value="materials" className="mt-0">
        <CourseMaterials courseId={courseId} isCourseTeacher={isCourseTeacher} />
      </TabsContent>
      <TabsContent value="students" className="mt-0">
        <CourseEnrollments courseId={courseId} isCourseTeacher={isCourseTeacher} />
      </TabsContent>
      <TabsContent value="feedback" className="mt-0">
        <CourseFeedback courseId={courseId} isEnrolledStudents={isEnrolledStudents} />
      </TabsContent>
    </Tabs>
  );
}
