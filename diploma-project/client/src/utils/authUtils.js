import { getEmojiByCode, getEmojiByCarbon, getEcoLevelText } from './emojiMapper';

export const getUserFromToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));
    
    // Получаем сохраненный CO2 или используем значение из токена
    const carbonSaved = decoded.carbon_saved || 0;
    
    return {
      id: decoded.userId || decoded.id,
      email: decoded.email || '',
      nickname: decoded.nickname || '',
      is_admin: decoded.is_admin || false,
      isAdmin: decoded.is_admin || false,
      avatar_emoji: decoded.avatar_emoji || getEmojiByCarbon(carbonSaved),
      carbon_saved: carbonSaved,
      eco_level: getEcoLevelText(carbonSaved)
    };
  } catch (error) {
    return null;
  }
};

export const getUserInfo = () => {
  return getUserFromToken();
};

// Вспомогательная функция для проверки админских прав
export const isUserAdmin = () => {
  const user = getUserFromToken();
  console.log('isUserAdmin check - user:', user); // Добавим лог
  return user?.is_admin || false;
};

// Функция для сохранения пользователя в localStorage (используется после успешного логина)
export const saveUserToStorage = (userData) => {
  try {
    // Обновляем аватар эмодзи на основе сохраненного CO2
    const updatedUserData = {
      ...userData,
      avatar_emoji: userData.avatar_emoji || getEmojiByCarbon(userData.carbon_saved || 0),
      eco_level: userData.eco_level || getEcoLevelText(userData.carbon_saved || 0)
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUserData));
  } catch (error) {
    console.error('Error saving user to storage:', error);
  }
};

// Функция для обновления данных пользователя (например, при изменении CO2)
export const updateUserInStorage = (updates) => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    const user = JSON.parse(userStr);
    const updatedUser = { ...user, ...updates };
    
    // Если обновляется carbon_saved, обновляем также аватар и уровень
    if (updates.carbon_saved !== undefined) {
      updatedUser.avatar_emoji = getEmojiByCarbon(updates.carbon_saved);
      updatedUser.eco_level = getEcoLevelText(updates.carbon_saved);
    }
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
  } catch (error) {
    console.error('Error updating user in storage:', error);
  }
};

// Функция для получения аватара пользователя с обработкой кода или CO2
export const getUserAvatar = (user) => {
  if (!user) return '🌱';
  
  // Если у пользователя есть avatar_emoji код (например, из базы данных)
  if (user.avatar_emoji && user.avatar_emoji.length <= 10) {
    return getEmojiByCode(user.avatar_emoji) || '🌱';
  }
  
  // Если avatar_emoji уже является эмодзи (например, из localStorage)
  if (user.avatar_emoji && user.avatar_emoji.length > 10) {
    return user.avatar_emoji;
  }
  
  // Если ничего нет, используем CO2 для определения эмодзи
  return getEmojiByCarbon(user.carbon_saved || 0);
};