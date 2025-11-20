// Agent feature API
import { get, post, put, del } from '@/lib/http/http';
import type { Agent } from '@/types/models';

export interface CreateAgentParams {
  name: string;
  display_name: string;
  agent_type: 'general' | 'legal' | 'medical' | 'financial' | 'custom';
  system_prompt?: string;
  description?: string;
}

export interface UpdateAgentParams {
  display_name?: string;
  system_prompt?: string;
  status?: 'active' | 'inactive';
  description?: string;
}

export interface AgentListParams {
  status?: 'active' | 'inactive' | 'training' | 'error';
  agent_type?: 'general' | 'legal' | 'medical' | 'financial' | 'custom';
  skip?: number;
  limit?: number;
}

export const agentApi = {
  // 创建智能体
  create: (params: CreateAgentParams) =>
    post<Agent>('/agents', params),

  // 获取智能体列表
  list: async (params: AgentListParams = {}) => {
    const response = await get<any>('/agents', { params });
    // 后端可能返回对象 {agents: [...]} 或直接返回数组
    if (response && typeof response === 'object' && 'agents' in response) {
      return response.agents as Agent[];
    }
    return Array.isArray(response) ? response : [];
  },

  // 获取智能体详情
  get: (agentName: string) =>
    get<Agent>(`/agents/${agentName}`),

  // 更新智能体
  update: (agentName: string, params: UpdateAgentParams) =>
    put<Agent>(`/agents/${agentName}`, params),

  // 删除智能体
  delete: (agentName: string) =>
    del(`/agents/${agentName}`),

  // 获取智能体统计
  getStats: (agentName: string) =>
    get<Agent>(`/agents/${agentName}`),
};
