import { useState, useEffect } from 'react'
import '../styles/components/NotificationSystem.css'

const NotificationSystem = ({ isVisible, onClose }) => {
  const [notifications, setNotifications] = useState([])
  const [settings, setSettings] = useState({
    ecoTips: true,
    notifications: true
  })

  useEffect(() => {
    // Загружаем настройки уведомлений с сервера (если есть токен) или локально
    loadNotificationSettings()

    // Загружаем ожидающие уведомления из localStorage
    loadPendingNotifications()

    // Проверяем, нужно ли показать совет дня
    if (isVisible) {
      checkDailyTip()
    }
    
    // Устанавливаем интервал для проверки новых уведомлений
    const interval = setInterval(checkDailyTip, 60000)

    // Слушаем события storage для синхронизации между вкладками
    const handleStorageChange = (e) => {
      if (e.key === 'appSettings') {
        const newSettings = JSON.parse(e.newValue || '{}')
        setSettings({
          ecoTips: newSettings.ecoTips ?? true,
          notifications: newSettings.notifications ?? true
        })
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [isVisible])

  const loadNotificationSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      
      if (token) {
        // Пытаемся загрузить серверные настройки
        const response = await fetch('/api/user-settings', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.settings) {
            setSettings({
              ecoTips: data.settings.ecoTips ?? true,
              notifications: data.settings.notifications ?? true
            })
            return
          }
        }
      }
      
      // Fallback на локальные настройки
      const savedSettings = localStorage.getItem('appSettings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({
          ecoTips: parsed.ecoTips ?? true,
          notifications: parsed.notifications ?? true
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек уведомлений:', error)
      // Используем локальные настройки при ошибке
      const savedSettings = localStorage.getItem('appSettings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({
          ecoTips: parsed.ecoTips ?? true,
          notifications: parsed.notifications ?? true
        })
      }
    }
  }

  const loadPendingNotifications = () => {
    const pending = localStorage.getItem('pendingNotifications')
    if (pending) {
      try {
        const pendingNotifications = JSON.parse(pending)
        pendingNotifications.forEach(notification => {
          showNotification({
            title: notification.title,
            body: notification.body,
            type: notification.type
          })
        })
        // Очищаем после загрузки
        localStorage.removeItem('pendingNotifications')
      } catch (error) {
        console.error('Ошибка загрузки ожидающих уведомлений:', error)
      }
    }
  }

  const checkDailyTip = async () => {
    if (!settings.ecoTips) return

    try {
      const response = await fetch('/api/eco-tips/daily')
      if (response.ok) {
        const tip = await response.json()
        showEcoTipNotification(tip)
        
        // Обновляем дату последнего совета
        const today = new Date().toDateString()
        localStorage.setItem('lastEcoTipDate', today)
      }
    } catch (error) {
      console.error('Ошибка загрузки совета дня:', error)
      // Показываем уведомление об ошибке
      showNotification({
        title: 'Ошибка',
        body: 'Не удалось загрузить эко-совет. Проверьте подключение к интернету.',
        type: 'error'
      })
    }
  }

  const showEcoTipNotification = (tip) => {
    const notification = {
      id: `eco-tip-${Date.now()}`,
      type: 'eco-tip',
      title: 'Эко-совет дня',
      content: tip,
      timestamp: new Date(),
      autoHide: false
    }

    setNotifications(prev => [notification, ...prev])

    // Показываем браузерное уведомление если разрешено
    if (Notification.permission === 'granted') {
      new Notification('Новый эко-совет!', {
        body: tip.title,
        icon: '/favicon.ico',
        tag: 'eco-tip'
      })
    }
  }

  const showNotification = (notification) => {
    const newNotification = {
      id: `notification-${Date.now()}`,
      type: 'general',
      timestamp: new Date(),
      autoHide: true,
      ...notification
    }

    setNotifications(prev => [newNotification, ...prev])

    if (newNotification.autoHide) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 5000)
    }
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
    if (onClose) onClose()
  }

  const requestNotificationPermission = async () => {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }

  // Экспортируем функцию для использования в других компонентах
  useEffect(() => {
    window.showNotification = showNotification
    window.requestNotificationPermission = requestNotificationPermission
    
    return () => {
      window.showNotification = null
      window.requestNotificationPermission = null
    }
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <div className="notification-system">
      <div className="notification-header">
        <h3>
          <span className="material-icons">notifications</span>
          Уведомления
        </h3>
        <div className="notification-actions">
          <button 
            className="clear-all-btn"
            onClick={clearAllNotifications}
            title="Очистить все"
          >
            <span className="material-icons">delete_sweep</span>
          </button>
          <button 
            className="close-btn"
            onClick={onClose}
            title="Скрыть"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <div className="empty-icon">
              <span className="material-icons" style={{ fontSize: '3rem', opacity: 0.5 }}>inbox</span>
            </div>
            <p>Нет новых уведомлений</p>
            <button 
              className="check-tips-btn"
              onClick={() => checkDailyTip()}
            >
              <span className="material-icons">eco</span>
              Проверить эко-совет дня
            </button>
          </div>
        ) : (
          notifications.map(notification => (
            <div key={notification.id} className={`notification-item ${notification.type}`}>
              <div className="notification-content">
                {notification.type === 'eco-tip' ? (
                  <div className="eco-tip-notification">
                    <div className="notification-title">{notification.title}</div>
                    <div className="eco-tip-content">
                      {notification.content}
                    </div>
                  </div>
                ) : (
                  <div className="general-notification">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-body">{notification.body}</div>
                  </div>
                )}
                
                <div className="notification-meta">
                  <span className="notification-time">
                    {notification.timestamp.toLocaleTimeString('ru-RU', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>

              <button 
                className="remove-notification-btn"
                onClick={() => removeNotification(notification.id)}
                title="Удалить уведомление"
              >
                <span className="material-icons">close</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default NotificationSystem