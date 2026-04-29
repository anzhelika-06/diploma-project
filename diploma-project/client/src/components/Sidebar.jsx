import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
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
import { getUserInfo, isUserAdmin } from '../utils/authUtils';
import adminIcon from '../assets/icons/admin.svg'

const adminIconSrc = adminIcon || settingsIcon

const Sidebar = ({ isExpanded, setIsExpanded }) => {
  const location = useLocation()
  const { t } = useLanguage()
  const [currentTheme, setCurrentTheme] = useState('light')
  const [isAdmin, setIsAdmin] = useState(false)

  // Vacation modal state
  const [showVacationModal, setShowVacationModal] = useState(false)
  const [vacationLoading, setVacationLoading] = useState(false)
  const [vacationMsg, setVacationMsg] = useState(null) // { text, type }
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
        // can't vacation if already fed today or already frozen or limit reached
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
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setCurrentTheme(settings.theme || 'light')
    }

    const updateUserData = () => {
      setIsAdmin(isUserAdmin())
    }
    updateUserData()

    const handleStorageChange = () => {
      const savedSettings = localStorage.getItem('appSettings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        setCurrentTheme(prevTheme => {
          const newTheme = settings.theme || 'light'
          return newTheme !== prevTheme ? newTheme : prevTheme
        })
      }
      updateUserData()
    }

    window.addEventListener('storage', handleStorageChange)
    const interval = setInterval(handleStorageChange, 5000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Основные пункты меню
  const mainMenuItems = [
    { id: 'pet', label: t('menuPet'), path: '/pet', icon: petIcon },
    { id: 'teams', label: t('menuTeams'), path: '/teams', icon: teamIcon },
    { id: 'messages', label: t('menuMessages'), path: '/messages', icon: messageIcon },
    { id: 'friends', label: t('menuFriends'), path: '/friends', icon: friendsIcon },
    { id: 'achievements', label: t('menuAchievements'), path: '/achievements', icon: achievementsIcon },
    { id: 'statistics', label: t('menuStatistics'), path: '/statistics', icon: statisticIcon },
    { id: 'leaderboard', label: t('menuLeaderboard'), path: '/leaderboard', icon: leaderboardIcon },
    { id: 'contribution', label: t('menuContribution'), path: '/contribution', icon: contributionIcon },
    { id: 'reviews', label: t('menuReviews'), path: '/reviews', icon: reviewsIcon },
    { id: 'profile', label: t('menuProfile'), path: '/profile', icon: profileIcon },
    { id: 'settings', label: t('menuSettings'), path: '/settings', icon: settingsIcon },
  ]

  // Добавляем вкладку "Управление" только для админа
  const adminMenuItem = isAdmin ? [
    { id: 'admin', label: t('menuAdmin') || 'Управление', path: '/admin', icon: adminIconSrc }
  ] : []

  // Объединяем все пункты меню
  const allMenuItems = [...mainMenuItems, ...adminMenuItem]

  // Десктопная версия
  return (
    <>
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
          <button className="sidebar-item eco-vacation" onClick={handleOpenVacation}>
            <img src={vacationIcon} alt={t('menuEcoVacation')} className="sidebar-icon-svg" />
            {isExpanded && <span className="sidebar-label">{t('menuEcoVacation')}</span>}
          </button>
        </div>
      </div>
    </aside>

    {/* Vacation Modal — rendered outside aside so it's not clipped */}
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
                  <li>{t('petVacationRule5')}</li>
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

export default Sidebar