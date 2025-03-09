export interface ChatFile {
  id: string;
  title: string;
  url: string;
}

export interface Message {
  id: string;
  content: string;
  sender: string;
  sender_id: string;
  receiver: string;
  receiver_id: number;
  timestamp: Date;
  files: ChatFile[];
  is_read: boolean;
}

export interface ChatSession {
  id: string; // the other user's id
  name: string; // the other user's full name
  lastMessage: string;
  unreadCount: number;
  messages: Message[];
}