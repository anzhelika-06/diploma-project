const redisClient = require('./redisClient');

/**
 * Менеджер сессий на основе Redis
 */
class SessionManager {
  constructor() {
    this.SESSION_PREFIX = 'session:';
    this.USER_SOCKETS_PREFIX = 'user_sockets:';
    this.ONLINE_USERS_KEY = 'online_users';
    this.SESSION_TTL = 24 * 60 * 60; // 24 часа
  }

  /**
   * Сохранить сессию
   */
  async saveSession(socketId, sessionData) {
    try {
      const key = `${this.SESSION_PREFIX}${socketId}`;
      await redisClient.setEx(
        key,
        this.SESSION_TTL,
        JSON.stringify(sessionData)
      );
      
      // Добавляем socket к пользователю
      const userSocketsKey = `${this.USER_SOCKETS_PREFIX}${sessionData.userId}`;
      await redisClient.sAdd(userSocketsKey, socketId);
      await redisClient.expire(userSocketsKey, this.SESSION_TTL);
      
      // Добавляем в список онлайн пользователей
      await redisClient.sAdd(this.ONLINE_USERS_KEY, sessionData.userId.toString());
      
      console.log(`💾 Сессия сохранена: ${socketId} -> User ${sessionData.userId}`);
    } catch (err) {
      console.error('❌ Ошибка сохранения сессии:', err);
    }
  }

  /**
   * Получить сессию
   */
  async getSession(socketId) {
    try {
      const key = `${this.SESSION_PREFIX}${socketId}`;
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('❌ Ошибка получения сессии:', err);
      return null;
    }
  }

  /**
   * Удалить сессию
   */
  async deleteSession(socketId) {
    try {
      const session = await this.getSession(socketId);
      
      if (session) {
        const { userId } = session;
        
        // Удаляем socket из списка пользователя
        const userSocketsKey = `${this.USER_SOCKETS_PREFIX}${userId}`;
        await redisClient.sRem(userSocketsKey, socketId);
        
        // Проверяем, остались ли у пользователя другие сокеты
        const remainingSockets = await redisClient.sCard(userSocketsKey);
        
        if (remainingSockets === 0) {
          // Удаляем пользователя из онлайн списка
          await redisClient.sRem(this.ONLINE_USERS_KEY, userId.toString());
          await redisClient.del(userSocketsKey);
          console.log(`👋 Пользователь ${userId} полностью офлайн`);
          return { userId, isFullyOffline: true };
        } else {
          console.log(`🔌 У пользователя ${userId} осталось ${remainingSockets} соединений`);
          return { userId, isFullyOffline: false };
        }
      }
      
      // Удаляем саму сессию
      const key = `${this.SESSION_PREFIX}${socketId}`;
      await redisClient.del(key);
      
      return null;
    } catch (err) {
      console.error('❌ Ошибка удаления сессии:', err);
      return null;
    }
  }

  /**
   * Получить все сокеты пользователя
   */
  async getUserSockets(userId) {
    try {
      const userSocketsKey = `${this.USER_SOCKETS_PREFIX}${userId}`;
      const sockets = await redisClient.sMembers(userSocketsKey);
      return sockets;
    } catch (err) {
      console.error('❌ Ошибка получения сокетов пользователя:', err);
      return [];
    }
  }

  /**
   * Проверить, онлайн ли пользователь
   */
  async isUserOnline(userId) {
    try {
      const isOnline = await redisClient.sIsMember(
        this.ONLINE_USERS_KEY,
        userId.toString()
      );
      return isOnline;
    } catch (err) {
      console.error('❌ Ошибка проверки онлайн статуса:', err);
      return false;
    }
  }

  /**
   * Получить список всех онлайн пользователей
   */
  async getOnlineUsers() {
    try {
      const userIds = await redisClient.sMembers(this.ONLINE_USERS_KEY);
      const onlineUsers = [];
      
      for (const userId of userIds) {
        const sockets = await this.getUserSockets(userId);
        
        if (sockets.length > 0) {
          // Получаем данные из первой сессии
          const session = await this.getSession(sockets[0]);
          
          if (session) {
            onlineUsers.push({
              userId: parseInt(userId),
              nickname: session.nickname,
              connectedAt: session.connectedAt,
              socketCount: sockets.length
            });
          }
        }
      }
      
      return onlineUsers;
    } catch (err) {
      console.error('❌ Ошибка получения онлайн пользователей:', err);
      return [];
    }
  }

  /**
   * Получить количество онлайн пользователей
   */
  async getOnlineCount() {
    try {
      return await redisClient.sCard(this.ONLINE_USERS_KEY);
    } catch (err) {
      console.error('❌ Ошибка получения количества онлайн:', err);
      return 0;
    }
  }

  /**
   * Очистить все сессии (для отладки)
   */
  async clearAllSessions() {
    try {
      const keys = await redisClient.keys(`${this.SESSION_PREFIX}*`);
      const userKeys = await redisClient.keys(`${this.USER_SOCKETS_PREFIX}*`);
      
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      
      if (userKeys.length > 0) {
        await redisClient.del(userKeys);
      }
      
      await redisClient.del(this.ONLINE_USERS_KEY);
      
      console.log(`🧹 Очищено ${keys.length} сессий и ${userKeys.length} пользовательских ключей`);
    } catch (err) {
      console.error('❌ Ошибка очистки сессий:', err);
    }
  }
}

module.exports = new SessionManager();
