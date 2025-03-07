"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";

interface MemberDetailsProps {
  userData: {
    firstName: string;
    lastName: string;
    role: string;
    photo: string;
    status: string;
  };
}

export function MemberDetails({ userData }: MemberDetailsProps) {
  const router = useRouter();
  const { firstName, lastName } = useUser();
  const isOwnProfile = firstName === userData.firstName && lastName === userData.lastName;

  return (
    <Card className="overflow-hidden border-none bg-background-light shadow-sm transition-all duration-300 dark:bg-slate-900">
      <CardContent className="p-0">
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row">
          {/* Profile Picture - Left Side */}
          <div className="relative shrink-0">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-slate-100 ring-4 ring-white/50 dark:bg-slate-800 dark:ring-slate-800/50 sm:h-28 sm:w-28">
              <Image
                src={userData.photo || "/blank.png"}
                alt="Profile"
                width={112}
                height={112}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Name and Status - Middle */}
          <div className="flex flex-1 flex-col gap-3 text-center sm:text-left">
            <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-2">
              <h3 className="text-2xl font-medium tracking-tight text-secondary">
                {userData.firstName} {userData.lastName}
              </h3>
              <span className="mt-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground sm:mt-0">
                {userData.role}
              </span>
            </div>

            {/* Status */}
            <div className="w-full">
              <p className="text-sm text-slate-600 dark:text-slate-300">{userData.status}</p>
            </div>
          </div>

          {/* Chat Button - Right Side */}
          {!isOwnProfile && (
            <div className="flex items-center">
              <Button
                onClick={() =>
                  router.push(
                    `/chat/${userData.firstName.toLowerCase()}-${userData.lastName.toLowerCase()}`
                  )
                }
                variant="outline"
                className="bg-secondary text-primary-foreground hover:bg-secondary/90">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat with me
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
