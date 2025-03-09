import { toast } from "sonner";
import { ChatMessageResponse, ChatSessionResponse, Message, ChatSession } from "@/types/chat";

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

  const handleMessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    console.log("[CHAT DEBUG] WebSocket message received:", JSON.stringify(data, null, 2));

    switch (data.type) {
      case "chat_message":
        handleChatMessage(data);
        break;
      case "chat_history":
        handleChatHistory(data);
        break;
      case "message_sent":
        handleMessageSent(data);
        break;
      case "read_status_update":
        handleReadStatusUpdate(data);
        break;
      case "chat_sessions":
        handleChatSessions(data);
        break;
      case "error":
        toast.error(data.message || "An error occurred");
        break;
    }
  };

  const handleChatMessage = (data: any) => {
    const message = data.message;
    if (message.sender_id === activeChatId || message.receiver_id === activeChatId) {
      const newMessage: Message = {
        id: message.id,
        content: message.content,
        isSender: false,
        timestamp: new Date(message.timestamp),
        file: message.file || null,
      };
      setChatMessages((prev) => [...prev, newMessage]);
    }

    updateChatSession(message);
    showMessageNotification(message);
  };

  const handleChatHistory = (data: any) => {
    setChatMessages(
      data.messages.map((msg: ChatMessageResponse) => ({
        id: msg.id,
        content: msg.content,
        isSender: msg.isSender,
        timestamp: new Date(msg.timestamp),
        file: msg.file,
      }))
    );
  };

  const handleMessageSent = (data: any) => {
    const message = data.message;
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
  };

  const handleReadStatusUpdate = (data: any) => {
    if (data.all_read) {
      setHasUnread(false);
    } else {
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === data.chat_id ? { ...session, isUnread: data.has_unread } : session
        )
      );
      setHasUnread(data.any_unread_sessions);
    }
  };

  const handleChatSessions = (data: any) => {
    setChatSessions(
      data.sessions.map((session: ChatSessionResponse) => ({
        id: session.id,
        name: session.name,
        lastMessage: session.last_message,
        isUnread: session.is_unread,
      }))
    );
    setHasUnread(data.sessions.some((session: ChatSessionResponse) => session.is_unread));
  };

  const updateChatSession = (message: any) => {
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

  const showMessageNotification = (message: any) => {
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
