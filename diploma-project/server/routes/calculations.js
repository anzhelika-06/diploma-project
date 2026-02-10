const express = require('express');
const router = express.Router();
const db = require('../config/database');

// История расчетов (для фронтенда)
router.get('/history', async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id;
    const limit = parseInt(req.query.limit) || 12;
    const offset = parseInt(req.query.offset) || 0;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Не указан ID пользователя'
      });
    }
    
    const result = await db.query(
      `SELECT 
        id,
        calculation_date as date,
        total_footprint as total,
        co2_saved as saved,
        is_baseline as isBaseline,
        categories,
        created_at
       FROM carbon_calculations 
       WHERE user_id = $1 
       ORDER BY calculation_date DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    const countResult = await db.query(
      'SELECT COUNT(*) FROM carbon_calculations WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        calculations: result.rows.map(calc => ({
          ...calc,
          categories: calc.categories || {},
          total: parseFloat(calc.total) || 0,
          saved: parseFloat(calc.saved) || 0
        })),
        total: parseInt(countResult.rows[0].count),
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Error fetching calculation history:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении истории расчетов'
    });
  }
});

// Статистика пользователя
router.get('/:userId/stats', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Не указан ID пользователя'
      });
    }
    
    // Получаем общую статистику пользователя
    const userResult = await db.query(
      'SELECT carbon_saved, eco_level, eco_coins, avatar_emoji FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    const user = userResult.rows[0];
    
    // Получаем последний расчет
    const lastCalcResult = await db.query(
      `SELECT total_footprint, calculation_date 
       FROM carbon_calculations 
       WHERE user_id = $1 
       ORDER BY calculation_date DESC 
       LIMIT 1`,
      [userId]
    );
    
    const lastCalculation = lastCalcResult.rows[0] || null;
    
    // Получаем количество целей
    const goalsResult = await db.query(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'active\' THEN 1 END) as active FROM user_carbon_goals WHERE user_id = $1',
      [userId]
    );
    
    // Получаем количество достижений
    const achievementsResult = await db.query(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN completed = true THEN 1 END) as completed FROM user_achievements WHERE user_id = $1',
      [userId]
    );
    
    // Получаем статистику команды (если есть)
    const teamResult = await db.query(
      `SELECT t.name, t.carbon_saved as team_saved
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       WHERE tm.user_id = $1
       LIMIT 1`,
      [userId]
    );
    
    // Получаем аналитику за месяц
    const analyticsResult = await db.query(
      `SELECT avg_footprint, footprint_trend, monthly_savings
       FROM user_carbon_analytics 
       WHERE user_id = $1 AND period_type = 'month'
       ORDER BY period_end DESC 
       LIMIT 1`,
      [userId]
    );
    
    const analytics = analyticsResult.rows[0] || {
      avg_footprint: 0,
      footprint_trend: 'stable',
      monthly_savings: 0
    };
    
    res.json({
      success: true,
      data: {
        user: {
          id: parseInt(userId),
          carbonSaved: user.carbon_saved || 0,
          ecoLevel: user.eco_level || 'Эко-новичок',
          ecoCoins: user.eco_coins || 0,
          avatarEmoji: user.avatar_emoji || '🌱'
        },
        calculations: {
          last: lastCalculation ? {
            total: parseFloat(lastCalculation.total_footprint) || 0,
            date: lastCalculation.calculation_date
          } : null,
          total: lastCalcResult.rowCount || 0
        },
        goals: {
          total: parseInt(goalsResult.rows[0]?.total) || 0,
          active: parseInt(goalsResult.rows[0]?.active) || 0
        },
        achievements: {
          total: parseInt(achievementsResult.rows[0]?.total) || 0,
          completed: parseInt(achievementsResult.rows[0]?.completed) || 0
        },
        team: teamResult.rows[0] ? {
          name: teamResult.rows[0].name,
          carbonSaved: teamResult.rows[0].team_saved
        } : null,
        analytics: {
          avgFootprint: parseFloat(analytics.avg_footprint) || 0,
          trend: analytics.footprint_trend || 'stable',
          monthlySavings: parseFloat(analytics.monthly_savings) || 0
        },
        categories: await getCategoryStats(userId)
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении статистики пользователя'
    });
  }
});

// Простой расчет углеродного следа
router.post('/calculate', async (req, res) => {
  try {
    const { userId, transport, housing, food, waste, calculationDate } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Не указан ID пользователя'
      });
    }
    
    // Используем дату из запроса или текущую дату сервера
    const calcDate = calculationDate || new Date().toISOString().split('T')[0];
    
    // Простой расчет CO2
    let totalFootprint = 0;
    const categories = {};
    
    // Транспорт (реальные коэффициенты в кг CO2 в ДЕНЬ)
    // Источник: EPA, средние значения
    if (transport) {
      const transportCO2 = 
        (transport.carKm || 0) * 0.192 +        // 192г CO2/км (бензин)
        (transport.busKm || 0) * 0.089 +        // 89г CO2/км
        (transport.planeKm || 0) * 0.255 / 30 + // 255г CO2/км (месячное, делим на 30)
        (transport.trainKm || 0) * 0.041;       // 41г CO2/км
      categories.transport = transportCO2;
      totalFootprint += transportCO2;
    }
    
    // Жилье (реальные коэффициенты в кг CO2 в ДЕНЬ)
    // Источник: IEA, средние по миру
    if (housing) {
      const housingCO2 = 
        (housing.electricity || 0) * 0.475 / 30 +  // 475г CO2/кВтч (месячное, делим на 30)
        (housing.heating || 0) * 0.185 / 30 +      // 185г CO2/кВтч
        (housing.water || 0) * 0.298 / 30 +        // 298г CO2/м³
        (housing.gas || 0) * 2.016 / 30;           // 2016г CO2/м³
      categories.housing = housingCO2;
      totalFootprint += housingCO2;
    }
    
    // Питание (реальные коэффициенты в кг CO2 в ДЕНЬ)
    // Источник: Poore & Nemecek (2018), Science
    if (food) {
      const foodCO2 = 
        (food.meatKg || 0) * 7.2 / 7 +          // 7.2 кг CO2/кг (говядина, недельное, делим на 7)
        (food.vegetablesKg || 0) * 0.4 / 7 +    // 0.4 кг CO2/кг
        (food.dairy || 0) * 1.4 / 7 +           // 1.4 кг CO2/л
        (food.processedFood || 0) * 1.2 / 7;    // 1.2 кг CO2/порция
      
      // Бонус за местные продукты (снижение транспортных выбросов)
      const localBonus = (food.localFood || 0) / 100;
      categories.food = foodCO2 * (1 - localBonus * 0.15);
      totalFootprint += categories.food;
    }
    
    // Отходы (реальные коэффициенты в кг CO2 в ДЕНЬ)
    // Источник: EPA Waste Reduction Model
    if (waste) {
      const wasteCO2 = (waste.plastic || 0) * 6.0 / 30; // 6 кг CO2/кг (месячное, делим на 30)
      
      // Бонус за переработку и компостирование
      const recyclingBonus = (waste.recycling || 0) / 100;
      const compostBonus = (waste.compost || 0) / 100;
      categories.waste = wasteCO2 * (1 - (recyclingBonus + compostBonus) * 0.4);
      totalFootprint += categories.waste;
    }
    
    // Расчет экономии CO2
    // Средний углеродный след в мире: ~10 тонн CO2/год = ~27 кг/день
    // Если наш след МЕНЬШЕ среднего - мы сэкономили эту разницу
    const averageDailyFootprint = 27; // кг CO2 в день
    const co2Saved = Math.max(0, averageDailyFootprint - totalFootprint);
    
    // Проверяем, был ли уже расчет за эту дату
    const existingCalcResult = await db.query(
      `SELECT co2_saved FROM carbon_calculations 
       WHERE user_id = $1 AND calculation_date = $2 AND is_baseline = false`,
      [userId, calcDate]
    );
    
    const hadCalculationToday = existingCalcResult.rows.length > 0;
    
    // Если уже был расчет за эту дату - возвращаем ошибку
    if (hadCalculationToday) {
      return res.status(400).json({
        success: false,
        error: 'Вы уже сделали расчет сегодня. Попробуйте завтра!',
        errorCode: 'CALCULATION_ALREADY_EXISTS_TODAY'
      });
    }
    
    // Сохраняем расчет
    const result = await db.query(
      `INSERT INTO carbon_calculations 
       (user_id, calculation_date, total_footprint, co2_saved, categories, is_baseline) 
       VALUES ($1, $2, $3, $4, $5, false) 
       RETURNING *`,
      [userId, calcDate, totalFootprint, co2Saved, JSON.stringify(categories)]
    );
    
    // Обновляем общую экономию пользователя
    if (co2Saved > 0) {
      await db.query(
        'UPDATE users SET carbon_saved = carbon_saved + $1 WHERE id = $2',
        [Math.round(co2Saved), userId]
      );
    }
    
    res.json({
      success: true,
      total_footprint: totalFootprint,
      co2_saved: co2Saved,
      categories,
      calculation: result.rows[0],
      isFirstToday: true
    });
  } catch (error) {
    console.error('Error calculating carbon footprint:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при расчете углеродного следа'
    });
  }
});

// Расширенный расчет (для фронтенда)
router.post('/calculate-extended', async (req, res) => {
  try {
    const {
      userId,
      transport = {},
      housing = {},
      food = {},
      goods = {},
      waste = {},
      water = {},
      other = {},
      notes = ''
    } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Не указан ID пользователя'
      });
    }
    
    // Преобразуем данные в формат для основного расчета
    const categories = {
      transport: { value: transport.value || 0, details: transport },
      housing: { value: housing.value || 0, details: housing },
      food: { value: food.value || 0, details: food },
      goods: { value: goods.value || 0, details: goods },
      waste: { value: waste.value || 0, details: waste },
      water: { value: water.value || 0, details: water },
      other: { value: other.value || 0, details: other }
    };
    
    // Рассчитываем общий след
    let totalFootprint = 0;
    for (const category of Object.values(categories)) {
      totalFootprint += parseFloat(category.value) || 0;
    }
    
    // Получаем предыдущий расчет для сравнения
    const previousResult = await db.query(
      `SELECT total_footprint FROM carbon_calculations 
       WHERE user_id = $1 AND is_baseline = true 
       ORDER BY calculation_date DESC LIMIT 1`,
      [userId]
    );
    
    const previousFootprint = previousResult.rows[0]?.total_footprint || 0;
    const co2Saved = previousFootprint > 0 ? Math.max(0, previousFootprint - totalFootprint) : 0;
    
    // Сохраняем расчет
    const result = await db.query(
      `INSERT INTO carbon_calculations 
       (user_id, calculation_date, total_footprint, co2_saved, is_baseline, 
        categories, calculation_method, notes) 
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [userId, totalFootprint, co2Saved, false, 
       JSON.stringify(categories), 'extended', notes]
    );
    
    // Обновляем общую экономию пользователя
    if (co2Saved > 0) {
      await db.query(
        'UPDATE users SET carbon_saved = carbon_saved + $1 WHERE id = $2',
        [Math.round(co2Saved), userId]
      );
    }
    
    // Генерируем рекомендации
    const recommendations = generateExtendedRecommendations(categories, totalFootprint);
    
    // Обновляем аналитику
    try {
      await db.query('CALL update_user_analytics($1, $2)', [userId, 'month']);
    } catch (analyticsError) {
      console.warn('Analytics update failed:', analyticsError);
    }
    
    res.json({
      success: true,
      data: {
        calculation: {
          id: result.rows[0].id,
          totalFootprint: Math.round(totalFootprint),
          co2Saved: Math.round(co2Saved),
          date: result.rows[0].calculation_date,
          categories
        },
        recommendations,
        summary: {
          total: Math.round(totalFootprint),
          saved: Math.round(co2Saved),
          changePercent: previousFootprint > 0 
            ? Math.round(((totalFootprint - previousFootprint) / previousFootprint) * 100 * 10) / 10
            : 0,
          categoryBreakdown: Object.entries(categories).map(([key, data]) => ({
            category: key,
            value: Math.round(data.value || 0),
            percentage: totalFootprint > 0 
              ? Math.round(((data.value || 0) / totalFootprint) * 100 * 10) / 10 
              : 0
          }))
        }
      }
    });
  } catch (error) {
    console.error('Error in extended calculation:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при расширенном расчете'
    });
  }
});

// Вспомогательные функции

async function getCategoryStats(userId) {
  try {
    const result = await db.query(
      `SELECT 
        c.code,
        c.name,
        c.icon,
        c.sort_order,
        AVG((cc.categories->c.code->>'value')::DECIMAL) as avg_value,
        COUNT(cc.id) as calculations_count
       FROM calculator_categories c
       LEFT JOIN carbon_calculations cc ON cc.user_id = $1 AND cc.categories ? c.code
       WHERE c.is_active = true
       GROUP BY c.code, c.name, c.icon, c.sort_order
       ORDER BY c.sort_order`,
      [userId]
    );
    
    return result.rows.map(row => ({
      code: row.code,
      name: row.name,
      icon: row.icon,
      avgValue: parseFloat(row.avg_value) || 0,
      calculationsCount: parseInt(row.calculations_count) || 0
    }));
  } catch (error) {
    console.error('Error getting category stats:', error);
    return [];
  }
}

function generateExtendedRecommendations(categories, totalFootprint) {
  const recommendations = [];
  
  // Анализируем категории
  const categoryAnalysis = [];
  
  for (const [code, data] of Object.entries(categories)) {
    const value = parseFloat(data.value) || 0;
    if (value > 0) {
      const percentage = totalFootprint > 0 ? (value / totalFootprint) * 100 : 0;
      categoryAnalysis.push({
        code,
        value,
        percentage: Math.round(percentage * 10) / 10
      });
    }
  }
  
  // Сортируем по убыванию
  categoryAnalysis.sort((a, b) => b.value - a.value);
  
  // Рекомендации для топ-3 категорий
  const topCategories = categoryAnalysis.slice(0, 3);
  
  topCategories.forEach((category, index) => {
    let suggestion = '';
    let impact = '';
    
    switch(category.code) {
      case 'transport':
        if (category.percentage > 30) {
          suggestion = 'Перейдите на общественный транспорт или велосипед для ежедневных поездок';
          impact = 'Снижение на 1500-2500 кг CO₂/год';
        }
        break;
      case 'housing':
        if (category.percentage > 25) {
          suggestion = 'Установите программируемый термостат и LED освещение';
          impact = 'Снижение на 800-1200 кг CO₂/год';
        }
        break;
      case 'food':
        if (category.percentage > 20) {
          suggestion = 'Уменьшите потребление мяса и выбирайте местные продукты';
          impact = 'Снижение на 500-800 кг CO₂/год';
        }
        break;
      case 'goods':
        if (category.percentage > 15) {
          suggestion = 'Покупайте меньше, но качественные и долговечные вещи';
          impact = 'Снижение на 300-500 кг CO₂/год';
        }
        break;
    }
    
    if (suggestion) {
      recommendations.push({
        category: getCategoryName(category.code),
        suggestion,
        impact,
        priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low'
      });
    }
  });
  
  // Общие рекомендации
  if (totalFootprint > 10000) {
    recommendations.push({
      category: 'Общее',
      suggestion: 'Рассмотрите план поэтапного снижения углеродного следа',
      impact: 'Потенциальное снижение на 2000-4000 кг CO₂/год',
      priority: 'high'
    });
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      category: 'Общее',
      suggestion: 'Продолжайте в том же духе! Ваш углеродный след уже достаточно низкий.',
      impact: 'Поддержание текущего уровня',
      priority: 'low'
    });
  }
  
  return recommendations;
}

function getCategoryName(code) {
  const names = {
    transport: 'Транспорт',
    housing: 'Жилье',
    food: 'Питание',
    goods: 'Товары',
    waste: 'Отходы',
    water: 'Вода',
    other: 'Прочее'
  };
  
  return names[code] || code;
}

module.exports = router;