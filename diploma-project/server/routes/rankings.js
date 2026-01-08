const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({
  user: process.env.DB_USER || 'ecosteps',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecosteps',
  password: process.env.DB_PASSWORD || 'ecosteps_password',
  port: process.env.DB_PORT || 5432,
});

// Получить топ пользователей
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.nickname,
        u.carbon_saved,
        CASE 
          WHEN u.carbon_saved >= 5000 THEN 'Эко-герой'
          WHEN u.carbon_saved >= 4000 THEN 'Эко-мастер'
          WHEN u.carbon_saved >= 3000 THEN 'Эко-активист'
          WHEN u.carbon_saved >= 2000 THEN 'Эко-энтузиаст'
          WHEN u.carbon_saved >= 1000 THEN 'Эко-стартер'
          ELSE 'Эко-новичок'
        END as eco_level,
        CASE 
          WHEN u.carbon_saved >= 5000 THEN 'star'
          WHEN u.carbon_saved >= 4000 THEN 'leaf'
          WHEN u.carbon_saved >= 3000 THEN 'tree'
          WHEN u.carbon_saved >= 2000 THEN 'sprout'
          WHEN u.carbon_saved >= 1000 THEN 'seedling'
          ELSE 'plant'
        END as avatar_emoji,
        ROW_NUMBER() OVER (ORDER BY u.carbon_saved DESC) as rank
      FROM users u
      ORDER BY u.carbon_saved DESC
      LIMIT 5
    `);
    
    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Ошибка при получении рейтинга пользователей:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

// Получить топ команд
router.get('/teams', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.carbon_saved,
        t.member_count,
        t.avatar_emoji,
        ROW_NUMBER() OVER (ORDER BY t.carbon_saved DESC) as rank
      FROM teams t
      ORDER BY t.carbon_saved DESC
      LIMIT 5
    `);
    
    res.json({
      success: true,
      teams: result.rows
    });
  } catch (error) {
    console.error('Ошибка при получении рейтинга команд:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

// Получить общую статистику платформы
router.get('/stats', async (req, res) => {
  try {
    // Получаем все статистики одним запросом
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as active_users,
        (SELECT COALESCE(SUM(carbon_saved), 0) FROM users) as total_co2_saved,
        (SELECT COUNT(*) FROM teams) as eco_teams,
        (SELECT COUNT(*) FROM success_stories) as success_stories
    `;
    
    const result = await pool.query(statsQuery);
    const stats = result.rows[0];
    
    // Форматируем CO2 в удобный вид (тонны)
    const co2InTons = Math.round(stats.total_co2_saved / 1000 * 10) / 10; // Округляем до 1 знака после запятой
    
    res.json({
      success: true,
      stats: {
        activeUsers: parseInt(stats.active_users),
        co2Saved: co2InTons,
        ecoTeams: parseInt(stats.eco_teams),
        successStories: parseInt(stats.success_stories)
      }
    });
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

module.exports = router;