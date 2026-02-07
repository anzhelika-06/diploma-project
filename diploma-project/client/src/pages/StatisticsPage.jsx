// StatisticsPage.jsx
import { useState, useEffect } from 'react';
import '../styles/pages/StatisticsPage.css';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentUser } from '../utils/authUtils';

const StatisticsPage = () => {
  const { currentLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculations, setCalculations] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('month');
  const [showResults, setShowResults] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  const [calculatorData, setCalculatorData] = useState({
    transport: {
      carKm: 0,
      busKm: 0,
      planeKm: 0,
      trainKm: 0
    },
    housing: {
      electricity: 0,
      heating: 0,
      water: 0
    },
    food: {
      meatKg: 0,
      vegetablesKg: 0,
      processedFood: 0,
      localFood: 50
    },
    goods: {
      clothing: 0,
      electronics: 0,
      furniture: 0
    },
    waste: {
      wasteAmount: 0,
      recycling: 30,
      composting: 20
    }
  });

  const [calculationResult, setCalculationResult] = useState(null);

  useEffect(() => {
    loadUserData();
    loadCalculations();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      
      if (!currentUser?.id) {
        console.error(t('error.userIdNotFound', 'ID пользователя не найден'));
        return;
      }
      
      const response = await fetch(`/api/calculations/${currentUser.id}/stats`);
      if (response.ok) {
        const data = await response.json();
        setUser(prev => ({ ...prev, ...data }));
      } else {
        console.error(t('error.loadStats', 'Ошибка загрузки статистики:'), response.status);
      }
    } catch (error) {
      console.error(t('error.loadData', 'Ошибка загрузки данных:'), error);
    } finally {
      setLoading(false);
    }
  };

  const loadCalculations = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.id) {
        console.error(t('error.userIdNotFound', 'ID пользователя не найден'));
        setCalculations([]);
        return;
      }
      
      const response = await fetch(`/api/calculations/history?userId=${currentUser.id}&limit=12`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setCalculations(data);
      } else if (data && typeof data === 'object') {
        if (data.calculations && Array.isArray(data.calculations)) {
          setCalculations(data.calculations);
        } else if (data.data && Array.isArray(data.data)) {
          setCalculations(data.data);
        } else if (data.history && Array.isArray(data.history)) {
          setCalculations(data.history);
        } else {
          console.warn(t('warning.invalidDataFormat', 'Неверный формат данных:'), data);
          setCalculations([]);
        }
      } else {
        console.warn(t('warning.expectedArray', 'Ожидался массив, получено:'), typeof data);
        setCalculations([]);
      }
    } catch (error) {
      console.error(t('error.loadCalculations', 'Ошибка загрузки расчетов:'), error);
      setCalculations([]);
    }
  };

  const chartData = Array.isArray(calculations) ? calculations.map(calc => ({
    date: calc.calculation_date ? new Date(calc.calculation_date).toLocaleDateString('ru-RU') : t('common.noDate', 'Нет даты'),
    footprint: calc.total_footprint || 0,
    saved: calc.co2_saved || 0,
    transport: calc.categories?.transport?.total || calc.categories?.transport?.value || 0,
    housing: calc.categories?.housing?.total || calc.categories?.housing?.value || 0,
    food: calc.categories?.food?.total || calc.categories?.food?.value || 0
  })) : [];

  const categoryData = [
    { name: t('categories.transport', 'Транспорт'), value: 2500, color: '#4caf50' },
    { name: t('categories.housing', 'Жилье'), value: 1800, color: '#2196f3' },
    { name: t('categories.food', 'Питание'), value: 1200, color: '#ff9800' },
    { name: t('categories.goods', 'Товары'), value: 800, color: '#9c27b0' },
    { name: t('categories.waste', 'Отходы'), value: 500, color: '#795548' }
  ];

  const calculateFootprint = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser?.id) {
      alert(t('error.notAuthorized', 'Пользователь не авторизован'));
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        userId: currentUser.id,
        ...calculatorData
      };

      const response = await fetch('/api/calculations/calculate-extended', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success === false) {
          throw new Error(result.error || t('error.calculationFailed', 'Ошибка расчета'));
        }
        setCalculationResult(result);
        setShowResults(true);
        await Promise.all([loadUserData(), loadCalculations()]);
      } else {
        const errorData = await response.json().catch(() => ({ error: t('error.unknown', 'Неизвестная ошибка') }));
        throw new Error(errorData.error || `${t('error.calculationFailed', 'Ошибка расчета:')} ${response.status}`);
      }
    } catch (error) {
      console.error(t('error.calculation', 'Ошибка расчета:'), error);
      alert(`${t('error.calculation', 'Ошибка расчета:')} ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateCalculatorData = (category, field, value) => {
    setCalculatorData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const resetCalculator = () => {
    setCalculatorData({
      transport: { carKm: 0, busKm: 0, planeKm: 0, trainKm: 0 },
      housing: { electricity: 0, heating: 0, water: 0 },
      food: { meatKg: 0, vegetablesKg: 0, processedFood: 0, localFood: 50 },
      goods: { clothing: 0, electronics: 0, furniture: 0 },
      waste: { wasteAmount: 0, recycling: 30, composting: 20 }
    });
    setCalculationResult(null);
    setShowResults(false);
  };

  const autoFillCalculator = () => {
    setCalculatorData({
      transport: { carKm: 12000, busKm: 3000, planeKm: 1500, trainKm: 1000 },
      housing: { electricity: 2000, heating: 15, water: 50 },
      food: { meatKg: 2, vegetablesKg: 4, processedFood: 1, localFood: 60 },
      goods: { clothing: 2000, electronics: 10000, furniture: 5000 },
      waste: { wasteAmount: 8, recycling: 50, composting: 30 }
    });
  };

  if (loading && !user) {
    return (
      <div className="statistics-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">{t('statistics.loading', 'Загрузка статистики...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <div className="page-header">
        <h1>
          <span className="material-icons">📊</span>
          {t('statistics.title', 'Статистика')}
        </h1>
        <p>{t('statistics.subtitle', 'Ваша эко-статистика и достижения')}</p>
      </div>

      <div className="stats-tabs">
        <button 
          className={`stats-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="material-icons tab-icon">dashboard</span>
          <span className="tab-label">{t('common.overview', 'Обзор')}</span>
        </button>
        <button 
          className={`stats-tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          <span className="material-icons tab-icon">trending_up</span>
          <span className="tab-label">{t('common.charts', 'Графики')}</span>
        </button>
        <button 
          className={`stats-tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          <span className="material-icons tab-icon">calculate</span>
          <span className="tab-label">{t('calculator.title', 'Калькулятор')}</span>
        </button>
        <button 
          className={`stats-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <span className="material-icons tab-icon">history</span>
          <span className="tab-label">{t('common.history', 'История')}</span>
        </button>
      </div>

      <div className="stats-container">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="stats-summary">
              <div className="stat-card">
                <div className="stat-card-header">
                  <div className="stat-icon">
                    <span className="material-icons">🌍</span>
                  </div>
                  <span className="stat-title">{t('statistics.co2Saved', 'Сэкономлено CO₂')}</span>
                </div>
                <div className="stat-value">
                  {user?.carbon_saved ? (user.carbon_saved / 1000).toFixed(1) : '0'} {t('common.tons', 'т')}
                </div>
                <p className="stat-subtitle">{t('statistics.totalTime', 'За все время')}</p>
                <div className="stat-change positive">
                  <span className="material-icons">↗️</span>
                  <span>+12% {t('common.perMonth', 'за месяц')}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <div className="stat-icon">
                    <span className="material-icons">🏆</span>
                  </div>
                  <span className="stat-title">{t('statistics.ecoLevel', 'Уровень экологичности')}</span>
                </div>
                <div className="stat-value">{user?.eco_level || t('levels.beginner', 'Эко-новичок')}</div>
                <p className="stat-subtitle">{t('common.currentStatus', 'Текущий статус')}</p>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <div className="stat-icon">
                    <span className="material-icons">📈</span>
                  </div>
                  <span className="stat-title">{t('calculator.carbonFootprint', 'Углеродный след')}</span>
                </div>
                <div className="stat-value">
                  {user?.current_carbon_footprint 
                    ? (user.current_carbon_footprint / 1000).toFixed(1) 
                    : '12.0'} {t('calculator.tonsPerYear', 'т/год')}
                </div>
                <p className="stat-subtitle">{t('common.currentYear', 'Текущий год')}</p>
                <div className="stat-change negative">
                  <span className="material-icons">↘️</span>
                  <span>-8% {t('statistics.fromAverage', 'от среднего')}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <div className="stat-icon">
                    <span className="material-icons">📅</span>
                  </div>
                  <span className="stat-title">{t('statistics.ecoDays', 'Дней экологии')}</span>
                </div>
                <div className="stat-value">
                  {calculations?.length || 0}
                </div>
                <p className="stat-subtitle">{t('statistics.calculationsDone', 'Рассчетов выполнено')}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="charts-content">
            <div className="chart-header">
              <h3 className="chart-title">{t('charts.carbonTrend', 'Динамика углеродного следа')}</h3>
              <div className="chart-period-selector">
                <button 
                  className={`period-btn ${chartPeriod === 'week' ? 'active' : ''}`}
                  onClick={() => setChartPeriod('week')}
                >
                  {t('common.week', 'Неделя')}
                </button>
                <button 
                  className={`period-btn ${chartPeriod === 'month' ? 'active' : ''}`}
                  onClick={() => setChartPeriod('month')}
                >
                  {t('common.month', 'Месяц')}
                </button>
                <button 
                  className={`period-btn ${chartPeriod === 'year' ? 'active' : ''}`}
                  onClick={() => setChartPeriod('year')}
                >
                  {t('common.year', 'Год')}
                </button>
              </div>
            </div>

            <div className="chart-wrapper">
              {chartData.length > 0 ? (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  {t('charts.displaying', 'График будет отображаться с использованием библиотеки recharts')}
                </div>
              ) : (
                <div className="empty-chart">
                  <span className="material-icons">insights</span>
                  <p>{t('charts.noData', 'Нет данных для отображения графика')}</p>
                </div>
              )}
            </div>

            <div className="chart-header" style={{ marginTop: '30px' }}>
              <h3 className="chart-title">{t('charts.categoryDistribution', 'Распределение по категориям')}</h3>
            </div>

            <div className="chart-wrapper">
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}>
                {t('charts.pieChart', 'Круговая диаграмма с распределением CO₂ по категориям')}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="calculator-content">
            <div className="calculator-header">
              <h2>
                <span className="material-icons">🌿</span>
                {t('calculator.extendedTitle', 'Расширенный калькулятор углеродного следа')}
              </h2>
              <div className="calculator-actions">
                <button 
                  className="calc-btn secondary"
                  onClick={resetCalculator}
                >
                  <span className="material-icons">refresh</span>
                  {t('common.reset', 'Сбросить')}
                </button>
                <button 
                  className="calc-btn secondary"
                  onClick={autoFillCalculator}
                >
                  <span className="material-icons">auto_fix_high</span>
                  {t('calculator.autoFill', 'Автозаполнение')}
                </button>
              </div>
            </div>

            <div className="calculator-form">
              <div className="form-section">
                <h3 className="section-title">
                  <span className="material-icons">🚗</span>
                  {t('categories.transport', 'Транспорт')}
                </h3>
                <div className="category-grid">
                  <div className="category-item">
                    <div className="category-header">
                      <span className="material-icons category-icon">directions_car</span>
                      <h4 className="category-name">{t('calculator.carKm', 'Автомобиль (км/год)')}</h4>
                    </div>
                    <input
                      type="number"
                      className="category-input"
                      value={calculatorData.transport.carKm}
                      onChange={(e) => updateCalculatorData('transport', 'carKm', e.target.value)}
                      placeholder="0"
                    />
                    <div className="category-unit">{t('calculator.example', 'Пример')}: 15000 {t('calculator.kmPerYear', 'км/год')}</div>
                  </div>

                  <div className="category-item">
                    <div className="category-header">
                      <span className="material-icons category-icon">directions_bus</span>
                      <h4 className="category-name">{t('calculator.publicTransport', 'Общественный транспорт (км/год)')}</h4>
                    </div>
                    <input
                      type="number"
                      className="category-input"
                      value={calculatorData.transport.busKm}
                      onChange={(e) => updateCalculatorData('transport', 'busKm', e.target.value)}
                      placeholder="0"
                    />
                    <div className="category-unit">{t('calculator.example', 'Пример')}: 5000 {t('calculator.kmPerYear', 'км/год')}</div>
                  </div>

                  <div className="category-item">
                    <div className="category-header">
                      <span className="material-icons category-icon">flight</span>
                      <h4 className="category-name">{t('calculator.flights', 'Авиаперелеты (км/год)')}</h4>
                    </div>
                    <input
                      type="number"
                      className="category-input"
                      value={calculatorData.transport.planeKm}
                      onChange={(e) => updateCalculatorData('transport', 'planeKm', e.target.value)}
                      placeholder="0"
                    />
                    <div className="category-unit">{t('calculator.example', 'Пример')}: 2000 {t('calculator.kmPerYear', 'км/год')}</div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">
                  <span className="material-icons">🏠</span>
                  {t('categories.housing', 'Жилье')}
                </h3>
                <div className="category-grid">
                  <div className="category-item">
                    <div className="category-header">
                      <span className="material-icons category-icon">bolt</span>
                      <h4 className="category-name">{t('calculator.electricity', 'Электричество (кВтч/год)')}</h4>
                    </div>
                    <input
                      type="number"
                      className="category-input"
                      value={calculatorData.housing.electricity}
                      onChange={(e) => updateCalculatorData('housing', 'electricity', e.target.value)}
                      placeholder="0"
                    />
                    <div className="category-unit">{t('calculator.example', 'Пример')}: 2500 {t('calculator.kwhPerYear', 'кВтч/год')}</div>
                  </div>

                  <div className="category-item">
                    <div className="category-header">
                      <span className="material-icons category-icon">whatshot</span>
                      <h4 className="category-name">{t('calculator.heating', 'Отопление (ГДж/год)')}</h4>
                    </div>
                    <input
                      type="number"
                      className="category-input"
                      value={calculatorData.housing.heating}
                      onChange={(e) => updateCalculatorData('housing', 'heating', e.target.value)}
                      placeholder="0"
                    />
                    <div className="category-unit">{t('calculator.example', 'Пример')}: 20 {t('calculator.gjPerYear', 'ГДж/год')}</div>
                  </div>

                  <div className="category-item">
                    <div className="category-header">
                      <span className="material-icons category-icon">water_drop</span>
                      <h4 className="category-name">{t('calculator.water', 'Вода (м³/год)')}</h4>
                    </div>
                    <input
                      type="number"
                      className="category-input"
                      value={calculatorData.housing.water}
                      onChange={(e) => updateCalculatorData('housing', 'water', e.target.value)}
                      placeholder="0"
                    />
                    <div className="category-unit">{t('calculator.example', 'Пример')}: 60 {t('calculator.m3PerYear', 'м³/год')}</div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">
                  <span className="material-icons">🍎</span>
                  {t('categories.food', 'Питание')}
                </h3>
                <div className="category-grid">
                  <div className="category-item">
                    <div className="category-header">
                      <span className="material-icons category-icon">restaurant</span>
                      <h4 className="category-name">{t('calculator.meatFish', 'Мясо и рыба (кг/неделя)')}</h4>
                    </div>
                    <input
                      type="number"
                      className="category-input"
                      value={calculatorData.food.meatKg}
                      onChange={(e) => updateCalculatorData('food', 'meatKg', e.target.value)}
                      placeholder="0"
                      step="0.1"
                    />
                    <div className="category-unit">{t('calculator.example', 'Пример')}: 3 {t('calculator.kgPerWeek', 'кг/неделя')}</div>
                  </div>

                  <div className="category-item">
                    <div className="category-header">
                      <span className="material-icons category-icon">spa</span>
                      <h4 className="category-name">{t('calculator.vegetablesFruits', 'Овощи и фрукты (кг/неделя)')}</h4>
                    </div>
                    <input
                      type="number"
                      className="category-input"
                      value={calculatorData.food.vegetablesKg}
                      onChange={(e) => updateCalculatorData('food', 'vegetablesKg', e.target.value)}
                      placeholder="0"
                      step="0.1"
                    />
                    <div className="category-unit">{t('calculator.example', 'Пример')}: 5 {t('calculator.kgPerWeek', 'кг/неделя')}</div>
                  </div>

                  <div className="category-item">
                    <div className="category-header">
                      <span className="material-icons category-icon">local_grocery_store</span>
                      <h4 className="category-name">{t('calculator.localProducts', 'Местные продукты (%)')}</h4>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="category-input"
                      value={calculatorData.food.localFood}
                      onChange={(e) => updateCalculatorData('food', 'localFood', e.target.value)}
                    />
                    <div className="category-unit">
                      {calculatorData.food.localFood}% {t('calculator.localProducts', 'местных продуктов')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="calculator-buttons">
                <button 
                  className="calc-btn primary"
                  onClick={calculateFootprint}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="material-icons loading-icon">refresh</span>
                      {t('calculator.calculating', 'Расчет...')}
                    </>
                  ) : (
                    <>
                      <span className="material-icons">calculate</span>
                      {t('calculator.calculate', 'Рассчитать след')}
                    </>
                  )}
                </button>
              </div>
            </div>

            {showResults && calculationResult && (
              <div className="results-container">
                <div className="results-header">
                  <h3 className="results-title">{t('calculator.results', 'Результаты расчета')}</h3>
                  <p className="results-subtitle">
                    {t('calculator.resultsSubtitle', 'Ваш углеродный след и рекомендации по улучшению')}
                  </p>
                </div>

                <div className="results-grid">
                  <div className="result-item">
                    <div className="result-label">{t('calculator.totalFootprint', 'Общий след')}</div>
                    <div className="result-value">
                      {(calculationResult.total_footprint / 1000).toFixed(1)} {t('common.tons', 'т')}
                    </div>
                    <div className="stat-subtitle">{t('calculator.co2PerYear', 'CO₂ в год')}</div>
                  </div>

                  <div className="result-item">
                    <div className="result-label">{t('statistics.saved', 'Сэкономлено')}</div>
                    <div className="result-value">
                      {(calculationResult.co2_saved / 1000).toFixed(1)} {t('common.tons', 'т')}
                    </div>
                    <div className="stat-subtitle">{t('statistics.fromAverage', 'от среднего')}</div>
                  </div>

                  <div className="result-item">
                    <div className="result-label">{t('common.level', 'Уровень')}</div>
                    <div className="result-value">
                      {calculationResult.level || t('levels.average', 'Средний')}
                    </div>
                    <div className="stat-subtitle">{t('statistics.ecoLevel', 'Экологичности')}</div>
                  </div>
                </div>

                <div className="result-comparison">
                  <h4 className="comparison-title">{t('calculator.comparison', 'Сравнение с другими')}</h4>
                  {calculationResult.comparison && Object.entries(calculationResult.comparison).map(([key, value]) => (
                    <div key={key} className="comparison-item">
                      <span className="comparison-label">
                        {key === 'world_average' && t('comparison.worldAverage', 'Средний по миру')}
                        {key === 'eu_average' && t('comparison.euAverage', 'Средний в ЕС')}
                        {key === 'eco_target' && t('comparison.ecoTarget', 'Эко-цель')}
                      </span>
                      <span className="comparison-value">
                        {(value.value / 1000).toFixed(1)} {t('calculator.tonsCo2PerYear', 'т CO₂/год')}
                      </span>
                      <span className={`comparison-badge ${
                        calculationResult.total_footprint < value.value ? 'badge-better' : 'badge-worse'
                      }`}>
                        {calculationResult.total_footprint < value.value ? t('comparison.better', 'Лучше') : t('comparison.worse', 'Хуже')}
                      </span>
                    </div>
                  ))}
                </div>

                {calculationResult.recommendations && calculationResult.recommendations.length > 0 && (
                  <div className="recommendations-section">
                    <h4 className="recommendations-title">
                      <span className="material-icons">lightbulb</span>
                      {t('calculator.recommendations', 'Рекомендации для вас')}
                    </h4>
                    <div className="recommendations-list">
                      {calculationResult.recommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} className="recommendation-card">
                          <div className="recommendation-header">
                            <span className="recommendation-category">{rec.category}</span>
                            <span className="recommendation-impact">
                              {t('calculator.willSave', 'Сэкономит')} {rec.savings} {t('calculator.kgCo2', 'кг CO₂')}
                            </span>
                          </div>
                          <p className="recommendation-text">{rec.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-content">
            <div className="chart-header">
              <h3 className="chart-title">{t('history.title', 'История расчетов')}</h3>
            </div>

            {calculations.length === 0 ? (
              <div className="empty-state">
                <span className="material-icons empty-icon">assessment</span>
                <h3>{t('common.noData', 'Нет данных')}</h3>
                <p>{t('history.noCalculations', 'Выполните первый расчет углеродного следа, чтобы увидеть историю')}</p>
                <button 
                  className="action-btn"
                  onClick={() => setActiveTab('calculator')}
                >
                  <span className="material-icons">calculate</span>
                  {t('history.goToCalculator', 'Перейти к калькулятору')}
                </button>
              </div>
            ) : (
              <div className="history-list">
                {calculations.map((calc, index) => (
                  <div key={index} className="stat-card">
                    <div className="stat-card-header">
                      <div className="stat-icon">
                        <span className="material-icons">date_range</span>
                      </div>
                      <span className="stat-title">
                        {calc.calculation_date ? new Date(calc.calculation_date).toLocaleDateString('ru-RU') : t('common.noDate', 'Нет даты')}
                      </span>
                    </div>
                    <div className="stat-value">
                      {calc.total_footprint ? (calc.total_footprint / 1000).toFixed(1) : '0'} {t('calculator.tonsCo2', 'т CO₂')}
                    </div>
                    <p className="stat-subtitle">{t('calculator.carbonFootprint', 'Углеродный след')}</p>
                    <div className="stat-change">
                      <span className="material-icons">
                        {calc.co2_saved > 0 ? '↗️' : '↘️'}
                      </span>
                      <span>{t('statistics.saved', 'Сэкономлено')}: {calc.co2_saved ? (calc.co2_saved / 1000).toFixed(1) : '0'} {t('common.tons', 'т')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="export-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="material-icons">download</span>
                {t('export.title', 'Экспорт результатов')}
              </h3>
              <button className="modal-close" onClick={() => setShowExportModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p>{t('export.selectFormat', 'Выберите формат экспорта и период данных:')}</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn secondary" onClick={() => setShowExportModal(false)}>
                {t('common.cancel', 'Отмена')}
              </button>
              <button className="modal-btn primary" onClick={() => setShowExportModal(false)}>
                {t('export.export', 'Экспортировать')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;