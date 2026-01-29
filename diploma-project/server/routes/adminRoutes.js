const express = require('express');
const router = express.Router();
const { pool, query, getClient } = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

// Rate limiting для админ-роутов
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Слишком много запросов. Попробуйте позже.'
});

router.use(adminLimiter);

// Валидация параметров
const validatePagination = (req, res, next) => {
  const { 
    page = 1, 
    limit = 20, 
    search = '', 
    sortBy = 'created_at', 
    sortOrder = 'DESC',
    is_admin,
    is_banned
  } = req.query;
  
  req.query.page = Math.max(1, parseInt(page));
  req.query.limit = Math.min(Math.max(1, parseInt(limit)), 100);
  req.query.search = String(search).substring(0, 100);
  req.query.sortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
  
  const validSortColumns = ['id', 'email', 'nickname', 'created_at', 'carbon_saved', 'eco_level', 'is_admin', 'is_banned'];
  req.query.sortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  
  // Обработка фильтров
  if (is_admin !== undefined) {
    req.query.is_admin = is_admin === 'true' ? true : (is_admin === 'false' ? false : null);
  } else {
    req.query.is_admin = null;
  }
  
  if (is_banned !== undefined) {
    req.query.is_banned = is_banned === 'true' ? true : (is_banned === 'false' ? false : null);
  } else {
    req.query.is_banned = null;
  }
  
  next();
};

// Получение статистики с исправленным запросом
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('=== STATS REQUEST ===');
    console.log('Admin user:', req.user);
    
    // Получаем общую статистику - исправленный запрос
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COALESCE(SUM(CASE WHEN is_admin = true THEN 1 ELSE 0 END), 0) as total_admins,
        COALESCE(SUM(CASE WHEN is_banned = true THEN 1 ELSE 0 END), 0) as total_banned
      FROM users 
      WHERE deleted_at IS NULL
    `;
    
    console.log('Executing stats query:', statsQuery);
    const statsResult = await query(statsQuery);
    console.log('Stats query result:', statsResult.rows[0]);
    
    // Также получаем список всех админов для отладки
    const adminsQuery = `
      SELECT id, email, nickname, is_admin, is_banned, created_at 
      FROM users 
      WHERE deleted_at IS NULL
      ORDER BY id
    `;
    
    const allUsersResult = await query(adminsQuery);
    console.log(`Total users in DB: ${allUsersResult.rowCount}`);
    
    // Логируем всех пользователей с их статусами
    console.log('All users with their status:');
    allUsersResult.rows.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, is_admin: ${user.is_admin}, is_banned: ${user.is_banned}`);
    });
    
    const stats = statsResult.rows[0];
    
    res.json({
      success: true,
      totalUsers: parseInt(stats.total_users) || 0,
      totalAdmins: parseInt(stats.total_admins) || 0,
      totalBanned: parseInt(stats.total_banned) || 0,
      debugInfo: {
        rawStats: stats,
        totalUsersInDB: allUsersResult.rowCount,
        sampleUsers: allUsersResult.rows.slice(0, 5) // Первые 5 для отладки
      }
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    console.error('Error stack:', error.stack);
    
    // Альтернативный способ - используем простой запрос
    try {
      console.log('Trying alternative stats query...');
      const simpleQuery = `
        SELECT 
          (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as total_users,
          (SELECT COUNT(*) FROM users WHERE is_admin = true AND deleted_at IS NULL) as total_admins,
          (SELECT COUNT(*) FROM users WHERE is_banned = true AND deleted_at IS NULL) as total_banned
      `;
      
      const simpleResult = await query(simpleQuery);
      const simpleStats = simpleResult.rows[0];
      
      res.json({
        success: true,
        totalUsers: parseInt(simpleStats.total_users) || 0,
        totalAdmins: parseInt(simpleStats.total_admins) || 0,
        totalBanned: parseInt(simpleStats.total_banned) || 0,
        note: 'Used alternative query method'
      });
      
    } catch (simpleError) {
      console.error('Alternative query also failed:', simpleError);
      
      res.status(500).json({
        success: false,
        message: 'Ошибка при загрузке статистики',
        error: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error.code,
          detail: error.detail
        } : undefined
      });
    }
  }
});

// Упрощенный endpoint для статистики (только цифры)
router.get('/simple-stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('=== SIMPLE STATS REQUEST ===');
    
    // Самый простой запрос
    const totalQuery = 'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL';
    const adminsQuery = 'SELECT COUNT(*) as count FROM users WHERE is_admin = true AND deleted_at IS NULL';
    const bannedQuery = 'SELECT COUNT(*) as count FROM users WHERE is_banned = true AND deleted_at IS NULL';
    
    const [totalResult, adminsResult, bannedResult] = await Promise.all([
      query(totalQuery),
      query(adminsQuery),
      query(bannedQuery)
    ]);
    
    const stats = {
      totalUsers: parseInt(totalResult.rows[0].count) || 0,
      totalAdmins: parseInt(adminsResult.rows[0].count) || 0,
      totalBanned: parseInt(bannedResult.rows[0].count) || 0
    };
    
    console.log('Simple stats result:', stats);
    
    // Проверяем данные вручную
    const checkQuery = 'SELECT id, email, is_admin, is_banned FROM users WHERE deleted_at IS NULL LIMIT 10';
    const checkResult = await query(checkQuery);
    
    console.log('Sample of first 10 users:');
    checkResult.rows.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Admin: ${user.is_admin}, Banned: ${user.is_banned}`);
    });
    
    res.json({
      success: true,
      ...stats
    });
    
  } catch (error) {
    console.error('Error in simple-stats:', error);
    
    // Возвращаем нули если ошибка
    res.json({
      success: true,
      totalUsers: 0,
      totalAdmins: 0,
      totalBanned: 0,
      error: 'Failed to load stats, using defaults'
    });
  }
});

// Полный запрос пользователей с фильтрами
router.get('/users', authenticateToken, isAdmin, validatePagination, async (req, res) => {
  try {
    console.log('=== FULL USERS REQUEST WITH FILTERS ===');
    console.log('Admin user:', req.user);
    console.log('Query params:', req.query);
    
    const { page, limit, search, sortBy, sortOrder, is_admin, is_banned } = req.query;
    const offset = (page - 1) * limit;
    
    let queryText = `
      SELECT 
        u.id, u.email, u.nickname, u.is_admin, u.is_banned, u.ban_reason,
        u.email_verified, u.carbon_saved, u.eco_level, u.avatar_emoji,
        u.created_at, u.updated_at
      FROM users u
      WHERE u.deleted_at IS NULL
    `;
    
    const queryParams = [];
    let paramCounter = 1;
    
    // Добавляем фильтр по поиску
    if (search) {
      queryText += ` AND (u.email ILIKE $${paramCounter} OR u.nickname ILIKE $${paramCounter})`;
      queryParams.push(`%${search}%`);
      paramCounter++;
    }
    
    // Добавляем фильтр по админскому статусу
    if (is_admin !== null && is_admin !== undefined) {
      queryText += ` AND u.is_admin = $${paramCounter}`;
      queryParams.push(is_admin);
      paramCounter++;
    }
    
    // Добавляем фильтр по бану
    if (is_banned !== null && is_banned !== undefined) {
      queryText += ` AND u.is_banned = $${paramCounter}`;
      queryParams.push(is_banned);
      paramCounter++;
    }
    
    // Добавляем сортировку
    queryText += ` ORDER BY u.${sortBy} ${sortOrder}`;
    
    // Добавляем пагинацию
    queryText += ` LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    queryParams.push(limit, offset);
    
    console.log('Full query with filters:', queryText);
    console.log('Query params:', queryParams);
    
    const usersResult = await query(queryText, queryParams);
    console.log('Found', usersResult.rows.length, 'users');
    
    // Получаем общее количество с учетом фильтров
    let countText = 'SELECT COUNT(*) FROM users u WHERE u.deleted_at IS NULL';
    const countParams = [];
    let countParamCounter = 1;
    
    if (search) {
      countText += ` AND (u.email ILIKE $${countParamCounter} OR u.nickname ILIKE $${countParamCounter})`;
      countParams.push(`%${search}%`);
      countParamCounter++;
    }
    
    if (is_admin !== null && is_admin !== undefined) {
      countText += ` AND u.is_admin = $${countParamCounter}`;
      countParams.push(is_admin);
      countParamCounter++;
    }
    
    if (is_banned !== null && is_banned !== undefined) {
      countText += ` AND u.is_banned = $${countParamCounter}`;
      countParams.push(is_banned);
      countParamCounter++;
    }
    
    console.log('Count query:', countText);
    console.log('Count params:', countParams);
    
    const countResult = await query(countText, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    // Форматируем даты
    const formattedUsers = usersResult.rows.map(user => ({
      ...user,
      created_at: user.created_at ? new Date(user.created_at).toISOString() : null,
      updated_at: user.updated_at ? new Date(user.updated_at).toISOString() : null
    }));
    
    res.json({
      success: true,
      users: formattedUsers,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
        hasMore: page < Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching users with filters:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке пользователей',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        detail: error.detail
      } : undefined
    });
  }
});

// Получение всех пользователей для статистики (без пагинации)
router.get('/all-users', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('=== ALL USERS FOR STATS ===');
    
    const queryText = `
      SELECT 
        id, email, nickname, is_admin, is_banned, carbon_saved, eco_level,
        created_at
      FROM users 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    
    const usersResult = await query(queryText);
    console.log('Found', usersResult.rows.length, 'users for stats');
    
    // Форматируем даты
    const formattedUsers = usersResult.rows.map(user => ({
      ...user,
      created_at: user.created_at ? new Date(user.created_at).toISOString() : null
    }));
    
    res.json({
      success: true,
      users: formattedUsers,
      total: usersResult.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching all users:', error);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке всех пользователей',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        detail: error.detail
      } : undefined
    });
  }
});

// Назначить/снять администратора
router.put('/users/:userId/admin', authenticateToken, isAdmin, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const userId = parseInt(req.params.userId);
    const { is_admin } = req.body;
    
    console.log('Admin toggle request:', { userId, is_admin, admin: req.user });
    
    if (is_admin === undefined || typeof is_admin !== 'boolean') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Неверные параметры запроса'
      });
    }
    
    // Проверяем, что пользователь не пытается изменить свои права
    if (req.user.id === userId) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Нельзя изменить свои права администратора'
      });
    }
    
    // Проверяем, что пользователь существует
    const userCheck = await client.query(
      'SELECT id, is_admin FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );
    
    if (userCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    const currentUser = userCheck.rows[0];
    
    // Если пользователь уже имеет такой статус, возвращаем сообщение
    if (currentUser.is_admin === is_admin) {
      await client.query('ROLLBACK');
      return res.json({
        success: true,
        message: is_admin ? 
          'Пользователь уже является администратором' : 
          'Пользователь уже не является администратором',
        user: currentUser
      });
    }
    
    // Обновляем статус
    const result = await client.query(
      `UPDATE users 
       SET is_admin = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, email, nickname, is_admin, is_banned`,
      [is_admin, userId]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: is_admin ? 
        'Пользователь назначен администратором' : 
        'Пользователь удален из администраторов',
      user: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating admin status:', error);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении прав администратора'
    });
  } finally {
    client.release();
  }
});

// Забанить/разбанить пользователя
router.put('/users/:userId/ban', authenticateToken, isAdmin, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const userId = parseInt(req.params.userId);
    const { is_banned, ban_reason, ban_duration } = req.body;
    
    console.log('Ban request:', { userId, is_banned, ban_reason, admin: req.user });
    
    if (is_banned === undefined || typeof is_banned !== 'boolean') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Неверные параметры запроса'
      });
    }
    
    // Проверяем, что пользователь не пытается забанить себя
    if (req.user.id === userId) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Нельзя заблокировать самого себя'
      });
    }
    
    // Проверяем, что пользователь существует и не является админом
    const userCheck = await client.query(
      'SELECT id, email, nickname, is_admin, is_banned FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );
    
    if (userCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    const currentUser = userCheck.rows[0];
    
    // Проверяем, что нельзя забанить администратора
    if (currentUser.is_admin && is_banned) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Нельзя заблокировать администратора'
      });
    }
    
    // Если пользователь уже имеет такой статус, возвращаем сообщение
    if (currentUser.is_banned === is_banned) {
      await client.query('ROLLBACK');
      return res.json({
        success: true,
        message: is_banned ? 
          'Пользователь уже заблокирован' : 
          'Пользователь уже разблокирован',
        user: currentUser
      });
    }
    
    // Подготавливаем данные для обновления
    const updateData = {
      is_banned,
      ban_reason: is_banned ? (ban_reason || 'Причина не указана') : null,
      updated_at: new Date()
    };
    
    // Если указана длительность бана, добавляем ее
    if (is_banned && ban_duration) {
      const banExpires = new Date();
      banExpires.setHours(banExpires.getHours() + parseInt(ban_duration));
      updateData.ban_expires_at = banExpires;
    } else if (!is_banned) {
      updateData.ban_expires_at = null;
    }
    
    // Обновляем пользователя
    const result = await client.query(
      `UPDATE users 
       SET is_banned = $1, ban_reason = $2, ban_expires_at = $3, updated_at = $4
       WHERE id = $5 
       RETURNING id, email, nickname, is_banned, ban_reason, ban_expires_at`,
      [
        updateData.is_banned,
        updateData.ban_reason,
        updateData.ban_expires_at,
        updateData.updated_at,
        userId
      ]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: is_banned ? 'Пользователь заблокирован' : 'Пользователь разблокирован',
      user: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating ban status:', error);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении статуса блокировки'
    });
  } finally {
    client.release();
  }
});

// Получить информацию о конкретном пользователе
router.get('/users/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const queryText = `
      SELECT 
        id, email, nickname, is_admin, is_banned, ban_reason,
        email_verified, carbon_saved, eco_level, avatar_emoji,
        created_at, updated_at, ban_expires_at
      FROM users 
      WHERE id = $1 AND deleted_at IS NULL
    `;
    
    const result = await query(queryText, [userId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    const user = result.rows[0];
    
    // Форматируем даты
    user.created_at = user.created_at ? new Date(user.created_at).toISOString() : null;
    user.updated_at = user.updated_at ? new Date(user.updated_at).toISOString() : null;
    user.ban_expires_at = user.ban_expires_at ? new Date(user.ban_expires_at).toISOString() : null;
    
    res.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке информации о пользователе'
    });
  }
});

// Debug endpoint для проверки структуры таблицы
router.get('/debug/db-structure', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('=== DB STRUCTURE DEBUG ===');
    
    // Получаем информацию о таблице users
    const tableQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    const tableResult = await query(tableQuery);
    
    // Получаем все данные из таблицы users
    const dataQuery = 'SELECT id, email, is_admin, is_banned FROM users WHERE deleted_at IS NULL ORDER BY id';
    const dataResult = await query(dataQuery);
    
    // Проверяем типы данных
    const sampleUser = dataResult.rows.length > 0 ? dataResult.rows[0] : null;
    const sampleTypes = sampleUser ? {
      id_type: typeof sampleUser.id,
      is_admin_type: typeof sampleUser.is_admin,
      is_admin_value: sampleUser.is_admin,
      is_banned_type: typeof sampleUser.is_banned,
      is_banned_value: sampleUser.is_banned
    } : null;
    
    res.json({
      success: true,
      tableStructure: tableResult.rows,
      usersData: {
        total: dataResult.rowCount,
        sample: dataResult.rows.slice(0, 10), // Первые 10 записей
        sampleTypes: sampleTypes
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('DB structure debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug error',
      error: error.message
    });
  }
});

// Тестовый endpoint для проверки счетчиков
router.get('/debug/counts', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('=== COUNTS DEBUG ===');
    
    const queries = [
      { name: 'total', query: 'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL' },
      { name: 'admins', query: 'SELECT COUNT(*) as count FROM users WHERE is_admin = true AND deleted_at IS NULL' },
      { name: 'banned', query: 'SELECT COUNT(*) as count FROM users WHERE is_banned = true AND deleted_at IS NULL' },
      { name: 'admins_alt', query: 'SELECT COUNT(*) as count FROM users WHERE is_admin AND deleted_at IS NULL' },
      { name: 'banned_alt', query: 'SELECT COUNT(*) as count FROM users WHERE is_banned AND deleted_at IS NULL' }
    ];
    
    const results = {};
    for (const q of queries) {
      const result = await query(q.query);
      results[q.name] = parseInt(result.rows[0].count);
    }
    
    // Также получаем несколько примеров пользователей
    const sampleQuery = 'SELECT id, email, is_admin, is_banned FROM users WHERE deleted_at IS NULL ORDER BY id LIMIT 5';
    const sampleResult = await query(sampleQuery);
    
    res.json({
      success: true,
      counts: results,
      sampleUsers: sampleResult.rows,
      note: 'is_admin = true vs is_admin (boolean check)'
    });
    
  } catch (error) {
    console.error('Counts debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug error',
      error: error.message
    });
  }
});

module.exports = router;