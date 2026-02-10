import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import '../styles/components/MobileNav.css'
import homeIcon from '../assets/icons/home.svg'
import createIcon from '../assets/icons/create.svg'
import notificationIcon from '../assets/icons/notification.svg'
import profileIcon from '../assets/icons/profile.svg'
import petIcon from '../assets/icons/pet.svg'
import teamIcon from '../assets/icons/team.svg'
import messageIcon from '../assets/icons/message.svg'
import friendsIcon from '../assets/icons/friends.svg'
import achievementsIcon from '../assets/icons/achievements.svg'
import statisticIcon from '../assets/icons/statistics.svg'
import leaderboardIcon from '../assets/icons/leaderboard.svg'
import contributionIcon from '../assets/icons/contribution.svg'
import reviewsIcon from '../assets/icons/reviews.svg'
import settingsIcon from '../assets/icons/settings.svg'
import { getUserInfo } from '../utils/authUtils'; // Добавьте эту строку
import adminIcon from '../assets/icons/admin.svg'; // Добавьте эту строку

const MobileNav = () => {
  const location = useLocation()
  const [showMenu, setShowMenu] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('light')
  const [user, setUser] = useState(null) // Добавьте состояние для пользователя

  useEffect(() => {
    // Получаем текущую тему из localStorage
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setCurrentTheme(settings.theme || 'light')
    }

    // Получаем данные пользователя
    const userData = getUserInfo()
    setUser(userData)

    // Слушаем изменения темы и данных пользователя
    const handleStorageChange = () => {
      const savedSettings = localStorage.getItem('appSettings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        setCurrentTheme(prevTheme => {
          const newTheme = settings.theme || 'light'
          return newTheme !== prevTheme ? newTheme : prevTheme
        })
      }
      
      // Обновляем данные пользователя при изменениях
      const updatedUser = getUserInfo()
      setUser(prevUser => {
        const updatedUserStr = JSON.stringify(updatedUser)
        const currentUserStr = JSON.stringify(prevUser)
        return updatedUserStr !== currentUserStr ? updatedUser : prevUser
      })
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Проверяем изменения каждые 5 секунд (вместо каждой секунды)
    const interval = setInterval(handleStorageChange, 5000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, []) // Убрали все зависимости, используем функциональные обновления

  const mainNavItems = [
    { id: 'home', path: '/feed', icon: homeIcon },
    { id: 'create', path: '/create', icon: createIcon },
    { id: 'notifications', path: '/notifications', icon: notificationIcon },
    { id: 'profile', path: '/profile', icon: profileIcon },
  ]

  // Базовые пункты меню
  const menuItems = [
    { id: 'pet', label: 'Питомец', path: '/pet', icon: petIcon },
    { id: 'teams', label: 'Команды', path: '/teams', icon: teamIcon },
    { id: 'messages', label: 'Сообщения', path: '/messages', icon: messageIcon },
    { id: 'friends', label: 'Друзья', path: '/friends', icon: friendsIcon },
    { id: 'achievements', label: 'Достижения', path: '/achievements', icon: achievementsIcon },
    { id: 'statistics', label: 'Статистика', path: '/statistics', icon: statisticIcon },
    { id: 'leaderboard', label: 'Рейтинг', path: '/leaderboard', icon: leaderboardIcon },
    { id: 'contribution', label: 'Вклад', path: '/contribution', icon: contributionIcon },
    { id: 'reviews', label: 'Отзывы', path: '/reviews', icon: reviewsIcon },
    { id: 'settings', label: 'Настройки', path: '/settings', icon: settingsIcon },
  ]

  // Добавляем админский пункт, если пользователь админ
  const adminMenuItem = user?.isAdmin ? [
    { 
      id: 'admin', 
      label: 'Управление', 
      path: '/admin', 
      icon: adminIcon,
      isAdmin: true 
    }
  ] : []

  // Объединяем все пункты меню
  const allMenuItems = [...menuItems, ...adminMenuItem]

  return (
    <>
      <nav className="mobile-nav" data-theme={currentTheme}>
        <Link
          to="/feed"
          className={`mobile-nav-item ${location.pathname === '/feed' ? 'active' : ''}`}
        >
          <img src={homeIcon} alt="home" className="mobile-nav-icon-svg" />
        </Link>
        <Link
          to="/notifications"
          className={`mobile-nav-item ${location.pathname === '/notifications' ? 'active' : ''}`}
        >
          <img src={notificationIcon} alt="notifications" className="mobile-nav-icon-svg" />
        </Link>
        <Link
          to="/create"
          className={`mobile-nav-item ${location.pathname === '/create' ? 'active' : ''}`}
        >
          <img src={createIcon} alt="create" className="mobile-nav-icon-svg" />
        </Link>
        <Link
          to="/profile"
          className={`mobile-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
        >
          <img src={profileIcon} alt="profile" className="mobile-nav-icon-svg" />
        </Link>
        <button 
          className={`mobile-nav-item mobile-menu-btn ${showMenu ? 'active' : ''}`}
          onClick={() => setShowMenu(!showMenu)}
        >
          <span className="mobile-nav-icon">⋯</span>
        </button>
      </nav>

      {showMenu && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setShowMenu(false)} />
          <div className="mobile-menu" data-theme={currentTheme}>
            <div className="mobile-menu-header">
              <h3>Меню</h3>
              <button className="mobile-menu-close" onClick={() => setShowMenu(false)}>✕</button>
            </div>
            <div className="mobile-menu-items">
              {allMenuItems.map(item => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`mobile-menu-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => setShowMenu(false)}
                >
                  <img src={item.icon} alt={item.label} className="mobile-menu-icon-svg" />
                  <span className="mobile-menu-label">{item.label}</span>
                  
                  {/* Бейдж ADMIN для админского пункта */}
                  {item.isAdmin && (
                    <span className="mobile-admin-badge">ADMIN</span>
                  )}
                  
                  {/* Индикатор активного пути */}
                  {location.pathname === item.path && (
                    <div className="mobile-menu-active-indicator" />
                  )}
                </Link>
              ))}
            </div>
            
            {/* Информация о пользователе внизу меню */}
            <div className="mobile-menu-footer">
              <div className="mobile-user-info">
                {user?.avatar && (
                  <img src={user.avatar} alt={user.name} className="mobile-user-avatar" />
                )}
                <div className="mobile-user-details">
                  <span className="mobile-user-name">{user?.name || 'Пользователь'}</span>
                  <span className="mobile-user-role">
                    {user?.isAdmin ? 'Администратор' : 'Пользователь'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default MobileNav