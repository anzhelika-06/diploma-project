const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'ecosteps',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecosteps',
  password: process.env.DB_PASSWORD || 'ecosteps_password',
  port: process.env.DB_PORT || 5432,
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
        requirement_type,
        requirement_value,
        points,
        rarity
      FROM achievements
      ORDER BY category, points ASC
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
    
    // Проверяем существование пользователя с COALESCE для eco_coins
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
    const query = `
      SELECT 
        a.id,
        a.code,
        a.name,
        a.description,
        a.category,
        a.icon,
        a.requirement_type,
        a.requirement_value,
        a.points,
        a.rarity,
        COALESCE(ua.progress, 0) as progress,
        COALESCE(ua.completed, false) as completed,
        ua.completed_at,
        ua.claimed_at
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
      ORDER BY 
        CASE WHEN COALESCE(ua.completed, false) THEN 0 ELSE 1 END,
        a.category,
        a.points ASC
    `;
    
    console.log('Выполняем запрос для пользователя');
    const result = await client.query(query, [userId]);
    
    console.log(`Найдено достижений для пользователя: ${result.rows.length}`);
    
    // Подсчитываем статистику
    const completed = result.rows.filter(a => a.completed).length;
    const total = result.rows.length;
    const totalPoints = result.rows
      .filter(a => a.completed && a.claimed_at)
      .reduce((sum, a) => sum + a.points, 0);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    res.json({
      success: true,
      achievements: result.rows,
      ecoCoins: userCheck.rows[0].eco_coins || 0,
      stats: {
        completed,
        total,
        totalPoints,
        percentage
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

// Обновить прогресс достижения
router.post('/progress', async (req, res) => {
  let client;
  try {
    const { userId, achievementCode, progress } = req.body;
    console.log('POST /api/achievements/progress - обновление прогресса');
    
    if (!userId || !achievementCode || progress === undefined) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Отсутствуют обязательные поля'
      });
    }
    
    client = await pool.connect();
    
    // Получаем достижение по коду
    const achievementResult = await client.query(
      'SELECT id, requirement_value FROM achievements WHERE code = $1',
      [achievementCode]
    );
    
    if (achievementResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'ACHIEVEMENT_NOT_FOUND'
      });
    }
    
    const achievement = achievementResult.rows[0];
    const completed = progress >= achievement.requirement_value;
    const completedAt = completed ? new Date() : null;
    
    // Обновляем или создаем запись прогресса
    const updateQuery = `
      INSERT INTO user_achievements (user_id, achievement_id, progress, completed, completed_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, achievement_id) 
      DO UPDATE SET 
        progress = EXCLUDED.progress,
        completed = EXCLUDED.completed,
        completed_at = CASE WHEN EXCLUDED.completed AND user_achievements.completed = false 
                          THEN EXCLUDED.completed_at 
                          ELSE user_achievements.completed_at END,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [
      userId, 
      achievement.id, 
      progress, 
      completed, 
      completedAt
    ]);
    
    const unlocked = completed && !result.rows[0].completed;
    
    res.json({
      success: true,
      userAchievement: result.rows[0],
      unlocked
    });
    
  } catch (error) {
    console.error('Ошибка обновления прогресса:', error);
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
        WHERE a.id = $2
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
      
      // Добавляем экоины пользователю (используем COALESCE)
      await client.query(`
        UPDATE users 
        SET eco_coins = COALESCE(eco_coins, 0) + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [achievement.points, userId]);
      
      // Записываем в историю
      await client.query(`
        INSERT INTO eco_coins_history (user_id, amount, type, achievement_id, description)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        userId,
        achievement.points,
        'achievement_reward',
        achievementId,
        `Награда за достижение: ${achievement.name}`
      ]);
      
      // Получаем новый баланс экоинов
      const newBalanceResult = await client.query(
        'SELECT COALESCE(eco_coins, 0) as eco_coins FROM users WHERE id = $1',
        [userId]
      );
      
      await client.query('COMMIT');
      
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
        a.icon as achievement_icon
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

// Тестовый эндпоинт для проверки соединения с БД
router.get('/test-db', async (req, res) => {
  let client;
  try {
    console.log('GET /api/achievements/test-db - проверка соединения с БД');
    
    client = await pool.connect();
    
    // Проверяем существование таблиц
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'achievements', 'user_achievements', 'eco_coins_history')
    `);
    
    // Проверяем колонку eco_coins в таблице users
    const columnsCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('eco_coins', 'id', 'email')
    `);
    
    res.json({
      success: true,
      tables: tablesCheck.rows.map(r => r.table_name),
      user_columns: columnsCheck.rows,
      message: 'Соединение с БД установлено'
    });
    
  } catch (error) {
    console.error('Ошибка теста БД:', error);
    res.status(500).json({
      success: false,
      error: 'DB_CONNECTION_ERROR',
      message: error.message
    });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;