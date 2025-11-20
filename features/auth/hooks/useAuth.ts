import { useAuthStore } from '../store';

export const useAuth = () => {
  const { token, user, isAuthenticated, login, register, logout, refreshUser } = useAuthStore();

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };
};
