import { Card, Tag, Button, Typography, Avatar, Badge, Dropdown } from 'antd';
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  RobotOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  SwapOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import type { Conversation } from '@/types/models';
import { CONVERSATION_STATUS_MAP, CONVERSATION_STATUS_COLORS } from '@/lib/constants';
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
    navigate(`/conversations/${conversation.id}`);
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
        {/* 头部：头像 + 名称 + 状态 */}
        <div className={styles.header}>
          <div className={styles.mainInfo}>
            <Badge 
              status={conversation.status === 'online' ? 'success' : conversation.status === 'busy' ? 'warning' : 'default'}
              offset={[-5, 45]}
            >
              <Avatar 
                size={64} 
                src={conversation.avatar} 
                icon={<UserOutlined />}
                className={styles.avatar}
              />
            </Badge>
            <div className={styles.infoContent}>
              <div className={styles.nameRow}>
                <Text strong className={styles.displayName}>
                  {conversation.display_name}
                </Text>
                <Tag color={CONVERSATION_STATUS_COLORS[conversation.status]} className={styles.statusTag}>
                  {CONVERSATION_STATUS_MAP[conversation.status]}
                </Tag>
              </div>
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
            <Paragraph
              ellipsis={{ rows: 2 }}
              className={styles.welcomeMessage}
            >
              {conversation.welcome_message}
            </Paragraph>
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
