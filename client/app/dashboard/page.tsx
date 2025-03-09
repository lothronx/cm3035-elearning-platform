"use client";

import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { Navbar } from "@/components/navbar/navbar";
import { PersonalDetails } from "@/components/dashboard/personal-details";
import { MyCourses } from "@/components/dashboard/my-courses";
import { useRouter } from "next/navigation";
import { handleUnauthorized, fetchWithAuth, checkAuthStatus } from "@/lib/auth";

/**
 * Dashboard component - Main dashboard page displaying user information and courses
 * @returns {JSX.Element} The dashboard UI with personal details and course management sections
 */
export default function Dashboard() {
  const router = useRouter();

  // State for storing user data
  const [userData, setUserData] = useState({
    firstName: "", // User's first name
    lastName: "", // User's last name
    username: "", // User's username
    role: "", // User's role (e.g., student, instructor)
    photo: "", // URL of user's profile photo
    status: "", // User's status message
    courses: [], // Array of courses the user is enrolled in
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is authenticated
        const isAuthenticated = await checkAuthStatus();

        if (!isAuthenticated) {
          handleUnauthorized(router);
          return;
        }

        // Fetch dashboard data from API
        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/`);
        const data = await response.json();

        // Update state with fetched data
        setUserData({
          firstName: data.first_name,
          lastName: data.last_name,
          username: data.username,
          role: data.role,
          photo: data.photo,
          status: data.status,
          courses: data.courses,
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  /**
   * Updates the user's status
   * @param {string} newStatus - The new status message
   */
  const updateStatus = async (newStatus: string) => {
    try {
      const isAuthenticated = await checkAuthStatus();

      if (!isAuthenticated) {
        handleUnauthorized(router);
      } else {
        // Send PATCH request to update status
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

        // Update local state with new status
        setUserData((prev) => ({ ...prev, status: data.status }));
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status. Please try again.");
    }
  };

  /**
   * Updates the user's profile photo
   * @param {File} file - The new profile photo file
   */
  const updatePhoto = async (file: File): Promise<void> => {
    try {
      const isAuthenticated = await checkAuthStatus();

      if (!isAuthenticated) {
        handleUnauthorized(router);
        return;
      }

      // Prepare form data for file upload
      const formData = new FormData();
      formData.append("photo", file);

      // Send PATCH request to update photo
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

      // Update local state with new photo URL
      const data = await response.json();
      setUserData((prev) => ({ ...prev, photo: data.photo }));
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo. Please try again.");
    }
  };

  /**
   * Creates a new course
   * @param {Object} data - Course data containing title and description
   */
  const createCourse = async (data: { title: string; description: string }): Promise<void> => {
    try {
      const isAuthenticated = await checkAuthStatus();

      if (!isAuthenticated) {
        handleUnauthorized(router);
        return;
      }

      // Send POST request to create new course
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

      // Fetch updated course list after successful creation
      const dashboardResponse = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/`
      );
      const dashboardData = await dashboardResponse.json();
      setUserData((prev) => ({ ...prev, courses: dashboardData.courses }));

      toast.success("Course created successfully");
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error("Failed to create course. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Toaster position="bottom-right" />
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
    </div>
  );
}
