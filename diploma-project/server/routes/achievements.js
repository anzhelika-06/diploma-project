const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { notifyUserAboutAchievement } = require('../utils/notificationHelper');

const pool = new Pool({
  user: process.env.DB_USER || 'ecosteps',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecosteps',
  password: process.env.DB_PASSWORD || 'ecosteps_password',
  port: process.env.DB_PORT || 5432,
});

// ============ ОСНОВНЫЕ ФУНКЦИИ ============

// Функция для обработки событий достижений
// Функция для обработки событий достижений
const processAchievementEvent = async (userId, eventType, eventData = {}, io = null) => {
  let client;
  try {
    client = await pool.connect();
    
    console.log(`🎯 Обработка события достижения: ${eventType} для пользователя ${userId}`);
    
    // 0. Проверяем существование пользователя
    const userCheck = await client.query(
      'SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      console.log(`⚠️ Пользователь ${userId} не найден или удален, пропускаем трекинг достижения`);
      return { 
        success: false, 
        error: 'USER_NOT_FOUND',
        unlocked: [], 
        updated: [] 
      };
    }
    
    // 1. Записываем событие в историю
    await client.query(`
      INSERT INTO achievement_events (user_id, event_type, event_data)
      VALUES ($1, $2, $3)
    `, [userId, eventType, JSON.stringify(eventData)]);
    
    // 2. Получаем все активные достижения для этого типа события
    const achievementsQuery = `
      SELECT * FROM achievements 
      WHERE event_type = $1 
        AND is_active = true
      ORDER BY requirement_value ASC
    `;
    
    const achievementsResult = await client.query(achievementsQuery, [eventType]);
    
    if (achievementsResult.rows.length === 0) {
      console.log(`ℹ️ Нет достижений для события: ${eventType}`);
      return { unlocked: [], updated: [] };
    }
    
    const unlockedAchievements = [];
    const updatedAchievements = [];
    
    // 3. Обрабатываем каждое достижение
    for (const achievement of achievementsResult.rows) {
      console.log(`🔍 Проверяем достижение: ${achievement.name} (${achievement.requirement_type})`);
      
      // Получаем текущий прогресс пользователя
      const userAchievementQuery = `
        SELECT * FROM user_achievements 
        WHERE user_id = $1 AND achievement_id = $2
      `;
      
      const userAchievementResult = await client.query(userAchievementQuery, [userId, achievement.id]);
      const userAchievement = userAchievementResult.rows[0];
      
      // Рассчитываем новый прогресс в зависимости от типа требования
      let newProgress = 0;
      let newCurrentValue = 0;
      let completed = false;
      
      switch (achievement.requirement_type) {
        case 'count':
          // Просто увеличиваем счетчик
          newProgress = (userAchievement?.progress || 0) + 1;
          newCurrentValue = newProgress;
          completed = newProgress >= achievement.requirement_value;
          break;
          
        case 'streak':
          // Для стриков - используем текущее значение из eventData или увеличиваем на 1
          const currentStreak = eventData.consecutiveDays || eventData.streak || 1;
          newProgress = currentStreak;
          newCurrentValue = currentStreak;
          completed = currentStreak >= achievement.requirement_value;
          break;
          
        case 'value':
          // Для значений (например, количество слов)
          const increment = eventData.value || eventData.increment || 1;
          newProgress = (userAchievement?.progress || 0) + increment;
          newCurrentValue = eventData.currentValue || increment;
          completed = newProgress >= achievement.requirement_value;
          break;
          
        case 'boolean':
          // Булевое достижение - либо выполнено, либо нет
          newProgress = 1;
          newCurrentValue = 1;
          completed = true;
          break;
          
        default:
          newProgress = (userAchievement?.progress || 0) + 1;
          completed = newProgress >= achievement.requirement_value;
      }
      
      // Определяем, было ли достижение разблокировано сейчас
      const wasCompleted = userAchievement?.completed || false;
      const isNewlyCompleted = completed && !wasCompleted;
      
      // Обновляем или создаем запись
      const upsertQuery = `
        INSERT INTO user_achievements (
          user_id, achievement_id, progress, current_value, 
          completed, completed_at, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, achievement_id) 
        DO UPDATE SET
          progress = EXCLUDED.progress,
          current_value = EXCLUDED.current_value,
          completed = EXCLUDED.completed,
          completed_at = CASE 
            WHEN EXCLUDED.completed AND user_achievements.completed = false 
            THEN EXCLUDED.completed_at 
            ELSE user_achievements.completed_at 
          END,
          metadata = EXCLUDED.metadata,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const completedAt = isNewlyCompleted ? new Date() : userAchievement?.completed_at;
      
      const result = await client.query(upsertQuery, [
        userId,
        achievement.id,
        newProgress,
        newCurrentValue,
        completed,
        completedAt,
        JSON.stringify(eventData)
      ]);
      
      updatedAchievements.push({
        id: achievement.id,
        name: achievement.name,
        progress: newProgress,
        completed: completed,
        wasCompleted: wasCompleted,
        newlyCompleted: isNewlyCompleted
      });
      
      // Если достижение только что выполнено - добавляем в разблокированные
      if (isNewlyCompleted) {
        unlockedAchievements.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          points: achievement.points,
          rarity: achievement.rarity
        });
        
        console.log(`🏆 Разблокировано достижение: ${achievement.name} (${achievement.points} очков)`);
        console.log(`ℹ️ Награда будет получена только после клика "Забрать награду"`);
        console.log(`📡 io передан в processAchievementEvent:`, !!io);
        console.log(`   Тип io:`, typeof io);
        
        // Отправляем уведомление пользователю о новом достижении
        if (io) {
          try {
            console.log(`🔔 Вызываем notifyUserAboutAchievement для пользователя ${userId}`);
            const notificationResult = await notifyUserAboutAchievement(
              userId,
              achievement.name,
              achievement.icon,
              achievement.id,
              io
            );
            console.log(`✅ notifyUserAboutAchievement вернула:`, notificationResult ? 'успех' : 'null');
          } catch (notifError) {
            console.error('❌ Ошибка отправки уведомления о достижении:', notifError);
          }
        } else {
          console.error(`❌ io НЕ передан в processAchievementEvent! Уведомление не будет отправлено.`);
        }
      }
    }
    
    return {
      success: true,
      unlocked: unlockedAchievements,
      updated: updatedAchievements,
      eventType: eventType,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Ошибка обработки события достижения:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
};
// ============ ЭНДПОИНТЫ ============

// Трекинг события достижения (главный эндпоинт для других сервисов)
router.post('/track', async (req, res) => {
  try {
    const { userId, achievementType, data, timestamp } = req.body;
    
    console.log('📥 Получен запрос на трекинг:', { userId, achievementType });
    
    if (!userId || !achievementType) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Отсутствуют userId или achievementType'
      });
    }
    
    // Обрабатываем событие
    const io = req.app.get('io');
    const result = await processAchievementEvent(userId, achievementType, data || {}, io);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Ошибка в /track:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

// Получить все достижения
router.get('/', async (req, res) => {
  let client;
  try {
    console.log('GET /api/achievements - получение всех достижений');
    
    client = await pool.connect();
    
    const query = `
  SELECT 
    id,
    code,
    name,
    description,
    category,
    icon,
    event_type,
    requirement_type,
    requirement_value,
    points,
    rarity,
    is_active,
    is_hidden,
    sort_order
  FROM achievements
  WHERE is_active = true
  ORDER BY sort_order ASC, category, points ASC
`;
    
    console.log('Выполняем запрос:', query);
    const result = await client.query(query);
    
    console.log(`Найдено достижений: ${result.rows.length}`);
    
    res.json({
      success: true,
      achievements: result.rows
    });
    
  } catch (error) {
    console.error('Ошибка получения достижений:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message
    });
  } finally {
    if (client) client.release();
  }
});

// Получить достижения пользователя
router.get('/user/:userId', async (req, res) => {
  let client;
  try {
    const { userId } = req.params;
    console.log(`GET /api/achievements/user/${userId} - получение достижений пользователя`);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_USER_ID'
      });
    }
    
    client = await pool.connect();
    
    // Проверяем существование пользователя
    const userCheck = await client.query(
      `SELECT id, COALESCE(eco_coins, 0) as eco_coins 
       FROM users 
       WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND'
      });
    }
    
    // Получаем достижения с прогрессом пользователя
    // Вместо текущего запроса используйте этот:
      const query = `
      SELECT 
        a.id,
        a.code,
        a.name,
        a.description,
        a.category,
        a.icon,
        a.event_type,
        a.requirement_type,
        a.requirement_value,
        a.points,
        a.rarity,
        COALESCE(ua.progress, 0) as progress,
        COALESCE(ua.current_value, 0) as current_value,
        COALESCE(ua.completed, false) as completed,
        ua.completed_at,
        ua.claimed_at,
        ua.started_at,
        a.is_hidden
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
      WHERE a.is_active = true
        AND (
          a.is_hidden = false -- Показываем все НЕ скрытые достижения
          OR 
          ua.progress > 0 -- Или скрытые, в которых есть прогресс
          OR 
          ua.completed = true -- Или уже выполненные скрытые
        )
      ORDER BY 
        CASE WHEN COALESCE(ua.completed, false) THEN 0 ELSE 1 END,
        a.sort_order ASC,
        a.category,
        a.points ASC
      `;
    
    console.log('Выполняем запрос для пользователя');
    const result = await client.query(query, [userId]);
    
    console.log(`Найдено достижений для пользователя: ${result.rows.length}`);
    
    // Фильтруем скрытые достижения, которые еще не начаты
    const visibleAchievements = result.rows.filter(ach => 
      !ach.is_hidden || ach.progress > 0 || ach.completed
    );
    
    // Подсчитываем статистику
    const completedAchievements = visibleAchievements.filter(a => a.completed);
    const claimedAchievements = completedAchievements.filter(a => a.claimed_at);
    
    const completedCount = completedAchievements.length;
    const totalCount = visibleAchievements.length;
    const totalPoints = claimedAchievements.reduce((sum, a) => sum + a.points, 0);
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    res.json({
      success: true,
      achievements: visibleAchievements,
      ecoCoins: userCheck.rows[0].eco_coins || 0,
      stats: {
        completed: completedCount,
        total: totalCount,
        totalPoints: totalPoints,
        percentage: percentage,
        unclaimed: completedAchievements.filter(a => !a.claimed_at).length
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения достижений пользователя:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message
    });
  } finally {
    if (client) client.release();
  }
});

// Получить награду за достижение
// Получить награду за достижение
router.post('/claim', async (req, res) => {
  let client;
  try {
    const { userId, achievementId } = req.body;
    console.log('POST /api/achievements/claim - получение награды');
    
    if (!userId || !achievementId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS'
      });
    }
    
    client = await pool.connect();
    
    await client.query('BEGIN');
    
    try {
      // Получаем информацию о достижении и проверяем условия
      const achievementQuery = `
        SELECT 
          a.id, 
          a.name, 
          a.points,
          ua.completed,
          ua.claimed_at
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
        WHERE a.id = $2 AND a.is_active = true
      `;
      
      const achievementResult = await client.query(achievementQuery, [userId, achievementId]);
      
      if (achievementResult.rows.length === 0) {
        throw new Error('ACHIEVEMENT_NOT_FOUND');
      }
      
      const achievement = achievementResult.rows[0];
      
      // Проверяем выполнено ли достижение
      if (!achievement.completed) {
        throw new Error('ACHIEVEMENT_NOT_COMPLETED');
      }
      
      // Проверяем не получена ли уже награда
      if (achievement.claimed_at) {
        throw new Error('REWARD_ALREADY_CLAIMED');
      }
      
      // Обновляем время получения награды
      const updateResult = await client.query(`
        UPDATE user_achievements 
        SET claimed_at = CURRENT_TIMESTAMP 
        WHERE user_id = $1 AND achievement_id = $2 
        RETURNING *
      `, [userId, achievementId]);
      
      // ⭐ НАЧИСЛЯЕМ ЭКОИНЫ ТОЛЬКО ЗДЕСЬ!
      // Увеличиваем баланс экоинов пользователя
      await client.query(`
        UPDATE users 
        SET eco_coins = COALESCE(eco_coins, 0) + $1
        WHERE id = $2
      `, [achievement.points, userId]);
      
      // Записываем в историю экоинов
      await client.query(`
        INSERT INTO eco_coins_history (user_id, amount, type, achievement_id, description)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        userId,
        achievement.points,
        'achievement_claimed',
        achievementId,
        `Награда получена за достижение: ${achievement.name}`
      ]);
      
      // Получаем новый баланс экоинов
      const newBalanceResult = await client.query(
        'SELECT COALESCE(eco_coins, 0) as eco_coins FROM users WHERE id = $1',
        [userId]
      );
      
      await client.query('COMMIT');
      
      console.log(`💰 Начислено экоинов пользователю ${userId}: +${achievement.points}`);
      
      res.json({
        success: true,
        userAchievement: updateResult.rows[0],
        ecoCoins: newBalanceResult.rows[0].eco_coins,
        points: achievement.points,
        message: 'Награда успешно получена'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Ошибка получения награды:', error);
    
    let statusCode = 500;
    let errorMessage = 'SERVER_ERROR';
    
    switch (error.message) {
      case 'ACHIEVEMENT_NOT_FOUND':
        statusCode = 404;
        errorMessage = 'ACHIEVEMENT_NOT_FOUND';
        break;
      case 'ACHIEVEMENT_NOT_COMPLETED':
        statusCode = 400;
        errorMessage = 'ACHIEVEMENT_NOT_COMPLETED';
        break;
      case 'REWARD_ALREADY_CLAIMED':
        statusCode = 400;
        errorMessage = 'REWARD_ALREADY_CLAIMED';
        break;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      message: error.message
    });
  } finally {
    if (client) client.release();
  }
});

// Получить историю экоинов пользователя
router.get('/eco-history/:userId', async (req, res) => {
  let client;
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    console.log(`GET /api/achievements/eco-history/${userId} - получение истории экоинов`);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_USER_ID'
      });
    }
    
    client = await pool.connect();
    
    const query = `
      SELECT 
        ech.*,
        a.name as achievement_name,
        a.icon as achievement_icon,
        a.code as achievement_code
      FROM eco_coins_history ech
      LEFT JOIN achievements a ON ech.achievement_id = a.id
      WHERE ech.user_id = $1
      ORDER BY ech.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await client.query(query, [userId, limit, offset]);
    
    const totalResult = await client.query(
      'SELECT COUNT(*) FROM eco_coins_history WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      history: result.rows,
      total: parseInt(totalResult.rows[0].count, 10),
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
    
  } catch (error) {
    console.error('Ошибка получения истории экоинов:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message
    });
  } finally {
    if (client) client.release();
  }
});

// Получить историю событий пользователя
router.get('/event-history/:userId', async (req, res) => {
  let client;
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    console.log(`GET /api/achievements/event-history/${userId} - получение истории событий`);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_USER_ID'
      });
    }
    
    client = await pool.connect();
    
    const query = `
      SELECT 
        id,
        event_type,
        event_data,
        processed,
        created_at
      FROM achievement_events
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await client.query(query, [userId, limit, offset]);
    
    const totalResult = await client.query(
      'SELECT COUNT(*) FROM achievement_events WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      events: result.rows,
      total: parseInt(totalResult.rows[0].count, 10),
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
    
  } catch (error) {
    console.error('Ошибка получения истории событий:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message
    });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
module.exports.processAchievementEvent = processAchievementEvent;
