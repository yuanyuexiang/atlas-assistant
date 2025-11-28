import { create } from 'zustand';
import type { Agent, AgentType, AgentStatus } from '@/types/models';
import { agentApi } from './api/agent';

interface AgentState {
  agents: Agent[];
  currentAgent: Agent | null;
  loading: boolean;
  
  // 获取智能体列表
  fetchAgents: (filters?: {
    status?: AgentStatus;
    agent_type?: AgentType;
  }) => Promise<void>;
  
  // 获取智能体详情（使用 UUID）
  fetchAgent: (agentId: string) => Promise<void>;
  
  // 创建智能体
  createAgent: (params: {
    name: string;
    display_name: string;
    agent_type: AgentType;
    system_prompt?: string;
    description?: string;
  }) => Promise<Agent>;
  
  // 更新智能体（使用 UUID）
  updateAgent: (agentId: string, params: {
    display_name?: string;
    system_prompt?: string;
    status?: 'active' | 'inactive';
    description?: string;
  }) => Promise<void>;
  
  // 删除智能体（使用 UUID）
  deleteAgent: (agentId: string) => Promise<void>;
  
  // 设置当前智能体
  setCurrentAgent: (agent: Agent | null) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  currentAgent: null,
  loading: false,

  fetchAgents: async (filters) => {
    set({ loading: true });
    try {
      const agents = await agentApi.list(filters);
      set({ agents, loading: false });
    } catch (error) {
      console.error('获取智能体列表失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  fetchAgent: async (agentId) => {
    set({ loading: true });
    try {
      const agent = await agentApi.get(agentId);
      set({ currentAgent: agent, loading: false });
    } catch (error) {
      console.error('获取智能体详情失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  createAgent: async (params) => {
    set({ loading: true });
    try {
      const agent = await agentApi.create(params);
      set((state) => ({
        agents: [...state.agents, agent],
        loading: false,
      }));
      return agent;
    } catch (error) {
      console.error('创建智能体失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  updateAgent: async (agentId, params) => {
    set({ loading: true });
    try {
      const updatedAgent = await agentApi.update(agentId, params);
      set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === agentId ? updatedAgent : agent
        ),
        currentAgent: state.currentAgent?.id === agentId ? updatedAgent : state.currentAgent,
        loading: false,
      }));
    } catch (error) {
      console.error('更新智能体失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  deleteAgent: async (agentId) => {
    set({ loading: true });
    try {
      await agentApi.delete(agentId);
      set((state) => ({
        agents: state.agents.filter((agent) => agent.id !== agentId),
        currentAgent: state.currentAgent?.id === agentId ? null : state.currentAgent,
        loading: false,
      }));
    } catch (error) {
      console.error('删除智能体失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  setCurrentAgent: (agent) => {
    set({ currentAgent: agent });
  },
}));
