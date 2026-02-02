const express = require('express');
const { Pool } = require('pg');
const router = express.Router();
const { 
  validateCategory, 
  validateFilter, 
  validatePagination, 
  validateUserId, 
  validateStoryId 
} = require('../utils/validation');
const { executeQueryWithLogging } = require('../utils/logger');
const { likeLimiter } = require('../middleware/rateLimiter');
const { sendToUser, broadcast } = require('../utils/socketHelpers');
const { authenticateTokenWithDB, isAdmin } = require('../middleware/authMiddleware'); 

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

// Получить все истории с фильтрацией и пагинацией (только опубликованные для обычных пользователей)
router.get('/', async (req, res) => {
  try {
    const { 
      filter = 'all', 
      userId = null, 
      category = 'all',
      page = 1,
      limit = 20
    } = req.query;
    
    // Валидация параметров
    if (!validateFilter(filter)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_FILTER',
        message: 'Недопустимый фильтр'
      });
    }
    
    if (!validateCategory(category)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CATEGORY',
        message: 'Недопустимая категория'
      });
    }
    
    const validUserId = validateUserId(userId);
    const pagination = validatePagination(page, limit);
    
    // Оптимизированный запрос с EXISTS вместо LEFT JOIN
    // ВАЖНО: Обычные пользователи видят только опубликованные истории!
    let query = `
      SELECT 
        s.id,
        s.title,
        s.content,
        s.carbon_saved,
        s.likes_count,
        s.created_at,
        s.category,
        s.status,  -- Добавляем статус
        u.nickname as user_nickname,
        CASE 
          WHEN u.carbon_saved >= 5000 THEN 'star'
          WHEN u.carbon_saved >= 4000 THEN 'leaf'
          WHEN u.carbon_saved >= 3000 THEN 'tree'
          WHEN u.carbon_saved >= 2000 THEN 'sprout'
          WHEN u.carbon_saved >= 1000 THEN 'seedling'
          ELSE 'plant'
        END as user_avatar,
        ${validUserId ? 
          `EXISTS(SELECT 1 FROM story_likes sl WHERE sl.story_id = s.id AND sl.user_id = $1) as is_liked` :
          'false as is_liked'
        }
      FROM success_stories s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'published'  -- Только опубликованные истории!
    `;
    
    let whereConditions = [];
    let queryParams = validUserId ? [validUserId] : [];
    
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
      query += ' AND ' + whereConditions.join(' AND ');
    }
    
    // Сортировка
    let orderBy;
    switch (filter) {
      case 'best':
        orderBy = 'ORDER BY s.likes_count DESC, s.created_at DESC';
        break;
      case 'recent':
        orderBy = 'ORDER BY s.created_at DESC';
        break;
      default: // 'all'
        orderBy = 'ORDER BY s.created_at DESC';
        break;
    }
    
    query += ` ${orderBy} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(pagination.limit, pagination.offset);
    
    // Выполняем запрос с логированием
    console.log('🔍 SQL Query:', query);
    console.log('🔍 Query Params:', queryParams);
    const result = await executeQueryWithLogging(pool, query, queryParams);
    
    // Получаем общее количество для пагинации (только опубликованные)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM success_stories s
      WHERE s.status = 'published'
    `;
    
    let countParams = [];
    let paramIndex = 1;
    
    if (category !== 'all') {
      countQuery += ` AND s.category = $${paramIndex}`;
      countParams.push(category);
      paramIndex++;
    }
    
    const countResult = await executeQueryWithLogging(pool, countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      success: true,
      stories: result.rows,
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
    console.error('Ошибка при получении историй:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// Получить все доступные категории с кэшированием (только опубликованные)
router.get('/categories', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT category, COUNT(*) as count
      FROM success_stories 
      WHERE status = 'published'  -- Только опубликованные
      GROUP BY category 
      ORDER BY count DESC
    `;
    
    const result = await executeQueryWithLogging(pool, query);
    
    res.json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    console.error('Ошибка при получении категорий:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// Лайкнуть/убрать лайк истории с rate limiting
router.post('/:id/like', likeLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const storyId = validateStoryId(id);
    const validUserId = validateUserId(userId);
    
    if (!storyId) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STORY_ID',
        message: 'Недопустимый ID истории'
      });
    }
    
    if (!validUserId) {
      return res.status(400).json({
        success: false,
        error: 'USER_ID_REQUIRED',
        message: 'Требуется ID пользователя'
      });
    }
    
    // Проверяем, существует ли история
    const storyCheck = await executeQueryWithLogging(pool,
      'SELECT id, status FROM success_stories WHERE id = $1',
      [storyId]
    );
    
    if (storyCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'STORY_NOT_FOUND',
        message: 'История не найдена'
      });
    }
    
    // Можно лайкать только опубликованные истории
    if (storyCheck.rows[0].status !== 'published') {
      return res.status(403).json({
        success: false,
        error: 'STORY_NOT_PUBLISHED',
        message: 'Нельзя лайкать неопубликованную историю'
      });
    }
    
    // Проверяем, существует ли пользователь
    const userCheck = await executeQueryWithLogging(pool,
      'SELECT id FROM users WHERE id = $1',
      [validUserId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Пользователь не найден. Попробуйте перелогиниться.'
      });
    }
    
    // Проверяем, лайкал ли уже пользователь эту историю
    const existingLike = await executeQueryWithLogging(pool,
      'SELECT id FROM story_likes WHERE story_id = $1 AND user_id = $2',
      [storyId, validUserId]
    );
    
    let newLikesCount;
    let isLiked;
    
    if (existingLike.rows.length > 0) {
      // Убираем лайк
      await executeQueryWithLogging(pool,
        'DELETE FROM story_likes WHERE story_id = $1 AND user_id = $2',
        [storyId, validUserId]
      );
      
      // Уменьшаем счетчик лайков
      const result = await executeQueryWithLogging(pool,
        'UPDATE success_stories SET likes_count = likes_count - 1 WHERE id = $1 RETURNING likes_count',
        [storyId]
      );
      
      newLikesCount = result.rows[0].likes_count;
      isLiked = false;
    } else {
      // Добавляем лайк
      await executeQueryWithLogging(pool,
        'INSERT INTO story_likes (story_id, user_id) VALUES ($1, $2)',
        [storyId, validUserId]
      );
      
      // Увеличиваем счетчик лайков
      const result = await executeQueryWithLogging(pool,
        'UPDATE success_stories SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count',
        [storyId]
      );
      
      newLikesCount = result.rows[0].likes_count;
      isLiked = true;
    }
    
    // Отправляем событие через WebSocket всем подключенным клиентам
    const io = req.app.get('io');
    if (io) {
      // Broadcast обновления счетчика всем
      broadcast(io, 'story:like:update', {
        storyId: storyId,
        likes: newLikesCount,
        userId: validUserId
      });
      
      // Получаем автора истории для персонального уведомления
      const authorQuery = await executeQueryWithLogging(pool,
        'SELECT user_id FROM success_stories WHERE id = $1',
        [storyId]
      );
      
      if (authorQuery.rows.length > 0) {
        const authorId = authorQuery.rows[0].user_id;
        
        // Если лайк поставлен (не убран) и это не автор лайкает свою историю
        if (isLiked && authorId !== validUserId) {
          // Отправляем персональное уведомление автору
          sendToUser(io, authorId, 'notification:like', {
            type: 'story_like',
            storyId: storyId,
            likedByUserId: validUserId,
            newLikesCount: newLikesCount,
            timestamp: new Date()
          });
          
          console.log(`💚 Персональное уведомление о лайке отправлено автору (userId: ${authorId})`);
        }
      }
      
      console.log(`📡 WebSocket: отправлено обновление лайка для истории ${storyId}`);
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
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// Получить мои истории с фильтрацией по статусу
router.get('/my', async (req, res) => {
  try {
    const { 
      userId,
      status = 'all', // published, pending, draft, all
      category = 'all',
      page = 1,
      limit = 10
    } = req.query;
    
    // Валидация параметров
    if (!validateUserId(userId)) {
      return res.status(400).json({
        success: false,
        error: 'USER_ID_REQUIRED',
        message: 'Требуется ID пользователя'
      });
    }
    
    // Валидация статуса
    const validStatuses = ['published', 'pending', 'draft', 'all'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Недопустимый статус'
      });
    }
    
    if (!validateCategory(category)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CATEGORY',
        message: 'Недопустимая категория'
      });
    }
    
    const validUserId = validateUserId(userId);
    const pagination = validatePagination(page, limit);
    
    // Базовый запрос
    let query = `
      SELECT 
        s.id,
        s.title,
        s.content,
        s.carbon_saved,
        s.likes_count,
        s.created_at,
        s.category,
        s.status,
        u.nickname as user_nickname,
        CASE 
          WHEN u.carbon_saved >= 5000 THEN 'star'
          WHEN u.carbon_saved >= 4000 THEN 'leaf'
          WHEN u.carbon_saved >= 3000 THEN 'tree'
          WHEN u.carbon_saved >= 2000 THEN 'sprout'
          WHEN u.carbon_saved >= 1000 THEN 'seedling'
          ELSE 'plant'
        END as user_avatar,
        EXISTS(SELECT 1 FROM story_likes sl WHERE sl.story_id = s.id AND sl.user_id = $1) as is_liked
      FROM success_stories s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = $1
    `;
    
    let queryParams = [validUserId];
    let paramIndex = 2;
    
    // Фильтр по статусу
    if (status !== 'all') {
      query += ` AND s.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    // Фильтр по категории
    if (category !== 'all') {
      query += ` AND s.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }
    
    // Сортировка по дате создания (новые первыми)
    query += ' ORDER BY s.created_at DESC';
    
    // Пагинация
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(pagination.limit, pagination.offset);
    
    // Выполняем запрос
    console.log('🔍 SQL Query (my stories):', query);
    console.log('🔍 Query Params:', queryParams);
    
    const result = await executeQueryWithLogging(pool, query, queryParams);
    
    // Получаем общее количество для пагинации
    let countQuery = `
      SELECT COUNT(*) as total
      FROM success_stories s
      WHERE s.user_id = $1
    `;
    
    let countParams = [validUserId];
    let countParamIndex = 2;
    
    if (status !== 'all') {
      countQuery += ` AND s.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }
    
    if (category !== 'all') {
      countQuery += ` AND s.category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }
    
    const countResult = await executeQueryWithLogging(pool, countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      success: true,
      stories: result.rows,
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
    console.error('Ошибка при получении моих историй:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// Создать новую историю (со статусом 'pending' - на рассмотрении)
router.post('/', async (req, res) => {
  try {
    const { userId, title, content, category, carbon_saved = 0 } = req.body;
    
    // Валидация
    if (!validateUserId(userId)) {
      return res.status(400).json({
        success: false,
        error: 'USER_ID_REQUIRED',
        message: 'Требуется ID пользователя'
      });
    }
    
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'TITLE_REQUIRED',
        message: 'Требуется заголовок'
      });
    }
    
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'CONTENT_REQUIRED',
        message: 'Требуется содержание'
      });
    }
    
    if (!validateCategory(category)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CATEGORY',
        message: 'Недопустимая категория'
      });
    }
    
    // Проверяем, существует ли пользователь
    const userCheck = await executeQueryWithLogging(pool,
      'SELECT id, nickname FROM users WHERE id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Пользователь не найден'
      });
    }
    
    // Создаем историю (статус 'pending' - на рассмотрении администратора)
    const insertQuery = `
      INSERT INTO success_stories (
        user_id, 
        title, 
        content, 
        category, 
        carbon_saved, 
        status, 
        created_at
      ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      RETURNING *
    `;
    
    const insertParams = [
      userId,
      title.trim(),
      content.trim(),
      category,
      parseFloat(carbon_saved) || 0
    ];
    
    const result = await executeQueryWithLogging(pool, insertQuery, insertParams);
    const newStory = result.rows[0];
    
    // Добавляем информацию о пользователе
    newStory.user_nickname = userCheck.rows[0].nickname;
    newStory.user_avatar = 'plant';
    newStory.is_liked = false;
    newStory.likes_count = 0;
    
    res.json({
      success: true,
      message: 'История успешно создана и отправлена на проверку',
      story: newStory
    });
  } catch (error) {
    console.error('Ошибка при создании истории:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// Удалить мою историю
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const storyId = validateStoryId(id);
    const validUserId = validateUserId(userId);
    
    if (!storyId) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STORY_ID',
        message: 'Недопустимый ID истории'
      });
    }
    
    if (!validUserId) {
      return res.status(400).json({
        success: false,
        error: 'USER_ID_REQUIRED',
        message: 'Требуется ID пользователя'
      });
    }
    
    // Проверяем, существует ли история и принадлежит ли пользователю
    const storyCheck = await executeQueryWithLogging(pool,
      'SELECT id, user_id FROM success_stories WHERE id = $1',
      [storyId]
    );
    
    if (storyCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'STORY_NOT_FOUND',
        message: 'История не найдена'
      });
    }
    
    // Проверяем, что история принадлежит пользователю
    if (storyCheck.rows[0].user_id !== validUserId) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Вы можете удалять только свои истории'
      });
    }
    
    // Удаляем лайки истории
    await executeQueryWithLogging(pool,
      'DELETE FROM story_likes WHERE story_id = $1',
      [storyId]
    );
    
    // Удаляем историю
    await executeQueryWithLogging(pool,
      'DELETE FROM success_stories WHERE id = $1',
      [storyId]
    );
    
    // Отправляем событие через WebSocket об удалении истории
    const io = req.app.get('io');
    if (io) {
      broadcast(io, 'story:deleted', {
        storyId: storyId,
        userId: validUserId
      });
    }
    
    res.json({
      success: true,
      message: 'История успешно удалена'
    });
  } catch (error) {
    console.error('Ошибка при удалении истории:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// ==================== АДМИНСКИЕ ЭНДПОЙНТЫ ДЛЯ УПРАВЛЕНИЯ ИСТОРИЯМИ ====================

// Статистика историй для админов
router.get('/admin/stats', authenticateTokenWithDB, isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft
      FROM success_stories
    `;
    
    const result = await executeQueryWithLogging(pool, query);
    
    res.json({
      success: true,
      ...result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка при получении статистики историй:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// Статистика по категориям для админов
router.get('/admin/category-stats', authenticateTokenWithDB, isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        category,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM success_stories
      GROUP BY category
      ORDER BY count DESC
    `;
    
    const result = await executeQueryWithLogging(pool, query);
    
    res.json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    console.error('Ошибка при получении статистики по категориям:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// Получить истории для админ-панели с фильтрацией
router.get('/admin', authenticateTokenWithDB, isAdmin, async (req, res) => {
  try {
    const { 
      status = 'all',
      category = 'all',
      search = '',
      page = 1,
      limit = 10
    } = req.query;
    
    // Валидация параметров
    const validStatuses = ['all', 'published', 'pending', 'draft'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Недопустимый статус'
      });
    }
    
    const pagination = validatePagination(page, limit);
    
    // Базовый запрос для админа (видит все статусы)
    let query = `
      SELECT 
        s.id,
        s.title,
        s.content,
        s.carbon_saved,
        s.likes_count,
        s.created_at,
        s.category,
        s.status,
        u.id as user_id,
        u.nickname as user_nickname,
        u.email as user_email,
        u.avatar_emoji as user_avatar_emoji,
        u.is_admin as user_is_admin
      FROM success_stories s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total
      FROM success_stories s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    
    let queryParams = [];
    let countParams = [];
    let paramIndex = 1;
    
    // Фильтр по статусу
    if (status !== 'all') {
      query += ` AND s.status = $${paramIndex}`;
      countQuery += ` AND s.status = $${paramIndex}`;
      queryParams.push(status);
      countParams.push(status);
      paramIndex++;
    }
    
    // Фильтр по категории
    if (category !== 'all') {
      query += ` AND s.category = $${paramIndex}`;
      countQuery += ` AND s.category = $${paramIndex}`;
      queryParams.push(category);
      countParams.push(category);
      paramIndex++;
    }
    
    // Поиск по заголовку или автору
    if (search) {
      query += ` AND (s.title ILIKE $${paramIndex} OR u.nickname ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      countQuery += ` AND (s.title ILIKE $${paramIndex} OR u.nickname ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      countParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // Сортировка (сначала ожидающие модерации, потом новые)
    if (status === 'pending') {
      query += ' ORDER BY s.created_at ASC'; // старые pending первыми
    } else {
      query += ' ORDER BY s.created_at DESC'; // новые первыми
    }
    
    // Пагинация
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(pagination.limit, pagination.offset);
    
    // Выполняем запросы
    const result = await executeQueryWithLogging(pool, query, queryParams);
    const countResult = await executeQueryWithLogging(pool, countQuery, countParams);
    
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      success: true,
      stories: result.rows,
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
    console.error('Ошибка при получении историй для админа:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// Опубликовать историю (админ меняет статус с pending на published)
router.post('/admin/:id/publish', authenticateTokenWithDB, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = validateStoryId(id);
    
    if (!storyId) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STORY_ID',
        message: 'Недопустимый ID истории'
      });
    }
    
    // Проверяем текущий статус истории
    const currentCheck = await executeQueryWithLogging(pool,
      'SELECT status, user_id FROM success_stories WHERE id = $1',
      [storyId]
    );
    
    if (currentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'STORY_NOT_FOUND',
        message: 'История не найдена'
      });
    }
    
    const currentStatus = currentCheck.rows[0].status;
    const authorId = currentCheck.rows[0].user_id;
    
    // Если история уже опубликована
    if (currentStatus === 'published') {
      return res.status(400).json({
        success: false,
        error: 'ALREADY_PUBLISHED',
        message: 'История уже опубликована'
      });
    }
    
    // Обновляем статус истории на 'published'
    const updateQuery = `
      UPDATE success_stories 
      SET status = 'published', 
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await executeQueryWithLogging(pool, updateQuery, [storyId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'STORY_NOT_FOUND',
        message: 'История не найдена'
      });
    }
    
    // Отправляем уведомление автору через WebSocket
    const io = req.app.get('io');
    if (io) {
      sendToUser(io, authorId, 'notification:story', {
        type: 'story_published',
        storyId: storyId,
        storyTitle: result.rows[0].title,
        timestamp: new Date()
      });
      
      console.log(`📢 Уведомление об опубликовании отправлено автору (userId: ${authorId})`);
    }
    
    // Также отправляем broadcast для обновления списков историй
    if (io) {
      broadcast(io, 'story:published', {
        storyId: storyId,
        story: result.rows[0]
      });
    }
    
    res.json({
      success: true,
      message: 'История успешно опубликована',
      story: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка при публикации истории:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// Отклонить/снять с публикации историю
router.post('/admin/:id/reject', authenticateTokenWithDB, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const storyId = validateStoryId(id);
    
    if (!storyId) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STORY_ID',
        message: 'Недопустимый ID истории'
      });
    }
    
    // Получаем текущий статус истории и информацию об авторе
    const currentQuery = await executeQueryWithLogging(pool,
      'SELECT status, user_id, title FROM success_stories WHERE id = $1',
      [storyId]
    );
    
    if (currentQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'STORY_NOT_FOUND',
        message: 'История не найдена'
      });
    }
    
    const currentStatus = currentQuery.rows[0].status;
    const authorId = currentQuery.rows[0].user_id;
    const storyTitle = currentQuery.rows[0].title;
    let newStatus;
    let actionMessage;
    let notificationType;
    
    if (currentStatus === 'published') {
      newStatus = 'draft';
      actionMessage = 'История снята с публикации';
      notificationType = 'story_unpublished';
    } else {
      newStatus = 'draft';
      actionMessage = 'История отклонена';
      notificationType = 'story_rejected';
    }
    
    // Обновляем статус истории
    const updateQuery = `
      UPDATE success_stories 
      SET status = $1, 
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await executeQueryWithLogging(pool, updateQuery, [newStatus, storyId]);
    
    // Отправляем уведомление автору через WebSocket
    const io = req.app.get('io');
    if (io) {
      sendToUser(io, authorId, 'notification:story', {
        type: notificationType,
        storyId: storyId,
        storyTitle: storyTitle,
        reason: reason || 'Администратор отклонил вашу историю',
        timestamp: new Date()
      });
      
      console.log(`📢 Уведомление об отклонении отправлено автору (userId: ${authorId})`);
    }
    
    // Если снимаем с публикации, отправляем broadcast для удаления из списков
    if (currentStatus === 'published' && io) {
      broadcast(io, 'story:unpublished', {
        storyId: storyId
      });
    }
    
    res.json({
      success: true,
      message: actionMessage,
      story: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка при отклонении истории:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// Снять историю с публикации (перевести в черновики)
router.post('/admin/:id/unpublish', authenticateTokenWithDB, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const storyId = validateStoryId(id);
    
    if (!storyId) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STORY_ID',
        message: 'Недопустимый ID истории'
      });
    }
    
    // Получаем текущий статус истории и информацию об авторе
    const currentQuery = await executeQueryWithLogging(pool,
      'SELECT status, user_id, title FROM success_stories WHERE id = $1',
      [storyId]
    );
    
    if (currentQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'STORY_NOT_FOUND',
        message: 'История не найдена'
      });
    }
    
    const currentStatus = currentQuery.rows[0].status;
    const authorId = currentQuery.rows[0].user_id;
    const storyTitle = currentQuery.rows[0].title;
    
    // Проверяем, что история опубликована
    if (currentStatus !== 'published') {
      return res.status(400).json({
        success: false,
        error: 'STORY_NOT_PUBLISHED',
        message: 'История не опубликована'
      });
    }
    
    // Переводим историю в черновики
    const updateQuery = `
      UPDATE success_stories 
      SET status = 'draft', 
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await executeQueryWithLogging(pool, updateQuery, [storyId]);
    
    // Отправляем уведомление автору через WebSocket
    const io = req.app.get('io');
    if (io) {
      sendToUser(io, authorId, 'notification:story', {
        type: 'story_unpublished',
        storyId: storyId,
        storyTitle: storyTitle,
        reason: reason || 'Администратор снял вашу историю с публикации',
        timestamp: new Date()
      });
      
      console.log(`📢 Уведомление о снятии с публикации отправлено автору (userId: ${authorId})`);
    }
    
    // Отправляем broadcast для удаления из списков
    if (io) {
      broadcast(io, 'story:unpublished', {
        storyId: storyId
      });
    }
    
    res.json({
      success: true,
      message: 'История снята с публикации и перемещена в черновики',
      story: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка при снятии истории с публикации:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// Получить детали конкретной истории для админа
router.get('/admin/:id', authenticateTokenWithDB, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const storyId = validateStoryId(id);
    
    if (!storyId) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STORY_ID',
        message: 'Недопустимый ID истории'
      });
    }
    
    const query = `
      SELECT 
        s.*,
        u.id as user_id,
        u.nickname as user_nickname,
        u.email as user_email,
        u.avatar_emoji as user_avatar_emoji,
        u.created_at as user_created_at,
        u.carbon_saved,
        u.is_admin as user_is_admin
      FROM success_stories s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `;
    
    const result = await executeQueryWithLogging(pool, query, [storyId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'STORY_NOT_FOUND',
        message: 'История не найдена'
      });
    }
    
    res.json({
      success: true,
      story: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка при получении истории для админа:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

module.exports = router;