// utils/authUtils.js
export const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      return {
        ...user,
        isAdmin: user.isAdmin || false
      };
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  };
  
  export const isUserAdmin = () => {
    const user = getUserFromStorage();
    return user?.isAdmin || false;
  };
  
  export const getUserInfo = () => {
    const user = getUserFromStorage();
    return user ? {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      isAdmin: user.isAdmin || false,
      carbonSaved: user.carbonSaved || 0,
      ecoLevel: user.ecoLevel || 'Эко-новичок',
      avatarEmoji: user.avatarEmoji || '🌱'
    } : null;
  };