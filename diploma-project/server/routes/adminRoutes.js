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
    sortBy = 'id', 
    sortOrder = 'ASC',
    is_admin,
    is_banned
  } = req.query;
  
  req.query.page = Math.max(1, parseInt(page));
  req.query.limit = Math.min(Math.max(1, parseInt(limit)), 100);
  req.query.search = String(search).substring(0, 100);
  req.query.sortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';
  
  const validSortColumns = ['id', 'email', 'nickname', 'created_at', 'carbon_saved', 'eco_level', 'is_admin', 'is_banned'];
  req.query.sortBy = validSortColumns.includes(sortBy) ? sortBy : 'id';
  
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

// ============ ПОДДЕРЖКА: Получение списка обращений ============
router.get('/support/tickets', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = 'pending' } = req.query;
    const offset = (page - 1) * limit;
    
    let queryText = `
      SELECT 
        st.*,
        u.email as user_email,
        u.nickname as user_nickname
      FROM support_tickets st
      LEFT JOIN users u ON st.user_id = u.id
      WHERE u.deleted_at IS NULL
    `;
    
    const queryParams = [];
    let paramCounter = 1;
    
    // Добавляем фильтр по статусу
    if (status && status !== 'all') {
      queryText += ` AND st.status = $${paramCounter}`;
      queryParams.push(status);
      paramCounter++;
    }
    
    // Добавляем фильтр по поиску
    if (search) {
      queryText += ` AND (
        st.subject ILIKE $${paramCounter} OR 
        st.message ILIKE $${paramCounter} OR 
        u.email ILIKE $${paramCounter} OR
        u.nickname ILIKE $${paramCounter} OR
        st.ticket_number ILIKE $${paramCounter}
      )`;
      queryParams.push(`%${search}%`);
      paramCounter++;
    }
    
    // Добавляем сортировку
    queryText += ` ORDER BY st.created_at DESC`;
    
    // Добавляем пагинацию
    queryText += ` LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    queryParams.push(limit, offset);
    
    console.log('Support tickets query:', { queryText, queryParams });
    
    const ticketsResult = await query(queryText, queryParams);
    console.log('Found', ticketsResult.rows.length, 'support tickets');
    
    // Получаем общее количество с учетом фильтров
    let countText = `
      SELECT COUNT(*) 
      FROM support_tickets st
      LEFT JOIN users u ON st.user_id = u.id
      WHERE u.deleted_at IS NULL
    `;
    
    const countParams = [];
    let countParamCounter = 1;
    
    if (status && status !== 'all') {
      countText += ` AND st.status = $${countParamCounter}`;
      countParams.push(status);
      countParamCounter++;
    }
    
    if (search) {
      countText += ` AND (
        st.subject ILIKE $${countParamCounter} OR 
        st.message ILIKE $${countParamCounter} OR 
        u.email ILIKE $${countParamCounter} OR
        u.nickname ILIKE $${countParamCounter} OR
        st.ticket_number ILIKE $${countParamCounter}
      )`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await query(countText, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    // Форматируем даты
    const formattedTickets = ticketsResult.rows.map(ticket => ({
      ...ticket,
      created_at: ticket.created_at ? new Date(ticket.created_at).toISOString() : null,
      updated_at: ticket.updated_at ? new Date(ticket.updated_at).toISOString() : null,
      responded_at: ticket.responded_at ? new Date(ticket.responded_at).toISOString() : null
    }));
    
    res.json({
      success: true,
      tickets: formattedTickets,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
        hasMore: page < Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке обращений',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        detail: error.detail
      } : undefined
    });
  }
});

// ============ ПОДДЕРЖКА: Ответ на обращение ============
router.post('/support/tickets/:ticketId/respond', authenticateToken, isAdmin, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const ticketId = parseInt(req.params.ticketId);
    const { response, status = 'answered' } = req.body;
    
    console.log('=== RESPOND TO TICKET REQUEST ===');
    console.log('Ticket ID:', ticketId, 'Admin:', req.user.id);
    console.log('Response data:', { response, status });
    
    // Проверяем входные данные
    if (!response || typeof response !== 'string' || response.trim().length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Введите текст ответа'
      });
    }
    
    if (response.length > 2000) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Ответ слишком длинный (макс. 2000 символов)'
      });
    }
    
    // Проверяем существование обращения
    const ticketCheck = await client.query(
      `SELECT st.*, u.email as user_email, u.nickname as user_nickname 
       FROM support_tickets st
       LEFT JOIN users u ON st.user_id = u.id
       WHERE st.id = $1 AND u.deleted_at IS NULL`,
      [ticketId]
    );
    
    if (ticketCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Обращение не найдено'
      });
    }
    
    const currentTicket = ticketCheck.rows[0];
    
    // Обновляем обращение
    const updateResult = await client.query(
      `UPDATE support_tickets 
       SET admin_response = $1, 
           status = $2,
           responded_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING id, ticket_number, subject, status, admin_response, responded_at, created_at, updated_at`,
      [response.trim(), status, ticketId]
    );
    
    const updatedTicket = updateResult.rows[0];
    
    // Получаем информацию о пользователе для логирования
    const userInfo = await client.query(
      'SELECT id, email, nickname FROM users WHERE id = $1',
      [currentTicket.user_id]
    );
    
    const user = userInfo.rows[0] || {};
    
    await client.query('COMMIT');
    
    console.log('Response sent successfully:', {
      ticketId: updatedTicket.id,
      ticketNumber: updatedTicket.ticket_number,
      userId: currentTicket.user_id,
      userEmail: user.email,
      adminId: req.user.id
    });
    
    // TODO: Здесь можно добавить отправку email уведомления пользователю
    
    res.json({
      success: true,
      message: 'Ответ успешно отправлен',
      ticket: {
        ...updatedTicket,
        created_at: updatedTicket.created_at ? new Date(updatedTicket.created_at).toISOString() : null,
        updated_at: updatedTicket.updated_at ? new Date(updatedTicket.updated_at).toISOString() : null,
        responded_at: updatedTicket.responded_at ? new Date(updatedTicket.responded_at).toISOString() : null,
        user_email: user.email,
        user_nickname: user.nickname
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error responding to ticket:', error);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка при отправке ответа',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

// ============ ПОДДЕРЖКА: Закрытие обращения ============
router.post('/support/tickets/:ticketId/close', authenticateToken, isAdmin, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const ticketId = parseInt(req.params.ticketId);
    
    console.log('=== CLOSE TICKET REQUEST ===');
    console.log('Ticket ID:', ticketId, 'Admin:', req.user.id);
    
    // Проверяем существование обращения
    const ticketCheck = await client.query(
      `SELECT st.*, u.email as user_email, u.nickname as user_nickname 
       FROM support_tickets st
       LEFT JOIN users u ON st.user_id = u.id
       WHERE st.id = $1 AND u.deleted_at IS NULL`,
      [ticketId]
    );
    
    if (ticketCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Обращение не найдено'
      });
    }
    
    const currentTicket = ticketCheck.rows[0];
    
    // Обновляем обращение
    const updateResult = await client.query(
      `UPDATE support_tickets 
       SET status = 'closed',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING id, ticket_number, subject, status, created_at, updated_at`,
      [ticketId]
    );
    
    const updatedTicket = updateResult.rows[0];
    
    await client.query('COMMIT');
    
    console.log('Ticket closed successfully:', {
      ticketId: updatedTicket.id,
      ticketNumber: updatedTicket.ticket_number
    });
    
    res.json({
      success: true,
      message: 'Обращение успешно закрыто',
      ticket: {
        ...updatedTicket,
        created_at: updatedTicket.created_at ? new Date(updatedTicket.created_at).toISOString() : null,
        updated_at: updatedTicket.updated_at ? new Date(updatedTicket.updated_at).toISOString() : null,
        user_email: currentTicket.user_email,
        user_nickname: currentTicket.user_nickname
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error closing ticket:', error);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка при закрытии обращения',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

// ============ ПОДДЕРЖКА: Получение конкретного обращения ============
router.get('/support/tickets/:ticketId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    
    const queryText = `
      SELECT 
        st.*,
        u.email as user_email,
        u.nickname as user_nickname
      FROM support_tickets st
      LEFT JOIN users u ON st.user_id = u.id
      WHERE st.id = $1 AND u.deleted_at IS NULL
    `;
    
    const result = await query(queryText, [ticketId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Обращение не найдено'
      });
    }
    
    const ticket = result.rows[0];
    
    // Форматируем даты
    ticket.created_at = ticket.created_at ? new Date(ticket.created_at).toISOString() : null;
    ticket.updated_at = ticket.updated_at ? new Date(ticket.updated_at).toISOString() : null;
    ticket.responded_at = ticket.responded_at ? new Date(ticket.responded_at).toISOString() : null;
    
    res.json({
      success: true,
      ticket
    });
    
  } catch (error) {
    console.error('Error fetching ticket:', error);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке информации об обращении'
    });
  }
});
// ========== Получение деталей бана пользователя ==========
router.get('/users/:userId/ban-details', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    console.log('=== BAN DETAILS REQUEST ===');
    console.log('User ID:', userId, 'Admin:', req.user.id);
    
    // Проверяем существование пользователя
    const userCheck = await query(
      'SELECT id, email, nickname, is_banned, ban_reason, ban_expires_at, ban_count FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );
    
    if (userCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    const user = userCheck.rows[0];
    
    // Если пользователь не забанен, возвращаем пустые данные
    if (!user.is_banned) {
      return res.json({
        success: true,
        banDetails: {
          is_banned: false,
          is_permanent: false,
          expires_at: null,
          reason: null,
          created_at: null,
          ban_id: null
        }
      });
    }
    
    // Получаем детали из таблицы ban_history
    let banDetails = {
      is_banned: true,
      is_permanent: !user.ban_expires_at,
      expires_at: user.ban_expires_at ? new Date(user.ban_expires_at).toISOString() : null,
      reason: user.ban_reason || 'Причина не указана',
      created_at: null,
      ban_id: null
    };
    
    try {
      // Пытаемся получить более подробную информацию из ban_history
      const historyQuery = `
        SELECT 
          bh.id as ban_id,
          bh.reason,
          bh.duration_hours,
          bh.is_permanent,
          bh.created_at,
          bh.created_by,
          u.email as admin_email,
          bh.unbanned_at,
          bh.unban_reason
        FROM ban_history bh
        LEFT JOIN users u ON bh.created_by = u.id
        WHERE bh.user_id = $1 AND bh.unbanned_at IS NULL
        ORDER BY bh.created_at DESC
        LIMIT 1
      `;
      
      const historyResult = await query(historyQuery, [userId]);
      
      if (historyResult.rowCount > 0) {
        const history = historyResult.rows[0];
        banDetails = {
          ...banDetails,
          ban_id: history.ban_id,
          reason: history.reason || banDetails.reason,
          is_permanent: history.is_permanent || banDetails.is_permanent,
          created_at: history.created_at ? new Date(history.created_at).toISOString() : null,
          created_by: history.created_by,
          admin_email: history.admin_email
        };
      } else {
        // Если записи в истории нет, создаем примерные данные на основе полей пользователя
        banDetails = {
          ...banDetails,
          ban_id: `temp_${userId}`,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 часа назад
          created_by: req.user.id,
          admin_email: req.user.email
        };
      }
    } catch (historyError) {
      console.log('Could not fetch ban history details:', historyError.message);
      // Используем базовые данные из пользователя
      banDetails = {
        ...banDetails,
        ban_id: `temp_${userId}`,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        created_by: req.user.id,
        admin_email: req.user.email
      };
    }
    
    res.json({
      success: true,
      banDetails: banDetails
    });
    
  } catch (error) {
    console.error('Error fetching ban details:', error);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке деталей бана',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// ========== История банов пользователя ==========
router.get('/users/:userId/ban-history', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    console.log('=== BAN HISTORY REQUEST ===');
    console.log('User ID:', userId, 'Admin:', req.user.id);
    
    // Проверяем существование пользователя
    const userCheck = await query(
      'SELECT id, email FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );
    
    if (userCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    // Получаем историю банов из таблицы ban_history (если она существует)
    // ИЛИ получаем из поля ban_count в users
    let banHistory = [];
    let totalBans = 0;
    
    try {
      // Пытаемся получить из таблицы ban_history
      const historyQuery = `
        SELECT 
          bh.id,
          bh.user_id,
          bh.reason,
          bh.duration_hours,
          bh.is_permanent,
          bh.created_by,
          bh.created_at,
          u.email as admin_email,
          bh.unbanned_at,
          bh.unbanned_by,
          bh.unban_reason
        FROM ban_history bh
        LEFT JOIN users u ON bh.created_by = u.id
        WHERE bh.user_id = $1
        ORDER BY bh.created_at DESC
      `;
      
      const historyResult = await query(historyQuery, [userId]);
      
      if (historyResult.rowCount > 0) {
        banHistory = historyResult.rows;
        totalBans = banHistory.filter(ban => !ban.unbanned_at).length; // Только активные баны
      } else {
        // Если таблицы нет, используем поле ban_count из users
        const userQuery = await query(
          'SELECT ban_count FROM users WHERE id = $1',
          [userId]
        );
        
        totalBans = userQuery.rows[0]?.ban_count || 0;
        
        // Создаем историю из текущих данных пользователя
        if (totalBans > 0) {
          const currentUserQuery = await query(
            'SELECT is_banned, ban_reason, ban_expires_at FROM users WHERE id = $1',
            [userId]
          );
          
          const user = currentUserQuery.rows[0];
          if (user.is_banned) {
            banHistory = [{
              id: 1,
              user_id: userId,
              reason: user.ban_reason || 'Причина не указана',
              duration_hours: null,
              is_permanent: !user.ban_expires_at,
              created_at: new Date().toISOString(),
              created_by: req.user.id,
              admin_email: req.user.email
            }];
          }
        }
      }
    } catch (error) {
      console.log('Ban history table not found, using user ban_count:', error.message);
      
      // Используем поле ban_count из users
      const userQuery = await query(
        'SELECT ban_count, is_banned, ban_reason FROM users WHERE id = $1',
        [userId]
      );
      
      totalBans = userQuery.rows[0]?.ban_count || 0;
      
      // Создаем фиктивную историю
      if (userQuery.rows[0]?.is_banned) {
        banHistory = [{
          id: 1,
          user_id: userId,
          reason: userQuery.rows[0].ban_reason || 'Причина не указана',
          duration_hours: null,
          is_permanent: false,
          created_at: new Date().toISOString(),
          created_by: req.user.id,
          admin_email: req.user.email
        }];
      }
    }
    
    res.json({
      success: true,
      totalBans: totalBans,
      banHistory: banHistory.map(ban => ({
        ...ban,
        created_at: ban.created_at ? new Date(ban.created_at).toISOString() : null,
        unbanned_at: ban.unbanned_at ? new Date(ban.unbanned_at).toISOString() : null
      }))
    });
    
  } catch (error) {
    console.error('Error fetching ban history:', error);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке истории банов',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========== Бан пользователя (POST с историей) ==========
router.post('/users/:userId/ban', authenticateToken, isAdmin, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const userId = parseInt(req.params.userId);
    const { reason, duration_hours, is_permanent } = req.body;
    
    console.log('=== BAN USER REQUEST (POST) ===');
    console.log('User ID:', userId, 'Admin:', req.user.id);
    console.log('Ban data:', { reason, duration_hours, is_permanent });
    
    // Проверяем входные данные
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Укажите причину бана'
      });
    }
    
    if (reason.length > 500) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Причина бана слишком длинная (макс. 500 символов)'
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
    
    // Проверяем существование пользователя и его статус
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
    if (currentUser.is_admin) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Нельзя заблокировать администратора'
      });
    }
    
    // Проверяем, не забанен ли уже пользователь
    if (currentUser.is_banned) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Пользователь уже заблокирован'
      });
    }
    
    // Подготавливаем данные для бана
    const banExpiresAt = is_permanent ? null : 
      duration_hours ? 
        new Date(Date.now() + (parseInt(duration_hours) * 60 * 60 * 1000)) : 
        new Date(Date.now() + (24 * 60 * 60 * 1000)); // По умолчанию 24 часа
    
    // Обновляем пользователя
    const updateResult = await client.query(
      `UPDATE users 
       SET is_banned = true, 
           ban_reason = $1,
           ban_expires_at = $2,
           ban_count = COALESCE(ban_count, 0) + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING id, email, nickname, is_banned, ban_reason, ban_expires_at, ban_count`,
      [reason, banExpiresAt, userId]
    );
    
    const updatedUser = updateResult.rows[0];
    
    // Записываем в историю банов
    try {
      // Проверяем существование таблицы ban_history
      await client.query(`
        CREATE TABLE IF NOT EXISTS ban_history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          reason TEXT NOT NULL,
          duration_hours INTEGER,
          is_permanent BOOLEAN DEFAULT false,
          created_by INTEGER NOT NULL REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          unbanned_at TIMESTAMP,
          unbanned_by INTEGER REFERENCES users(id),
          unban_reason TEXT
        )
      `);
      
      // Вставляем запись в историю
      await client.query(
        `INSERT INTO ban_history 
         (user_id, reason, duration_hours, is_permanent, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, reason, duration_hours || 24, is_permanent || false, req.user.id]
      );
    } catch (historyError) {
      console.log('Could not write to ban_history table:', historyError.message);
      // Продолжаем без истории
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Пользователь успешно заблокирован',
      user: updatedUser,
      was_banned: currentUser.is_banned // Для статистики
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error banning user:', error);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка при блокировке пользователя',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

// ========== Разбан пользователя ==========
router.post('/users/:userId/unban', authenticateToken, isAdmin, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const userId = parseInt(req.params.userId);
    
    console.log('=== UNBAN USER REQUEST ===');
    console.log('User ID:', userId, 'Admin:', req.user.id);
    
    // Проверяем существование пользователя
    const userCheck = await client.query(
      'SELECT id, email, nickname, is_banned FROM users WHERE id = $1 AND deleted_at IS NULL',
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
    
    // Проверяем, что пользователь забанен
    if (!currentUser.is_banned) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Пользователь не заблокирован'
      });
    }
    
    // Обновляем пользователя
    const updateResult = await client.query(
      `UPDATE users 
       SET is_banned = false, 
           ban_reason = NULL,
           ban_expires_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING id, email, nickname, is_banned`,
      [userId]
    );
    
    const updatedUser = updateResult.rows[0];
    
    // Обновляем историю банов (помечаем как разбаненного)
    try {
      // Находим последний активный бан
      const lastBanResult = await client.query(
        `SELECT id FROM ban_history 
         WHERE user_id = $1 AND unbanned_at IS NULL
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
      
      if (lastBanResult.rowCount > 0) {
        await client.query(
          `UPDATE ban_history 
           SET unbanned_at = CURRENT_TIMESTAMP,
               unbanned_by = $1,
               unban_reason = 'Разбанен администратором'
           WHERE id = $2`,
          [req.user.id, lastBanResult.rows[0].id]
        );
      }
    } catch (historyError) {
      console.log('Could not update ban_history:', historyError.message);
      // Продолжаем без обновления истории
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Пользователь успешно разблокирован',
      user: updatedUser
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error unbanning user:', error);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка при разблокировке пользователя',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

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
    
    // Получаем общее количество банов
    let totalBans = 0;
    try {
      // Пытаемся получить из истории банов
      const bansQuery = await query('SELECT COUNT(*) as count FROM ban_history');
      totalBans = parseInt(bansQuery.rows[0]?.count) || 0;
    } catch (bansError) {
      // Если таблицы нет, используем сумму ban_count из users
      console.log('Ban history table not available, using user ban_count:', bansError.message);
      const userBansQuery = await query('SELECT COALESCE(SUM(ban_count), 0) as total FROM users WHERE deleted_at IS NULL');
      totalBans = parseInt(userBansQuery.rows[0]?.total) || 0;
    }
    
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
      totalBans: totalBans,
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
        totalBans: 0,
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
    
    // Самый простой запрос для пользователей
    const totalQuery = 'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL';
    const adminsQuery = 'SELECT COUNT(*) as count FROM users WHERE is_admin = true AND deleted_at IS NULL';
    const bannedQuery = 'SELECT COUNT(*) as count FROM users WHERE is_banned = true AND deleted_at IS NULL';
    const bansQuery = 'SELECT COALESCE(SUM(ban_count), 0) as total FROM users WHERE deleted_at IS NULL';
    
    // Статистика по обращениям - ВСЕ статусы независимо от фильтров
    const pendingTicketsQuery = "SELECT COUNT(*) as count FROM support_tickets WHERE status = 'pending'";
    const answeredTicketsQuery = "SELECT COUNT(*) as count FROM support_tickets WHERE status = 'answered'";
    const closedTicketsQuery = "SELECT COUNT(*) as count FROM support_tickets WHERE status = 'closed'";
    const totalTicketsQuery = "SELECT COUNT(*) as count FROM support_tickets";
    
    const [
      totalResult, 
      adminsResult, 
      bannedResult, 
      bansResult,
      pendingResult,
      answeredResult,
      closedResult,
      totalTicketsResult
    ] = await Promise.all([
      query(totalQuery),
      query(adminsQuery),
      query(bannedQuery),
      query(bansQuery),
      query(pendingTicketsQuery),
      query(answeredTicketsQuery),
      query(closedTicketsQuery),
      query(totalTicketsQuery)
    ]);
    
    const stats = {
      // Статистика пользователей
      totalUsers: parseInt(totalResult.rows[0].count) || 0,
      totalAdmins: parseInt(adminsResult.rows[0].count) || 0,
      totalBanned: parseInt(bannedResult.rows[0].count) || 0,
      totalBans: parseInt(bansResult.rows[0].total) || 0,
      
      // Статистика обращений
      pendingTickets: parseInt(pendingResult.rows[0].count) || 0,
      answeredTickets: parseInt(answeredResult.rows[0].count) || 0,
      closedTickets: parseInt(closedResult.rows[0].count) || 0,
      totalTickets: parseInt(totalTicketsResult.rows[0].count) || 0
    };
    
    console.log('Simple stats result:', stats);
    
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
      totalBans: 0,
      pendingTickets: 0,
      answeredTickets: 0,
      closedTickets: 0,
      totalTickets: 0,
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
        u.created_at, u.updated_at, u.ban_count
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
      updated_at: user.updated_at ? new Date(user.updated_at).toISOString() : null,
      ban_count: user.ban_count || 0 // Убедимся, что ban_count есть
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
        created_at, ban_count
      FROM users 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    
    const usersResult = await query(queryText);
    console.log('Found', usersResult.rows.length, 'users for stats');
    
    // Форматируем даты
    const formattedUsers = usersResult.rows.map(user => ({
      ...user,
      created_at: user.created_at ? new Date(user.created_at).toISOString() : null,
      ban_count: user.ban_count || 0
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

// Получение всех тикетов поддержки (без пагинации, для экспорта)
router.get('/support/all-tickets', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('=== ALL SUPPORT TICKETS FOR EXPORT ===');
    
    const queryText = `
      SELECT 
        st.*,
        u.email as user_email,
        u.nickname as user_nickname,
        u.nickname as username
      FROM support_tickets st
      LEFT JOIN users u ON st.user_id = u.id
      WHERE u.deleted_at IS NULL
      ORDER BY st.created_at DESC
    `;
    
    const ticketsResult = await query(queryText);
    console.log('Found', ticketsResult.rows.length, 'support tickets for export');
    
    // Форматируем даты
    const formattedTickets = ticketsResult.rows.map(ticket => ({
      ...ticket,
      created_at: ticket.created_at ? new Date(ticket.created_at).toISOString() : null,
      updated_at: ticket.updated_at ? new Date(ticket.updated_at).toISOString() : null,
      responded_at: ticket.responded_at ? new Date(ticket.responded_at).toISOString() : null
    }));
    
    res.json({
      success: true,
      tickets: formattedTickets,
      total: ticketsResult.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching all support tickets:', error);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке всех обращений',
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

// Забанить/разбанить пользователя (старый endpoint - для обратной совместимости)
router.put('/users/:userId/ban', authenticateToken, isAdmin, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const userId = parseInt(req.params.userId);
    const { is_banned, ban_reason, ban_duration } = req.body;
    
    console.log('Ban request (old endpoint):', { userId, is_banned, ban_reason, admin: req.user });
    
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
    
    // Обновляем счетчик банов только при бане
    let banCountUpdate = '';
    if (is_banned) {
      banCountUpdate = ', ban_count = COALESCE(ban_count, 0) + 1';
    }
    
    // Обновляем пользователя
    const result = await client.query(
      `UPDATE users 
       SET is_banned = $1, ban_reason = $2, ban_expires_at = $3, updated_at = $4 ${banCountUpdate}
       WHERE id = $5 
       RETURNING id, email, nickname, is_banned, ban_reason, ban_expires_at, ban_count`,
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
      user: result.rows[0],
      was_banned: currentUser.is_banned
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
        created_at, updated_at, ban_expires_at, ban_count
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
    user.ban_count = user.ban_count || 0;
    
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
    const dataQuery = 'SELECT id, email, is_admin, is_banned, ban_count FROM users WHERE deleted_at IS NULL ORDER BY id';
    const dataResult = await query(dataQuery);
    
    // Проверяем типы данных
    const sampleUser = dataResult.rows.length > 0 ? dataResult.rows[0] : null;
    const sampleTypes = sampleUser ? {
      id_type: typeof sampleUser.id,
      is_admin_type: typeof sampleUser.is_admin,
      is_admin_value: sampleUser.is_admin,
      is_banned_type: typeof sampleUser.is_banned,
      is_banned_value: sampleUser.is_banned,
      ban_count_type: typeof sampleUser.ban_count,
      ban_count_value: sampleUser.ban_count
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
      { name: 'banned_alt', query: 'SELECT COUNT(*) as count FROM users WHERE is_banned AND deleted_at IS NULL' },
      { name: 'total_bans', query: 'SELECT COALESCE(SUM(ban_count), 0) as total FROM users WHERE deleted_at IS NULL' }
    ];
    
    const results = {};
    for (const q of queries) {
      const result = await query(q.query);
      results[q.name] = parseInt(result.rows[0].count) || 0;
    }
    
    // Также получаем несколько примеров пользователей
    const sampleQuery = 'SELECT id, email, is_admin, is_banned, ban_count FROM users WHERE deleted_at IS NULL ORDER BY id LIMIT 5';
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