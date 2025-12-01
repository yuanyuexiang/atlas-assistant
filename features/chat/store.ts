import { create } from 'zustand';
import type { Message } from '@/types/models';
import { chatApi } from './api/chat';

interface ChatState {
  messages: Record<string, Message[]>; // conversationId -> messages
  currentStreamingMessage: string | null;
  isStreaming: boolean;
  
  // 加载消息
  loadMessages: (conversationId: string) => Promise<void>;
  
  // 添加消息
  addMessage: (conversationId: string, message: Message) => void;
  
  // 添加流式消息片段
  appendStreamingContent: (content: string) => void;
  
  // 完成流式消息
  completeStreamingMessage: (conversationId: string, message: Message) => void;
  
  // 设置流式状态
  setStreaming: (isStreaming: boolean) => void;
  
  // 删除消息
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
  
  // 清空对话历史
  clearHistory: (conversationId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: {},
  currentStreamingMessage: null,
  isStreaming: false,

  loadMessages: async (conversationId) => {
    try {
      const response = await chatApi.getMessages(conversationId);
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: response.data || [],
        },
      }));
    } catch (error: any) {
      console.error('加载消息失败:', error);
      // 404 表示消息不存在，设置为空数组而不是抛出错误
      if (error.response?.status === 404) {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [],
          },
        }));
      } else {
        throw error;
      }
    }
  },

  addMessage: (conversationId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
    }));
  },

  appendStreamingContent: (content) => {
    set((state) => ({
      currentStreamingMessage: (state.currentStreamingMessage || '') + content,
    }));
  },

  completeStreamingMessage: (conversationId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
      currentStreamingMessage: null,
      isStreaming: false,
    }));
  },

  setStreaming: (isStreaming) => {
    set({ isStreaming, currentStreamingMessage: isStreaming ? '' : null });
  },

  deleteMessage: async (conversationId, messageId) => {
    try {
      await chatApi.deleteMessage(conversationId, messageId);
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId]?.filter(
            (msg) => msg.id !== messageId
          ) || [],
        },
      }));
    } catch (error) {
      console.error('删除消息失败:', error);
      throw error;
    }
  },

  clearHistory: async (conversationId) => {
    try {
      await chatApi.clearHistory(conversationId);
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [],
        },
      }));
    } catch (error) {
      console.error('清空历史失败:', error);
      throw error;
    }
  },
}));
