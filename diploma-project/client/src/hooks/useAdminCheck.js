// hooks/useAdminCheck.js
import { useState, useEffect } from 'react';

export const useAdminCheck = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAdmin = () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsAdmin(false);
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Декодируем токен прямо здесь
        const payload = JSON.parse(atob(token.split('.')[1]));
        const adminStatus = payload.is_admin || false;
        
        const userData = {
          id: payload.userId,
          email: payload.email,
          nickname: payload.nickname,
          is_admin: adminStatus,
          isAdmin: adminStatus
        };
        
        setIsAdmin(adminStatus);
        setUser(userData);
      } catch (error) {
        console.error('Admin check error:', error);
        setIsAdmin(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
    
    // Слушаем изменения в localStorage
    const handleStorageChange = () => {
      checkAdmin();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { isAdmin, loading, user };
};