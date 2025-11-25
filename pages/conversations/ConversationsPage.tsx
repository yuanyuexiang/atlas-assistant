import { useState } from 'react';
import { App } from 'antd';
import { ConversationList } from '@/features/conversation/components/ConversationList';
import { ConversationForm } from '@/features/conversation/components/ConversationForm';
import { AgentSwitcher } from '@/features/conversation/components/AgentSwitcher';
import { useConversation } from '@/features/conversation/hooks/useConversation';
import type { Conversation } from '@/types/models';

export default function ConversationsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [editingConversation, setEditingConversation] = useState<Conversation | null>(null);
  const [switchingConversation, setSwitchingConversation] = useState<Conversation | null>(null);
  const { deleteConversation, fetchConversations } = useConversation();
  const { modal, message } = App.useApp();

  const handleCreate = () => {
    setEditingConversation(null);
    setFormOpen(true);
  };

  const handleEdit = (conversation: Conversation) => {
    setEditingConversation(conversation);
    setFormOpen(true);
  };

  const handleDelete = (conversation: Conversation) => {
    modal.confirm({
      title: '确认删除',
      content: (
        <>
          <p>
            确定要删除客服 <strong>{conversation.display_name}</strong> 吗？
          </p>
          {conversation.message_count > 0 && (
            <p style={{ color: '#ff4d4f' }}>
              警告：该客服已有 {conversation.message_count} 条消息记录！
            </p>
          )}
          <p style={{ color: '#faad14' }}>
            注意：删除后将同时删除该客服的所有对话记录，此操作不可恢复！
          </p>
        </>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteConversation(conversation.id);
          message.success('客服删除成功');
        } catch (error: any) {
          console.error('删除失败:', error);
          console.error('错误详情:', error.response?.data);
          
          // 404 表示客服已经不存在了（store 已经处理了列表更新）
          if (error.response?.status === 404) {
            message.warning('该客服已不存在，可能已被删除');
          } else {
            const errorMsg = error.response?.data?.detail || error.message || '删除失败';
            message.error(errorMsg);
          }
        }
      },
    });
  };

  const handleSwitchAgent = (conversation: Conversation) => {
    setSwitchingConversation(conversation);
    setSwitcherOpen(true);
  };

  return (
    <>
      <ConversationList
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSwitchAgent={handleSwitchAgent}
      />

      <ConversationForm
        open={formOpen}
        conversation={editingConversation}
        onClose={() => {
          setFormOpen(false);
          setEditingConversation(null);
        }}
        onSuccess={() => {
          fetchConversations();
        }}
      />

      <AgentSwitcher
        open={switcherOpen}
        conversation={switchingConversation}
        onClose={() => {
          setSwitcherOpen(false);
          setSwitchingConversation(null);
        }}
        onSuccess={() => {
          fetchConversations();
        }}
      />
    </>
  );
}
