import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Badge, Tooltip } from 'antd';
import {
  MessageOutlined,
  RobotOutlined,
  TeamOutlined,
  BookOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  BellOutlined,
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
  
  // 从 localStorage 读取用户偏好，小屏幕默认收起
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('siderCollapsed');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.innerWidth < 1200;
  });

  // 响应式处理：小屏幕自动收起
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200 && !collapsed) {
        setCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed]);

  // 保存折叠状态到 localStorage
  const toggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem('siderCollapsed', String(newCollapsed));
  };

  // 双击 Logo 快速切换
  const handleLogoDoubleClick = () => {
    toggleCollapse();
  };

  const menuItems = [
    {
      key: '/chat',
      icon: (
        <Tooltip title={collapsed ? '对话' : ''} placement="right">
          <div className={styles.menuIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <MessageOutlined />
          </div>
        </Tooltip>
      ),
      label: <span className={styles.menuLabel}>对话</span>,
    },
    {
      key: '/conversations',
      icon: (
        <Tooltip title={collapsed ? '客服' : ''} placement="right">
          <div className={styles.menuIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <TeamOutlined />
          </div>
        </Tooltip>
      ),
      label: <span className={styles.menuLabel}>客服</span>,
    },
    {
      key: '/agents',
      icon: (
        <Tooltip title={collapsed ? '智能体' : ''} placement="right">
          <div className={styles.menuIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <RobotOutlined />
          </div>
        </Tooltip>
      ),
      label: <span className={styles.menuLabel}>智能体</span>,
    },
    {
      key: '/knowledge',
      icon: (
        <Tooltip title={collapsed ? '知识库' : ''} placement="right">
          <div className={styles.menuIcon} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <BookOutlined />
          </div>
        </Tooltip>
      ),
      label: <span className={styles.menuLabel}>知识库</span>,
    },
  ];

  const userMenuItems = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => {
        // TODO: 打开设置页面
      },
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout className={styles.layout}>
      <Sider 
        width={260} 
        collapsedWidth={80}
        collapsed={collapsed}
        theme="light" 
        className={styles.sider}
        trigger={null}
      >
        <div className={styles.siderContent}>
          {/* Logo 区域 - 带渐变背景 */}
          <div className={styles.siderHeader}>
            <Tooltip title={collapsed ? '双击展开' : '双击收起'} placement="right">
              <div 
                className={styles.logoContainer}
                onDoubleClick={handleLogoDoubleClick}
              >
                <div className={styles.logoIcon}>
                  <RobotOutlined />
                </div>
                {!collapsed && (
                  <div className={styles.logoInfo}>
                    <Text strong className={styles.logoText}>
                      Atlas
                    </Text>
                    <Text className={styles.logoSubtext}>
                      智能助手平台
                    </Text>
                  </div>
                )}
              </div>
            </Tooltip>
          </div>

          {/* 菜单区域 */}
          <div className={styles.menuContainer}>
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
              className={styles.menu}
              inlineCollapsed={collapsed}
            />
          </div>

          {/* 底部信息 */}
          <div className={styles.siderFooter}>
            {!collapsed ? (
              <div className={styles.footerCard}>
                <div className={styles.versionInfo}>
                  <Text className={styles.versionLabel}>当前版本</Text>
                  <Text className={styles.versionNumber}>v1.0.0</Text>
                </div>
                <div className={styles.userStats}>
                  <div className={styles.statItem}>
                    <MessageOutlined className={styles.statIcon} />
                    <Text className={styles.statText}>今日对话 12</Text>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.footerCollapsed}>
                <div className={styles.versionDot} />
              </div>
            )}
          </div>
        </div>

        {/* 折叠触发按钮 - 悬浮在侧边栏右边缘 */}
        <Tooltip title={collapsed ? '展开侧边栏' : '收起侧边栏'} placement="right">
          <div className={styles.collapseTrigger} onClick={toggleCollapse}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        </Tooltip>
      </Sider>

      <Layout>
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            <Text strong className={styles.pageTitle}>
              {menuItems.find(item => item.key === location.pathname)?.label || 'Atlas Assistant'}
            </Text>
          </div>

          <div className={styles.headerRight}>
            <Tooltip title="通知">
              <Badge count={0} dot offset={[-5, 5]}>
                <div className={styles.headerIcon}>
                  <BellOutlined />
                </div>
              </Badge>
            </Tooltip>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className={styles.userInfo}>
                <Avatar 
                  icon={<UserOutlined />} 
                  className={styles.avatar}
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                />
                {!collapsed && <Text className={styles.username}>{user?.username}</Text>}
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
