import { useEffect, useMemo } from 'react';
import { useConversationStore } from '../store';
import type { ConversationStatus } from '@/types/models';

export const useConversation = (conversationId?: string) => {
  const {
    conversations,
    currentConversation,
    loading,
    fetchConversations,
    fetchConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    switchAgent,
    setCurrentConversation,
  } = useConversationStore();

  useEffect(() => {
    if (conversationId) {
      fetchConversation(conversationId);
    }
  }, [conversationId, fetchConversation]);

  return {
    conversations,
    currentConversation,
    loading,
    fetchConversations,
    fetchConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    switchAgent,
    setCurrentConversation,
  };
};

export const useConversationList = (filters?: {
  status?: ConversationStatus;
  agent_name?: string;
}) => {
  const { conversations, loading, fetchConversations } = useConversationStore();

  // 使用 useMemo 稳定 filters 对象引用
  const stableFilters = useMemo(() => filters, [filters?.status, filters?.agent_name]);

  useEffect(() => {
    fetchConversations(stableFilters);
  }, [stableFilters, fetchConversations]);

  return {
    conversations,
    loading,
    refetch: () => fetchConversations(stableFilters),
  };
};
