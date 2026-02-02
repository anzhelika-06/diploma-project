const express = require('express');
const { Pool } = require('pg');
const router = express.Router();
const { executeQueryWithLogging } = require('../utils/logger');
const { validatePagination } = require('../utils/validation');

const pool = new Pool({
  user: process.env.DB_USER || 'ecosteps',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecosteps',
  password: process.env.DB_PASSWORD || 'ecosteps_password',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Получить рейтинг пользователей по CO₂
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    
    const pagination = validatePagination(page, limit);
    
    // Основной запрос для получения рейтинга пользователей
    const query = `
      SELECT 
        u.id,
        u.nickname,
        u.email,
        u.avatar_emoji,
        u.carbon_saved,
        u.created_at,
        ROW_NUMBER() OVER (ORDER BY u.carbon_saved DESC, u.created_at ASC) as rank
      FROM users u
      WHERE u.carbon_saved > 0
      ORDER BY u.carbon_saved DESC, u.created_at ASC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await executeQueryWithLogging(pool, query, [pagination.limit, pagination.offset]);
    
    // Получаем общее количество пользователей с CO₂ > 0
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      WHERE carbon_saved > 0
    `;
    
    const countResult = await executeQueryWithLogging(pool, countQuery);
    const total = parseInt(countResult.rows[0].total);
    
    // Если передан userId, получаем позицию конкретного пользователя
    let userRank = null;
    if (userId) {
      const userRankQuery = `
        SELECT rank FROM (
          SELECT 
            u.id,
            ROW_NUMBER() OVER (ORDER BY u.carbon_saved DESC, u.created_at ASC) as rank
          FROM users u
          WHERE u.carbon_saved > 0
        ) ranked_users
        WHERE id = $1
      `;
      
      const userRankResult = await executeQueryWithLogging(pool, userRankQuery, [parseInt(userId)]);
      if (userRankResult.rows.length > 0) {
        userRank = parseInt(userRankResult.rows[0].rank);
      }
    }
    
    res.json({
      success: true,
      users: result.rows,
      userRank,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNext: pagination.offset + pagination.limit < total,
        hasPrev: pagination.page > 1
      }
    });
  } catch (error) {
    console.error('Ошибка при получении рейтинга пользователей:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// Получить рейтинг команд по CO₂
router.get('/teams', async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    
    const pagination = validatePagination(page, limit);
    
    // Основной запрос для получения рейтинга команд
    const query = `
      SELECT 
        t.id,
        t.name,
        t.description,
        t.created_at,
        COUNT(tm.user_id) as member_count,
        COALESCE(SUM(u.carbon_saved), 0) as total_carbon_saved,
        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(u.carbon_saved), 0) DESC, t.created_at ASC) as rank
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN users u ON tm.user_id = u.id
      GROUP BY t.id, t.name, t.description, t.created_at
      HAVING COALESCE(SUM(u.carbon_saved), 0) > 0
      ORDER BY total_carbon_saved DESC, t.created_at ASC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await executeQueryWithLogging(pool, query, [pagination.limit, pagination.offset]);
    
    // Получаем общее количество команд с CO₂ > 0
    const countQuery = `
      SELECT COUNT(*) as total
      FROM (
        SELECT t.id
        FROM teams t
        LEFT JOIN team_members tm ON t.id = tm.team_id
        LEFT JOIN users u ON tm.user_id = u.id
        GROUP BY t.id
        HAVING COALESCE(SUM(u.carbon_saved), 0) > 0
      ) teams_with_co2
    `;
    
    const countResult = await executeQueryWithLogging(pool, countQuery);
    const total = parseInt(countResult.rows[0].total);
    
    // Если передан userId, получаем позицию команды пользователя
    let userTeamRank = null;
    if (userId) {
      const userTeamRankQuery = `
        SELECT rank FROM (
          SELECT 
            t.id,
            ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(u.carbon_saved), 0) DESC, t.created_at ASC) as rank
          FROM teams t
          LEFT JOIN team_members tm ON t.id = tm.team_id
          LEFT JOIN users u ON tm.user_id = u.id
          GROUP BY t.id, t.created_at
          HAVING COALESCE(SUM(u.carbon_saved), 0) > 0
        ) ranked_teams
        WHERE id IN (
          SELECT team_id FROM team_members WHERE user_id = $1
        )
      `;
      
      const userTeamRankResult = await executeQueryWithLogging(pool, userTeamRankQuery, [parseInt(userId)]);
      if (userTeamRankResult.rows.length > 0) {
        userTeamRank = parseInt(userTeamRankResult.rows[0].rank);
      }
    }
    
    res.json({
      success: true,
      teams: result.rows,
      userTeamRank,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNext: pagination.offset + pagination.limit < total,
        hasPrev: pagination.page > 1
      }
    });
  } catch (error) {
    console.error('Ошибка при получении рейтинга команд:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

module.exports = router;