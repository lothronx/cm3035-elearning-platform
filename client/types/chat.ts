export interface Message {
  id: number;
  content: string;
  isSender: boolean;
  timestamp: Date;
  file: any | null;
}

export interface ChatSession {
  id: number;
  name: string;
  lastMessage: string;
  isUnread: boolean;
}

export interface ChatSessionResponse {
  id: number;
  name: string;
  last_message: string;
  is_unread: boolean;
}

export interface ChatMessageResponse {
  id: number;
  content: string;
  isSender: boolean;
  timestamp: string;
  file: any | null;
  sender_id?: number;
  receiver_id?: number;
  sender_name?: string;
}
