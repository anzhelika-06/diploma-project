const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const redisClient = require('./utils/redisClient');
const sessionManager = require('./utils/sessionManager');
const { requestLogger } = require('./utils/logger');
const { generalLimiter, authLimiter, calculatorLimiter } = require('./middleware/rateLimiter');
const adminRoutes = require('./routes/adminRoutes');
const reportsRoutes = require('./routes/reports');
const notificationsRoutes = require('./routes/notifications');
const { startEcoTipsScheduler } = require('./utils/ecoTipsScheduler');
// Подключаем маршруты
const authRoutes = require('./routes/auth');
const storiesRoutes = require('./routes/stories');
const rankingsRoutes = require('./routes/rankings');
const teamsRoutes = require('./routes/teams');
const achievementsRoutes = require('./routes/achievements');
const leaderboardRoutes = require('./routes/leaderboard');
const userSettingsRoutes = require('./routes/user-settings');
const supportRoutes = require('./routes/support');
const postsRoutes = require('./routes/posts');
const calculationsRouter = require('./routes/calculations');
const profileRouter = require('./routes/profile');
const petRouter = require('./routes/pet');
const messagesRouter = require('./routes/messages');
const treesRouter = require('./routes/trees');
const streakRouter = require('./routes/streak');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});
// Настраиваем Redis adapter для Socket.IO
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
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// Rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/calculator/', calculatorLimiter);

// Делаем io доступным для роутов
app.set('io', io);

// WebSocket подключения
io.on('connection', (socket) => {
  console.log('🔌 Новое WebSocket подключение:', socket.id);
  console.log('   Transport:', socket.conn.transport.name);
  console.log('   IP:', socket.handshake.address);
  
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
    
    console.log('✅ Отправлено подтверждение аутентификации');
    
    // Тестовое событие для проверки WebSocket
    setTimeout(() => {
      socket.emit('test:message', {
        message: 'WebSocket работает!',
        timestamp: new Date().toISOString()
      });
      console.log('🧪 Отправлено тестовое сообщение пользователю', userId);
    }, 1000);
    
    // Уведомляем всех о новом пользователе онлайн
    io.emit('user:online', {
      userId,
      nickname,
      onlineCount
    });
  });
  
  // Присоединение к комнате
  socket.on('join:room', (roomId) => {
    socket.join(roomId);
    console.log(`📍 Socket ${socket.id} присоединился к комнате: ${roomId}`);
    
    // Отправляем подтверждение присоединения
    socket.emit('room:joined', {
      roomId: roomId,
      success: true,
      timestamp: new Date().toISOString()
    });
    
    // Тестовое уведомление для проверки
    setTimeout(() => {
      io.to(roomId).emit('test:notification', {
        message: `Тестовое уведомление для комнаты ${roomId}`,
        timestamp: new Date().toISOString()
      });
      console.log(`🧪 Отправлено тестовое уведомление в комнату ${roomId}`);
    }, 2000);
  });

  // Присоединение к командному чату
  socket.on('join:team', (teamId) => {
    socket.join(`team:${teamId}`);
    console.log(`📍 Socket ${socket.id} присоединился к командному чату team:${teamId}`);
  });

  // Покинуть командный чат
  socket.on('leave:team', (teamId) => {
    socket.leave(`team:${teamId}`);
    console.log(`📍 Socket ${socket.id} покинул командный чат team:${teamId}`);
  });

  // Отправка личного сообщения через socket
  socket.on('send:direct', async (data) => {
    const { receiverId, content } = data;
    const session = await sessionManager.getSession(socket.id);
    if (!session || !content?.trim()) return;

    try {
      const { pool } = require('./config/database');
      // Проверяем дружбу
      const friendship = await pool.query(
        `SELECT id FROM friendships
         WHERE ((user_id=$1 AND friend_id=$2) OR (user_id=$2 AND friend_id=$1))
           AND status='accepted'`,
        [session.userId, receiverId]
      );
      if (!friendship.rows.length) return;

      const result = await pool.query(
        `INSERT INTO direct_messages (sender_id, receiver_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, sender_id, receiver_id, content, is_read, created_at`,
        [session.userId, receiverId, content.trim()]
      );
      const msg = {
        ...result.rows[0],
        sender_nickname: session.nickname,
        sender_avatar: session.avatar_emoji || '🌱'
      };
      io.to(`user:${receiverId}`).emit('message:direct', msg);
      io.to(`user:${session.userId}`).emit('message:direct', msg);
    } catch (err) {
      console.error('socket send:direct error:', err);
    }
  });

  // Отправка сообщения в командный чат через socket
  socket.on('send:team', async (data) => {
    const { teamId, content } = data;
    const session = await sessionManager.getSession(socket.id);
    if (!session || !content?.trim()) return;

    try {
      const { pool } = require('./config/database');
      const member = await pool.query(
        'SELECT id FROM team_members WHERE team_id=$1 AND user_id=$2',
        [teamId, session.userId]
      );
      if (!member.rows.length) return;

      const result = await pool.query(
        `INSERT INTO team_messages (team_id, sender_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, team_id, sender_id, content, created_at`,
        [teamId, session.userId, content.trim()]
      );
      // Обновляем last_read_at для отправителя
      await pool.query(
        `INSERT INTO team_message_reads (user_id, team_id, last_read_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id, team_id) DO UPDATE SET last_read_at = NOW()`,
        [session.userId, teamId]
      );
      const msg = {
        ...result.rows[0],
        sender_nickname: session.nickname,
        sender_avatar: session.avatar_emoji || '🌱'
      };
      io.to(`team:${teamId}`).emit('message:team', msg);
    } catch (err) {
      console.error('socket send:team error:', err);
    }
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

// Экспортируем sessionManager и io для использования в роутах
app.set('sessionManager', sessionManager);
app.set('io', io);

// Подключаем маршруты
app.use('/api/auth', authRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/user-settings', userSettingsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/calculations', calculationsRouter);
app.use('/api/users', profileRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/pet', petRouter);
app.use('/api/trees', treesRouter);
app.use('/api/streak', streakRouter);
// Временный роут для эко-советов - исправленная версия
app.get('/api/eco-tips/daily', (req, res) => {
  console.log('GET /api/eco-tips/daily');
  
  try {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    
    const testTip = {
      id: 1,
      title: 'Замените лампочки на LED',
      content: 'LED-лампы потребляют на 80% меньше энергии и служат в 25 раз дольше обычных. Одна замена экономит до 40 кг CO₂ в год.',
      category: 'Энергия',
      difficulty: 'easy',
      co2_impact: 40000,
      day_of_year: dayOfYear,
      date: today.toISOString()
    };
    
    res.json(testTip);
  } catch (error) {
    console.error('Ошибка в /api/eco-tips/daily:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Ошибка при получении эко-совета'
    });
  }
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

// Тестовый маршрут для поддержки
app.post('/api/support/debug', (req, res) => {
  console.log('=== DEBUG SUPPORT REQUEST ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('============================');
  
  res.json({
    success: true,
    message: 'Тестовый запрос получен',
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/support/my-questions/debug', (req, res) => {
  console.log('=== DEBUG GET MY QUESTIONS ===');
  console.log('Headers:', req.headers);
  console.log('==============================');
  
  res.json({
    success: true,
    message: 'Тестовый запрос на получение вопросов',
    headers: req.headers,
    tickets: [
      {
        id: 1,
        ticket_number: 'TEST-001',
        subject: 'Тестовый вопрос',
        message: 'Это тестовое сообщение',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ]
  });
});

server.listen(PORT, () => {
  console.log(`✅ EcoSteps API Server запущен на порту ${PORT}`);
  console.log(`📡 http://localhost:${PORT}`);
  console.log(`🔌 WebSocket готов к подключениям`);
  
  // Запускаем планировщик ежедневных эко-советов
  startEcoTipsScheduler(io);
});