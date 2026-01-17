// Утилиты для логирования

/**
 * Логирование медленных запросов
 */
const logSlowQuery = (query, params, duration, threshold = 1000) => {
  if (duration > threshold) {
    console.warn(`🐌 Slow query (${duration}ms):`, {
      query: query.replace(/\s+/g, ' ').trim(),
      params,
      duration,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Логирование ошибок базы данных
 */
const logDatabaseError = (error, query, params) => {
  console.error('💥 Database error:', {
    error: error.message,
    code: error.code,
    query: query?.replace(/\s+/g, ' ').trim(),
    params,
    timestamp: new Date().toISOString()
  });
};

/**
 * Логирование API запросов
 */
const logApiRequest = (req, res, duration) => {
  const { method, url, ip } = req;
  const { statusCode } = res;
  
  const logLevel = statusCode >= 400 ? 'error' : 'info';
  const emoji = statusCode >= 500 ? '💥' : statusCode >= 400 ? '⚠️' : '✅';
  
  console[logLevel](`${emoji} ${method} ${url}`, {
    statusCode,
    duration: `${duration}ms`,
    ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
};

/**
 * Middleware для логирования запросов
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logApiRequest(req, res, duration);
  });
  
  next();
};

/**
 * Обертка для выполнения запросов с логированием
 */
const executeQueryWithLogging = async (pool, query, params = []) => {
  const startTime = Date.now();
  
  try {
    const result = await pool.query(query, params);
    const duration = Date.now() - startTime;
    
    // Логируем медленные запросы
    logSlowQuery(query, params, duration);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Логируем ошибку
    logDatabaseError(error, query, params);
    
    throw error;
  }
};

module.exports = {
  logSlowQuery,
  logDatabaseError,
  logApiRequest,
  requestLogger,
  executeQueryWithLogging
};