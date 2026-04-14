import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentUser } from '../utils/authUtils';
import { translateStoryContent, detectTextLanguage } from '../utils/translations';
import '../styles/pages/NotificationsPage.css';

const NotificationsPage = () => {
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Ref для отслеживания инициализации
  const isFirstRender = useRef(true);
  const isInitialized = useRef(false);
  
  const [notifications, setNotifications] = useState([]);
  const [translatedNotifications, setTranslatedNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [filter, setFilter] = useState(() => {
    const filterParam = searchParams.get('filter');
    console.log('🔍 NotificationsPage: Initial filter from URL:', filterParam);
    return filterParam || 'all';
  }); // all, unread, read
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      // Не редиректим, просто показываем пустую страницу
      setLoading(false);
      return;
    }
    loadNotifications();
    
    // Помечаем что инициализация завершена
    setTimeout(() => {
      isInitialized.current = true;
      console.log('✅ NotificationsPage: Initialization complete');
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Загружаем только при монтировании компонента
  
  // Слушаем события от NotificationBell
  useEffect(() => {
    const handleNotificationReadFromBell = (event) => {
      const { notificationId } = event.detail;
      console.log('📨 NotificationsPage: Получено событие notificationRead от колокольчика:', notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setTranslatedNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    };

    const handleNotificationsReadAllFromBell = () => {
      console.log('📨 NotificationsPage: Получено событие notificationsReadAll от колокольчика');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setTranslatedNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    window.addEventListener('notificationRead', handleNotificationReadFromBell);
    window.addEventListener('notificationsReadAll', handleNotificationsReadAllFromBell);

    return () => {
      window.removeEventListener('notificationRead', handleNotificationReadFromBell);
      window.removeEventListener('notificationsReadAll', handleNotificationsReadAllFromBell);
    };
  }, []);
  
  // Синхронизация состояния с URL
  useEffect(() => {
    if (isFirstRender.current) {
      console.log('⏭️ NotificationsPage: First render, skipping URL sync');
      isFirstRender.current = false;
      return;
    }
    
    if (!isInitialized.current) {
      console.log('⏳ NotificationsPage: Still initializing, skipping URL sync');
      return;
    }
    
    const params = {};
    if (filter !== 'all') params.filter = filter;
    
    console.log('📝 NotificationsPage: Updating URL params:', params);
    setSearchParams(params, { replace: true });
  }, [filter, setSearchParams]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications/${currentUser.id}?limit=100`);
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      
      // Также обновляем переведенные уведомления
      setTranslatedNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      
      // Отправляем событие для обновления колокольчика
      window.dispatchEvent(new CustomEvent('notificationRead', { 
        detail: { notificationId } 
      }));
    } catch (error) {
      console.error('Ошибка отметки уведомления:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/notifications/${currentUser.id}/read-all`, {
        method: 'PATCH'
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setTranslatedNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      
      // Отправляем событие для обновления колокольчика
      window.dispatchEvent(new CustomEvent('notificationsReadAll'));
    } catch (error) {
      console.error('Ошибка отметки всех уведомлений:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Отправляем событие для синхронизации с NotificationBell
      window.dispatchEvent(new CustomEvent('notificationDeleted', { 
        detail: { notificationId } 
      }));
    } catch (error) {
      console.error('Ошибка удаления уведомления:', error);
    }
  };

  // Функция определения языка текста
  const detectLanguage = (text) => {
    return detectTextLanguage(text);
  };

  // Перевод уведомлений при изменении языка с кэшированием
  useEffect(() => {
    const translateNotifications = async () => {
      if (notifications.length === 0) {
        setTranslatedNotifications([]);
        return;
      }

      setTranslating(true);
      
      try {
        const targetLang = currentLanguage.toLowerCase();
        
        // Проверяем доступность API (тихо, без предупреждений)
        if (!('Translator' in self)) {
          // API недоступен, используем оригинальные уведомления
          setTranslatedNotifications(notifications);
          setTranslating(false);
          return;
        }
        
        const translated = await Promise.all(
          notifications.map(async (notification) => {
            try {
              // Создаем ключ для кэша
              const cacheKey = `notification_translation_${notification.id}_${currentLanguage}`;
              
              // Проверяем кэш
              const cached = sessionStorage.getItem(cacheKey);
              if (cached) {
                try {
                  const cachedData = JSON.parse(cached);
                  // Проверяем, что кэш актуален (контент не изменился)
                  if (cachedData.originalTitle === notification.title && 
                      cachedData.originalMessage === notification.message) {
                    return {
                      ...notification,
                      title: cachedData.translatedTitle,
                      message: cachedData.translatedMessage
                    };
                  }
                } catch (e) {
                  console.warn('Ошибка чтения кэша уведомления:', e);
                }
              }
              
              const titleLang = detectLanguage(notification.title);
              const messageLang = detectLanguage(notification.message);
              
              let translatedTitle = notification.title;
              let translatedMessage = notification.message;
              
              if (titleLang !== targetLang) {
                translatedTitle = await translateStoryContent(notification.title, currentLanguage, titleLang);
              }
              
              if (messageLang !== targetLang) {
                translatedMessage = await translateStoryContent(notification.message, currentLanguage, messageLang);
              }
              
              // Сохраняем в кэш
              try {
                sessionStorage.setItem(cacheKey, JSON.stringify({
                  originalTitle: notification.title,
                  originalMessage: notification.message,
                  translatedTitle: translatedTitle,
                  translatedMessage: translatedMessage
                }));
              } catch (e) {
                console.warn('Ошибка сохранения в кэш уведомления:', e);
              }
              
              return {
                ...notification,
                title: translatedTitle,
                message: translatedMessage
              };
            } catch (error) {
              return notification;
            }
          })
        );
        
        setTranslatedNotifications(translated);
      } catch (error) {
        console.error('❌ Ошибка перевода уведомлений:', error);
        setTranslatedNotifications(notifications);
      } finally {
        setTranslating(false);
      }
    };

    translateNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length, currentLanguage]);

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
    
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  const handleNavigate = (notification) => {
    if (notification.link) {
      navigate(notification.link);
    }
    setShowDetailModal(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return t('justNow') || 'Только что';
    if (minutes < 60) return `${minutes} ${t('minutesAgo') || 'мин назад'}`;
    if (hours < 24) return `${hours} ${t('hoursAgo') || 'ч назад'}`;
    if (days < 7) return `${days} ${t('daysAgo') || 'д назад'}`;
    
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'report_response': return 'feedback';
      case 'new_report': return 'report';
      case 'friend_request': return 'person_add';
      case 'achievement': return 'emoji_events';
      case 'achievement_unlocked': return 'emoji_events';
      case 'story_approved': return 'check_circle';
      case 'story_rejected': return 'cancel';
      case 'eco_tip': return 'eco';
      case 'system': return 'info';
      case 'team_member_joined': return 'group_add';
      default: return 'notifications';
    }
  };

  const filteredNotifications = (translatedNotifications.length > 0 ? translatedNotifications : notifications).filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Используем переведенные уведомления для отображения
  const displayNotifications = translatedNotifications.length > 0 ? translatedNotifications : notifications;

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        {!currentUser ? (
          <div className="empty-state">
            <span className="material-icons">login</span>
            <h3>{t('authRequired') || 'Требуется авторизация'}</h3>
            <p>{t('loginToViewNotifications') || 'Войдите в систему, чтобы просматривать уведомления'}</p>
          </div>
        ) : (
          <>
            <div className="notifications-header">
              <div className="header-left">
                <h1>{t('notifications') || 'Уведомления'}</h1>
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
              </div>
              <div className="header-actions">
                {unreadCount > 0 && (
                  <button className="btn-mark-all" onClick={markAllAsRead}>
                    <span className="material-icons">done_all</span>
                    {t('markAllRead') || 'Отметить все'}
                  </button>
                )}
              </div>
            </div>

        <div className="notifications-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('allNotifications') || 'Все'} ({displayNotifications.length})
          </button>
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            {t('unread') || 'Непрочитанные'} ({unreadCount})
          </button>
          <button
            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            {t('read') || 'Прочитанные'} ({displayNotifications.length - unreadCount})
          </button>
        </div>

        <div className="notifications-list">
          {loading || translating ? (
            <div className="loading-state">
              <span className="material-icons spinning">refresh</span>
              <p>{translating ? (t('translating') || 'Перевод...') : (t('loading') || 'Загрузка...')}</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <span className="material-icons">notifications_none</span>
              <h3>{t('noNotifications') || 'Нет уведомлений'}</h3>
              <p>{t('noNotificationsDesc') || 'Здесь будут отображаться ваши уведомления'}</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
                data-type={notification.type}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  <span className="material-icons">{getNotificationIcon(notification.type)}</span>
                </div>
                <div className="notification-content">
                  <h3>{notification.title}</h3>
                  <p>{notification.message}</p>
                </div>
                <span className="notification-time">{formatTime(notification.created_at)}</span>
                <button
                  className="notification-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  title={t('deleteNotification') || 'Удалить уведомление'}
                  aria-label={t('deleteNotification') || 'Удалить уведомление'}
                >
                  <span className="material-icons">delete</span>
                </button>
              </div>
            ))
          )}
        </div>

            {/* Модальное окно с деталями уведомления */}
            {showDetailModal && selectedNotification && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content notification-detail-modal" data-type={selectedNotification.type} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="notification-icon-large">
                <span className="material-icons">{getNotificationIcon(selectedNotification.type)}</span>
              </div>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <h2>{selectedNotification.title}</h2>
              <p className="notification-message">{selectedNotification.message}</p>
              <div className="notification-meta">
                <span className="notification-time-full">
                  {new Date(selectedNotification.created_at).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDetailModal(false)}
              >
                {t('close') || 'Закрыть'}
              </button>
              {selectedNotification.link && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleNavigate(selectedNotification)}
                >
                  <span className="material-icons">arrow_forward</span>
                  {t('goToPage') || 'Перейти'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
