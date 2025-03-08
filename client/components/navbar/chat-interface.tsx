"use client";

import type React from "react";

import { useState } from "react";
import ChatSidebar from "@/components/navbar/chat-sidebar";
import ChatWindow from "@/components/navbar/chat-window";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";

// Define types for our chat data
export type Message = {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  isFile?: boolean;
  fileName?: string;
  fileUrl?: string;
};

export type ChatSession = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  unreadCount: number;
  messages: Message[];
};

// Sample data
export const initialChatSessions: ChatSession[] = [
  {
    id: "1",
    name: "John Doe",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Hey, how's it going?",
    unreadCount: 2,
    messages: [
      {
        id: "m1",
        content: "Hey there!",
        sender: "John Doe",
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        id: "m2",
        content: "Hi! How can I help you today?",
        sender: "me",
        timestamp: new Date(Date.now() - 3500000),
      },
      {
        id: "m3",
        content: "I was wondering about the project deadline",
        sender: "John Doe",
        timestamp: new Date(Date.now() - 3400000),
      },
      {
        id: "m4",
        content: "Hey, how's it going?",
        sender: "John Doe",
        timestamp: new Date(Date.now() - 1000000),
      },
    ],
  },
  {
    id: "2",
    name: "Jane Smith",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "The documents are ready",
    unreadCount: 0,
    messages: [
      {
        id: "m5",
        content: "Hello",
        sender: "Jane Smith",
        timestamp: new Date(Date.now() - 86400000),
      },
      {
        id: "m6",
        content: "Hi Jane, what's up?",
        sender: "me",
        timestamp: new Date(Date.now() - 86300000),
      },
      {
        id: "m7",
        content: "I've prepared the documents you asked for",
        sender: "Jane Smith",
        timestamp: new Date(Date.now() - 86200000),
      },
      {
        id: "m8",
        content: "The documents are ready",
        sender: "Jane Smith",
        timestamp: new Date(Date.now() - 86100000),
        isFile: true,
        fileName: "project_docs.pdf",
        fileUrl: "#",
      },
    ],
  },
  {
    id: "3",
    name: "Team Chat",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Meeting at 3pm",
    unreadCount: 5,
    messages: [
      {
        id: "m9",
        content: "Good morning team!",
        sender: "Alex",
        timestamp: new Date(Date.now() - 172800000),
      },
      {
        id: "m10",
        content: "Morning!",
        sender: "me",
        timestamp: new Date(Date.now() - 172700000),
      },
      {
        id: "m11",
        content: "Don't forget we have a meeting today",
        sender: "Sarah",
        timestamp: new Date(Date.now() - 172600000),
      },
      {
        id: "m12",
        content: "Meeting at 3pm",
        sender: "Alex",
        timestamp: new Date(Date.now() - 172500000),
      },
    ],
  },
];

interface ChatInterfaceProps {
  onClose: () => void;
  chatSessions: ChatSession[];
  setChatSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
}

export function ChatInterface({ onClose, chatSessions, setChatSessions }: ChatInterfaceProps) {
  const [activeChatId, setActiveChatId] = useState<string>(chatSessions[0].id);
  const [showSidebar, setShowSidebar] = useState(true);
  const isMobile = useMobile();

  const activeChat = chatSessions.find((chat) => chat.id === activeChatId);

  const handleSendMessage = (content: string, file?: File) => {
    if (!content && !file) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      content: content,
      sender: "me",
      timestamp: new Date(),
    };

    if (file) {
      newMessage.isFile = true;
      newMessage.fileName = file.name;
      newMessage.fileUrl = URL.createObjectURL(file);
    }

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
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
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

    if (isMobile) {
      setShowSidebar(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-2">
        <h2 className="text-lg text-secondary font-semibold ml-2">Messages</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex h-[calc(100%-48px)] overflow-hidden">
        {(showSidebar || !isMobile) && (
          <ChatSidebar
            chatSessions={chatSessions}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
          />
        )}

        {(!showSidebar || !isMobile) && activeChat && (
          <ChatWindow
            chat={activeChat}
            onSendMessage={handleSendMessage}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            showBackButton={isMobile && !showSidebar}
          />
        )}
      </div>
    </div>
  );
}
