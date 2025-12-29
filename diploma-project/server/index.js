const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Простые маршруты для тестирования
app.get('/', (req, res) => {
  res.json({ 
    message: 'Сервер дипломного проекта работает!',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: [
      { method: 'GET', path: '/', description: 'Информация о сервере' },
      { method: 'GET', path: '/api/health', description: 'Проверка здоровья сервера' },
      { method: 'GET', path: '/api/test', description: 'Тестовый endpoint' }
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Тестовый запрос успешен!',
    data: { id: 1, name: 'Test Item', value: 42 }
  });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Путь ${req.path} не найден`
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`📡 http://localhost:${PORT}`);
  console.log(`🌐 Доступные endpoints:`);
  console.log(`   GET / - информация о сервере`);
  console.log(`   GET /api/health - проверка здоровья`);
  console.log(`   GET /api/test - тестовые данные`);
});