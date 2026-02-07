import { getEmojiByCode, getEmojiByCarbon, getEcoLevelText } from './emojiMapper';
export const getCurrentUser = () => {
  try {
    // Пытаемся получить пользователя из localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('📊 getCurrentUser из localStorage:', user);
      return user;
    }
    
    // Если нет в localStorage, пробуем декодировать токен
    return getUserFromToken();
  } catch (error) {
    console.error('❌ Error in getCurrentUser:', error);
    return null;
  }
};
export const getUserFromToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ Нет токена в localStorage');
      return null;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('❌ Неверный формат токена');
      return null;
    }
    
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));
    
    console.log('🔍 Декодированный токен:', decoded);
    
    // ВАЖНО: Токен содержит только базовые поля, не carbon_saved!
    return {
      id: decoded.userId || decoded.id,
      email: decoded.email || '',
      nickname: decoded.nickname || '',
      is_admin: decoded.is_admin || false,
      isAdmin: decoded.is_admin || false,
      // Эти поля будут отсутствовать в токене!
      // carbon_saved: decoded.carbon_saved || 0,
      // avatar_emoji: decoded.avatar_emoji || getEmojiByCarbon(carbonSaved),
      // eco_level: decoded.eco_level || getEcoLevelText(carbonSaved)
    };
  } catch (error) {
    console.error('❌ Ошибка при декодировании токена:', error);
    return null;
  }
};

export const getUserInfo = () => {
  const user = getUserFromToken();
  console.log('📋 getUserInfo результат:', user);
  return user;
};

// Вспомогательная функция для проверки админских прав
export const isUserAdmin = () => {
  const user = getUserFromToken();
  console.log('👑 isUserAdmin check - user:', user);
  return user?.is_admin || false;
};

// Функция для сохранения пользователя в localStorage (используется после успешного логина)
export const saveUserToStorage = (userData) => {
  try {
    console.log('💾 Сохранение пользователя в localStorage:', userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.token || '');
  } catch (error) {
    console.error('❌ Error saving user to storage:', error);
  }
};

// Функция для получения полных данных пользователя из localStorage
export const getUserFromStorage = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log('📭 Нет пользователя в localStorage');
      return null;
    }
    
    const user = JSON.parse(userStr);
    console.log('📖 Пользователь из localStorage:', user);
    return user;
  } catch (error) {
    console.error('❌ Error getting user from storage:', error);
    return null;
  }
};

// Функция для получения аватара пользователя
export const getUserAvatar = (user) => {
  if (!user) return '🌱';
  
  console.log('🖼️ Получение аватара для пользователя:', user);
  
  // Если у пользователя есть avatar_emoji
  if (user.avatar_emoji) {
    return user.avatar_emoji;
  }
  
  // Если ничего нет, используем дефолтный
  return '🌱';
};

// Очистка данных пользователя
export const clearUserStorage = () => {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    console.log('🧹 Данные пользователя очищены');
  } catch (error) {
    console.error('❌ Error clearing user storage:', error);
  }
};