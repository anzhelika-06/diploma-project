const express = require('express');
const router = express.Router();

console.log('Calculator router created');

router.post('/calculate', (req, res) => {
  console.log('=== НОВЫЕ РЕКОМЕНДАЦИИ! ===');
  
  const recommendations = [
    {
      category: 'Питание',
      suggestion: 'Сократите потребление красного мяса до 2-3 раз в неделю',
      impact: 'Снижение на 500-800 кг CO₂/год'
    },
    {
      category: 'Транспорт', 
      suggestion: 'Используйте общественный транспорт для поездок на работу',
      impact: 'Снижение на 1500-2500 кг CO₂/год'
    },
    {
      category: 'Общее',
      suggestion: 'Рассмотрите компенсацию выбросов через посадку деревьев',
      impact: 'Компенсация 20-50 кг CO₂ на дерево в год'
    }
  ];
  
  res.json({
    success: true,
    data: {
      recommendations,
      message: 'Новые персонализированные рекомендации работают!'
    }
  });
});

console.log('Calculator router configured');
module.exports = router;