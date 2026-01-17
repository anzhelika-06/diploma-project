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
  try {
    const { category } = req.query;
    
    let query = `
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
    `;
    
    const params = [];
    
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY category, points ASC';
    
    const result = await pool.query(query, params);

    res.json({
      success: true,
      achievements: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения достижений:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

// Получить достижения пользователя
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(`
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
        ua.progress,
        ua.completed,
        ua.completed_at
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
      ORDER BY 
        CASE WHEN ua.completed THEN 0 ELSE 1 END,
        a.category,
        a.points ASC
    `, [userId]);

    // Группируем по категориям
    const grouped = result.rows.reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    }, {});

    // Подсчитываем статистику
    const completed = result.rows.filter(a => a.completed).length;
    const total = result.rows.length;
    const totalPoints = result.rows
      .filter(a => a.completed)
      .reduce((sum, a) => sum + a.points, 0);

    res.json({
      success: true,
      achievements: result.rows,
      grouped,
      stats: {
        completed,
        total,
        totalPoints,
        percentage: Math.round((completed / total) * 100)
      }
    });
  } catch (error) {
    console.error('Ошибка получения достижений пользователя:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

// Обновить прогресс достижения
router.post('/progress', async (req, res) => {
  try {
    const { userId, achievementCode, progress } = req.body;

    if (!userId || !achievementCode) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS'
      });
    }

    // Получаем достижение
    const achievementResult = await pool.query(
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

    // Обновляем или создаем запись прогресса
    const result = await pool.query(`
      INSERT INTO user_achievements (user_id, achievement_id, progress, completed, completed_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, achievement_id) 
      DO UPDATE SET 
        progress = $3,
        completed = $4,
        completed_at = CASE WHEN $4 AND user_achievements.completed = false THEN $5 ELSE user_achievements.completed_at END
      RETURNING *
    `, [userId, achievement.id, progress, completed, completed ? new Date() : null]);

    res.json({
      success: true,
      userAchievement: result.rows[0],
      unlocked: completed && !result.rows[0].completed
    });
  } catch (error) {
    console.error('Ошибка обновления прогресса:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

module.exports = router;
