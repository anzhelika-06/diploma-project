const redis = require('redis');

// Создаем Redis клиент
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
  },
  password: process.env.REDIS_PASSWORD || undefined
});

// Обработка ошибок
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('🔴 Redis подключается...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis готов к работе');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis переподключается...');
});

// Подключаемся к Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('❌ Ошибка подключения к Redis:', err);
    process.exit(1); // Выходим если Redis недоступен
  }
})();

module.exports = redisClient;
