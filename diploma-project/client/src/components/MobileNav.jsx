import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import '../styles/components/MobileNav.css'
import homeIcon from '../assets/icons/home.svg'
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
import vacationIcon from '../assets/icons/vacation.svg'
import { getUserInfo } from '../utils/authUtils';
import adminIcon from '../assets/icons/admin.svg';
import { useLanguage } from '../contexts/LanguageContext'

const MobileNav = () => {
  const location = useLocation()
  const { t } = useLanguage()
  const [showMenu, setShowMenu] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('light')
  const [user, setUser] = useState(null)

  // Vacation modal state
  const [showVacationModal, setShowVacationModal] = useState(false)
  const [vacationLoading, setVacationLoading] = useState(false)
  const [vacationMsg, setVacationMsg] = useState(null)
  const [vacationUsed, setVacationUsed] = useState(0)
  const [petFrozen, setPetFrozen] = useState(false)
  const [canVacation, setCanVacation] = useState(true)

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` })

  const loadPetVacationInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/pet', { headers: authHeader() })
      const data = await res.json()
      if (data.success && data.pet) {
        const pet = data.pet
        const currentMonth = new Date().getMonth() + 1
        const used = pet.vacation_month === currentMonth ? (pet.vacation_used_this_month || 0) : 0
        setVacationUsed(used)
        setPetFrozen(!!pet.is_frozen)
        const alreadyFedToday = pet.last_fed_at
          ? new Date(pet.last_fed_at).toDateString() === new Date().toDateString()
          : false
        setCanVacation(!pet.is_frozen && used < 3 && !alreadyFedToday)
      }
    } catch (e) { console.error(e) }
  }, [])

  const handleOpenVacation = () => {
    loadPetVacationInfo()
    setVacationMsg(null)
    setShowMenu(false)
    setShowVacationModal(true)
  }

  const handleVacation = async () => {
    setVacationLoading(true)
    setVacationMsg(null)
    try {
      const res = await fetch('/api/pet/vacation', {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (data.success) {
        setVacationUsed(data.vacation_used)
        setPetFrozen(true)
        setCanVacation(false)
        setVacationMsg({ text: `🏖️ ${t('petVacationSuccess') || 'Эко-отпуск активирован!'} (${t('petVacationLeft') || 'осталось'}: ${data.vacation_left})`, type: 'success' })
        setTimeout(() => setShowVacationModal(false), 2000)
      } else {
        const msgs = {
          vacation_limit_reached: t('petVacationLimit') || 'Лимит отпусков на этот месяц исчерпан (3/3)',
          already_on_vacation: t('petAlreadyOnVacation') || 'Питомец уже на отпуске',
          already_fed_today: t('petAlreadyFed') || 'Питомец уже покормлен сегодня'
        }
        setVacationMsg({ text: msgs[data.error] || data.error, type: 'error' })
      }
    } catch (e) {
      setVacationMsg({ text: t('checkInternetConnection') || 'Ошибка соединения', type: 'error' })
    }
    setVacationLoading(false)
  }

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
    
    // Проверяем изменения каждые 100ms для быстрой реакции
    const interval = setInterval(handleStorageChange, 100)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, []) // Убрали все зависимости, используем функциональные обновления

  const mainNavItems = [
    { id: 'home', path: '/feed', icon: homeIcon },
    { id: 'messages', path: '/messages', icon: messageIcon }, // Заменили statistics на messages
    { id: 'notifications', path: '/notifications', icon: notificationIcon },
    { id: 'profile', path: '/profile', icon: profileIcon },
  ]

  // Базовые пункты меню
  const menuItems = [
    { id: 'pet', label: t('menuPet') || 'Питомец', path: '/pet', icon: petIcon },
    { id: 'teams', label: t('menuTeams') || 'Команды', path: '/teams', icon: teamIcon },
    { id: 'friends', label: t('menuFriends') || 'Друзья', path: '/friends', icon: friendsIcon },
    { id: 'achievements', label: t('menuAchievements') || 'Достижения', path: '/achievements', icon: achievementsIcon },
    { id: 'statistics', label: t('menuStatistics') || 'Статистика', path: '/statistics', icon: statisticIcon },
    { id: 'leaderboard', label: t('menuLeaderboard') || 'Рейтинг', path: '/leaderboard', icon: leaderboardIcon },
    { id: 'contribution', label: t('menuContribution') || 'Вклад', path: '/contribution', icon: contributionIcon },
    { id: 'reviews', label: t('menuReviews') || 'Истории', path: '/reviews', icon: reviewsIcon },
    { id: 'settings', label: t('menuSettings') || 'Настройки', path: '/settings', icon: settingsIcon },
  ]

  // Добавляем админский пункт, если пользователь админ
  const adminMenuItem = user?.isAdmin ? [
    { 
      id: 'admin', 
      label: t('menuAdmin') || 'Управление', 
      path: '/admin', 
      icon: adminIcon,
      isAdmin: true 
    }
  ] : []

  // Объединяем все пункты меню
  const allMenuItems = [
    ...menuItems,
    ...adminMenuItem,
    { id: 'eco-vacation', label: t('menuEcoVacation') || 'Эко-отпуск', icon: vacationIcon, isVacation: true }
  ]

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
          to="/messages"
          className={`mobile-nav-item ${location.pathname === '/messages' ? 'active' : ''}`}
        >
          <img src={messageIcon} alt="messages" className="mobile-nav-icon-svg" />
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
              <h3>{t('menu') || 'Меню'}</h3>
              <button className="mobile-menu-close" onClick={() => setShowMenu(false)}>✕</button>
            </div>
            <div className="mobile-menu-items">
              {allMenuItems.map(item => (
                <Link
                  key={item.id}
                  to={item.isVacation ? '#' : item.path}
                  className={`mobile-menu-item${item.isVacation ? ' eco-vacation' : ''}${!item.isVacation && location.pathname === item.path ? ' active' : ''}`}
                  onClick={e => {
                    if (item.isVacation) { e.preventDefault(); setShowMenu(false); handleOpenVacation(); }
                    else setShowMenu(false);
                  }}
                >
                  <img src={item.icon} alt={item.label} className="mobile-menu-icon-svg" />
                  <span className="mobile-menu-label">{item.label}</span>
                  {item.isAdmin && <span className="mobile-admin-badge">ADMIN</span>}
                  {!item.isVacation && location.pathname === item.path && <div className="mobile-menu-active-indicator" />}
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
                  <span className="mobile-user-name">{user?.name || t('user') || 'Пользователь'}</span>
                  <span className="mobile-user-role">
                    {user?.isAdmin ? (t('administrator') || 'Администратор') : (t('user') || 'Пользователь')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Vacation Modal */}
      {showVacationModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowVacationModal(false)} />
          <div className="modal vacation-modal">
            <div className="modal-header">
              <h3>{t('petVacationTitle')}</h3>
              <button className="modal-close" onClick={() => setShowVacationModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            {vacationMsg?.type === 'success' ? (
              <div className="modal-body vacation-success-body">
                <span className="material-icons vacation-success-icon">check_circle</span>
                <p className="vacation-success-title">{t('petVacationSuccess')}</p>
                <p className="vacation-success-desc">{t('petVacationSuccessDesc')}</p>
                <div className="vacation-counter">
                  {[0,1,2].map(i => (
                    <span key={i} className={`vacation-dot${i < vacationUsed ? ' used' : ''}`} />
                  ))}
                  <span className="vacation-counter-label">{vacationUsed}/3 {t('petVacationUsed')}</span>
                </div>
              </div>
            ) : (
              <>
                <div className="modal-body">
                  <p>{t('petVacationModalDesc')}</p>
                  <ul className="vacation-rules-list">
                    <li>{t('petVacationRule1')}</li>
                    <li>{t('petVacationRule2')}</li>
                    <li>{t('petVacationRule3')}</li>
                    <li>{t('petVacationRule4')}</li>
                  </ul>
                  <div className="vacation-counter">
                    {[0,1,2].map(i => (
                      <span key={i} className={`vacation-dot${i < vacationUsed ? ' used' : ''}`} />
                    ))}
                    <span className="vacation-counter-label">{vacationUsed}/3 {t('petVacationUsed')}</span>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="modal-btn secondary" onClick={() => setShowVacationModal(false)}>
                    {t('cancel')}
                  </button>
                  <button className="modal-btn primary" onClick={handleVacation} disabled={vacationLoading || !canVacation}
                    title={!canVacation ? (petFrozen ? t('petFrozenBadge') : vacationUsed >= 3 ? t('petVacationLimit') : t('petAlreadyFed')) : undefined}>
                    {vacationLoading ? '...' : t('petVacationConfirm')}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  )
}

export default MobileNav