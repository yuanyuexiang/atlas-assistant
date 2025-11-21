// Conversation feature API
import { get, post, put, del } from '@/lib/http/http';
import type { Conversation } from '@/types/models';

export interface CreateConversationParams {
  name: string;
  display_name: string;
  agent_name: string;
  avatar?: string;
  welcome_message?: string;
}

export interface UpdateConversationParams {
  display_name?: string;
  avatar?: string;
  welcome_message?: string;
  status?: 'online' | 'offline' | 'busy';
}

export interface ConversationListParams {
  status?: 'online' | 'offline' | 'busy';
  agent_name?: string;
  skip?: number;
  limit?: number;
}

export interface SwitchAgentParams {
  new_agent_name: string;
}

export const conversationApi = {
  // 创建客服
  create: (params: CreateConversationParams) =>
    post<Conversation>('/conversations', params),

  // 获取客服列表
  list: async (params: ConversationListParams = {}) => {
    const response = await get<any>('/conversations', { params });
    // 处理可能的对象格式返回
    if (response && typeof response === 'object' && 'conversations' in response) {
      return response.conversations as Conversation[];
    }
    return Array.isArray(response) ? response : [];
  },

  // 获取客服详情
  get: (conversationId: string) =>
    get<Conversation>(`/conversations/${conversationId}`),

  // 更新客服
  update: (conversationId: string, params: UpdateConversationParams) =>
    put<Conversation>(`/conversations/${conversationId}`, params),

  // 删除客服
  delete: (conversationId: string) =>
    del(`/conversations/${conversationId}`),

  // 切换智能体 ⭐ 核心功能
  switchAgent: (conversationId: string, params: SwitchAgentParams) =>
    post<Conversation>(`/conversations/${conversationId}/switch-agent`, params),

  // 获取客服统计
  getStats: (conversationId: string) =>
    get<Conversation>(`/conversations/${conversationId}`),
};
