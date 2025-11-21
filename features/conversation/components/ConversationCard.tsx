import { Card, Tag, Button, Space, Typography, Avatar, Statistic, Row, Col } from 'antd';
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  RobotOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  SwapOutlined,
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

  return (
    <Card
      hoverable
      className={styles.card}
      onClick={handleCardClick}
      actions={[
        <Button
          type="text"
          icon={<SwapOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onSwitchAgent?.(conversation);
          }}
        >
          切换智能体
        </Button>,
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(conversation);
          }}
        >
          编辑
        </Button>,
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(conversation);
          }}
        >
          删除
        </Button>,
      ]}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 头部：头像 + 名称 + 状态 */}
        <div className={styles.header}>
          <Space>
            <Avatar 
              size={48} 
              src={conversation.avatar} 
              icon={<UserOutlined />}
            />
            <div>
              <Text strong style={{ fontSize: '16px' }}>
                {conversation.display_name}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {conversation.name}
              </Text>
            </div>
          </Space>
          <Tag color={CONVERSATION_STATUS_COLORS[conversation.status]}>
            {CONVERSATION_STATUS_MAP[conversation.status]}
          </Tag>
        </div>

        {/* 关联智能体 */}
        <div className={styles.agent}>
          <Space>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <Text type="secondary">关联智能体:</Text>
            <Text strong>{conversation.agent_display_name}</Text>
          </Space>
        </div>

        {/* 欢迎消息 */}
        {conversation.welcome_message && (
          <Paragraph
            ellipsis={{ rows: 2 }}
            type="secondary"
            style={{ margin: 0 }}
          >
            {conversation.welcome_message}
          </Paragraph>
        )}

        {/* 统计信息 */}
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="消息数"
              value={conversation.message_count}
              prefix={<MessageOutlined />}
              valueStyle={{ fontSize: '16px' }}
            />
          </Col>
          <Col span={12}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '14px' }}>
                最后活跃
              </div>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>
                <ClockCircleOutlined style={{ marginRight: '4px' }} />
                {conversation.last_active_at 
                  ? formatRelativeTime(conversation.last_active_at)
                  : '暂无活动'
                }
              </div>
            </div>
          </Col>
        </Row>

        {/* 创建时间 */}
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <ClockCircleOutlined style={{ marginRight: '4px' }} />
          创建于 {formatRelativeTime(conversation.created_at)}
        </Text>
      </Space>
    </Card>
  );
};
