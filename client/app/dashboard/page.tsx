"use client"

import { useState, useEffect } from "react"
import { Toaster } from "sonner"
import { DashboardNavbar } from "@/components/dashboard/navbar"
import { PersonalDetails } from "@/components/dashboard/personal-details"
import { EnrolledCourses } from "@/components/dashboard/enrolled-courses"
import { ChatBox } from "@/components/dashboard/chat-box"

// Mock user data - in a real app, this would come from an API
const mockUserData = {
  firstName: "John",
  lastName: "Doe",
  profilePicture: "/placeholder.svg?height=200&width=200",
  status: "Learning new things every day!",
  enrolledCourses: [
    { id: 1, name: "Introduction to React" },
    { id: 2, name: "Advanced JavaScript" },
    { id: 3, name: "Web Design Fundamentals" },
    { id: 4, name: "Data Structures and Algorithms" },
  ],
}

export default function StudentDashboard() {
  const [userData, setUserData] = useState(mockUserData)

  // In a real app, fetch user data from API
  useEffect(() => {
    // Fetch user data
    // Example: const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`)
  }, [])

  const updateStatus = (newStatus: string) => {
    setUserData((prev) => ({ ...prev, status: newStatus }))
    // In a real app, you would also update this on the server
  }

  const updateProfilePicture = (newPictureUrl: string) => {
    setUserData((prev) => ({ ...prev, profilePicture: newPictureUrl }))
    // In a real app, you would also update this on the server
  }

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
              onProfilePictureUpdate={updateProfilePicture}
            />
          </div>

          {/* Enrolled Courses Section */}
          <div className="transition-all duration-300 hover:shadow-md">
            <EnrolledCourses courses={userData.enrolledCourses} />
          </div>
        </div>
      </main>

      {/* Chat Box */}
      <ChatBox />
    </div>
  )
}

