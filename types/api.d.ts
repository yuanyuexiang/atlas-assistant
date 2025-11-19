// API 响应类型
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// 错误响应
export interface ApiError {
  detail: string;
  status_code?: number;
}
