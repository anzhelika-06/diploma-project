// StatisticsPage.jsx
import { useState, useEffect, useRef } from 'react';
import '../styles/pages/StatisticsPage.css';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentUser } from '../utils/authUtils';
import { useEventTracker } from '../hooks/useEventTracker';

const StatisticsPage = () => {
  const { t } = useLanguage();
  const { trackEvent } = useEventTracker();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculations, setCalculations] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('month');
  const [calculationResult, setCalculationResult] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [calculatorData, setCalculatorData] = useState({
    transport: { carKm: 0, busKm: 0, planeKm: 0, trainKm: 0 },
    housing: { electricity: 0, heating: 0, water: 0, gas: 0 },
    food: { meatKg: 0, vegetablesKg: 0, processedFood: 0, localFood: 50, dairy: 0 },
    waste: { recycling: 0, compost: 0, plastic: 0 }
  });

  const calculatorRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    loadUserData();
    loadCalculations();
    
    // Отслеживаем просмотр страницы статистики
    const currentUser = getCurrentUser();
    if (currentUser?.id) {
      trackEvent('statistics_page_viewed', {
        userId: currentUser.id,
        timestamp: new Date().toISOString()
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Загружаем только при монтировании

  const loadUserData = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }
      
      // Загружаем статистику пользователя из БД
      const statsResponse = await fetch(`/api/calculations/${currentUser.id}/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.data) {
          setUser({ 
            ...currentUser,
            carbon_saved: statsData.data.user.carbonSaved || 0,
            eco_level: statsData.data.user.ecoLevel || 'Эко-новичок'
          });
        } else {
          setUser(currentUser);
        }
      } else {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setUser(getCurrentUser());
    } finally {
      setLoading(false);
    }
  };

  const loadCalculations = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.id) return;
      
      const response = await fetch(`/api/calculations/history?userId=${currentUser.id}&limit=365`);
      if (response.ok) {
        const data = await response.json();
        const calcs = data.data?.calculations || data.calculations || [];
        setCalculations(calcs);
      }
    } catch (error) {
      console.error('Ошибка загрузки расчетов:', error);
    }
  };

  const calculateFootprint = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser?.id) {
      setErrorMessage(t('error') || 'Пользователь не авторизован');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/calculations/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          ...calculatorData,
          calculationDate: new Date().toISOString().split('T')[0]
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setCalculationResult(result);
        
        // Отслеживаем выполнение расчета
        trackEvent('calculation_completed', {
          userId: currentUser.id,
          totalFootprint: result.totalFootprint,
          carbonSaved: result.carbonSaved,
          categories: {
            transport: result.breakdown?.transport || 0,
            housing: result.breakdown?.housing || 0,
            food: result.breakdown?.food || 0,
            waste: result.breakdown?.waste || 0
          },
          timestamp: new Date().toISOString()
        });
        
        // Отслеживаем первый расчет
        if (calculations.length === 0) {
          trackEvent('first_calculation', {
            userId: currentUser.id,
            timestamp: new Date().toISOString()
          });
        }
        
        await Promise.all([loadUserData(), loadCalculations()]);
      } else {
        // Показываем ошибку в модальном окне
        if (result.errorCode === 'CALCULATION_ALREADY_EXISTS_TODAY') {
          setErrorMessage(t('statsCalculationAlreadyToday') || result.error || 'Вы уже сделали расчет сегодня. Попробуйте завтра!');
        } else {
          setErrorMessage(result.error || t('error') || 'Ошибка при выполнении расчета');
        }
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Ошибка расчета:', error);
      setErrorMessage(t('error') || 'Произошла ошибка при выполнении расчета');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const updateCalculatorData = (category, field, value) => {
    setCalculatorData(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: parseFloat(value) || 0 }
    }));
  };

  const resetCalculator = () => {
    setCalculatorData({
      transport: { carKm: 0, busKm: 0, planeKm: 0, trainKm: 0 },
      housing: { electricity: 0, heating: 0, water: 0, gas: 0 },
      food: { meatKg: 0, vegetablesKg: 0, processedFood: 0, localFood: 50, dairy: 0 },
      waste: { recycling: 0, compost: 0, plastic: 0 }
    });
    setCalculationResult(null);
  };

  const scrollToCalculator = () => {
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const currentLang = t('statsKg') === 'kg' ? 'EN' : (t('statsKg') === 'кг' ? 'RU' : 'BY');
    
    const months = {
      RU: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
      EN: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      BY: ['студзеня', 'лютага', 'сакавіка', 'красавіка', 'мая', 'чэрвеня', 'ліпеня', 'жніўня', 'верасня', 'кастрычніка', 'лістапада', 'снежня']
    };
    
    const day = date.getDate();
    const month = months[currentLang][date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };

  if (loading && !user) {
    return (
      <div className="stats-page">
        <div className="stats-loading">
          <div className="stats-spinner"></div>
          <p>Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  const carbonSavedKg = user?.carbon_saved || 0;
  
  // Считаем сэкономлено за месяц из истории
  const getMonthSaved = () => {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthCalcs = calculations.filter(calc => new Date(calc.date || calc.calculation_date) >= monthAgo);
    return monthCalcs.reduce((sum, calc) => sum + (calc.saved || calc.co2_saved || 0), 0);
  };
  
  const monthSavedKg = getMonthSaved();
  
  // Фильтруем данные по выбранному периоду
  const getFilteredData = () => {
    const now = new Date();
    let filteredCalcs = [...calculations];
    
    if (chartPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredCalcs = calculations.filter(calc => new Date(calc.date || calc.calculation_date) >= weekAgo);
    } else if (chartPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredCalcs = calculations.filter(calc => new Date(calc.date || calc.calculation_date) >= monthAgo);
    } else if (chartPeriod === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filteredCalcs = calculations.filter(calc => new Date(calc.date || calc.calculation_date) >= yearAgo);
    }
    
    return filteredCalcs;
  };
  
  const chartData = getFilteredData().map(calc => ({
    date: calc.date || calc.calculation_date,
    footprint: calc.total || calc.total_footprint || 0,
    saved: calc.saved || calc.co2_saved || 0,
    categories: calc.categories || {}
  }));
  
  // Для круговой диаграммы агрегируем данные за выбранный период
  const getPieData = () => {
    const filtered = getFilteredData();
    if (filtered.length === 0) return {};
    
    const aggregated = {};
    filtered.forEach(calc => {
      const cats = calc.categories || {};
      Object.entries(cats).forEach(([key, value]) => {
        aggregated[key] = (aggregated[key] || 0) + (parseFloat(value) || 0);
      });
    });
    
    return aggregated;
  };
  
  const pieData = getPieData();

  const getEcoLevel = (saved) => {
    let progress = 0;
    let nextKey = null;
    let levelKey = 'ecoLevelNovice';
    
    if (saved >= 5000) {
      levelKey = 'ecoLevelHero';
      progress = 100;
      nextKey = null;
    } else if (saved >= 4000) {
      levelKey = 'ecoLevelMaster';
      progress = ((saved - 4000) / 1000) * 100;
      nextKey = 'ecoLevelHero';
    } else if (saved >= 3000) {
      levelKey = 'ecoLevelActivist';
      progress = ((saved - 3000) / 1000) * 100;
      nextKey = 'ecoLevelMaster';
    } else if (saved >= 2000) {
      levelKey = 'ecoLevelEnthusiast';
      progress = ((saved - 2000) / 1000) * 100;
      nextKey = 'ecoLevelActivist';
    } else if (saved >= 1000) {
      levelKey = 'ecoLevelStarter';
      progress = ((saved - 1000) / 1000) * 100;
      nextKey = 'ecoLevelEnthusiast';
    } else {
      levelKey = 'ecoLevelNovice';
      progress = (saved / 1000) * 100;
      nextKey = 'ecoLevelStarter';
    }
    
    return { 
      text: t(levelKey),
      progress: Math.min(progress, 100),
      next: nextKey ? t(nextKey) : null
    };
  };

  const level = getEcoLevel(carbonSavedKg);

  return (
    <div className="stats-page">
      <div className="stats-container">
        {/* Заголовок */}
        <div className="stats-header">
          <h1 className="stats-title">{t('menuStatistics')}</h1>
          <p className="stats-subtitle">{t('statsSubtitle')}</p>
        </div>

        {/* 3 блока статистики */}
        <div ref={statsRef} className="stats-cards-grid">
          <div className="stats-card">
            <div className="stats-card-icon">
              <span className="material-icons">public</span>
            </div>
            <div className="stats-card-label">{t('statsTotalSaved')}</div>
            <div className="stats-card-value">
              {carbonSavedKg.toLocaleString()} <span className="stats-card-unit">{t('statsKg')}</span>
            </div>
            <p className="stats-card-description">{t('statsAllTime')}</p>
          </div>

          <div className="stats-card">
            <div className="stats-card-icon">
              <span className="material-icons">assessment</span>
            </div>
            <div className="stats-card-label">{t('statsMonthSaved')}</div>
            <div className="stats-card-value">
              {monthSavedKg.toLocaleString()} <span className="stats-card-unit">{t('statsKg')}</span>
            </div>
            <p className="stats-card-description">{t('statsLast30Days')}</p>
          </div>

          <div className="stats-card">
            <div className="stats-card-icon">
              <span className="material-icons">emoji_events</span>
            </div>
            <div className="stats-card-label">{t('statsLevel')}</div>
            <div className="stats-card-value">{level.text}</div>
            <p className="stats-card-description">
              {level.next ? `${t('statsToNext')} ${level.next}` : t('statsMaxLevel')}
            </p>
            <div className="stats-progress">
              <div className="stats-progress-fill" style={{ width: `${level.progress}%` }}></div>
            </div>
          </div>
        </div>

        {/* Две диаграммы */}
        <div className="stats-charts">
          <div className="stats-charts-header">
            <h2 className="stats-section-title">{t('statsChartTitle')}</h2>
            <div className="stats-period-buttons">
              {['week', 'month', 'year'].map(period => (
                <button
                  key={period}
                  className={`stats-period-btn ${chartPeriod === period ? 'active' : ''}`}
                  onClick={() => {
                    setChartPeriod(period);
                    // Отслеживаем смену периода
                    const currentUser = getCurrentUser();
                    if (currentUser?.id) {
                      trackEvent('statistics_period_changed', {
                        userId: currentUser.id,
                        period: period,
                        timestamp: new Date().toISOString()
                      });
                    }
                  }}
                >
                  {t(`statsPeriod${period.charAt(0).toUpperCase() + period.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="stats-charts-grid">
            {/* Столбчатая диаграмма */}
            <div className="stats-chart-card">
              <div className="stats-chart-header">
                <h3>{t('statsBarChartTitle')}</h3>
              </div>
              <div className="stats-chart-wrapper">
                {chartData.length > 0 ? (
                  <div className="stats-bars-container">
                    {chartData.map((calc, index) => {
                      const maxValue = Math.max(...chartData.map(c => c.footprint));
                      const heightPercent = maxValue > 0 ? (calc.footprint / maxValue) * 100 : 0;
                      return (
                        <div key={index} className="stats-bar-item">
                          <div 
                            className="stats-bar"
                            style={{
                              height: `${Math.max(heightPercent, 5)}%`,
                              backgroundColor: calc.footprint > 10000 ? '#EF5350' : '#4CAF50'
                            }}
                          >
                            <div className="stats-bar-value">{calc.footprint.toFixed(1)}</div>
                          </div>
                          <div className="stats-bar-label">
                            {new Date(calc.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="stats-empty-chart">
                    <span className="material-icons">bar_chart</span>
                    <p>{t('statsNoData')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Круговая диаграмма */}
            <div className="stats-chart-card">
              <div className="stats-chart-header">
                <h3>{t('statsPieChartTitle')}</h3>
              </div>
              <div className="stats-chart-wrapper">
                {pieData && Object.keys(pieData).length > 0 ? (
                  <div className="stats-pie-container">
                    {(() => {
                      const colors = {
                        transport: '#4CAF50',
                        housing: '#2196F3',
                        food: '#FF9800',
                        waste: '#9C27B0'
                      };
                      const names = {
                        transport: t('categoryTransport'),
                        housing: t('statsHousing'),
                        food: t('categoryFood'),
                        waste: t('statsWaste')
                      };
                      
                      const total = Object.values(pieData).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
                      const data = Object.entries(pieData)
                        .filter(([_, value]) => parseFloat(value) > 0)
                        .map(([key, value]) => ({
                          key,
                          value: parseFloat(value),
                          percentage: total > 0 ? ((parseFloat(value) / total) * 100).toFixed(1) : 0,
                          color: colors[key] || '#757575',
                          name: names[key] || key
                        }));
                      
                      // Создаем SVG круговую диаграмму
                      let currentAngle = -90; // Начинаем сверху
                      const radius = 80;
                      const centerX = 100;
                      const centerY = 100;
                      
                      return (
                        <>
                          <svg viewBox="0 0 200 200" className="stats-pie-chart">
                            {data.map((item, index) => {
                              const angle = (item.value / total) * 360;
                              const startAngle = currentAngle;
                              const endAngle = currentAngle + angle;
                              currentAngle = endAngle;
                              
                              const startRad = (startAngle * Math.PI) / 180;
                              const endRad = (endAngle * Math.PI) / 180;
                              
                              const x1 = centerX + radius * Math.cos(startRad);
                              const y1 = centerY + radius * Math.sin(startRad);
                              const x2 = centerX + radius * Math.cos(endRad);
                              const y2 = centerY + radius * Math.sin(endRad);
                              
                              const largeArc = angle > 180 ? 1 : 0;
                              
                              const pathData = [
                                `M ${centerX} ${centerY}`,
                                `L ${x1} ${y1}`,
                                `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                                'Z'
                              ].join(' ');
                              
                              return (
                                <path
                                  key={index}
                                  d={pathData}
                                  fill={item.color}
                                  stroke="var(--bg-secondary)"
                                  strokeWidth="2"
                                />
                              );
                            })}
                          </svg>
                          <div className="stats-pie-legend">
                            {data.map((item, index) => (
                              <div key={index} className="stats-pie-legend-item">
                                <div className="stats-pie-color" style={{ backgroundColor: item.color }}></div>
                                <span className="stats-pie-label">{item.name}</span>
                                <span className="stats-pie-value">{item.percentage}%</span>
                                <span className="stats-pie-kg">({item.value.toFixed(1)} {t('statsKg')})</span>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="stats-empty-chart">
                    <span className="material-icons">pie_chart</span>
                    <p>{t('statsNoData')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Калькулятор */}
        <div ref={calculatorRef} className="stats-calculator">
          <div className="stats-calculator-header">
            <h2 className="stats-section-title">{t('statsCalculatorTitle')}</h2>
            <button className="stats-calc-btn outline" onClick={resetCalculator}>
              <span className="material-icons">refresh</span> {t('statsReset')}
            </button>
          </div>
          <div className="stats-calculator-hint">
            <p>{t('statsCalculatorHint')}</p>
          </div>

          <div className="stats-calculator-grid">
            {/* Транспорт */}
            <div className="stats-calc-category">
              <h3>{t('categoryTransport')}</h3>
              <div className="stats-calc-input-group">
                <label>{t('statsCarKm')}</label>
                <div className="stats-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="1"
                    value={calculatorData.transport.carKm}
                    onChange={(e) => updateCalculatorData('transport', 'carKm', e.target.value)}
                  />
                  <span className="stats-slider-value">{calculatorData.transport.carKm} {t('statsKm')}</span>
                </div>
              </div>
              <div className="stats-calc-input-group">
                <label>{t('statsBusKm')}</label>
                <div className="stats-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={calculatorData.transport.busKm}
                    onChange={(e) => updateCalculatorData('transport', 'busKm', e.target.value)}
                  />
                  <span className="stats-slider-value">{calculatorData.transport.busKm} {t('statsKm')}</span>
                </div>
              </div>
              <div className="stats-calc-input-group">
                <label>{t('statsPlaneKm')}</label>
                <div className="stats-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={calculatorData.transport.planeKm}
                    onChange={(e) => updateCalculatorData('transport', 'planeKm', e.target.value)}
                  />
                  <span className="stats-slider-value">{calculatorData.transport.planeKm} {t('statsKm')}</span>
                </div>
              </div>
              <div className="stats-calc-input-group">
                <label>{t('statsTrainKm')}</label>
                <div className="stats-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="150"
                    step="1"
                    value={calculatorData.transport.trainKm}
                    onChange={(e) => updateCalculatorData('transport', 'trainKm', e.target.value)}
                  />
                  <span className="stats-slider-value">{calculatorData.transport.trainKm} {t('statsKm')}</span>
                </div>
              </div>
            </div>

            {/* Жилье */}
            <div className="stats-calc-category">
              <h3>{t('statsHousing')}</h3>
              <div className="stats-calc-input-group">
                <label>{t('statsElectricity')}</label>
                <div className="stats-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={calculatorData.housing.electricity}
                    onChange={(e) => updateCalculatorData('housing', 'electricity', e.target.value)}
                  />
                  <span className="stats-slider-value">{calculatorData.housing.electricity} {t('statsKWh')}</span>
                </div>
              </div>
              <div className="stats-calc-input-group">
                <label>{t('statsHeating')}</label>
                <div className="stats-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={calculatorData.housing.heating}
                    onChange={(e) => updateCalculatorData('housing', 'heating', e.target.value)}
                  />
                  <span className="stats-slider-value">{calculatorData.housing.heating} {t('statsKWh')}</span>
                </div>
              </div>
              <div className="stats-calc-input-group">
                <label>{t('statsWater')}</label>
                <div className="stats-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={calculatorData.housing.water}
                    onChange={(e) => updateCalculatorData('housing', 'water', e.target.value)}
                  />
                  <span className="stats-slider-value">{calculatorData.housing.water} {t('statsM3')}</span>
                </div>
              </div>
              <div className="stats-calc-input-group">
                <label>{t('statsGas')}</label>
                <div className="stats-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={calculatorData.housing.gas}
                    onChange={(e) => updateCalculatorData('housing', 'gas', e.target.value)}
                  />
                  <span className="stats-slider-value">{calculatorData.housing.gas} {t('statsM3')}</span>
                </div>
              </div>
            </div>

            {/* Питание */}
            <div className="stats-calc-category">
              <h3>{t('categoryFood')}</h3>
              <div className="stats-calc-input-group">
                <label>{t('statsMeat')}</label>
                <div className="stats-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={calculatorData.food.meatKg}
                    onChange={(e) => updateCalculatorData('food', 'meatKg', e.target.value)}
                  />
                  <span className="stats-slider-value">{calculatorData.food.meatKg} {t('statsKg')}</span>
                </div>
              </div>
              <div className="stats-calc-input-group">
                <label>{t('statsVegetables')}</label>
                <div className="stats-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={calculatorData.food.vegetablesKg}
                    onChange={(e) => updateCalculatorData('food', 'vegetablesKg', e.target.value)}
                  />
                  <span className="stats-slider-value">{calculatorData.food.vegetablesKg} {t('statsKg')}</span>
                </div>
              </div>
              <div className="stats-calc-input-group">
                <label>{t('statsDairy')}</label>
                <div className="stats-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={calculatorData.food.dairy}
                    onChange={(e) => updateCalculatorData('food', 'dairy', e.target.value)}
                  />
                  <span className="stats-slider-value">{calculatorData.food.dairy} {t('statsL')}</span>
                </div>
              </div>
              <div className="stats-calc-input-group">
                <label>{t('statsProcessedFood')}</label>
                <div className="stats-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={calculatorData.food.processedFood}
                    onChange={(e) => updateCalculatorData('food', 'processedFood', e.target.value)}
                  />
                  <span className="stats-slider-value">{calculatorData.food.processedFood} {t('statsServings')}</span>
                </div>
              </div>
              <div className="stats-calc-input-group">
                <label>{t('statsLocalFood')}</label>
                <div className="stats-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={calculatorData.food.localFood}
                    onChange={(e) => updateCalculatorData('food', 'localFood', e.target.value)}
                  />
                  <span className="stats-slider-value">{calculatorData.food.localFood}%</span>
                </div>
              </div>
            </div>

            {/* Отходы */}
            <div className="stats-calc-category">
              <h3>{t('statsWaste')}</h3>
              <div className="stats-calc-input-group">
                <label>{t('statsPlastic')}</label>
                <div className="stats-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={calculatorData.waste.plastic}
                    onChange={(e) => updateCalculatorData('waste', 'plastic', e.target.value)}
                  />
                  <span className="stats-slider-value">{calculatorData.waste.plastic} {t('statsKg')}</span>
                </div>
              </div>
              <div className="stats-calc-input-group">
                <label>{t('statsRecycling')}</label>
                <div className="stats-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={calculatorData.waste.recycling}
                    onChange={(e) => updateCalculatorData('waste', 'recycling', e.target.value)}
                  />
                  <span className="stats-slider-value">{calculatorData.waste.recycling}%</span>
                </div>
              </div>
              <div className="stats-calc-input-group">
                <label>{t('statsCompost')}</label>
                <div className="stats-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={calculatorData.waste.compost}
                    onChange={(e) => updateCalculatorData('waste', 'compost', e.target.value)}
                  />
                  <span className="stats-slider-value">{calculatorData.waste.compost}%</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            className="stats-calculate-btn"
            onClick={calculateFootprint}
            disabled={loading}
          >
            {loading ? t('statsCalculating') : t('statsCalculateButton')}
          </button>

          {calculationResult && (
            <div className="stats-results">
              <h3>{t('statsResults')}</h3>
              <div className="stats-results-grid">
                <div className="stats-result-item">
                  <div className="stats-result-label">{t('statsTotalFootprint')}</div>
                  <div className="stats-result-value">
                    {(calculationResult.total_footprint).toFixed(2)} {t('statsKg')}
                  </div>
                  <div className="stats-result-description">{t('statsPerDay')}</div>
                </div>
                <div className="stats-result-item success">
                  <div className="stats-result-label">{t('statsSaved')}</div>
                  <div className="stats-result-value">
                    {(calculationResult.co2_saved).toFixed(2)} {t('statsKg')}
                  </div>
                  <div className="stats-result-description">{t('statsPerDay')}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* История расчетов */}
        <div className="stats-history">
          <h2 className="stats-section-title">{t('statsHistory')}</h2>
          {calculations.length > 0 ? (
            <div className="stats-timeline">
              {calculations.map((calc, index) => (
                <div key={index} className="stats-timeline-item">
                  <div className="stats-timeline-dot"></div>
                  <div className="stats-timeline-date">
                    {formatDate(calc.date || calc.calculation_date)}
                  </div>
                  <div className="stats-timeline-content">
                    <div className="stats-timeline-value">
                      <span className="material-icons">eco</span>
                      <strong>{t('statsSaved')}: {(calc.co2_saved || calc.saved || 0).toFixed(1)} {t('statsKg')} CO₂</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="stats-empty-history">
              <span className="material-icons">history</span>
              <p>{t('statsNoHistory')}</p>
              <button className="stats-btn primary" onClick={scrollToCalculator}>
                {t('statsFirstCalculation')}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Модальное окно ошибки */}
      {showErrorModal && (
        <div className="modal-overlay" onClick={() => setShowErrorModal(false)}>
          <div className="modal-content error-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('error') || 'Ошибка'}</h2>
              <button className="modal-close" onClick={() => setShowErrorModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p>{errorMessage}</p>
            </div>
            <div className="modal-footer">
              <button className="stats-btn primary" onClick={() => setShowErrorModal(false)}>
                {t('ok') || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;
