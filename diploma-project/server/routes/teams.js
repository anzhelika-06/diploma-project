const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'ecosteps',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecosteps',
  password: process.env.DB_PASSWORD || 'ecosteps_password',
  port: process.env.DB_PORT || 5432,
});

// Получить все команды
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        avatar_emoji,
        goal_description,
        goal_target,
        goal_current,
        carbon_saved,
        member_count,
        created_at
      FROM teams
      ORDER BY carbon_saved DESC
    `);

    res.json({
      success: true,
      teams: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения команд:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

// Получить команды пользователя (ДОЛЖЕН БЫТЬ ПЕРЕД /:id)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.avatar_emoji,
        t.goal_description,
        t.goal_target,
        t.goal_current,
        t.carbon_saved,
        t.member_count,
        t.created_at,
        tm.role
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = $1
      ORDER BY t.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      teams: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения команд пользователя:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

// Получить конкретную команду
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const teamResult = await pool.query(`
      SELECT 
        id,
        name,
        description,
        avatar_emoji,
        carbon_saved,
        member_count,
        created_at
      FROM teams
      WHERE id = $1
    `, [id]);

    if (teamResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'TEAM_NOT_FOUND'
      });
    }

    // Получить участников команды
    const membersResult = await pool.query(`
      SELECT 
        u.id,
        u.nickname,
        u.avatar_emoji,
        u.carbon_saved,
        tm.role,
        tm.joined_at
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
      ORDER BY tm.role DESC, tm.joined_at ASC
    `, [id]);

    res.json({
      success: true,
      team: teamResult.rows[0],
      members: membersResult.rows
    });
  } catch (error) {
    console.error('Ошибка получения команды:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

// Создать команду
router.post('/', async (req, res) => {
  try {
    const { name, description, avatar_emoji, goal_description, goal_target, userId } = req.body;

    if (!name || !userId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS'
      });
    }

    // Проверяем, существует ли команда с таким именем
    const existingTeam = await pool.query(
      'SELECT id FROM teams WHERE name = $1',
      [name]
    );

    if (existingTeam.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'TEAM_EXISTS'
      });
    }

    // Создаем команду
    const teamResult = await pool.query(`
      INSERT INTO teams (name, description, avatar_emoji, goal_description, goal_target, member_count)
      VALUES ($1, $2, $3, $4, $5, 1)
      RETURNING id, name, description, avatar_emoji, goal_description, goal_target, goal_current, carbon_saved, member_count, created_at
    `, [
      name, 
      description || null, 
      avatar_emoji || '🌱',
      goal_description || null,
      goal_target || 1000
    ]);

    const team = teamResult.rows[0];

    // Добавляем создателя как админа
    await pool.query(`
      INSERT INTO team_members (team_id, user_id, role)
      VALUES ($1, $2, 'admin')
    `, [team.id, userId]);

    res.json({
      success: true,
      team
    });
  } catch (error) {
    console.error('Ошибка создания команды:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

// Присоединиться к команде
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_USER_ID'
      });
    }

    // Проверяем, существует ли команда
    const teamResult = await pool.query(
      'SELECT id FROM teams WHERE id = $1',
      [id]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'TEAM_NOT_FOUND'
      });
    }

    // Проверяем, не состоит ли уже пользователь в команде
    const memberCheck = await pool.query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (memberCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'ALREADY_MEMBER'
      });
    }

    // Добавляем пользователя в команду
    await pool.query(`
      INSERT INTO team_members (team_id, user_id, role)
      VALUES ($1, $2, 'member')
    `, [id, userId]);

    res.json({
      success: true,
      message: 'Вы присоединились к команде'
    });
  } catch (error) {
    console.error('Ошибка присоединения к команде:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

// Покинуть команду
router.post('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_USER_ID'
      });
    }

    // Удаляем пользователя из команды
    const result = await pool.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'NOT_A_MEMBER'
      });
    }

    res.json({
      success: true,
      message: 'Вы покинули команду'
    });
  } catch (error) {
    console.error('Ошибка выхода из команды:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

// Обновить команду (только для админов)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, avatar_emoji, goal_description, goal_target, userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_USER_ID'
      });
    }

    // Проверяем, является ли пользователь админом команды
    const adminCheck = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'NOT_ADMIN'
      });
    }

    // Обновляем команду
    const result = await pool.query(`
      UPDATE teams 
      SET 
        name = $1,
        description = $2,
        avatar_emoji = $3,
        goal_description = $4,
        goal_target = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [name, description, avatar_emoji, goal_description, goal_target, id]);

    res.json({
      success: true,
      team: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка обновления команды:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

// Удалить команду (только для админов)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_USER_ID'
      });
    }

    // Проверяем, является ли пользователь админом команды
    const adminCheck = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'NOT_ADMIN'
      });
    }

    // Удаляем команду (участники удалятся автоматически через ON DELETE CASCADE)
    await pool.query('DELETE FROM teams WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Команда удалена'
    });
  } catch (error) {
    console.error('Ошибка удаления команды:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

// Удалить участника из команды (только для админов)
router.post('/:id/remove-member', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, memberId } = req.body;

    if (!userId || !memberId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS'
      });
    }

    // Проверяем, является ли пользователь админом команды
    const adminCheck = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'NOT_ADMIN'
      });
    }

    // Нельзя удалить самого себя
    if (userId === memberId) {
      return res.status(400).json({
        success: false,
        error: 'CANNOT_REMOVE_SELF'
      });
    }

    // Удаляем участника
    const result = await pool.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 RETURNING id',
      [id, memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'MEMBER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Участник удален'
    });
  } catch (error) {
    console.error('Ошибка удаления участника:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

module.exports = router;
