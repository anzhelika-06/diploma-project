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
  const userId = req.headers['x-user-id']; // Временно используем заголовок
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
      message: 'Настройки успешно обновлены'
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
    `;
    
    await pool.query(query, [req.userId]);
    
    res.json({
      success: true,
      message: 'Настройки сброшены к значениям по умолчанию'
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