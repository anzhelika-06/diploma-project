import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import '../styles/components/Sidebar.css'
import petIcon from '../assets/icons/pet.svg'
import teamIcon from '../assets/icons/team.svg'
import messageIcon from '../assets/icons/message.svg'
import friendsIcon from '../assets/icons/friends.svg'
import notificationIcon from '../assets/icons/notification.svg'
import createIcon from '../assets/icons/create.svg'
import achievementsIcon from '../assets/icons/achievements.svg'
import statisticIcon from '../assets/icons/statistics.svg'
import leaderboardIcon from '../assets/icons/leaderboard.svg'
import contributionIcon from '../assets/icons/contribution.svg'
import reviewsIcon from '../assets/icons/reviews.svg'
import profileIcon from '../assets/icons/profile.svg'
import settingsIcon from '../assets/icons/settings.svg'
import vacationIcon from '../assets/icons/vacation.svg'
import logoIcon from '../assets/images/logo-icon.png'
import { getUserInfo } from '../utils/authUtils';
import adminIcon from '../assets/icons/admin.svg'

const adminIconSrc = adminIcon || settingsIcon

const Sidebar = ({ isExpanded, setIsExpanded }) => {
  const location = useLocation()
  const { t } = useLanguage()
  const [currentTheme, setCurrentTheme] = useState('light')
  const [user, setUser] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Проверяем размер экрана
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
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
        setCurrentTheme(settings.theme || 'light')
      }
      
      // Обновляем данные пользователя при изменениях
      const updatedUser = getUserInfo()
      if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(user)) {
        setUser(updatedUser)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Проверяем изменения каждую секунду
    const interval = setInterval(handleStorageChange, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('resize', checkMobile)
      clearInterval(interval)
    }
  }, [])

  // Основные пункты меню ДЛЯ ДЕСКТОПА (без уведомлений)
  const mainMenuItems = [
    { id: 'pet', label: t('menuPet'), path: '/pet', icon: petIcon },
    { id: 'teams', label: t('menuTeams'), path: '/teams', icon: teamIcon },
    { id: 'messages', label: t('menuMessages'), path: '/messages', icon: messageIcon },
    { id: 'friends', label: t('menuFriends'), path: '/friends', icon: friendsIcon },
    // Уведомления удалены из десктопного меню
    { id: 'achievements', label: t('menuAchievements'), path: '/achievements', icon: achievementsIcon },
    { id: 'statistics', label: t('menuStatistics'), path: '/statistics', icon: statisticIcon },
    { id: 'leaderboard', label: t('menuLeaderboard'), path: '/leaderboard', icon: leaderboardIcon },
    { id: 'contribution', label: t('menuContribution'), path: '/contribution', icon: contributionIcon },
    { id: 'reviews', label: t('menuReviews'), path: '/reviews', icon: reviewsIcon },
    { id: 'profile', label: t('menuProfile'), path: '/profile', icon: profileIcon },
    { id: 'settings', label: t('menuSettings'), path: '/settings', icon: settingsIcon },
  ]

  // Добавляем вкладку "Управление" только для админа
  const adminMenuItem = user?.isAdmin ? [
    { id: 'admin', label: 'Управление', path: '/admin', icon: adminIconSrc }
  ] : []

  // Объединяем все пункты меню
  const allMenuItems = [...mainMenuItems, ...adminMenuItem]

  // Если мобилка - показываем сайдбар с уведомлениями
  if (isMobile) {
    return (
      <aside 
        className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
        data-theme={currentTheme}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="sidebar-content">
          <Link to="/feed" className="sidebar-logo">
            <img src={logoIcon} alt="EcoSteps" className="logo-icon-svg" />
            {isExpanded && <span className="logo-text">EcoSteps</span>}
          </Link>

          <nav className="sidebar-nav">
            {[
              ...mainMenuItems.slice(0, 4), // pet, teams, messages, friends
              { id: 'notifications', label: t('menuNotifications'), path: '/notifications', icon: notificationIcon }, // Уведомления только в мобилке
              ...mainMenuItems.slice(4), // остальные пункты
              ...adminMenuItem
            ].map(item => (
              <Link
                key={item.id}
                to={item.path}
                className={`sidebar-item ${location.pathname === item.path ? 'active' : ''} ${item.id === 'admin' ? 'admin-item' : ''}`}
              >
                <img src={item.icon} alt={item.label} className="sidebar-icon-svg" />
                {isExpanded && <span className="sidebar-label">{item.label}</span>}
                
                {item.id === 'admin' && isExpanded && (
                  <span className="admin-badge">ADMIN</span>
                )}
              </Link>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="sidebar-item eco-vacation">
              <img src={vacationIcon} alt={t('menuEcoVacation')} className="sidebar-icon-svg" />
              {isExpanded && <span className="sidebar-label">{t('menuEcoVacation')}</span>}
            </button>
          </div>
        </div>
      </aside>
    )
  }

  // Десктопная версия (без уведомлений)
  return (
    <aside 
      className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
      data-theme={currentTheme}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="sidebar-content">
        <Link to="/feed" className="sidebar-logo">
          <img src={logoIcon} alt="EcoSteps" className="logo-icon-svg" />
          {isExpanded && <span className="logo-text">EcoSteps</span>}
        </Link>

        <nav className="sidebar-nav">
          {allMenuItems.map(item => (
            <Link
              key={item.id}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''} ${item.id === 'admin' ? 'admin-item' : ''}`}
            >
              <img src={item.icon} alt={item.label} className="sidebar-icon-svg" />
              {isExpanded && <span className="sidebar-label">{item.label}</span>}
              
              {item.id === 'admin' && isExpanded && (
                <span className="admin-badge">ADMIN</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-item eco-vacation">
            <img src={vacationIcon} alt={t('menuEcoVacation')} className="sidebar-icon-svg" />
            {isExpanded && <span className="sidebar-label">{t('menuEcoVacation')}</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar