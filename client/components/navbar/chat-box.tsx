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

// Types
export type Message = {
  id: string;
  content: string;
  sender: string;
  sender_id?: string;
  timestamp: Date;
  isFile?: boolean;
  fileName?: string;
  fileUrl?: string;
  message_type?: string;
};

export type ChatSession = {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  unreadCount: number;
  messages: Message[];
  user_id?: string;
};

// Empty initial chat sessions - will be populated from API
const initialChatSessions: ChatSession[] = [];

// Main ChatBox Component
interface ChatBoxProps {
  chatWidth?: number;
  chatHeight?: number;
}

export function ChatBox({ chatWidth = 600, chatHeight = 500 }: ChatBoxProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(initialChatSessions);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const { socket, isConnected, user } = useUser();

  // Function to fetch chat sessions from the API
  const fetchChatSessions = useCallback(async () => {
    try {
      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/recent-chats/`
      );
      if (response.ok) {
        const data = await response.json();

        // Transform API data to our chat session format
        const formattedSessions = data.map(
          (item: {
            user_id: string;
            username: string;
            avatar: string | null;
            last_message: string;
            unread_count: number;
          }) => ({
            id: item.user_id,
            name: item.username,
            avatar: item.avatar || "/placeholder.svg?height=40&width=40",
            lastMessage: item.last_message,
            unreadCount: item.unread_count,
            messages: [],
            user_id: item.user_id,
          })
        );

        setChatSessions(formattedSessions);
        setTotalUnreadCount(
          formattedSessions.reduce(
            (sum: number, session: ChatSession) => sum + session.unreadCount,
            0
          )
        );
      }
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
    }
  }, []);

  // Fetch messages for a specific chat session
  const fetchMessages = useCallback(
    async (userId: string) => {
      try {
        const response = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/api/chat/messages/${userId}/`
        );

        if (response.ok) {
          const data = await response.json();

          // Transform API data to our message format
          const formattedMessages = data.map(
            (item: {
              id: number;
              content: string;
              sender_id: string;
              sender_name: string;
              message_type: string;
              timestamp: string;
              file_url?: string;
              file_name?: string;
            }) => ({
              id: item.id.toString(),
              content: item.content,
              sender: item.sender_id === user?.id?.toString() ? "me" : item.sender_name,
              sender_id: item.sender_id,
              timestamp: new Date(item.timestamp),
              message_type: item.message_type,
              isFile: item.message_type === "file",
              fileName: item.file_name,
              fileUrl: item.file_url,
            })
          );

          // Update the specified chat session with messages
          setChatSessions((prev) =>
            prev.map((session) => {
              if (session.id === userId) {
                return {
                  ...session,
                  messages: formattedMessages,
                  unreadCount: 0,
                };
              }
              return session;
            })
          );

          // Update total unread count
          const chatUnreadCount =
            chatSessions.find((session) => session.id === userId)?.unreadCount || 0;
          setTotalUnreadCount((prev) => prev - chatUnreadCount);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    },
    [user, chatSessions]
  );

  // Listen for openChat events from the ChatButton component
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent<{ userId: string }>) => {
      const userId = event.detail.userId;

      // Open the chat box
      setOpen(true);

      // Fetch chat sessions if needed
      if (chatSessions.length === 0) {
        fetchChatSessions().then(() => {
          // After fetching chat sessions, find the one with the requested user and load its messages
          const targetSession = chatSessions.find((session) => session.id === userId);
          if (targetSession) {
            fetchMessages(userId);
          }
        });
      } else {
        // Check if we already have a session with this user
        const targetSession = chatSessions.find((session) => session.id === userId);
        if (targetSession) {
          fetchMessages(userId);
        }
      }
    };

    window.addEventListener("openChat", handleOpenChat as EventListener);

    return () => {
      window.removeEventListener("openChat", handleOpenChat as EventListener);
    };
  }, [chatSessions, fetchChatSessions, fetchMessages]);

  // Fetch chat sessions when component mounts or when connection status changes
  useEffect(() => {
    if (isConnected) {
      fetchChatSessions();
    }
  }, [isConnected, fetchChatSessions]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "chat_message") {
          const message = data.message;
          const senderId = message.sender_id;
          const senderName = message.sender_name;

          // Format new message
          const newMessage: Message = {
            id: message.id.toString(),
            content: message.content,
            sender: senderName,
            sender_id: senderId,
            timestamp: new Date(message.timestamp),
            message_type: message.message_type,
            isFile: message.message_type === "file",
            fileName: message.file_name,
            fileUrl: message.file_url,
          };

          // Check if we already have a chat session with this user
          const existingSessionIndex = chatSessions.findIndex((session) => session.id === senderId);

          if (existingSessionIndex >= 0) {
            // Update existing session
            setChatSessions((prev) => {
              const updated = [...prev];
              updated[existingSessionIndex] = {
                ...updated[existingSessionIndex],
                lastMessage: message.content,
                unreadCount: updated[existingSessionIndex].unreadCount + 1,
                messages: [...updated[existingSessionIndex].messages, newMessage],
              };
              return updated;
            });
          } else {
            // Session doesn't exist yet, so fetch sessions again
            fetchChatSessions();
          }

          // Update total unread count
          setTotalUnreadCount((prev) => prev + 1);

          // Show toast for new message
          toast.info(`New message from ${senderName}`);
        } else if (data.type === "message_sent") {
          // Handle confirmation of sent message
          // This is handled in the chat interface component
        }
      } catch (error) {
        console.error("Error processing websocket message:", error);
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, chatSessions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className="aspect-square h-9 rounded-full text-primary-foreground hover:bg-primary-foreground hover:text-primary dark:text-slate-300 dark:hover:bg-primary relative">
          <MessageCircle className="h-4 w-4" />
          {totalUnreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-primary-foreground font-medium shadow-sm">
              {totalUnreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="p-0 w-auto rounded-xl shadow-xl"
        style={{ width: `${chatWidth}px`, height: `${chatHeight}px` }}>
        <ChatInterface
          chatSessions={chatSessions}
          setChatSessions={setChatSessions}
          fetchMessages={fetchMessages}
        />
      </PopoverContent>
    </Popover>
  );
}
