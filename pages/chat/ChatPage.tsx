import { useState } from 'react';
import { Layout } from 'antd';
import { ChatWindow } from '@/features/chat/components/ChatWindow';
import { ChatInput } from '@/features/chat/components/ChatInput';
import styles from './ChatPage.module.css';

const { Content } = Layout;

export default function ChatPage() {
  const [conversationId] = useState('default-conversation');

  return (
    <Layout className={styles.layout}>
      <Content className={styles.content}>
        <ChatWindow conversationId={conversationId} />
        <ChatInput conversationId={conversationId} />
      </Content>
    </Layout>
  );
}
