import { ChatSession } from "@/types/chat";

interface ChatEventHandlerProps {
  chatSocket: WebSocket | null;
  chatSessions: ChatSession[];
  setOpen: (open: boolean) => void;
  setActiveChatId: (id: number) => void;
  setChatMessages: (messages: any[]) => void;
  handleSelectChat: (userId: number) => void;
}

export function setupChatEventHandler({
  chatSocket,
  chatSessions,
  setOpen,
  setActiveChatId,
  setChatMessages,
  handleSelectChat,
}: ChatEventHandlerProps) {
  const handleOpenChat = (event: CustomEvent) => {
    const { userId, isNewChat } = event.detail;
    setOpen(true);

    if (isNewChat) {
      const existingChat = chatSessions.find((session) => session.id === userId);

      if (!existingChat) {
        setActiveChatId(userId);
        setChatMessages([]);

        if (chatSocket?.readyState === WebSocket.OPEN) {
          chatSocket.send(
            JSON.stringify({
              type: "initialize_chat",
              chat_id: userId,
            })
          );
        }
      } else {
        handleSelectChat(userId);
      }
    } else {
      handleSelectChat(userId);
    }
  };

  window.addEventListener("openChat", handleOpenChat as EventListener);
  return () => window.removeEventListener("openChat", handleOpenChat as EventListener);
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
