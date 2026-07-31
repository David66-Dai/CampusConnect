export type PeerInfo = {
  id: number;
  name: string;
  avatar_url: string | null;
  school: string;
  grade: string;
};

export type ChatMessage = {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  read: boolean;
  created_at: string;
  is_mine: boolean;
};

export type ConversationSummary = {
  peer: PeerInfo;
  last_message: ChatMessage;
  unread_count: number;
};
