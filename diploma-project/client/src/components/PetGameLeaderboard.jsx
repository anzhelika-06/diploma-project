import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/authUtils';
import '../styles/components/PetGame.css';

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function PetGameLeaderboard({ onClose, t }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) setCurrentUserId(user.id);

    // Показываем загрузку только если запрос долгий
    const loadingTimer = setTimeout(() => setLoading(true), 300);

    fetch('/api/pet/game/leaderboard', { headers: authHeader() })
      .then(r => r.json())
      .then(data => { 
        clearTimeout(loadingTimer);
        if (data.success) setLeaderboard(data.leaderboard); 
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(loadingTimer);
        setLoading(false);
      });

    return () => clearTimeout(loadingTimer);
  }, []);

  const handleRowClick = (userId) => {
    onClose();
    navigate(`/profile/${userId}`);
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal pet-leaderboard-modal">
        <div className="modal-header">
          <h3 style={{ fontWeight: 'normal' }}>
            <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '8px' }}>emoji_events</span>
            {t ? t('petGameLeaderboard') : 'Рейтинг'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="modal-body">
          {loading && leaderboard.length === 0 ? (
            <div className="pet-lb-loading">
              <span className="material-icons spinning">refresh</span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="pet-lb-empty">
              <span style={{ fontSize: 40 }}>🎮</span>
              <p>{t ? t('petGameNoPlayers') : 'Сегодня ещё никто не играл'}</p>
            </div>
          ) : (
            <div className="pet-lb-list">
              {leaderboard.map((row, i) => (
                <div 
                  key={row.user_id} 
                  className={`pet-lb-row${i < 3 ? ' top' : ''}${row.user_id === currentUserId ? ' current-user' : ''}`}
                  onClick={() => handleRowClick(row.user_id)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="pet-lb-rank">{medals[i] || `#${i + 1}`}</span>
                  <span className="pet-lb-avatar">{row.avatar_emoji}</span>
                  <div className="pet-lb-info">
                    <span className="pet-lb-nick">{row.nickname}</span>
                    {row.pet_name && (
                      <span className="pet-lb-pet">{row.pet_name} · ур. {row.pet_level}</span>
                    )}
                  </div>
                  <span className="pet-lb-score">{row.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
