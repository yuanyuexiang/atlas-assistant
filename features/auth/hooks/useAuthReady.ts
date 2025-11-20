import { useEffect, useState } from 'react';

/**
 * 检查认证状态是否已从持久化存储中恢复完成
 * 用于避免路由守卫在状态水合前就执行判断
 */
export const useAuthReady = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 检查 localStorage 中是否有持久化数据
    const hasPersistedData = localStorage.getItem('auth-storage');
    
    if (hasPersistedData) {
      // 如果有持久化数据,等待 zustand 恢复
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // 如果没有持久化数据(首次访问),立即标记为ready
      setIsReady(true);
    }
  }, []);

  return isReady;
};
