const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/authMiddleware');
const { notifyUserAboutAchievement } = require('../utils/notificationHelper');

// Auto-insert streak achievements
pool.query(`
  INSERT INTO achievements (code, name, description, category, icon, points, is_active, event_type, requirement_type, requirement_value)
  VALUES
    ('streak_7',   '7 дней подряд',   'Заходите в приложение 7 дней подряд',   'streak', '🔥', 50,  true, 'streak', 'count', 7),
    ('streak_30',  '30 дней подряд',  'Заходите в приложение 30 дней подряд',  'streak', '🔥', 150, true, 'streak', 'count', 30),
    ('streak_100', '100 дней подряд', 'Заходите в приложение 100 дней подряд', 'streak', '🏆', 500, true, 'streak', 'count', 100)
  ON CONFLICT (code) DO NOTHING
`).catch(() => {});

async function awardStreakAchievement(client, userId, code, io) {
  try {
    const ach = await client.query('SELECT id, name, icon FROM achievements WHERE code = $1', [code]);
    if (!ach.rows.length) return;
    const { id: achId, name, icon } = ach.rows[0];
    const exists = await client.query('SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2', [userId, achId]);
    if (exists.rows.length) return;
    await client.query('INSERT INTO user_achievements (user_id, achievement_id, progress, completed) VALUES ($1, $2, 1, true)', [userId, achId]);
    await notifyUserAboutAchievement(userId, name, icon || '🔥', achId, io);
  } catch (e) {
    console.error('awardStreakAchievement error:', e.message);
  }
}

// GET /api/streak — get current user streak
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT current_streak, max_streak, last_visit_date FROM user_streaks WHERE user_id = $1',
      [userId]
    );
    const streak = result.rows[0] || { current_streak: 0, max_streak: 0, last_visit_date: null };
    res.json({ success: true, ...streak });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

// POST /api/streak/ping — called on login/app open, updates streak
router.post('/ping', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const existing = await client.query(
      'SELECT current_streak, max_streak, last_visit_date FROM user_streaks WHERE user_id = $1',
      [userId]
    );

    let current_streak = 1;
    let max_streak = 1;
    let isNewDay = false;

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const lastDate = row.last_visit_date ? new Date(row.last_visit_date).toISOString().split('T')[0] : null;

      if (lastDate === today) {
        // Already visited today — no change
        await client.query('COMMIT');
        return res.json({
          success: true,
          current_streak: row.current_streak,
          max_streak: row.max_streak,
          already_visited: true
        });
      }

      isNewDay = true;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === yesterdayStr) {
        // Consecutive day
        current_streak = row.current_streak + 1;
      } else {
        // Streak broken
        current_streak = 1;
      }
      max_streak = Math.max(current_streak, row.max_streak || 0);

      await client.query(
        `UPDATE user_streaks SET current_streak = $1, max_streak = $2, last_visit_date = $3, updated_at = NOW()
         WHERE user_id = $4`,
        [current_streak, max_streak, today, userId]
      );
    } else {
      isNewDay = true;
      await client.query(
        `INSERT INTO user_streaks (user_id, current_streak, max_streak, last_visit_date)
         VALUES ($1, 1, 1, $2)`,
        [userId, today]
      );
    }

    await client.query('COMMIT');

    // Award streak achievements
    if (isNewDay) {
      const io = req.app.get('io');
      const achClient = await pool.connect();
      try {
        await achClient.query('BEGIN');
        if (current_streak >= 7)   await awardStreakAchievement(achClient, userId, 'streak_7', io);
        if (current_streak >= 30)  await awardStreakAchievement(achClient, userId, 'streak_30', io);
        if (current_streak >= 100) await awardStreakAchievement(achClient, userId, 'streak_100', io);
        await achClient.query('COMMIT');
      } catch (e) {
        await achClient.query('ROLLBACK');
      } finally {
        achClient.release();
      }
    }

    res.json({ success: true, current_streak, max_streak, is_new_day: isNewDay });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ success: false });
  } finally {
    client.release();
  }
});

module.exports = router;
