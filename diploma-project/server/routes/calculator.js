const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Предполагаем, что у вас есть подключение к БД

console.log('Calculator router created');

// Получение категорий калькулятора
router.get('/categories', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM calculator_categories WHERE is_active = true ORDER BY sort_order'
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении категорий'
    });
  }
});

// Получение последнего расчета пользователя
router.get('/last-calculation', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Не указан ID пользователя'
      });
    }
    
    const result = await db.query(
      `SELECT * FROM carbon_calculations 
       WHERE user_id = $1 
       ORDER BY calculation_date DESC 
       LIMIT 1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'Расчеты не найдены'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching last calculation:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении последнего расчета'
    });
  }
});

// Получение истории расчетов
router.get('/history', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Не указан ID пользователя'
      });
    }
    
    const result = await db.query(
      `SELECT * FROM carbon_calculations 
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
        calculations: result.rows,
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

// Расчет углеродного следа
router.post('/calculate', async (req, res) => {
  try {
    console.log('=== НОВЫЕ РЕКОМЕНДАЦИИ! ===');
    
    const {
      userId,
      categories,
      isBaseline = false,
      calculationMethod = 'standard',
      notes = ''
    } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Не указан ID пользователя'
      });
    }
    
    if (!categories || Object.keys(categories).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Не указаны данные для расчета'
      });
    }
    
    // Рассчитываем общий углеродный след
    let totalFootprint = 0;
    const categoryDetails = {};
    
    for (const [categoryCode, categoryData] of Object.entries(categories)) {
      const value = parseFloat(categoryData.value) || 0;
      categoryDetails[categoryCode] = {
        value,
        details: categoryData.details || {}
      };
      totalFootprint += value;
    }
    
    // Получаем предыдущий расчет для сравнения
    const previousResult = await db.query(
      `SELECT total_footprint FROM carbon_calculations 
       WHERE user_id = $1 AND is_baseline = true 
       ORDER BY calculation_date DESC LIMIT 1`,
      [userId]
    );
    
    const previousFootprint = previousResult.rows[0]?.total_footprint || 0;
    const co2Saved = previousFootprint > 0 ? previousFootprint - totalFootprint : 0;
    
    // Генерируем рекомендации
    const recommendations = await generateRecommendations(categoryDetails, totalFootprint);
    
    // Сохраняем расчет в базе данных
    const result = await db.query(
      `INSERT INTO carbon_calculations 
       (user_id, calculation_date, total_footprint, co2_saved, is_baseline, 
        categories, calculation_method, notes) 
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [userId, totalFootprint, co2Saved, isBaseline, 
       JSON.stringify(categoryDetails), calculationMethod, notes]
    );
    
    // Обновляем общую экономию пользователя
    if (co2Saved > 0) {
      await db.query(
        'UPDATE users SET carbon_saved = carbon_saved + $1 WHERE id = $2',
        [Math.round(co2Saved), userId]
      );
    }
    
    // Обновляем аналитику
    try {
      await db.query('CALL update_user_analytics($1, $2)', [userId, 'month']);
    } catch (analyticsError) {
      console.warn('Analytics update failed:', analyticsError);
    }
    
    res.json({
      success: true,
      data: {
        calculation: result.rows[0],
        recommendations: [
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
        ],
        summary: {
          totalFootprint: Math.round(totalFootprint),
          co2Saved: Math.round(co2Saved),
          percentageChange: previousFootprint > 0 
            ? Math.round(((totalFootprint - previousFootprint) / previousFootprint) * 100 * 10) / 10
            : 0,
          categoryBreakdown: categoryDetails
        },
        message: 'Расчет успешно завершен'
      }
    });
  } catch (error) {
    console.error('Error in calculation:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при расчете углеродного следа'
    });
  }
});

// Функция генерации рекомендаций
async function generateRecommendations(categoryDetails, totalFootprint) {
  const recommendations = [];
  
  // Анализируем категории
  const categoryAnalysis = [];
  
  for (const [categoryCode, data] of Object.entries(categoryDetails)) {
    const categoryResult = await db.query(
      'SELECT name, baseline_value FROM calculator_categories WHERE code = $1',
      [categoryCode]
    );
    
    if (categoryResult.rows.length > 0) {
      const category = categoryResult.rows[0];
      const percentage = totalFootprint > 0 ? (data.value / totalFootprint) * 100 : 0;
      
      categoryAnalysis.push({
        code: categoryCode,
        name: category.name,
        value: data.value,
        baseline: category.baseline_value,
        percentage: Math.round(percentage * 10) / 10
      });
    }
  }
  
  // Сортируем по значению (наибольший след)
  categoryAnalysis.sort((a, b) => b.value - a.value);
  
  // Генерируем рекомендации для топ-3 категорий
  for (let i = 0; i < Math.min(3, categoryAnalysis.length); i++) {
    const category = categoryAnalysis[i];
    
    if (category.value > category.baseline) {
      let suggestion = '';
      let impact = '';
      
      switch(category.code) {
        case 'transport':
          suggestion = 'Рассмотрите переход на электромобиль или использование общественного транспорта';
          impact = `Снижение на ${Math.round((category.value - category.baseline) * 0.3)}-${Math.round((category.value - category.baseline) * 0.5)} кг CO₂/год`;
          break;
        case 'housing':
          suggestion = 'Установите солнечные панели и улучшите теплоизоляцию дома';
          impact = `Снижение на ${Math.round((category.value - category.baseline) * 0.2)}-${Math.round((category.value - category.baseline) * 0.4)} кг CO₂/год`;
          break;
        case 'food':
          suggestion = 'Перейдите на растительную диету 3-4 раза в неделю';
          impact = `Снижение на ${Math.round((category.value - category.baseline) * 0.25)}-${Math.round((category.value - category.baseline) * 0.4)} кг CO₂/год`;
          break;
        case 'goods':
          suggestion = 'Покупайте меньше, выбирайте качественные и долговечные вещи';
          impact = `Снижение на ${Math.round((category.value - category.baseline) * 0.15)}-${Math.round((category.value - category.baseline) * 0.3)} кг CO₂/год`;
          break;
        default:
          suggestion = 'Рассмотрите меры по снижению потребления в этой категории';
          impact = `Снижение на ${Math.round((category.value - category.baseline) * 0.2)}-${Math.round((category.value - category.baseline) * 0.35)} кг CO₂/год`;
      }
      
      recommendations.push({
        category: category.name,
        suggestion,
        impact,
        priority: i === 0 ? 'high' : i === 1 ? 'medium' : 'low',
        categoryCode: category.code,
        currentValue: Math.round(category.value),
        baselineValue: Math.round(category.baseline)
      });
    }
  }
  
  // Общие рекомендации
  if (totalFootprint > 10000) {
    recommendations.push({
      category: 'Общее',
      suggestion: 'Ваш углеродный след выше среднего. Рассмотрите комплексный план по его снижению.',
      impact: 'Потенциальное снижение на 2000-4000 кг CO₂/год',
      priority: 'high'
    });
  } else if (totalFootprint < 5000) {
    recommendations.push({
      category: 'Общее',
      suggestion: 'Отличные результаты! Продолжайте в том же духе и делитесь опытом с другими.',
      impact: 'Стабильное поддержание низкого уровня выбросов',
      priority: 'low'
    });
  }
  
  return recommendations;
}

// Получение целей пользователя
router.get('/goals', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const status = req.query.status || 'active';
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Не указан ID пользователя'
      });
    }
    
    const query = status === 'all' 
      ? 'SELECT * FROM user_carbon_goals WHERE user_id = $1 ORDER BY end_date DESC'
      : 'SELECT * FROM user_carbon_goals WHERE user_id = $1 AND status = $2 ORDER BY end_date DESC';
    
    const params = status === 'all' ? [userId] : [userId, status];
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении целей'
    });
  }
});

// Создание новой цели
router.post('/goals', async (req, res) => {
  try {
    const {
      userId,
      goalType,
      title,
      description,
      targetValue,
      unit,
      categoryCode,
      endDate,
      isRecurring = false,
      recurrencePattern
    } = req.body;
    
    if (!userId || !goalType || !title || !targetValue || !unit || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Не указаны обязательные поля'
      });
    }
    
    const result = await db.query(
      `INSERT INTO user_carbon_goals 
       (user_id, goal_type, title, description, target_value, unit, 
        category_code, start_date, end_date, is_recurring, recurrence_pattern) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8, $9, $10) 
       RETURNING *`,
      [userId, goalType, title, description, targetValue, unit, 
       categoryCode, endDate, isRecurring, recurrencePattern]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Цель успешно создана'
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при создании цели'
    });
  }
});

// Обновление прогресса цели
router.put('/goals/:id/progress', async (req, res) => {
  try {
    const goalId = req.params.id;
    const { currentValue } = req.body;
    
    if (currentValue === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Не указано текущее значение'
      });
    }
    
    // Получаем цель
    const goalResult = await db.query(
      'SELECT * FROM user_carbon_goals WHERE id = $1',
      [goalId]
    );
    
    if (goalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Цель не найдена'
      });
    }
    
    const goal = goalResult.rows[0];
    const progressPercent = Math.min(Math.round((currentValue / goal.target_value) * 100), 100);
    const status = progressPercent >= 100 ? 'completed' : goal.status;
    
    // Обновляем цель
    const updateResult = await db.query(
      `UPDATE user_carbon_goals 
       SET current_value = $1, progress_percent = $2, status = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [currentValue, progressPercent, status, goalId]
    );
    
    // Если цель выполнена, логируем активность
    if (status === 'completed' && goal.status !== 'completed') {
      await db.query(
        `INSERT INTO user_activities 
         (user_id, activity_type, description, related_id, carbon_saved) 
         VALUES ($1, 'goal_completed', 'Цель достигнута: ' || $2, $3, 0)`,
        [goal.user_id, goal.title, goalId]
      );
    }
    
    res.json({
      success: true,
      data: updateResult.rows[0],
      message: 'Прогресс цели обновлен'
    });
  } catch (error) {
    console.error('Error updating goal progress:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при обновлении прогресса цели'
    });
  }
});

// Получение аналитики
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const periodType = req.query.period || 'month';
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Не указан ID пользователя'
      });
    }
    
    const result = await db.query(
      `SELECT * FROM user_carbon_analytics 
       WHERE user_id = $1 AND period_type = $2 
       ORDER BY period_end DESC 
       LIMIT 1`,
      [userId, periodType]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'Аналитика не найдена'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении аналитики'
    });
  }
});

// Получение статистики по категориям
router.get('/category-stats', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Не указан ID пользователя'
      });
    }
    
    // Используем представление
    const result = await db.query(
      'SELECT * FROM user_category_stats WHERE user_id = $1 ORDER BY avg_footprint DESC',
      [userId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении статистики по категориям'
    });
  }
});

// Получение настроек калькулятора
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Не указан ID пользователя'
      });
    }
    
    const result = await db.query(
      'SELECT * FROM user_calculator_settings WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Создаем настройки по умолчанию
      const insertResult = await db.query(
        `INSERT INTO user_calculator_settings (user_id) 
         VALUES ($1) 
         RETURNING *`,
        [userId]
      );
      
      return res.json({
        success: true,
        data: insertResult.rows[0]
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching calculator settings:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении настроек калькулятора'
    });
  }
});

// Обновление настроек калькулятора
router.put('/settings', async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const {
      baselineFootprint,
      carbonGoalPercent,
      targetDeadline,
      notifyOnGoalProgress,
      notifyMonthlyReport,
      autoCalculate,
      preferredUnits,
      defaultPeriod
    } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Не указан ID пользователя'
      });
    }
    
    const result = await db.query(
      `INSERT INTO user_calculator_settings 
       (user_id, baseline_footprint, carbon_goal_percent, target_deadline, 
        notify_on_goal_progress, notify_monthly_report, auto_calculate, 
        preferred_units, default_period) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         baseline_footprint = EXCLUDED.baseline_footprint,
         carbon_goal_percent = EXCLUDED.carbon_goal_percent,
         target_deadline = EXCLUDED.target_deadline,
         notify_on_goal_progress = EXCLUDED.notify_on_goal_progress,
         notify_monthly_report = EXCLUDED.notify_monthly_report,
         auto_calculate = EXCLUDED.auto_calculate,
         preferred_units = EXCLUDED.preferred_units,
         default_period = EXCLUDED.default_period,
         updated_at = CURRENT_TIMESTAMP 
       RETURNING *`,
      [userId, baselineFootprint, carbonGoalPercent, targetDeadline,
       notifyOnGoalProgress, notifyMonthlyReport, autoCalculate,
       preferredUnits, defaultPeriod]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Настройки калькулятора обновлены'
    });
  } catch (error) {
    console.error('Error updating calculator settings:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при обновлении настроек калькулятора'
    });
  }
});

// Быстрый расчет на основе шаблона
router.post('/quick-calculate', async (req, res) => {
  try {
    const { userId, lifestyleType = 'average' } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Не указан ID пользователя'
      });
    }
    
    // Шаблоны для разных типов образа жизни
    const templates = {
      minimal: {
        transport: 1000,
        housing: 1500,
        food: 1200,
        goods: 800,
        waste: 400,
        water: 300,
        other: 200
      },
      average: {
        transport: 2500,
        housing: 2000,
        food: 1800,
        goods: 1500,
        waste: 800,
        water: 600,
        other: 500
      },
      active: {
        transport: 4000,
        housing: 2800,
        food: 2200,
        goods: 2000,
        waste: 1000,
        water: 800,
        other: 700
      }
    };
    
    const template = templates[lifestyleType] || templates.average;
    const categories = {};
    
    // Преобразуем в формат для расчета
    for (const [category, value] of Object.entries(template)) {
      categories[category] = { value };
    }
    
    // Вызываем основной метод расчета
    req.body = {
      userId,
      categories,
      isBaseline: true,
      calculationMethod: 'quick',
      notes: `Быстрый расчет на основе шаблона: ${lifestyleType}`
    };
    
    // Используем существующий метод расчета
    return router.handle(req, res, () => {});
  } catch (error) {
    console.error('Error in quick calculate:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при быстром расчете'
    });
  }
});

// Сравнение с другими пользователями
router.get('/comparison', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Не указан ID пользователя'
      });
    }
    
    // Получаем текущий след пользователя
    const userResult = await db.query(
      `SELECT total_footprint FROM carbon_calculations 
       WHERE user_id = $1 
       ORDER BY calculation_date DESC 
       LIMIT 1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'Нет данных для сравнения'
      });
    }
    
    const userFootprint = userResult.rows[0].total_footprint;
    
    // Получаем средние значения
    const avgResult = await db.query(`
      SELECT 
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_footprint) as median,
        AVG(total_footprint) as average,
        MIN(total_footprint) as min,
        MAX(total_footprint) as max
      FROM (
        SELECT DISTINCT ON (user_id) total_footprint 
        FROM carbon_calculations 
        WHERE user_id != $1 
        ORDER BY user_id, calculation_date DESC
      ) as latest_calculations
    `, [userId]);
    
    const stats = avgResult.rows[0];
    
    // Определяем квантиль пользователя
    const percentileResult = await db.query(`
      SELECT 
        COUNT(*) * 100.0 / (
          SELECT COUNT(DISTINCT user_id) 
          FROM carbon_calculations 
          WHERE user_id != $1
        ) as percentile
      FROM (
        SELECT DISTINCT ON (user_id) total_footprint 
        FROM carbon_calculations 
        WHERE user_id != $1 
        ORDER BY user_id, calculation_date DESC
      ) as other_users
      WHERE total_footprint <= $2
    `, [userId, userFootprint]);
    
    const percentile = Math.round(percentileResult.rows[0]?.percentile || 50);
    
    res.json({
      success: true,
      data: {
        userFootprint: Math.round(userFootprint),
        comparison: {
          median: Math.round(stats.median || 0),
          average: Math.round(stats.average || 0),
          min: Math.round(stats.min || 0),
          max: Math.round(stats.max || 0)
        },
        percentile,
        rating: percentile >= 80 ? 'Отлично' : 
                percentile >= 60 ? 'Хорошо' : 
                percentile >= 40 ? 'Средне' : 
                percentile >= 20 ? 'Ниже среднего' : 'Низкий',
        message: percentile >= 50 
          ? `Вы в топ-${100 - percentile}% пользователей!` 
          : `Ваш след выше, чем у ${percentile}% пользователей`
      }
    });
  } catch (error) {
    console.error('Error in comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при сравнении с другими пользователями'
    });
  }
});

// Экспорт данных
router.get('/export', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const format = req.query.format || 'json';
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Не указан ID пользователя'
      });
    }
    
    // Получаем все данные пользователя
    const calculationsResult = await db.query(
      'SELECT * FROM carbon_calculations WHERE user_id = $1 ORDER BY calculation_date',
      [userId]
    );
    
    const goalsResult = await db.query(
      'SELECT * FROM user_carbon_goals WHERE user_id = $1',
      [userId]
    );
    
    const analyticsResult = await db.query(
      'SELECT * FROM user_carbon_analytics WHERE user_id = $1',
      [userId]
    );
    
    const data = {
      user: { id: userId },
      calculations: calculationsResult.rows,
      goals: goalsResult.rows,
      analytics: analyticsResult.rows,
      exportedAt: new Date().toISOString()
    };
    
    if (format === 'csv') {
      // Простая CSV конвертация
      let csv = 'Тип,Дата,Значение,Единица измерения\n';
      
      calculationsResult.rows.forEach(calc => {
        csv += `Расчет,${calc.calculation_date},${calc.total_footprint},кг CO₂\n`;
      });
      
      res.header('Content-Type', 'text/csv');
      res.attachment('carbon-footprint-export.csv');
      return res.send(csv);
    }
    
    res.json({
      success: true,
      data,
      message: 'Данные успешно экспортированы'
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при экспорте данных'
    });
  }
});

console.log('Calculator router configured with all endpoints');
module.exports = router;