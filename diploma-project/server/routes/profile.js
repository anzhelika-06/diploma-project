const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { notifyAdminsAboutNewReport } = require('../utils/notificationHelper');

// Получить профиль пользователя
router.get('/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    
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
        (SELECT COUNT(*) FROM user_posts WHERE user_id = u.id AND deleted_at IS NULL) as posts_count
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
        p.*,
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

module.exports = router;


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
    
    // Проверяем, нет ли уже запроса
    const existing = await pool.query(
      'SELECT * FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
      [userId, friendId]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Запрос уже существует'
      });
    }
    
    const result = await pool.query(`
      INSERT INTO friendships (user_id, friend_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING *
    `, [userId, friendId]);
    
    // Отправляем через WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('friendship:request', {
        fromUserId: userId,
        toUserId: friendId,
        friendship: result.rows[0]
      });
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
      RETURNING *
    `, [friendshipId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Запрос не найден'
      });
    }
    
    // Отправляем через WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('friendship:accepted', {
        friendship: result.rows[0]
      });
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
      RETURNING *
    `, [friendshipId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Запрос не найден'
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
        f.created_at as friendship_date
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
        f.created_at
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
