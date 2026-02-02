import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getEmojiByCarbon } from '../utils/emojiMapper';
import '../styles/pages/LeaderboardPage.css';

const LeaderboardPage = () => {
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Состояния для пользователей
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [userRank, setUserRank] = useState(null);
  
  // Состояния для команд
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsPagination, setTeamsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [userTeamRank, setUserTeamRank] = useState(null);

  // Проверка авторизации и предзагрузка данных
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('Ошибка при парсинге пользователя:', error);
      }
    }
    
    // Предзагружаем данные для обеих вкладок сразу
    const preloadData = async () => {
      try {
        // Загружаем пользователей
        const usersResponse = await fetch(`/api/leaderboard/users?page=1&limit=20${userStr ? `&userId=${JSON.parse(userStr).id}` : ''}`);
        const usersData = await usersResponse.json();
        
        if (usersData.success) {
          setUsers(usersData.users);
          setUserRank(usersData.userRank);
          setUsersPagination(prev => ({
            ...prev,
            total: usersData.pagination.total,
            totalPages: usersData.pagination.totalPages
          }));
        }
        
        // Загружаем команды
        const teamsResponse = await fetch(`/api/leaderboard/teams?page=1&limit=20${userStr ? `&userId=${JSON.parse(userStr).id}` : ''}`);
        const teamsData = await teamsResponse.json();
        
        if (teamsData.success) {
          setTeams(teamsData.teams);
          setUserTeamRank(teamsData.userTeamRank);
          setTeamsPagination(prev => ({
            ...prev,
            total: teamsData.pagination.total,
            totalPages: teamsData.pagination.totalPages
          }));
        }
      } catch (error) {
        console.error('Ошибка предзагрузки данных:', error);
      } finally {
        setIsInitialLoad(false);
      }
    };
    
    preloadData();
  }, []); // Только при монтировании компонента

  // Загрузка рейтинга пользователей (для пагинации)
  const loadUsersLeaderboard = useCallback(async (page = 1) => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: usersPagination.limit.toString()
      });
      
      if (currentUser) {
        params.append('userId', currentUser.id.toString());
      }
      
      const response = await fetch(`/api/leaderboard/users?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        setUserRank(data.userRank);
        setUsersPagination(prev => ({
          ...prev,
          page,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Ошибка загрузки рейтинга пользователей:', error);
    } finally {
      setUsersLoading(false);
    }
  }, [currentUser, usersPagination.limit]);

  // Загрузка рейтинга команд (для пагинации)
  const loadTeamsLeaderboard = useCallback(async (page = 1) => {
    setTeamsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: teamsPagination.limit.toString()
      });
      
      if (currentUser) {
        params.append('userId', currentUser.id.toString());
      }
      
      const response = await fetch(`/api/leaderboard/teams?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTeams(data.teams);
        setUserTeamRank(data.userTeamRank);
        setTeamsPagination(prev => ({
          ...prev,
          page,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Ошибка загрузки рейтинга команд:', error);
    } finally {
      setTeamsLoading(false);
    }
  }, [currentUser, teamsPagination.limit]);

  // Обработчики пагинации
  const handleUsersPageChange = (newPage) => {
    if (newPage < 1 || newPage > usersPagination.totalPages || newPage === usersPagination.page) return;
    loadUsersLeaderboard(newPage);
  };

  const handleTeamsPageChange = (newPage) => {
    if (newPage < 1 || newPage > teamsPagination.totalPages || newPage === teamsPagination.page) return;
    loadTeamsLeaderboard(newPage);
  };

  // Форматирование CO₂
  const formatCarbonSaved = (carbonSaved) => {
    const value = carbonSaved || 0;
    if (value >= 1000) {
      const tons = (value / 1000).toFixed(1);
      return `${tons} ${t('units.tons') || 'т'}`;
    }
    return `${value.toLocaleString()} ${t('carbonUnit') || 'кг'}`;
  };

  // Получение эмодзи для пользователя
  const getUserAvatar = (user) => {
    if (user.avatar_emoji && user.avatar_emoji.length <= 10) {
      return getEmojiByCarbon(user.carbon_saved || 0);
    }
    if (user.avatar_emoji) {
      return user.avatar_emoji;
    }
    return getEmojiByCarbon(user.carbon_saved || 0);
  };

  // Получение эмодзи для команды
  const getTeamAvatar = (team) => {
    // Если в базе есть эмодзи, используем его
    if (team.avatar_emoji) {
      return team.avatar_emoji;
    }
    // Иначе используем эмодзи по умолчанию на основе CO₂
    return getEmojiByCarbon(team.total_carbon_saved || 0);
  };

  // Рендер пагинации
  const renderPagination = (pagination, onPageChange, loading) => {
    if (pagination.totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Кнопка "Назад"
    pages.push(
      <button
        key="prev"
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={pagination.page === 1 || loading}
        className="leaderboard-pagination-button"
      >
        <span className="material-icons">chevron_left</span>
      </button>
    );
    
    // Первая страница
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => onPageChange(1)}
          className={`leaderboard-pagination-button ${1 === pagination.page ? 'active' : ''}`}
          disabled={loading}
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="leaderboard-pagination-ellipsis">
            ...
          </span>
        );
      }
    }
    
    // Видимые страницы
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`leaderboard-pagination-button ${i === pagination.page ? 'active' : ''}`}
          disabled={loading}
        >
          {i}
        </button>
      );
    }
    
    // Последняя страница
    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="leaderboard-pagination-ellipsis">
            ...
          </span>
        );
      }
      
      pages.push(
        <button
          key={pagination.totalPages}
          onClick={() => onPageChange(pagination.totalPages)}
          className={`leaderboard-pagination-button ${pagination.totalPages === pagination.page ? 'active' : ''}`}
          disabled={loading}
        >
          {pagination.totalPages}
        </button>
      );
    }
    
    // Кнопка "Вперед"
    pages.push(
      <button
        key="next"
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page === pagination.totalPages || loading}
        className="leaderboard-pagination-button"
      >
        <span className="material-icons">chevron_right</span>
      </button>
    );
    
    return (
      <div className="leaderboard-pagination-container">
        <div className="leaderboard-pagination-info">
          {t('showing') || 'Показано'}: <strong>{(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> {t('of') || 'из'} <strong>{pagination.total}</strong>
        </div>
        <div className="leaderboard-pagination-buttons">
          {pages}
        </div>
      </div>
    );
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        {/* Заголовок */}
        <div className="leaderboard-header">
          <h1 className="leaderboard-title">
            <span className="material-icons">leaderboard</span>
            {t('leaderboardTitle') || 'Рейтинг по сэкономленному CO₂'}
          </h1>
        </div>

        {/* Позиция пользователя */}
        {currentUser && (
          <div className="user-position-card">
            {activeTab === 'users' && userRank && (
              <div className="user-position-info">
                <span className="material-icons">person</span>
                <span>{t('yourPosition') || 'Ваша позиция'}:</span>
                <strong>#{userRank}</strong>
                <span>{t('outOf') || 'из'} {usersPagination.total}</span>
              </div>
            )}
            {activeTab === 'teams' && userTeamRank && (
              <div className="user-position-info">
                <span className="material-icons">groups</span>
                <span>{t('yourTeamPosition') || 'Позиция вашей команды'}:</span>
                <strong>#{userTeamRank}</strong>
                <span>{t('outOf') || 'из'} {teamsPagination.total}</span>
              </div>
            )}
          </div>
        )}

        {/* Вкладки */}
        <div className="leaderboard-tabs-container">
          <div className="leaderboard-tabs">
            <button
              className={`leaderboard-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="material-icons">person</span>
              {t('usersTab') || 'Пользователи'}
            </button>
            <button
              className={`leaderboard-tab ${activeTab === 'teams' ? 'active' : ''}`}
              onClick={() => setActiveTab('teams')}
            >
              <span className="material-icons">groups</span>
              {t('teamsTab') || 'Команды'}
            </button>
          </div>
        </div>

        {/* Контент */}
        <div className="leaderboard-content">
          {activeTab === 'users' && (
            <div className="leaderboard-section">
              {usersLoading ? (
                <div className="leaderboard-loading">
                  <div className="loading-spinner"></div>
                  <p>{t('loading') || 'Загрузка...'}</p>
                </div>
              ) : users.length === 0 ? (
                <div className="leaderboard-empty">
                  <span className="material-icons">people</span>
                  <p>{t('noUsersData') || 'Нет данных о пользователях'}</p>
                </div>
              ) : (
                <>
                  <div className="leaderboard-table-container">
                    <table className="leaderboard-table">
                      <thead>
                        <tr>
                          <th>{t('rank') || 'Место'}</th>
                          <th>{t('user') || 'Пользователь'}</th>
                          <th>{t('carbonSaved') || 'CO₂ сэкономлено'}</th>
                          <th>{t('joinDate') || 'Дата регистрации'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user, index) => (
                          <tr key={user.id} className={currentUser?.id === user.id ? 'current-user' : ''}>
                            <td className="rank-cell">
                              <div className="rank-badge">
                                {user.rank <= 3 && (
                                  <span className="material-icons rank-medal">
                                    {user.rank === 1 ? 'emoji_events' : user.rank === 2 ? 'military_tech' : 'workspace_premium'}
                                  </span>
                                )}
                                <span className="rank-number">#{user.rank}</span>
                              </div>
                            </td>
                            <td className="user-cell">
                              <div className="user-info">
                                <span className="user-avatar">{getUserAvatar(user)}</span>
                                <div className="user-details">
                                  <div className="user-nickname">{user.nickname || 'Без никнейма'}</div>
                                  <div className="user-email">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="carbon-cell">
                              <div className="carbon-info">
                                <span className="material-icons">eco</span>
                                <span className="carbon-value">{formatCarbonSaved(user.carbon_saved)}</span>
                              </div>
                            </td>
                            <td className="date-cell">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(usersPagination, handleUsersPageChange, usersLoading)}
                </>
              )}
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="leaderboard-section">
              {teamsLoading ? (
                <div className="leaderboard-loading">
                  <div className="loading-spinner"></div>
                  <p>{t('loading') || 'Загрузка...'}</p>
                </div>
              ) : teams.length === 0 ? (
                <div className="leaderboard-empty">
                  <span className="material-icons">groups</span>
                  <p>{t('noTeamsData') || 'Нет данных о командах'}</p>
                </div>
              ) : (
                <>
                  <div className="leaderboard-table-container">
                    <table className="leaderboard-table">
                      <thead>
                        <tr>
                          <th>{t('rank') || 'Место'}</th>
                          <th>{t('team') || 'Команда'}</th>
                          <th>{t('members') || 'Участники'}</th>
                          <th>{t('carbonSaved') || 'CO₂ сэкономлено'}</th>
                          <th>{t('createdDate') || 'Дата создания'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teams.map((team, index) => (
                          <tr key={team.id}>
                            <td className="rank-cell">
                              <div className="rank-badge">
                                {team.rank <= 3 && (
                                  <span className="material-icons rank-medal">
                                    {team.rank === 1 ? 'emoji_events' : team.rank === 2 ? 'military_tech' : 'workspace_premium'}
                                  </span>
                                )}
                                <span className="rank-number">#{team.rank}</span>
                              </div>
                            </td>
                            <td className="team-cell">
                              <div className="team-info">
                                <span className="team-avatar">{getTeamAvatar(team)}</span>
                                <div className="team-details">
                                  <div className="team-name">{team.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="members-cell">
                              <div className="members-info">
                                <span className="material-icons">group</span>
                                <span>{team.member_count || 0}</span>
                              </div>
                            </td>
                            <td className="carbon-cell">
                              <div className="carbon-info">
                                <span className="material-icons">eco</span>
                                <span className="carbon-value">{formatCarbonSaved(team.total_carbon_saved)}</span>
                              </div>
                            </td>
                            <td className="date-cell">
                              {new Date(team.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(teamsPagination, handleTeamsPageChange, teamsLoading)}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;