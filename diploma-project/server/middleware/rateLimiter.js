// Rate limiting middleware

const rateLimit = require('express-rate-limit');

// Общий лимит для API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 500, // Максимум 500 запросов за окно
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Слишком много запросов. Попробуйте позже.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Строгий лимит для авторизации/регистрации
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 50, // Максимум 50 попыток за окно (увеличено для разработки)
  message: {
    success: false,
    error: 'TOO_MANY_AUTH_ATTEMPTS',
    message: 'Слишком много попыток входа. Попробуйте через 15 минут.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Лимит для лайков (предотвращение спама)
const likeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: 10, // Максимум 10 лайков в минуту
  message: {
    success: false,
    error: 'TOO_MANY_LIKES',
    message: 'Слишком много лайков. Подождите минуту.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Лимит для калькулятора
const calculatorLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: 20, // Максимум 20 расчетов в минуту
  message: {
    success: false,
    error: 'TOO_MANY_CALCULATIONS',
    message: 'Слишком много расчетов. Подождите минуту.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  likeLimiter,
  calculatorLimiter
};