// Rate limiting middleware

const rateLimit = require('express-rate-limit');

// Общий лимит для API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 2000, // Максимум 2000 запросов за окно
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
  max: 100, // Максимум 100 попыток за окно
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
  windowMs: 10 * 60 * 1000, // 10 минут
  max: 100, // Максимум 100 лайков за 10 минут
  message: {
    success: false,
    error: 'TOO_MANY_LIKES',
    message: 'Слишком много лайков. Подождите немного.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Лимит для калькулятора
const calculatorLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: 50, // Максимум 50 расчетов в минуту
  message: {
    success: false,
    error: 'TOO_MANY_CALCULATIONS',
    message: 'Слишком много расчетов. Подождите минуту.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Лимит для создания историй
const createStoryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 100, // Максимум 100 историй в час
  message: {
    success: false,
    error: 'TOO_MANY_STORIES',
    message: 'Слишком много историй. Попробуйте позже.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
module.exports = {
  generalLimiter,
  authLimiter,
  likeLimiter,
  calculatorLimiter,
  createStoryLimiter
};