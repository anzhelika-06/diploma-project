// routes/support.js
const express = require('express');
const { Pool } = require('pg');
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

// Middleware для проверки авторизации
const requireAuth = (req, res, next) => {
  console.log('=== requireAuth middleware ===');
  
  let userId = null;
  
  if (req.headers['x-user-id']) {
    userId = req.headers['x-user-id'];
    console.log('Got userId from X-User-Id:', userId);
  } else if (req.headers['authorization']) {
    const token = req.headers['authorization'].replace('Bearer ', '');
    console.log('Authorization token:', token);
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      userId = decoded.split(':')[0];
      console.log('Decoded userId:', userId);
    } catch (error) {
      console.warn('Не удалось декодировать токен:', error);
    }
  }
  
  if (!userId) {
    console.log('❌ No userId found, returning 401');
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Требуется авторизация'
    });
  }
  
  req.userId = parseInt(userId);
  console.log('✅ Authenticated user ID:', req.userId);
  next();
};

// 1. Endpoint для проверки таблицы
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
    const sampleResult = await pool.query('SELECT * FROM support_tickets LIMIT 5');
    
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

// 2. Создать новый вопрос в поддержку
router.post('/', requireAuth, async (req, res) => {
  console.log('\n=== POST /api/support ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('User ID:', req.userId);
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { subject, message } = req.body;
    
    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Заполните тему вопроса'
      });
    }
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Заполните сообщение'
      });
    }
    
    const trimmedSubject = subject.trim().substring(0, 255);
    const trimmedMessage = message.trim();
    
    // Генерируем номер заявки - УКОРОЧЕННАЯ ВЕРСИЯ
    const timestamp = Date.now().toString().slice(-8); // Берем последние 8 цифр
    const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
    const ticketNumber = `T-${timestamp}-${randomStr}`; // Пример: T-89452345-A7F3
    
    console.log('Generated ticket number:', ticketNumber);
    console.log('Ticket number length:', ticketNumber.length);
    
    try {
      // Проверяем существование таблицы
      try {
        await pool.query('SELECT 1 FROM support_tickets LIMIT 1');
        console.log('✅ Таблица support_tickets существует');
      } catch (tableError) {
        if (tableError.code === '42P01') { // relation does not exist
          console.log('🛠️ Создаем таблицу support_tickets...');
          const createQuery = `
            CREATE TABLE IF NOT EXISTS support_tickets (
              id SERIAL PRIMARY KEY,
              user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
              ticket_number VARCHAR(20) UNIQUE NOT NULL,
              subject VARCHAR(255) NOT NULL,
              message TEXT NOT NULL,
              status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'closed')),
              admin_response TEXT,
              responded_at TIMESTAMP,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `;
          await pool.query(createQuery);
          console.log('✅ Таблица support_tickets создана');
        } else {
          throw tableError;
        }
      }
      
      const query = `
        INSERT INTO support_tickets (
          user_id,
          ticket_number,
          subject,
          message,
          status
        ) VALUES ($1, $2, $3, $4, 'pending')
        RETURNING *
      `;
      
      const values = [req.userId, ticketNumber, trimmedSubject, trimmedMessage];
      console.log('Executing query:', query);
      console.log('With values:', values);
      
      const result = await pool.query(query, values);
      
      const savedTicket = result.rows[0];
      console.log('✅ Вопрос сохранен в БД:', savedTicket);
      
      return res.status(201).json({
        success: true,
        message: 'Вопрос отправлен в поддержку',
        ticket: {
          id: savedTicket.id,
          ticket_number: savedTicket.ticket_number,
          subject: savedTicket.subject,
          status: savedTicket.status,
          created_at: savedTicket.created_at ? savedTicket.created_at.toISOString() : null
        }
      });
      
    } catch (dbError) {
      console.error('❌ Ошибка БД:', dbError.message);
      console.error('Stack:', dbError.stack);
      
      return res.status(500).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Ошибка при сохранении вопроса',
        debug: process.env.NODE_ENV === 'development' ? {
          error: dbError.message,
          code: dbError.code,
          detail: dbError.detail
        } : undefined
      });
    }
    
  } catch (error) {
    console.error('❌ Непредвиденная ошибка:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// 3. Получить вопросы пользователя (ЭТОТ ENDPOINT ОТСУТСТВОВАЛ!)
router.get('/my-questions', requireAuth, async (req, res) => {
  console.log('\n=== GET /api/support/my-questions ===');
  console.log('User ID:', req.userId);
  
  try {
    // Проверяем существование таблицы
    try {
      await pool.query('SELECT 1 FROM support_tickets LIMIT 1');
    } catch (tableError) {
      if (tableError.code === '42P01') { // relation does not exist
        console.log('Таблица support_tickets не существует, возвращаем пустой список');
        return res.json({
          success: true,
          tickets: [],
          total: 0
        });
      }
      throw tableError;
    }
    
    // Получаем вопросы
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
    
    console.log('Executing query:', query);
    console.log('With params:', [req.userId]);
    
    const result = await pool.query(query, [req.userId]);
    console.log('✅ Найдено вопросов:', result.rowCount);
    
    // Преобразуем даты в строки для JSON
    const tickets = result.rows.map(ticket => ({
      ...ticket,
      created_at: ticket.created_at ? ticket.created_at.toISOString() : null,
      updated_at: ticket.updated_at ? ticket.updated_at.toISOString() : null,
      responded_at: ticket.responded_at ? ticket.responded_at.toISOString() : null
    }));
    
    return res.json({
      success: true,
      tickets: tickets,
      total: tickets.length
    });
    
  } catch (error) {
    console.error('❌ Ошибка получения вопросов:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      tickets: [],
      total: 0,
      error: 'SERVER_ERROR',
      message: 'Ошибка при получении вопросов',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 4. Тестовые endpoint'ы
router.post('/test-auth', requireAuth, (req, res) => {
  console.log('POST /api/support/test-auth');
  console.log('Authenticated User ID:', req.userId);
  
  res.json({
    success: true,
    message: 'Authentication works!',
    userId: req.userId,
    timestamp: new Date().toISOString()
  });
});

router.get('/test', (req, res) => {
  console.log('GET /api/support/test');
  res.json({
    success: true,
    message: 'Support API работает',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check для поддержки
router.get('/health', async (req, res) => {
  console.log('GET /api/support/health');
  
  try {
    // Проверяем подключение к БД
    await pool.query('SELECT 1');
    
    // Проверяем таблицу
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'support_tickets'
      );
    `);
    
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      table_exists: tableCheck.rows[0].exists,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

console.log('=== support.js загружен ===');
module.exports = router;