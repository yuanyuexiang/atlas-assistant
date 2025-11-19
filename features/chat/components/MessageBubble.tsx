import { Avatar, Typography } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import type { Message } from '@/types/models';
import { formatRelativeTime } from '@/lib/utils/format';
import styles from './MessageBubble.module.css';

const { Text } = Typography;

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export const MessageBubble = ({ message, isStreaming = false }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  return (
    <div className={`${styles.container} ${isUser ? styles.user : styles.assistant}`}>
      <Avatar
        className={styles.avatar}
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        style={{ backgroundColor: isUser ? '#1890ff' : '#52c41a' }}
      />
      
      <div className={styles.content}>
        <div className={styles.bubble}>
          {isUser ? (
            <Text>{message.content}</Text>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
          {isStreaming && <span className={styles.cursor}>▊</span>}
        </div>
        
        <Text type="secondary" className={styles.time}>
          {formatRelativeTime(message.created_at)}
        </Text>
      </div>
    </div>
  );
};
