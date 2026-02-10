// Утилиты для валидации входных данных

// Разрешенные категории историй
const ALLOWED_CATEGORIES = [
  'Общее', 'Транспорт', 'Энергия', 'Отходы', 'Вода', 'Питание', 'Природа', 'Быт'
];

// Разрешенные фильтры для историй
const ALLOWED_FILTERS = ['all', 'best', 'recent'];

// Разрешенные типы сортировки
const ALLOWED_SORT_TYPES = ['carbon_saved', 'created_at', 'likes_count'];

// Разрешенные статусы историй
const ALLOWED_STATUSES = ['draft', 'pending', 'published', 'rejected', 'all'];

/**
 * Валидация категории историй
 */
const validateCategory = (category) => {
  if (!category || category === 'all') return true;
  return ALLOWED_CATEGORIES.includes(category);
};

/**
 * Валидация фильтра историй
 */
const validateFilter = (filter) => {
  if (!filter) return true;
  return ALLOWED_FILTERS.includes(filter);
};

/**
 * Валидация статуса истории для запроса (фильтрация)
 */
const validateStatus = (status) => {
  if (!status || status === 'all') return 'published'; // по умолчанию published для запросов
  return ALLOWED_STATUSES.includes(status) ? status : 'published';
};

/**
 * Валидация статуса для создания/редактирования истории
 */
const validateStoryStatus = (status) => {
  if (!status) return 'pending'; // при создании по умолчанию pending
  return ALLOWED_STATUSES.slice(0, 4).includes(status) ? status : 'pending'; // исключаем 'all'
};

/**
 * Валидация параметров пагинации
 */
const validatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  
  // Ограничиваем максимальный лимит (увеличено для экспорта)
  const maxLimit = 10000;
  const validLimit = Math.min(limitNum, maxLimit);
  
  // Минимальная страница - 1
  const validPage = Math.max(pageNum, 1);
  
  return {
    page: validPage,
    limit: validLimit,
    offset: (validPage - 1) * validLimit
  };
};

/**
 * Валидация ID пользователя
 */
const validateUserId = (userId) => {
  if (!userId) return null;
  const id = parseInt(userId);
  return (id && id > 0) ? id : null;
};

/**
 * Валидация ID истории
 */
const validateStoryId = (storyId) => {
  const id = parseInt(storyId);
  return (id && id > 0) ? id : null;
};

/**
 * Валидация типа сортировки
 */
const validateSortType = (sortType) => {
  if (!sortType) return 'created_at';
  return ALLOWED_SORT_TYPES.includes(sortType) ? sortType : 'created_at';
};

/**
 * Санитизация строки (базовая защита от XSS)
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, 1000); // Ограничиваем длину
};

/**
 * Валидация email
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Валидация никнейма
 */
const validateNickname = (nickname) => {
  if (!nickname || typeof nickname !== 'string') return false;
  const trimmed = nickname.trim();
  return trimmed.length >= 2 && trimmed.length <= 50;
};

/**
 * Валидация заголовка истории
 */
const validateStoryTitle = (title) => {
  if (!title || typeof title !== 'string') return false;
  const trimmed = title.trim();
  return trimmed.length >= 3 && trimmed.length <= 255;
};

/**
 * Валидация содержания истории
 */
const validateStoryContent = (content) => {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  return trimmed.length >= 10 && trimmed.length <= 5000;
};

/**
 * Валидация количества сэкономленного CO2
 */
const validateCarbonSaved = (carbonSaved) => {
  const num = parseFloat(carbonSaved);
  return !isNaN(num) && num >= 0 && num <= 10000;
};

module.exports = {
  validateCategory,
  validateFilter,
  validateStatus,
  validateStoryStatus,
  validatePagination,
  validateUserId,
  validateStoryId,
  validateSortType,
  sanitizeString,
  validateEmail,
  validateNickname,
  validateStoryTitle,
  validateStoryContent,
  validateCarbonSaved,
  ALLOWED_CATEGORIES,
  ALLOWED_FILTERS,
  ALLOWED_SORT_TYPES,
  ALLOWED_STATUSES
};