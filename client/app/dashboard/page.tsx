"use client";

import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { PersonalDetails } from "@/components/dashboard/personal-details";
import { MyCourses } from "@/components/dashboard/my-courses";
import { ChatBox } from "@/components/chat-box";
import { useRouter } from "next/navigation";
import { handleUnauthorized, fetchWithAuth, checkAuthStatus } from "@/lib/auth";
import { useUser } from "@/contexts/user-context";

export default function Dashboard() {
  const router = useRouter();
  const { updateUserData } = useUser();

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

        if (!isAuthenticated) {
          handleUnauthorized(router);
          return;
        }
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
        // Update the global user context
        updateUserData(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const updateStatus = async (newStatus: string) => {
    try {
      const isAuthenticated = await checkAuthStatus();

      if (!isAuthenticated) {
        handleUnauthorized(router);
      } else {
        const response = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/patch-status/`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: newStatus }),
          }
        );
        const data = await response.json();

        setUserData((prev) => ({ ...prev, status: data.status }));
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status. Please try again.");
    }
  };

  const updatePhoto = async (file: File): Promise<void> => {
    try {
      const isAuthenticated = await checkAuthStatus();

      if (!isAuthenticated) {
        handleUnauthorized(router);
        return;
      }

      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/patch-photo/`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      setUserData((prev) => ({ ...prev, photo: data.photo }));
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo. Please try again.");
    }
  };

  const createCourse = async (data: { title: string; description: string }): Promise<void> => {
    try {
      const isAuthenticated = await checkAuthStatus();

      if (!isAuthenticated) {
        handleUnauthorized(router);
        return;
      }

      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create course");
      }

      // Fetch updated course list
      const dashboardResponse = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/`
      );
      const dashboardData = await dashboardResponse.json();
      setUserData((prev) => ({ ...prev, courses: dashboardData.courses }));

      toast.success("Course created successfully");
    } catch (error) {
      console.error("Error creating course:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Toaster position="top-right" />
      <Navbar />

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

          {/* My Courses Section */}
          <div className="transition-all duration-300 hover:shadow-md">
            <MyCourses courses={userData.courses} onCreateCourse={createCourse} />
          </div>
        </div>
      </main>

      {/* Chat Box */}
      <ChatBox />
    </div>
  );
}
