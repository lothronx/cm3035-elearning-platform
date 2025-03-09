"use client";

import { Navbar } from "@/components/navbar/navbar";
import { Toaster, toast } from "sonner";
import { MemberCard } from "@/components/members/member-card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { checkAuthStatus, fetchWithAuth, handleUnauthorized } from "@/lib/auth";
import { AccessDenied } from "@/components/access-denied";
import { Member } from "@/types/member";
import { mapApiMembersToMembers } from "@/lib/api-utils";

/**
 * MembersPage component - Displays a directory of all members in the system
 * @returns {JSX.Element} The members directory page UI with member cards and loading/error states
 */
export default function MembersPage() {
  // Get the Next.js router instance
  const router = useRouter();

  // State variables
  const [members, setMembers] = useState<Member[]>([]); // Array of members
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error message
  const [permissionDenied, setPermissionDenied] = useState(false); // Permission denied state

  /**
   * Fetch members data on component mount
   * This effect is triggered when the component is mounted and whenever the router changes
   */
  useEffect(() => {
    const fetchMembers = async () => {
      // Set loading state to true
      setLoading(true);
      try {
        // Check if user is authenticated
        const isAuthenticated = await checkAuthStatus();
        if (!isAuthenticated) {
          // Redirect to home page if not authenticated
          handleUnauthorized(router);
          return;
        }

        // Fetch members data from API
        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/members/`);

        if (!response.ok) {
          // Handle API errors
          if (response.status === 403) {
            // Set permission denied state to true
            setPermissionDenied(true);
            setLoading(false);
            return;
          }
          // Throw an error with a custom message
          throw new Error(`Failed to fetch members: ${response.statusText}`);
        }

        // Process and map API data to our application's format
        const apiData = await response.json();
        const mappedMembers = mapApiMembersToMembers(apiData);
        // Update the members state with the fetched data
        setMembers(mappedMembers);
      } catch (error) {
        // Log the error and display an error message
        console.error("Error fetching members:", error);
        setError("Failed to load members. Please try again later.");
        toast.error("Failed to fetch members. Please try again.");
      } finally {
        // Set loading state to false
        setLoading(false);
      }
    };

    // Call the fetchMembers function
    fetchMembers();
  }, [router]);

  // Render access denied view if permissions are insufficient
  if (permissionDenied) {
    return (
      <AccessDenied message="You do not have permission to view this page. This feature is only available to teachers." />
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Toaster position="bottom-right" />
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-2xl font-bold mb-8 text-secondary">Members Directory</h1>

        {loading ? (
          // Loading state
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Loading members...</p>
          </div>
        ) : error ? (
          // Error state
          <div className="flex justify-center items-center h-64">
            <p className="text-red-500">{error}</p>
          </div>
        ) : members.length === 0 ? (
          // Empty state
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">No members found.</p>
          </div>
        ) : (
          // Success state - display member cards
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
