"use client";

import { useRef, useEffect } from "react";
import type { ChatSession } from "./chat-interface";
import MessageInput from "@/components/navbar/message-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileIcon } from "lucide-react";
import { format } from "date-fns";

interface ChatWindowProps {
  chat: ChatSession;
  onSendMessage: (content: string, file?: File) => void;
  onToggleSidebar: () => void;
  showBackButton?: boolean;
}

export default function ChatWindow({
  chat,
  onSendMessage,
  onToggleSidebar,
  showBackButton = false,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  return (
    <div className="flex h-full w-full flex-col">
      {showBackButton && (
        <div className="flex items-center p-2">
          <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="mr-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-md font-medium">{chat.name}</h3>
        </div>
      )}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-4">
          {chat.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-2 text-sm ${
                  message.sender === "me" ? "bg-primary text-primary-foreground" : "bg-primary/10"
                }`}>
                {message.isFile ? (
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm">
                    <FileIcon className="h-3 w-3" />
                    <span>{message.fileName}</span>
                  </a>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
                <div
                  className={`mt-1 text-right text-[10px] ${
                    message.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}>
                  {format(message.timestamp, "h:mm a")}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-2">
        <MessageInput onSendMessage={onSendMessage} />
      </div>
    </div>
  );
}
