// 用户类型
export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

// 智能体类型
export type AgentType = 'general' | 'legal' | 'medical' | 'financial' | 'custom';
export type AgentStatus = 'active' | 'inactive' | 'training';

export interface Agent {
  id: string;
  name: string;
  display_name: string;
  agent_type: AgentType;
  status: AgentStatus;
  system_prompt: string;
  description?: string;
  knowledge_base: KnowledgeBase;
  created_at: string;
  updated_at: string;
  conversations_using: string[];
}

// 知识库信息
export interface KnowledgeBase {
  collection_name: string;
  total_files: number;
  total_vectors: number;
  total_size_mb: number;
  files: DocumentInfo[];
}

export type DocumentStatus = 'processing' | 'ready' | 'failed';

export interface DocumentInfo {
  file_id: string;
  filename: string;
  file_size_mb: number;
  chunks_count: number;
  upload_time: string;
  status: DocumentStatus;
  processing_progress: number;
  error_message?: string | null;
}

// 客服类型
export type ConversationStatus = 'online' | 'offline' | 'busy';

export interface Conversation {
  id: string;
  name: string;
  display_name: string;
  avatar?: string;
  agent_id: string;
  agent_name: string;
  agent_display_name: string;
  status: ConversationStatus;
  welcome_message?: string;
  message_count: number;
  last_active_at?: string;
  created_at: string;
  updated_at: string;
}

// 消息类型
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  agent_id?: string;
  created_at: string;
  metadata?: Record<string, any>;
}
