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

// Получить общую статистику платформы
router.get('/', async (req, res) => {
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