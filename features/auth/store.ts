import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/models';
import { authApi } from './api/auth';
import { TOKEN_KEY, USER_KEY } from '@/lib/constants';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: localStorage.getItem(TOKEN_KEY),
      user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
      isAuthenticated: !!localStorage.getItem(TOKEN_KEY),

      login: async (username, password) => {
        const response = await authApi.login({ username, password });
        const { access_token, user } = response;
        
        localStorage.setItem(TOKEN_KEY, access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        
        set({
          token: access_token,
          user,
          isAuthenticated: true,
        });
      },

      register: async (username, email, password) => {
        const response = await authApi.register({ username, email, password });
        const { access_token, user } = response;
        
        localStorage.setItem(TOKEN_KEY, access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        
        set({
          token: access_token,
          user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        authApi.logout().catch(console.error);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      refreshUser: async () => {
        try {
          const user = await authApi.getCurrentUser();
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          set({ user });
        } catch (error) {
          console.error('刷新用户信息失败:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
