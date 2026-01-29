const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен отсутствует'
      });
    }

    // Верифицируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Проверяем наличие userId
    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Неверный формат токена'
      });
    }
    
    // Создаем объект пользователя из токена
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      nickname: decoded.nickname,
      is_admin: decoded.is_admin || decoded.isAdmin || false,
      isAdmin: decoded.is_admin || decoded.isAdmin || false
    };
    
    next();
    
  } catch (jwtError) {
    if (jwtError.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Токен просрочен'
      });
    }
    
    if (jwtError.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Недействительный токен'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Ошибка верификации токена'
    });
  }
};

// Асинхронная версия с проверкой в базе
const authenticateTokenWithDB = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен отсутствует'
      });
    }

    // Верифицируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Неверный формат токена'
      });
    }
    
    // Получаем пользователя из базы
    const userResult = await pool.query(
      'SELECT id, email, nickname, is_admin, is_banned FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    const dbUser = userResult.rows[0];
    
    // Проверяем бан
    if (dbUser.is_banned) {
      return res.status(403).json({
        success: false,
        message: 'Ваш аккаунт заблокирован'
      });
    }
    
    // Используем данные из базы (более надежно)
    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      nickname: dbUser.nickname,
      is_admin: dbUser.is_admin,
      isAdmin: dbUser.is_admin
    };
    
    next();
    
  } catch (jwtError) {
    if (jwtError.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Токен просрочен'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Недействительный токен'
    });
  }
};

// Middleware для проверки прав администратора
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Требуется авторизация'
    });
  }
  
  if (!req.user.is_admin && !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Доступ запрещен. Требуются права администратора.'
    });
  }
  
  next();
};

module.exports = {
  authenticateToken,          // Быстрая проверка по токену
  authenticateTokenWithDB,   // Полная проверка с запросом к БД
  isAdmin
};