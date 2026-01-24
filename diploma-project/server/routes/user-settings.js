const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Подключение к базе данных
const pool = new Pool({
  user: process.env.DB_USER || 'ecosteps',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecosteps',
  password: process.env.DB_PASSWORD || 'ecosteps_password',
  port: process.env.DB_PORT || 5432,
});

// Middleware для проверки авторизации
const requireAuth = (req, res, next) => {
  let userId = null;
  
  // Проверяем оба варианта: X-User-Id и Authorization header
  if (req.headers['x-user-id']) {
    userId = req.headers['x-user-id'];
  } else if (req.headers['authorization']) {
    // Пытаемся извлечь userId из токена (упрощенная версия)
    const token = req.headers['authorization'].replace('Bearer ', '');
    // В реальном приложении здесь была бы верификация токена
    // Для простоты предполагаем, что userId передается в токене
    try {
      // Простая декодировка (в реальном приложении используйте JWT)
      const decoded = Buffer.from(token, 'base64').toString();
      userId = decoded.split(':')[0]; // предполагаем формат "userId:timestamp"
    } catch (error) {
      // Если не получается декодировать, используем заголовок X-User-Id
      console.warn('Не удалось декодировать токен:', error);
    }
  }
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Требуется авторизация'
    });
  }
  
  req.userId = parseInt(userId);
  next();
};

// Создать настройки по умолчанию (новый endpoint)
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      theme = 'light',
      language = 'RU',
      notifications = true,
      ecoTips = true,
      emailNotifications = true,
      pushNotifications = false,
      privacyLevel = 1,
      timezone = 'Europe/Minsk'
    } = req.body;
    
    const query = `
      INSERT INTO user_settings (
        user_id,
        theme,
        language,
        notifications_enabled,
        eco_tips_enabled,
        email_notifications,
        push_notifications,
        privacy_level,
        timezone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id) DO UPDATE SET
        theme = EXCLUDED.theme,
        language = EXCLUDED.language,
        notifications_enabled = EXCLUDED.notifications_enabled,
        eco_tips_enabled = EXCLUDED.eco_tips_enabled,
        email_notifications = EXCLUDED.email_notifications,
        push_notifications = EXCLUDED.push_notifications,
        privacy_level = EXCLUDED.privacy_level,
        timezone = EXCLUDED.timezone,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const values = [
      req.userId,
      theme,
      language,
      notifications,
      ecoTips,
      emailNotifications,
      pushNotifications,
      privacyLevel,
      timezone
    ];
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      message: 'Настройки созданы/обновлены',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка создания настроек:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Ошибка сервера'
    });
  }
});

// Получить настройки пользователя
router.get('/', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT 
        theme,
        language,
        notifications_enabled,
        eco_tips_enabled,
        email_notifications,
        push_notifications,
        privacy_level,
        timezone
      FROM user_settings
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [req.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'SETTINGS_NOT_FOUND',
        message: 'Настройки пользователя не найдены'
      });
    }
    
    const settings = result.rows[0];
    
    res.json({
      success: true,
      settings: {
        theme: settings.theme,
        language: settings.language,
        notifications: settings.notifications_enabled,
        ecoTips: settings.eco_tips_enabled,
        emailNotifications: settings.email_notifications,
        pushNotifications: settings.push_notifications,
        privacyLevel: settings.privacy_level,
        timezone: settings.timezone
      }
    });
  } catch (error) {
    console.error('Ошибка получения настроек:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Ошибка сервера'
    });
  }
});

// Обновить настройки пользователя
router.put('/', requireAuth, async (req, res) => {
  try {
    const {
      theme,
      language,
      notifications,
      ecoTips,
      emailNotifications,
      pushNotifications,
      privacyLevel,
      timezone
    } = req.body;
    
    // Проверяем, есть ли уже настройки у пользователя
    const checkQuery = 'SELECT user_id FROM user_settings WHERE user_id = $1';
    const checkResult = await pool.query(checkQuery, [req.userId]);
    
    if (checkResult.rows.length === 0) {
      // Если настроек нет, создаем их
      return router.post(req, res);
    }
    
    // Строим динамический запрос только для переданных полей
    const updates = [];
    const values = [req.userId];
    let paramIndex = 2;
    
    if (theme !== undefined) {
      updates.push(`theme = $${paramIndex}`);
      values.push(theme);
      paramIndex++;
    }
    
    if (language !== undefined) {
      updates.push(`language = $${paramIndex}`);
      values.push(language);
      paramIndex++;
    }
    
    if (notifications !== undefined) {
      updates.push(`notifications_enabled = $${paramIndex}`);
      values.push(notifications);
      paramIndex++;
    }
    
    if (ecoTips !== undefined) {
      updates.push(`eco_tips_enabled = $${paramIndex}`);
      values.push(ecoTips);
      paramIndex++;
    }
    
    if (emailNotifications !== undefined) {
      updates.push(`email_notifications = $${paramIndex}`);
      values.push(emailNotifications);
      paramIndex++;
    }
    
    if (pushNotifications !== undefined) {
      updates.push(`push_notifications = $${paramIndex}`);
      values.push(pushNotifications);
      paramIndex++;
    }
    
    if (privacyLevel !== undefined) {
      updates.push(`privacy_level = $${paramIndex}`);
      values.push(privacyLevel);
      paramIndex++;
    }
    
    if (timezone !== undefined) {
      updates.push(`timezone = $${paramIndex}`);
      values.push(timezone);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'NO_UPDATES',
        message: 'Нет данных для обновления'
      });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    const query = `
      UPDATE user_settings SET ${updates.join(', ')}
      WHERE user_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rowCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'UPDATE_FAILED',
        message: 'Не удалось обновить настройки'
      });
    }
    
    res.json({
      success: true,
      message: 'Настройки успешно обновлены',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка обновления настроек:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Ошибка сервера'
    });
  }
});

// Сбросить настройки к значениям по умолчанию
router.post('/reset', requireAuth, async (req, res) => {
  try {
    const query = `
      UPDATE user_settings SET
        theme = 'light',
        language = 'RU',
        notifications_enabled = TRUE,
        eco_tips_enabled = TRUE,
        email_notifications = TRUE,
        push_notifications = FALSE,
        privacy_level = 1,
        timezone = 'Europe/Minsk',
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [req.userId]);
    
    res.json({
      success: true,
      message: 'Настройки сброшены к значениям по умолчанию',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка сброса настроек:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Ошибка сервера'
    });
  }
});
  
module.exports = router;