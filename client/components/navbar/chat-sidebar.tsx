"use client";

import { ChatSession } from "@/types/message";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatSidebarProps {
  contacts: ChatSession[];
  activeChatId: number;
  onSelectChat: (chatId: number) => void;
}

// the chat sidebar component is responsible for rendering the list of chat sessions
// it also handles the selection of a chat session
export default function ChatSidebar({ contacts, activeChatId, onSelectChat }: ChatSidebarProps) {
  return (
    <div className="flex-3/10 border-r">
      <ScrollArea className="h-full">
        <div className="py-2 px-2">
          {contacts.map((chat, index) => (
            <div
              key={`chat-${chat.id}-${index}`}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 mb-2 transition-colors hover:bg-primary/10 text-sm",
                chat.id === activeChatId && "bg-primary/10"
              )}
              onClick={() => onSelectChat(chat.id)}>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center">
                  <h3 className="font-medium pr-2">{chat.name}</h3>
                  {chat.isUnread && <span className="h-2 w-2 rounded-full bg-red-500" />}
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
