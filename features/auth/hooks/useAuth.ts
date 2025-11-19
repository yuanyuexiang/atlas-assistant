import { useAuthStore } from '../store';

export const useAuth = () => {
  const { user, isAuthenticated, login, register, logout, refreshUser } = useAuthStore();

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };
};
