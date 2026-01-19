const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const redisClient = require('./utils/redisClient');
const sessionManager = require('./utils/sessionManager');
const { requestLogger } = require('./utils/logger');
const { generalLimiter, authLimiter, calculatorLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Настраиваем Redis adapter для Socket.IO (для multi-server support)
const pubClient = redisClient.duplicate();
const subClient = redisClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log('✅ Socket.IO Redis adapter подключен');
}).catch((err) => {
  console.error('❌ Ошибка подключения Redis adapter:', err);
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Ограничиваем размер запроса
app.use(requestLogger); // Логирование запросов

// Rate limiting
app.use('/api/', generalLimiter); // Общий лимит для всех API
app.use('/api/auth/', authLimiter); // Строгий лимит для авторизации
app.use('/api/calculator/', calculatorLimiter); // Лимит для калькулятора

// Делаем io доступным для роутов
app.set('io', io);

// WebSocket подключения
io.on('connection', (socket) => {
  console.log('🔌 Новое WebSocket подключение:', socket.id);
  
  // Аутентификация пользователя
  socket.on('authenticate', async (data) => {
    const { userId, nickname } = data;
    
    if (!userId) {
      console.log('⚠️ Попытка аутентификации без userId');
      return;
    }
    
    // Сохраняем сессию в Redis
    await sessionManager.saveSession(socket.id, {
      userId,
      nickname: nickname || `User${userId}`,
      connectedAt: new Date().toISOString()
    });
    
    // Присоединяем к персональной комнате
    socket.join(`user:${userId}`);
    
    console.log(`👤 Пользователь аутентифицирован: ${nickname} (ID: ${userId}, Socket: ${socket.id})`);
    
    // Получаем количество онлайн пользователей
    const onlineCount = await sessionManager.getOnlineCount();
    
    // Отправляем подтверждение
    socket.emit('authenticated', {
      success: true,
      userId,
      nickname,
      onlineUsers: onlineCount
    });
    
    // Уведомляем всех о новом пользователе онлайн
    io.emit('user:online', {
      userId,
      nickname,
      onlineCount
    });
  });
  
  // Присоединение к комнате (например, команда)
  socket.on('join:room', (roomId) => {
    socket.join(roomId);
    console.log(`📍 Socket ${socket.id} присоединился к комнате: ${roomId}`);
  });
  
  // Выход из комнаты
  socket.on('leave:room', (roomId) => {
    socket.leave(roomId);
    console.log(`📍 Socket ${socket.id} покинул комнату: ${roomId}`);
  });
  
  // Отправка личного сообщения
  socket.on('message:private', async (data) => {
    const { targetUserId, message } = data;
    const session = await sessionManager.getSession(socket.id);
    
    if (!session) {
      socket.emit('error', { message: 'Не аутентифицирован' });
      return;
    }
    
    // Отправляем сообщение всем сокетам целевого пользователя
    io.to(`user:${targetUserId}`).emit('message:received', {
      fromUserId: session.userId,
      fromNickname: session.nickname,
      message,
      timestamp: new Date()
    });
    
    console.log(`💬 Личное сообщение от ${session.nickname} к пользователю ${targetUserId}`);
  });
  
  // Запрос списка онлайн пользователей
  socket.on('get:online:users', async () => {
    const users = await sessionManager.getOnlineUsers();
    socket.emit('online:users:list', {
      users,
      total: users.length
    });
  });
  
  // Отключение
  socket.on('disconnect', async () => {
    // Получаем сессию ДО удаления
    const session = await sessionManager.getSession(socket.id);
    const result = await sessionManager.deleteSession(socket.id);
    
    if (result && session) {
      const { userId, isFullyOffline } = result;
      
      if (isFullyOffline) {
        const onlineCount = await sessionManager.getOnlineCount();
        
        // Уведомляем всех что пользователь офлайн
        io.emit('user:offline', {
          userId,
          nickname: session.nickname,
          onlineCount
        });
        
        console.log(`👋 Пользователь отключился: ${session.nickname} (ID: ${userId})`);
      } else {
        console.log(`🔌 Закрыто одно соединение пользователя ${session.nickname}`);
      }
    } else {
      console.log('👋 Неаутентифицированное соединение закрыто:', socket.id);
    }
  });
});

// Экспортируем sessionManager для использования в роутах
app.set('sessionManager', sessionManager);

// Подключаем маршруты
const authRoutes = require('./routes/auth');
const storiesRoutes = require('./routes/stories');
const rankingsRoutes = require('./routes/rankings');
const teamsRoutes = require('./routes/teams');
const achievementsRoutes = require('./routes/achievements');
const leaderboardRoutes = require('./routes/leaderboard');
// const ecoTipsRoutes = require('./routes/eco-tips');

app.use('/api/auth', authRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
// app.use('/api/eco-tips', ecoTipsRoutes);

// Временный роут для эко-советов
app.get('/api/eco-tips/daily', (req, res) => {
  const testTip = {
    id: 1,
    title: 'Замените лампочки на LED',
    content: 'LED-лампы потребляют на 80% меньше энергии и служат в 25 раз дольше обычных. Одна замена экономит до 40 кг CO₂ в год.',
    category: 'Энергия',
    difficulty: 'easy',
    co2_impact: 40000,
    day_of_year: 1
  };
  res.json(testTip);
});

app.get('/api/eco-tips/random', (req, res) => {
  const testTips = [
    {
      id: 1,
      title: 'Замените лампочки на LED',
      content: 'LED-лампы потребляют на 80% меньше энергии и служат в 25 раз дольше обычных.',
      category: 'Энергия',
      difficulty: 'easy',
      co2_impact: 40000
    },
    {
      id: 2,
      title: 'Используйте многоразовые пакеты',
      content: 'Один многоразовый пакет заменяет до 1000 пластиковых за свою жизнь.',
      category: 'Отходы',
      difficulty: 'easy',
      co2_impact: 5000
    }
  ];
  const randomTip = testTips[Math.floor(Math.random() * testTips.length)];
  res.json(randomTip);
});

// API для статистики
app.get('/api/stats', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      user: process.env.DB_USER || 'ecosteps',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'ecosteps',
      password: process.env.DB_PASSWORD || 'ecosteps_password',
      port: process.env.DB_PORT || 5432,
    });

    // Получаем все статистики одним запросом
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as active_users,
        (SELECT COALESCE(SUM(carbon_saved), 0) FROM users) as total_co2_saved,
        (SELECT COUNT(*) FROM teams) as eco_teams,
        (SELECT COUNT(*) FROM success_stories) as success_stories
    `;
    
    const result = await pool.query(statsQuery);
    const stats = result.rows[0];
    
    // Форматируем CO2 в удобный вид (тонны)
    const co2InTons = Math.round(stats.total_co2_saved / 1000 * 10) / 10;
    
    res.json({
      success: true,
      stats: {
        activeUsers: parseInt(stats.active_users),
        co2Saved: co2InTons,
        ecoTeams: parseInt(stats.eco_teams),
        successStories: parseInt(stats.success_stories)
      }
    });
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR'
    });
  }
});
app.post('/api/calculator/calculate', (req, res) => {
  const { nutrition, transport } = req.body;
  const recommendations = [];
  
  // Персонализированные рекомендации
  if (nutrition === 'meat') {
    recommendations.push({
      category: 'Питание',
      suggestion: 'Сократите потребление красного мяса до 2-3 раз в неделю',
      impact: 'Снижение на 500-800 кг CO₂/год'
    });
    recommendations.push({
      category: 'Питание',
      suggestion: 'Попробуйте один день в неделю без мяса (Meatless Monday)',
      impact: 'Снижение на 200-300 кг CO₂/год'
    });
  }
  
  if (transport === 'car') {
    recommendations.push({
      category: 'Транспорт',
      suggestion: 'Используйте общественный транспорт для поездок на работу',
      impact: 'Снижение на 1500-2500 кг CO₂/год'
    });
    recommendations.push({
      category: 'Транспорт',
      suggestion: 'Рассмотрите покупку гибридного или электрического автомобиля',
      impact: 'Снижение на 2000-3000 кг CO₂/год'
    });
    recommendations.push({
      category: 'Транспорт',
      suggestion: 'Планируйте поездки и объединяйте несколько дел в одну',
      impact: 'Снижение на 300-500 кг CO₂/год'
    });
  }
  
  // Общие рекомендации
  recommendations.push({
    category: 'Общее',
    suggestion: 'Рассмотрите компенсацию выбросов через посадку деревьев',
    impact: 'Компенсация 20-50 кг CO₂ на дерево в год'
  });
  
  res.json({
    success: true,
    data: {
      nutrition: { type: nutrition, carbon: 2330 },
      transport: { type: transport, carbon: 4200 },
      total: { carbon: 6530, level: 'critical', message: 'Критически высокий углеродный след' },
      recommendations,
      calculatedAt: new Date().toISOString()
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API для получения онлайн пользователей
app.get('/api/online-users', async (req, res) => {
  const sessionManager = req.app.get('sessionManager');
  const onlineUsers = await sessionManager.getOnlineUsers();
  
  res.json({
    success: true,
    users: onlineUsers,
    total: onlineUsers.length
  });
});

server.listen(PORT, () => {
  console.log(`✅ EcoSteps API Server запущен на порту ${PORT}`);
  console.log(`📡 http://localhost:${PORT}`);
  console.log(`🔌 WebSocket готов к подключениям`);
});