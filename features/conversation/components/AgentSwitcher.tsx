import { useState } from 'react';
import { Modal, Select, Form, message, Alert } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { useConversation } from '../hooks/useConversation';
import { useAgentList } from '@/features/agent/hooks/useAgent';
import type { Conversation } from '@/types/models';

interface AgentSwitcherProps {
  open: boolean;
  conversation: Conversation | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AgentSwitcher = ({ open, conversation, onClose, onSuccess }: AgentSwitcherProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { switchAgent } = useConversation();
  const { agents } = useAgentList({ status: 'active' }); // 只显示活跃的智能体

  const handleSwitch = async () => {
    if (!conversation) return;

    try {
      const values = await form.validateFields();
      
      if (values.new_agent_name === conversation.agent_name) {
        message.warning('新智能体与当前智能体相同');
        return;
      }

      setLoading(true);
      await switchAgent(conversation.id, values.new_agent_name);
      message.success('智能体切换成功');
      
      form.resetFields();
      onClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('切换智能体失败:', error);
      const errorMsg = error.response?.data?.detail || error.message || '切换失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <>
          <SwapOutlined style={{ marginRight: 8 }} />
          切换智能体
        </>
      }
      open={open}
      onOk={handleSwitch}
      onCancel={onClose}
      confirmLoading={loading}
      okText="确认切换"
      cancelText="取消"
      width={500}
      destroyOnHidden
    >
      {conversation && (
        <>
          <Alert
            message="提示"
            description={
              <>
                <p>当前客服：<strong>{conversation.display_name}</strong></p>
                <p>当前智能体：<strong>{conversation.agent_display_name}</strong> ({conversation.agent_name})</p>
                <p style={{ marginTop: 12, color: '#faad14' }}>
                  ⚠️ 切换智能体后，该客服将使用新智能体的知识库和配置进行对话。
                </p>
              </>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form
            form={form}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              label="选择新的智能体"
              name="new_agent_name"
              rules={[
                { required: true, message: '请选择新的智能体' },
              ]}
            >
              <Select
                placeholder="请选择智能体"
                showSearch
                optionFilterProp="children"
              >
                {agents
                  .filter(agent => agent.name !== conversation.agent_name) // 排除当前智能体
                  .map((agent) => (
                    <Select.Option key={agent.name} value={agent.name}>
                      {agent.display_name} ({agent.name})
                      {agent.knowledge_base.total_files > 0 && (
                        <span style={{ color: '#52c41a', marginLeft: 8 }}>
                          · {agent.knowledge_base.total_files} 个文件
                        </span>
                      )}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
};
