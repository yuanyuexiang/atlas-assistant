import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, RobotOutlined, DatabaseOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import styles from './LoginForm.module.css';

export const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form] = Form.useForm();

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate('/chat');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || '登录失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 左侧品牌展示区 */}
      <div className={styles.brandSection}>
        <div className={styles.brandContent}>
          <div className={styles.logoCircle}>
            <div className={styles.logoIcon}>🤖</div>
          </div>
          
          <h1 className={styles.brandTitle}>Atlas Assistant</h1>
          <p className={styles.brandSubtitle}>智能客服助手管理系统</p>
          
          <p className={styles.brandSlogan}>
            为您的业务提供智能化的客服解决方案
          </p>
          
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <RobotOutlined />
              </div>
              <span className={styles.featureText}>智能对话</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <DatabaseOutlined />
              </div>
              <span className={styles.featureText}>知识管理</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <ThunderboltOutlined />
              </div>
              <span className={styles.featureText}>快速响应</span>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单区 */}
      <div className={styles.formSection}>
        <div className={styles.formContent}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>欢迎登录</h2>
            <p className={styles.formSubtitle}>Atlas Assistant 管理平台</p>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={handleLogin}
            autoComplete="off"
            size="large"
            layout="vertical"
            className={styles.form}
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
              />
            </Form.Item>

            <Form.Item
              label="登录密码"
              name="password"
              rules={[{ required: true, message: '请输入登录密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="••••••••"
                visibilityToggle
              />
            </Form.Item>

            <Form.Item className={styles.submitButton}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                立即登录
              </Button>
            </Form.Item>
          </Form>

          <div className={styles.footer}>
            © 2025 Atlas Assistant
          </div>
        </div>
      </div>
    </div>
  );
};
