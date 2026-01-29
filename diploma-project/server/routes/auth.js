const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Добавляем JWT
const { pool } = require('../config/database');

const router = express.Router();

// Функция валидации email
const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request body:', req.body);
  next();
});
// Добавьте в authRoutes.js после импортов, до других роутов
router.get('/health', (req, res) => {
  console.log('Health check requested');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});
// Регистрация пользователя с токеном
router.post('/register', async (req, res) => {
  try {
    const { login, nickname, password, birthdate, gender } = req.body;

    // Валидация входных данных
    if (!login || !nickname || !password || !birthdate || !gender) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Все поля обязательны для заполнения'
      });
    }

    // Валидация никнейма - только английские буквы, цифры и подчеркивания
    const nicknameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!nicknameRegex.test(nickname)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_NICKNAME',
        message: 'Никнейм может содержать только английские буквы, цифры и подчеркивания (3-20 символов)'
      });
    }

    // Валидация email
    if (!isValidEmail(login)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL',
        message: 'Введите корректный email адрес'
      });
    }

    // Валидация пароля
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'PASSWORD_TOO_SHORT',
        message: 'Пароль должен содержать минимум 6 символов'
      });
    }

    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'PASSWORD_TOO_WEAK',
        message: 'Пароль должен содержать буквы и цифры'
      });
    }

    // Валидация возраста
    const birthDate = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      return res.status(400).json({
        success: false,
        error: 'AGE_RESTRICTION',
        message: 'Вам должно быть не менее 18 лет'
      });
    }

    // Проверка существования пользователя
    const existingUserQuery = `
      SELECT id FROM users WHERE email = $1 OR nickname = $2
    `;
    
    const existingUserResult = await pool.query(existingUserQuery, [login, nickname]);

    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'USER_EXISTS',
        message: 'Пользователь с таким email или никнеймом уже существует'
      });
    }

    // Хеширование пароля
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Получаем gender_id по коду пола
    const genderQuery = `SELECT id FROM genders WHERE code = $1`;
    const genderResult = await pool.query(genderQuery, [gender]);
    
    if (genderResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_GENDER',
        message: 'Неверное значение пола'
      });
    }
    
    const genderId = genderResult.rows[0].id;

    // Создание пользователя
    const insertUserQuery = `
      INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, email, nickname, created_at, is_admin, carbon_saved, eco_level, avatar_emoji
    `;
    
    const newUserResult = await pool.query(insertUserQuery, [
      login,
      nickname,
      passwordHash,
      birthdate,
      genderId
    ]);

    const newUser = newUserResult.rows[0];

    // Генерация токена для нового пользователя
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        nickname: newUser.nickname,
        is_admin: newUser.is_admin, // ДОБАВЛЕНО!
        isAdmin: newUser.is_admin    // И camelCase
      },
      process.env.JWT_SECRET || 'ecosteps-secret-key-2024',
      { expiresIn: '30d' }
    );
    // Успешная регистрация с токеном
    res.status(201).json({
      success: true,
      message: 'Регистрация успешна',
      token: token,
      user: {
        id: newUser.id,
        email: newUser.email,
        nickname: newUser.nickname,
        isAdmin: newUser.is_admin || false,
        carbonSaved: newUser.carbon_saved || 0,
        ecoLevel: newUser.eco_level || 'Эко-новичок',
        avatarEmoji: newUser.avatar_emoji || '🌱',
        createdAt: newUser.created_at
      }
    });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// authRoutes.js - обновите login роут
router.post('/login', async (req, res) => {
  console.log('=== START LOGIN HANDLER ===');
  
  try {
    const { login, password } = req.body;

    console.log('Login attempt for:', login);
    
    // Валидация входных данных
    if (!login || !password) {
      console.log('Validation failed: missing fields');
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Логин/никнейм и пароль обязательны'
      });
    }

    console.log('Attempting to query database...');
    
    // Поиск пользователя по email ИЛИ никнейму - ВАЖНО: добавить is_admin в запрос
    const userQuery = `
      SELECT id, email, nickname, password_hash, is_admin,
             carbon_saved, eco_level, avatar_emoji, is_banned
      FROM users 
      WHERE email = $1 OR nickname = $1
    `;
    
    let userResult;
    try {
      userResult = await pool.query(userQuery, [login]);
      console.log('Database query successful, rows found:', userResult.rows.length);
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      console.error('Stack trace:', dbError.stack);
      return res.status(500).json({
        success: false,
        error: 'DB_QUERY_ERROR',
        message: 'Ошибка запроса к базе данных'
      });
    }

    if (userResult.rows.length === 0) {
      console.log('User not found in database');
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Пользователь не найден'
      });
    }

    const user = userResult.rows[0];
    console.log('User found:', { 
      id: user.id, 
      email: user.email,
      is_admin: user.is_admin 
    });

    // Проверка на бан
    if (user.is_banned) {
      console.log('User is banned');
      return res.status(403).json({
        success: false,
        error: 'USER_BANNED',
        message: 'Ваш аккаунт заблокирован'
      });
    }

    // Проверка пароля
    console.log('Checking password...');
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
      console.log('Password check result:', isPasswordValid);
    } catch (bcryptError) {
      console.error('Bcrypt comparison failed:', bcryptError);
      return res.status(500).json({
        success: false,
        error: 'PASSWORD_CHECK_ERROR',
        message: 'Ошибка проверки пароля'
      });
    }

    if (!isPasswordValid) {
      console.log('Invalid password');
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Неверный логин/никнейм или пароль'
      });
    }

    console.log('Password valid, generating JWT token...');
    
    // Генерация JWT токена - ВАЖНО: включаем is_admin!
    const JWT_SECRET = process.env.JWT_SECRET;
    console.log('JWT_SECRET exists?', !!JWT_SECRET);
    
    let token;
    try {
      token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          nickname: user.nickname,
          is_admin: user.is_admin, // ДОБАВЛЕНО!
          isAdmin: user.is_admin   // И camelCase вариант тоже
        },
        JWT_SECRET || 'ecosteps-secret-key-2024',
        { expiresIn: '30d' }
      );
      console.log('JWT token generated successfully');
    } catch (jwtError) {
      console.error('JWT generation failed:', jwtError);
      return res.status(500).json({
        success: false,
        error: 'JWT_GENERATION_ERROR',
        message: 'Ошибка создания токена'
      });
    }

    console.log('Sending successful response...');
    
    // Успешная авторизация с токеном
    const responseData = {
      success: true,
      message: 'Авторизация успешна',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        isAdmin: user.is_admin || false,
        is_admin: user.is_admin || false, // Добавляем и snake_case
        carbonSaved: user.carbon_saved || 0,
        ecoLevel: user.eco_level || 'Эко-новичок',
        avatarEmoji: user.avatar_emoji || '🌱'
      }
    };
    
    console.log('Response data:', JSON.stringify(responseData, null, 2));
    
    // Важно: явно указываем Content-Type
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(responseData);
    
    console.log('=== END LOGIN HANDLER (SUCCESS) ===');

  } catch (error) {
    console.error('=== UNHANDLED ERROR IN LOGIN HANDLER ===');
    console.error('Error:', error);
    console.error('Stack trace:', error.stack);
    
    try {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Внутренняя ошибка сервера',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } catch (sendError) {
      console.error('Failed to send error response:', sendError);
    }
    
    console.log('=== END LOGIN HANDLER (ERROR) ===');
  }
});

// Проверка токена (верификация)
// Обновите функцию verify
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'NO_TOKEN',
        message: 'Требуется авторизация'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ecosteps-secret-key-2024');
      
      // Получаем актуальные данные пользователя из БД
      const userQuery = `
        SELECT id, email, nickname, is_admin, carbon_saved, eco_level, avatar_emoji, is_banned
        FROM users WHERE id = $1
      `;
      
      const userResult = await pool.query(userQuery, [decoded.userId]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Пользователь не найден'
        });
      }

      const user = userResult.rows[0];
      
      // Проверка на бан
      if (user.is_banned) {
        return res.status(403).json({
          success: false,
          error: 'USER_BANNED',
          message: 'Ваш аккаунт заблокирован'
        });
      }
      
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          isAdmin: user.is_admin || false,
          is_admin: user.is_admin || false,
          carbonSaved: user.carbon_saved || 0,
          ecoLevel: user.eco_level || 'Эко-новичок',
          avatarEmoji: user.avatar_emoji || '🌱'
        }
      });
      
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Недействительный или просроченный токен'
      });
    }
    
  } catch (error) {
    console.error('Ошибка верификации токена:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});
router.get('/test', (req, res) => {
  console.log('Тестовый запрос получен')
  res.json({ success: true, message: 'Auth API работает!', timestamp: new Date().toISOString() })
})

router.post('/test-post', (req, res) => {
  console.log('Тестовый POST запрос:', req.body)
  res.json({ 
    success: true, 
    message: 'POST запрос работает!',
    received: req.body,
    timestamp: new Date().toISOString() 
  })
})
// Тестовый маршрут для проверки подключения к БД
router.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as user_count FROM users');
    res.json({
      success: true,
      message: 'Подключение к БД работает',
      userCount: result.rows[0].user_count
    });
  } catch (error) {
    console.error('Ошибка подключения к БД:', error);
    res.status(500).json({
      success: false,
      error: 'DB_CONNECTION_ERROR',
      message: 'Ошибка подключения к базе данных'
    });
  }
});

// Обновление токена (refresh token)
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'NO_TOKEN',
        message: 'Требуется авторизация'
      });
    }

    const oldToken = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(oldToken, process.env.JWT_SECRET || 'ecosteps-secret-key-2024', { ignoreExpiration: true });
      
      // Проверяем, что пользователь существует
      const userQuery = `SELECT id FROM users WHERE id = $1`;
      const userResult = await pool.query(userQuery, [decoded.userId]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Пользователь не найден'
        });
      }

      // Генерация нового токена
      const newToken = jwt.sign(
        {
          userId: decoded.userId,
          email: decoded.email,
          nickname: decoded.nickname
        },
        process.env.JWT_SECRET || 'ecosteps-secret-key-2024',
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        token: newToken,
        message: 'Токен обновлен'
      });
      
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Недействительный токен'
      });
    }
    
  } catch (error) {
    console.error('Ошибка обновления токена:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

module.exports = router;