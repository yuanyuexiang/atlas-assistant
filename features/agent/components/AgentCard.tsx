import { Card, Tag, Button, Space, Typography, Statistic, Row, Col } from 'antd';
import {
  RobotOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  DatabaseOutlined,
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
    navigate(`/agents/${agent.name}`);
  };

  return (
    <Card
      hoverable
      className={styles.card}
      onClick={handleCardClick}
      actions={[
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(agent);
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
            onDelete?.(agent);
          }}
        >
          删除
        </Button>,
      ]}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 头部：图标 + 名称 + 状态 */}
        <div className={styles.header}>
          <Space>
            <RobotOutlined className={styles.icon} />
            <div>
              <Text strong style={{ fontSize: '16px' }}>
                {agent.display_name}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {agent.name}
              </Text>
            </div>
          </Space>
          <Space>
            <Tag color={AGENT_TYPE_COLORS[agent.agent_type]}>
              {AGENT_TYPE_MAP[agent.agent_type]}
            </Tag>
            <Tag color={AGENT_STATUS_COLORS[agent.status]}>
              {AGENT_STATUS_MAP[agent.status]}
            </Tag>
          </Space>
        </div>

        {/* 描述 */}
        {agent.description && (
          <Paragraph
            ellipsis={{ rows: 2 }}
            type="secondary"
            style={{ margin: 0 }}
          >
            {agent.description}
          </Paragraph>
        )}

        {/* 统计信息 */}
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="文件数"
              value={agent.knowledge_base.total_files}
              prefix={<FileTextOutlined />}
              valueStyle={{ fontSize: '16px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="向量数"
              value={agent.knowledge_base.total_vectors}
              prefix={<DatabaseOutlined />}
              valueStyle={{ fontSize: '16px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="使用数"
              value={agent.conversations_using.length}
              valueStyle={{ fontSize: '16px' }}
            />
          </Col>
        </Row>

        {/* 底部信息 */}
        <div className={styles.footer}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            创建于 {formatRelativeTime(agent.created_at)}
          </Text>
        </div>
      </Space>
    </Card>
  );
};
