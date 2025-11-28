import { useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import type { Agent } from '@/types/models';
import { AGENT_TYPE_MAP } from '@/lib/constants';
import { useAgent } from '../hooks/useAgent';

const { TextArea } = Input;

interface AgentFormProps {
  open: boolean;
  agent?: Agent | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AgentForm = ({ open, agent, onClose, onSuccess }: AgentFormProps) => {
  const [form] = Form.useForm();
  const { createAgent, updateAgent, loading } = useAgent();
  const isEdit = !!agent;

  useEffect(() => {
    if (open && agent) {
      form.setFieldsValue({
        name: agent.name,
        display_name: agent.display_name,
        agent_type: agent.agent_type,
        system_prompt: agent.system_prompt,
        description: agent.description,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, agent, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (isEdit && agent) {
        // 更新智能体（不能修改 name 和 agent_type）
        await updateAgent(agent.id, {
          display_name: values.display_name,
          system_prompt: values.system_prompt,
          description: values.description,
        });
        message.success('智能体更新成功');
      } else {
        // 创建智能体
        await createAgent(values);
        message.success('智能体创建成功');
      }

      form.resetFields();
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑智能体' : '创建智能体'}
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
          label="智能体名称"
          name="name"
          rules={[
            { required: true, message: '请输入智能体名称' },
            { pattern: /^[a-z0-9-_]+$/, message: '只能包含小写字母、数字、横线和下划线' },
          ]}
          extra={isEdit ? '智能体名称不可修改' : '用于API调用的唯一标识，只能包含小写字母、数字、横线和下划线'}
        >
          <Input placeholder="例如: customer-service" disabled={isEdit} />
        </Form.Item>

        <Form.Item
          label="显示名称"
          name="display_name"
          rules={[{ required: true, message: '请输入显示名称' }]}
        >
          <Input placeholder="例如: 智能客服" />
        </Form.Item>

        <Form.Item
          label="智能体类型"
          name="agent_type"
          rules={[{ required: true, message: '请选择智能体类型' }]}
          extra={isEdit ? '智能体类型不可修改' : undefined}
        >
          <Select placeholder="选择类型" disabled={isEdit}>
            {Object.entries(AGENT_TYPE_MAP).map(([key, label]) => (
              <Select.Option key={key} value={key}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="系统提示词"
          name="system_prompt"
          extra="定义智能体的角色和行为，留空使用默认提示词"
        >
          <TextArea
            rows={4}
            placeholder="例如: 你是一个专业的客服人员，请礼貌、耐心地回答用户问题..."
          />
        </Form.Item>

        <Form.Item
          label="描述"
          name="description"
        >
          <TextArea
            rows={2}
            placeholder="简要描述该智能体的用途（可选）"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
