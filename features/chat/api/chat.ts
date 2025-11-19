// Chat feature API
import { get, post, del } from '@/lib/http/http';
import type { Message, ApiResponse } from '@/types/models';

export interface SendMessageParams {
  conversation_id: string;
  content: string;
  agent_id?: string;
}

export const chatApi = {
  // 发送消息（普通）
  sendMessage: (params: SendMessageParams) =>
    post<Message>('/chat/message', params),

  // 获取对话消息列表
  getMessages: (conversationId: string, page = 1, pageSize = 50) =>
    get<ApiResponse<Message[]>>(`/chat/conversations/${conversationId}/messages`, {
      params: { page, page_size: pageSize },
    }),

  // 删除消息
  deleteMessage: (messageId: string) =>
    del(`/chat/messages/${messageId}`),

  // 清空对话历史
  clearHistory: (conversationId: string) =>
    del(`/chat/conversations/${conversationId}/messages`),
};
