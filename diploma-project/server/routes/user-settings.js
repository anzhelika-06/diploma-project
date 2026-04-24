const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken'); // Добавляем JWT
const router = express.Router();

// Подключение к базе данных
const pool = new Pool({
  user: process.env.DB_USER || 'ecosteps',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecosteps',
  password: process.env.DB_PASSWORD || 'ecosteps_password',
  port: process.env.DB_PORT || 5432,
});

// Middleware для проверки авторизации с JWT токеном
const requireAuth = (req, res, next) => {
  console.log('🔐 USER SETTINGS REQUEST');
  console.log('📝 Method:', req.method);
  console.log('🔗 Headers:', {
    'x-user-id': req.headers['x-user-id'],
    'authorization': req.headers['authorization'] ? 'Present' : 'Missing'
  });
  
  const userId = req.headers['x-user-id'];
  const authHeader = req.headers['authorization'];
  
  // 1. Проверяем наличие обоих заголовков
  if (!userId) {
    console.error('❌ Missing X-User-Id header');
    return res.status(401).json({
      success: false,
      error: 'NO_USER_ID',
      message: 'Требуется идентификатор пользователя (X-User-Id)'
    });
  }
  
  if (!authHeader) {
    console.error('❌ Missing Authorization header');
    return res.status(401).json({
      success: false,
      error: 'NO_AUTHORIZATION',
      message: 'Требуется авторизация (Authorization header)'
    });
  }
  
  // 2. Проверяем формат Authorization header
  if (!authHeader.startsWith('Bearer ')) {
    console.error('❌ Invalid Authorization format');
    return res.status(401).json({
      success: false,
      error: 'INVALID_AUTH_FORMAT',
      message: 'Authorization header должен начинаться с "Bearer "'
    });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  // 3. Проверяем валидность user ID
  const parsedUserId = parseInt(userId);
  
  if (isNaN(parsedUserId) || parsedUserId <= 0) {
    console.error('❌ Invalid user ID format:', userId);
    return res.status(401).json({
      success: false,
      error: 'INVALID_USER_ID',
      message: 'Неверный формат идентификатора пользователя'
    });
  }
  
  // 4. Верифицируем JWT токен
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'ecosteps-secret-key-2024'
    );
    
    console.log('✅ Token decoded:', {
      userId: decoded.userId,
      email: decoded.email,
      exp: new Date(decoded.exp * 1000).toISOString()
    });
    
    // 5. Проверяем соответствие userId из токена и заголовка
    if (decoded.userId !== parsedUserId) {
      console.error('❌ User ID mismatch:', {
        tokenUserId: decoded.userId,
        headerUserId: parsedUserId
      });
      return res.status(401).json({
        success: false,
        error: 'USER_ID_MISMATCH',
        message: 'Идентификатор пользователя не совпадает с токеном'
      });
    }
    
    req.userId = parsedUserId;
    console.log('✅ Authentication successful, userId:', req.userId);
    next();
    
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Срок действия токена истек'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Недействительный токен'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'AUTH_FAILED',
      message: 'Ошибка аутентификации'
    });
  }
};

// Получить настройки пользователя
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log(`📥 GET settings for user ${req.userId}`);
    
    const query = `
      SELECT 
        id,
        user_id,
        theme,
        language,
        notifications_enabled,
        eco_tips_enabled,
        privacy_level,
        timezone,
        created_at,
        updated_at
      FROM user_settings
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [req.userId]);
    
    if (result.rows.length === 0) {
      console.log(`📭 No settings found for user ${req.userId}`);
      return res.status(404).json({
        success: false,
        error: 'SETTINGS_NOT_FOUND',
        message: 'Настройки пользователя не найдены'
      });
    }
    
    const settings = result.rows[0];
    
    console.log(`✅ Settings found for user ${req.userId}:`, {
      theme: settings.theme,
      language: settings.language,
      updatedAt: settings.updated_at
    });
    
    res.json({
      success: true,
      settings: {
        id: settings.id,
        userId: settings.user_id,
        theme: settings.theme,
        language: settings.language,
        notifications: settings.notifications_enabled,
        ecoTips: settings.eco_tips_enabled,
        privacyLevel: settings.privacy_level,
        timezone: settings.timezone,
        createdAt: settings.created_at,
        updatedAt: settings.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Error getting settings:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Ошибка сервера при получении настроек'
    });
  }
});

// Создать или обновить настройки пользователя
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log(`📝 POST settings for user ${req.userId}`);
    console.log('📦 Request body:', req.body);
    
    const {
      theme = 'light',
      language = 'RU',
      notifications = true,
      ecoTips = true,
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
        privacy_level,
        timezone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        theme = EXCLUDED.theme,
        language = EXCLUDED.language,
        notifications_enabled = EXCLUDED.notifications_enabled,
        eco_tips_enabled = EXCLUDED.eco_tips_enabled,
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
      privacyLevel,
      timezone
    ];
    
    const result = await pool.query(query, values);
    
    console.log(`✅ Settings saved for user ${req.userId}`, {
      id: result.rows[0].id,
      theme: result.rows[0].theme,
      language: result.rows[0].language
    });
    
    res.json({
      success: true,
      message: 'Настройки созданы/обновлены',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error saving settings:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Ошибка сервера при сохранении настроек'
    });
  }
});

// Обновить настройки пользователя
router.put('/', requireAuth, async (req, res) => {
  try {
    console.log(`🔄 PUT settings for user ${req.userId}`);
    console.log('📦 Request body:', req.body);
    
    const {
      theme,
      language,
      notifications,
      ecoTips,
      privacyLevel,
      timezone
    } = req.body;
    
    // Проверяем, есть ли уже настройки у пользователя
    const checkQuery = 'SELECT id FROM user_settings WHERE user_id = $1';
    const checkResult = await pool.query(checkQuery, [req.userId]);
    
    if (checkResult.rows.length === 0) {
      console.log(`📝 No settings found, creating new for user ${req.userId}`);
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
    
    console.log(`✅ Settings updated for user ${req.userId}`, {
      id: result.rows[0].id,
      theme: result.rows[0].theme,
      updatedAt: result.rows[0].updated_at
    });
    
    res.json({
      success: true,
      message: 'Настройки успешно обновлены',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Ошибка сервера при обновлении настроек'
    });
  }
});

// Сбросить настройки к значениям по умолчанию
router.post('/reset', requireAuth, async (req, res) => {
  try {
    console.log(`🔄 RESET settings for user ${req.userId}`);
    
    const query = `
      UPDATE user_settings SET
        theme = 'light',
        language = 'RU',
        notifications_enabled = TRUE,
        eco_tips_enabled = TRUE,
        privacy_level = 1,
        timezone = 'Europe/Minsk',
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [req.userId]);
    
    if (result.rowCount === 0) {
      // Если настроек нет, создаем с дефолтными значениями
      console.log(`📝 No settings to reset, creating default for user ${req.userId}`);
      
      const createQuery = `
        INSERT INTO user_settings (
          user_id,
          theme,
          language,
          notifications_enabled,
          eco_tips_enabled,
          privacy_level,
          timezone
        ) VALUES ($1, 'light', 'RU', TRUE, TRUE, 1, 'Europe/Minsk')
        RETURNING *
      `;
      
      const createResult = await pool.query(createQuery, [req.userId]);
      
      console.log(`✅ Default settings created for user ${req.userId}`);
      
      return res.json({
        success: true,
        message: 'Настройки сброшены к значениям по умолчанию',
        settings: createResult.rows[0]
      });
    }
    
    console.log(`✅ Settings reset for user ${req.userId}`);
    
    res.json({
      success: true,
      message: 'Настройки сброшены к значениям по умолчанию',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error resetting settings:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Ошибка сервера при сбросе настроек'
    });
  }
});

router.delete('/account', requireAuth, async (req, res) => {
  console.log('\n=== DELETE ACCOUNT ===');
  console.log(`🗑️  Запрос на удаление аккаунта для пользователя ${req.userId}`);
  
  try {
    // Начинаем транзакцию, чтобы удалить все связанные данные
    await pool.query('BEGIN');
    
    // 1. Получаем информацию о пользователе (для логирования)
    const userQuery = await pool.query(
      'SELECT email, nickname FROM users WHERE id = $1',
      [req.userId]
    );
    
    if (userQuery.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Пользователь не найден'
      });
    }
    
    const userEmail = userQuery.rows[0].email;
    const userNickname = userQuery.rows[0].nickname;
    
    console.log(`Удаляем аккаунт: ${userNickname} (${userEmail})`);
    
    // 2. Получаем текущие настройки пользователя перед удалением
    console.log('📋 Получаем текущие настройки пользователя...');
    let currentSettings = {
      theme: 'light',
      language: 'RU',
      notifications: true,
      ecoTips: true,
      privacyLevel: 1
    };
    
    try {
      const settingsQuery = await pool.query(
        'SELECT theme, language, notifications_enabled, eco_tips_enabled, privacy_level FROM user_settings WHERE user_id = $1',
        [req.userId]
      );
      
      if (settingsQuery.rows.length > 0) {
        const settings = settingsQuery.rows[0];
        currentSettings = {
          theme: settings.theme || 'light',
          language: settings.language || 'RU',
          notifications: settings.notifications_enabled ?? true,
          ecoTips: settings.eco_tips_enabled ?? true,
          privacyLevel: settings.privacy_level || 1
        };
        console.log('Текущие настройки пользователя:', currentSettings);
      } else {
        console.log('Настройки не найдены, используем дефолтные');
      }
    } catch (error) {
      console.log('⚠️ Не удалось получить настройки пользователя:', error.message);
    }
    
    // 3. Удаляем вопросы в поддержке пользователя
    console.log('🗑️  Удаляем вопросы поддержки...');
    await pool.query(
      'DELETE FROM support_tickets WHERE user_id = $1',
      [req.userId]
    );
    
    // 4. Удаляем настройки пользователя
    console.log('🗑️  Удаляем настройки пользователя...');
    await pool.query(
      'DELETE FROM user_settings WHERE user_id = $1',
      [req.userId]
    );
    
    // 5. Удаляем достижения пользователя (если есть таблица achievements)
    try {
      console.log('🗑️  Удаляем достижения пользователя...');
      await pool.query(
        'DELETE FROM user_achievements WHERE user_id = $1',
        [req.userId]
      );
    } catch (error) {
      console.log('⚠️  Таблица user_achievements не существует или недоступна:', error.message);
    }
    
    // 6. Удаляем историю пользователя (если есть таблица user_history)
    try {
      console.log('🗑️  Удаляем историю пользователя...');
      await pool.query(
        'DELETE FROM user_history WHERE user_id = $1',
        [req.userId]
      );
    } catch (error) {
      console.log('⚠️  Таблица user_history не существует или недоступна:', error.message);
    }
    
    // 7. Удаляем пользователя из команд (если есть таблица team_members)
    try {
      console.log('🗑️  Удаляем пользователя из команд...');
      await pool.query(
        'DELETE FROM team_members WHERE user_id = $1',
        [req.userId]
      );
    } catch (error) {
      console.log('⚠️  Таблица team_members не существует или недоступна:', error.message);
    }
    
    // 8. Удаляем самого пользователя
    console.log('🗑️  Удаляем пользователя из таблицы users...');
    const deleteUserResult = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, email, nickname',
      [req.userId]
    );
    
    if (deleteUserResult.rowCount === 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'DELETE_FAILED',
        message: 'Не удалось удалить пользователя'
      });
    }
    
    // Подтверждаем транзакцию
    await pool.query('COMMIT');
    
    console.log(`✅ Аккаунт пользователя ${userNickname} (ID: ${req.userId}) успешно удален`);
    
    // 9. Определяем настройки для сброса (значения по умолчанию)
    const defaultSettings = {
      theme: 'light',        // Всегда светлая тема
      language: 'RU',        // Русский язык по умолчанию
      notifications: true,   // Уведомления включены
      ecoTips: true,         // Эко-советы включены
      privacyLevel: 1        // Базовый уровень приватности
    };
    
    console.log('🎨 Настройки сброшены на значения по умолчанию:', defaultSettings);
    
    res.json({
      success: true,
      message: 'Аккаунт успешно удален',
      deletedUser: deleteUserResult.rows[0],
      // Отправляем настройки для сброса на фронтенде
      settings: defaultSettings,
      // Для отладки можем также отправить оригинальные настройки
      originalSettings: currentSettings,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // Откатываем транзакцию при ошибке
    await pool.query('ROLLBACK');
    
    console.error('❌ Ошибка при удалении аккаунта:', error);
    
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Ошибка сервера при удалении аккаунта',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
module.exports = router;
