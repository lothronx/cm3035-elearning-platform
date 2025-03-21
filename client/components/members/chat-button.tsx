"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { useUser } from "@/contexts/user-context";
import { toast } from "sonner";

interface ChatButtonProps {
  userId?: string;

  className?: string;
}

export function ChatButton({ userId, className = "w-full" }: ChatButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  // If no userId is provided, use the one from context (e.g. from member card or details)
  const handleStartChat = async () => {
    if (!userId) {
      toast.error("Cannot start chat: user information missing");
      return;
    }

    // Don't allow chatting with yourself
    if (userId === user?.id?.toString()) {
      toast.error("You cannot chat with yourself");
      return;
    }

    setIsLoading(true);
    try {
      // Open the chat interface by dispatching a custom event
      window.dispatchEvent(
        new CustomEvent("openChat", {
          detail: {
            userId: parseInt(userId),
            isNewChat: true,
          },
        })
      );
    } catch (error) {
      console.error("Error starting chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className={`${className} bg-primary text-primary-foreground`}
      variant="outline"
      onClick={handleStartChat}
      disabled={isLoading}>
      <MessageCircle className="mr-2 h-4 w-4" />
      {isLoading ? "Opening chat..." : "Chat with me"}
    </Button>
  );
}
