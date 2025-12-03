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
      // 后端返回格式：{ success: true, data: { messages: [...], pagination: {...} } }
      // 类型断言处理后端实际返回的嵌套结构
      const responseData = response.data as any;
      const messagesData = responseData?.messages || response.data || [];
      // 确保是数组格式
      const rawMessages = Array.isArray(messagesData) ? messagesData : [];
      
      // 转换后端消息格式为前端 Message 格式
      const formattedMessages: Message[] = rawMessages.map((msg: any, index: number) => ({
        id: msg.id || `msg-${Date.now()}-${index}`,
        conversation_id: conversationId,
        role: msg.role || 'user',
        content: msg.content || '',
        created_at: msg.timestamp || msg.created_at || new Date().toISOString(),
        agent_id: msg.agent_id,
        metadata: msg.metadata,
      }));
      
      // 按时间顺序排序，最早的消息在前
      formattedMessages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: formattedMessages,
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
