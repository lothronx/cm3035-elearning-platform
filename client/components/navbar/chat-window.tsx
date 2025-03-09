"use client";

import { useRef, useEffect } from "react";
import { Message } from "@/types/message";
import MessageInput from "@/components/navbar/message-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileIcon, FileTextIcon, ImageIcon, FileVideoIcon } from "lucide-react";
import { format } from "date-fns";

const FileTypeIcon = ({ type }: { type: string }) => {
  if (!type) return null;
  switch (type.toLowerCase()) {
    case "pdf":
    case "doc":
    case "docx":
    case "txt":
      return <FileTextIcon className="h-3 w-3" />;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
    case "svg":
      return <ImageIcon className="h-3 w-3" />;
    case "mp4":
    case "mov":
    case "avi":
    case "mkv":
      return <FileVideoIcon className="h-3 w-3" />;
    default:
      return <FileIcon className="h-3 w-3" />;
  }
};

interface ChatWindowProps {
  chat: Message[];
  onSendMessage: (content: string, file?: globalThis.File) => void;
}

export default function ChatWindow({ chat, onSendMessage }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  return (
    <div className="flex flex-2/3 h-full w-full flex-col overflow-hidden">
      <ScrollArea className="flex-1 px-2 overflow-y-auto webkit-fill-available">
        <div className=" mt-2 space-y-2">
          {chat.map((message: Message) => (
            <div
              key={message.id}
              className={`flex ${message.isSender ? "justify-end" : "justify-start"} `}>
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  message.isSender ? "bg-primary text-primary-foreground" : "bg-primary/10"
                }`}>
                {message.file && (
                  <a
                    href={message.file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm underline">
                    <FileTypeIcon type={message.file.type} />
                    <span>{message.file.title}</span>
                  </a>
                )}

                <p className="text-sm">{message.content}</p>

                <div
                  className={`mt-1 text-right text-[10px] ${
                    message.isSender ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}>
                  {format(message.timestamp, "h:mm a")}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t py-2 px-2">
        <MessageInput onSendMessage={onSendMessage} />
      </div>
    </div>
  );
}
