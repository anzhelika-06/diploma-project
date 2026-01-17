const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { 
  generateVerificationCode, 
  sendVerificationEmail, 
  isValidEmail 
} = require('../utils/emailService');

const router = express.Router();

// Шаг 1: Отправка кода подтверждения на email
router.post('/register/send-code', async (req, res) => {
  try {
    const { login, nickname, password, birthdate, gender, language = 'ru' } = req.body;

    // Валидация входных данных
    if (!login || !nickname || !password || !birthdate || !gender) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Все поля обязательны для заполнения'
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

    // Получаем gender_id
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

    // Генерируем код подтверждения
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    // Удаляем старые неподтвержденные регистрации для этого email
    await pool.query('DELETE FROM pending_registrations WHERE email = $1', [login]);

    // Сохраняем временные данные регистрации
    await pool.query(
      `INSERT INTO pending_registrations 
       (email, nickname, password_hash, date_of_birth, gender_id, verification_code, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [login, nickname, passwordHash, birthdate, genderId, verificationCode, expiresAt]
    );

    // Отправляем email с кодом
    const emailResult = await sendVerificationEmail(login, verificationCode, language);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'EMAIL_SEND_FAILED',
        message: 'Не удалось отправить код подтверждения'
      });
    }

    res.json({
      success: true,
      message: 'Код подтверждения отправлен на email',
      email: login,
      expiresIn: 600 // секунд
    });

  } catch (error) {
    console.error('Ошибка отправки кода:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// Шаг 2: Подтверждение кода и завершение регистрации
router.post('/register/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Email и код обязательны'
      });
    }

    // Проверяем код
    const pendingQuery = `
      SELECT * FROM pending_registrations 
      WHERE email = $1 AND verification_code = $2 AND expires_at > NOW()
    `;
    
    const pendingResult = await pool.query(pendingQuery, [email, code]);

    if (pendingResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CODE',
        message: 'Неверный или истекший код подтверждения'
      });
    }

    const pendingReg = pendingResult.rows[0];

    // Создаем пользователя
    const insertUserQuery = `
      INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, email_verified, created_at)
      VALUES ($1, $2, $3, $4, $5, TRUE, NOW())
      RETURNING id, email, nickname, created_at
    `;
    
    const newUserResult = await pool.query(insertUserQuery, [
      pendingReg.email,
      pendingReg.nickname,
      pendingReg.password_hash,
      pendingReg.date_of_birth,
      pendingReg.gender_id
    ]);

    const newUser = newUserResult.rows[0];

    // Удаляем временную запись
    await pool.query('DELETE FROM pending_registrations WHERE email = $1', [email]);

    res.status(201).json({
      success: true,
      message: 'Регистрация успешно завершена',
      user: {
        id: newUser.id,
        email: newUser.email,
        nickname: newUser.nickname,
        createdAt: newUser.created_at
      }
    });

  } catch (error) {
    console.error('Ошибка подтверждения кода:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// Простая регистрация без подтверждения email (временно)
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

    // Получаем gender_id
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

    // Создаем пользователя
    const insertUserQuery = `
      INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, email_verified, created_at)
      VALUES ($1, $2, $3, $4, $5, FALSE, NOW())
      RETURNING id, email, nickname, created_at
    `;
    
    const newUserResult = await pool.query(insertUserQuery, [
      login,
      nickname,
      passwordHash,
      birthdate,
      genderId
    ]);

    const newUser = newUserResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Регистрация успешна',
      user: {
        id: newUser.id,
        email: newUser.email,
        nickname: newUser.nickname,
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

// Старый роут регистрации (оставляем для обратной совместимости)
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

    // Валидация email - строгая проверка только латинских символов
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(login)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL',
        message: 'Введите корректный email адрес'
      });
    }

    // Дополнительная проверка доменной зоны - только известные почтовые сервисы
    const domainPart = login.split('@')[1];
    const allowedDomains = [
      // Gmail и Google
      'gmail.com', 'googlemail.com',
      // Microsoft
      'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
      // Yahoo
      'yahoo.com', 'yahoo.co.uk', 'yahoo.de', 'yahoo.fr',
      // Российские
      'mail.ru', 'bk.ru', 'inbox.ru', 'list.ru',
      'yandex.ru', 'yandex.com', 'ya.ru',
      'rambler.ru', 'lenta.ru',
      // Белорусские
      'tut.by', 'mail.by', 'yandex.by',
      // Украинские
      'ukr.net', 'i.ua', 'meta.ua',
      // Другие популярные
      'aol.com', 'icloud.com', 'me.com', 'mac.com',
      'protonmail.com', 'tutanota.com',
      // Корпоративные зоны (для примера)
      'example.com', 'test.com', 'demo.org'
    ];
    
    const domain = domainPart.toLowerCase();
    
    if (!allowedDomains.includes(domain)) {
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
      RETURNING id, email, nickname, created_at
    `;
    
    const newUserResult = await pool.query(insertUserQuery, [
      login,
      nickname,
      passwordHash,
      birthdate,
      genderId
    ]);

    const newUser = newUserResult.rows[0];

    // Успешная регистрация
    res.status(201).json({
      success: true,
      message: 'Регистрация успешна',
      user: {
        id: newUser.id,
        email: newUser.email,
        nickname: newUser.nickname,
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

// Маршрут для авторизации
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    // Валидация входных данных
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Логин и пароль обязательны'
      });
    }

    // Поиск пользователя по email (логин - это email)
    const userQuery = `
      SELECT id, email, nickname, password_hash 
      FROM users 
      WHERE email = $1
    `;
    
    const userResult = await pool.query(userQuery, [login]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Пользователь не найден'
      });
    }

    const user = userResult.rows[0];

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Неверный логин или пароль'
      });
    }

    // Успешная авторизация
    res.json({
      success: true,
      message: 'Авторизация успешна',
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname
      }
    });

  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

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

module.exports = router;