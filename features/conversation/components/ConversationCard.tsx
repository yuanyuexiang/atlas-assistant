import { Card, Button, Typography, Avatar, Dropdown } from 'antd';
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  RobotOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  SwapOutlined,
  MoreOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import type { Conversation } from '@/types/models';
import { formatRelativeTime } from '@/lib/utils/format';
import styles from './ConversationCard.module.css';

const { Text, Paragraph } = Typography;

interface ConversationCardProps {
  conversation: Conversation;
  onEdit?: (conversation: Conversation) => void;
  onDelete?: (conversation: Conversation) => void;
  onSwitchAgent?: (conversation: Conversation) => void;
}

export const ConversationCard = ({ 
  conversation, 
  onEdit, 
  onDelete,
  onSwitchAgent 
}: ConversationCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    // 跳转到聊天页面并传递客服ID
    navigate(`/chat?conversation=${conversation.id}`);
  };

  const handleMenuClick = (e: { key: string }) => {
    // 阻止事件冒泡，避免触发卡片点击
    switch (e.key) {
      case 'switch':
        onSwitchAgent?.(conversation);
        break;
      case 'edit':
        onEdit?.(conversation);
        break;
      case 'delete':
        onDelete?.(conversation);
        break;
    }
  };

  const menuItems = [
    {
      key: 'switch',
      label: '切换智能体',
      icon: <SwapOutlined />,
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
    },
  ];

  return (
    <Card
      hoverable
      className={styles.card}
      onClick={handleCardClick}
      bodyStyle={{ padding: '24px' }}
    >
      <div className={styles.cardContent}>
        {/* 头部：头像 + 名称 */}
        <div className={styles.header}>
          <div className={styles.mainInfo}>
            <div className={styles.avatarWrapper}>
              <Avatar 
                size={64} 
                src={conversation.avatar} 
                icon={<UserOutlined />}
                className={styles.avatar}
              />
              <span 
                className={styles.statusDot}
                data-status={conversation.status}
              />
            </div>
            <div className={styles.infoContent}>
              <Text strong className={styles.displayName}>
                {conversation.display_name}
              </Text>
              <Text type="secondary" className={styles.systemName}>
                {conversation.name}
              </Text>
            </div>
          </div>
          
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown 
              menu={{ items: menuItems, onClick: handleMenuClick }} 
              trigger={['click']}
              placement="bottomRight"
            >
              <Button 
                type="text" 
                icon={<MoreOutlined />} 
                className={styles.moreButton}
              />
            </Dropdown>
          </div>
        </div>

        {/* 关联智能体 */}
        <div className={styles.agentSection}>
          <div className={styles.agentIcon}>
            <RobotOutlined />
          </div>
          <div className={styles.agentInfo}>
            <Text type="secondary" className={styles.agentLabel}>关联智能体</Text>
            <Text strong className={styles.agentName}>{conversation.agent_display_name}</Text>
          </div>
        </div>

        {/* 欢迎消息 */}
        {conversation.welcome_message && (
          <div className={styles.welcomeSection}>
            <div className={styles.welcomeIcon}>
              <CommentOutlined />
            </div>
            <div className={styles.welcomeInfo}>
              <Text type="secondary" className={styles.welcomeLabel}>欢迎消息</Text>
              <Paragraph
                ellipsis={{ rows: 2 }}
                className={styles.welcomeText}
              >
                {conversation.welcome_message}
              </Paragraph>
            </div>
          </div>
        )}

        {/* 统计信息 */}
        <div className={styles.statsSection}>
          <div className={styles.statItem}>
            <MessageOutlined className={styles.statIcon} />
            <div className={styles.statContent}>
              <Text type="secondary" className={styles.statLabel}>消息数</Text>
              <Text strong className={styles.statValue}>{conversation.message_count}</Text>
            </div>
          </div>
          <div className={styles.statItem}>
            <ClockCircleOutlined className={styles.statIcon} />
            <div className={styles.statContent}>
              <Text type="secondary" className={styles.statLabel}>最后活跃</Text>
              <Text strong className={styles.statValue}>
                {conversation.last_active_at 
                  ? formatRelativeTime(conversation.last_active_at)
                  : '暂无'
                }
              </Text>
            </div>
          </div>
        </div>

        {/* 底部时间 */}
        <div className={styles.footer}>
          <Text type="secondary" className={styles.createTime}>
            创建于 {formatRelativeTime(conversation.created_at)}
          </Text>
        </div>
      </div>
    </Card>
  );
};
