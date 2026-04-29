const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/authMiddleware');

const XP_PER_FEED = 30;
const COINS_PER_FEED = 10;
const XP_BASE = 100;
const HUNGER_DECAY_PER_DAY = 20;
const HAPPINESS_DECAY_PER_DAY = 15;
const XP_DECAY_PER_DAY = 5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function xpForLevel(level) {
  return Math.floor(XP_BASE * Math.pow(1.4, level - 1));
}

function applyDecay(pet) {
  // Frozen pets don't decay
  if (pet.is_frozen) return pet;

  const decayStart = pet.last_decay_at || pet.last_fed_at || pet.created_at;
  if (!decayStart) return pet;

  const now = new Date();
  const elapsedMs = now - new Date(decayStart);
  if (elapsedMs <= 0) return pet;

  const hungerLoss = Math.floor((elapsedMs / MS_PER_DAY) * HUNGER_DECAY_PER_DAY);
  const happinessLoss = Math.floor((elapsedMs / MS_PER_DAY) * HAPPINESS_DECAY_PER_DAY);
  const xpLoss = Math.floor((elapsedMs / MS_PER_DAY) * XP_DECAY_PER_DAY);

  if (hungerLoss <= 0 && happinessLoss <= 0 && xpLoss <= 0) {
    return pet;
  }

  return {
    ...pet,
    hunger: Math.max(0, pet.hunger - hungerLoss),
    happiness: Math.max(0, pet.happiness - happinessLoss),
    xp: Math.max(0, pet.xp - xpLoss),
    last_decay_at: now.toISOString()
  };
}

// GET /api/pet
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query('SELECT * FROM user_pets WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) return res.json({ success: true, pet: null });

    let petRow = result.rows[0];

    // Auto-unfreeze if vacation day has passed
    if (petRow.is_frozen && petRow.last_fed_at) {
      const vacationDate = new Date(petRow.last_fed_at).toDateString();
      const today = new Date().toDateString();
      if (vacationDate !== today) {
        // Vacation day is over — unfreeze and reset decay timer
        await pool.query(
          'UPDATE user_pets SET is_frozen=FALSE, last_decay_at=NOW(), updated_at=NOW() WHERE user_id=$1',
          [userId]
        );
        petRow = { ...petRow, is_frozen: false, last_decay_at: new Date().toISOString() };
      }
    }

    const pet = applyDecay(petRow);
    if (
      pet.hunger !== petRow.hunger ||
      pet.happiness !== petRow.happiness ||
      pet.xp !== petRow.xp
    ) {
      await pool.query(
        'UPDATE user_pets SET hunger=$1, happiness=$2, xp=$3, last_decay_at=$4, updated_at=NOW() WHERE user_id=$5',
        [pet.hunger, pet.happiness, pet.xp, pet.last_decay_at, userId]
      );
    }
    res.json({ success: true, pet });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/pet/choose
router.post('/choose', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { pet_type, name } = req.body;
    if (!['cat', 'fox', 'turtle'].includes(pet_type)) {
      return res.status(400).json({ success: false, error: 'Invalid pet type' });
    }
    const existing = await pool.query('SELECT id FROM user_pets WHERE user_id=$1', [userId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Pet already exists' });
    }
    const result = await pool.query(
      'INSERT INTO user_pets (user_id, pet_type, name, xp_to_next_level) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, pet_type, name || null, xpForLevel(1)]
    );
    res.json({ success: true, pet: result.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/pet/feed
router.post('/feed', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const petResult = await pool.query('SELECT * FROM user_pets WHERE user_id=$1', [userId]);
    if (petResult.rows.length === 0) return res.status(404).json({ success: false, error: 'No pet' });

    let pet = applyDecay(petResult.rows[0]);

    if (pet.last_fed_at) {
      const lastFed = new Date(pet.last_fed_at);
      const now = new Date();
      if (lastFed.toDateString() === now.toDateString()) {
        return res.status(400).json({ success: false, error: 'already_fed' });
      }
    }

    const userResult = await pool.query('SELECT eco_coins FROM users WHERE id=$1', [userId]);
    const coins = userResult.rows[0]?.eco_coins || 0;
    if (coins < COINS_PER_FEED) {
      return res.status(400).json({ success: false, error: 'not_enough_coins' });
    }

    let newXp = pet.xp + XP_PER_FEED;
    let newLevel = pet.level;
    let newXpToNext = pet.xp_to_next_level;

    while (newXp >= newXpToNext) {
      newXp -= newXpToNext;
      newLevel++;
      newXpToNext = xpForLevel(newLevel);
    }

    const newHunger = Math.min(100, pet.hunger + 40);
    const newHappiness = Math.min(100, pet.happiness + 30);

    await pool.query(
      'UPDATE user_pets SET xp=$1, level=$2, xp_to_next_level=$3, hunger=$4, happiness=$5, last_fed_at=NOW(), last_decay_at=NOW(), is_frozen=FALSE, updated_at=NOW() WHERE user_id=$6',
      [newXp, newLevel, newXpToNext, newHunger, newHappiness, userId]
    );

    await pool.query('UPDATE users SET eco_coins = eco_coins - $1 WHERE id=$2', [COINS_PER_FEED, userId]);
    await pool.query(
      "INSERT INTO eco_coins_history (user_id, type, amount, description) VALUES ($1, 'spent', $2, $3)",
      [userId, COINS_PER_FEED, 'Кормление питомца']
    );

    const updated = await pool.query('SELECT * FROM user_pets WHERE user_id=$1', [userId]);
    const newCoins = await pool.query('SELECT eco_coins FROM users WHERE id=$1', [userId]);

    res.json({
      success: true,
      pet: updated.rows[0],
      eco_coins: newCoins.rows[0].eco_coins,
      leveled_up: newLevel > pet.level,
      new_level: newLevel
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PATCH /api/pet/name
router.patch('/name', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid name' });
    }
    await pool.query('UPDATE user_pets SET name=$1, updated_at=NOW() WHERE user_id=$2', [name.trim(), userId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/pet/vacation — freeze pet for today (up to 3 times/month)
router.post('/vacation', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const petResult = await pool.query('SELECT * FROM user_pets WHERE user_id=$1', [userId]);
    if (petResult.rows.length === 0) return res.status(404).json({ success: false, error: 'No pet' });

    let pet = petResult.rows[0];

    // Auto-unfreeze if vacation day has passed (same logic as GET)
    if (pet.is_frozen && pet.last_fed_at) {
      const vacationDate = new Date(pet.last_fed_at).toDateString();
      const today = new Date().toDateString();
      if (vacationDate !== today) {
        await pool.query(
          'UPDATE user_pets SET is_frozen=FALSE, last_decay_at=NOW(), updated_at=NOW() WHERE user_id=$1',
          [userId]
        );
        pet = { ...pet, is_frozen: false };
      }
    }

    const currentMonth = new Date().getMonth() + 1;

    // Reset counter if new month
    let vacationUsed = pet.vacation_used_this_month || 0;
    if (pet.vacation_month !== currentMonth) {
      vacationUsed = 0;
    }

    if (vacationUsed >= 3) {
      return res.status(400).json({ success: false, error: 'vacation_limit_reached' });
    }

    if (pet.is_frozen) {
      return res.status(400).json({ success: false, error: 'already_on_vacation' });
    }

    // Check if vacation was already used today
    if (pet.vacation_date) {
      const vacDate = new Date(pet.vacation_date).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      if (vacDate === today) {
        return res.status(400).json({ success: false, error: 'already_on_vacation' });
      }
    }

    // Check if already fed today — can't go on vacation if already fed
    if (pet.last_fed_at) {
      const lastFed = new Date(pet.last_fed_at);
      const now = new Date();
      if (lastFed.toDateString() === now.toDateString()) {
        return res.status(400).json({ success: false, error: 'already_fed_today' });
      }
    }

    await pool.query(
      `UPDATE user_pets SET is_frozen=TRUE, vacation_used_this_month=$1, vacation_month=$2,
       last_fed_at=NOW(), last_decay_at=NOW(), updated_at=NOW() WHERE user_id=$3`,
      [vacationUsed + 1, currentMonth, userId]
    );

    // Сохраняем стрик — засчитываем день как посещённый
    const today = new Date().toISOString().split('T')[0];
    const streakResult = await pool.query(
      'SELECT current_streak, max_streak, last_visit_date FROM user_streaks WHERE user_id=$1',
      [userId]
    );
    if (streakResult.rows.length > 0) {
      const row = streakResult.rows[0];
      const lastDate = row.last_visit_date ? new Date(row.last_visit_date).toISOString().split('T')[0] : null;
      if (lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const newStreak = lastDate === yesterdayStr ? row.current_streak + 1 : 1;
        const newMax = Math.max(newStreak, row.max_streak || 0);
        await pool.query(
          'UPDATE user_streaks SET current_streak=$1, max_streak=$2, last_visit_date=$3, updated_at=NOW() WHERE user_id=$4',
          [newStreak, newMax, today, userId]
        );
      }
    } else {
      await pool.query(
        'INSERT INTO user_streaks (user_id, current_streak, max_streak, last_visit_date) VALUES ($1, 1, 1, $2)',
        [userId, today]
      );
    }

    const updated = await pool.query('SELECT * FROM user_pets WHERE user_id=$1', [userId]);
    res.json({
      success: true,
      pet: updated.rows[0],
      vacation_used: vacationUsed + 1,
      vacation_left: 3 - (vacationUsed + 1)
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/pet/unfreeze — called on next feed to unfreeze
// (unfreeze happens automatically when pet is fed)

module.exports = router;

// DELETE /api/pet — delete pet
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query('DELETE FROM user_pets WHERE user_id=$1', [userId]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/pet/revive — revive pet at 0 stats for 50 eco coins
router.post('/revive', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const petResult = await pool.query('SELECT * FROM user_pets WHERE user_id=$1', [userId]);
    if (!petResult.rows.length) return res.status(404).json({ success: false, error: 'No pet' });
    const pet = petResult.rows[0];
    if (pet.hunger > 0 || pet.happiness > 0) {
      return res.status(400).json({ success: false, error: 'pet_not_dead' });
    }
    const REVIVE_COST = 50;
    const userResult = await pool.query('SELECT eco_coins FROM users WHERE id=$1', [userId]);
    if ((userResult.rows[0]?.eco_coins || 0) < REVIVE_COST) {
      return res.status(400).json({ success: false, error: 'not_enough_coins' });
    }
    await pool.query(
      'UPDATE user_pets SET hunger=60, happiness=60, last_decay_at=NOW(), updated_at=NOW() WHERE user_id=$1', [userId]
    );
    await pool.query('UPDATE users SET eco_coins = eco_coins - $1 WHERE id=$2', [REVIVE_COST, userId]);
    await pool.query(
      "INSERT INTO eco_coins_history (user_id, type, amount, description) VALUES ($1, 'spent', $2, $3)",
      [userId, REVIVE_COST, 'Восстановление питомца']
    );
    const updated = await pool.query('SELECT * FROM user_pets WHERE user_id=$1', [userId]);
    const newCoins = await pool.query('SELECT eco_coins FROM users WHERE id=$1', [userId]);
    res.json({ success: true, pet: updated.rows[0], eco_coins: newCoins.rows[0].eco_coins });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});
