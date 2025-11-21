import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  Typography,
  Divider,
  List,
  Empty,
  Skeleton,
  Modal,
  message,
  Switch,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  RobotOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  CommentOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAgent } from '@/features/agent/hooks/useAgent';
import { AgentForm } from '@/features/agent/components/AgentForm';
import {
  AGENT_TYPE_MAP,
  AGENT_TYPE_COLORS,
  AGENT_STATUS_MAP,
  AGENT_STATUS_COLORS,
} from '@/lib/constants';
import { formatRelativeTime } from '@/lib/utils/format';
import styles from './AgentDetailPage.module.css';

const { Title, Text, Paragraph } = Typography;

export default function AgentDetailPage() {
  const { agentName } = useParams<{ agentName: string }>();
  const navigate = useNavigate();
  const { currentAgent, loading, fetchAgent, updateAgent, deleteAgent } = useAgent();
  const [formOpen, setFormOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (agentName) {
      fetchAgent(agentName);
    }
  }, [agentName, fetchAgent]);

  const handleBack = () => {
    navigate('/agents');
  };

  const handleEdit = () => {
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!currentAgent) return;

    Modal.confirm({
      title: '确认删除',
      content: (
        <>
          <p>
            确定要删除智能体 <strong>{currentAgent.display_name}</strong> 吗？
          </p>
          {currentAgent.conversations_using.length > 0 && (
            <p style={{ color: '#ff4d4f' }}>
              警告：该智能体正被 {currentAgent.conversations_using.length} 个客服使用！
            </p>
          )}
          <p style={{ color: '#faad14' }}>
            注意：删除后将同时删除该智能体的知识库数据，此操作不可恢复！
          </p>
        </>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteAgent(currentAgent.name);
          message.success('智能体删除成功');
          navigate('/agents');
        } catch (error) {
          console.error('删除失败:', error);
        }
      },
    });
  };

  const handleStatusChange = async (checked: boolean) => {
    if (!currentAgent) return;

    setStatusLoading(true);
    try {
      const newStatus = checked ? 'active' : 'inactive';
      await updateAgent(currentAgent.name, { status: newStatus });
      message.success(`智能体已${checked ? '启用' : '禁用'}`);
      // 重新获取最新数据
      if (agentName) {
        await fetchAgent(agentName);
      }
    } catch (error) {
      console.error('状态切换失败:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading && !currentAgent) {
    return (
      <div className={styles.container}>
        <Skeleton active />
      </div>
    );
  }

  if (!currentAgent) {
    return (
      <div className={styles.container}>
        <Empty description="智能体不存在">
          <Button type="primary" onClick={handleBack}>
            返回列表
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 头部操作栏 */}
      <div className={styles.header}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回
          </Button>
          <RobotOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {currentAgent.display_name}
            </Title>
            <Text type="secondary">{currentAgent.name}</Text>
          </div>
        </Space>

        <Space>
          <Switch
            checked={currentAgent.status === 'active'}
            onChange={handleStatusChange}
            loading={statusLoading}
            checkedChildren="启用"
            unCheckedChildren="禁用"
          />
          <Button icon={<EditOutlined />} onClick={handleEdit}>
            编辑
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            删除
          </Button>
        </Space>
      </div>

      {/* 基本信息 */}
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="智能体名称">
            {currentAgent.name}
          </Descriptions.Item>
          <Descriptions.Item label="显示名称">
            {currentAgent.display_name}
          </Descriptions.Item>
          <Descriptions.Item label="类型">
            <Tag color={AGENT_TYPE_COLORS[currentAgent.agent_type]}>
              {AGENT_TYPE_MAP[currentAgent.agent_type]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={AGENT_STATUS_COLORS[currentAgent.status]}>
              {AGENT_STATUS_MAP[currentAgent.status]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            <Space>
              <ClockCircleOutlined />
              {formatRelativeTime(currentAgent.created_at)}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            <Space>
              <ClockCircleOutlined />
              {formatRelativeTime(currentAgent.updated_at)}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {currentAgent.description || (
              <Text type="secondary">暂无描述</Text>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 系统提示词 */}
      <Card title="系统提示词" style={{ marginBottom: 16 }}>
        {currentAgent.system_prompt ? (
          <Paragraph
            style={{
              whiteSpace: 'pre-wrap',
              backgroundColor: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
            }}
          >
            {currentAgent.system_prompt}
          </Paragraph>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="使用默认系统提示词"
          />
        )}
      </Card>

      {/* 知识库统计 */}
      <Card title="知识库统计" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="文件总数"
              value={currentAgent.knowledge_base.total_files}
              prefix={<FileTextOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="向量总数"
              value={currentAgent.knowledge_base.total_vectors}
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="存储大小"
              value={currentAgent.knowledge_base.total_size_mb.toFixed(2)}
              suffix="MB"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="使用客服数"
              value={currentAgent.conversations_using.length}
              prefix={<CommentOutlined />}
            />
          </Col>
        </Row>

        <Divider />

        {/* 知识库文件列表 */}
        <div>
          <Title level={5}>知识库文件</Title>
          {currentAgent.knowledge_base.files.length > 0 ? (
            <List
              dataSource={currentAgent.knowledge_base.files}
              renderItem={(file) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<FileTextOutlined style={{ fontSize: '20px' }} />}
                    title={file.filename}
                    description={
                      <Space split="|">
                        <Text type="secondary">
                          大小: {file.file_size_mb.toFixed(2)} MB
                        </Text>
                        <Text type="secondary">
                          分块数: {file.chunks_count}
                        </Text>
                        <Text type="secondary">
                          上传时间: {formatRelativeTime(file.upload_time)}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无知识库文件" />
          )}
        </div>
      </Card>

      {/* 关联客服列表 */}
      <Card title="关联客服">
        {currentAgent.conversations_using.length > 0 ? (
          <List
            dataSource={currentAgent.conversations_using}
            renderItem={(conversationId) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<CommentOutlined />}
                  title={conversationId}
                  description="点击查看详情"
                />
                <Button
                  type="link"
                  onClick={() => navigate(`/conversations/${conversationId}`)}
                >
                  查看
                </Button>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无关联客服" />
        )}
      </Card>

      {/* 编辑表单 */}
      <AgentForm
        open={formOpen}
        agent={currentAgent}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          if (agentName) {
            fetchAgent(agentName);
          }
        }}
      />
    </div>
  );
}
