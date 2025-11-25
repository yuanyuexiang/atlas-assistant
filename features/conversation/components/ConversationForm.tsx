import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { useConversation } from '../hooks/useConversation';
import { useAgentList } from '@/features/agent/hooks/useAgent';
import type { Conversation } from '@/types/models';
import { CONVERSATION_STATUS_MAP } from '@/lib/constants';

const { TextArea } = Input;

interface ConversationFormProps {
  open: boolean;
  conversation?: Conversation | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ConversationForm = ({ open, conversation, onClose, onSuccess }: ConversationFormProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { createConversation, updateConversation, switchAgent } = useConversation();
  const { agents } = useAgentList({ status: 'active' }); // 只显示活跃的智能体
  const isEdit = !!conversation;

  useEffect(() => {
    if (open && conversation) {
      form.setFieldsValue({
        name: conversation.name,
        display_name: conversation.display_name,
        agent_name: conversation.agent_name,
        welcome_message: conversation.welcome_message,
        status: conversation.status,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, conversation, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (isEdit && conversation) {
        // 检查智能体是否改变
        const agentChanged = values.agent_name && values.agent_name !== conversation.agent_name;
        
        // 先更新基本信息
        await updateConversation(conversation.id, {
          display_name: values.display_name,
          welcome_message: values.welcome_message,
          status: values.status,
        });
        
        // 如果智能体改变，调用切换接口
        if (agentChanged) {
          await switchAgent(conversation.id, values.agent_name);
          message.success('客服更新成功，智能体已切换');
        } else {
          message.success('客服更新成功');
        }
      } else {
        await createConversation(values);
        message.success('客服创建成功');
      }

      // 只有成功时才关闭对话框和重置表单
      form.resetFields();
      onClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('提交失败:', error);
      // 显示错误信息
      const errorMsg = error.response?.data?.detail || error.message || '操作失败，请重试';
      message.error(errorMsg);
      // 不关闭对话框，让用户可以修改后重试
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑客服' : '创建客服'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      width={600}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          label="客服名称"
          name="name"
          rules={[
            { required: true, message: '请输入客服名称' },
            { pattern: /^[a-z0-9-_]+$/, message: '只能包含小写字母、数字、横线和下划线' },
          ]}
          extra={isEdit ? '客服名称不可修改' : '用于API调用的唯一标识，只能包含小写字母、数字、横线和下划线'}
        >
          <Input 
            placeholder="例如: customer-service-001" 
            disabled={isEdit}
            prefix={<UserOutlined />}
          />
        </Form.Item>

        <Form.Item
          label="显示名称"
          name="display_name"
          rules={[{ required: true, message: '请输入显示名称' }]}
        >
          <Input placeholder="例如: 客服小美" />
        </Form.Item>

        <Form.Item
          label="关联智能体"
          name="agent_name"
          rules={[{ required: true, message: '请选择关联的智能体' }]}
          extra={isEdit ? '修改智能体将自动调用切换功能' : '请选择一个活跃的智能体'}
        >
          <Select 
            placeholder="选择智能体" 
            showSearch
            optionFilterProp="children"
            suffixIcon={<RobotOutlined />}
          >
            {agents.map((agent) => (
              <Select.Option key={agent.name} value={agent.name}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RobotOutlined style={{ color: '#667eea' }} />
                  <span>{agent.display_name}</span>
                  <span style={{ color: '#999', fontSize: '12px' }}>({agent.name})</span>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {isEdit && (
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="选择状态">
              {Object.entries(CONVERSATION_STATUS_MAP).map(([key, label]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          label="欢迎消息"
          name="welcome_message"
          extra="客户首次对话时显示的欢迎语"
        >
          <TextArea
            rows={4}
            placeholder="例如: 您好！我是客服小美，很高兴为您服务！请问有什么可以帮助您的吗？"
            maxLength={500}
            showCount
          />
        </Form.Item>

        {/* 头像上传功能（暂时注释，因为后端可能不支持文件上传到客服） */}
        {/* <Form.Item
          label="头像"
          name="avatar"
          extra="支持 JPG、PNG 格式，最大 2MB"
        >
          <Upload
            name="avatar"
            listType="picture-card"
            maxCount={1}
            beforeUpload={() => false}
          >
            <Button icon={<UploadOutlined />}>上传头像</Button>
          </Upload>
        </Form.Item> */}
      </Form>
    </Modal>
  );
};
