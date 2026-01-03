const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

const router = express.Router();

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