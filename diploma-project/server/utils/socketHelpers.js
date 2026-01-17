/**
 * Утилиты для работы с WebSocket сессиями
 */

/**
 * Отправить уведомление конкретному пользователю
 * @param {Object} io - Socket.IO instance
 * @param {number} userId - ID пользователя
 * @param {string} event - Название события
 * @param {Object} data - Данные для отправки
 */
function sendToUser(io, userId, event, data) {
  io.to(`user:${userId}`).emit(event, data);
  console.log(`📤 Отправлено событие "${event}" пользователю ${userId}`);
}

/**
 * Отправить уведомление всем пользователям в комнате
 * @param {Object} io - Socket.IO instance
 * @param {string} roomId - ID комнаты
 * @param {string} event - Название события
 * @param {Object} data - Данные для отправки
 */
function sendToRoom(io, roomId, event, data) {
  io.to(roomId).emit(event, data);
  console.log(`📤 Отправлено событие "${event}" в комнату ${roomId}`);
}

/**
 * Отправить уведомление всем подключенным пользователям
 * @param {Object} io - Socket.IO instance
 * @param {string} event - Название события
 * @param {Object} data - Данные для отправки
 */
function broadcast(io, event, data) {
  io.emit(event, data);
  console.log(`📢 Broadcast события "${event}" всем пользователям`);
}

/**
 * Проверить, онлайн ли пользователь
 * @param {Map} userSockets - Map с активными сокетами пользователей
 * @param {number} userId - ID пользователя
 * @returns {boolean}
 */
function isUserOnline(userSockets, userId) {
  return userSockets.has(userId) && userSockets.get(userId).size > 0;
}

/**
 * Получить количество активных соединений пользователя
 * @param {Map} userSockets - Map с активными сокетами пользователей
 * @param {number} userId - ID пользователя
 * @returns {number}
 */
function getUserConnectionCount(userSockets, userId) {
  return userSockets.has(userId) ? userSockets.get(userId).size : 0;
}

/**
 * Отправить персональное уведомление о лайке
 * @param {Object} io - Socket.IO instance
 * @param {number} authorUserId - ID автора истории
 * @param {Object} likeData - Данные о лайке
 */
function notifyStoryLike(io, authorUserId, likeData) {
  sendToUser(io, authorUserId, 'notification:like', {
    type: 'story_like',
    storyId: likeData.storyId,
    likedBy: likeData.userId,
    timestamp: new Date()
  });
}

/**
 * Уведомить команду о новом достижении
 * @param {Object} io - Socket.IO instance
 * @param {number} teamId - ID команды
 * @param {Object} achievementData - Данные о достижении
 */
function notifyTeamAchievement(io, teamId, achievementData) {
  sendToRoom(io, `team:${teamId}`, 'notification:achievement', {
    type: 'team_achievement',
    ...achievementData,
    timestamp: new Date()
  });
}

module.exports = {
  sendToUser,
  sendToRoom,
  broadcast,
  isUserOnline,
  getUserConnectionCount,
  notifyStoryLike,
  notifyTeamAchievement
};
