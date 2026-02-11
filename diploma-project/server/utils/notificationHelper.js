const pool = require('../config/database');

/**
 * Создать уведомление для пользователя (с проверкой настроек)
 * @param {number} userId - ID пользователя
 * @param {string} type - Тип уведомления (report_response, new_report, friend_request, achievement, system)
 * @param {string} title - Заголовок уведомления
 * @param {string} message - Текст уведомления
 * @param {string} link - Ссылка для перехода (опционально)
 * @param {number} relatedId - ID связанной сущности (опционально)
 * @param {object} io - Socket.IO instance для отправки в реальном времени (опционально)
 * @returns {Promise<object|null>} Созданное уведомление или null если уведомления отключены
 */
async function createNotification(userId, type, title, message, link = null, relatedId = null, io = null) {
  try {
    console.log(`🔔 Попытка создать уведомление для пользователя ${userId}`);
    
    // Проверяем настройки пользователя
    const settingsResult = await pool.query(
      'SELECT notifications_enabled FROM user_settings WHERE user_id = $1',
      [userId]
    );

    console.log(`🔔 Настройки пользователя ${userId}:`, settingsResult.rows);

    // Если настройки не найдены, создаем их с включенными уведомлениями по умолчанию
    if (settingsResult.rows.length === 0) {
      console.log(`⚠️ Настройки не найдены для пользователя ${userId}, создаем с уведомлениями включенными`);
      await pool.query(
        'INSERT INTO user_settings (user_id, notifications_enabled) VALUES ($1, true) ON CONFLICT (user_id) DO NOTHING',
        [userId]
      );
    } else if (!settingsResult.rows[0].notifications_enabled) {
      console.log(`❌ Уведомления отключены для пользователя ${userId}`);
      return null;
    }

    // Создаем уведомление
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link, related_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, type, title, message, link, relatedId]
    );

    const notification = result.rows[0];
    console.log(`✅ Уведомление создано:`, notification);

    // Если передан io, отправляем уведомление через WebSocket
    if (io) {
      console.log(`📡 Отправка уведомления через WebSocket в комнату user:${userId}`);
      console.log(`   Тип io:`, typeof io);
      console.log(`   io.to доступен:`, typeof io.to === 'function');
      
      try {
        io.to(`user:${userId}`).emit('notification:new', notification);
        console.log(`✅ WebSocket событие notification:new отправлено в комнату user:${userId}`);
      } catch (emitError) {
        console.error(`❌ Ошибка отправки WebSocket события:`, emitError);
      }
      
      // Получаем обновленное количество непрочитанных
      const unreadResult = await pool.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );
      
      const unreadCount = parseInt(unreadResult.rows[0].count);
      console.log(`📊 Непрочитанных уведомлений: ${unreadCount}`);
      
      try {
        io.to(`user:${userId}`).emit('notification:unread-count', {
          count: unreadCount
        });
        console.log(`✅ WebSocket событие notification:unread-count отправлено в комнату user:${userId}`);
      } catch (emitError) {
        console.error(`❌ Ошибка отправки WebSocket события unread-count:`, emitError);
      }
    } else {
      console.log(`⚠️ Socket.IO instance не передан, уведомление не отправлено через WebSocket`);
    }

    console.log(`✅ Уведомление создано для пользователя ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('❌ Ошибка создания уведомления:', error);
    return null;
  }
}

/**
 * Создать уведомление о новой жалобе для всех администраторов
 * @param {number} reportId - ID жалобы
 * @param {string} reporterNickname - Никнейм отправителя жалобы
 * @param {string} reportedUserNickname - Никнейм пользователя, на которого жалоба
 * @param {object} io - Socket.IO instance
 */
async function notifyAdminsAboutNewReport(reportId, reporterNickname, reportedUserNickname, io = null) {
  try {
    console.log(`🔔 Создание уведомлений о жалобе #${reportId} для администраторов`);
    console.log(`📝 Отправитель: ${reporterNickname}, На пользователя: ${reportedUserNickname}`);
    console.log(`📡 Socket.IO передан:`, !!io);
    
    // Получаем всех администраторов
    const adminsResult = await pool.query(
      'SELECT id FROM users WHERE is_admin = true AND is_banned = false'
    );

    console.log(`👥 Найдено администраторов: ${adminsResult.rows.length}`);

    const title = 'Новая жалоба';
    const message = `Пользователь ${reporterNickname} пожаловался на ${reportedUserNickname}`;
    const link = '/admin?tab=reports';

    // Создаем уведомления для всех администраторов
    const promises = adminsResult.rows.map(admin => {
      console.log(`📨 Создание уведомления для админа ID: ${admin.id}`);
      return createNotification(admin.id, 'new_report', title, message, link, reportId, io);
    });

    await Promise.all(promises);
    console.log(`✅ Уведомления о жалобе #${reportId} отправлены ${adminsResult.rows.length} администраторам`);
  } catch (error) {
    console.error('❌ Ошибка отправки уведомлений администраторам:', error);
  }
}

/**
 * Создать уведомление об ответе администратора на жалобу
 * @param {number} reporterId - ID пользователя, который отправил жалобу
 * @param {number} reportId - ID жалобы
 * @param {string} status - Статус жалобы (resolved, rejected)
 * @param {string} adminResponse - Ответ администратора
 * @param {object} io - Socket.IO instance
 */
async function notifyUserAboutReportResponse(reporterId, reportId, status, adminResponse, io = null) {
  try {
    const title = status === 'resolved' ? 'Жалоба рассмотрена' : 'Жалоба отклонена';
    const message = adminResponse || 'Администратор рассмотрел вашу жалобу';
    const link = '/profile'; // Можно добавить специальную страницу для просмотра жалоб

    await createNotification(reporterId, 'report_response', title, message, link, reportId, io);
    console.log(`✅ Уведомление об ответе на жалобу #${reportId} отправлено пользователю ${reporterId}`);
  } catch (error) {
    console.error('Ошибка отправки уведомления пользователю:', error);
  }
}

/**
 * Создать уведомление об одобрении истории
 * @param {number} userId - ID автора истории
 * @param {number} storyId - ID истории
 * @param {string} storyTitle - Заголовок истории
 * @param {object} io - Socket.IO instance
 */
async function notifyUserAboutStoryApproval(userId, storyId, storyTitle, io = null) {
  try {
    const title = 'История одобрена';
    const message = `Ваша история "${storyTitle}" была одобрена и опубликована!`;
    const link = '/reviews';

    await createNotification(userId, 'story_approved', title, message, link, storyId, io);
    console.log(`✅ Уведомление об одобрении истории #${storyId} отправлено пользователю ${userId}`);
  } catch (error) {
    console.error('Ошибка отправки уведомления об одобрении истории:', error);
  }
}

/**
 * Создать уведомление об отклонении истории
 * @param {number} userId - ID автора истории
 * @param {number} storyId - ID истории
 * @param {string} storyTitle - Заголовок истории
 * @param {string} reason - Причина отклонения
 * @param {object} io - Socket.IO instance
 */
async function notifyUserAboutStoryRejection(userId, storyId, storyTitle, reason, io = null) {
  try {
    const title = 'История отклонена';
    const message = reason || `Ваша история "${storyTitle}" была отклонена модератором`;
    const link = '/reviews';

    await createNotification(userId, 'story_rejected', title, message, link, storyId, io);
    console.log(`✅ Уведомление об отклонении истории #${storyId} отправлено пользователю ${userId}`);
  } catch (error) {
    console.error('Ошибка отправки уведомления об отклонении истории:', error);
  }
}

/**
 * Создать уведомление о получении достижения
 * @param {number} userId - ID пользователя
 * @param {string} achievementName - Название достижения
 * @param {string} achievementIcon - Иконка достижения
 * @param {number} achievementId - ID достижения
 * @param {object} io - Socket.IO instance
 */
async function notifyUserAboutAchievement(userId, achievementName, achievementIcon, achievementId, io = null) {
  try {
    console.log(`🔔 notifyUserAboutAchievement вызвана для пользователя ${userId}`);
    console.log(`   Достижение: ${achievementIcon} ${achievementName}`);
    console.log(`   io передан:`, !!io);
    
    const title = 'Новое достижение!';
    const message = `Поздравляем! Вы получили достижение "${achievementIcon} ${achievementName}"`;
    const link = '/achievements';

    const notification = await createNotification(userId, 'achievement', title, message, link, achievementId, io);
    console.log(`✅ Уведомление о достижении "${achievementName}" ${notification ? 'создано' : 'НЕ создано'} для пользователя ${userId}`);
    return notification;
  } catch (error) {
    console.error('❌ Ошибка отправки уведомления о достижении:', error);
    return null;
  }
}

module.exports = {
  createNotification,
  notifyAdminsAboutNewReport,
  notifyUserAboutReportResponse,
  notifyUserAboutStoryApproval,
  notifyUserAboutStoryRejection,
  notifyUserAboutAchievement
};
