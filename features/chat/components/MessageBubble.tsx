import { Avatar, Typography, Dropdown, message as antMessage } from 'antd';
import { UserOutlined, RobotOutlined, CopyOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import type { Message } from '@/types/models';
import { formatRelativeTime } from '@/lib/utils/format';
import { useChatStore } from '../store';
import styles from './MessageBubble.module.css';

const { Text } = Typography;

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export const MessageBubble = ({ message, isStreaming = false }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const { deleteMessage } = useChatStore();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      antMessage.success('已复制到剪贴板');
    }).catch(() => {
      antMessage.error('复制失败');
    });
  };

  const handleDelete = () => {
    deleteMessage(message.conversation_id, message.id).then(() => {
      antMessage.success('消息已删除');
    }).catch(() => {
      antMessage.error('删除失败');
    });
  };

  const menuItems = [
    {
      key: 'copy',
      label: '复制内容',
      icon: <CopyOutlined />,
      onClick: handleCopy,
    },
    {
      key: 'delete',
      label: '删除消息',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDelete,
    },
  ];

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
          
          {!isStreaming && (
            <Dropdown 
              menu={{ items: menuItems }} 
              placement="bottomRight"
              trigger={['click']}
            >
              <MoreOutlined className={styles.moreButton} />
            </Dropdown>
          )}
        </div>
        
        <Text type="secondary" className={styles.time}>
          {formatRelativeTime(message.created_at)}
        </Text>
      </div>
    </div>
  );
};
