"use client";

import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { PersonalDetails } from "@/components/dashboard/personal-details";
import { EnrolledCourses } from "@/components/dashboard/enrolled-courses";
import { ChatBox } from "@/components/dashboard/chat-box";
import { useRouter } from "next/navigation";
import { handleUnauthorized, fetchWithAuth, checkAuthStatus } from "@/lib/auth";

export default function StudentDashboard() {
  const router = useRouter();

  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    role: "",
    photo: "",
    status: "",
    courses: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const isAuthenticated = await checkAuthStatus();
        console.log("isAuthenticated", isAuthenticated);
        if (!isAuthenticated) {
          handleUnauthorized(router);
        } else {
          const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/`);
          const data = await response.json();

          setUserData({
            firstName: data.first_name,
            lastName: data.last_name,
            role: data.role,
            photo: data.photo,
            status: data.status,
            courses: data.courses,
          });
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const updateStatus = (newStatus: string) => {
    setUserData((prev) => ({ ...prev, status: newStatus }));
    // In a real app, you would also update this on the server
  };

  const updatePhoto = (newPictureUrl: string) => {
    setUserData((prev) => ({ ...prev, photo: newPictureUrl }));
    // In a real app, you would also update this on the server
  };

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Toaster position="top-right" />
      <DashboardNavbar />

      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex flex-col gap-8">
          {/* Personal Details Section */}
          <div className="transition-all duration-300 hover:shadow-md">
            <PersonalDetails
              userData={userData}
              onStatusUpdate={updateStatus}
              onPhotoUpdate={updatePhoto}
            />
          </div>

          {/* Enrolled Courses Section */}
          <div className="transition-all duration-300 hover:shadow-md">
            <EnrolledCourses courses={userData.courses} />
          </div>
        </div>
      </main>

      {/* Chat Box */}
      <ChatBox />
    </div>
  );
}
