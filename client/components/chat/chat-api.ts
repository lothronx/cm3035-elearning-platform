import { fetchWithAuth } from "@/lib/auth";
import { ChatMessageResponse, ChatSessionResponse, Message, ChatSession } from "@/types/chat";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function sendMessage(activeChatId: number, content: string, file?: File) {
  if (file) {
    const formData = new FormData();
    formData.append("receiver", activeChatId.toString());
    if (content) formData.append("content", content);
    formData.append("file", file);

    const response = await fetchWithAuth(`${API_URL}/api/chat/`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send message");
    }

    return await response.json();
  }

  const response = await fetchWithAuth(`${API_URL}/api/chat/`, {
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

  return await response.json();
}

export async function fetchChatHistory(chatId: number): Promise<Message[]> {
  const response = await fetchWithAuth(`${API_URL}/api/chat/${chatId}/`);
  const messages: ChatMessageResponse[] = await response.json();
  
  return messages.map((msg) => ({
    id: msg.id,
    content: msg.content,
    isSender: msg.isSender,
    timestamp: new Date(msg.timestamp),
    file: msg.file,
  }));
}

export async function fetchChatSessions(): Promise<ChatSession[]> {
  const response = await fetchWithAuth(`${API_URL}/api/chat/`);
  const sessions: ChatSessionResponse[] = await response.json();
  
  if (!Array.isArray(sessions)) {
    return [];
  }

  return sessions.map((session) => ({
    id: session.id,
    name: session.name,
    lastMessage: session.last_message,
    isUnread: session.is_unread,
  }));
}

export async function markChatAsRead(chatId: number): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/api/chat/mark_chat_read/`, {
    method: "POST",
    body: JSON.stringify({ chat_id: chatId }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to mark chat as read");
  }
}

export async function initializeChat(chatId: number): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/api/chat/initialize/`, {
    method: "POST",
    body: JSON.stringify({ chat_id: chatId }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to initialize chat");
  }
}
