import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { MainLayout } from '@/components/common/MainLayout/MainLayout';
import LoginPage from '@/pages/login/LoginPage';
import ChatPage from '@/pages/chat/ChatPage';
import AgentsPage from '@/pages/agents/AgentsPage';

// 受保护的路由组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="conversations" element={<div>客服管理（开发中）</div>} />
          <Route path="knowledge" element={<div>知识库管理（开发中）</div>} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
