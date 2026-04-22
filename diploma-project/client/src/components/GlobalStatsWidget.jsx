import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/components/GlobalStatsWidget.css';

const GlobalStatsWidget = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/global-stats')
      .then(r => r.json())
      .then(data => { if (data.success) setStats(data.stats); })
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const formatNum = (n) => {
    const num = parseInt(n) || 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatCO2 = (n) => {
    const num = parseInt(n) || 0;
    // Если больше 1000, показываем в тысячах с запятой
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.', ',') + ' ' + (t('statsThousand') || 'тыс.');
    }
    return num.toLocaleString();
  };

  return (
    <div className="global-stats-widget">
      <div className="global-stats-title">
        🌍 {t('globalStatsTitle') || 'Наше сообщество вместе'}
      </div>
      <div className="global-stats-grid">
        <div className="global-stat-item">
          <span className="global-stat-icon">♻️</span>
          <span className="global-stat-value">{formatCO2(stats.total_carbon_saved)}</span>
          <span className="global-stat-label">{t('globalStatsCO2') || 'кг CO₂ сэкономлено'}</span>
        </div>
        <div className="global-stat-item">
          <span className="global-stat-icon">🌳</span>
          <span className="global-stat-value">{formatNum(stats.total_trees_planted)}</span>
          <span className="global-stat-label">{t('globalStatsTrees') || 'деревьев посажено'}</span>
        </div>
        <div className="global-stat-item">
          <span className="global-stat-icon">👥</span>
          <span className="global-stat-value">{formatNum(stats.total_users)}</span>
          <span className="global-stat-label">{t('globalStatsUsers') || 'участников'}</span>
        </div>
        <div className="global-stat-item">
          <span className="global-stat-icon">🤝</span>
          <span className="global-stat-value">{formatNum(stats.total_teams)}</span>
          <span className="global-stat-label">{t('globalStatsTeams') || 'команд'}</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalStatsWidget;
