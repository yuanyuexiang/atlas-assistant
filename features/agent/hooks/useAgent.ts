import { useEffect, useMemo } from 'react';
import { useAgentStore } from '../store';
import type { AgentType, AgentStatus } from '@/types/models';

export const useAgent = (agentName?: string) => {
  const {
    agents,
    currentAgent,
    loading,
    fetchAgents,
    fetchAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    setCurrentAgent,
  } = useAgentStore();

  useEffect(() => {
    if (agentName) {
      fetchAgent(agentName);
    }
  }, [agentName, fetchAgent]);

  return {
    agents,
    currentAgent,
    loading,
    fetchAgents,
    fetchAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    setCurrentAgent,
  };
};

export const useAgentList = (filters?: {
  status?: AgentStatus;
  agent_type?: AgentType;
}) => {
  const { agents, loading, fetchAgents } = useAgentStore();

  // 使用 useMemo 稳定 filters 对象引用
  const stableFilters = useMemo(() => filters, [filters?.status, filters?.agent_type]);

  useEffect(() => {
    fetchAgents(stableFilters);
  }, [stableFilters, fetchAgents]);

  return {
    agents,
    loading,
    refetch: () => fetchAgents(stableFilters),
  };
};
