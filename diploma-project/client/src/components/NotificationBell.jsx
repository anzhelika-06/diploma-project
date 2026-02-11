import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useUser } from '../contexts/UserContext';
import { useLanguage } from '../contexts/LanguageContext';
import { translateStoryContent, detectTextLanguage } from '../utils/translations';
import '../styles/components/NotificationBell.css';

const NotificationBell = () => {
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const { currentUser } = useUser(); // Используем контекст пользователя
  const { socket, isConnected } = useSocket(); // Используем глобальный socket
  
  const [notifications, setNotifications] = useState([]);
  const [translatedNotifications, setTranslatedNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Загрузка уведомлений
  const loadNotifications = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications/${currentUser.id}?limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    } finally {
      setLoading(false);
    }
  };

  // Функция определения языка текста
  const detectLanguage = (text) => {
    return detectTextLanguage(text);
  };

  // Перевод уведомлений при изменении языка
  useEffect(() => {
    const translateNotifications = async () => {
      if (notifications.length === 0) {
        setTranslatedNotifications([]);
        return;
      }
      
      try {
        const targetLang = currentLanguage.toLowerCase();
        
        // Проверяем доступность API (тихо, без предупреждений)
        if (!('Translator' in self)) {
          setTranslatedNotifications(notifications);
          return;
        }
        
        const translated = await Promise.all(
          notifications.map(async (notification) => {
            try {
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
        console.error('Ошибка перевода уведомлений:', error);
        setTranslatedNotifications(notifications);
      }
    };

    translateNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length, currentLanguage]);

  // WebSocket обработчики
  useEffect(() => {
    if (!socket || !currentUser) return;

    console.log('🔔 NotificationBell: Подключение обработчиков к глобальному socket');

    // Слушаем новые уведомления
    socket.on('notification:new', (data) => {
      console.log('🔔 NotificationBell: Получено событие notification:new');
      console.log('   Данные:', data);
      console.log('   Тип данных:', typeof data);
      console.log('   Ключи:', Object.keys(data));
      console.log('   currentUser.id:', currentUser.id);
      
      // Поддерживаем два формата:
      // 1. { userId, notification } - из profile.js
      // 2. notification - из notificationHelper.js
      let notification;
      
      if (data.notification) {
        console.log('   Формат: { userId, notification }');
        // Формат { userId, notification }
        // Проверяем, что уведомление предназначено для текущего пользователя
        if (data.userId && data.userId !== currentUser.id) {
          console.log(`🔔 Уведомление не для текущего пользователя (data.userId: ${data.userId}, currentUser.id: ${currentUser.id}), игнорируем`);
          return;
        }
        notification = data.notification;
      } else if (data.user_id) {
        console.log('   Формат: notification с user_id');
        // Формат notification с полем user_id
        // Проверяем, что уведомление предназначено для текущего пользователя
        if (data.user_id !== currentUser.id) {
          console.log(`🔔 Уведомление не для текущего пользователя (data.user_id: ${data.user_id}, currentUser.id: ${currentUser.id}), игнорируем`);
          return;
        }
        notification = data;
      } else {
        console.log('   Формат: notification (без userId)');
        // Формат просто notification (из notificationHelper через комнату)
        // Если уведомление пришло в комнату user:X, значит оно для этого пользователя
        notification = data;
      }
      
      console.log('   Финальное уведомление:', notification);
      console.log('   Тип уведомления:', notification.type);
      
      setNotifications(prev => {
        const updated = [notification, ...prev].slice(0, 10);
        console.log('   Обновленный список уведомлений:', updated.length);
        return updated;
      });
      setUnreadCount(prev => {
        const newCount = prev + 1;
        console.log('   Новый счетчик непрочитанных:', newCount);
        return newCount;
      });
      
      // Показываем браузерное уведомление если разрешено
      if (Notification.permission === 'granted') {
        console.log('   Показываем браузерное уведомление');
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
    });

    // Слушаем обновление счетчика
    socket.on('notification:unread-count', (data) => {
      console.log('🔔 Обновление счетчика непрочитанных:', data.count);
      setUnreadCount(data.count);
    });

    // Загружаем уведомления при монтировании
    loadNotifications();
    
    // Слушаем событие удаления уведомления из NotificationsPage
    const handleNotificationDeleted = (event) => {
      const { notificationId } = event.detail;
      
      // Используем функциональное обновление чтобы получить актуальное состояние
      setNotifications(prev => {
        // Находим удаляемое уведомление чтобы проверить было ли оно непрочитанным
        const deletedNotification = prev.find(n => n.id === notificationId);
        
        // Уменьшаем счетчик только если уведомление было непрочитанным
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        
        // Возвращаем отфильтрованный список
        return prev.filter(n => n.id !== notificationId);
      });
    };
    
    window.addEventListener('notificationDeleted', handleNotificationDeleted);

    return () => {
      console.log('🔔 NotificationBell: Отключение обработчиков');
      socket.off('notification:new');
      socket.off('notification:unread-count');
      window.removeEventListener('notificationDeleted', handleNotificationDeleted);
    };
  }, [socket, currentUser]); // Переподключаем обработчики при смене socket

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Запрос разрешения на браузерные уведомления
  useEffect(() => {
    if (currentUser && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []); // Запрашиваем только один раз при монтировании

  // Слушаем события от страницы уведомлений
  useEffect(() => {
    const handleNotificationRead = (event) => {
      const { notificationId } = event.detail;
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setTranslatedNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleNotificationsReadAll = () => {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setTranslatedNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    };

    window.addEventListener('notificationRead', handleNotificationRead);
    window.addEventListener('notificationsReadAll', handleNotificationsReadAll);

    return () => {
      window.removeEventListener('notificationRead', handleNotificationRead);
      window.removeEventListener('notificationsReadAll', handleNotificationsReadAll);
    };
  }, []);

  // Отметить уведомление как прочитанное
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
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Ошибка отметки уведомления:', error);
    }
  };

  // Отметить все как прочитанные
  const markAllAsRead = async () => {
    if (!currentUser) return;
    
    try {
      await fetch(`/api/notifications/${currentUser.id}/read-all`, {
        method: 'PATCH'
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setTranslatedNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Ошибка отметки всех уведомлений:', error);
    }
  };

  // Обработка клика по уведомлению
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  // Удалить уведомление
  const deleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Уменьшаем счетчик если уведомление было непрочитанным
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Ошибка удаления уведомления:', error);
    }
  };

  // Форматирование времени
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

  // Иконка в зависимости от типа уведомления
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'report_response':
        return 'feedback';
      case 'new_report':
        return 'report';
      case 'friend_request':
        return 'person_add';
      case 'achievement':
        return 'emoji_events';
      case 'story_approved':
        return 'check_circle';
      case 'story_rejected':
        return 'cancel';
      case 'eco_tip':
        return 'eco';
      case 'system':
        return 'info';
      default:
        return 'notifications';
    }
  };

  if (!currentUser) return null;

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-button"
        onClick={() => {
          setIsOpen(!isOpen);
          // Обновляем уведомления при открытии
          if (!isOpen) {
            loadNotifications();
          }
        }}
        aria-label={t('notifications') || 'Уведомления'}
      >
        <span className="material-icons">notifications</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>{t('notifications') || 'Уведомления'}</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={markAllAsRead}
                aria-label={t('markAllRead') || 'Отметить все'}
                title={t('markAllRead') || 'Отметить все как прочитанные'}
              >
                <span className="material-icons">done_all</span>
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">
                <span className="material-icons spinning">refresh</span>
                <p>{t('loading') || 'Загрузка...'}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="material-icons">notifications_none</span>
                <p>{t('noNotifications') || 'Нет уведомлений'}</p>
              </div>
            ) : (
              (translatedNotifications.length > 0 ? translatedNotifications : notifications).map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  data-type={notification.type}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    <span className="material-icons">{getNotificationIcon(notification.type)}</span>
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <span className="notification-time">{formatTime(notification.created_at)}</span>
                  </div>
                  <button
                    className="notification-delete"
                    onClick={(e) => deleteNotification(notification.id, e)}
                    title={t('deleteNotification') || 'Удалить уведомление'}
                    aria-label={t('deleteNotification') || 'Удалить уведомление'}
                  >
                    <span className="material-icons">close</span>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="notification-footer">
            <button
              className="view-all-btn"
              onClick={() => {
                navigate('/notifications');
                setIsOpen(false);
              }}
            >
              {t('viewAll') || 'Посмотреть все'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
