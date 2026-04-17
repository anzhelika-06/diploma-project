const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

const TREE_COST = 1; // eco coins per tree (1 for testing)

// Auto-create tables if upgrading
pool.query(`
  CREATE TABLE IF NOT EXISTS tree_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coins_spent INTEGER NOT NULL DEFAULT 200,
    trees_count INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'planted', 'rejected')),
    admin_id INTEGER REFERENCES users(id),
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(() => {});

pool.query(`
  CREATE TABLE IF NOT EXISTS tree_markers (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES tree_requests(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    photo_url TEXT,
    note TEXT,
    planted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(() => {});

// POST /api/trees/redeem — user exchanges eco coins for tree planting
router.post('/redeem', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { trees_count = 1 } = req.body;
    const count = Math.max(1, parseInt(trees_count));
    const cost = count * TREE_COST;

    const userRes = await pool.query('SELECT eco_coins, nickname FROM users WHERE id = $1', [userId]);
    if (!userRes.rows.length) return res.status(404).json({ success: false, message: 'User not found' });

    const { eco_coins, nickname } = userRes.rows[0];
    if (eco_coins < cost) {
      return res.status(400).json({ success: false, error: 'not_enough_coins', message: `Нужно ${cost} экоинов, у вас ${eco_coins}` });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Deduct coins
      await client.query('UPDATE users SET eco_coins = eco_coins - $1, updated_at = NOW() WHERE id = $2', [cost, userId]);

      // Log coins history
      await client.query(
        "INSERT INTO eco_coins_history (user_id, type, amount, description) VALUES ($1, 'spent', $2, $3)",
        [userId, cost, `Посадка ${count} дерев(а)`]
      );

      // Create request
      const reqRes = await client.query(
        'INSERT INTO tree_requests (user_id, coins_spent, trees_count) VALUES ($1, $2, $3) RETURNING id',
        [userId, cost, count]
      );
      const requestId = reqRes.rows[0].id;

      // Notify all admins
      const admins = await client.query('SELECT id FROM users WHERE is_admin = TRUE');
      for (const admin of admins.rows) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, link, related_id)
           VALUES ($1, 'system', $2, $3, $4, $5)`,
          [
            admin.id,
            '🌳 Новый запрос на посадку дерева',
            `Пользователь ${nickname} хочет посадить ${count} дерев(а). Обменял ${cost} экоинов.`,
            '/admin?tab=funds',
            requestId
          ]
        );
      }

      await client.query('COMMIT');

      const newCoins = await pool.query('SELECT eco_coins FROM users WHERE id = $1', [userId]);

      // Emit to admins via socket
      const io = req.app.get('io');
      if (io) {
        for (const admin of admins.rows) {
          io.to(`user:${admin.id}`).emit('notification:new', {
            type: 'system',
            title: '🌳 Новый запрос на посадку дерева',
            message: `Пользователь ${nickname} хочет посадить ${count} дерев(а).`,
            link: '/admin?tab=funds'
          });
        }
      }

      res.json({ success: true, request_id: requestId, eco_coins: newCoins.rows[0].eco_coins });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/trees/my — user's requests and markers
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await pool.query(
      `SELECT tr.*, 
        json_agg(tm.*) FILTER (WHERE tm.id IS NOT NULL) as markers
       FROM tree_requests tr
       LEFT JOIN tree_markers tm ON tm.request_id = tr.id
       WHERE tr.user_id = $1
       GROUP BY tr.id
       ORDER BY tr.created_at DESC`,
      [userId]
    );
    res.json({ success: true, requests: requests.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/trees/markers — all markers (public, for global map)
router.get('/markers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tm.*, u.nickname, u.avatar_emoji
       FROM tree_markers tm
       JOIN users u ON u.id = tm.user_id
       ORDER BY tm.planted_at DESC`
    );
    res.json({ success: true, markers: result.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── ADMIN ROUTES ──

// GET /api/trees/admin/requests — all pending requests
router.get('/admin/requests', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const result = await pool.query(
      `SELECT tr.*, u.nickname, u.avatar_emoji, u.email,
        json_agg(tm.*) FILTER (WHERE tm.id IS NOT NULL) as markers
       FROM tree_requests tr
       JOIN users u ON u.id = tr.user_id
       LEFT JOIN tree_markers tm ON tm.request_id = tr.id
       WHERE ($1 = 'all' OR tr.status = $1)
       GROUP BY tr.id, u.nickname, u.avatar_emoji, u.email
       ORDER BY tr.created_at DESC`,
      [status]
    );
    res.json({ success: true, requests: result.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/trees/admin/plant — admin places marker and confirms planting
router.post('/admin/plant', authenticateToken, isAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { request_id, lat, lng, photo_url, note } = req.body;

    if (!request_id || lat == null || lng == null) {
      return res.status(400).json({ success: false, message: 'request_id, lat, lng required' });
    }

    const reqRes = await pool.query('SELECT * FROM tree_requests WHERE id = $1', [request_id]);
    if (!reqRes.rows.length) return res.status(404).json({ success: false, message: 'Request not found' });

    const request = reqRes.rows[0];
    if (request.status === 'planted') return res.status(400).json({ success: false, message: 'Already planted' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Add marker
      const markerRes = await client.query(
        'INSERT INTO tree_markers (request_id, user_id, lat, lng, photo_url, note) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [request_id, request.user_id, lat, lng, photo_url || null, note || null]
      );

      // Update request status
      await client.query(
        'UPDATE tree_requests SET status = $1, admin_id = $2, admin_note = $3, updated_at = NOW() WHERE id = $4',
        ['planted', adminId, note || null, request_id]
      );

      // Update user trees_planted count
      await client.query(
        'UPDATE users SET trees_planted = trees_planted + $1, updated_at = NOW() WHERE id = $2',
        [request.trees_count, request.user_id]
      );

      // Notify user
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, link, related_id)
         VALUES ($1, 'system', $2, $3, $4, $5)`,
        [
          request.user_id,
          '🌳 Ваше дерево посажено!',
          `Администратор посадил ${request.trees_count} дерев(а) от вашего имени. Посмотрите на карте!`,
          '/contribution',
          markerRes.rows[0].id
        ]
      );

      await client.query('COMMIT');

      // Emit to user
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${request.user_id}`).emit('notification:new', {
          type: 'system',
          title: '🌳 Ваше дерево посажено!',
          message: `Администратор посадил ${request.trees_count} дерев(а) от вашего имени.`,
          link: '/contribution'
        });
      }

      res.json({ success: true, marker: markerRes.rows[0] });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/trees/admin/reject — admin rejects request and refunds coins
router.post('/admin/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { request_id, reason } = req.body;
    const reqRes = await pool.query('SELECT * FROM tree_requests WHERE id = $1', [request_id]);
    if (!reqRes.rows.length) return res.status(404).json({ success: false, message: 'Not found' });

    const request = reqRes.rows[0];
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: 'Not pending' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query('UPDATE tree_requests SET status = $1, admin_note = $2, updated_at = NOW() WHERE id = $3', ['rejected', reason || null, request_id]);

      // Refund coins
      await client.query('UPDATE users SET eco_coins = eco_coins + $1, updated_at = NOW() WHERE id = $2', [request.coins_spent, request.user_id]);
      await client.query(
        "INSERT INTO eco_coins_history (user_id, type, amount, description) VALUES ($1, 'earned', $2, $3)",
        [request.user_id, request.coins_spent, 'Возврат за отклонённый запрос посадки дерева']
      );

      // Notify user
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, 'system', $2, $3, $4)`,
        [request.user_id, '❌ Запрос на посадку отклонён', `Ваш запрос отклонён. ${reason || ''} Монеты возвращены.`, '/contribution']
      );

      await client.query('COMMIT');

      const io = req.app.get('io');
      if (io) io.to(`user:${request.user_id}`).emit('notification:new', { type: 'system', title: '❌ Запрос отклонён', message: 'Монеты возвращены.' });

      res.json({ success: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
