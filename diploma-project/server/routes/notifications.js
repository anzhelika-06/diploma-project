const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Получить все уведомления пользователя
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Получить количество непрочитанных
    const unreadResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      success: true,
      notifications: result.rows,
      unreadCount: parseInt(unreadResult.rows[0].count)
    });
  } catch (error) {
    console.error('Ошибка получения уведомлений:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Получить количество непрочитанных уведомлений
router.get('/:userId/unread-count', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      success: true,
      count: parseInt(result.rows[0].count)
    });
  } catch (error) {
    console.error('Ошибка получения количества непрочитанных:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Отметить уведомление как прочитанное
router.patch('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1',
      [notificationId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка отметки уведомления:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Отметить все уведомления пользователя как прочитанные
router.patch('/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка отметки всех уведомлений:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Удалить уведомление
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;

    await pool.query(
      'DELETE FROM notifications WHERE id = $1',
      [notificationId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления уведомления:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Создать уведомление (используется внутренне)
router.post('/', async (req, res) => {
  try {
    const { user_id, type, title, message, link, related_id } = req.body;

    // Проверяем настройки пользователя
    const settingsResult = await pool.query(
      'SELECT notifications_enabled FROM user_settings WHERE user_id = $1',
      [user_id]
    );

    // Если настройки не найдены или уведомления отключены, не создаем уведомление
    if (settingsResult.rows.length === 0 || !settingsResult.rows[0].notifications_enabled) {
      return res.json({ 
        success: true, 
        notification: null,
        message: 'Уведомления отключены пользователем' 
      });
    }

    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link, related_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, type, title, message, link, related_id]
    );

    res.json({ success: true, notification: result.rows[0] });
  } catch (error) {
    console.error('Ошибка создания уведомления:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// ТЕСТОВЫЙ ЭНДПОИНТ - отправить тестовое уведомление
router.post('/test/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🧪 Тестовая отправка уведомления пользователю ${userId}`);
    
    // Создаем тестовое уведомление в БД
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'system', 'Тестовое уведомление', 'Это тестовое уведомление для проверки WebSocket', '/profile')
       RETURNING *`,
      [userId]
    );
    
    const notification = result.rows[0];
    console.log(`✅ Тестовое уведомление создано в БД:`, notification.id);
    
    // Отправляем через WebSocket
    const io = req.app.get('io');
    if (io) {
      console.log(`📡 Отправка через WebSocket в комнату user:${userId}`);
      io.to(`user:${userId}`).emit('notification:new', notification);
      console.log(`✅ WebSocket событие отправлено`);
      
      // Также отправляем счетчик
      const unreadResult = await pool.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );
      const unreadCount = parseInt(unreadResult.rows[0].count);
      
      io.to(`user:${userId}`).emit('notification:unread-count', { count: unreadCount });
      console.log(`✅ Счетчик непрочитанных отправлен: ${unreadCount}`);
    } else {
      console.error(`❌ Socket.IO не доступен`);
    }
    
    res.json({ 
      success: true, 
      notification: notification,
      message: 'Тестовое уведомление отправлено'
    });
  } catch (error) {
    console.error('Ошибка отправки тестового уведомления:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Тестовый эндпоинт для проверки уведомлений о достижениях
router.post('/test/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const io = req.app.get('io');
    
    console.log(`🧪 Тестовый эндпоинт: создание уведомления для пользователя ${userId}`);
    console.log(`   io доступен:`, !!io);
    
    if (!io) {
      return res.status(500).json({
        success: false,
        error: 'IO_NOT_AVAILABLE',
        message: 'Socket.IO не доступен'
      });
    }
    
    // Создаем тестовое уведомление о достижении
    const { notifyUserAboutAchievement } = require('../utils/notificationHelper');
    
    const notification = await notifyUserAboutAchievement(
      parseInt(userId),
      'Тестовое достижение',
      '🧪',
      999,
      io
    );
    
    console.log(`✅ Тестовое уведомление создано:`, notification);
    
    res.json({
      success: true,
      message: 'Тестовое уведомление отправлено',
      notification: notification,
      ioAvailable: !!io
    });
  } catch (error) {
    console.error('❌ Ошибка в тестовом эндпоинте:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

module.exports = router;
