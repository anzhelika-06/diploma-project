const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { notifyAdminsAboutNewReport } = require('../utils/notificationHelper');

// Получить профиль пользователя
router.get('/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentUserId } = req.query; // ID пользователя, который смотрит профиль
    
    let mutualFriendsQuery = '0 as mutual_friends_count';
    
    // Если передан currentUserId и это не тот же пользователь, считаем общих друзей
    if (currentUserId && currentUserId !== userId) {
      mutualFriendsQuery = `(
        SELECT COUNT(DISTINCT mutual_friend_id)
        FROM (
          -- Друзья текущего пользователя
          SELECT 
            CASE 
              WHEN f2.user_id = ${parseInt(currentUserId)} THEN f2.friend_id
              ELSE f2.user_id
            END as mutual_friend_id
          FROM friendships f2
          WHERE (f2.user_id = ${parseInt(currentUserId)} OR f2.friend_id = ${parseInt(currentUserId)}) 
            AND f2.status = 'accepted'
            AND (f2.user_id != u.id AND f2.friend_id != u.id)
        ) AS current_user_friends
        WHERE mutual_friend_id IN (
          -- Друзья просматриваемого пользователя
          SELECT 
            CASE 
              WHEN f3.user_id = u.id THEN f3.friend_id
              ELSE f3.user_id
            END
          FROM friendships f3
          WHERE (f3.user_id = u.id OR f3.friend_id = u.id) 
            AND f3.status = 'accepted'
            AND (f3.user_id != ${parseInt(currentUserId)} AND f3.friend_id != ${parseInt(currentUserId)})
        )
      ) as mutual_friends_count`;
    }
    
    const result = await pool.query(`
      SELECT 
        u.id,
        u.nickname,
        u.email,
        u.bio,
        u.goal,
        u.date_of_birth,
        u.gender_id,
        u.avatar_emoji,
        u.eco_coins,
        u.trees_planted,
        u.carbon_saved,
        u.eco_level,
        u.is_profile_public,
        u.created_at,
        (SELECT COUNT(*) FROM friendships WHERE (user_id = u.id OR friend_id = u.id) AND status = 'accepted') as friends_count,
        (SELECT COUNT(*) FROM team_members WHERE user_id = u.id) as teams_count,
        (SELECT COUNT(*) FROM user_posts WHERE user_id = u.id AND deleted_at IS NULL) as posts_count,
        ${mutualFriendsQuery}
      FROM users u
      WHERE u.id = $1 AND u.deleted_at IS NULL
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Обновить профиль
router.put('/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const { nickname, bio, goal, date_of_birth, gender_id, is_profile_public } = req.body;
    
    // Проверка уникальности никнейма
    if (nickname) {
      const nicknameCheck = await pool.query(`
        SELECT id FROM users 
        WHERE nickname = $1 AND id != $2 AND deleted_at IS NULL
      `, [nickname, userId]);
      
      if (nicknameCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Этот никнейм уже занят'
        });
      }
    }
    
    const result = await pool.query(`
      UPDATE users
      SET 
        nickname = COALESCE($1, nickname),
        bio = COALESCE($2, bio),
        goal = COALESCE($3, goal),
        date_of_birth = COALESCE($4, date_of_birth),
        gender_id = COALESCE($5, gender_id),
        is_profile_public = COALESCE($6, is_profile_public),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND deleted_at IS NULL
      RETURNING *
    `, [nickname, bio, goal, date_of_birth, gender_id, is_profile_public, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Получить посты пользователя
router.get('/:userId/posts', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await pool.query(`
      SELECT 
        p.id,
        p.user_id,
        p.content,
        p.created_at,
        p.updated_at,
        u.nickname,
        u.avatar_emoji,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id AND deleted_at IS NULL) as comments_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as is_liked
      FROM user_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1 AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM user_posts WHERE user_id = $1 AND deleted_at IS NULL',
      [userId]
    );
    
    res.json({
      success: true,
      posts: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    console.error('Ошибка получения постов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Создать пост
router.post('/:userId/posts', async (req, res) => {
  try {
    const { userId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Содержимое поста не может быть пустым'
      });
    }
    
    const result = await pool.query(`
      INSERT INTO user_posts (user_id, content)
      VALUES ($1, $2)
      RETURNING *
    `, [userId, content.trim()]);
    
    const post = result.rows[0];
    
    // Получаем информацию о пользователе
    const userResult = await pool.query(
      'SELECT nickname, avatar_emoji FROM users WHERE id = $1',
      [userId]
    );
    
    const postWithUser = {
      ...post,
      nickname: userResult.rows[0].nickname,
      avatar_emoji: userResult.rows[0].avatar_emoji,
      likes_count: 0,
      comments_count: 0,
      is_liked: false
    };
    
    // Отправляем через WebSocket
    const io = req.app.get('io');
    if (io) {
      console.log('📡 Отправка события post:created через WebSocket');
      console.log('   Данные:', { userId, postId: postWithUser.id, nickname: postWithUser.nickname });
      io.emit('post:created', {
        post: postWithUser,
        userId: userId
      });
      console.log('✅ Событие post:created отправлено всем клиентам');
    } else {
      console.warn('⚠️ Socket.IO не доступен');
    }
    
    // Трекинг достижений для создания поста
    try {
      const { processAchievementEvent } = require('./achievements');
      await processAchievementEvent(Number(userId), 'post_created', { postId: post.id }, io);
      console.log('✅ Трекинг достижения post_created выполнен');
    } catch (trackError) {
      console.error('❌ Ошибка трекинга достижения:', trackError);
      // Не прерываем выполнение, если трекинг не сработал
    }
    
    res.json({
      success: true,
      post: postWithUser
    });
  } catch (error) {
    console.error('Ошибка создания поста:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Удалить пост
router.delete('/:userId/posts/:postId', async (req, res) => {
  try {
    const { userId, postId } = req.params;
    
    const result = await pool.query(`
      UPDATE user_posts
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
      RETURNING id
    `, [postId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Пост не найден'
      });
    }
    
    // Отправляем через WebSocket
    const io = req.app.get('io');
    if (io) {
      console.log('📡 Отправка события post:deleted через WebSocket, postId:', postId);
      io.emit('post:deleted', {
        postId: postId,
        userId: userId
      });
    } else {
      console.warn('⚠️ Socket.IO не доступен');
    }
    
    res.json({
      success: true,
      message: 'Пост удален'
    });
  } catch (error) {
    console.error('Ошибка удаления поста:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Лайкнуть пост
router.post('/:userId/posts/:postId/like', async (req, res) => {
  try {
    const { userId, postId } = req.params;
    const { likerId } = req.body; // ID пользователя, который ставит лайк
    
    // Проверяем, есть ли уже лайк
    const existingLike = await pool.query(
      'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, likerId]
    );
    
    let isLiked;
    
    if (existingLike.rows.length > 0) {
      // Убираем лайк
      await pool.query(
        'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2',
        [postId, likerId]
      );
      isLiked = false;
    } else {
      // Добавляем лайк
      await pool.query(
        'INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)',
        [postId, likerId]
      );
      isLiked = true;
    }
    
    // Обновляем счетчик лайков
    await pool.query(
      'UPDATE user_posts SET likes_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = $1) WHERE id = $1',
      [postId]
    );
    
    // Получаем новое количество лайков
    const likesResult = await pool.query(
      'SELECT likes_count FROM user_posts WHERE id = $1',
      [postId]
    );
    
    const likesCount = likesResult.rows[0].likes_count;
    
    // Отправляем через WebSocket
    const io = req.app.get('io');
    if (io) {
      console.log('📡 Отправка события post:like:update через WebSocket');
      console.log('   postId:', postId, 'type:', typeof postId);
      console.log('   likesCount:', likesCount, 'isLiked:', isLiked, 'likerId:', likerId);
      io.emit('post:like:update', {
        postId: Number(postId),
        likesCount: Number(likesCount),
        isLiked: isLiked,
        likerId: Number(likerId)
      });
      console.log('✅ Событие post:like:update отправлено всем клиентам');
    } else {
      console.warn('⚠️ Socket.IO не доступен');
    }
    
    res.json({
      success: true,
      isLiked: isLiked,
      likesCount: likesCount
    });
  } catch (error) {
    console.error('Ошибка лайка поста:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Получить комментарии к посту
router.get('/:userId/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        c.*,
        u.nickname,
        u.avatar_emoji
      FROM post_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1 AND c.deleted_at IS NULL
      ORDER BY c.created_at ASC
    `, [postId]);
    
    res.json({
      success: true,
      comments: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения комментариев:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Добавить комментарий
router.post('/:userId/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Комментарий не может быть пустым'
      });
    }
    
    const result = await pool.query(`
      INSERT INTO post_comments (post_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [postId, userId, content.trim()]);
    
    // Обновляем счетчик комментариев
    await pool.query(
      'UPDATE user_posts SET comments_count = (SELECT COUNT(*) FROM post_comments WHERE post_id = $1 AND deleted_at IS NULL) WHERE id = $1',
      [postId]
    );
    
    // Получаем информацию о пользователе
    const userResult = await pool.query(
      'SELECT nickname, avatar_emoji FROM users WHERE id = $1',
      [userId]
    );
    
    const comment = {
      ...result.rows[0],
      nickname: userResult.rows[0].nickname,
      avatar_emoji: userResult.rows[0].avatar_emoji
    };
    
    // Отправляем через WebSocket
    const io = req.app.get('io');
    if (io) {
      console.log('📡 Отправка события post:comment:added через WebSocket');
      console.log('   postId:', postId, 'type:', typeof postId);
      console.log('   Комментарий от:', comment.nickname, 'ID комментария:', comment.id);
      io.emit('post:comment:added', {
        postId: Number(postId),
        comment: comment
      });
      console.log('✅ Событие post:comment:added отправлено всем клиентам');
    } else {
      console.warn('⚠️ Socket.IO не доступен');
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
      comment: comment
    });
  } catch (error) {
    console.error('Ошибка добавления комментария:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Удалить комментарий
router.delete('/:userId/posts/:postId/comments/:commentId', async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { userId } = req.body;
    
    const result = await pool.query(`
      UPDATE post_comments
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
      RETURNING id
    `, [commentId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Комментарий не найден'
      });
    }
    
    // Обновляем счетчик комментариев
    await pool.query(
      'UPDATE user_posts SET comments_count = (SELECT COUNT(*) FROM post_comments WHERE post_id = $1 AND deleted_at IS NULL) WHERE id = $1',
      [postId]
    );
    
    // Отправляем через WebSocket
    const io = req.app.get('io');
    if (io) {
      console.log('📡 Отправка события post:comment:deleted через WebSocket, postId:', postId, 'commentId:', commentId);
      io.emit('post:comment:deleted', {
        postId: postId,
        commentId: commentId
      });
    } else {
      console.warn('⚠️ Socket.IO не доступен');
    }
    
    res.json({
      success: true,
      message: 'Комментарий удален'
    });
  } catch (error) {
    console.error('Ошибка удаления комментария:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// ============ СИСТЕМА ДРУЖБЫ ============

// Отправить запрос в друзья
router.post('/:userId/friends/request', async (req, res) => {
  try {
    const { userId } = req.params;
    const { friendId } = req.body;
    
    if (userId === friendId) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя добавить себя в друзья'
      });
    }
    
    // Проверяем, нет ли уже активного запроса (pending или accepted)
    const existing = await pool.query(
      'SELECT * FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
      [userId, friendId]
    );
    
    if (existing.rows.length > 0) {
      const friendship = existing.rows[0];
      
      // Если запрос был отклонен, удаляем старую запись
      if (friendship.status === 'rejected') {
        await pool.query(
          'DELETE FROM friendships WHERE id = $1',
          [friendship.id]
        );
      } else {
        // Если запрос pending или accepted, возвращаем ошибку
        return res.status(400).json({
          success: false,
          message: 'Запрос уже существует'
        });
      }
    }
    
    const result = await pool.query(`
      INSERT INTO friendships (user_id, friend_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING *
    `, [userId, friendId]);
    
    // Получаем информацию об отправителе для уведомления
    const senderInfo = await pool.query(
      'SELECT nickname FROM users WHERE id = $1',
      [userId]
    );
    
    // Отправляем через WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('friendship:request', {
        fromUserId: userId,
        toUserId: friendId,
        friendship: result.rows[0]
      });
    }
    
    // Создаем уведомление ТОЛЬКО для получателя запроса
    const notificationResult = await pool.query(`
      INSERT INTO notifications (user_id, type, title, message, related_id, link)
      VALUES ($1, 'friend_request', $2, $3, $4, $5)
      RETURNING *
    `, [
      friendId,
      'Новый запрос в друзья',
      `${senderInfo.rows[0].nickname} хочет добавить вас в друзья`,
      userId,
      '/friends'
    ]);
    
    // Отправляем WebSocket событие о новом уведомлении ТОЛЬКО получателю
    if (io) {
      io.to(`user:${friendId}`).emit('notification:new', notificationResult.rows[0]);
    }
    
    res.json({
      success: true,
      friendship: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка отправки запроса в друзья:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Принять запрос в друзья
router.put('/:userId/friends/:friendshipId/accept', async (req, res) => {
  try {
    const { userId, friendshipId } = req.params;
    
    const result = await pool.query(`
      UPDATE friendships
      SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND friend_id = $2 AND status = 'pending'
      RETURNING user_id, friend_id
    `, [friendshipId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Запрос не найден'
      });
    }
    
    const friendship = result.rows[0];
    
    // Отправляем через WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('friendship:accepted', {
        userId: friendship.friend_id,
        friendId: friendship.user_id
      });
    }
    
    // Создаем уведомление для отправителя запроса
    const notificationResult = await pool.query(`
      INSERT INTO notifications (user_id, type, title, message, related_id, link)
      VALUES ($1, 'friend_request', $2, $3, $4, $5)
      RETURNING *
    `, [
      friendship.user_id,
      'Запрос в друзья принят',
      'Ваш запрос в друзья был принят!',
      friendship.friend_id,
      '/friends'
    ]);
    
    // Отправляем WebSocket событие о новом уведомлении
    if (io) {
      io.to(`user:${friendship.user_id}`).emit('notification:new', notificationResult.rows[0]);
    }
    
    // Трекинг достижений для обоих пользователей
    try {
      const { processAchievementEvent } = require('./achievements');
      
      // Для пользователя, который принял запрос
      await processAchievementEvent(friendship.friend_id, 'friend_added', { 
        friendId: friendship.user_id 
      }, io);
      
      // Для пользователя, который отправил запрос
      await processAchievementEvent(friendship.user_id, 'friend_added', { 
        friendId: friendship.friend_id 
      }, io);
      
      console.log('✅ Трекинг достижений friend_added выполнен для обоих пользователей');
    } catch (trackError) {
      console.error('❌ Ошибка трекинга достижения friend_added:', trackError);
    }
    
    res.json({
      success: true,
      friendship: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка принятия запроса:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Отклонить запрос в друзья
router.put('/:userId/friends/:friendshipId/reject', async (req, res) => {
  try {
    const { userId, friendshipId } = req.params;
    
    const result = await pool.query(`
      UPDATE friendships
      SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND friend_id = $2 AND status = 'pending'
      RETURNING user_id, friend_id
    `, [friendshipId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Запрос не найден'
      });
    }
    
    const friendship = result.rows[0];
    
    // Отправляем WebSocket событие
    const io = req.app.get('io');
    if (io) {
      io.emit('friendship:rejected', {
        fromUserId: friendship.user_id,
        toUserId: friendship.friend_id
      });
    }
    
    // Создаем уведомление для отправителя запроса
    const notificationResult = await pool.query(`
      INSERT INTO notifications (user_id, type, title, message, related_id, link)
      VALUES ($1, 'friend_request', $2, $3, $4, $5)
      RETURNING *
    `, [
      friendship.user_id,
      'Запрос в друзья отклонен',
      'Ваш запрос в друзья был отклонен',
      friendship.friend_id,
      '/friends'
    ]);
    
    // Отправляем WebSocket событие о новом уведомлении
    if (io) {
      io.to(`user:${friendship.user_id}`).emit('notification:new', notificationResult.rows[0]);
    }
    
    res.json({
      success: true,
      message: 'Запрос отклонен'
    });
  } catch (error) {
    console.error('Ошибка отклонения запроса:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Удалить из друзей
router.delete('/:userId/friends/:friendId', async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    
    const result = await pool.query(`
      DELETE FROM friendships
      WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
      RETURNING *
    `, [userId, friendId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Дружба не найдена'
      });
    }
    
    // Отправляем через WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('friendship:removed', {
        userId: userId,
        friendId: friendId
      });
    }
    
    res.json({
      success: true,
      message: 'Удалено из друзей'
    });
  } catch (error) {
    console.error('Ошибка удаления из друзей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Получить список друзей
router.get('/:userId/friends', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        u.id,
        u.nickname,
        u.avatar_emoji,
        u.eco_level,
        u.carbon_saved,
        f.status,
        f.created_at as friendship_date,
        (
          SELECT COUNT(DISTINCT mutual_friend_id)
          FROM (
            -- Друзья текущего пользователя
            SELECT 
              CASE 
                WHEN f2.user_id = $1 THEN f2.friend_id
                ELSE f2.user_id
              END as mutual_friend_id
            FROM friendships f2
            WHERE (f2.user_id = $1 OR f2.friend_id = $1) 
              AND f2.status = 'accepted'
              AND (f2.user_id != u.id AND f2.friend_id != u.id)
          ) AS current_user_friends
          WHERE mutual_friend_id IN (
            -- Друзья этого друга
            SELECT 
              CASE 
                WHEN f3.user_id = u.id THEN f3.friend_id
                ELSE f3.user_id
              END
            FROM friendships f3
            WHERE (f3.user_id = u.id OR f3.friend_id = u.id) 
              AND f3.status = 'accepted'
              AND (f3.user_id != $1 AND f3.friend_id != $1)
          )
        ) as mutual_friends_count
      FROM friendships f
      JOIN users u ON (
        CASE 
          WHEN f.user_id = $1 THEN u.id = f.friend_id
          ELSE u.id = f.user_id
        END
      )
      WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
      ORDER BY f.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      friends: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения друзей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Принять запрос в друзья (новый эндпоинт)
router.post('/:userId/friends/accept', async (req, res) => {
  try {
    const { userId } = req.params;
    const { friendId } = req.body;
    
    const result = await pool.query(`
      UPDATE friendships
      SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
      RETURNING *
    `, [friendId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Запрос не найден'
      });
    }
    
    const friendship = result.rows[0];
    
    // Отправляем через WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${friendId}`).emit('friendRequestAccepted', {
        userId: userId,
        friendId: friendId
      });
    }
    
    // Создаем уведомление для отправителя запроса
    const senderInfo = await pool.query(
      'SELECT nickname FROM users WHERE id = $1',
      [userId]
    );
    
    const notificationResult = await pool.query(`
      INSERT INTO notifications (user_id, type, title, message, related_id, link)
      VALUES ($1, 'friend_request', $2, $3, $4, $5)
      RETURNING *
    `, [
      friendId,
      'Запрос в друзья принят',
      `${senderInfo.rows[0].nickname} принял ваш запрос в друзья!`,
      userId,
      '/friends'
    ]);
    
    // Отправляем WebSocket событие о новом уведомлении
    if (io) {
      io.to(`user:${friendId}`).emit('notification:new', notificationResult.rows[0]);
    }
    
    // Трекинг достижений для обоих пользователей
    try {
      const { processAchievementEvent } = require('./achievements');
      
      // Для пользователя, который принял запрос
      await processAchievementEvent(Number(userId), 'friend_added', { 
        friendId: Number(friendId)
      }, io);
      
      // Для пользователя, который отправил запрос
      await processAchievementEvent(Number(friendId), 'friend_added', { 
        friendId: Number(userId)
      }, io);
      
      console.log('✅ Трекинг достижений friend_added выполнен для обоих пользователей');
    } catch (trackError) {
      console.error('❌ Ошибка трекинга достижения friend_added:', trackError);
    }
    
    res.json({
      success: true,
      friendship: friendship
    });
  } catch (error) {
    console.error('Ошибка принятия запроса:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Отклонить запрос в друзья (новый эндпоинт)
router.post('/:userId/friends/reject', async (req, res) => {
  try {
    const { userId } = req.params;
    const { friendId } = req.body;
    
    const result = await pool.query(`
      UPDATE friendships
      SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
      RETURNING *
    `, [friendId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Запрос не найден'
      });
    }
    
    const friendship = result.rows[0];
    
    // Отправляем WebSocket событие
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${friendId}`).emit('friendRequestRejected', {
        userId: userId,
        friendId: friendId
      });
    }
    
    res.json({
      success: true,
      message: 'Запрос отклонен'
    });
  } catch (error) {
    console.error('Ошибка отклонения запроса:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Отменить исходящий запрос в друзья
router.post('/:userId/friends/cancel', async (req, res) => {
  try {
    const { userId } = req.params;
    const { friendId } = req.body;
    
    const result = await pool.query(`
      DELETE FROM friendships
      WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
      RETURNING *
    `, [userId, friendId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Запрос не найден'
      });
    }
    
    res.json({
      success: true,
      message: 'Запрос отменен'
    });
  } catch (error) {
    console.error('Ошибка отмены запроса:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Получить рекомендации друзей (пользователи с общими друзьями)
router.get('/:userId/friends/recommendations', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      WITH my_friends AS (
        SELECT 
          CASE 
            WHEN user_id = $1 THEN friend_id
            ELSE user_id
          END as friend_id
        FROM friendships
        WHERE (user_id = $1 OR friend_id = $1) AND status = 'accepted'
      ),
      friends_of_friends AS (
        SELECT 
          CASE 
            WHEN f.user_id IN (SELECT friend_id FROM my_friends) THEN f.friend_id
            ELSE f.user_id
          END as potential_friend_id,
          COUNT(*) as mutual_friends_count
        FROM friendships f
        WHERE (f.user_id IN (SELECT friend_id FROM my_friends) OR f.friend_id IN (SELECT friend_id FROM my_friends))
          AND f.status = 'accepted'
          AND f.user_id != $1 
          AND f.friend_id != $1
        GROUP BY potential_friend_id
      )
      SELECT 
        u.id,
        u.nickname,
        u.avatar_emoji,
        u.eco_level,
        u.carbon_saved,
        fof.mutual_friends_count
      FROM friends_of_friends fof
      JOIN users u ON u.id = fof.potential_friend_id
      WHERE u.id NOT IN (SELECT friend_id FROM my_friends)
        AND u.id != $1
        AND NOT EXISTS (
          SELECT 1 FROM friendships 
          WHERE ((user_id = $1 AND friend_id = u.id) OR (user_id = u.id AND friend_id = $1))
        )
      ORDER BY fof.mutual_friends_count DESC, u.carbon_saved DESC
      LIMIT 20
    `, [userId]);
    
    res.json({
      success: true,
      recommendations: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения рекомендаций:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Получить входящие запросы в друзья
router.get('/:userId/friends/requests/incoming', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        f.id as friendship_id,
        u.id,
        u.nickname,
        u.avatar_emoji,
        u.eco_level,
        f.created_at,
        (
          SELECT COUNT(DISTINCT mutual_friend_id)
          FROM (
            SELECT 
              CASE 
                WHEN f2.user_id = $1 THEN f2.friend_id
                ELSE f2.user_id
              END as mutual_friend_id
            FROM friendships f2
            WHERE (f2.user_id = $1 OR f2.friend_id = $1) 
              AND f2.status = 'accepted'
          ) AS my_friends
          WHERE mutual_friend_id IN (
            SELECT 
              CASE 
                WHEN f3.user_id = u.id THEN f3.friend_id
                ELSE f3.user_id
              END
            FROM friendships f3
            WHERE (f3.user_id = u.id OR f3.friend_id = u.id) 
              AND f3.status = 'accepted'
          )
          AND mutual_friend_id != u.id
          AND mutual_friend_id != $1
        ) as mutual_friends_count
      FROM friendships f
      JOIN users u ON u.id = f.user_id
      WHERE f.friend_id = $1 AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      requests: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения запросов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Получить исходящие запросы в друзья
router.get('/:userId/friends/requests/outgoing', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        f.id as friendship_id,
        u.id,
        u.nickname,
        u.avatar_emoji,
        u.eco_level,
        f.created_at,
        (
          SELECT COUNT(DISTINCT mutual_friend_id)
          FROM (
            SELECT 
              CASE 
                WHEN f2.user_id = $1 THEN f2.friend_id
                ELSE f2.user_id
              END as mutual_friend_id
            FROM friendships f2
            WHERE (f2.user_id = $1 OR f2.friend_id = $1) 
              AND f2.status = 'accepted'
          ) AS my_friends
          WHERE mutual_friend_id IN (
            SELECT 
              CASE 
                WHEN f3.user_id = u.id THEN f3.friend_id
                ELSE f3.user_id
              END
            FROM friendships f3
            WHERE (f3.user_id = u.id OR f3.friend_id = u.id) 
              AND f3.status = 'accepted'
          )
          AND mutual_friend_id != u.id
          AND mutual_friend_id != $1
        ) as mutual_friends_count
      FROM friendships f
      JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = $1 AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      requests: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения исходящих запросов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Отменить исходящий запрос в друзья
router.post('/:userId/friends/cancel', async (req, res) => {
  try {
    const { userId } = req.params;
    const { friendId } = req.body;
    
    await pool.query(`
      DELETE FROM friendships
      WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
    `, [userId, friendId]);
    
    res.json({
      success: true,
      message: 'Запрос отменен'
    });
  } catch (error) {
    console.error('Ошибка отмены запроса:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Проверить статус дружбы
router.get('/:userId/friends/status/:friendId', async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM friendships
      WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
    `, [userId, friendId]);
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        status: 'none'
      });
    }
    
    const friendship = result.rows[0];
    let status = friendship.status;
    
    // Если запрос отправлен текущим пользователем
    if (friendship.user_id === parseInt(userId) && friendship.status === 'pending') {
      status = 'pending_sent';
    }
    // Если запрос получен текущим пользователем
    else if (friendship.friend_id === parseInt(userId) && friendship.status === 'pending') {
      status = 'pending_received';
    }
    
    res.json({
      success: true,
      status: status,
      friendshipId: friendship.id
    });
  } catch (error) {
    console.error('Ошибка проверки статуса:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// ============ ЖАЛОБЫ НА ПОЛЬЗОВАТЕЛЕЙ ============

// Отправить жалобу
router.post('/:userId/report', async (req, res) => {
  try {
    const { userId } = req.params; // ID пользователя, на которого жалуются
    const { reporterId, reason, description, screenshots } = req.body;
    
    if (!reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Укажите причину и описание'
      });
    }
    
    const result = await pool.query(`
      INSERT INTO user_reports (reporter_id, reported_user_id, reason, description, screenshots)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [reporterId, userId, reason, description, screenshots || []]);
    
    const report = result.rows[0];
    
    // Получаем никнеймы для уведомления
    const usersResult = await pool.query(`
      SELECT 
        (SELECT nickname FROM users WHERE id = $1) as reporter_nickname,
        (SELECT nickname FROM users WHERE id = $2) as reported_nickname
    `, [reporterId, userId]);
    
    const { reporter_nickname, reported_nickname } = usersResult.rows[0];
    
    // Отправляем уведомления всем администраторам
    const io = req.app.get('io');
    await notifyAdminsAboutNewReport(report.id, reporter_nickname, reported_nickname, io);
    
    res.json({
      success: true,
      report: report,
      message: 'Жалоба отправлена на рассмотрение'
    });
  } catch (error) {
    console.error('Ошибка отправки жалобы:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// ============ СМЕНА ПАРОЛЯ ============

// Изменить пароль
router.put('/:userId/password', async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Укажите текущий и новый пароль'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Новый пароль должен быть не менее 6 символов'
      });
    }
    
    // Получаем текущий хеш пароля
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    const bcrypt = require('bcrypt');
    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Неверный текущий пароль'
      });
    }
    
    // Хешируем новый пароль
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );
    
    res.json({
      success: true,
      message: 'Пароль успешно изменен'
    });
  } catch (error) {
    console.error('Ошибка смены пароля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

module.exports = router;

// ============ СИСТЕМА ДРУЖБЫ ============

// Поиск пользователей по никнейму
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.query.currentUserId;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Запрос должен содержать минимум 2 символа'
      });
    }
    
    const result = await pool.query(`
      SELECT 
        u.id,
        u.nickname,
        u.avatar_emoji,
        u.eco_level,
        u.carbon_saved,
        u.bio,
        (
          SELECT COUNT(*) 
          FROM friendships f1
          WHERE (f1.user_id = u.id OR f1.friend_id = u.id) 
            AND f1.status = 'accepted'
        ) as friends_count,
        COALESCE((
          SELECT COUNT(*)
          FROM (
            -- Друзья найденного пользователя
            SELECT DISTINCT
              CASE 
                WHEN f1.user_id = u.id THEN f1.friend_id 
                ELSE f1.user_id 
              END as friend_id
            FROM friendships f1
            WHERE (f1.user_id = u.id OR f1.friend_id = u.id)
              AND f1.status = 'accepted'
          ) AS target_friends
          WHERE target_friends.friend_id IN (
            -- Друзья текущего пользователя
            SELECT DISTINCT
              CASE 
                WHEN f2.user_id = $2 THEN f2.friend_id 
                ELSE f2.user_id 
              END
            FROM friendships f2
            WHERE (f2.user_id = $2 OR f2.friend_id = $2)
              AND f2.status = 'accepted'
          )
          AND target_friends.friend_id != $2  -- Исключаем текущего пользователя
          AND target_friends.friend_id != u.id  -- Исключаем найденного пользователя
        ), 0) as mutual_friends_count,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM friendships 
            WHERE ((user_id = $2 AND friend_id = u.id) OR (user_id = u.id AND friend_id = $2))
              AND status = 'accepted'
          ) THEN 'accepted'
          WHEN EXISTS (
            SELECT 1 FROM friendships 
            WHERE user_id = $2 AND friend_id = u.id AND status = 'pending'
          ) THEN 'pending_sent'
          WHEN EXISTS (
            SELECT 1 FROM friendships 
            WHERE user_id = u.id AND friend_id = $2 AND status = 'pending'
          ) THEN 'pending_received'
          ELSE 'none'
        END as friendship_status
      FROM users u
      WHERE u.nickname ILIKE $1 
        AND u.id != $2
        AND u.deleted_at IS NULL
        AND u.is_banned = FALSE
      ORDER BY 
        CASE WHEN u.nickname ILIKE $1 THEN 0 ELSE 1 END,
        mutual_friends_count DESC,
        u.carbon_saved DESC
      LIMIT 20
    `, [`%${query}%`, currentUserId]);
    
    // Отладка
    console.log('=== SEARCH DEBUG ===');
    console.log('Search query:', query);
    console.log('Current user ID:', currentUserId);
    console.log('Results:', result.rows.map(r => ({
      id: r.id,
      nickname: r.nickname,
      friends_count: r.friends_count,
      mutual_friends_count: r.mutual_friends_count,
      friendship_status: r.friendship_status
    })));
    console.log('===================');
    
    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Ошибка поиска пользователей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Получить рекомендации друзей (люди с общими друзьями)
router.get('/:userId/friends/recommendations', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      WITH user_friends AS (
        SELECT 
          CASE 
            WHEN user_id = $1 THEN friend_id 
            ELSE user_id 
          END as friend_id
        FROM friendships
        WHERE (user_id = $1 OR friend_id = $1) AND status = 'accepted'
      ),
      potential_friends AS (
        SELECT 
          CASE 
            WHEN f.user_id IN (SELECT friend_id FROM user_friends) THEN f.friend_id
            ELSE f.user_id
          END as potential_friend_id,
          COUNT(*) as mutual_count
        FROM friendships f
        WHERE (f.user_id IN (SELECT friend_id FROM user_friends) 
           OR f.friend_id IN (SELECT friend_id FROM user_friends))
          AND f.status = 'accepted'
          AND f.user_id != $1 
          AND f.friend_id != $1
        GROUP BY potential_friend_id
        HAVING COUNT(*) > 0
      )
      SELECT 
        u.id,
        u.nickname,
        u.avatar_emoji,
        u.eco_level,
        u.carbon_saved,
        u.bio,
        pf.mutual_count as mutual_friends_count
      FROM potential_friends pf
      JOIN users u ON u.id = pf.potential_friend_id
      WHERE u.id NOT IN (SELECT friend_id FROM user_friends)
        AND u.deleted_at IS NULL
        AND u.is_banned = FALSE
        AND NOT EXISTS (
          SELECT 1 FROM friendships 
          WHERE ((user_id = $1 AND friend_id = u.id) OR (user_id = u.id AND friend_id = $1))
        )
      ORDER BY pf.mutual_count DESC, u.carbon_saved DESC
      LIMIT 10
    `, [userId]);
    
    res.json({
      success: true,
      recommendations: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения рекомендаций:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

module.exports = router;
