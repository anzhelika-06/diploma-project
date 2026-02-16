import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentUser } from '../utils/authUtils';
import { translateEcoLevel } from '../utils/translations';
import io from 'socket.io-client';
import '../styles/pages/FriendsPage.css';

const FriendsPage = () => {
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [friends, setFriends] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]); // Входящие запросы
  const [outgoingRequests, setOutgoingRequests] = useState([]); // Исходящие запросы
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [userToAccept, setUserToAccept] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [userToReject, setUserToReject] = useState(null);
  const [pendingRequests, setPendingRequests] = useState(new Set()); // Отслеживаем отправленные запросы

  // Загрузка друзей и рекомендаций
  useEffect(() => {
    if (!currentUser) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        // Загружаем друзей
        const friendsResponse = await fetch(`/api/users/${currentUser.id}/friends`);
        const friendsData = await friendsResponse.json();
        if (friendsData.success) {
          setFriends(friendsData.friends);
        }

        // Загружаем рекомендации
        const recsResponse = await fetch(`/api/users/${currentUser.id}/friends/recommendations`);
        const recsData = await recsResponse.json();
        if (recsData.success) {
          setRecommendations(recsData.recommendations);
        }

        // Загружаем входящие запросы
        const incomingResponse = await fetch(`/api/users/${currentUser.id}/friends/requests/incoming`);
        const incomingData = await incomingResponse.json();
        if (incomingData.success) {
          setIncomingRequests(incomingData.requests || []);
        }

        // Загружаем исходящие запросы
        const outgoingResponse = await fetch(`/api/users/${currentUser.id}/friends/requests/outgoing`);
        const outgoingData = await outgoingResponse.json();
        if (outgoingData.success) {
          setOutgoingRequests(outgoingData.requests || []);
          // Добавляем их в pendingRequests
          const outgoingIds = outgoingData.requests.map(r => r.id);
          setPendingRequests(new Set(outgoingIds));
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Подключаем WebSocket
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('WebSocket подключен на FriendsPage');
      socket.emit('join', `user:${currentUser.id}`);
    });

    // Обработчик принятия запроса в друзья
    socket.on('friendRequestAccepted', (data) => {
      console.log('Запрос в друзья принят:', data);
      // Убираем из pending
      setPendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.friendId);
        return newSet;
      });
      // Перезагружаем данные
      loadData();
    });

    // Обработчик отклонения запроса
    socket.on('friendRequestRejected', (data) => {
      console.log('Запрос в друзья отклонен:', data);
      // Убираем из pending
      setPendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.friendId);
        return newSet;
      });
      // Перезагружаем данные
      loadData();
    });

    // Обработчик нового входящего запроса
    socket.on('friendRequestReceived', (data) => {
      console.log('Получен новый запрос в друзья:', data);
      // Перезагружаем данные
      loadData();
    });

    return () => {
      socket.emit('leave', `user:${currentUser.id}`);
      socket.disconnect();
    };
  }, [currentUser?.id]);

  // Поиск пользователей
  useEffect(() => {
    if (!currentUser) return;
    
    // Сохраняем userId в константу, чтобы избежать проблем с замыканием
    const userId = currentUser.id;
    
    const searchUsers = async () => {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) {
        setSearchResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      try {
        const response = await fetch(`/api/users/search?query=${encodeURIComponent(searchQuery)}&currentUserId=${userId}`);
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.users);
        }
      } catch (error) {
        console.error('Ошибка поиска:', error);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentUser?.id]); // Зависимость только от searchQuery и id пользователя

  const loadRecommendations = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/users/${currentUser.id}/friends/recommendations`);
      const data = await response.json();
      if (data.success) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Ошибка загрузки рекомендаций:', error);
    }
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleSendMessage = (userId, nickname) => {
    // Заглушка для будущего функционала
    alert(`Функция отправки сообщений пользователю ${nickname} будет доступна в следующей версии!`);
  };

  const handleAddFriend = async (userId) => {
    try {
      const response = await fetch(`/api/users/${currentUser.id}/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: userId })
      });
      const data = await response.json();
      if (data.success) {
        // Добавляем в список отправленных запросов
        setPendingRequests(prev => new Set([...prev, userId]));
        // Обновляем статус в результатах поиска
        setSearchResults(prev => prev.map(u => 
          u.id === userId ? { ...u, friendship_status: 'pending_sent' } : u
        ));
        // Обновляем статус в рекомендациях (НЕ удаляем, а меняем статус)
        setRecommendations(prev => prev.map(u => 
          u.id === userId ? { ...u, friendship_status: 'pending_sent' } : u
        ));
        
        // Добавляем пользователя в список исходящих запросов
        const userToAdd = searchResults.find(u => u.id === userId) || 
                          recommendations.find(u => u.id === userId);
        if (userToAdd) {
          setOutgoingRequests(prev => [...prev, userToAdd]);
        }
      }
    } catch (error) {
      console.error('Ошибка отправки запроса:', error);
    }
  };

  const handleRemoveFriend = (userId, nickname) => {
    setUserToDelete({ id: userId, nickname });
    setShowDeleteModal(true);
  };

  const confirmRemoveFriend = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await fetch(`/api/users/${currentUser.id}/friends/${userToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        // Обновляем список друзей
        setFriends(prev => prev.filter(u => u.id !== userToDelete.id));
        // Перезагружаем рекомендации
        loadRecommendations();
      }
    } catch (error) {
      console.error('Ошибка удаления из друзей:', error);
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      const response = await fetch(`/api/users/${currentUser.id}/friends/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: userId })
      });
      const data = await response.json();
      if (data.success) {
        // Убираем из входящих запросов
        setIncomingRequests(prev => prev.filter(u => u.id !== userId));
        // Добавляем в друзья (или перезагружаем)
        const friendsResponse = await fetch(`/api/users/${currentUser.id}/friends`);
        const friendsData = await friendsResponse.json();
        if (friendsData.success) {
          setFriends(friendsData.friends);
        }
        // Обновляем рекомендации после принятия запроса
        loadRecommendations();
        // Закрываем модальное окно
        setShowAcceptModal(false);
        setUserToAccept(null);
      }
    } catch (error) {
      console.error('Ошибка принятия запроса:', error);
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      const response = await fetch(`/api/users/${currentUser.id}/friends/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: userId })
      });
      const data = await response.json();
      if (data.success) {
        // Убираем из входящих запросов
        setIncomingRequests(prev => prev.filter(u => u.id !== userId));
        // Обновляем рекомендации после отклонения запроса
        loadRecommendations();
        // Закрываем модальное окно
        setShowRejectModal(false);
        setUserToReject(null);
      }
    } catch (error) {
      console.error('Ошибка отклонения запроса:', error);
    }
  };

  const handleCancelRequest = async (userId) => {
    try {
      const response = await fetch(`/api/users/${currentUser.id}/friends/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: userId })
      });
      const data = await response.json();
      if (data.success) {
        // Убираем из исходящих запросов
        setOutgoingRequests(prev => prev.filter(u => u.id !== userId));
        // Убираем из pending
        setPendingRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        // Обновляем рекомендации после отмены запроса
        loadRecommendations();
      }
    } catch (error) {
      console.error('Ошибка отмены запроса:', error);
    }
  };

  const renderUserCard = (user, isFriend = false) => {
    // Проверяем статус дружбы
    const friendshipStatus = user.friendshipStatus || user.friendship_status;
    const isPending = pendingRequests.has(user.id) || friendshipStatus === 'pending_sent' || friendshipStatus === 'pending';
    // Проверяем, является ли пользователь другом (либо передан флаг, либо статус accepted, либо есть в списке друзей)
    const isActualFriend = isFriend || friendshipStatus === 'accepted' || friends.some(f => f.id === user.id);
    
    return (
      <div key={user.id} className="user-card-list">
        <div className="user-card-left" onClick={() => handleViewProfile(user.id)}>
          <div className="user-avatar">{user.avatar_emoji || '🌱'}</div>
          <div className="user-info">
            <span className="user-name">{user.nickname}</span>
            <span className="user-separator">•</span>
            <span className="user-level">{translateEcoLevel(user.eco_level, currentLanguage)}</span>
            {user.mutual_friends_count > 0 && (
              <>
                <span className="user-separator">•</span>
                <span className="mutual-friends">
                  {user.mutual_friends_count} {t('mutualFriends') || 'общих друзей'}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="user-card-right">
          {isActualFriend ? (
            <>
              <button
                className="btn-icon btn-message"
                onClick={() => handleSendMessage(user.id, user.nickname)}
              >
                <span className="material-icons">message</span>
                {t('sendMessage') || 'Сообщение'}
              </button>
              <button
                className="btn-icon btn-remove"
                onClick={() => handleRemoveFriend(user.id, user.nickname)}
                title={t('removeFriend') || 'Удалить'}
              >
                <span className="material-icons">person_remove</span>
              </button>
            </>
          ) : (
            <>
              {isPending ? (
                <button
                  className="btn-icon btn-pending"
                  disabled
                >
                  <span className="material-icons">schedule</span>
                  {t('requestSent') || 'Запрос отправлен'}
                </button>
              ) : (
                <button
                  className="btn-icon btn-add"
                  onClick={() => handleAddFriend(user.id)}
                >
                  <span className="material-icons">person_add</span>
                  {t('addFriend') || 'Добавить в друзья'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Фильтрация друзей по поисковому запросу
  const displayedFriends = searchQuery ? friends.filter(friend => 
    friend.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  ) : friends;

  const displayedRecommendations = searchQuery ? recommendations.filter(user => 
    user.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  ) : recommendations;

  if (!currentUser) {
    return (
      <div className="friends-page">
        <div className="empty-state">
          <span className="material-icons">login</span>
          <h3>{t('authRequired') || 'Требуется авторизация'}</h3>
          <p>{t('loginToViewFriends') || 'Войдите в систему, чтобы просматривать друзей'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="friends-page">
      <div className="page-header">
        <h1>{t('friends') || 'Друзья'}</h1>
        <p>{t('friendsSubtitle') || 'Ваши эко-друзья и новые знакомства'}</p>
      </div>

      {/* Поиск */}
      <div className="search-section">
        <div className="search-form">
          <input
            type="text"
            placeholder={t('searchByNickname') || 'Поиск по никнейму...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <span className="material-icons search-icon">search</span>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="loading-state">
            <span className="material-icons spinning">refresh</span>
            <p>{t('loading') || 'Загрузка...'}</p>
          </div>
        ) : (
          <>
            {/* Результаты поиска */}
            {searchQuery && searchResults.length > 0 && (
              <div className="search-results-section">
                <h2 className="section-title">
                  <span className="material-icons">search</span>
                  {t('searchResults') || 'Результаты поиска'} ({searchResults.length})
                </h2>
                <div className="users-list">
                  {searchResults.map(user => renderUserCard(user, user.friendshipStatus === 'accepted'))}
                </div>
              </div>
            )}

            {/* Если поиск идет */}
            {searching && (
              <div className="loading-state small">
                <span className="material-icons spinning">refresh</span>
                <p>{t('searching') || 'Поиск...'}</p>
              </div>
            )}

            {/* Если поиск не дал результатов */}
            {searchQuery && !searching && searchResults.length === 0 && (
              <div className="empty-state small">
                <span className="material-icons">search_off</span>
                <p>{t('noResults') || 'Ничего не найдено'}</p>
              </div>
            )}

            {/* Мои друзья (показываем только если нет поиска) */}
            {!searchQuery && displayedFriends.length > 0 && (
              <div className="friends-section">
                <h2 className="section-title">
                  <span className="material-icons">people</span>
                  {t('myFriends') || 'Мои друзья'} ({displayedFriends.length})
                </h2>
                <div className="users-list">
                  {displayedFriends.map(user => renderUserCard(user, true))}
                </div>
              </div>
            )}

            {/* Если нет друзей и нет поиска */}
            {!searchQuery && friends.length === 0 && (
              <div className="empty-state">
                <span className="material-icons">people_outline</span>
                <h3>{t('noFriends') || 'У вас пока нет друзей'}</h3>
                <p>{t('noFriendsDesc') || 'Найдите друзей через рекомендации ниже'}</p>
              </div>
            )}

            {/* Запросы в друзья (показываем только если нет поиска) */}
            {!searchQuery && (incomingRequests.length > 0 || outgoingRequests.length > 0) && (
              <div className="requests-section">
                <h2 className="section-title">
                  <span className="material-icons">person_add</span>
                  {t('friendRequests') || 'Запросы в друзья'}
                </h2>

                {/* Входящие запросы */}
                {incomingRequests.length > 0 && (
                  <div className="incoming-requests">
                    <h3 className="subsection-title">{t('incomingRequests') || 'Входящие запросы'} ({incomingRequests.length})</h3>
                    <div className="users-list">
                      {incomingRequests.map(user => (
                        <div key={user.id} className="user-card-list">
                          <div className="user-card-left" onClick={() => handleViewProfile(user.id)}>
                            <div className="user-avatar">{user.avatar_emoji || '🌱'}</div>
                            <div className="user-info">
                              <span className="user-name">{user.nickname}</span>
                              <span className="user-separator">•</span>
                              <span className="user-level">{translateEcoLevel(user.eco_level, currentLanguage)}</span>
                              {user.mutual_friends_count > 0 && (
                                <>
                                  <span className="user-separator">•</span>
                                  <span className="mutual-friends">
                                    {user.mutual_friends_count} {t('mutualFriends') || 'общих друзей'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="user-card-right">
                            <button
                              className="btn-icon btn-accept"
                              onClick={() => {
                                setUserToAccept(user);
                                setShowAcceptModal(true);
                              }}
                            >
                              <span className="material-icons">check</span>
                              {t('accept') || 'Принять'}
                            </button>
                            <button
                              className="btn-icon btn-reject"
                              onClick={() => {
                                setUserToReject(user);
                                setShowRejectModal(true);
                              }}
                            >
                              <span className="material-icons">close</span>
                              {t('reject') || 'Отклонить'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Исходящие запросы */}
                {outgoingRequests.length > 0 && (
                  <div className="outgoing-requests">
                    <h3 className="subsection-title">{t('outgoingRequests') || 'Исходящие запросы'} ({outgoingRequests.length})</h3>
                    <div className="users-list">
                      {outgoingRequests.map(user => (
                        <div key={user.id} className="user-card-list">
                          <div className="user-card-left" onClick={() => handleViewProfile(user.id)}>
                            <div className="user-avatar">{user.avatar_emoji || '🌱'}</div>
                            <div className="user-info">
                              <span className="user-name">{user.nickname}</span>
                              <span className="user-separator">•</span>
                              <span className="user-level">{translateEcoLevel(user.eco_level, currentLanguage)}</span>
                              {user.mutual_friends_count > 0 && (
                                <>
                                  <span className="user-separator">•</span>
                                  <span className="mutual-friends">
                                    {user.mutual_friends_count} {t('mutualFriends') || 'общих друзей'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="user-card-right">
                            <button
                              className="btn-icon btn-cancel"
                              onClick={() => handleCancelRequest(user.id)}
                            >
                              <span className="material-icons">cancel</span>
                              {t('cancelRequest') || 'Отменить запрос'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Рекомендации (показываем только если нет поиска) */}
            {!searchQuery && displayedRecommendations.length > 0 && (
              <div className="recommendations-section">
                <h2 className="section-title">
                  <span className="material-icons">recommend</span>
                  {t('recommendations') || 'Рекомендации'}
                </h2>
                <p className="section-subtitle">{t('recommendationsDesc') || 'Люди с общими друзьями'}</p>
                <div className="users-list">
                  {displayedRecommendations.map(user => renderUserCard(user, false))}
                </div>
              </div>
            )}

            {/* Если нет рекомендаций */}
            {!searchQuery && recommendations.length === 0 && friends.length > 0 && (
              <div className="empty-state small">
                <span className="material-icons">recommend</span>
                <h3>{t('noRecommendations') || 'Нет рекомендаций'}</h3>
                <p>{t('noRecommendationsDesc') || 'Пока нет пользователей с общими друзьями'}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальное окно удаления */}
      {showDeleteModal && (
        <>
          <div className="friends-page-modal-overlay" onClick={() => setShowDeleteModal(false)}></div>
          <div className="friends-page-modal-content">
            <div className="friends-page-modal-header">
              <h2>{t('confirmRemoveFriend') || 'Удалить из друзей'}?</h2>
              <button className="friends-page-modal-close" onClick={() => setShowDeleteModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="friends-page-modal-body">
              <p>{t('confirmRemoveFriendMessage') || 'Вы уверены, что хотите удалить'} <strong>{userToDelete?.nickname}</strong> {t('fromFriends') || 'из друзей'}?</p>
            </div>
            <div className="friends-page-modal-footer">
              <button className="friends-page-modal-btn secondary" onClick={() => setShowDeleteModal(false)}>
                {t('cancel') || 'Отмена'}
              </button>
              <button className="friends-page-modal-btn danger" onClick={confirmRemoveFriend}>
                {t('removeFriend') || 'Удалить'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Модальное окно принятия запроса */}
      {showAcceptModal && (
        <>
          <div className="friends-page-modal-overlay" onClick={() => setShowAcceptModal(false)}></div>
          <div className="friends-page-modal-content">
            <div className="friends-page-modal-header">
              <h2>{t('confirmAcceptRequest') || 'Принять запрос в друзья'}?</h2>
              <button className="friends-page-modal-close" onClick={() => setShowAcceptModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="friends-page-modal-body">
              <p>{t('confirmAcceptRequestMessage') || 'Вы уверены, что хотите добавить'} <strong>{userToAccept?.nickname}</strong> {t('toFriends') || 'в друзья'}?</p>
            </div>
            <div className="friends-page-modal-footer">
              <button className="friends-page-modal-btn secondary" onClick={() => setShowAcceptModal(false)}>
                {t('cancel') || 'Отмена'}
              </button>
              <button className="friends-page-modal-btn success" onClick={() => handleAcceptRequest(userToAccept.id)}>
                {t('accept') || 'Принять'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Модальное окно отклонения запроса */}
      {showRejectModal && (
        <>
          <div className="friends-page-modal-overlay" onClick={() => setShowRejectModal(false)}></div>
          <div className="friends-page-modal-content">
            <div className="friends-page-modal-header">
              <h2>{t('confirmRejectRequest') || 'Отклонить запрос в друзья'}?</h2>
              <button className="friends-page-modal-close" onClick={() => setShowRejectModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="friends-page-modal-body">
              <p>{t('confirmRejectRequestMessage') || 'Вы уверены, что хотите отклонить запрос от'} <strong>{userToReject?.nickname}</strong>?</p>
            </div>
            <div className="friends-page-modal-footer">
              <button className="friends-page-modal-btn secondary" onClick={() => setShowRejectModal(false)}>
                {t('cancel') || 'Отмена'}
              </button>
              <button className="friends-page-modal-btn danger" onClick={() => handleRejectRequest(userToReject.id)}>
                {t('reject') || 'Отклонить'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FriendsPage;
