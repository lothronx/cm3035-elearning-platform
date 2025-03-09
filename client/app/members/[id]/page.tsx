"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar/navbar";
import { Toaster } from "sonner";
import { MemberDetails } from "@/components/members/member-details";
import { MemberCourses } from "@/components/members/member-courses";
import { handleUnauthorized, fetchWithAuth, checkAuthStatus } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Member } from "@/types/member";
import { mapApiMemberToMember } from "@/lib/api-utils";

/**
 * MemberDetailPage component - Displays detailed information about a specific member
 * @returns {JSX.Element} The member detail page UI with member information and courses sections
 */
export default function MemberDetailPage() {
  // Get the Next.js router instance
  const router = useRouter();

  // Get the URL parameters
  const params = useParams();

  // Extract the member ID from the URL parameters
  const memberId = params.id;

  // State for storing member data
  const [member, setMember] = useState<Member>();

  /**
   * Fetch member data when component mounts or memberId changes
   * This effect is used to load the member data from the API when the component is rendered or when the memberId changes
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is authenticated
        const isAuthenticated = await checkAuthStatus();

        if (!isAuthenticated) {
          // Handle unauthorized access by redirecting to login page
          handleUnauthorized(router);
        } else {
          // Fetch member data from API
          const response = await fetchWithAuth(
            `${process.env.NEXT_PUBLIC_API_URL}/api/members/${memberId}/`
          );
          const data = await response.json();

          // Convert API data to our application's Member format
          setMember(mapApiMemberToMember(data));
        }
      } catch (error) {
        // Log any errors that occur during data fetching
        console.error(error);
        // Redirect to dashboard if there's an error
        router.push("/dashboard");
      }
    };

    // Call the fetchData function to start the data fetching process
    fetchData();
  }, [memberId]);

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Navbar />
      <Toaster position="bottom-right" />

      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Check if member data is loaded */}
        {member ? (
          <div className="flex flex-col gap-8">
            <div className="transition-all duration-300 hover:shadow-md">
              <MemberDetails member={member} />
            </div>

            <div className="transition-all duration-300 hover:shadow-md">
              <MemberCourses courses={member.courses || []} userRole={member.role} />
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Loading member data...</p>
          </div>
        )}
      </main>
    </div>
  );
}
