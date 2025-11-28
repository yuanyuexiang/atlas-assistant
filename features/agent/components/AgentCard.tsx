import { Card, Tag, Button, Typography, Dropdown } from 'antd';
import {
  RobotOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  MoreOutlined,
  CloudServerOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import type { Agent } from '@/types/models';
import { AGENT_TYPE_MAP, AGENT_TYPE_COLORS, AGENT_STATUS_MAP, AGENT_STATUS_COLORS } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/utils/format';
import styles from './AgentCard.module.css';

const { Text, Paragraph } = Typography;

interface AgentCardProps {
  agent: Agent;
  onEdit?: (agent: Agent) => void;
  onDelete?: (agent: Agent) => void;
}

export const AgentCard = ({ agent, onEdit, onDelete }: AgentCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/agents/${agent.id}`);
  };

  const handleMenuClick = (e: { key: string }) => {
    switch (e.key) {
      case 'edit':
        onEdit?.(agent);
        break;
      case 'delete':
        onDelete?.(agent);
        break;
    }
  };

  const menuItems = [
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
        {/* 头部：机器人图标 + 名称 + 状态 */}
        <div className={styles.header}>
          <div className={styles.mainInfo}>
            <div className={styles.robotIcon}>
              <RobotOutlined />
            </div>
            <div className={styles.infoContent}>
              <div className={styles.nameRow}>
                <Text strong className={styles.displayName}>
                  {agent.display_name}
                </Text>
                <Tag color={AGENT_TYPE_COLORS[agent.agent_type]} className={styles.typeTag}>
                  {AGENT_TYPE_MAP[agent.agent_type]}
                </Tag>
                <Tag color={AGENT_STATUS_COLORS[agent.status]} className={styles.statusTag}>
                  {AGENT_STATUS_MAP[agent.status]}
                </Tag>
              </div>
              <Text type="secondary" className={styles.systemName}>
                {agent.name}
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

        {/* 描述 */}
        {agent.description && (
          <div className={styles.descriptionSection}>
            <Paragraph
              ellipsis={{ rows: 2 }}
              className={styles.description}
            >
              {agent.description}
            </Paragraph>
          </div>
        )}

        {/* 知识库信息 */}
        <div className={styles.knowledgeSection}>
          <div className={styles.knowledgeIcon}>
            <DatabaseOutlined />
          </div>
          <div className={styles.knowledgeInfo}>
            <Text type="secondary" className={styles.knowledgeLabel}>知识库信息</Text>
            <div className={styles.knowledgeStats}>
              <Text strong className={styles.knowledgeStat}>
                <FileTextOutlined /> {agent.knowledge_base.total_files} 文件
              </Text>
              <Text type="secondary">|</Text>
              <Text strong className={styles.knowledgeStat}>
                <CloudServerOutlined /> {agent.knowledge_base.total_vectors.toLocaleString()} 向量
              </Text>
              <Text type="secondary">|</Text>
              <Text strong className={styles.knowledgeStat}>
                {agent.knowledge_base.total_size_mb.toFixed(1)} MB
              </Text>
            </div>
          </div>
        </div>

        {/* 系统提示词预览 */}
        <div className={styles.promptSection}>
          <Paragraph
            ellipsis={{ rows: 2 }}
            className={styles.prompt}
          >
            {agent.system_prompt}
          </Paragraph>
        </div>

        {/* 统计信息 */}
        <div className={styles.statsSection}>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <RobotOutlined />
            </div>
            <div className={styles.statContent}>
              <Text type="secondary" className={styles.statLabel}>使用中的客服</Text>
              <Text strong className={styles.statValue}>{agent.conversations_using.length} 个</Text>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <ClockCircleOutlined />
            </div>
            <div className={styles.statContent}>
              <Text type="secondary" className={styles.statLabel}>最后更新</Text>
              <Text strong className={styles.statValue}>
                {formatRelativeTime(agent.updated_at)}
              </Text>
            </div>
          </div>
        </div>

        {/* 底部时间 */}
        <div className={styles.footer}>
          <Text type="secondary" className={styles.createTime}>
            创建于 {formatRelativeTime(agent.created_at)}
          </Text>
        </div>
      </div>
    </Card>
  );
};
