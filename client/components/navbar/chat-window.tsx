"use client";

import { useRef, useEffect } from "react";
import { ChatSession, Message } from "@/types/message";
import MessageInput from "@/components/navbar/message-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {  FileIcon } from "lucide-react";
import { format } from "date-fns";

interface ChatWindowProps {
  chat: ChatSession;
  onSendMessage: (content: string, file?: globalThis.File) => void;
}

export default function ChatWindow({
  chat,
  onSendMessage,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  return (
    <div className="flex h-full w-full flex-col">
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-4">
          {chat.messages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-2 text-sm ${
                  message.sender === "me" ? "bg-primary text-primary-foreground" : "bg-primary/10"
                }`}>
                {message.files.length > 0 ? (
                  <a
                    href={message.files[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm">
                    <FileIcon className="h-3 w-3" />
                    <span>{message.files[0].title}</span>
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
