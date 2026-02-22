// routes/support.js
const express = require('express');
const { Pool } = require('pg');
const { createNotification } = require('../utils/notificationHelper');
const router = express.Router();

console.log('=== ЗАГРУЗКА support.js ===');

// Подключение к базе данных
const poolConfig = {
  user: process.env.DB_USER || 'ecosteps',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecosteps',
  password: process.env.DB_PASSWORD || 'ecosteps_password',
  port: process.env.DB_PORT || 5432,
};

console.log('DB Config:', poolConfig);

const pool = new Pool(poolConfig);

// Middleware для проверки авторизации - УПРОЩЕННАЯ ВЕРСИЯ
const requireAuth = (req, res, next) => {
  console.log('=== requireAuth middleware ===');
  
  // Просто проверяем наличие user-id в заголовках
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    console.log('❌ No X-User-Id header found');
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Требуется идентификатор пользователя'
    });
  }
  
  // Проверяем что это число
  const parsedUserId = parseInt(userId);
  if (isNaN(parsedUserId) || parsedUserId <= 0) {
    console.log('❌ Invalid user ID format:', userId);
    return res.status(401).json({
      success: false,
      error: 'INVALID_USER_ID',
      message: 'Неверный формат идентификатора пользователя'
    });
  }
  
  req.userId = parsedUserId;
  console.log('✅ Authenticated user ID:', req.userId);
  next();
};

// 1. Проверка таблицы поддержки
router.get('/check-table', async (req, res) => {
  console.log('GET /api/support/check-table');
  
  try {
    // Проверяем структуру таблицы
    const tableInfo = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'support_tickets'
      ORDER BY ordinal_position;
    `);
    
    // Проверяем наличие данных
    const countResult = await pool.query('SELECT COUNT(*) as count FROM support_tickets');
    
    // Получаем несколько примеров
    const sampleResult = await pool.query('SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 5');
    
    res.json({
      success: true,
      table_exists: tableInfo.rows.length > 0,
      columns: tableInfo.rows,
      total_records: parseInt(countResult.rows[0].count),
      sample_records: sampleResult.rows.map(row => ({
        ...row,
        created_at: row.created_at ? row.created_at.toISOString() : null,
        updated_at: row.updated_at ? row.updated_at.toISOString() : null,
        responded_at: row.responded_at ? row.responded_at.toISOString() : null
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка проверки таблицы:', error);
    
    if (error.code === '42P01') { // table does not exist
      return res.json({
        success: true,
        table_exists: false,
        message: 'Таблица support_tickets не существует',
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Ошибка при проверке таблицы'
    });
  }
});

// 2. Создать новый вопрос в поддержку - УПРОЩЕННАЯ ВЕРСИЯ
router.post('/', requireAuth, async (req, res) => {
  console.log('\n=== POST /api/support ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('User ID:', req.userId);
  console.log('Request Body:', req.body);
  
  try {
    const { subject, message } = req.body;
    
    // Валидация
    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_SUBJECT',
        message: 'Заполните тему вопроса'
      });
    }
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_MESSAGE',
        message: 'Заполните сообщение'
      });
    }
    
    const trimmedSubject = subject.trim().substring(0, 255);
    const trimmedMessage = message.trim();
    
    // Генерируем номер заявки
    const timestamp = Date.now().toString();
    const randomStr = Math.random().toString(36).substr(2, 6).toUpperCase();
    const ticketNumber = `TICKET-${timestamp.slice(-8)}-${randomStr}`;
    
    console.log('Generated ticket number:', ticketNumber);
    
    // Проверяем существование пользователя в БД
    console.log(`🔍 Проверяем пользователя ID ${req.userId} в таблице users...`);
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [req.userId]);
    
    if (userCheck.rows.length === 0) {
      console.warn(`⚠️ Пользователь ID ${req.userId} не найден в таблице users`);
      // Но все равно сохраняем вопрос, так как user_id будет просто числом
    } else {
      console.log(`✅ Пользователь ID ${req.userId} найден в БД`);
    }
    
    try {
      // Простая вставка без foreign key constraint
      const query = `
        INSERT INTO support_tickets (
          user_id,
          ticket_number,
          subject,
          message,
          status,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const values = [req.userId, ticketNumber, trimmedSubject, trimmedMessage];
      console.log('Executing SQL:', query);
      console.log('Values:', values);
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Не удалось создать запись в БД');
      }
      
      const savedTicket = result.rows[0];
      console.log('✅ Вопрос успешно сохранен в БД:', {
        id: savedTicket.id,
        ticket_number: savedTicket.ticket_number,
        user_id: savedTicket.user_id,
        subject: savedTicket.subject,
        status: savedTicket.status
      });
      
      // Отправляем уведомления всем администраторам
      try {
        console.log('📨 Отправка уведомлений администраторам о новом обращении...');
        const adminsResult = await pool.query('SELECT id FROM users WHERE is_admin = true AND is_banned = false');
        console.log(`👥 Найдено администраторов: ${adminsResult.rows.length}`);
        
        const io = req.app.get('io');
        console.log('📡 Socket.IO instance:', !!io);
        
        for (const admin of adminsResult.rows) {
          await createNotification(
            admin.id,
            'support_ticket',
            'Новое обращение в поддержку',
            `Пользователь отправил обращение: ${trimmedSubject}`,
            '/admin?tab=support',
            savedTicket.id,
            io
          );
          console.log(`✅ Уведомление отправлено админу ID: ${admin.id}`);
        }
      } catch (notifError) {
        console.error('❌ Ошибка отправки уведомлений администраторам:', notifError);
        // Не прерываем выполнение, так как тикет уже создан
      }
      
      return res.status(201).json({
        success: true,
        message: 'Вопрос успешно отправлен в поддержку',
        ticket: {
          id: savedTicket.id,
          ticket_number: savedTicket.ticket_number,
          subject: savedTicket.subject,
          status: savedTicket.status,
          created_at: savedTicket.created_at ? savedTicket.created_at.toISOString() : null
        }
      });
      
    } catch (dbError) {
      console.error('❌ Ошибка БД при сохранении вопроса:', {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
        constraint: dbError.constraint
      });
      
      // Если ошибка связана с foreign key constraint, предлагаем решение
      if (dbError.code === '23503') { // foreign_key_violation
        console.log('🔄 Пробуем альтернативный способ вставки...');
        
        try {
          // Пробуем вставить без проверки foreign key
          const fallbackQuery = `
            INSERT INTO support_tickets (
              user_id,
              ticket_number,
              subject,
              message,
              status,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
          `;
          
          const result = await pool.query(fallbackQuery, values);
          
          console.log('✅ Вопрос сохранен через альтернативный метод');
          
          return res.status(201).json({
            success: true,
            message: 'Вопрос отправлен в поддержку',
            warning: 'Вопрос сохранен без проверки пользователя в системе',
            ticket: result.rows[0]
          });
          
        } catch (fallbackError) {
          console.error('❌ Ошибка при альтернативной вставке:', fallbackError.message);
        }
      }
      
      return res.status(500).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Не удалось сохранить вопрос в базу данных',
        debug: process.env.NODE_ENV === 'development' ? {
          code: dbError.code,
          message: dbError.message,
          constraint: dbError.constraint
        } : undefined
      });
    }
    
  } catch (error) {
    console.error('❌ Общая ошибка при обработке запроса:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// 3. Получить вопросы пользователя
router.get('/my-questions', requireAuth, async (req, res) => {
  console.log('\n=== GET /api/support/my-questions ===');
  console.log('User ID:', req.userId);
  
  try {
    // Простой запрос к БД
    const query = `
      SELECT 
        id,
        ticket_number,
        subject,
        message,
        status,
        admin_response,
        responded_at,
        created_at,
        updated_at
      FROM support_tickets
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    console.log('Executing SQL:', query);
    console.log('User ID parameter:', req.userId);
    
    const result = await pool.query(query, [req.userId]);
    
    console.log(`✅ Найдено ${result.rowCount} вопросов для пользователя ${req.userId}`);
    
    // Форматируем даты для JSON
    const tickets = result.rows.map(ticket => ({
      ...ticket,
      created_at: ticket.created_at ? ticket.created_at.toISOString() : null,
      updated_at: ticket.updated_at ? ticket.updated_at.toISOString() : null,
      responded_at: ticket.responded_at ? ticket.responded_at.toISOString() : null
    }));
    
    return res.json({
      success: true,
      tickets: tickets,
      total: tickets.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении вопросов:', {
      message: error.message,
      code: error.code
    });
    
    // Если таблицы нет - возвращаем пустой массив
    if (error.code === '42P01') {
      console.log('Таблица support_tickets не существует');
      return res.json({
        success: true,
        tickets: [],
        total: 0,
        message: 'Таблица вопросов пока не создана'
      });
    }
    
    return res.status(500).json({
      success: false,
      tickets: [],
      total: 0,
      error: 'DATABASE_ERROR',
      message: 'Ошибка при получении вопросов из базы данных'
    });
  }
});

// 4. Тестовый endpoint для проверки подключения
router.get('/test', async (req, res) => {
  console.log('GET /api/support/test');
  
  try {
    // Проверяем подключение к БД
    await pool.query('SELECT 1');
    
    // Проверяем существование таблицы support_tickets
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'support_tickets'
      );
    `);
    
    res.json({
      success: true,
      message: 'Support API работает',
      database: 'connected',
      table_exists: tableExists.rows[0].exists,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка подключения к базе данных',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 5. Проверка пользователя
router.get('/check-user/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  console.log(`GET /api/support/check-user/${userId}`);
  
  try {
    const userQuery = await pool.query('SELECT id, email, nickname FROM users WHERE id = $1', [userId]);
    const supportQuery = await pool.query('SELECT COUNT(*) as count FROM support_tickets WHERE user_id = $1', [userId]);
    
    res.json({
      success: true,
      user_exists: userQuery.rows.length > 0,
      user: userQuery.rows[0],
      support_tickets_count: parseInt(supportQuery.rows[0].count),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

console.log('=== support.js загружен ===');
module.exports = router;