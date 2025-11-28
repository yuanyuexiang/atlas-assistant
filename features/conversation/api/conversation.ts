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
  agent_name?: string;  // 🆕 可选：更换关联的智能体（支持 name 或 id）
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
    let conversations = [];
    
    // 处理可能的对象格式返回
    if (response && typeof response === 'object' && 'conversations' in response) {
      conversations = response.conversations;
    } else if (Array.isArray(response)) {
      conversations = response;
    }
    
    // 转换数据格式：将嵌套的 agent 对象展开
    return conversations.map((conv: any) => ({
      ...conv,
      agent_name: conv.agent?.name || conv.agent_name,
      agent_display_name: conv.agent?.display_name || conv.agent_display_name,
      agent_id: conv.agent?.id || conv.agent_id,
    })) as Conversation[];
  },

  // 获取客服详情
  get: async (conversationId: string) => {
    const response = await get<any>(`/conversations/${conversationId}`);
    // 转换数据格式
    return {
      ...response,
      agent_name: response.agent?.name || response.agent_name,
      agent_display_name: response.agent?.display_name || response.agent_display_name,
      agent_id: response.agent?.id || response.agent_id,
    } as Conversation;
  },

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
