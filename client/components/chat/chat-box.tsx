"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ChatInterface } from "@/components/navbar/chat-interface";
import { useUser } from "@/contexts/user-context";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Message, ChatSession } from "@/types/chat";
import { setupWebSocketHandler } from "@/components/chat/chat-websocket-handler";
import { setupChatEventHandler, setupWebSocketEvents } from "@/components/chat/chat-event-handler";
import { sendMessage, fetchChatHistory, fetchChatSessions } from "@/components/chat/chat-api";

export interface ChatBoxProps {
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
  const handleSelectChat = useCallback(
    async (chatId: number) => {
      try {
        setActiveChatId(chatId);

        if (chatSocket?.readyState === WebSocket.OPEN) {
          chatSocket.send(
            JSON.stringify({
              type: "get_chat_history",
              chat_id: chatId,
            })
          );
        } else {
          const messages = await fetchChatHistory(chatId);
          setChatMessages(messages);
        }

        if (chatSocket?.readyState === WebSocket.OPEN) {
          chatSocket.send(
            JSON.stringify({
              type: "mark_read",
              chat_id: chatId,
            })
          );
        }

        setChatSessions((prev) =>
          prev.map((session) => (session.id === chatId ? { ...session, isUnread: false } : session))
        );

        const updatedSessions = chatSessions.map((session) =>
          session.id === chatId ? { ...session, isUnread: false } : session
        );
        setHasUnread(updatedSessions.some((session) => session.isUnread));
      } catch (error) {
        console.error("Error fetching chat messages:", error);
        toast.error("Failed to load chat messages");
      }
    },
    [chatSessions, chatSocket]
  );

  // Send a new message
  const handleSendMessage = useCallback(
    async (content: string, file?: File) => {
      if (!activeChatId) return;
      if (!content && !file) {
        toast.error("Please provide a message or file");
        return;
      }

      try {
        if (file || !chatSocket || chatSocket.readyState !== WebSocket.OPEN) {
          const newMessage = await sendMessage(activeChatId, content, file);

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
        } else {
          const tempMessage: Message = {
            id: 9999999,
            content: content,
            isSender: true,
            timestamp: new Date(),
            file: null,
          };

          setChatMessages((prev) => [...prev, tempMessage]);

          chatSocket.send(
            JSON.stringify({
              type: "send_message",
              receiver_id: activeChatId,
              content: content,
            })
          );
        }

        // Update chat session's last message
        setChatSessions((prev) =>
          prev.map((session) => {
            if (session.id === activeChatId) {
              return {
                ...session,
                lastMessage: content || (file ? "Sent a file" : "New message"),
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

  // Function to view a chat when clicking on a notification
  const viewChatFromNotification = useCallback(
    (senderId: number) => {
      setOpen(true);
      handleSelectChat(senderId);
    },
    [handleSelectChat]
  );

  // Set up WebSocket message handler
  useEffect(() => {
    return setupWebSocketHandler({
      chatSocket,
      activeChatId,
      open,
      setChatMessages,
      setChatSessions,
      setHasUnread,
      viewChatFromNotification,
    });
  }, [chatSocket, activeChatId, open, viewChatFromNotification]);

  // Set up WebSocket event listeners
  useEffect(() => {
    return setupWebSocketEvents(chatSocket);
  }, [chatSocket]);

  // Fetch chat sessions when connected
  useEffect(() => {
    if (!isChatConnected) return;

    if (chatSocket?.readyState === WebSocket.OPEN) {
      chatSocket.send(
        JSON.stringify({
          type: "get_chat_sessions",
        })
      );
    } else {
      const loadChatSessions = async () => {
        try {
          const sessions = await fetchChatSessions();
          setChatSessions(sessions);
          setHasUnread(sessions.some((session) => session.isUnread));
        } catch (error) {
          console.error("Error fetching chat sessions:", error);
          toast.error("Failed to load chat sessions");
        }
      };
      loadChatSessions();
    }
  }, [isChatConnected, chatSocket]);

  // Listen for openChat events
  useEffect(() => {
    return setupChatEventHandler({
      chatSocket,
      chatSessions,
      setOpen,
      setActiveChatId,
      setChatMessages,
      handleSelectChat,
    });
  }, [handleSelectChat, chatSessions, chatSocket]);

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
