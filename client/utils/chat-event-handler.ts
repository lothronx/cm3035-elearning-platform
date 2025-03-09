import { ChatSession, Message } from "@/types/chat";
import { initializeChat } from "@/utils/chat-api";

interface ChatEventHandlerProps {
  chatSessions: ChatSession[];
  setOpen: (open: boolean) => void;
  setActiveChatId: (id: number) => void;
  setChatMessages: (messages: Message[]) => void;
  handleSelectChat: (userId: number) => void;
}

interface OpenChatEvent extends CustomEvent {
  detail: {
    userId: number;
    isNewChat: boolean;
  };
}

export function setupChatEventHandler({
  chatSessions,
  setOpen,
  setActiveChatId,
  setChatMessages,
  handleSelectChat,
}: ChatEventHandlerProps) {
  const handleOpenChat = async (event: Event) => {
    const customEvent = event as OpenChatEvent;
    const { userId, isNewChat } = customEvent.detail;
    setOpen(true);

    if (isNewChat) {
      const existingChat = chatSessions.find((session) => session.id === userId);

      if (!existingChat) {
        setActiveChatId(userId);
        setChatMessages([]);

        // Initialize chat via API instead of WebSocket
        try {
          await initializeChat(userId);
        } catch (error) {
          console.error("Error initializing chat:", error);
        }
      } else {
        handleSelectChat(userId);
      }
    } else {
      handleSelectChat(userId);
    }
  };

  window.addEventListener("openChat", handleOpenChat);
  return () => window.removeEventListener("openChat", handleOpenChat);
}

export function setupWebSocketEvents(chatSocket: WebSocket | null) {
  if (!chatSocket) return () => {};

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

  chatSocket.addEventListener("open", onOpen);
  chatSocket.addEventListener("close", onClose);
  chatSocket.addEventListener("error", onError);

  return () => {
    chatSocket.removeEventListener("open", onOpen);
    chatSocket.removeEventListener("close", onClose);
    chatSocket.removeEventListener("error", onError);
  };
}
