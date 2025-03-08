"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatInterface } from "@/components/navbar/chat-interface";

// Types
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
  lastMessage: string;
  unreadCount: number;
  messages: Message[];
};

// Sample data - you can replace this with your own data source
const defaultChatSessions: ChatSession[] = [
  {
    id: "1",
    name: "John Doe",
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

// Main ChatBox Component
interface ChatBoxProps {
  initialChatSessions?: ChatSession[];
  chatWidth?: number;
  chatHeight?: number;
}

export function ChatBox({
  initialChatSessions = defaultChatSessions,
  chatWidth = 600,
  chatHeight = 500,
}: ChatBoxProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(initialChatSessions);
  const totalUnreadCount = chatSessions.reduce((sum, session) => sum + session.unreadCount, 0);

  return (
    <>
      <div className="relative">
        <Button
          onClick={() => setIsChatOpen(!isChatOpen)}
          size="icon"
          className="aspect-square h-9 rounded-full text-primary-foreground hover:bg-primary-foreground hover:text-primary dark:text-slate-300 dark:hover:bg-primary">
          <MessageCircle className="h-4 w-4" />
          {totalUnreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-primary-foreground font-medium shadow-sm">
              {totalUnreadCount}
            </span>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-20 right-4 z-40 rounded-xl border bg-popover shadow-2xl overflow-hidden`}
            style={{ width: `${chatWidth}px`, height: `${chatHeight}px` }}>
            <ChatInterface
              onClose={() => setIsChatOpen(false)}
              chatSessions={chatSessions}
              setChatSessions={setChatSessions}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
