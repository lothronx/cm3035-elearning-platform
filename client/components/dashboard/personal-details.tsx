"use client";

import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UpdatePhotoDialog } from "./update-photo-dialog";
import { Status } from "./status";

interface PersonalDetailsProps {
  userData: {
    firstName: string;
    lastName: string;
    role: string;
    photo: string;
    status: string;
  };
  onStatusUpdate: (newStatus: string) => void;
  onPhotoUpdate: (file: File) => Promise<void>;
}

export function PersonalDetails({ userData, onStatusUpdate, onPhotoUpdate }: PersonalDetailsProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <Card className="overflow-hidden border-none bg-background-light shadow-sm transition-all duration-300 dark:bg-slate-900">
      <CardContent className="p-0">
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row">
          {/* Profile Picture - Left Side */}
          <div className="relative shrink-0">
            <Avatar className="h-28 w-28 ring-4 ring-white/50 transition-all duration-300 hover:ring-primary/20 dark:ring-slate-800/50">
              <AvatarImage
                src={userData.photo || ""}
                alt={`${userData.firstName} ${userData.lastName}`}
                className="object-cover"
              />
              <AvatarFallback className="text-secondary text-5xl">
                {getInitials(userData.firstName, userData.lastName)}
              </AvatarFallback>
            </Avatar>
            <UpdatePhotoDialog currentPhoto={userData.photo} onPhotoUpdate={onPhotoUpdate} />
          </div>

          {/* Name and Status - Right Side */}
          <div className="flex flex-1 flex-col gap-3 text-center sm:text-left">
            <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-2">
              <h3 className="text-2xl font-medium tracking-tight text-secondary">
                {userData.firstName} {userData.lastName}
              </h3>
              <Badge variant={userData.role === "teacher" ? "default" : "secondary"}>
                {userData.role}
              </Badge>
            </div>

            {/* Status */}
            <div className="w-full">
              <Status initialStatus={userData.status} onStatusUpdate={onStatusUpdate} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
