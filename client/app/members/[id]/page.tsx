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

export default function MemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id;

  const [member, setMember] = useState<Member>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const isAuthenticated = await checkAuthStatus();

        if (!isAuthenticated) {
          handleUnauthorized(router);
        } else {
          const response = await fetchWithAuth(
            `${process.env.NEXT_PUBLIC_API_URL}/api/members/${memberId}/`
          );
          const data = await response.json();

          // Convert API data to our application's Member format
          setMember(mapApiMemberToMember(data));
        }
      } catch (error) {
        console.error(error);
        router.push("/dashboard");
      }
    };

    fetchData();
  }, [memberId]);

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Navbar />
      <Toaster position="bottom-right" />
      <main className="container mx-auto px-4 py-8 pt-24">
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
