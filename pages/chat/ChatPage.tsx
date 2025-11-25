import { useState, useEffect } from 'react';
import { Layout, Select, Button, Space, App } from 'antd';
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { ChatWindow } from '@/features/chat/components/ChatWindow';
import { ChatInput } from '@/features/chat/components/ChatInput';
import { useConversationList } from '@/features/conversation/hooks/useConversation';
import { useChatStore } from '@/features/chat/store';
import styles from './ChatPage.module.css';

const { Content, Header } = Layout;

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string>('');
  const { conversations, loading } = useConversationList();
  const { loadMessages, clearHistory } = useChatStore();
  const { message } = App.useApp();

  // 自动选择第一个客服
  useEffect(() => {
    if (conversations.length > 0 && !conversationId) {
      setConversationId(conversations[0].id);
    }
  }, [conversations, conversationId]);

  // 当切换客服时，加载历史消息
  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    }
  }, [conversationId, loadMessages]);

  const handleClearHistory = () => {
    if (!conversationId) return;
    
    clearHistory(conversationId).then(() => {
      message.success('对话历史已清空');
    }).catch(() => {
      message.error('清空失败');
    });
  };

  const handleRefresh = () => {
    if (conversationId) {
      loadMessages(conversationId);
      message.success('已刷新消息');
    }
  };

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <Space style={{ width: '100%' }} direction="horizontal">
          <Select
            style={{ minWidth: 200, flex: 1 }}
            placeholder="选择客服"
            value={conversationId || undefined}
            onChange={setConversationId}
            loading={loading}
            options={conversations.map(c => ({
              value: c.id,
              label: c.display_name,
              disabled: c.status === 'offline',
            }))}
          />
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            disabled={!conversationId}
          >
            刷新
          </Button>
          <Button 
            icon={<DeleteOutlined />} 
            danger 
            onClick={handleClearHistory}
            disabled={!conversationId}
          >
            清空历史
          </Button>
        </Space>
      </Header>
      <Content className={styles.content}>
        {conversationId ? (
          <>
            <ChatWindow conversationId={conversationId} />
            <ChatInput conversationId={conversationId} />
          </>
        ) : (
          <div className={styles.empty}>
            <p>请选择一个客服开始对话</p>
          </div>
        )}
      </Content>
    </Layout>
  );
}
