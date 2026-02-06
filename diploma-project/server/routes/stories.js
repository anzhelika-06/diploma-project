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

// Функция для отслеживания событий достижений
const trackAchievementEvent = async (client, userId, eventType, eventData = {}) => {
  try {
    console.log(`📊 Отслеживание события достижения: ${eventType} для пользователя ${userId}`);
    
    // Фильтруем достижения по типу события
    let achievementsQuery;
    let queryParams;
    
    // Для достижения "like_own_story" нужен специальный фильтр
    if (eventType === 'like_own_story') {
      achievementsQuery = `
        SELECT id, code, points, requirement_type, requirement_value 
        FROM achievements 
        WHERE code = $1 
        AND is_active = true
      `;
      queryParams = ['like_own_story'];
    } else {
      achievementsQuery = `
        SELECT id, code, points, requirement_type, requirement_value 
        FROM achievements 
        WHERE event_type = $1 
        AND is_active = true
        AND code != 'like_own_story' 
      `;
      queryParams = [eventType];
    }
    
    const achievementsResult = await client.query(achievementsQuery, queryParams);
    
    if (achievementsResult.rows.length === 0) {
      console.log(`ℹ️ Нет достижений для события: ${eventType}`);
      return;
    }
    
    const unlockedAchievements = [];
    
    // Проверяем каждое достижение
    for (const achievement of achievementsResult.rows) {
      // Проверяем, не получено ли уже это достижение
      const existingQuery = `
        SELECT id, progress, current_value, completed 
        FROM user_achievements 
        WHERE user_id = $1 AND achievement_id = $2
      `;
      
      const existingResult = await client.query(existingQuery, [userId, achievement.id]);
      
      if (existingResult.rows.length > 0) {
        const userAchievement = existingResult.rows[0];
        
        if (userAchievement.completed) {
          continue; // Достижение уже получено
        }
        
        // Обновляем прогресс
        let newProgress = userAchievement.progress + 1;
        let newCurrentValue = eventData.value || newProgress;
        
        if (achievement.requirement_type === 'streak') {
          newCurrentValue = eventData.streak || newCurrentValue;
        } else if (achievement.requirement_type === 'value') {
          newCurrentValue = eventData.value || eventData.likesCount || newCurrentValue;
        }
        
        // Проверяем, выполнены ли условия
        const isCompleted = newCurrentValue >= achievement.requirement_value;
        
        const updateQuery = `
          UPDATE user_achievements 
          SET progress = $1, 
              current_value = $2,
              completed = $3,
              completed_at = CASE WHEN $3 = true AND completed_at IS NULL THEN NOW() ELSE completed_at END,
              metadata = jsonb_set(COALESCE(metadata, '{}'), '{event_data}', $4),
              updated_at = NOW()
          WHERE id = $5
          RETURNING *
        `;
        
        const updateResult = await client.query(updateQuery, [
          newProgress,
          newCurrentValue,
          isCompleted,
          JSON.stringify(eventData),
          userAchievement.id
        ]);
        
        if (isCompleted) {
          unlockedAchievements.push({
            id: achievement.id,
            code: achievement.code,
            name: achievement.name,
            points: achievement.points
          });
        }
      } else {
        // Создаем новую запись о достижении
        let initialProgress = 1;
        let initialCurrentValue = 1;
        
        if (achievement.requirement_type === 'streak') {
          initialCurrentValue = eventData.streak || 1;
        } else if (achievement.requirement_type === 'value') {
          initialCurrentValue = eventData.value || eventData.likesCount || 1;
        }
        
        const isCompleted = initialCurrentValue >= achievement.requirement_value;
        
        const insertQuery = `
          INSERT INTO user_achievements (
            user_id, 
            achievement_id, 
            progress, 
            current_value, 
            completed, 
            completed_at,
            metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        
        await client.query(insertQuery, [
          userId,
          achievement.id,
          initialProgress,
          initialCurrentValue,
          isCompleted,
          isCompleted ? new Date() : null,
          JSON.stringify(eventData)
        ]);
        
        if (isCompleted) {
          unlockedAchievements.push({
            id: achievement.id,
            code: achievement.code,
            name: achievement.name,
            points: achievement.points
          });
        }
      }
    }
    
    if (unlockedAchievements.length > 0) {
      console.log(`🏆 Разблокировано достижений: ${unlockedAchievements.length}`);
      for (const achievement of unlockedAchievements) {
        console.log(`   - ${achievement.code} (+${achievement.points} экоинов)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка при обработке достижения:', error);
    // Не прерываем основной процесс из-за ошибки достижений
  }
};

// Получить все истории с фильтрацией и пагинацией
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
        ${validUserId ? 
          `EXISTS(SELECT 1 FROM story_likes sl WHERE sl.story_id = s.id AND sl.user_id = $1) as is_liked` :
          'false as is_liked'
        }
      FROM success_stories s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'published'
    `;
    
    let whereConditions = [];
    let queryParams = validUserId ? [validUserId] : [];
    
    if (category !== 'all') {
      whereConditions.push(`s.category = $${queryParams.length + 1}`);
      queryParams.push(category);
    }
    
    if (filter === 'recent') {
      whereConditions.push("s.created_at > NOW() - INTERVAL '30 days'");
    }
    
    if (whereConditions.length > 0) {
      query += ' AND ' + whereConditions.join(' AND ');
    }
    
    let orderBy;
    switch (filter) {
      case 'best':
        orderBy = 'ORDER BY s.likes_count DESC, s.created_at DESC';
        break;
      case 'recent':
        orderBy = 'ORDER BY s.created_at DESC';
        break;
      default:
        orderBy = 'ORDER BY s.created_at DESC';
        break;
    }
    
    query += ` ${orderBy} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(pagination.limit, pagination.offset);
    
    console.log('🔍 SQL Query:', query);
    console.log('🔍 Query Params:', queryParams);
    const result = await executeQueryWithLogging(pool, query, queryParams);
    
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

// Получить все доступные категории
router.get('/categories', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT category, COUNT(*) as count
      FROM success_stories 
      WHERE status = 'published'
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

// Лайкнуть/убрать лайк истории
router.post('/:id/like', likeLimiter, async (req, res) => {
  let client;
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
    
    client = await pool.connect();
    await client.query('BEGIN');
    
    try {
      const storyCheck = await client.query(
        'SELECT id, status, user_id, likes_count FROM success_stories WHERE id = $1',
        [storyId]
      );
      
      if (storyCheck.rows.length === 0) {
        throw new Error('STORY_NOT_FOUND');
      }
      
      if (storyCheck.rows[0].status !== 'published') {
        throw new Error('STORY_NOT_PUBLISHED');
      }
      
      const authorId = storyCheck.rows[0].user_id;
      const currentLikes = storyCheck.rows[0].likes_count;
      const isOwnStory = authorId === validUserId;
      
      const userCheck = await client.query(
        'SELECT id FROM users WHERE id = $1',
        [validUserId]
      );
      
      if (userCheck.rows.length === 0) {
        throw new Error('USER_NOT_FOUND');
      }
      
      const existingLike = await client.query(
        'SELECT id FROM story_likes WHERE story_id = $1 AND user_id = $2',
        [storyId, validUserId]
      );
      
      let newLikesCount;
      let isLiked;
      
      if (existingLike.rows.length > 0) {
        // Убираем лайк
        await client.query(
          'DELETE FROM story_likes WHERE story_id = $1 AND user_id = $2',
          [storyId, validUserId]
        );
        
        const result = await client.query(
          'UPDATE success_stories SET likes_count = likes_count - 1 WHERE id = $1 RETURNING likes_count',
          [storyId]
        );
        
        newLikesCount = result.rows[0].likes_count;
        isLiked = false;
        
        // Отслеживаем снятие лайка только для чужих историй
        if (!isOwnStory) {
          await trackAchievementEvent(client, validUserId, 'story_unliked', {
            storyId: storyId,
            previousLikes: currentLikes,
            newLikes: newLikesCount,
            authorId: authorId
          });
        }
      } else {
        // Добавляем лайк
        await client.query(
          'INSERT INTO story_likes (story_id, user_id) VALUES ($1, $2)',
          [storyId, validUserId]
        );
        
        const result = await client.query(
          'UPDATE success_stories SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count',
          [storyId]
        );
        
        newLikesCount = result.rows[0].likes_count;
        isLiked = true;
        
        // Отслеживаем лайк для того, кто поставил лайк
        if (isOwnStory) {
          // Специальное достижение для лайка своей собственной истории
          await trackAchievementEvent(client, validUserId, 'like_own_story', {
            storyId: storyId,
            previousLikes: currentLikes,
            newLikes: newLikesCount,
            isOwnStory: true
          });
        } else {
          // Если лайк чужой истории
          await trackAchievementEvent(client, validUserId, 'story_liked', {
            storyId: storyId,
            previousLikes: currentLikes,
            newLikes: newLikesCount,
            authorId: authorId,
            isOwnStory: false
          });
          
          // Если лайк поставили чужой истории, отслеживаем для автора
          // Отслеживаем получение лайка
          await trackAchievementEvent(client, authorId, 'story_received_like', {
            storyId: storyId,
            likesCount: newLikesCount,
            likedByUserId: validUserId
          });
          
          // Отслеживаем достижения по количеству лайков для автора
          if (newLikesCount >= 5) {
            await trackAchievementEvent(client, authorId, 'story_popular_5', {
              storyId: storyId,
              likesCount: newLikesCount,
              milestone: '5_likes'
            });
          }
          
          if (newLikesCount >= 10) {
            await trackAchievementEvent(client, authorId, 'story_popular_10', {
              storyId: storyId,
              likesCount: newLikesCount,
              milestone: '10_likes'
            });
          }
          
          if (newLikesCount >= 25) {
            await trackAchievementEvent(client, authorId, 'story_popular_25', {
              storyId: storyId,
              likesCount: newLikesCount,
              milestone: '25_likes'
            });
          }
        }
      }
      
      // Отправляем событие через WebSocket
      const io = req.app.get('io');
      if (io) {
        broadcast(io, 'story:like:update', {
          storyId: storyId,
          likes: newLikesCount,
          userId: validUserId
        });
        
        // Отправляем уведомление автору, только если это не его собственный лайк
        if (!isOwnStory && isLiked) {
          sendToUser(io, authorId, 'notification:like', {
            type: 'story_like',
            storyId: storyId,
            likedByUserId: validUserId,
            newLikesCount: newLikesCount,
            timestamp: new Date()
          });
          
          console.log(`💚 Персональное уведомление о лайке отправлено автору (userId: ${authorId})`);
        }
        
        console.log(`📡 WebSocket: отправлено обновление лайка для истории ${storyId}`);
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        likes: newLikesCount,
        isLiked: isLiked,
        isOwnStory: isOwnStory // Добавляем информацию о том, чья это история
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при лайке истории:', error);
    
    let statusCode = 500;
    let errorMessage = 'SERVER_ERROR';
    
    switch (error.message) {
      case 'STORY_NOT_FOUND':
        statusCode = 404;
        errorMessage = 'STORY_NOT_FOUND';
        break;
      case 'STORY_NOT_PUBLISHED':
        statusCode = 403;
        errorMessage = 'STORY_NOT_PUBLISHED';
        break;
      case 'USER_NOT_FOUND':
        statusCode = 404;
        errorMessage = 'USER_NOT_FOUND';
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

// Получить мои истории с фильтрацией по статусу
router.get('/my', async (req, res) => {
  try {
    const { 
      userId,
      status = 'all',
      category = 'all',
      page = 1,
      limit = 10
    } = req.query;
    
    if (!validateUserId(userId)) {
      return res.status(400).json({
        success: false,
        error: 'USER_ID_REQUIRED',
        message: 'Требуется ID пользователя'
      });
    }
    
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
    
    if (status !== 'all') {
      query += ` AND s.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    if (category !== 'all') {
      query += ` AND s.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }
    
    query += ' ORDER BY s.created_at DESC';
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(pagination.limit, pagination.offset);
    
    console.log('🔍 SQL Query (my stories):', query);
    console.log('🔍 Query Params:', queryParams);
    
    const result = await executeQueryWithLogging(pool, query, queryParams);
    
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

// Создать новую историю
router.post('/', async (req, res) => {
  let client;
  try {
    const { userId, title, content, category, carbon_saved = 0 } = req.body;
    
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
    
    client = await pool.connect();
    await client.query('BEGIN');
    
    try {
      const userCheck = await client.query(
        'SELECT id, nickname FROM users WHERE id = $1',
        [userId]
      );
      
      if (userCheck.rows.length === 0) {
        throw new Error('USER_NOT_FOUND');
      }
      
      // Получаем количество существующих историй пользователя
      const storiesCountResult = await client.query(
        'SELECT COUNT(*) as count FROM success_stories WHERE user_id = $1',
        [userId]
      );
      const existingStoriesCount = parseInt(storiesCountResult.rows[0].count);
      
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
      
      const result = await client.query(insertQuery, insertParams);
      const newStory = result.rows[0];
      
      // Отслеживаем создание истории
      await trackAchievementEvent(client, userId, 'story_created', {
        storyId: newStory.id,
        title: newStory.title,
        category: newStory.category,
        carbonSaved: newStory.carbon_saved,
        contentLength: content.length,
        wordCount: content.split(' ').length,
        totalStories: existingStoriesCount + 1,
        status: 'pending'
      });
      
      // Если это первая история пользователя
      if (existingStoriesCount === 0) {
        await trackAchievementEvent(client, userId, 'first_story', {
          storyId: newStory.id,
          title: newStory.title,
          category: newStory.category
        });
      }
      
      // Если история на экологическую тему
      if (category.toLowerCase().includes('eco') || 
          category.toLowerCase().includes('ecology') ||
          category.toLowerCase().includes('environment')) {
        // Специальное достижение для экологической темы
        await trackAchievementEvent(client, userId, 'ecology_story_created', {
          storyId: newStory.id,
          category: newStory.category,
          title: newStory.title
        });
      }
      
      // Добавляем информацию о пользователе
      newStory.user_nickname = userCheck.rows[0].nickname;
      newStory.user_avatar = 'plant';
      newStory.is_liked = false;
      newStory.likes_count = 0;
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'История успешно создана и отправлена на проверку',
        story: newStory
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при создании истории:', error);
    
    let statusCode = 500;
    let errorMessage = 'SERVER_ERROR';
    
    switch (error.message) {
      case 'USER_NOT_FOUND':
        statusCode = 404;
        errorMessage = 'USER_NOT_FOUND';
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

// Удалить мою историю
router.delete('/:id', async (req, res) => {
  let client;
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
    
    client = await pool.connect();
    await client.query('BEGIN');
    
    try {
      const storyCheck = await client.query(
        'SELECT id, user_id, title FROM success_stories WHERE id = $1',
        [storyId]
      );
      
      if (storyCheck.rows.length === 0) {
        throw new Error('STORY_NOT_FOUND');
      }
      
      if (storyCheck.rows[0].user_id !== validUserId) {
        throw new Error('FORBIDDEN');
      }
      
      // Отслеживаем удаление истории
      await trackAchievementEvent(client, validUserId, 'story_deleted', {
        storyId: storyId,
        storyTitle: storyCheck.rows[0].title
      });
      
      await client.query(
        'DELETE FROM story_likes WHERE story_id = $1',
        [storyId]
      );
      
      await client.query(
        'DELETE FROM success_stories WHERE id = $1',
        [storyId]
      );
      
      // Отправляем событие через WebSocket
      const io = req.app.get('io');
      if (io) {
        broadcast(io, 'story:deleted', {
          storyId: storyId,
          userId: validUserId
        });
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'История успешно удалена'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при удалении истории:', error);
    
    let statusCode = 500;
    let errorMessage = 'SERVER_ERROR';
    
    switch (error.message) {
      case 'STORY_NOT_FOUND':
        statusCode = 404;
        errorMessage = 'STORY_NOT_FOUND';
        break;
      case 'FORBIDDEN':
        statusCode = 403;
        errorMessage = 'FORBIDDEN';
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

// ==================== АДМИНСКИЕ ЭНДПОЙНТЫ ====================
router.get('/admin/category-stats', async (req, res) => {
  try {
    console.log('📊 Запрос статистики по категориям для админа');
    
    // Уберите валидацию storyId, так как она не нужна для общей статистики
    const query = `
      SELECT 
        COALESCE(NULLIF(TRIM(category), ''), 'Не указана') as category,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
        COALESCE(SUM(likes_count), 0) as total_likes,
        COALESCE(SUM(carbon_saved), 0) as total_carbon_saved
      FROM success_stories
      GROUP BY COALESCE(NULLIF(TRIM(category), ''), 'Не указана')
      ORDER BY count DESC, category
    `;
    
    console.log('🔍 SQL запрос категорий:', query);
    const result = await executeQueryWithLogging(pool, query);
    
    console.log('✅ Статистика по категориям получена:', result.rows.length, 'категорий');
    
    // Форматируем ответ
    const formattedCategories = result.rows.map(row => ({
      category: row.category,
      count: parseInt(row.count) || 0,
      published: parseInt(row.published_count) || 0,
      pending: parseInt(row.pending_count) || 0,
      draft: parseInt(row.draft_count) || 0,
      total_likes: parseInt(row.total_likes) || 0,
      total_carbon_saved: parseFloat(row.total_carbon_saved) || 0
    }));
    
    res.json({
      success: true,
      categories: formattedCategories
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении статистики по категориям:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});
router.get('/admin/stats', async (req, res) => {
  try {
    console.log('📊 Запрос общей статистики для админа');
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_stories,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_stories,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_stories,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_stories,
        COALESCE(SUM(likes_count), 0) as total_likes,
        COALESCE(SUM(carbon_saved), 0) as total_carbon_saved
      FROM success_stories
    `;
    
    const statsResult = await executeQueryWithLogging(pool, statsQuery);
    
    // Статистика по категориям (упрощенная версия)
    const categoriesQuery = `
      SELECT 
        COALESCE(NULLIF(TRIM(category), ''), 'Не указана') as category,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count
      FROM success_stories
      GROUP BY COALESCE(NULLIF(TRIM(category), ''), 'Не указана')
      ORDER BY count DESC
    `;
    
    const categoriesResult = await executeQueryWithLogging(pool, categoriesQuery);
    
    console.log('✅ Общая статистика получена:', statsResult.rows[0]);
    
    const statsData = statsResult.rows[0] || {};
    
    res.json({
      success: true,
      stats: {
        total_stories: parseInt(statsData.total_stories) || 0,
        published_stories: parseInt(statsData.published_stories) || 0,
        pending_stories: parseInt(statsData.pending_stories) || 0,
        draft_stories: parseInt(statsData.draft_stories) || 0,
        total_likes: parseInt(statsData.total_likes) || 0,
        total_carbon_saved: parseFloat(statsData.total_carbon_saved) || 0
      },
      categories: categoriesResult.rows.map(row => ({
        category: row.category,
        count: parseInt(row.count) || 0,
        published_count: parseInt(row.published_count) || 0
      }))
    });
  } catch (error) {
    console.error('❌ Ошибка при получении статистики:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});
router.get('/admin', async (req, res) => {
  try {
    const { 
      status = 'all',
      category = 'all',
      page = 1,
      limit = 10,
      search = ''
    } = req.query;
    
    console.log('📊 Запрос историй для админа:', { status, category, page, limit, search });
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    
    let query = `
      SELECT 
        s.id,
        s.title,
        s.content,
        s.carbon_saved,
        s.likes_count,
        s.created_at,
        s.updated_at,
        s.category,
        s.status,
        u.id as user_id,
        u.nickname as user_nickname,
        u.email as user_email,
        u.avatar_emoji as user_avatar
      FROM success_stories s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    
    let queryParams = [];
    let paramIndex = 1;
    
    if (status !== 'all') {
      query += ` AND s.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    if (category !== 'all') {
      query += ` AND COALESCE(NULLIF(TRIM(s.category), ''), 'Не указана') = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }
    
    if (search && search.trim()) {
      query += ` AND (
        s.title ILIKE $${paramIndex} 
        OR s.content ILIKE $${paramIndex} 
        OR u.nickname ILIKE $${paramIndex}
        OR u.email ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }
    
    query += ' ORDER BY s.created_at DESC';
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limitNum, offset);
    
    console.log('🔍 SQL Query (admin):', query);
    console.log('🔍 Query Params:', queryParams);
    
    const result = await executeQueryWithLogging(pool, query, queryParams);
    
    // Получаем общее количество
    let countQuery = `
      SELECT COUNT(*) as total
      FROM success_stories s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    
    let countParams = [];
    paramIndex = 1;
    
    if (status !== 'all') {
      countQuery += ` AND s.status = $${paramIndex}`;
      countParams.push(status);
      paramIndex++;
    }
    
    if (category !== 'all') {
      countQuery += ` AND COALESCE(NULLIF(TRIM(s.category), ''), 'Не указана') = $${paramIndex}`;
      countParams.push(category);
      paramIndex++;
    }
    
    if (search && search.trim()) {
      countQuery += ` AND (
        s.title ILIKE $${paramIndex} 
        OR s.content ILIKE $${paramIndex} 
        OR u.nickname ILIKE $${paramIndex}
        OR u.email ILIKE $${paramIndex}
      )`;
      countParams.push(`%${search.trim()}%`);
    }
    
    const countResult = await executeQueryWithLogging(pool, countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total) || 0;
    
    // Форматируем ответ
    const formattedStories = result.rows.map(story => ({
      ...story,
      id: story.id.toString(),
      user_id: story.user_id.toString(),
      carbon_saved: parseFloat(story.carbon_saved) || 0,
      likes_count: parseInt(story.likes_count) || 0,
      category: story.category || 'Не указана'
    }));
    
    console.log('✅ Историй найдено:', total, 'Показано:', formattedStories.length);
    
    res.json({
      success: true,
      stories: formattedStories,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: offset + limitNum < total,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('❌ Ошибка при получении историй для админа:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});
// Получить все истории для админа (с пагинацией и фильтрацией)
router.get('/admin/all', async (req, res) => {
  try {
    const { 
      status = 'all',
      category = 'all',
      page = 1,
      limit = 10,
      search = ''
    } = req.query;
    
    const pagination = validatePagination(page, limit);
    
    let query = `
      SELECT 
        s.id,
        s.title,
        s.content,
        s.carbon_saved,
        s.likes_count,
        s.created_at,
        s.updated_at,
        s.category,
        s.status,
        u.id as user_id,
        u.nickname as user_nickname,
        u.email as user_email,
        u.avatar_emoji as user_avatar,
        u.is_admin as user_is_admin
      FROM success_stories s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    
    let queryParams = [];
    let paramIndex = 1;
    
    if (status !== 'all') {
      query += ` AND s.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    if (category !== 'all') {
      query += ` AND s.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }
    
    if (search && search.trim()) {
      query += ` AND (s.title ILIKE $${paramIndex} OR s.content ILIKE $${paramIndex} OR u.nickname ILIKE $${paramIndex})`;
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }
    
    query += ' ORDER BY s.created_at DESC';
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(pagination.limit, pagination.offset);
    
    console.log('🔍 SQL Query (admin all):', query);
    console.log('🔍 Query Params:', queryParams);
    
    const result = await executeQueryWithLogging(pool, query, queryParams);
    
    // Получаем общее количество
    let countQuery = `
      SELECT COUNT(*) as total
      FROM success_stories s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    
    let countParams = [];
    paramIndex = 1;
    
    if (status !== 'all') {
      countQuery += ` AND s.status = $${paramIndex}`;
      countParams.push(status);
      paramIndex++;
    }
    
    if (category !== 'all') {
      countQuery += ` AND s.category = $${paramIndex}`;
      countParams.push(category);
      paramIndex++;
    }
    
    if (search && search.trim()) {
      countQuery += ` AND (s.title ILIKE $${paramIndex} OR s.content ILIKE $${paramIndex} OR u.nickname ILIKE $${paramIndex})`;
      countParams.push(`%${search.trim()}%`);
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
    console.error('Ошибка при получении историй для админа:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});


// Получить детали конкретной истории для админа
router.get('/admin/:id', async (req, res) => {
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
        u.avatar_emoji as user_avatar,
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
    
    // Получаем информацию о лайках
    const likesQuery = `
      SELECT 
        sl.user_id,
        u.nickname,
        u.avatar_emoji,
        sl.created_at
      FROM story_likes sl
      JOIN users u ON sl.user_id = u.id
      WHERE sl.story_id = $1
      ORDER BY sl.created_at DESC
      LIMIT 10
    `;
    
    const likesResult = await executeQueryWithLogging(pool, likesQuery, [storyId]);
    
    res.json({
      success: true,
      story: result.rows[0],
      likes: likesResult.rows
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

// Опубликовать историю (админ)
router.post('/admin/:id/publish', async (req, res) => {
  let client;
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
    
    client = await pool.connect();
    await client.query('BEGIN');
    
    try {
      const currentCheck = await client.query(
        'SELECT status, user_id, title FROM success_stories WHERE id = $1',
        [storyId]
      );
      
      if (currentCheck.rows.length === 0) {
        throw new Error('STORY_NOT_FOUND');
      }
      
      const currentStatus = currentCheck.rows[0].status;
      const authorId = currentCheck.rows[0].user_id;
      const storyTitle = currentCheck.rows[0].title;
      
      if (currentStatus === 'published') {
        throw new Error('ALREADY_PUBLISHED');
      }
      
      const updateQuery = `
        UPDATE success_stories 
        SET status = 'published', 
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [storyId]);
      
      if (result.rows.length === 0) {
        throw new Error('STORY_NOT_FOUND');
      }
      
      const io = req.app.get('io');
      if (io) {
        broadcast(io, 'story:published', {
          storyId: storyId,
          story: result.rows[0]
        });
        
        console.log(`📡 WebSocket: уведомление о публикации истории ${storyId}`);
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'История успешно опубликована',
        story: result.rows[0]
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при публикации истории:', error);
    
    let statusCode = 500;
    let errorMessage = 'SERVER_ERROR';
    
    switch (error.message) {
      case 'STORY_NOT_FOUND':
        statusCode = 404;
        errorMessage = 'STORY_NOT_FOUND';
        break;
      case 'ALREADY_PUBLISHED':
        statusCode = 400;
        errorMessage = 'ALREADY_PUBLISHED';
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

// Отклонить/снять с публикации историю (админ)
router.post('/admin/:id/reject', async (req, res) => {
  let client;
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
    
    client = await pool.connect();
    await client.query('BEGIN');
    
    try {
      const currentQuery = await client.query(
        'SELECT status, user_id, title FROM success_stories WHERE id = $1',
        [storyId]
      );
      
      if (currentQuery.rows.length === 0) {
        throw new Error('STORY_NOT_FOUND');
      }
      
      const currentStatus = currentQuery.rows[0].status;
      const authorId = currentQuery.rows[0].user_id;
      const storyTitle = currentQuery.rows[0].title;
      let newStatus;
      let actionMessage;
      
      if (currentStatus === 'published') {
        newStatus = 'draft';
        actionMessage = 'История снята с публикации';
      } else {
        newStatus = 'draft';
        actionMessage = 'История отклонена';
      }
      
      const updateQuery = `
        UPDATE success_stories 
        SET status = $1, 
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [newStatus, storyId]);
      
      const io = req.app.get('io');
      if (io && currentStatus === 'published') {
        broadcast(io, 'story:unpublished', {
          storyId: storyId
        });
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: actionMessage,
        reason: reason || 'Причина не указана',
        story: result.rows[0]
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при отклонении истории:', error);
    
    let statusCode = 500;
    let errorMessage = 'SERVER_ERROR';
    
    switch (error.message) {
      case 'STORY_NOT_FOUND':
        statusCode = 404;
        errorMessage = 'STORY_NOT_FOUND';
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
// Снять с публикации историю (админ)
router.post('/admin/:id/unpublish', async (req, res) => {
  let client;
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
    
    client = await pool.connect();
    await client.query('BEGIN');
    
    try {
      const currentCheck = await client.query(
        'SELECT status, user_id, title FROM success_stories WHERE id = $1',
        [storyId]
      );
      
      if (currentCheck.rows.length === 0) {
        throw new Error('STORY_NOT_FOUND');
      }
      
      const currentStatus = currentCheck.rows[0].status;
      const authorId = currentCheck.rows[0].user_id;
      const storyTitle = currentCheck.rows[0].title;
      
      if (currentStatus !== 'published') {
        throw new Error('NOT_PUBLISHED');
      }
      
      const updateQuery = `
        UPDATE success_stories 
        SET status = 'draft', 
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [storyId]);
      
      // Отслеживаем событие снятия с публикации
      await trackAchievementEvent(client, authorId, 'story_unpublished', {
        storyId: storyId,
        title: storyTitle,
        previousStatus: 'published',
        newStatus: 'draft'
      });
      
      // Отправляем событие через WebSocket
      const io = req.app.get('io');
      if (io) {
        broadcast(io, 'story:unpublished', {
          storyId: storyId,
          story: result.rows[0]
        });
        
        console.log(`📡 WebSocket: уведомление о снятии с публикации истории ${storyId}`);
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'История успешно снята с публикации',
        reason: reason || 'Снято с публикации администратором',
        story: result.rows[0]
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при снятии с публикации истории:', error);
    
    let statusCode = 500;
    let errorMessage = 'SERVER_ERROR';
    
    switch (error.message) {
      case 'STORY_NOT_FOUND':
        statusCode = 404;
        errorMessage = 'STORY_NOT_FOUND';
        break;
      case 'NOT_PUBLISHED':
        statusCode = 400;
        errorMessage = 'NOT_PUBLISHED';
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
// Удалить историю (админ)
router.delete('/admin/:id', async (req, res) => {
  let client;
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
    
    client = await pool.connect();
    await client.query('BEGIN');
    
    try {
      const storyCheck = await client.query(
        'SELECT id, title FROM success_stories WHERE id = $1',
        [storyId]
      );
      
      if (storyCheck.rows.length === 0) {
        throw new Error('STORY_NOT_FOUND');
      }
      
      await client.query(
        'DELETE FROM story_likes WHERE story_id = $1',
        [storyId]
      );
      
      await client.query(
        'DELETE FROM success_stories WHERE id = $1',
        [storyId]
      );
      
      const io = req.app.get('io');
      if (io) {
        broadcast(io, 'story:deleted', {
          storyId: storyId
        });
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'История успешно удалена'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при удалении истории:', error);
    
    let statusCode = 500;
    let errorMessage = 'SERVER_ERROR';
    
    switch (error.message) {
      case 'STORY_NOT_FOUND':
        statusCode = 404;
        errorMessage = 'STORY_NOT_FOUND';
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



module.exports = router;