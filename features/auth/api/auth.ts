// Auth feature API
import { get, post } from '@/lib/http/http';
import type { User } from '@/types/models';

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export const authApi = {
  // 登录
  login: (params: LoginParams) =>
    post<AuthResponse>('/auth/login', params),

  // 注册
  register: (params: RegisterParams) =>
    post<AuthResponse>('/auth/register', params),

  // 获取当前用户信息
  getCurrentUser: () =>
    get<User>('/auth/me'),
};
