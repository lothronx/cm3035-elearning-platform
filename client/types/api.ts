export interface ChatSessionResponse {
  id: number;
  name: string;
  last_message: string;
  is_unread: boolean;
}

export interface ChatMessageResponse {
  id: number;
  isSender: boolean;
  content: string;
  timestamp: string;
  file: {
    id: number;
    type: string;
    title: string;
    url: string;
  } | null;
}
