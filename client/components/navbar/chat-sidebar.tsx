"use client";

import type { ChatSession } from "./chat-interface";
import { cn } from "@/lib/utils";
import { BadgeMini } from "@/components/ui/badge-mini";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatSidebarProps {
  chatSessions: ChatSession[];
  activeChatId: string;
  onSelectChat: (chatId: string) => void;
}

export default function ChatSidebar({
  chatSessions,
  activeChatId,
  onSelectChat,
}: ChatSidebarProps) {
  return (
    <div className="w-full border-r md:w-64">
      <ScrollArea className="h-full">
        <div className="p-1">
          {chatSessions.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-sm p-2 m-1 transition-colors hover:bg-primary/10 text-sm",
                chat.id === activeChatId && "bg-primary/10"
              )}
              onClick={() => onSelectChat(chat.id)}>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{chat.name}</h3>
                  {chat.unreadCount > 0 && (
                    <BadgeMini variant="default" className="ml-auto text-xs">
                      {chat.unreadCount}
                    </BadgeMini>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">{chat.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
