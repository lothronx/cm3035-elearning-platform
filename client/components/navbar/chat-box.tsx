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
  const { chatSocket, isChatConnected } = useUser();

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

        // Send message via WebSocket if connected (for real-time delivery to receiver)
        if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
          chatSocket.send(
            JSON.stringify({
              type: "chat_message",
              receiver_id: activeChatId,
              content: content || "",
            })
          );
          console.log("Message sent via WebSocket");
        } else {
          console.log("WebSocket not connected, message sent only via API");
        }

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
    [activeChatId, chatSocket]
  );

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!chatSocket) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket message received:", data);

      if (data.type === "chat_message") {
        const message = data.message;
        console.log("Chat message received:", message);

        // Add message to current chat if it's active
        if (message.sender_id === activeChatId || message.receiver_id === activeChatId) {
          const newMessage: Message = {
            id: message.id,
            content: message.content,
            isSender: false, // It's a received message
            timestamp: new Date(message.timestamp),
            file: message.file && message.file.id ? message.file : null,
          };

          setChatMessages((prev) => [...prev, newMessage]);
        }

        // Update chat session's last message and unread status
        setChatSessions((prev) =>
          prev.map((session) => {
            if (session.id === message.sender_id) {
              const isCurrentChat = session.id === activeChatId && open;
              return {
                ...session,
                lastMessage: message.content || "New message",
                isUnread: !isCurrentChat, // Mark as unread if not the current chat or if chat box is closed
              };
            }
            return session;
          })
        );

        // If not the active chat or if chat box is closed, show unread indicator
        if (message.sender_id !== activeChatId || !open) {
          setHasUnread(true);
        }

        // Show toast notification for new message
        toast(`New message from ${message.sender_name}`, {
          description:
            message.content.length > 30
              ? `${message.content.substring(0, 30)}...`
              : message.content,
          action: {
            label: "View",
            onClick: () => {
              setOpen(true);
              handleSelectChat(message.sender_id);
            },
          },
        });
      }
    };

    chatSocket.addEventListener("message", handleMessage);
    return () => chatSocket.removeEventListener("message", handleMessage);
  }, [chatSocket, activeChatId, handleSelectChat, open]);

  // Fetch chat sessions when connected
  useEffect(() => {
    if (!isChatConnected) return;

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
  }, [isChatConnected, activeChatId, handleSelectChat]);

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
