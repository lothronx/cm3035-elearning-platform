"use client";

import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { PersonalDetails } from "@/components/dashboard/personal-details";
import { EnrolledCourses } from "@/components/dashboard/enrolled-courses";
import { ChatBox } from "@/components/dashboard/chat-box";

export default function StudentDashboard() {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    role: "",
    photo: "",
    status: "",
    courses: [],
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        setUserData({
          firstName: data.first_name,
          lastName: data.last_name,
          role: data.role,
          photo: data.photo,
          status: data.status,
          courses: data.courses,
        });
        console.log(data.courses);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserData();
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
