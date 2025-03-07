"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Pencil, Check, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PersonalDetailsProps {
  userData: {
    firstName: string;
    lastName: string;
    role: string;
    photo: string;
    status: string;
  };
  onStatusUpdate: (newStatus: string) => void;
  onPhotoUpdate: (newPictureUrl: string) => void;
}

export function PersonalDetails({ userData, onStatusUpdate, onPhotoUpdate }: PersonalDetailsProps) {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusText, setStatusText] = useState(userData.status);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const statusInputRef = useRef<HTMLInputElement>(null);

  // Focus the input when editing starts
  useEffect(() => {
    if (isEditingStatus && statusInputRef.current) {
      statusInputRef.current.focus();
    }
  }, [isEditingStatus]);

  const handleStatusSave = () => {
    onStatusUpdate(statusText);
    setIsEditingStatus(false);
    toast.success("Status updated successfully");
  };

  const handleStatusCancel = () => {
    setStatusText(userData.status);
    setIsEditingStatus(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleStatusSave();
    } else if (e.key === "Escape") {
      handleStatusCancel();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, you would upload the file to a server
    // and get back a URL to the uploaded image
    setIsUploadingImage(true);

    // Simulate upload delay
    setTimeout(() => {
      // For demo purposes, we're just using a placeholder
      // In a real app, this would be the URL returned from your API
      onPhotoUpdate(`/placeholder.svg?height=200&width=200&text=${file.name}`);
      setIsUploadingImage(false);
      toast.success("Profile picture updated");
    }, 1500);
  };

  return (
    <Card className="overflow-hidden border-none bg-primaryy shadow-sm transition-all duration-300 dark:bg-slate-900">
      <CardContent className="p-0">
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row">
          {/* Profile Picture - Left Side */}
          <div className="relative shrink-0">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-slate-100 ring-4 ring-white/50 transition-all duration-300 hover:ring-primary/20 dark:bg-slate-800 dark:ring-slate-800/50 sm:h-28 sm:w-28">
              <Image
                src={userData.photo || "/blank.png"}
                alt="Profile"
                width={112}
                height={112}
                className="h-full w-full object-cover"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md transition-transform duration-200 hover:scale-110 bg-secondary">
                  <Camera className="h-4 w-4 text-primary-foreground" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Profile Picture</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex justify-center">
                    <div className="overflow-hidden rounded-full">
                      <Image
                        src={userData.photo || "/placeholder.svg"}
                        alt="Current Profile"
                        width={150}
                        height={150}
                        className="h-[150px] w-[150px] object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="picture">Upload new picture</Label>
                    <Input
                      id="picture"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                  </div>
                  {isUploadingImage && (
                    <div className="text-center text-sm text-muted-foreground">Uploading...</div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Name and Status - Right Side */}
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
              {isEditingStatus ? (
                <div className="flex items-center gap-2">
                  <Input
                    ref={statusInputRef}
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What's on your mind?"
                    className="h-9 transition-all duration-200"
                  />
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      onClick={handleStatusSave}
                      className="h-9 w-9 transition-all duration-200 hover:bg-green-500 hover:text-white">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleStatusCancel}
                      className="h-9 w-9 transition-all duration-200 hover:bg-red-500 hover:text-white">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{userData.status}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingStatus(true)}
                    className="h-7 px-2 text-slate-500 transition-colors duration-200 hover:text-secondary dark:text-slate-400">
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
