import { useState, useEffect } from 'react';
import { Select, Button, Space, App, Badge, Tooltip, Card } from 'antd';
import { 
  ReloadOutlined, 
  CustomerServiceOutlined,
  MessageOutlined,
  HistoryOutlined 
} from '@ant-design/icons';
import { ChatWindow } from '@/features/chat/components/ChatWindow';
import { ChatInput } from '@/features/chat/components/ChatInput';
import { useConversationList } from '@/features/conversation/hooks/useConversation';
import { useChatStore } from '@/features/chat/store';
import styles from './ChatPage.module.css';

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string>('');
  const { conversations, loading } = useConversationList();
  const { loadMessages, clearHistory, messages } = useChatStore();
  const { message } = App.useApp();

  // 自动选择第一个在线客服
  useEffect(() => {
    if (conversations.length > 0 && !conversationId) {
      // 优先选择在线的客服
      const onlineConversation = conversations.find(c => c.status === 'online');
      const targetConversation = onlineConversation || conversations[0];
      setConversationId(targetConversation.id);
    }
  }, [conversations, conversationId]);

  // 当切换客服时，加载历史消息
  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId).catch((error) => {
        console.error('加载消息失败:', error);
        if (error.response?.status === 404) {
          message.warning('该客服暂无历史消息');
        } else {
          message.error('加载消息失败');
        }
      });
    }
  }, [conversationId, loadMessages, message]);

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

  const selectedConversation = conversations.find(c => c.id === conversationId);
  const messageCount = messages[conversationId]?.length || 0;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* 顶部工具栏 */}
        <Card className={styles.headerCard} variant="borderless">
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <CustomerServiceOutlined className={styles.titleIcon} />
              <div className={styles.titleInfo}>
                <h2 className={styles.title}>客服对话</h2>
                {selectedConversation && (
                  <div className={styles.subtitle}>
                    <Badge 
                      status={selectedConversation.status === 'online' ? 'success' : 'default'} 
                      text={selectedConversation.status === 'online' ? '在线' : '离线'}
                    />
                    {messageCount > 0 && (
                      <span className={styles.messageCount}>
                        <MessageOutlined /> {messageCount} 条消息
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.toolbar}>
              <Select
                className={styles.select}
                placeholder="选择客服"
                value={conversationId || undefined}
                onChange={setConversationId}
                loading={loading}
                suffixIcon={<CustomerServiceOutlined />}
                popupMatchSelectWidth={false}
                options={conversations.map(c => ({
                  value: c.id,
                  label: (
                    <div className={styles.selectOption}>
                      <span>{c.display_name}</span>
                      <Badge 
                        status={c.status === 'online' ? 'success' : 'default'}
                        className={styles.statusBadge}
                      />
                    </div>
                  ),
                  disabled: c.status === 'offline',
                }))}
              />
              
              <Space size="small">
                <Tooltip title="刷新消息">
                  <Button 
                    type="text"
                    icon={<ReloadOutlined />} 
                    onClick={handleRefresh}
                    disabled={!conversationId}
                    className={styles.toolButton}
                  />
                </Tooltip>
                <Tooltip title="清空历史">
                  <Button 
                    type="text"
                    icon={<HistoryOutlined />}
                    onClick={handleClearHistory}
                    disabled={!conversationId}
                    danger
                    className={styles.toolButton}
                  />
                </Tooltip>
              </Space>
            </div>
          </div>
        </Card>

        {/* 聊天区域 */}
        <Card className={styles.chatCard} variant="borderless">
          {conversationId ? (
            <div className={styles.chatContainer}>
              <ChatWindow conversationId={conversationId} />
              <ChatInput conversationId={conversationId} />
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <CustomerServiceOutlined />
              </div>
              <h3>欢迎使用客服系统</h3>
              <p>请选择一个客服开始对话</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
