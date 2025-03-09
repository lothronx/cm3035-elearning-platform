"use client";

import type React from "react";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ChatInterface } from "@/components/navbar/chat-interface";
import { useUser } from "@/contexts/user-context";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Message, ChatSession } from "@/types/message";
import { ChatSessionResponse, ChatMessageResponse } from "@/types/api";

interface ChatBoxProps {
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

        // Request chat history via WebSocket
        if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
          chatSocket.send(
            JSON.stringify({
              type: "get_chat_history",
              chat_id: chatId,
            })
          );
        } else {
          // Fallback to REST API if WebSocket is not connected
          const response = await fetchWithAuth(
            `${process.env.NEXT_PUBLIC_API_URL}/api/chat/${chatId}/`
          );
          const messages: ChatMessageResponse[] = await response.json();
          setChatMessages(
            messages.map((msg) => ({
              id: msg.id,
              content: msg.content,
              isSender: msg.isSender,
              timestamp: new Date(msg.timestamp),
              file: msg.file,
            }))
          );
        }

        // Mark messages as read via WebSocket
        if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
          chatSocket.send(
            JSON.stringify({
              type: "mark_read",
              chat_id: chatId,
            })
          );
        }

        // Reset unread status for this session in UI immediately (optimistic update)
        setChatSessions((prev) =>
          prev.map((session) => (session.id == chatId ? { ...session, isUnread: false } : session))
        );

        // Check if all messages are now read
        const updatedSessions = chatSessions.map((session) =>
          session.id === chatId ? { ...session, isUnread: false } : session
        );
        const anyUnread = updatedSessions.some((session) => session.isUnread);
        setHasUnread(anyUnread);
      } catch (error) {
        console.error("Error fetching chat messages:", error);
        toast.error("Failed to load chat messages");
      }
    },
    [chatSessions, chatSocket]
  );

  // Send a new message
  const handleSendMessage = useCallback(
    async (content: string, file?: globalThis.File) => {
      if (!activeChatId) return;
      if (!content && !file) {
        toast.error("Please provide a message or file");
        return;
      }

      try {
        // If it's a file upload, we still use REST API for that
        if (file) {
          const formData = new FormData();
          formData.append("receiver", activeChatId.toString());
          if (content) formData.append("content", content);
          formData.append("file", file);

          const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/`, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to send message");
          }

          const newMessage: ChatMessageResponse = await response.json();

          // Add the message to the UI
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

          // Update chat session's last message
          setChatSessions((prev) =>
            prev.map((session) => {
              if (session.id === activeChatId) {
                return {
                  ...session,
                  lastMessage: content || "Sent a file",
                };
              }
              return session;
            })
          );

          return;
        }

        // For text-only messages, use WebSocket
        if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
          // Add message to UI immediately (optimistic update)
          const newMessage: Message = {
            id: 9999999,
            content: content,
            isSender: true,
            timestamp: new Date(),
            file: null,
          };

          setChatMessages((prev) => [...prev, newMessage]);

          // Update chat session's last message
          setChatSessions((prev) =>
            prev.map((session) => {
              if (session.id === activeChatId) {
                return {
                  ...session,
                  lastMessage: content,
                };
              }
              return session;
            })
          );

          // Send via WebSocket
          chatSocket.send(
            JSON.stringify({
              type: "send_message",
              receiver_id: activeChatId,
              content: content,
            })
          );
        } else {
          // Fallback to REST API if WebSocket is not connected
          const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/`, {
            method: "POST",
            body: JSON.stringify({
              receiver: activeChatId,
              content: content,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to send message");
          }

          const newMessage: ChatMessageResponse = await response.json();

          // Add the message to the UI
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

          // Update chat session's last message
          setChatSessions((prev) =>
            prev.map((session) => {
              if (session.id === activeChatId) {
                return {
                  ...session,
                  lastMessage: content,
                };
              }
              return session;
            })
          );
        }
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

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!chatSocket) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log("[CHAT DEBUG] WebSocket message received:", JSON.stringify(data, null, 2));

      if (data.type === "chat_message") {
        // Handle incoming chat message
        const message = data.message;
        console.log("[CHAT DEBUG] Chat message details:", {
          id: message.id,
          sender: message.sender_id,
          receiver: message.receiver_id,
          content: message.content,
          hasFile: !!message.file,
          timestamp: message.timestamp,
        });

        // Add message to current chat if it's active
        if (message.sender_id === activeChatId || message.receiver_id === activeChatId) {
          const newMessage: Message = {
            id: message.id,
            content: message.content,
            isSender: false, // It's a received message
            timestamp: new Date(message.timestamp),
            file: message.file ? message.file : null,
          };

          setChatMessages((prev) => [...prev, newMessage]);
        }

        // Update chat session's last message and unread status
        setChatSessions((prev) =>
          prev.map((session) => {
            if (session.id === message.sender_id) {
              const isCurrentChat = session.id === activeChatId && open;
              return {
                ...session,
                lastMessage: message.content || "New message",
                isUnread: !isCurrentChat, // Mark as unread if not the current chat or if chat box is closed
              };
            }
            return session;
          })
        );

        // If not the active chat or if chat box is closed, show unread indicator
        if (message.sender_id !== activeChatId || !open) {
          setHasUnread(true);
        }

        // Show toast notification for new message
        const toastTitle = `New message from ${message.sender_name}`;
        let toastDescription = "";

        // Handle different message content types
        if (message.content && message.content.trim().length > 0) {
          // Has text content
          toastDescription =
            message.content.length > 30
              ? `${message.content.substring(0, 30)}...`
              : message.content;
        } else if (message.file) {
          // Has file but no content
          toastDescription = message.file.title
            ? `Sent a file: ${message.file.title}`
            : "Sent a file";
        } else {
          // Fallback for empty messages
          toastDescription = "New message";
        }

        const senderId = message.sender_id;
        toast(toastTitle, {
          description: toastDescription,
          action: {
            label: "View",
            onClick: () => viewChatFromNotification(senderId),
          },
        });
      } else if (data.type === "chat_history") {
        // Handle chat history response
        setChatMessages(
          data.messages.map((msg: ChatMessageResponse) => ({
            id: msg.id,
            content: msg.content,
            isSender: msg.isSender,
            timestamp: new Date(msg.timestamp),
            file: msg.file,
          }))
        );
      } else if (data.type === "message_sent") {
        // Handle confirmation of sent message
        const message = data.message;

        // Replace temporary message with confirmed one from server
        if (message.temp_id) {
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === message.temp_id
                ? {
                    id: message.id,
                    content: message.content,
                    isSender: true,
                    timestamp: new Date(message.timestamp),
                    file: message.file,
                  }
                : msg
            )
          );
        }
      } else if (data.type === "read_status_update") {
        // Update the unread status based on the server response
        if (data.all_read) {
          setHasUnread(false);
        } else {
          // Update specific chat session read status
          setChatSessions((prev) =>
            prev.map((session) =>
              session.id === data.chat_id ? { ...session, isUnread: data.has_unread } : session
            )
          );

          // Check if any sessions still have unread messages
          setHasUnread(data.any_unread_sessions);
        }
      } else if (data.type === "chat_sessions") {
        // Handle chat sessions response
        setChatSessions(
          data.sessions.map((session: ChatSessionResponse) => ({
            id: session.id,
            name: session.name,
            lastMessage: session.last_message,
            isUnread: session.is_unread,
          }))
        );
        setHasUnread(data.sessions.some((session: ChatSessionResponse) => session.is_unread));
      } else if (data.type === "error") {
        toast.error(data.message || "An error occurred");
      }
    };

    chatSocket.addEventListener("message", handleMessage);
    return () => chatSocket.removeEventListener("message", handleMessage);
  }, [chatSocket, activeChatId, open, viewChatFromNotification]);

  // Set up WebSocket event listeners
  useEffect(() => {
    if (!chatSocket) return;

    const onOpen = () => {
      console.log("[CHAT DEBUG] WebSocket connection established");
    };

    const onClose = (event: CloseEvent) => {
      console.log("[CHAT DEBUG] WebSocket connection closed:", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
    };

    const onError = (error: Event) => {
      console.error("[CHAT DEBUG] WebSocket error:", error);
    };

    // Add event listeners
    chatSocket.addEventListener("open", onOpen);
    chatSocket.addEventListener("close", onClose);
    chatSocket.addEventListener("error", onError);

    // Clean up event listeners
    return () => {
      chatSocket?.removeEventListener("open", onOpen);
      chatSocket?.removeEventListener("close", onClose);
      chatSocket?.removeEventListener("error", onError);
    };
  }, [chatSocket]);

  // Fetch chat sessions when connected
  useEffect(() => {
    if (!isChatConnected) return;

    // Request chat sessions via WebSocket
    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
      chatSocket.send(
        JSON.stringify({
          type: "get_chat_sessions",
        })
      );
    } else {
      // Fallback to REST API if WebSocket is not connected
      const fetchChatSessions = async () => {
        try {
          const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/`);
          const sessions = await response.json();
          if (!Array.isArray(sessions)) {
            setChatSessions([]);
            return;
          }
          setChatSessions(
            sessions.map((session: ChatSessionResponse) => ({
              id: session.id,
              name: session.name,
              lastMessage: session.last_message,
              isUnread: session.is_unread,
            }))
          );
          setHasUnread(sessions.some((session: ChatSessionResponse) => session.is_unread));
        } catch (error) {
          console.error("Error fetching chat sessions:", error);
          toast.error("Failed to load chat sessions");
        }
      };
      fetchChatSessions();
    }
  }, [isChatConnected, chatSocket]);

  // Listen for openChat events from chat button
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent) => {
      const { userId, isNewChat } = event.detail;
      setOpen(true);

      // If this is a new chat, initialize it
      if (isNewChat) {
        // Check if this user is already in our chat sessions
        const existingChat = chatSessions.find((session) => session.id === userId);

        if (!existingChat) {
          // For new chats, we need to initialize an empty conversation
          setActiveChatId(userId);
          setChatMessages([]);

          // If connected to WebSocket, send a message to initialize the chat
          if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
            chatSocket.send(
              JSON.stringify({
                type: "initialize_chat",
                chat_id: userId,
              })
            );
          }
        } else {
          // If chat already exists, just open it
          handleSelectChat(userId);
        }
      } else {
        // Regular chat opening
        handleSelectChat(userId);
      }
    };

    window.addEventListener("openChat", handleOpenChat as EventListener);
    return () => window.removeEventListener("openChat", handleOpenChat as EventListener);
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
