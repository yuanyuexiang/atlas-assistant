import axios from 'axios';
import type { AxiosError } from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';

// API 基础地址
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://atlas.matrix-net.tech/atlas/api';

// Token 存储键
const TOKEN_KEY = 'atlas_token';

// 创建 axios 实例
export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5分钟，用于文件上传
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 如果是 FormData，删除默认的 Content-Type，让浏览器自动设置
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // 清除认证信息
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem('atlas_user');
          localStorage.removeItem('auth-storage');
          
          message.error('登录已过期，请重新登录');
          
          // 跳转到登录页
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          message.error('没有权限访问');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误，请稍后重试');
          break;
        default:
          const errorMsg = (data as any)?.detail || '请求失败';
          message.error(errorMsg);
      }
    } else if (error.request) {
      message.error('网络连接失败，请检查网络');
    } else {
      message.error('请求配置错误');
    }
    
    return Promise.reject(error);
  }
);

// 封装请求方法
export const get = <T = any>(url: string, config?: AxiosRequestConfig) => {
  return http.get<T>(url, config).then(res => res.data);
};

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
  return http.post<T>(url, data, config).then(res => res.data);
};

export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
  return http.put<T>(url, data, config).then(res => res.data);
};

export const del = <T = any>(url: string, config?: AxiosRequestConfig) => {
  return http.delete<T>(url, config).then(res => res.data);
};

export const patch = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
  return http.patch<T>(url, data, config).then(res => res.data);
};
