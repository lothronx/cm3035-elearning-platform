"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar/navbar";
import { MemberDetails } from "@/components/members/member-details";
import { MemberCourses } from "@/components/members/member-courses";
import { handleUnauthorized, fetchWithAuth, checkAuthStatus } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { ChatBox } from "@/components/navbar/chat-box";

export default function MemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id;

  const [memberData, setMemberData] = useState({
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
        } else {
          const memberResponse = await fetchWithAuth(
            `${process.env.NEXT_PUBLIC_API_URL}/api/members/${memberId}/`
          );
          const memberData = await memberResponse.json();

          setMemberData({
            firstName: memberData.first_name,
            lastName: memberData.last_name,
            role: memberData.role,
            photo: memberData.photo,
            status: memberData.status,
            courses: memberData.courses,
          });
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

      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex flex-col gap-8">
          <div className="transition-all duration-300 hover:shadow-md">
            <MemberDetails userData={memberData} />
          </div>

          <div className="transition-all duration-300 hover:shadow-md">
            <MemberCourses courses={memberData.courses} userRole={memberData.role} />
          </div>
        </div>
      </main>
      {/* Chat Box */}
    </div>
  );
}
