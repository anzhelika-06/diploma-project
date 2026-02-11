import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser as getUser } from '../utils/authUtils';

const UserContext = createContext(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Функция для обновления пользователя (вызывается после авторизации)
  const updateUser = useCallback((userData) => {
    console.log('👤 UserContext: Обновление пользователя:', userData ? `ID ${userData.id}` : 'null');
    setCurrentUser(userData);
  }, []);

  // Функция для выхода
  const logout = useCallback(() => {
    console.log('👤 UserContext: Выход пользователя');
    setCurrentUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
  }, []);

  useEffect(() => {
    // Загружаем пользователя один раз при монтировании
    const user = getUser();
    setCurrentUser(user);
    setIsLoading(false);
    console.log('👤 UserContext: Инициализация, пользователь:', user ? `ID ${user.id}` : 'нет');

    // Слушаем изменения в localStorage
    const handleStorageChange = () => {
      const updatedUser = getUser();
      console.log('👤 UserContext: Обновление из localStorage:', updatedUser ? `ID ${updatedUser.id}` : 'нет');
      setCurrentUser(updatedUser);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleStorageChange);
    };
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, isLoading, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};
