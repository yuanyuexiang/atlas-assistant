// API 基础地址
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://atlas.matrix-net.tech/atlas/api';

// 应用信息
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'Atlas Assistant';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// Token 存储键
export const TOKEN_KEY = 'atlas_token';
export const USER_KEY = 'atlas_user';

// 智能体类型映射
export const AGENT_TYPE_MAP = {
  general: '通用',
  legal: '法律',
  medical: '医疗',
  financial: '金融',
  custom: '自定义',
} as const;

// 智能体类型颜色
export const AGENT_TYPE_COLORS = {
  general: 'blue',
  legal: 'purple',
  medical: 'green',
  financial: 'orange',
  custom: 'default',
} as const;

// 智能体状态映射
export const AGENT_STATUS_MAP = {
  active: '活跃',
  inactive: '停用',
  training: '训练中',
} as const;

// 智能体状态颜色
export const AGENT_STATUS_COLORS = {
  active: 'success',
  inactive: 'default',
  training: 'processing',
} as const;

// 客服状态映射
export const CONVERSATION_STATUS_MAP = {
  online: '在线',
  offline: '离线',
  busy: '忙碌',
} as const;

// 客服状态颜色
export const CONVERSATION_STATUS_COLORS = {
  online: 'success',
  offline: 'default',
  busy: 'warning',
} as const;

// 文件上传限制
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['.pdf', '.txt', '.md'];
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
];
