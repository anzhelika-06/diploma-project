const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/global-stats — global community statistics
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(carbon_saved), 0) FROM users) as total_carbon_saved,
        (SELECT COALESCE(SUM(trees_planted), 0) FROM users) as total_trees_planted,
        (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as total_users,
        (SELECT COUNT(*) FROM teams) as total_teams
    `);
    
    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
