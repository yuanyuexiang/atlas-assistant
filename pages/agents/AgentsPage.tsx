import { useState } from 'react';
import { Modal, message } from 'antd';
import { AgentList } from '@/features/agent/components/AgentList';
import { AgentForm } from '@/features/agent/components/AgentForm';
import { useAgent } from '@/features/agent/hooks/useAgent';
import type { Agent } from '@/types/models';

export default function AgentsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const { deleteAgent, fetchAgents } = useAgent();

  const handleCreate = () => {
    setEditingAgent(null);
    setFormOpen(true);
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormOpen(true);
  };

  const handleDelete = (agent: Agent) => {
    Modal.confirm({
      title: '确认删除',
      content: (
        <>
          <p>确定要删除智能体 <strong>{agent.display_name}</strong> 吗？</p>
          {agent.conversations_using.length > 0 && (
            <p style={{ color: '#ff4d4f' }}>
              警告：该智能体正被 {agent.conversations_using.length} 个客服使用！
            </p>
          )}
          <p style={{ color: '#faad14' }}>
            注意：删除后将同时删除该智能体的知识库数据，此操作不可恢复！
          </p>
        </>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          console.log('开始删除智能体:', agent.name);
          await deleteAgent(agent.name);
          console.log('删除智能体成功:', agent.name);
          message.success('智能体删除成功');
          // 刷新列表
          await fetchAgents();
        } catch (error: any) {
          console.error('删除失败:', error);
          const errorMsg = error.response?.data?.detail || error.message || '删除失败';
          message.error(errorMsg);
        }
      },
    });
  };

  return (
    <>
      <AgentList
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AgentForm
        open={formOpen}
        agent={editingAgent}
        onClose={() => {
          setFormOpen(false);
          setEditingAgent(null);
        }}
        onSuccess={() => {
          fetchAgents();
        }}
      />
    </>
  );
}
