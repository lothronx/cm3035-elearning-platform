"use client";

import Image from "next/image";
import { useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UpdatePhotoDialogProps {
  currentPhoto: string;
  onPhotoUpdate: (file: File) => Promise<void>;
}

export function UpdatePhotoDialog({ currentPhoto, onPhotoUpdate }: UpdatePhotoDialogProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);

    try {
      await onPhotoUpdate(file);
      toast.success("Profile picture updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile picture");
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md transition-transform duration-200 hover:scale-110 bg-secondary">
          <Camera className="h-4 w-4 text-primary-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background-light">
        <DialogHeader>
          <DialogTitle className="text-secondary">Update Profile Picture</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-center">
            <div className="overflow-hidden rounded-full">
              <Image
                src={currentPhoto || "/placeholder.svg"}
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
              className="bg-background"
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
  );
}
