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

// Получить рейтинг пользователей
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id as user_id,
        u.nickname as username,
        u.nickname,
        COALESCE(SUM(s.carbon_saved), 0) as total_co2_saved,
        COUNT(DISTINCT ua.achievement_id) as achievements_count
      FROM users u
      LEFT JOIN success_stories s ON u.id = s.user_id
      LEFT JOIN user_achievements ua ON u.id = ua.user_id
      GROUP BY u.id, u.nickname
      ORDER BY total_co2_saved DESC
      LIMIT 100
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users leaderboard:', error);
    res.status(500).json({ error: 'Ошибка получения рейтинга пользователей' });
  }
});

// Получить рейтинг команд
router.get('/teams', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id as team_id,
        t.name as team_name,
        t.avatar_emoji as team_icon,
        t.goal_current as total_co2_saved,
        COUNT(DISTINCT tm.user_id) as member_count
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      GROUP BY t.id, t.name, t.avatar_emoji, t.goal_current
      ORDER BY t.goal_current DESC
      LIMIT 100
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching teams leaderboard:', error);
    res.status(500).json({ error: 'Ошибка получения рейтинга команд' });
  }
});

module.exports = router;
