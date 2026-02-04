const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const router = express.Router();

// Функция валидации email
const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Middleware логирования
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Регистрация пользователя
router.post('/register', async (req, res) => {
  console.log('=== НАЧАЛО ОБРАБОТКИ РЕГИСТРАЦИИ ===');
  
  let client;
  
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

    // Валидация никнейма
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

    // Получаем соединение с базой
    client = await pool.connect();
    await client.query('BEGIN');

    // Проверка существования пользователя
    const existingUserQuery = `
      SELECT id FROM users WHERE email = $1 OR nickname = $2
    `;
    
    const existingUserResult = await client.query(existingUserQuery, [login, nickname]);

    if (existingUserResult.rows.length > 0) {
      await client.query('ROLLBACK');
      client.release();
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
    const genderResult = await client.query(genderQuery, [gender]);
    
    if (genderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({
        success: false,
        error: 'INVALID_GENDER',
        message: 'Неверное значение пола'
      });
    }
    
    const genderId = genderResult.rows[0].id;

    // Создание пользователя с начальным балансом 0 экоинов
    const insertUserQuery = `
      INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, created_at, eco_coins)
      VALUES ($1, $2, $3, $4, $5, NOW(), 0)
      RETURNING id, email, nickname, created_at, is_admin, carbon_saved, eco_level, avatar_emoji, eco_coins
    `;
    
    const newUserResult = await client.query(insertUserQuery, [
      login,
      nickname,
      passwordHash,
      birthdate,
      genderId
    ]);

    const newUser = newUserResult.rows[0];
    console.log('Пользователь успешно создан:', { 
      id: newUser.id, 
      nickname: newUser.nickname 
    });

    // ✅ ПРИСВАИВАЕМ ДОСТИЖЕНИЕ first_login (согласно вашей структуре таблиц)
    try {
      // Получаем достижение по коду
      const achievementQuery = `
        SELECT id, points FROM achievements WHERE code = 'first_login'
      `;
      const achievementResult = await client.query(achievementQuery);
      
      if (achievementResult.rows.length > 0) {
        const achievement = achievementResult.rows[0];
        
        // Создаем запись в user_achievements согласно вашей структуре таблиц
        const achievementInsertQuery = `
          INSERT INTO user_achievements (
            user_id, 
            achievement_id, 
            progress, 
            current_value, 
            completed, 
            completed_at,
            metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `;
        
        await client.query(achievementInsertQuery, [
          newUser.id, 
          achievement.id, 
          1, // progress
          1, // current_value
          true, // completed
          new Date(), // completed_at
          JSON.stringify({ 
            points_earned: achievement.points,
            event_type: 'first_login',
            description: 'Достижение за регистрацию'
          }) // metadata
        ]);
        
        console.log(`✅ Достижение first_login присвоено пользователю ${newUser.id}`);
        console.log(`ℹ️ Награда (${achievement.points} экоинов) будет начислена после клика "Забрать награду"`);
      } else {
        console.warn(`⚠️ Достижение first_login не найдено в базе данных`);
      }
    } catch (achievementError) {
      console.error('❌ Ошибка при создании достижения:', achievementError);
      // Не прерываем регистрацию из-за ошибки достижения
    }

    // Коммитим транзакцию
    await client.query('COMMIT');

    // Генерация токена
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        nickname: newUser.nickname,
        is_admin: newUser.is_admin,
        isAdmin: newUser.is_admin
      },
      process.env.JWT_SECRET || 'ecosteps-secret-key-2024',
      { expiresIn: '30d' }
    );

    // Успешная регистрация
    res.status(201).json({
      success: true,
      message: 'Регистрация успешна',
      token: token,
      user: {
        id: newUser.id,
        email: newUser.email,
        nickname: newUser.nickname,
        isAdmin: newUser.is_admin || false,
        is_admin: newUser.is_admin || false,
        carbonSaved: newUser.carbon_saved || 0,
        ecoCoins: newUser.eco_coins || 0,
        ecoLevel: newUser.eco_level || 'Эко-новичок',
        avatarEmoji: newUser.avatar_emoji || '🌱',
        createdAt: newUser.created_at
      }
    });

    console.log('=== КОНЕЦ ОБРАБОТКИ РЕГИСТРАЦИИ (УСПЕХ) ===');

  } catch (error) {
    console.error('=== НЕОБРАБОТАННАЯ ОШИБКА В РЕГИСТРАЦИИ ===');
    console.error('Ошибка:', error);
    
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
    
    console.log('=== КОНЕЦ ОБРАБОТКИ РЕГИСТРАЦИИ (ОШИБКА) ===');
  }
});

// Вход пользователя
router.post('/login', async (req, res) => {
  console.log('=== НАЧАЛО ОБРАБОТКИ ВХОДА ===');
  
  let client;
  
  try {
    const { login, password } = req.body;

    console.log('Попытка входа для:', login);
    
    // Валидация входных данных
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Логин/никнейм и пароль обязательны'
      });
    }

    // Получаем соединение с базой
    client = await pool.connect();
    await client.query('BEGIN');

    // Поиск пользователя по email или никнейму
    const userQuery = `
      SELECT id, email, nickname, password_hash, is_admin,
             carbon_saved, eco_level, avatar_emoji, is_banned,
             last_login_at, login_streak, eco_coins
      FROM users 
      WHERE email = $1 OR nickname = $1
    `;
    
    const userResult = await client.query(userQuery, [login]);

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Пользователь не найден'
      });
    }

    const user = userResult.rows[0];

    // Проверка на бан
    if (user.is_banned) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(403).json({
        success: false,
        error: 'USER_BANNED',
        message: 'Ваш аккаунт заблокирован'
      });
    }

    // Проверка пароля
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
    } catch (bcryptError) {
      console.error('Ошибка сравнения пароля:', bcryptError);
      await client.query('ROLLBACK');
      client.release();
      return res.status(500).json({
        success: false,
        error: 'PASSWORD_CHECK_ERROR',
        message: 'Ошибка проверки пароля'
      });
    }

    if (!isPasswordValid) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Неверный логин/никнейм или пароль'
      });
    }

    // Обновляем информацию о последнем входе и стрике
    const now = new Date();
    let newStreak = 1;
    
    if (user.last_login_at) {
      const lastLogin = new Date(user.last_login_at);
      const daysDiff = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Входил вчера - увеличиваем стрик
        newStreak = (user.login_streak || 0) + 1;
      } else if (daysDiff > 1) {
        // Пропустил день - сбрасываем стрик
        newStreak = 1;
      } else {
        // Входил сегодня - оставляем текущий стрик
        newStreak = user.login_streak || 1;
      }
    }
    
    // Обновляем запись пользователя
    const updateQuery = `
      UPDATE users 
      SET last_login_at = $1, login_streak = $2
      WHERE id = $3
      RETURNING login_streak, eco_coins
    `;
    
    const updateResult = await client.query(updateQuery, [now, newStreak, user.id]);
    console.log('Стрик входа обновлен:', newStreak);

    // ✅ ОБРАБАТЫВАЕМ ДОСТИЖЕНИЯ ДЛЯ ВХОДА
    try {
      // Проверяем достижения для ежедневного входа по стрику
      const achievementQuery = `
        SELECT id, code, points FROM achievements 
        WHERE event_type = 'daily_login' 
        AND requirement_type = 'streak' 
        AND requirement_value = $1
      `;
      
      const achievementResult = await client.query(achievementQuery, [newStreak]);
      
      if (achievementResult.rows.length > 0) {
        const achievement = achievementResult.rows[0];
        
        // Проверяем, не получено ли уже это достижение
        const existingAchievementQuery = `
          SELECT id FROM user_achievements 
          WHERE user_id = $1 AND achievement_id = $2
        `;
        
        const existingResult = await client.query(existingAchievementQuery, [user.id, achievement.id]);
        
        if (existingResult.rows.length === 0) {
          // Присваиваем достижение (без начисления экоинов)
          const achievementInsertQuery = `
            INSERT INTO user_achievements (
              user_id, 
              achievement_id, 
              progress, 
              current_value, 
              completed, 
              completed_at,
              metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
          `;
          
          await client.query(achievementInsertQuery, [
            user.id, 
            achievement.id, 
            newStreak, // progress
            newStreak, // current_value
            true, // completed
            new Date(), // completed_at
            JSON.stringify({ 
              points_earned: achievement.points,
              event_type: 'daily_login',
              streak: newStreak,
              description: `Ежедневный вход (стрик ${newStreak} дней)`
            }) // metadata
          ]);
          
          console.log(`🎉 Получено достижение: ${achievement.code} (стрик: ${newStreak} дней)`);
          console.log(`ℹ️ Награда (${achievement.points} экоинов) будет начислена после клика "Забрать награду"`);
        }
      }
    } catch (achievementError) {
      console.error('❌ Ошибка при обработке достижений входа:', achievementError);
      // Не прерываем вход из-за ошибки достижений
    }

    // Коммитим транзакцию
    await client.query('COMMIT');

    // Генерация JWT токена
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        nickname: user.nickname,
        is_admin: user.is_admin,
        isAdmin: user.is_admin
      },
      process.env.JWT_SECRET || 'ecosteps-secret-key-2024',
      { expiresIn: '30d' }
    );

    // Успешная авторизация
    const responseData = {
      success: true,
      message: 'Авторизация успешна',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        isAdmin: user.is_admin || false,
        is_admin: user.is_admin || false,
        carbonSaved: user.carbon_saved || 0,
        ecoCoins: updateResult.rows[0].eco_coins || user.eco_coins || 0,
        ecoLevel: user.eco_level || 'Эко-новичок',
        avatarEmoji: user.avatar_emoji || '🌱',
        loginStreak: newStreak,
        lastLoginAt: now.toISOString()
      }
    };
    
    res.json(responseData);
    
    console.log('=== КОНЕЦ ОБРАБОТКИ ВХОДА (УСПЕХ) ===');

  } catch (error) {
    console.error('=== НЕОБРАБОТАННАЯ ОШИБКА ВО ВХОДЕ ===');
    console.error('Ошибка:', error);
    
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
    
    console.log('=== КОНЕЦ ОБРАБОТКИ ВХОДА (ОШИБКА) ===');
  }
});

// Проверка токена (верификация)
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
      
      // Получаем актуальные данные пользователя
      const userQuery = `
        SELECT id, email, nickname, is_admin, carbon_saved, eco_level, avatar_emoji, is_banned, eco_coins
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
          ecoCoins: user.eco_coins || 0,
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
    console.error('Ошибка в верификации токена:', error);
    
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// Обновление токена
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
          nickname: decoded.nickname,
          is_admin: decoded.is_admin,
          isAdmin: decoded.isAdmin
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
    console.error('Ошибка в обновлении токена:', error);
    
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
});
// Добавьте эти функции в конец auth.js, перед module.exports

// Функция для проверки ежедневного входа и достижений
const checkDailyLoginAchievements = async (client, userId) => {
  try {
    const now = new Date();
    const mskOffset = 3; // MSK timezone (UTC+3)
    const nowMSK = new Date(now.getTime() + (mskOffset * 60 * 60 * 1000));
    
    // Определяем начало текущих суток по MSK
    const startOfDayMSK = new Date(nowMSK);
    startOfDayMSK.setHours(0, 0, 0, 0);
    
    // Конвертируем обратно в UTC
    const startOfDayUTC = new Date(startOfDayMSK.getTime() - (mskOffset * 60 * 60 * 1000));

    // Получаем информацию о пользователе
    const userQuery = `
      SELECT id, login_streak, last_daily_login 
      FROM users WHERE id = $1
    `;
    
    const userResult = await client.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return { updated: false, streak: 1 };
    }
    
    const user = userResult.rows[0];
    const lastDailyLogin = user.last_daily_login ? new Date(user.last_daily_login) : null;
    let updated = false;
    let newStreak = user.login_streak || 1;
    
    // Проверяем, заходил ли пользователь сегодня по MSK
    if (!lastDailyLogin || lastDailyLogin < startOfDayUTC) {
      updated = true;
      
      // Обновляем дату последнего ежедневного входа
      await client.query(
        `UPDATE users SET last_daily_login = $1 WHERE id = $2`,
        [now, userId]
      );
      
      // Вычисляем новый стрик
      if (lastDailyLogin) {
        const yesterdayMSK = new Date(startOfDayMSK);
        yesterdayMSK.setDate(yesterdayMSK.getDate() - 1);
        const yesterdayUTC = new Date(yesterdayMSK.getTime() - (mskOffset * 60 * 60 * 1000));
        
        const timeDiff = yesterdayUTC.getTime() - lastDailyLogin.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
        if (Math.abs(daysDiff) === 1) {
          newStreak = (user.login_streak || 0) + 1;
        } else if (Math.abs(daysDiff) > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      
      // Обновляем стрик
      await client.query(
        `UPDATE users SET login_streak = $1 WHERE id = $2`,
        [newStreak, userId]
      );
      
      console.log(`✅ Daily login засчитан для пользователя ${userId} (стрик: ${newStreak} дней)`);
      
      // Проверяем достижения для нового стрика
      await checkStreakAchievements(client, userId, newStreak);
    }
    
    return { updated, streak: newStreak };
    
  } catch (error) {
    console.error('❌ Ошибка при проверке ежедневного входа:', error);
    return { updated: false, streak: 1 };
  }
};

// Функция для проверки достижений за стрик
const checkStreakAchievements = async (client, userId, streak) => {
  try {
    // Проверяем достижения для разных уровней стрика
    const achievementLevels = [3, 7, 30];
    
    for (const level of achievementLevels) {
      if (streak === level) {
        // Ищем достижение для этого стрика
        const achievementQuery = `
          SELECT id, code, title, points 
          FROM achievements 
          WHERE code = $1 OR (event_type = 'daily_login' AND requirement_value = $2)
        `;
        
        const code = `daily_streak_${level}`;
        const achievementResult = await client.query(achievementQuery, [code, level]);
        
        if (achievementResult.rows.length > 0) {
          const achievement = achievementResult.rows[0];
          
          // Проверяем, не получено ли уже это достижение
          const existingQuery = `
            SELECT id FROM user_achievements 
            WHERE user_id = $1 AND achievement_id = $2
          `;
          
          const existingResult = await client.query(existingQuery, [userId, achievement.id]);
          
          if (existingResult.rows.length === 0) {
            // Присваиваем достижение
            const insertQuery = `
              INSERT INTO user_achievements (
                user_id, 
                achievement_id, 
                progress, 
                current_value, 
                completed, 
                completed_at,
                metadata
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING id
            `;
            
            await client.query(insertQuery, [
              userId, 
              achievement.id, 
              100, // progress 100%
              streak, // current_value
              true, // completed
              new Date(), // completed_at
              JSON.stringify({ 
                points_earned: achievement.points,
                streak: streak,
                earned_at: new Date().toISOString(),
                description: `Достижение за ${streak} дней подряд`
              })
            ]);
            
            console.log(`🎉 Пользователь ${userId} получил достижение: ${achievement.code} (стрик: ${streak} дней)`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке достижений:', error);
  }
};

// Новый эндпоинт для проверки ежедневного входа (можно вызывать с фронтенда)
router.get('/check-daily', async (req, res) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ecosteps-secret-key-2024');
    const userId = decoded.userId;
    
    const client = await pool.connect();
    
    try {
      const result = await checkDailyLoginAchievements(client, userId);
      
      res.json({
        success: true,
        updated: result.updated,
        streak: result.streak,
        message: result.updated 
          ? `🎉 Ежедневный вход засчитан! Ваш стрик: ${result.streak} дней` 
          : 'Вы уже заходили сегодня'
      });
    } finally {
      await client.release();
    }
    
  } catch (error) {
    console.error('Ошибка при проверке daily login:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Ошибка при проверке ежедневного входа'
    });
  }
});

module.exports = router;