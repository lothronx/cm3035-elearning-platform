"use client";

import type React from "react";

import { useState, useEffect } from "react";
import ChatSidebar from "@/components/navbar/chat-sidebar";
import ChatWindow from "@/components/navbar/chat-window";
import { useUser } from "@/contexts/user-context";
import { fetchWithAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ChatSession, Message } from "@/types/message";

interface ChatInterfaceProps {
  chatSessions: ChatSession[];
  setChatSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  fetchMessages: (userId: string) => Promise<void>;
}

export function ChatInterface({
  chatSessions,
  setChatSessions,
  fetchMessages,
}: ChatInterfaceProps) {
  const [activeChatId, setActiveChatId] = useState<string>(
    chatSessions.length > 0 ? chatSessions[0].id : ""
  );
  const [, setIsLoading] = useState(false);
  const { socket, user } = useUser();

  const activeChat = chatSessions.find((chat) => chat.id === activeChatId);

  useEffect(() => {
    // If we have chat sessions but no active chat ID, set the first one as active
    if (chatSessions.length > 0 && !activeChatId) {
      setActiveChatId(chatSessions[0].id);
    }

    // If we have an active chat ID but no messages, fetch them
    if (activeChatId && activeChat && activeChat.messages.length === 0) {
      fetchMessages(activeChatId);
    }
  }, [chatSessions, activeChatId, activeChat, fetchMessages]);

  const handleSendMessage = async (content: string, file?: globalThis.File) => {
    if (!content && !file) return;
    if (!activeChatId || !user) {
      toast.error("Unable to send message");
      return;
    }

    setIsLoading(true);

    try {
      // Create optimistic message
      const tempId = `temp-${Date.now()}`;
      const newMessage: Message = {
        id: tempId,
        content: content,
        sender: "me",
        sender_id: user.id ? user.id.toString() : "",
        receiver: activeChat?.name || "", // Use active chat name as receiver name
        receiver_id: parseInt(activeChat?.id || "0"), // Use active chat id as receiver_id
        timestamp: new Date(),
        files: [], // Initialize empty array for files
        is_read: true, // Our own messages are always marked as read
      };

      // Update UI immediately for better UX
      setChatSessions((prev) =>
        prev.map((session) => {
          if (session.id === activeChatId) {
            return {
              ...session,
              messages: [...session.messages, newMessage],
              lastMessage: content || file?.name || "File",
            };
          }
          return session;
        })
      );

      // Prepare form data for file upload if needed
      let formData;
      if (file) {
        formData = new FormData();
        formData.append("file", file);
        formData.append("receiver_id", activeChatId);
        formData.append("content", content || "File attachment");
      }

      // Send message through API
      const endpoint = file
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/chat/send-file/`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/chat/send-message/`;

      const response = await fetchWithAuth(endpoint, {
        method: "POST",
        headers: file
          ? undefined
          : {
              "Content-Type": "application/json",
            },
        body: file
          ? formData
          : JSON.stringify({
              receiver_id: activeChatId,
              content: content,
            }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // If websocket is not connected, we'll need to fetch messages to get the real ID
      if (!socket || !socket.readyState) {
        await fetchMessages(activeChatId);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");

      // Remove optimistic message if failed
      setChatSessions((prev) =>
        prev.map((session) => {
          if (session.id === activeChatId) {
            return {
              ...session,
              messages: session.messages.filter((msg) => !msg.id.startsWith("temp-")),
            };
          }
          return session;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    setActiveChatId(chatId);

    // Fetch messages if we haven't loaded them yet
    const selectedChat = chatSessions.find((c) => c.id === chatId);
    if (selectedChat && selectedChat.messages.length === 0) {
      await fetchMessages(chatId);
    }

    // Mark as read in UI
    setChatSessions((prev) =>
      prev.map((session) => {
        if (session.id === chatId) {
          return {
            ...session,
            unreadCount: 0,
          };
        }
        return session;
      })
    );

    // Mark as read in backend
    try {
      await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/mark-read/${chatId}/`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Pass the loading state to the chat window component for UI feedback
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-2">
        <h2 className="text-lg text-secondary font-semibold ml-2">Chat</h2>
      </div>

      <div className="flex h-[calc(100%-48px)] overflow-hidden">
        <ChatSidebar
          chatSessions={chatSessions}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
        />

        {activeChat && <ChatWindow chat={activeChat} onSendMessage={handleSendMessage} />}
      </div>
    </div>
  );
}
