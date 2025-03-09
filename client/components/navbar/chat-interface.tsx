"use client";

import type React from "react";
import ChatSidebar from "@/components/navbar/chat-sidebar";
import ChatWindow from "@/components/navbar/chat-window";
import { ChatSession, Message } from "@/types/message";

interface ChatInterfaceProps {
  contacts: ChatSession[];
  activeChatId: number;
  activeChat: Message[];
  handleSelectChat: (chatId: number) => Promise<void>;
  handleSendMessage: (content: string, file?: globalThis.File) => void;
}

// the chat interface component is responsible for rendering the chat sidebar and chat window
export function ChatInterface({
  contacts,
  activeChatId,
  activeChat,
  handleSelectChat,
  handleSendMessage,
}: ChatInterfaceProps) {
  // Pass the loading state to the chat window component for UI feedback
  return (
    <div className="flex h-full flex-col min-h-0">
      <div className="flex items-center justify-between border-b py-2 px-2">
        <h2 className="text-lg text-secondary font-semibold ml-2">Chat</h2>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar
          contacts={contacts}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
        />

        <ChatWindow chat={activeChat} onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
