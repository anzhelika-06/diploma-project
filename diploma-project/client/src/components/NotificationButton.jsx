import { useState, useEffect } from 'react'
import '../styles/components/NotificationButton.css'

const NotificationButton = ({ onClick }) => {
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    // Проверяем, есть ли новые уведомления
    checkForNewNotifications()
    
    // Проверяем каждую минуту
    const interval = setInterval(checkForNewNotifications, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const checkForNewNotifications = () => {
    const today = new Date().toDateString()
    const lastTipDate = localStorage.getItem('lastEcoTipDate')
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}')
    
    // Если включены эко-советы и сегодня еще не показывали совет
    if (settings.ecoTips !== false && lastTipDate !== today) {
      setHasNewNotifications(true)
      setNotificationCount(1)
    } else {
      setHasNewNotifications(false)
      setNotificationCount(0)
    }
  }

  const handleClick = () => {
    // Сбрасываем индикатор новых уведомлений при открытии
    setHasNewNotifications(false)
    setNotificationCount(0)
    if (onClick) {
      onClick()
    }
  }

  return (
    <button 
      className={`notification-button ${hasNewNotifications ? 'has-notifications' : ''}`}
      onClick={handleClick}
      title="Уведомления"
    >
      <span className="material-icons notification-icon">notifications</span>
      {notificationCount > 0 && (
        <span className="notification-badge">{notificationCount}</span>
      )}
    </button>
  )
}

export default NotificationButton