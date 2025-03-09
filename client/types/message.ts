export interface ChatFile {
  id: number;
  type: string;
  title: string;
  url: string;
}

export interface Message {
  id: number;
  isSender: boolean;
  content: string;
  timestamp: Date;
  file: ChatFile | null;
}

export interface ChatSession {
  id: number; // the other user's id
  name: string; // the other user's full name
  lastMessage: string;
  isUnread: boolean;
}
