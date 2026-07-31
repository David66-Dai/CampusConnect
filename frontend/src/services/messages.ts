import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { ChatMessage, ConversationSummary } from "@/types/message";

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const { data } = await api.get<ApiResponse<ConversationSummary[]>>(
    "/messages/conversations"
  );
  return data.data;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get<ApiResponse<{ count: number }>>(
    "/messages/unread-count"
  );
  return data.data.count;
}

/** 拉取与某用户的聊天记录（后端会把对方消息标记为已读） */
export async function fetchConversation(
  peerId: number
): Promise<ChatMessage[]> {
  const { data } = await api.get<ApiResponse<ChatMessage[]>>(
    `/messages/${peerId}`
  );
  return data.data;
}

export async function sendMessage(
  peerId: number,
  content: string
): Promise<ChatMessage> {
  const { data } = await api.post<ApiResponse<ChatMessage>>(
    `/messages/${peerId}`,
    { content }
  );
  return data.data;
}
