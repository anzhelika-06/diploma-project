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

// Получить все истории с фильтрацией
router.get('/', async (req, res) => {
  try {
    const { filter = 'all', userId = null, category = 'all' } = req.query;
    
    let query = `
      SELECT 
        s.id,
        s.title,
        s.content,
        s.carbon_saved,
        s.likes_count,
        s.created_at,
        s.category,
        u.nickname as user_nickname,
        CASE 
          WHEN u.carbon_saved >= 5000 THEN 'star'
          WHEN u.carbon_saved >= 4000 THEN 'leaf'
          WHEN u.carbon_saved >= 3000 THEN 'tree'
          WHEN u.carbon_saved >= 2000 THEN 'sprout'
          WHEN u.carbon_saved >= 1000 THEN 'seedling'
          ELSE 'plant'
        END as user_avatar,
        CASE WHEN sl.user_id IS NOT NULL THEN true ELSE false END as is_liked
      FROM success_stories s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN story_likes sl ON s.id = sl.story_id AND sl.user_id = $1
    `;
    
    let whereConditions = [];
    let queryParams = [userId];
    
    // Фильтр по категории
    if (category !== 'all') {
      whereConditions.push(`s.category = $${queryParams.length + 1}`);
      queryParams.push(category);
    }
    
    // Фильтр по времени для "recent"
    if (filter === 'recent') {
      whereConditions.push("s.created_at > NOW() - INTERVAL '30 days'");
    }
    
    // Добавляем WHERE условия если они есть
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    // Сортировка
    let orderBy = 'ORDER BY s.created_at DESC';
    if (filter === 'best') {
      orderBy = 'ORDER BY s.likes_count DESC';
    } else if (filter === 'recent') {
      orderBy = 'ORDER BY s.created_at DESC';
    } else {
      orderBy = 'ORDER BY s.carbon_saved DESC';
    }
    
    query += ' ' + orderBy;
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      success: true,
      stories: result.rows
    });
  } catch (error) {
    console.error('Ошибка при получении историй:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

// Получить все доступные категории
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM success_stories 
      GROUP BY category 
      ORDER BY count DESC
    `);
    
    res.json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    console.error('Ошибка при получении категорий:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

// Лайкнуть/убрать лайк истории
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'USER_ID_REQUIRED'
      });
    }
    
    // Проверяем, лайкал ли уже пользователь эту историю
    const existingLike = await pool.query(
      'SELECT id FROM story_likes WHERE story_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    let newLikesCount;
    let isLiked;
    
    if (existingLike.rows.length > 0) {
      // Убираем лайк
      await pool.query(
        'DELETE FROM story_likes WHERE story_id = $1 AND user_id = $2',
        [id, userId]
      );
      
      // Уменьшаем счетчик лайков
      const result = await pool.query(
        'UPDATE success_stories SET likes_count = likes_count - 1 WHERE id = $1 RETURNING likes_count',
        [id]
      );
      
      newLikesCount = result.rows[0].likes_count;
      isLiked = false;
    } else {
      // Добавляем лайк
      await pool.query(
        'INSERT INTO story_likes (story_id, user_id) VALUES ($1, $2)',
        [id, userId]
      );
      
      // Увеличиваем счетчик лайков
      const result = await pool.query(
        'UPDATE success_stories SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count',
        [id]
      );
      
      newLikesCount = result.rows[0].likes_count;
      isLiked = true;
    }
    
    res.json({
      success: true,
      likes: newLikesCount,
      isLiked: isLiked
    });
  } catch (error) {
    console.error('Ошибка при лайке истории:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

module.exports = router;