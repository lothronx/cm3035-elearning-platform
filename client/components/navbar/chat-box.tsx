"use client";

import type React from "react";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ChatInterface } from "@/components/navbar/chat-interface";
import { useUser } from "@/contexts/user-context";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Message, ChatSession } from "@/types/message";
import { ChatSessionResponse, ChatMessageResponse } from "@/types/api";

interface ChatBoxProps {
  chatWidth?: number;
  chatHeight?: number;
}

export function ChatBox({ chatWidth = 600, chatHeight = 500 }: ChatBoxProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState(0);
  const [hasUnread, setHasUnread] = useState(false);
  const [open, setOpen] = useState(false);
  const { socket, isConnected } = useUser();

  // Handle chat session selection
  const handleSelectChat = useCallback(async (chatId: number) => {
    try {
      setActiveChatId(chatId);
      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/${chatId}/`
      );
      const messages: ChatMessageResponse[] = await response.json();
      setChatMessages(
        messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          isSender: msg.isSender,
          timestamp: new Date(msg.timestamp),
          file: msg.file,
        }))
      );

      // Reset unread status for this session
      setChatSessions((prev) =>
        prev.map((session) => (session.id == chatId ? { ...session, isUnread: false } : session))
      );
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      toast.error("Failed to load chat messages");
    }
  }, []);

  // Send a new message
  const handleSendMessage = useCallback(
    async (content: string, file?: globalThis.File) => {
      if (!activeChatId) return;
      if (!content && !file) {
        toast.error("Please provide a message or file");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("receiver", activeChatId.toString());
        if (content) formData.append("content", content);
        if (file) formData.append("file", file);

        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to send message");
        }

        const newMessage: ChatMessageResponse = await response.json();
        setChatMessages((prev) => [
          ...prev,
          {
            id: newMessage.id,
            content: newMessage.content,
            isSender: true,
            timestamp: new Date(newMessage.timestamp),
            file: newMessage.file,
          },
        ]);

        // Update chat session's last message
        setChatSessions((prev) =>
          prev.map((session) => {
            if (session.id === activeChatId) {
              return {
                ...session,
                lastMessage: content || "Sent a file",
              };
            }
            return session;
          })
        );
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error(error instanceof Error ? error.message : "Failed to send message");
      }
    },
    [activeChatId]
  );

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      if (data.type === "chat_message") {
        const message = data.message;
        // Add message to current chat if it's active
        if (message.chat_id === activeChatId) {
          const newMessage: ChatMessageResponse = message;
          setChatMessages((prev) => [
            ...prev,
            {
              id: newMessage.id,
              content: newMessage.content,
              isSender: newMessage.isSender,
              timestamp: new Date(newMessage.timestamp),
              file: newMessage.file,
            },
          ]);
        }
        // Update chat session's last message and unread status
        setChatSessions((prev) =>
          prev.map((session) => {
            if (session.id === message.chat_id) {
              const isCurrentChat = session.id == activeChatId;
              if (isCurrentChat) setHasUnread(true);
              return {
                ...session,
              };
            }
            return session;
          })
        );
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket, activeChatId]);

  // Fetch chat sessions when connected
  useEffect(() => {
    if (!isConnected) return;

    const fetchChatSessions = async () => {
      try {
        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/`);
        const sessions = await response.json();
        if (!Array.isArray(sessions)) {
          setChatSessions([]);
          return;
        }
        setChatSessions(
          sessions.map((session: ChatSessionResponse) => ({
            id: session.id,
            name: session.name,
            lastMessage: session.last_message,
            isUnread: session.is_unread,
          }))
        );
        setHasUnread(sessions.some((session: ChatSessionResponse) => session.is_unread));
      } catch (error) {
        console.error("Error fetching chat sessions:", error);
        toast.error("Failed to load chat sessions");
      }
    };

    fetchChatSessions();
  }, [isConnected, activeChatId, handleSelectChat]);

  // Listen for openChat events from chat button
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent) => {
      const { userId } = event.detail;
      setOpen(true);
      handleSelectChat(userId);
    };

    window.addEventListener("openChat", handleOpenChat as EventListener);
    return () => window.removeEventListener("openChat", handleOpenChat as EventListener);
  }, [handleSelectChat]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className="aspect-square h-9 rounded-full text-primary-foreground hover:bg-primary-foreground hover:text-primary dark:text-slate-300 dark:hover:bg-primary relative">
          <MessageCircle className="h-4 w-4" />
          {hasUnread && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="p-0 w-auto rounded-xl shadow-xl"
        style={{ width: `${chatWidth}px`, height: `${chatHeight}px` }}>
        <ChatInterface
          contacts={chatSessions}
          activeChatId={activeChatId}
          activeChat={chatMessages}
          handleSelectChat={handleSelectChat}
          handleSendMessage={handleSendMessage}
        />
      </PopoverContent>
    </Popover>
  );
}
