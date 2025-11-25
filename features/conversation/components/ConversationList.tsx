import { useState } from 'react';
import { Row, Col, Empty, Space, Input, Select, Button, Skeleton, Card } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { ConversationCard } from './ConversationCard';
import { useConversationList } from '../hooks/useConversation';
import { useDebounce } from '@/lib/hooks/useDebounce';
import type { Conversation, ConversationStatus } from '@/types/models';
import { CONVERSATION_STATUS_MAP } from '@/lib/constants';
import styles from './ConversationList.module.css';

interface ConversationListProps {
  onEdit?: (conversation: Conversation) => void;
  onDelete?: (conversation: Conversation) => void;
  onCreate?: () => void;
  onSwitchAgent?: (conversation: Conversation) => void;
}

export const ConversationList = ({ 
  onEdit, 
  onDelete, 
  onCreate,
  onSwitchAgent 
}: ConversationListProps) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | undefined>();

  const debouncedSearch = useDebounce(searchText, 300);
  const { conversations, loading } = useConversationList({
    status: statusFilter,
  });

  // 确保 conversations 是数组（处理后端可能返回对象的情况）
  const conversationsArray = Array.isArray(conversations) ? conversations : [];

  // 前端搜索过滤（后端不支持搜索参数）
  const filteredConversations = conversationsArray.filter((conversation) => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    return (
      conversation.name.toLowerCase().includes(searchLower) ||
      conversation.display_name.toLowerCase().includes(searchLower) ||
      conversation.agent_name.toLowerCase().includes(searchLower) ||
      conversation.agent_display_name.toLowerCase().includes(searchLower) ||
      conversation.welcome_message?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className={styles.container}>
      {/* 筛选栏 */}
      <div className={styles.filters}>
        <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space size="middle">
            <Input
              placeholder="搜索客服名称、智能体或欢迎消息"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />

            <Select
              placeholder="筛选状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              allowClear
            >
              {Object.entries(CONVERSATION_STATUS_MAP).map(([key, label]) => (
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
            创建客服
          </Button>
        </Space>
      </div>

      {/* 列表内容 */}
      <div className={styles.content}>
        {loading ? (
          <Row gutter={[16, 16]}>
            {[1, 2, 3, 4].map((i) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={i}>
                <Card>
                  <Skeleton active avatar paragraph={{ rows: 4 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : filteredConversations.length === 0 ? (
          <Empty
            description={searchText ? '没有找到匹配的客服' : '暂无客服'}
            style={{ marginTop: 100 }}
          >
            {!searchText && (
              <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
                创建第一个客服
              </Button>
            )}
          </Empty>
        ) : (
          <Row gutter={[20, 20]}>
            {filteredConversations.map((conversation) => (
              <Col xs={24} sm={24} md={12} lg={8} xl={8} xxl={6} key={conversation.id}>
                <ConversationCard
                  conversation={conversation}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSwitchAgent={onSwitchAgent}
                />
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};
