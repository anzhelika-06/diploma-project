const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/authMiddleware');

// Получить список диалогов (друзья с последним сообщением)
router.get('/conversations', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT
        u.id, u.nickname, u.avatar_emoji,
        dm.content AS last_message,
        dm.created_at AS last_message_at,
        dm.sender_id AS last_sender_id,
        (
          SELECT COUNT(*) FROM direct_messages
          WHERE receiver_id = $1 AND sender_id = u.id AND is_read = FALSE
        )::int AS unread_count
      FROM friendships f
      JOIN users u ON u.id = CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END
      LEFT JOIN LATERAL (
        SELECT content, created_at, sender_id FROM direct_messages
        WHERE (sender_id = $1 AND receiver_id = u.id)
           OR (sender_id = u.id AND receiver_id = $1)
        ORDER BY created_at DESC LIMIT 1
      ) dm ON TRUE
      WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
        AND u.deleted_at IS NULL
      ORDER BY COALESCE(dm.created_at, f.created_at) DESC
    `, [userId]);
    res.json({ success: true, conversations: result.rows });
  } catch (err) {
    console.error('conversations error:', err);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Получить сообщения диалога с пользователем
router.get('/direct/:friendId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const friendId = parseInt(req.params.friendId);
  const limit = parseInt(req.query.limit) || 50;
  const before = req.query.before; // cursor pagination
  try {
    let q = `
      SELECT dm.id, dm.sender_id, dm.receiver_id, dm.content, dm.is_read, dm.created_at,
             u.nickname AS sender_nickname, u.avatar_emoji AS sender_avatar
      FROM direct_messages dm
      JOIN users u ON u.id = dm.sender_id
      WHERE ((dm.sender_id = $1 AND dm.receiver_id = $2)
          OR (dm.sender_id = $2 AND dm.receiver_id = $1))
    `;
    const params = [userId, friendId];
    if (before) {
      params.push(before);
      q += ` AND dm.created_at < $${params.length}`;
    }
    q += ` ORDER BY dm.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(q, params);
    // Помечаем как прочитанные
    await pool.query(
      `UPDATE direct_messages SET is_read = TRUE
       WHERE receiver_id = $1 AND sender_id = $2 AND is_read = FALSE`,
      [userId, friendId]
    );
    res.json({ success: true, messages: result.rows.reverse() });
  } catch (err) {
    console.error('direct messages error:', err);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Отправить личное сообщение (REST fallback, основной путь — socket)
router.post('/direct/:friendId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const friendId = parseInt(req.params.friendId);
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ success: false, message: 'Пустое сообщение' });

  try {
    // Проверяем дружбу
    const friendship = await pool.query(
      `SELECT id FROM friendships
       WHERE ((user_id=$1 AND friend_id=$2) OR (user_id=$2 AND friend_id=$1))
         AND status='accepted'`,
      [userId, friendId]
    );
    if (!friendship.rows.length) return res.status(403).json({ success: false, message: 'Не в друзьях' });

    const result = await pool.query(
      `INSERT INTO direct_messages (sender_id, receiver_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, sender_id, receiver_id, content, is_read, created_at`,
      [userId, friendId, content.trim()]
    );
    const msg = result.rows[0];

    // Отправляем через socket
    const io = req.app.get('io');
    if (io) {
      const user = await pool.query('SELECT nickname, avatar_emoji FROM users WHERE id=$1', [userId]);
      const full = { ...msg, sender_nickname: user.rows[0].nickname, sender_avatar: user.rows[0].avatar_emoji };
      io.to(`user:${friendId}`).emit('message:direct', full);
      io.to(`user:${userId}`).emit('message:direct', full);
    }
    res.json({ success: true, message: result.rows[0] });
  } catch (err) {
    console.error('send direct error:', err);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Получить командные чаты пользователя
router.get('/team-chats', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT
        t.id, t.name, t.avatar_emoji, t.member_count,
        tm2.content AS last_message,
        tm2.created_at AS last_message_at,
        tm2.sender_id AS last_sender_id,
        (SELECT nickname FROM users WHERE id = tm2.sender_id) AS last_sender_nickname,
        (
          SELECT COUNT(*) FROM team_messages
          WHERE team_id = t.id
            AND created_at > COALESCE(
              (SELECT last_read_at FROM team_message_reads WHERE user_id = $1 AND team_id = t.id),
              '1970-01-01'
            )
            AND sender_id != $1
        )::int AS unread_count
      FROM team_members tmem
      JOIN teams t ON t.id = tmem.team_id
      LEFT JOIN LATERAL (
        SELECT content, created_at, sender_id FROM team_messages
        WHERE team_id = t.id
        ORDER BY created_at DESC LIMIT 1
      ) tm2 ON TRUE
      WHERE tmem.user_id = $1
      ORDER BY COALESCE(tm2.created_at, t.created_at) DESC
    `, [userId]);
    res.json({ success: true, teams: result.rows });
  } catch (err) {
    console.error('team chats error:', err);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Получить сообщения команды
router.get('/team/:teamId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const teamId = parseInt(req.params.teamId);
  const limit = parseInt(req.query.limit) || 50;
  const before = req.query.before;
  try {
    // Проверяем членство
    const member = await pool.query(
      'SELECT id FROM team_members WHERE team_id=$1 AND user_id=$2',
      [teamId, userId]
    );
    if (!member.rows.length) return res.status(403).json({ success: false, message: 'Не в команде' });

    let q = `
      SELECT tm.id, tm.team_id, tm.sender_id, tm.content, tm.created_at,
             u.nickname AS sender_nickname, u.avatar_emoji AS sender_avatar
      FROM team_messages tm
      JOIN users u ON u.id = tm.sender_id
      WHERE tm.team_id = $1
    `;
    const params = [teamId];
    if (before) {
      params.push(before);
      q += ` AND tm.created_at < $${params.length}`;
    }
    q += ` ORDER BY tm.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(q, params);
    // Обновляем last_read_at
    await pool.query(
      `INSERT INTO team_message_reads (user_id, team_id, last_read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, team_id) DO UPDATE SET last_read_at = NOW()`,
      [userId, teamId]
    );
    res.json({ success: true, messages: result.rows.reverse() });
  } catch (err) {
    console.error('team messages error:', err);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Отправить сообщение в команду (REST fallback)
router.post('/team/:teamId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const teamId = parseInt(req.params.teamId);
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ success: false, message: 'Пустое сообщение' });

  try {
    const member = await pool.query(
      'SELECT id FROM team_members WHERE team_id=$1 AND user_id=$2',
      [teamId, userId]
    );
    if (!member.rows.length) return res.status(403).json({ success: false, message: 'Не в команде' });

    const result = await pool.query(
      `INSERT INTO team_messages (team_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, team_id, sender_id, content, created_at`,
      [teamId, userId, content.trim()]
    );
    const msg = result.rows[0];

    const io = req.app.get('io');
    if (io) {
      const user = await pool.query('SELECT nickname, avatar_emoji FROM users WHERE id=$1', [userId]);
      const full = { ...msg, sender_nickname: user.rows[0].nickname, sender_avatar: user.rows[0].avatar_emoji };
      io.to(`team:${teamId}`).emit('message:team', full);
    }
    res.json({ success: true, message: msg });
  } catch (err) {
    console.error('send team error:', err);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

module.exports = router;
