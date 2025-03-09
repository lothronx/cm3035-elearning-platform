"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

interface StatusProps {
  initialStatus: string;
  onStatusUpdate: (newStatus: string) => void;
}

export function Status({ initialStatus, onStatusUpdate }: StatusProps) {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusText, setStatusText] = useState(initialStatus);
  const statusInputRef = useRef<HTMLInputElement>(null);

  // Update status text when initialStatus changes
  useEffect(() => {
    setStatusText(initialStatus);
  }, [initialStatus]);

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
    setStatusText(initialStatus);
    setIsEditingStatus(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleStatusSave();
    } else if (e.key === "Escape") {
      handleStatusCancel();
    }
  };

  return isEditingStatus ? (
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
      <p className="text-md text-slate-600 dark:text-slate-300">{statusText}</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditingStatus(true)}
        className="h-7 px-2 text-slate-500 transition-colors duration-200 hover:text-secondary dark:text-slate-400">
        <Pencil className="mr-1 h-3 w-3" />
        Edit
      </Button>
    </div>
  );
}
