import { Link, useLocation } from 'react-router-dom'
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

const Sidebar = ({ isExpanded, setIsExpanded }) => {
  const location = useLocation()

  const menuItems = [
    { id: 'pet', label: 'Питомец', path: '/pet', icon: petIcon },
    { id: 'teams', label: 'Команды', path: '/teams', icon: teamIcon },
    { id: 'messages', label: 'Сообщения', path: '/messages', icon: messageIcon },
    { id: 'friends', label: 'Друзья', path: '/friends', icon: friendsIcon },
    { id: 'notifications', label: 'Уведомления', path: '/notifications', icon: notificationIcon },
    { id: 'achievements', label: 'Достижения', path: '/achievements', icon: achievementsIcon },
    { id: 'statistics', label: 'Статистика', path: '/statistics', icon: statisticIcon },
    { id: 'leaderboard', label: 'Рейтинг', path: '/leaderboard', icon: leaderboardIcon },
    { id: 'contribution', label: 'Вклад', path: '/contribution', icon: contributionIcon },
    { id: 'reviews', label: 'Отзывы', path: '/reviews', icon: reviewsIcon },
    { id: 'profile', label: 'Профиль', path: '/profile', icon: profileIcon },
    { id: 'settings', label: 'Настройки', path: '/settings', icon: settingsIcon },
  ]

  return (
    <aside 
      className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="sidebar-content">
        {/* Логотип */}
        <Link to="/feed" className="sidebar-logo">
          <img src={logoIcon} alt="EcoSteps" className="logo-icon-svg" />
          {isExpanded && <span className="logo-text">EcoSteps</span>}
        </Link>

        {/* Меню */}
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <Link
              key={item.id}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <img src={item.icon} alt={item.label} className="sidebar-icon-svg" />
              {isExpanded && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Режим эко-отпуск */}
        <div className="sidebar-footer">
          <button className="sidebar-item eco-vacation">
            <img src={vacationIcon} alt="Эко-отпуск" className="sidebar-icon-svg" />
            {isExpanded && <span className="sidebar-label">Эко-отпуск</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
