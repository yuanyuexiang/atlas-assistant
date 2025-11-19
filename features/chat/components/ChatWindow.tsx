import { useEffect, useRef } from 'react';
import { Empty } from 'antd';
import { MessageBubble } from './MessageBubble';
import { useSSEChat } from '../hooks/useSSEChat';
import styles from './ChatWindow.module.css';

interface ChatWindowProps {
  conversationId: string;
}

export const ChatWindow = ({ conversationId }: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, currentStreamingMessage, isStreaming } = useSSEChat(conversationId);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingMessage]);

  if (!conversationId) {
    return (
      <div className={styles.empty}>
        <Empty description="请选择一个对话" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {messages.length === 0 && !isStreaming ? (
        <div className={styles.empty}>
          <Empty description="暂无消息，开始对话吧" />
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isStreaming && currentStreamingMessage && (
            <MessageBubble
              message={{
                id: 'streaming',
                conversation_id: conversationId,
                role: 'assistant',
                content: currentStreamingMessage,
                created_at: new Date().toISOString(),
              }}
              isStreaming
            />
          )}
          
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};
