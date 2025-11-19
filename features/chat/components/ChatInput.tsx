import { useState } from 'react';
import { Input, Button } from 'antd';
import { SendOutlined, StopOutlined } from '@ant-design/icons';
import { useSSEChat } from '../hooks/useSSEChat';
import styles from './ChatInput.module.css';

const { TextArea } = Input;

interface ChatInputProps {
  conversationId: string;
  agentId?: string;
}

export const ChatInput = ({ conversationId, agentId }: ChatInputProps) => {
  const [content, setContent] = useState('');
  const { sendMessage, stopStreaming, isStreaming } = useSSEChat(conversationId);

  const handleSend = () => {
    if (!content.trim() || isStreaming) return;
    
    sendMessage(content, agentId);
    setContent('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.container}>
      <TextArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
        autoSize={{ minRows: 1, maxRows: 4 }}
        disabled={isStreaming}
        className={styles.input}
      />
      
      {isStreaming ? (
        <Button
          type="primary"
          danger
          icon={<StopOutlined />}
          onClick={stopStreaming}
          className={styles.button}
        >
          停止
        </Button>
      ) : (
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={!content.trim()}
          className={styles.button}
        >
          发送
        </Button>
      )}
    </div>
  );
};
