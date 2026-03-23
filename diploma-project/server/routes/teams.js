const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { notifyUserAboutAchievement } = require('../utils/notificationHelper');

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
        goal_description,
        goal_target,
        goal_current,
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
        u.id AS user_id,
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
  const client = await pool.connect();
  
  try {
    const { name, description, avatar_emoji, goal_description, goal_target, creator_id } = req.body;

    // Валидация обязательных полей
    if (!name || !creator_id) {
      return res.status(400).json({
        success: false,
        message: 'Не указано название команды или создатель'
      });
    }

    if (!description || description.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Описание команды обязательно'
      });
    }

    if (!goal_description || goal_description.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Описание цели команды обязательно'
      });
    }

    if (!goal_target || goal_target <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Укажите цель сэкономленного CO2'
      });
    }

    if (!avatar_emoji || avatar_emoji.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Выберите иконку команды'
      });
    }

    await client.query('BEGIN');

    // Проверяем, существует ли команда с таким именем
    const existingTeam = await client.query(
      'SELECT id FROM teams WHERE name = $1',
      [name]
    );

    if (existingTeam.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Команда с таким названием уже существует'
      });
    }

    // Создаем команду
    const teamResult = await client.query(`
      INSERT INTO teams (name, description, avatar_emoji, goal_description, goal_target, member_count)
      VALUES ($1, $2, $3, $4, $5, 1)
      RETURNING id, name, description, avatar_emoji, goal_description, goal_target, goal_current, carbon_saved, member_count, created_at
    `, [
      name, 
      description, 
      avatar_emoji,
      goal_description,
      goal_target
    ]);

    const team = teamResult.rows[0];

    // Добавляем создателя как админа
    await client.query(`
      INSERT INTO team_members (team_id, user_id, role)
      VALUES ($1, $2, 'admin')
    `, [team.id, creator_id]);

    // Проверяем и начисляем достижение "Основатель"
    // Сначала получаем ID достижения
    const achievementInfo = await client.query(
      'SELECT id, points FROM achievements WHERE code = $1',
      ['team_creator']
    );

    if (achievementInfo.rows.length > 0) {
      const achievementId = achievementInfo.rows[0].id;
      const points = achievementInfo.rows[0].points;

      // Проверяем, есть ли уже это достижение
      const achievementCheck = await client.query(
        'SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
        [creator_id, achievementId]
      );

      if (achievementCheck.rows.length === 0) {
        // Начисляем достижение
        await client.query(`
          INSERT INTO user_achievements (user_id, achievement_id, progress, completed)
          VALUES ($1, $2, 1, true)
        `, [creator_id, achievementId]);

        // Получаем информацию о достижении для уведомления
        const achievementDetails = await client.query(
          'SELECT name, icon FROM achievements WHERE id = $1',
          [achievementId]
        );
        
        const achievementName = achievementDetails.rows[0]?.name || 'Основатель';
        const achievementIcon = achievementDetails.rows[0]?.icon || '🏗️';
        
        // Отправляем уведомление о достижении через helper
        const io = req.app.get('io');
        await notifyUserAboutAchievement(creator_id, achievementName, achievementIcon, achievementId, io);
      }
    }

    // Также проверяем достижение "Командный игрок" если это первая команда
    const teamCountResult = await client.query(
      'SELECT COUNT(*) as count FROM team_members WHERE user_id = $1',
      [creator_id]
    );
    const teamCount = parseInt(teamCountResult.rows[0].count);

    if (teamCount === 1) {
      // Получаем ID достижения
      const achievementInfo = await client.query(
        'SELECT id, points FROM achievements WHERE code = $1',
        ['first_team']
      );

      if (achievementInfo.rows.length > 0) {
        const achievementId = achievementInfo.rows[0].id;
        const points = achievementInfo.rows[0].points;

        // Проверяем, есть ли уже это достижение
        const firstTeamCheck = await client.query(
          'SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
          [creator_id, achievementId]
        );

        if (firstTeamCheck.rows.length === 0) {
          await client.query(`
            INSERT INTO user_achievements (user_id, achievement_id, progress, completed)
            VALUES ($1, $2, 1, true)
          `, [creator_id, achievementId]);

          // Получаем информацию о достижении для уведомления
          const achievementDetails = await client.query(
            'SELECT name, icon FROM achievements WHERE id = $1',
            [achievementId]
          );
          
          const achievementName = achievementDetails.rows[0]?.name || 'Командный игрок';
          const achievementIcon = achievementDetails.rows[0]?.icon || '👥';
          
          // Отправляем уведомление о достижении через helper
          const io = req.app.get('io');
          await notifyUserAboutAchievement(creator_id, achievementName, achievementIcon, achievementId, io);
        }
      }
    }

    await client.query('COMMIT');
    
    console.log('✅ Команда создана успешно:', team.id, team.name);

    // Отправляем WebSocket событие о создании команды
    try {
      const io = req.app.get('io');
      if (io) {
        console.log('📡 Отправка WebSocket события team:created');
        io.emit('team:created', {
          teamId: team.id,
          teamName: team.name,
          creatorId: creator_id,
          timestamp: new Date().toISOString()
        });
        console.log('✅ WebSocket событие отправлено');
      } else {
        console.warn('⚠️ WebSocket (io) не найден в req.app');
      }
    } catch (wsError) {
      console.error('❌ Ошибка отправки WebSocket события:', wsError);
      // Не прерываем выполнение, команда уже создана
    }

    res.json({
      success: true,
      team
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка создания команды:', error);
    console.error('   Стек ошибки:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Присоединиться к команде
router.post('/:id/join', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'Не указан ID пользователя'
      });
    }

    await client.query('BEGIN');

    // Проверяем, существует ли команда
    const teamResult = await client.query(
      'SELECT id, name FROM teams WHERE id = $1',
      [id]
    );

    if (teamResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Команда не найдена'
      });
    }

    const team = teamResult.rows[0];

    // Проверяем, не состоит ли уже пользователь в команде
    const memberCheck = await client.query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (memberCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Вы уже состоите в этой команде'
      });
    }

    // Добавляем пользователя в команду
    await client.query(`
      INSERT INTO team_members (team_id, user_id, role)
      VALUES ($1, $2, 'member')
    `, [id, user_id]);

    // Обновляем счетчик участников
    await client.query(
      'UPDATE teams SET member_count = (SELECT COUNT(*) FROM team_members WHERE team_id = $1) WHERE id = $1',
      [id]
    );

    // Получаем информацию о пользователе
    const userResult = await client.query(
      'SELECT nickname FROM users WHERE id = $1',
      [user_id]
    );
    const userNickname = userResult.rows[0]?.nickname || 'Пользователь';

    // Получаем админа команды для отправки уведомления
    const adminResult = await client.query(
      'SELECT user_id FROM team_members WHERE team_id = $1 AND role = $2',
      [id, 'admin']
    );

    if (adminResult.rows.length > 0) {
      const adminId = adminResult.rows[0].user_id;
      
      // Отправляем уведомление админу
      await client.query(`
        INSERT INTO notifications (user_id, type, title, message, related_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        adminId,
        'team_member_joined',
        'Новый участник команды',
        `${userNickname} присоединился к вашей команде "${team.name}"`,
        id
      ]);
    }

    // Проверяем и начисляем достижения
    // 1. Достижение "Командный игрок" - первая команда
    const teamCountResult = await client.query(
      'SELECT COUNT(*) as count FROM team_members WHERE user_id = $1',
      [user_id]
    );
    const teamCount = parseInt(teamCountResult.rows[0].count);

    if (teamCount === 1) {
      // Получаем ID достижения
      const achievementInfo = await client.query(
        'SELECT id, points FROM achievements WHERE code = $1',
        ['first_team']
      );

      if (achievementInfo.rows.length > 0) {
        const achievementId = achievementInfo.rows[0].id;
        const points = achievementInfo.rows[0].points;

        // Проверяем, есть ли уже это достижение
        const achievementCheck = await client.query(
          'SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
          [user_id, achievementId]
        );

        if (achievementCheck.rows.length === 0) {
          // Начисляем достижение
          await client.query(`
            INSERT INTO user_achievements (user_id, achievement_id, progress, completed)
            VALUES ($1, $2, 1, true)
          `, [user_id, achievementId]);

          // Получаем информацию о достижении для уведомления
          const achievementDetails = await client.query(
            'SELECT name, icon FROM achievements WHERE id = $1',
            [achievementId]
          );
          
          const achievementName = achievementDetails.rows[0]?.name || 'Командный игрок';
          const achievementIcon = achievementDetails.rows[0]?.icon || '👥';
          
          // Отправляем уведомление о достижении через helper
          const io = req.app.get('io');
          await notifyUserAboutAchievement(user_id, achievementName, achievementIcon, achievementId, io);
        }
      }
    }

    // 2. Достижение "Коллективист" - 5 команд
    if (teamCount === 5) {
      // Получаем ID достижения
      const achievementInfo = await client.query(
        'SELECT id, points FROM achievements WHERE code = $1',
        ['team_5']
      );

      if (achievementInfo.rows.length > 0) {
        const achievementId = achievementInfo.rows[0].id;
        const points = achievementInfo.rows[0].points;

        // Проверяем, есть ли уже это достижение
        const achievementCheck = await client.query(
          'SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
          [user_id, achievementId]
        );

        if (achievementCheck.rows.length === 0) {
          await client.query(`
            INSERT INTO user_achievements (user_id, achievement_id, progress, completed)
            VALUES ($1, $2, 5, true)
          `, [user_id, achievementId]);

          // Получаем информацию о достижении для уведомления
          const achievementDetails = await client.query(
            'SELECT name, icon FROM achievements WHERE id = $1',
            [achievementId]
          );
          
          const achievementName = achievementDetails.rows[0]?.name || 'Коллективист';
          const achievementIcon = achievementDetails.rows[0]?.icon || '🤝';
          
          // Отправляем уведомление о достижении через helper
          const io = req.app.get('io');
          await notifyUserAboutAchievement(user_id, achievementName, achievementIcon, achievementId, io);
        }
      }
    }

    await client.query('COMMIT');

    // Отправляем WebSocket событие о вступлении в команду
    const io = req.app.get('io');
    if (io) {
      // Уведомляем всех участников команды
      io.emit('team:member:joined', {
        teamId: id,
        teamName: team.name,
        userId: user_id,
        userNickname: userNickname,
        timestamp: new Date().toISOString()
      });
      
      // Уведомляем конкретного админа
      if (adminResult.rows.length > 0) {
        io.to(`user:${adminResult.rows[0].user_id}`).emit('team:new:member', {
          teamId: id,
          teamName: team.name,
          userId: user_id,
          userNickname: userNickname
        });
      }
    }

    res.json({
      success: true,
      message: 'Вы присоединились к команде'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка присоединения к команде:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  } finally {
    client.release();
  }
});

// Покинуть команду
router.post('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'Не указан ID пользователя'
      });
    }

    // Получаем информацию о команде и пользователе
    const teamResult = await pool.query('SELECT name FROM teams WHERE id = $1', [id]);
    const userResult = await pool.query('SELECT nickname FROM users WHERE id = $1', [user_id]);
    
    const teamName = teamResult.rows[0]?.name || 'Команда';
    const userNickname = userResult.rows[0]?.nickname || 'Пользователь';

    // Проверяем роль — админ не может покинуть команду
    const roleCheck = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, user_id]
    );
    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Вы не состоите в этой команде' });
    }
    if (roleCheck.rows[0].role === 'admin') {
      return res.status(403).json({ success: false, message: 'Администратор не может покинуть команду' });
    }

    // Удаляем пользователя из команды
    const result = await pool.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 RETURNING id',
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Вы не состоите в этой команде'
      });
    }
    // Обновляем счетчик участников
    await pool.query(
      'UPDATE teams SET member_count = (SELECT COUNT(*) FROM team_members WHERE team_id = $1) WHERE id = $1',
      [id]
    );

    // Отправляем WebSocket событие о выходе из команды
    const io = req.app.get('io');
    if (io) {
      io.emit('team:member:left', {
        teamId: id,
        teamName: teamName,
        userId: user_id,
        userNickname: userNickname,
        timestamp: new Date().toISOString()
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
      message: 'Ошибка сервера'
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

    // Получаем информацию о команде перед удалением
    const teamResult = await pool.query('SELECT name FROM teams WHERE id = $1', [id]);
    const teamName = teamResult.rows[0]?.name || 'Команда';

    // Удаляем команду (участники удалятся автоматически через ON DELETE CASCADE)
    await pool.query('DELETE FROM teams WHERE id = $1', [id]);

    // Отправляем WebSocket событие об удалении команды
    const io = req.app.get('io');
    if (io) {
      io.emit('team:deleted', {
        teamId: id,
        teamName: teamName,
        deletedBy: userId,
        timestamp: new Date().toISOString()
      });
    }

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

// Получить участников команды
router.get('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        u.id as user_id,
        u.nickname,
        u.avatar_emoji,
        u.carbon_saved,
        u.eco_level,
        tm.role,
        tm.joined_at
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
      ORDER BY tm.role DESC, tm.joined_at ASC
    `, [id]);

    res.json({
      success: true,
      members: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения участников:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});

// Удалить участника из команды (только для админов) - новый эндпоинт
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const { id, memberId } = req.params;

    // Удаляем участника
    const result = await pool.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 AND role != \'admin\' RETURNING id',
      [id, memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'MEMBER_NOT_FOUND'
      });
    }

    // Обновляем счетчик участников
    await pool.query(
      'UPDATE teams SET member_count = (SELECT COUNT(*) FROM team_members WHERE team_id = $1) WHERE id = $1',
      [id]
    );

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

    // Обновляем счётчик участников
    await pool.query(
      'UPDATE teams SET member_count = (SELECT COUNT(*) FROM team_members WHERE team_id = $1) WHERE id = $1',
      [id]
    );

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
