import { useState, useEffect } from 'react'
import '../styles/components/NotificationButton.css'

const NotificationButton = ({ onClick, hasNotifications = false }) => {
  const [settings, setSettings] = useState({
    notifications: true
  })

  useEffect(() => {
    // Загружаем настройки при монтировании
    loadSettings()

    // Слушаем события storage для синхронизации между вкладками
    const handleStorageChange = (e) => {
      if (e.key === 'appSettings') {
        const newSettings = JSON.parse(e.newValue || '{}')
        setSettings({
          notifications: newSettings.notifications ?? true
        })
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const loadSettings = async () => {
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
          notifications: parsed.notifications ?? true
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек кнопки уведомлений:', error)
      // Используем локальные настройки при ошибке
      const savedSettings = localStorage.getItem('appSettings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({
          notifications: parsed.notifications ?? true
        })
      }
    }
  }

  // Если уведомления отключены, не показываем кнопку
  if (!settings.notifications) {
    return null
  }

  return (
    <button 
      className={`notification-button ${hasNotifications ? 'has-notifications' : ''}`}
      onClick={onClick}
      title="Уведомления"
    >
      <span className="material-icons">
        {hasNotifications ? 'notifications_active' : 'notifications'}
      </span>
      {hasNotifications && <span className="notification-dot"></span>}
    </button>
  )
}

export default NotificationButton