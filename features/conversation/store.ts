import { create } from 'zustand';
import type { Conversation, ConversationStatus } from '@/types/models';
import { conversationApi } from './api/conversation';

interface ConversationState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  loading: boolean;
  
  // 获取客服列表
  fetchConversations: (filters?: {
    status?: ConversationStatus;
    agent_name?: string;
  }) => Promise<void>;
  
  // 获取客服详情
  fetchConversation: (conversationId: string) => Promise<Conversation>;
  
  // 创建客服
  createConversation: (params: {
    name: string;
    display_name: string;
    agent_name: string;
    avatar?: string;
    welcome_message?: string;
  }) => Promise<Conversation>;
  
  // 更新客服
  updateConversation: (conversationId: string, params: {
    display_name?: string;
    avatar?: string;
    welcome_message?: string;
    status?: 'online' | 'offline' | 'busy';
  }) => Promise<void>;
  
  // 删除客服
  deleteConversation: (conversationId: string) => Promise<void>;
  
  // 切换智能体
  switchAgent: (conversationId: string, newAgentName: string) => Promise<void>;
  
  // 设置当前客服
  setCurrentConversation: (conversation: Conversation | null) => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  conversations: [],
  currentConversation: null,
  loading: false,

  fetchConversations: async (filters) => {
    set({ loading: true });
    try {
      const conversations = await conversationApi.list(filters);
      set({ conversations, loading: false });
    } catch (error) {
      console.error('获取客服列表失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  fetchConversation: async (conversationId) => {
    set({ loading: true });
    try {
      const conversation = await conversationApi.get(conversationId);
      set({ currentConversation: conversation, loading: false });
      return conversation; // 返回数据供调用方使用
    } catch (error) {
      console.error('获取客服详情失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  createConversation: async (params) => {
    set({ loading: true });
    try {
      const conversation = await conversationApi.create(params);
      set((state) => ({
        conversations: [...state.conversations, conversation],
        loading: false,
      }));
      return conversation;
    } catch (error) {
      console.error('创建客服失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  updateConversation: async (conversationId, params) => {
    set({ loading: true });
    try {
      const updatedConversation = await conversationApi.update(conversationId, params);
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId ? updatedConversation : conv
        ),
        currentConversation: state.currentConversation?.id === conversationId 
          ? updatedConversation 
          : state.currentConversation,
        loading: false,
      }));
    } catch (error: any) {
      console.error('更新客服失败:', error);
      
      // 如果是 404，说明客服已经不存在，从列表中移除
      if (error.response?.status === 404) {
        console.warn('客服不存在，从列表中移除:', conversationId);
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== conversationId),
          currentConversation: state.currentConversation?.id === conversationId 
            ? null 
            : state.currentConversation,
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
      
      throw error;
    }
  },

  deleteConversation: async (conversationId) => {
    set({ loading: true });
    try {
      await conversationApi.delete(conversationId);
      set((state) => ({
        conversations: state.conversations.filter((conv) => conv.id !== conversationId),
        currentConversation: state.currentConversation?.id === conversationId 
          ? null 
          : state.currentConversation,
        loading: false,
      }));
    } catch (error: any) {
      console.error('[Conversation Store] 删除客服失败:', error);
      
      // 如果是 404，说明客服已经不存在，从列表中移除
      if (error.response?.status === 404) {
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== conversationId),
          currentConversation: state.currentConversation?.id === conversationId 
            ? null 
            : state.currentConversation,
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
      
      throw error;
    }
  },

  switchAgent: async (conversationId, newAgentName) => {
    set({ loading: true });
    try {
      const updatedConversation = await conversationApi.switchAgent(conversationId, {
        new_agent_name: newAgentName,
      });
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId ? updatedConversation : conv
        ),
        currentConversation: state.currentConversation?.id === conversationId 
          ? updatedConversation 
          : state.currentConversation,
        loading: false,
      }));
    } catch (error: any) {
      console.error('切换智能体失败:', error);
      
      // 如果是 404，说明客服已经不存在，从列表中移除
      if (error.response?.status === 404) {
        console.warn('客服不存在，从列表中移除:', conversationId);
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== conversationId),
          currentConversation: state.currentConversation?.id === conversationId 
            ? null 
            : state.currentConversation,
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
      
      throw error;
    }
  },

  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
  },
}));

