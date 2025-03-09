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

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        // Check if user is authenticated
        const isAuthenticated = await checkAuthStatus();
        if (!isAuthenticated) {
          // Redirect to home page if not authenticated
          handleUnauthorized(router);
          return;
        }

        // Fetch members data
        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/members/`);

        if (!response.ok) {
          // Handle API errors
          if (response.status === 403) {
            setPermissionDenied(true);
            setLoading(false);
            return;
          }
          throw new Error(`Failed to fetch members: ${response.statusText}`);
        }

        const apiData = await response.json();
        // Use our utility function to map API data to application format
        const mappedMembers = mapApiMembersToMembers(apiData);
        setMembers(mappedMembers);
      } catch (error) {
        console.error("Error fetching members:", error);
        setError("Failed to load members. Please try again later.");
        toast.error("Failed to fetch members. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [router]);

  // Permission denied view
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
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Loading members...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-red-500">{error}</p>
          </div>
        ) : members.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">No members found.</p>
          </div>
        ) : (
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
