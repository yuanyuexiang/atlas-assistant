import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { MainLayout } from '@/components/common/MainLayout/MainLayout';
import LoginPage from '@/pages/login/LoginPage';
import ChatPage from '@/pages/chat/ChatPage';
import AgentsPage from '@/pages/agents/AgentsPage';
import AgentDetailPage from '@/pages/agents/AgentDetailPage';
import ConversationsPage from '@/pages/conversations/ConversationsPage';
import { KnowledgePage } from '@/pages/knowledge/KnowledgePage';

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
          <Route path="agents/:agentName" element={<AgentDetailPage />} />
          <Route path="conversations" element={<ConversationsPage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
