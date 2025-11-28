import { useState, useEffect, useCallback, useMemo } from 'react';
import { conversationApi } from '../api/conversation';
import type { Conversation, ConversationStatus } from '@/types/models';

// 不使用 Store，直接调用 API
export const useConversationList = (filters?: {
  status?: ConversationStatus;
  agent_name?: string;
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const stableFilters = useMemo(() => filters, [filters?.status, filters?.agent_name]);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await conversationApi.list(stableFilters);
      setConversations(data);
    } catch (error) {
      console.error('获取客服列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [stableFilters]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    refetch: fetchConversations,
  };
};

// 用于单个客服操作的 hook
export const useConversation = () => {
  const [loading, setLoading] = useState(false);

  const createConversation = async (params: {
    name: string;
    display_name: string;
    agent_name: string;
    avatar?: string;
    welcome_message?: string;
  }) => {
    setLoading(true);
    try {
      const conversation = await conversationApi.create(params);
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const updateConversation = async (conversationId: string, params: {
    display_name?: string;
    avatar?: string;
    welcome_message?: string;
    status?: 'online' | 'offline' | 'busy';
    agent_name?: string;  // 🆕 支持在更新时切换智能体
  }) => {
    setLoading(true);
    try {
      const conversation = await conversationApi.update(conversationId, params);
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    setLoading(true);
    try {
      await conversationApi.delete(conversationId);
    } finally {
      setLoading(false);
    }
  };

  const switchAgent = async (conversationId: string, newAgentName: string) => {
    setLoading(true);
    try {
      const conversation = await conversationApi.switchAgent(conversationId, {
        new_agent_name: newAgentName,
      });
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (conversationId: string) => {
    setLoading(true);
    try {
      const conversation = await conversationApi.get(conversationId);
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createConversation,
    updateConversation,
    deleteConversation,
    switchAgent,
    fetchConversation,
  };
};
