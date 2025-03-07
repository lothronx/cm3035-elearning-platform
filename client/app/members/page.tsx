"use client";

import { Navbar } from "@/components/navbar";
import { Toaster } from "sonner";
import { MemberCard } from "@/components/members/member-card";

// Mock data with longer status descriptions
const members = [
  {
    id: "1",
    firstName: "Alex",
    lastName: "Johnson",
    username: "alexj",
    status:
      "Currently working on a new design system for our product dashboard. Available for collaboration.",
    imageUrl: "/placeholder.svg?height=100&width=100",
    role: "teacher",
  },
  {
    id: "2",
    firstName: "Sarah",
    lastName: "Parker",
    username: "sarahp",
    status: "Out of office until next Monday. Will respond to messages when I return.",
    imageUrl: "/placeholder.svg?height=100&width=100",
    role: "student",
  },
  {
    id: "3",
    firstName: "Michael",
    lastName: "Chen",
    username: "michaelc",
    status: "Focused on the Q3 project deliverables. Please only contact for urgent matters.",
    imageUrl: "/placeholder.svg?height=100&width=100",
    role: "student",
  },
  {
    id: "4",
    firstName: "Jessica",
    lastName: "Williams",
    username: "jessicaw",
    status: "Open to new project opportunities. Specializing in user research and UX design.",
    imageUrl: "/placeholder.svg?height=100&width=100",
    role: "student",
  },
  {
    id: "5",
    firstName: "David",
    lastName: "Miller",
    username: "davidm",
    status: "Taking a sabbatical until September. Will check messages occasionally.",
    imageUrl: "/placeholder.svg?height=100&width=100",
    role: "student",
  },
  {
    id: "6",
    firstName: "Emma",
    lastName: "Davis",
    username: "emmad",
    status: "Looking for team members for a new mobile app project. DM me if interested!",
    imageUrl: "/placeholder.svg?height=100&width=100",
    role: "student",
  },
  {
    id: "7",
    firstName: "James",
    lastName: "Wilson",
    username: "jamesw",
    status:
      "Currently mentoring junior developers. Happy to answer questions about backend development.",
    imageUrl: "/placeholder.svg?height=100&width=100",
    role: "student",
  },
  {
    id: "8",
    firstName: "Olivia",
    lastName: "Brown",
    username: "oliviab",
    status:
      "Working remotely from Bali for the next month. Response times may be delayed due to time zone differences.",
    imageUrl: "/placeholder.svg?height=100&width=100",
    role: "student",
  },
];

export default function MembersPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Toaster position="top-right" />
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-2xl font-bold mb-8 text-secondary">Members Directory</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
}
