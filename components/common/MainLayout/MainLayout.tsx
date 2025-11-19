import { Layout, Menu, Avatar, Dropdown, Typography } from 'antd';
import {
  MessageOutlined,
  RobotOutlined,
  TeamOutlined,
  BookOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router';
import { useAuth } from '@/features/auth/hooks/useAuth';
import styles from './MainLayout.module.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      key: '/chat',
      icon: <MessageOutlined />,
      label: '对话',
    },
    {
      key: '/agents',
      icon: <RobotOutlined />,
      label: '智能体',
    },
    {
      key: '/conversations',
      icon: <TeamOutlined />,
      label: '客服',
    },
    {
      key: '/knowledge',
      icon: <BookOutlined />,
      label: '知识库',
    },
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <div className={styles.logo}>
          <RobotOutlined style={{ fontSize: '24px' }} />
          <Text strong style={{ marginLeft: '12px', fontSize: '18px', color: '#fff' }}>
            Atlas Assistant
          </Text>
        </div>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div className={styles.userInfo}>
            <Avatar icon={<UserOutlined />} />
            <Text style={{ marginLeft: '8px', color: '#fff' }}>{user?.username}</Text>
          </div>
        </Dropdown>
      </Header>

      <Layout>
        <Sider width={200} theme="light" className={styles.sider}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>

        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
