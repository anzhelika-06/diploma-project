import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentUser } from '../utils/authUtils';
import '../styles/components/StreakWidget.css';

const StreakWidget = () => {
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const [streak, setStreak] = useState(0);
  const [isNewDay, setIsNewDay] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem('token');

    // Ping streak on mount (app open)
    fetch('/api/streak/ping', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStreak(data.current_streak);
          setIsNewDay(data.is_new_day);
        }
      })
      .catch(() => {});
  }, [currentUser?.id]);

  if (!streak) return null;

  return (
    <div className={`streak-widget${isNewDay ? ' streak-new' : ''}`} title={t('streakTitle') || `Серия: ${streak} дней`}>
      <span className="streak-fire">🔥</span>
      <span className="streak-count">{streak}</span>
    </div>
  );
};

export default StreakWidget;
