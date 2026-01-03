const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Подключаем маршруты
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Простой роутер для тестирования
app.post('/api/calculator/calculate', (req, res) => {
  console.log('=== НОВЫЕ РЕКОМЕНДАЦИИ РАБОТАЮТ! ===');
  
  const { nutrition, transport } = req.body;
  const recommendations = [];
  
  // Новые персонализированные рекомендации
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
  
  console.log('Новые рекомендации:', recommendations);
  
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

app.listen(PORT, () => {
  console.log(`✅ EcoSteps API Server запущен на порту ${PORT}`);
  console.log(`📡 http://localhost:${PORT}`);
  console.log(`🌐 Новые персонализированные рекомендации готовы!`);
});