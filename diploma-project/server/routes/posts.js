const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/authMiddleware');

// Получить ленту постов (друзья + рекомендации)
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Получаем посты друзей и рекомендованные посты
    const query = `
      WITH my_posts AS (
        SELECT DISTINCT up.*, 
          u.nickname, u.avatar_emoji, u.carbon_saved,
          EXISTS(SELECT 1 FROM post_likes WHERE post_id = up.id AND user_id = $1) as user_liked,
          (SELECT COUNT(*) FROM post_likes WHERE post_id = up.id) as likes_count,
          (SELECT COUNT(*) FROM post_comments WHERE post_id = up.id AND deleted_at IS NULL) as comments_count
        FROM user_posts up
        JOIN users u ON up.user_id = u.id
        WHERE up.deleted_at IS NULL 
          AND u.deleted_at IS NULL
          AND up.user_id = $1
      ),
      friend_posts AS (
        SELECT DISTINCT up.*, 
          u.nickname, u.avatar_emoji, u.carbon_saved,
          EXISTS(SELECT 1 FROM post_likes WHERE post_id = up.id AND user_id = $1) as user_liked,
          (SELECT COUNT(*) FROM post_likes WHERE post_id = up.id) as likes_count,
          (SELECT COUNT(*) FROM post_comments WHERE post_id = up.id AND deleted_at IS NULL) as comments_count
        FROM user_posts up
        JOIN users u ON up.user_id = u.id
        JOIN friendships f ON (
          (f.user_id = $1 AND f.friend_id = up.user_id) OR 
          (f.friend_id = $1 AND f.user_id = up.user_id)
        )
        WHERE up.deleted_at IS NULL 
          AND u.deleted_at IS NULL
          AND f.status = 'accepted'
      ),
      other_posts AS (
        SELECT DISTINCT up.*, 
          u.nickname, u.avatar_emoji, u.carbon_saved,
          EXISTS(SELECT 1 FROM post_likes WHERE post_id = up.id AND user_id = $1) as user_liked,
          (SELECT COUNT(*) FROM post_likes WHERE post_id = up.id) as likes_count,
          (SELECT COUNT(*) FROM post_comments WHERE post_id = up.id AND deleted_at IS NULL) as comments_count
        FROM user_posts up
        JOIN users u ON up.user_id = u.id
        WHERE up.deleted_at IS NULL 
          AND u.deleted_at IS NULL
          AND up.user_id != $1
          AND NOT EXISTS (
            SELECT 1 FROM friendships f 
            WHERE ((f.user_id = $1 AND f.friend_id = up.user_id) OR 
                   (f.friend_id = $1 AND f.user_id = up.user_id))
              AND f.status = 'accepted'
          )
      )
      SELECT *, 1 as priority FROM my_posts
      UNION ALL
      SELECT *, 2 as priority FROM friend_posts
      UNION ALL
      SELECT *, 3 as priority FROM other_posts
      ORDER BY priority ASC, created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [userId, limit, offset]);
    
    // Получаем общее количество
    const countQuery = `
      SELECT COUNT(DISTINCT up.id) as total
      FROM user_posts up
      JOIN users u ON up.user_id = u.id
      WHERE up.deleted_at IS NULL AND u.deleted_at IS NULL
    `;
    const countResult = await db.query(countQuery);
    
    res.json({
      success: true,
      posts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при загрузке ленты'
    });
  }
});

// Получить посты пользователя
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const currentUserId = req.user?.id;
    
    const query = `
      SELECT up.*, 
        u.nickname, u.avatar_emoji, u.carbon_saved,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = up.id AND user_id = $1) as user_liked
      FROM user_posts up
      JOIN users u ON up.user_id = u.id
      WHERE up.user_id = $2 
        AND up.deleted_at IS NULL 
        AND u.deleted_at IS NULL
      ORDER BY up.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    const result = await db.query(query, [currentUserId || null, userId, limit, offset]);
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM user_posts
      WHERE user_id = $1 AND deleted_at IS NULL
    `;
    const countResult = await db.query(countQuery, [userId]);
    
    res.json({
      success: true,
      posts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при загрузке постов пользователя'
    });
  }
});

// Создать пост
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Содержимое поста не может быть пустым'
      });
    }
    
    if (content.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Пост слишком длинный (максимум 5000 символов)'
      });
    }
    
    const query = `
      INSERT INTO user_posts (user_id, content)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const result = await db.query(query, [userId, content.trim()]);
    const post = result.rows[0];
    
    // Получаем информацию о пользователе
    const userQuery = `
      SELECT nickname, avatar_emoji, carbon_saved
      FROM users
      WHERE id = $1
    `;
    const userResult = await db.query(userQuery, [userId]);
    const user = userResult.rows[0];
    
    // Отправляем WebSocket событие
    const io = req.app.get('io');
    if (io) {
      io.emit('post:created', {
        ...post,
        ...user,
        user_liked: false,
        likes_count: 0,
        comments_count: 0
      });
    }
    
    // Трекинг достижений для создания поста
    try {
      console.log('🎯 posts.js: Начинаем трекинг достижения post_created для пользователя', userId);
      console.log('   io доступен:', !!io);
      
      const { processAchievementEvent } = require('./achievements');
      console.log('   processAchievementEvent загружен:', typeof processAchievementEvent);
      
      const result = await processAchievementEvent(userId, 'post_created', { postId: post.id }, io);
      console.log('✅ Трекинг достижения post_created выполнен, результат:', result);
    } catch (trackError) {
      console.error('❌ Ошибка трекинга достижения:', trackError);
      // Не прерываем выполнение, если трекинг не сработал
    }
    
    res.json({
      success: true,
      post: {
        ...post,
        ...user,
        user_liked: false,
        likes_count: 0,
        comments_count: 0
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при создании поста'
    });
  }
});

// Удалить пост
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    
    // Проверяем что пост принадлежит пользователю
    const checkQuery = `
      SELECT user_id FROM user_posts WHERE id = $1 AND deleted_at IS NULL
    `;
    const checkResult = await db.query(checkQuery, [postId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Пост не найден'
      });
    }
    
    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'У вас нет прав на удаление этого поста'
      });
    }
    
    // Мягкое удаление
    const query = `
      UPDATE user_posts 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1
      RETURNING id
    `;
    
    await db.query(query, [postId]);
    
    // Отправляем WebSocket событие
    const io = req.app.get('io');
    if (io) {
      io.emit('post:deleted', { postId: parseInt(postId) });
    }
    
    res.json({
      success: true,
      message: 'Пост удален'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при удалении поста'
    });
  }
});

// Лайкнуть/убрать лайк с поста
router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    
    // Проверяем существует ли пост
    const postCheck = await db.query(
      'SELECT id, user_id FROM user_posts WHERE id = $1 AND deleted_at IS NULL',
      [postId]
    );
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Пост не найден'
      });
    }
    
    // Проверяем есть ли уже лайк
    const likeCheck = await db.query(
      'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    
    let liked = false;
    
    if (likeCheck.rows.length > 0) {
      // Убираем лайк
      await db.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      await db.query('UPDATE user_posts SET likes_count = likes_count - 1 WHERE id = $1', [postId]);
      liked = false;
    } else {
      // Добавляем лайк
      await db.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
      await db.query('UPDATE user_posts SET likes_count = likes_count + 1 WHERE id = $1', [postId]);
      liked = true;
    }
    
    // Получаем обновленное количество лайков
    const countResult = await db.query('SELECT likes_count FROM user_posts WHERE id = $1', [postId]);
    const likesCount = countResult.rows[0].likes_count;
    
    // Отправляем WebSocket событие
    const io = req.app.get('io');
    if (io) {
      io.emit('post:liked', {
        postId: parseInt(postId),
        userId,
        liked,
        likesCount
      });
    }
    
    res.json({
      success: true,
      liked,
      likesCount
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при обработке лайка'
    });
  }
});

module.exports = router;

// Получить комментарии к посту
router.get('/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT pc.*, 
        u.nickname, u.avatar_emoji, u.carbon_saved
      FROM post_comments pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.post_id = $1 
        AND pc.deleted_at IS NULL 
        AND u.deleted_at IS NULL
      ORDER BY pc.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [postId, limit, offset]);
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM post_comments
      WHERE post_id = $1 AND deleted_at IS NULL
    `;
    const countResult = await db.query(countQuery, [postId]);
    
    res.json({
      success: true,
      comments: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при загрузке комментариев'
    });
  }
});

// Добавить комментарий
router.post('/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Комментарий не может быть пустым'
      });
    }
    
    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Комментарий слишком длинный (максимум 1000 символов)'
      });
    }
    
    // Проверяем существует ли пост
    const postCheck = await db.query(
      'SELECT id FROM user_posts WHERE id = $1 AND deleted_at IS NULL',
      [postId]
    );
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Пост не найден'
      });
    }
    
    const query = `
      INSERT INTO post_comments (post_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await db.query(query, [postId, userId, content.trim()]);
    const comment = result.rows[0];
    
    // Обновляем счетчик комментариев
    await db.query(
      'UPDATE user_posts SET comments_count = comments_count + 1 WHERE id = $1',
      [postId]
    );
    
    // Получаем информацию о пользователе
    const userQuery = `
      SELECT nickname, avatar_emoji, carbon_saved
      FROM users
      WHERE id = $1
    `;
    const userResult = await db.query(userQuery, [userId]);
    const user = userResult.rows[0];
    
    // Отправляем WebSocket событие
    const io = req.app.get('io');
    if (io) {
      io.emit('comment:created', {
        ...comment,
        ...user,
        postId: parseInt(postId)
      });
    }
    
    // Трекинг достижений для комментария
    try {
      const { processAchievementEvent } = require('./achievements');
      await processAchievementEvent(userId, 'comment_added', { commentId: comment.id, postId: postId }, io);
      console.log('✅ Трекинг достижения comment_added выполнен');
    } catch (trackError) {
      console.error('❌ Ошибка трекинга достижения:', trackError);
    }
    
    res.json({
      success: true,
      comment: {
        ...comment,
        ...user
      }
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при создании комментария'
    });
  }
});

// Удалить комментарий
router.delete('/:postId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId, commentId } = req.params;
    
    // Проверяем что комментарий принадлежит пользователю
    const checkQuery = `
      SELECT user_id FROM post_comments 
      WHERE id = $1 AND post_id = $2 AND deleted_at IS NULL
    `;
    const checkResult = await db.query(checkQuery, [commentId, postId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Комментарий не найден'
      });
    }
    
    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'У вас нет прав на удаление этого комментария'
      });
    }
    
    // Мягкое удаление
    const query = `
      UPDATE post_comments 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1
      RETURNING id
    `;
    
    await db.query(query, [commentId]);
    
    // Обновляем счетчик комментариев
    await db.query(
      'UPDATE user_posts SET comments_count = comments_count - 1 WHERE id = $1',
      [postId]
    );
    
    // Отправляем WebSocket событие
    const io = req.app.get('io');
    if (io) {
      io.emit('comment:deleted', {
        commentId: parseInt(commentId),
        postId: parseInt(postId)
      });
    }
    
    res.json({
      success: true,
      message: 'Комментарий удален'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при удалении комментария'
    });
  }
});
