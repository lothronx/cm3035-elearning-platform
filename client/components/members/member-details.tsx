"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { ChatButton } from "@/components/members/chat-button";
import { Member } from "@/types/member";
import { Badge } from "@/components/ui/badge";

export interface MemberDetailsProps {
  member: Member;
}

export function MemberDetails({ member }: MemberDetailsProps) {
  return (
    <Card className="overflow-hidden border-none bg-background-light shadow-sm transition-all duration-300 dark:bg-slate-900">
      <CardContent className="p-0">
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row">
          {/* Profile Picture - Left Side */}
          <div className="relative shrink-0">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-slate-100 ring-4 ring-white/50 dark:bg-slate-800 dark:ring-slate-800/50 sm:h-28 sm:w-28">
              <Image
                src={member.photo || "/blank.png"}
                alt="Profile"
                width={112}
                height={112}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Name and Status - Middle */}
          <div className="flex flex-1 flex-col text-center sm:text-left">
            <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-2">
              <h3 className="text-2xl font-medium tracking-tight text-secondary">
                {member.firstName} {member.lastName}
              </h3>
              <Badge variant={member.role == "teacher" ? "default" : "secondary"}>
                {member.role}
              </Badge>
            </div>

            {/* Username */}
            <div className="w-full">
              <p className="text-muted-foreground">@{member.username}</p>
            </div>

            {/* Status */}
            <div className="w-full mt-3">
              <p className="text-sm text-muted-foreground">{member.status}</p>
            </div>
          </div>

          {/* Chat Button - Right Side */}
          <div className="flex items-center">
            <ChatButton userId={member.id} username={`${member.firstName} ${member.lastName}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
