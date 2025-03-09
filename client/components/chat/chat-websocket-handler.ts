import { toast } from "sonner";
import { Message, ChatSession } from "@/types/chat";
import { fetchChatHistory, fetchChatSessions } from "@/components/chat/chat-api";

interface WebSocketHandlerProps {
  chatSocket: WebSocket | null;
  activeChatId: number;
  open: boolean;
  setChatMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setChatSessions: (sessions: ChatSession[] | ((prev: ChatSession[]) => ChatSession[])) => void;
  setHasUnread: (hasUnread: boolean) => void;
  viewChatFromNotification: (senderId: number) => void;
}

export function setupWebSocketHandler({
  chatSocket,
  activeChatId,
  open,
  setChatMessages,
  setChatSessions,
  setHasUnread,
  viewChatFromNotification,
}: WebSocketHandlerProps) {
  if (!chatSocket) return () => {};

  interface WebSocketMessage {
    type: string;
    message?: ChatMessage;
    message_id?: number;
    error?: string;
    chat_id?: number;
    all_read?: boolean;
    has_unread?: boolean;
    any_unread_sessions?: boolean;
  }

  interface ChatMessage {
    id: number;
    sender_id: number;
    receiver_id: number;
    sender_name: string;
    content: string;
    timestamp: string;
    file: ChatFile | null;
    temp_id?: number;
  }

  interface ChatFile {
    id: number;
    title: string;
    url: string;
  }

  const handleMessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data) as WebSocketMessage;
    console.log("[CHAT DEBUG] WebSocket message received:", JSON.stringify(data, null, 2));

    switch (data.type) {
      case "chat_message":
        if (data.message) handleChatMessage(data.message);
        break;
      case "read_status_update":
        handleReadStatusUpdate(data);
        break;
      case "chat_sessions_updated":
        refreshChatSessions();
        break;
      case "error":
        toast.error(data.error || "An error occurred");
        break;
    }
  };

  const handleChatMessage = (message: ChatMessage) => {
    // If looking at the current chat, update the message list
    if (message.sender_id === activeChatId && open) {
      // Refresh the entire chat history to ensure consistency
      refreshChatHistory(activeChatId);
    } else {
      // Just update the session data and show a notification
      updateChatSession(message);
      showMessageNotification(message);
    }
  };

  const handleReadStatusUpdate = (data: WebSocketMessage) => {
    if (data.all_read) {
      setHasUnread(false);
    } else if (data.chat_id !== undefined && data.any_unread_sessions !== undefined) {
      // Ensure has_unread is always a boolean with default false
      const isUnread = data.has_unread === undefined ? false : data.has_unread;
      
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === data.chat_id ? { ...session, isUnread } : session
        )
      );
      setHasUnread(data.any_unread_sessions);
    }
  };

  const refreshChatSessions = async () => {
    try {
      const sessions = await fetchChatSessions();
      setChatSessions(sessions);
      setHasUnread(sessions.some((session) => session.isUnread));
    } catch (error) {
      console.error("Error refreshing chat sessions:", error);
    }
  };

  const refreshChatHistory = async (chatId: number) => {
    try {
      const messages = await fetchChatHistory(chatId);
      setChatMessages(messages);
    } catch (error) {
      console.error("Error refreshing chat history:", error);
    }
  };

  const updateChatSession = (message: ChatMessage) => {
    setChatSessions((prev) =>
      prev.map((session) => {
        if (session.id === message.sender_id) {
          const isCurrentChat = session.id === activeChatId && open;
          return {
            ...session,
            lastMessage: message.content || "New message",
            isUnread: !isCurrentChat,
          };
        }
        return session;
      })
    );

    if (message.sender_id !== activeChatId || !open) {
      setHasUnread(true);
    }
  };

  const showMessageNotification = (message: ChatMessage) => {
    const toastTitle = `New message from ${message.sender_name}`;
    let toastDescription = "";

    if (message.content?.trim().length > 0) {
      toastDescription =
        message.content.length > 30 ? `${message.content.substring(0, 30)}...` : message.content;
    } else if (message.file) {
      toastDescription = message.file.title ? `Sent a file: ${message.file.title}` : "Sent a file";
    } else {
      toastDescription = "New message";
    }

    toast(toastTitle, {
      description: toastDescription,
      action: {
        label: "View",
        onClick: () => viewChatFromNotification(message.sender_id),
      },
    });
  };

  chatSocket.addEventListener("message", handleMessage);
  return () => chatSocket.removeEventListener("message", handleMessage);
}
