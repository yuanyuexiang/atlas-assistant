import { useState } from 'react';
import { Row, Col, Empty, Spin, Space, Input, Select, Button } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { AgentCard } from './AgentCard';
import { useAgentList } from '../hooks/useAgent';
import { useDebounce } from '@/lib/hooks/useDebounce';
import type { Agent, AgentType, AgentStatus } from '@/types/models';
import { AGENT_TYPE_MAP, AGENT_STATUS_MAP } from '@/lib/constants';
import styles from './AgentList.module.css';

interface AgentListProps {
  onEdit?: (agent: Agent) => void;
  onDelete?: (agent: Agent) => void;
  onCreate?: () => void;
}

export const AgentList = ({ onEdit, onDelete, onCreate }: AgentListProps) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<AgentType | undefined>();

  const debouncedSearch = useDebounce(searchText, 300);
  const { agents, loading } = useAgentList({
    status: statusFilter,
    agent_type: typeFilter,
  });

  // 确保 agents 是数组（处理后端可能返回对象的情况）
  const agentsArray = Array.isArray(agents) ? agents : [];

  // 前端搜索过滤（后端不支持搜索参数）
  const filteredAgents = agentsArray.filter((agent) => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    return (
      agent.name.toLowerCase().includes(searchLower) ||
      agent.display_name.toLowerCase().includes(searchLower) ||
      agent.description?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className={styles.container}>
      {/* 筛选栏 */}
      <div className={styles.filters}>
        <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space size="middle">
            <Input
              placeholder="搜索智能体名称或描述"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />

            <Select
              placeholder="筛选类型"
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 150 }}
              allowClear
            >
              {Object.entries(AGENT_TYPE_MAP).map(([key, label]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>

            <Select
              placeholder="筛选状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              allowClear
            >
              {Object.entries(AGENT_STATUS_MAP).map(([key, label]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreate}
          >
            创建智能体
          </Button>
        </Space>
      </div>

      {/* 列表内容 */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>
            <Spin size="large" tip="加载中...">
              <div style={{ minHeight: 200 }} />
            </Spin>
          </div>
        ) : filteredAgents.length === 0 ? (
          <Empty
            description={searchText ? '没有找到匹配的智能体' : '暂无智能体'}
            style={{ marginTop: 100 }}
          >
            {!searchText && (
              <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
                创建第一个智能体
              </Button>
            )}
          </Empty>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredAgents.map((agent) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={agent.id}>
                <AgentCard
                  agent={agent}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};
