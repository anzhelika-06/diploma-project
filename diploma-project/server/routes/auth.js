const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

const router = express.Router();

// Функция валидации email
const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Регистрация пользователя
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

// Авторизация (вход через email или никнейм)
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    // Валидация входных данных
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Логин/никнейм и пароль обязательны'
      });
    }

    // Поиск пользователя по email ИЛИ никнейму
    const userQuery = `
      SELECT id, email, nickname, password_hash, is_admin
      FROM users 
      WHERE email = $1 OR nickname = $1
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
        message: 'Неверный логин/никнейм или пароль'
      });
    }

    // Успешная авторизация
    res.json({
      success: true,
      message: 'Авторизация успешна',
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        isAdmin: user.is_admin || false
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