import { useState } from 'react';
import { App } from 'antd';
import { AgentList } from '@/features/agent/components/AgentList';
import { AgentForm } from '@/features/agent/components/AgentForm';
import { useAgent } from '@/features/agent/hooks/useAgent';
import type { Agent } from '@/types/models';

export default function AgentsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const { deleteAgent, fetchAgents } = useAgent();
  const { modal, message } = App.useApp();

  const handleCreate = () => {
    setEditingAgent(null);
    setFormOpen(true);
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormOpen(true);
  };

  const handleDelete = (agent: Agent) => {
    // 如果智能体正被使用，显示特殊提示
    if (agent.conversations_using && agent.conversations_using.length > 0) {
      modal.warning({
        title: '无法删除',
        content: (
          <>
            <p>智能体 <strong>{agent.display_name}</strong> 正被以下客服使用：</p>
            <ul>
              {agent.conversations_using.map((conv, idx) => (
                <li key={idx}>{conv}</li>
              ))}
            </ul>
            <p style={{ color: '#faad14', marginTop: 12 }}>
              请先在「客服管理」中删除这些客服，或切换它们使用的智能体后，再删除此智能体。
            </p>
          </>
        ),
        okText: '我知道了',
      });
      return;
    }

    // 没有被使用，正常删除流程
    modal.confirm({
      title: '确认删除',
      content: (
        <>
          <p>确定要删除智能体 <strong>{agent.display_name}</strong> 吗？</p>
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
          await deleteAgent(agent.name);
          message.success('智能体删除成功');
          // 刷新列表
          await fetchAgents();
        } catch (error: any) {
          console.error('删除失败:', error);
          console.error('错误详情:', error.response?.data);
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
