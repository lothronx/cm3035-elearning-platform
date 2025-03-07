"use client";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/navbar";
import { ChatBox } from "@/components/chat-box";
import CourseDetails from "@/components/courses/course-details";
import CourseTabs from "@/components/courses/course-tabs";

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Toaster position="top-right" />
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
          <div className="space-y-8">
            <CourseDetails courseId={courseId} />
            <CourseTabs courseId={courseId} />
          </div>
        </Suspense>
      </div>
      <ChatBox />
    </div>
  );
}
