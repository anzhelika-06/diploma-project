import { useState, useEffect } from 'react'
import '../styles/pages/AchievementsPage.css'
import { useLanguage } from '../contexts/LanguageContext'
import { translateStoryContent } from '../utils/translations'
import ecoinsImage from '../assets/images/ecoins.png'
import { useEventTracker } from '../hooks/useEventTracker'

const AchievementsPage = () => {
  const { currentLanguage, t } = useLanguage()
  const { trackEvent } = useEventTracker()
  
  // Константы для фильтрации - выносим в область компонента
  const HIDDEN_EVENT_TYPES = [
    'story_created', 
    'story_shared',
    'new_user'
  ];
  
  const [activeTab, setActiveTab] = useState('all')
  const [ecoCoins, setEcoCoins] = useState(0)
  const [allAchievements, setAllAchievements] = useState([])
  const [translatedAchievements, setTranslatedAchievements] = useState([])
  const [userAchievements, setUserAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState(null)
  
  // Статистика - только 3 блока
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    percentage: 0
  })
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1)
  const achievementsPerPage = 10 // Можно изменить на 5
  
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [selectedAchievement, setSelectedAchievement] = useState(null)
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const userStr = localStorage.getItem('user')
        if (!userStr) {
          setError(t('userNotFound'))
          setLoading(false)
          return
        }
        
        const user = JSON.parse(userStr)
        if (!user?.id) {
          setError(t('userNotFound'))
          setLoading(false)
          return
        }
        
        // Отслеживаем просмотр страницы достижений
        trackEvent('achievements_page_viewed', {
          userId: user.id,
          timestamp: new Date().toISOString()
        })
        
        const achievementsRes = await fetch('/api/achievements')
        if (!achievementsRes.ok) throw new Error(`HTTP ${achievementsRes.status}`)
        const achievementsData = await achievementsRes.json()
        
        if (!achievementsData.success) {
          throw new Error(achievementsData.error || t('loadError'))
        }
        
        const achievements = achievementsData.achievements || []
        // Фильтруем достижения, скрываем категории типа "story_created"
        const filteredAchievements = achievements.filter(ach => {
          // Используем HIDDEN_EVENT_TYPES из области компонента
          if (ach.event_type && HIDDEN_EVENT_TYPES.includes(ach.event_type)) {
            return false
          }
          
          // Скрываем достижения с категорией "new"
          if (ach.category === 'new') {
            return false
          }
          
          return true
        })
        
        setAllAchievements(filteredAchievements)
        
        const userRes = await fetch(`/api/achievements/user/${user.id}`)
        if (!userRes.ok) throw new Error(`HTTP ${userRes.status}`)
        const userData = await userRes.json()
        
        if (!userData.success) {
          throw new Error(userData.error || t('loadUserError'))
        }
        
        // Фильтруем user achievements - используем HIDDEN_EVENT_TYPES
        const filteredUserAchievements = (userData.achievements || []).filter(ua => {
          const achievement = achievements.find(a => a.id === ua.id)
          return achievement && !HIDDEN_EVENT_TYPES.includes(achievement.event_type)
        })
        
        setUserAchievements(filteredUserAchievements)
        setEcoCoins(userData.ecoCoins || 0)
        
        // Расчет статистики (только 3 показателя)
        const totalAchievements = filteredAchievements.length
        const completedAchievements = filteredUserAchievements.filter(ach => ach.completed).length
        
        // Расчет процента завершения
        const percentage = totalAchievements > 0 
          ? Math.round((completedAchievements / totalAchievements) * 100) 
          : 0
        
        setStats({
          total: totalAchievements,
          completed: completedAchievements,
          percentage: percentage
        })
        
        // Проверяем наличие недавно разблокированных достижений
        const recentlyUnlocked = filteredUserAchievements.filter(ach => 
          ach.completed && !ach.claimed_at && 
          ach.completed_at && 
          (new Date() - new Date(ach.completed_at)) < 24 * 60 * 60 * 1000 // В течение 24 часов
        ) || []
        
        if (recentlyUnlocked.length > 0) {
          // Показываем уведомление о новых достижениях
          recentlyUnlocked.forEach(achievement => {
            showAchievementNotification(achievement)
          })
        }
        
      } catch (err) {
        console.error('Ошибка загрузки данных:', err)
        setError(t('loadError'))
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [t, trackEvent])

  // Функция для показа уведомления о новом достижении
  const showAchievementNotification = (achievement) => {
    const notificationEvent = new CustomEvent('showNotification', {
      detail: {
        type: 'achievement',
        title: t('newAchievement'),
        message: `${achievement.name} - ${achievement.description}`,
        icon: achievement.icon,
        points: achievement.points,
        duration: 5000
      }
    })
    window.dispatchEvent(notificationEvent)
  }

  // Функция для определения языка текста
  const detectLanguage = (text) => {
    if (!text) return 'ru'
    
    const latinChars = (text.match(/[a-zA-Z]/g) || []).length
    const cyrillicChars = (text.match(/[а-яёА-ЯЁ]/g) || []).length
    const belarusianChars = (text.match(/[ўЎіІ]/g) || []).length
    
    const totalLetters = latinChars + cyrillicChars + belarusianChars
    
    let detectedLang = 'ru'
    
    if (belarusianChars > 0) {
      detectedLang = 'by'
    } else if (totalLetters > 0 && (latinChars / totalLetters) > 0.5) {
      detectedLang = 'en'
    } else if (totalLetters > 0 && (cyrillicChars / totalLetters) > 0.5) {
      detectedLang = 'ru'
    } else if (latinChars > 0 && cyrillicChars === 0) {
      detectedLang = 'en'
    }
    
    return detectedLang
  }

  // Перевод достижений при изменении языка или загрузке новых данных
  useEffect(() => {
    const translateAchievements = async () => {
      if (allAchievements.length === 0) {
        setTranslatedAchievements([])
        return
      }

      if (!('Translator' in self)) {
        console.warn('Chrome Translator API не поддерживается')
        setTranslatedAchievements(allAchievements)
        return
      }

      console.log('🔄 Начинаем перевод достижений:', {
        achievementsCount: allAchievements.length,
        currentLanguage,
        firstAchievement: allAchievements[0]?.name
      })

      setTranslating(true)
      
      try {
        const translated = await Promise.all(
          allAchievements.map(async (achievement) => {
            try {
              const nameLanguage = detectLanguage(achievement.name)
              const descLanguage = detectLanguage(achievement.description)
              const targetLang = currentLanguage.toLowerCase()
              
              let translatedName = achievement.name
              let translatedDescription = achievement.description
              
              // Переводим название если нужно
              if (nameLanguage !== targetLang) {
                try {
                  translatedName = await translateStoryContent(achievement.name, currentLanguage, nameLanguage)
                } catch (error) {
                  console.error(`❌ ОШИБКА ПЕРЕВОДА НАЗВАНИЯ:`, error)
                  translatedName = achievement.name
                }
              }
              
              // Переводим описание если нужно
              if (descLanguage !== targetLang) {
                try {
                  translatedDescription = await translateStoryContent(achievement.description, currentLanguage, descLanguage)
                } catch (error) {
                  console.error(`❌ Ошибка перевода описания:`, error)
                  translatedDescription = achievement.description
                }
              }
              
              return {
                ...achievement,
                name: translatedName,
                description: translatedDescription
              }
            } catch (error) {
              console.warn(`❌ Ошибка перевода достижения ${achievement.id}:`, error)
              return achievement
            }
          })
        )
        
        console.log('✅ Перевод достижений завершен')
        
        setTranslatedAchievements(translated)
      } catch (error) {
        console.error('❌ Критическая ошибка перевода:', error)
        setTranslatedAchievements(allAchievements)
      } finally {
        setTranslating(false)
      }
    }

    translateAchievements()
  }, [currentLanguage, allAchievements])

  const getAchievementsWithProgress = () => {
    const achievementsToUse = translating ? allAchievements : translatedAchievements
    
    return achievementsToUse.map(achievement => {
      const userAchievement = userAchievements.find(ua => ua.id === achievement.id)
      
      return {
        ...achievement,
        progress: userAchievement?.progress || 0,
        current_value: userAchievement?.current_value || 0,
        completed: userAchievement?.completed || false,
        completed_at: userAchievement?.completed_at || null,
        claimed_at: userAchievement?.claimed_at || null,
        claimed: !!userAchievement?.claimed_at,
        started_at: userAchievement?.started_at || null
      }
    })
  }

  const getCurrentAchievements = () => {
    const achievementsWithProgress = getAchievementsWithProgress()
    
    if (activeTab === 'my') {
      return achievementsWithProgress.filter(a => a.progress > 0)
    } else {
      return achievementsWithProgress
    }
  }

  // Фильтруем и сортируем достижения для текущей страницы
  const getPaginatedAchievements = () => {
    let allFiltered = getCurrentAchievements()
    
    // СОРТИРОВКА: незабранные награды вверху, затем завершенные, затем остальные
    allFiltered.sort((a, b) => {
      // Сначала проверяем, можно ли забрать награду (completed и не claimed)
      const aCanClaim = a.completed && !a.claimed
      const bCanClaim = b.completed && !b.claimed
      
      if (aCanClaim && !bCanClaim) return -1
      if (!aCanClaim && bCanClaim) return 1
      
      // Затем сортируем по завершенности
      if (a.completed && !b.completed) return -1
      if (!a.completed && b.completed) return 1
      
      // Затем сортируем по прогрессу (больший прогресс выше)
      if (a.progress > b.progress) return -1
      if (a.progress < b.progress) return 1
      
      // И наконец по ID или названию
      return a.id - b.id
    })
    
    // Вычисляем индексы для пагинации
    const indexOfLastAchievement = currentPage * achievementsPerPage
    const indexOfFirstAchievement = indexOfLastAchievement - achievementsPerPage
    const currentAchievements = allFiltered.slice(indexOfFirstAchievement, indexOfLastAchievement)
    
    return {
      achievements: currentAchievements,
      totalPages: Math.ceil(allFiltered.length / achievementsPerPage),
      totalAchievements: allFiltered.length
    }
  }

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#6b7280'
      case 'rare': return '#3b82f6'
      case 'epic': return '#8b5cf6'
      case 'legendary': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getProgressPercentage = (progress, requirement) => {
    if (requirement === 0) return 0
    return Math.min(Math.round((progress / requirement) * 100), 100)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1) // Сбрасываем на первую страницу при смене таба
    
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      trackEvent('achievements_tab_changed', {
        userId: user.id,
        tab: tab,
        timestamp: new Date().toISOString()
      })
    }
  }

  const handleClaimClick = (achievement) => {
    setSelectedAchievement(achievement)
    setShowClaimModal(true)
    
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      trackEvent('achievement_claim_clicked', {
        userId: user.id,
        achievementId: achievement.id,
        achievementName: achievement.name,
        points: achievement.points
      })
    }
  }

  const handleCloseModal = () => {
    setShowClaimModal(false)
    setSelectedAchievement(null)
    setClaiming(false)
  }

  const handleConfirmClaim = async () => {
    if (!selectedAchievement || claiming) return
    
    try {
      setClaiming(true)
      
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        alert(t('userNotFound'))
        handleCloseModal()
        return
      }
      
      const user = JSON.parse(userStr)
      
      const response = await fetch('/api/achievements/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id, 
          achievementId: selectedAchievement.id 
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Обновляем состояние
        const updatedUserAchievements = userAchievements.map(ua => 
          ua.id === selectedAchievement.id 
            ? { ...ua, claimed_at: new Date().toISOString() }
            : ua
        )
        setUserAchievements(updatedUserAchievements)
        setEcoCoins(result.ecoCoins)
        
        // Обновляем статистику - увеличиваем счетчик выполненных
        setStats(prev => ({
          ...prev,
          completed: prev.completed + 1,
          // Пересчитываем процент
          percentage: prev.total > 0 ? Math.round(((prev.completed + 1) / prev.total) * 100) : 0
        }))
        
        // Отслеживаем событие
        trackEvent('achievement_reward_claimed', {
          userId: user.id,
          achievementId: selectedAchievement.id,
          achievementName: selectedAchievement.name,
          points: selectedAchievement.points,
          newBalance: result.ecoCoins
        })
        
        // Показываем уведомление об успехе
        const notificationEvent = new CustomEvent('showNotification', {
          detail: {
            type: 'success',
            title: t('rewardClaimed'),
            message: `${t('youReceived')} +${selectedAchievement.points} ${t('ecoCoins')}!`,
            icon: '💰',
            duration: 3000
          }
        })
        window.dispatchEvent(notificationEvent)
        
      } else {
        console.error(t('claimError'), result.error)
        alert(result.message || t('claimError'))
      }
    } catch (err) {
      console.error('Ошибка получения награды:', err)
      alert(t('claimError'))
    } finally {
      handleCloseModal()
    }
  }

  const canClaimReward = (achievement) => {
    return achievement.completed && !achievement.claimed
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString(currentLanguage === 'ru' ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Функции пагинации - НОВАЯ ПАГИНАЦИЯ
  const goToNextPage = () => {
    const { totalPages } = getPaginatedAchievements()
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const goToPage = (pageNumber) => {
    const { totalPages } = getPaginatedAchievements()
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  // Функция для генерации кнопок пагинации
  const renderPaginationButtons = () => {
    const { totalPages } = getPaginatedAchievements()
    const buttons = []
    
    if (totalPages <= 1) return null
    
    // Кнопка "Назад"
    buttons.push(
      <button
        key="prev"
        className="achievements-pagination-button"
        onClick={goToPrevPage}
        disabled={currentPage === 1}
      >
        <span className="material-icons">chevron_left</span>
      </button>
    )
    
    // Первая страница
    buttons.push(
      <button
        key="1"
        className={`achievements-pagination-button ${currentPage === 1 ? 'active' : ''}`}
        onClick={() => goToPage(1)}
      >
        1
      </button>
    )
    
    // Многоточие если нужно
    if (currentPage > 3) {
      buttons.push(
        <span key="ellipsis-start" className="achievements-pagination-ellipsis">
          ...
        </span>
      )
    }
    
    // Средние страницы
    const startPage = Math.max(2, currentPage - 1)
    const endPage = Math.min(totalPages - 1, currentPage + 1)
    
    for (let i = startPage; i <= endPage; i++) {
      if (i > 1 && i < totalPages) {
        buttons.push(
          <button
            key={i}
            className={`achievements-pagination-button ${currentPage === i ? 'active' : ''}`}
            onClick={() => goToPage(i)}
          >
            {i}
          </button>
        )
      }
    }
    
    // Многоточие если нужно
    if (currentPage < totalPages - 2) {
      buttons.push(
        <span key="ellipsis-end" className="achievements-pagination-ellipsis">
          ...
        </span>
      )
    }
    
    // Последняя страница (если не первая)
    if (totalPages > 1) {
      buttons.push(
        <button
          key={totalPages}
          className={`achievements-pagination-button ${currentPage === totalPages ? 'active' : ''}`}
          onClick={() => goToPage(totalPages)}
        >
          {totalPages}
        </button>
      )
    }
    
    // Кнопка "Вперед"
    buttons.push(
      <button
        key="next"
        className="achievements-pagination-button"
        onClick={goToNextPage}
        disabled={currentPage === totalPages}
      >
        <span className="material-icons">chevron_right</span>
      </button>
    )
    
    return buttons
  }

  if (loading) {
    return (
      <div className="achievements-page">
        <div className="achievements-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="achievements-page">
        <div className="achievements-container">
          <div className="error-state">
            <div className="error-icon">!</div>
            <p>{error}</p>
            <button 
              className="retry-btn" 
              onClick={() => window.location.reload()}
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { achievements, totalPages, totalAchievements } = getPaginatedAchievements()
  const { total, completed, percentage } = stats

  return (
    <div className="achievements-page">
      <div className="achievements-container">
        <div className="achievements-header">
          <h1 className="achievements-title">{t('titleAch')}</h1>
          <div className="eco-coins-balance">
            <img 
              src={ecoinsImage} 
              alt="Экоины" 
              className="eco-coins-icon"
            />
            <span className="eco-coins-amount">{ecoCoins}</span>
            <span className="eco-coins-label">{t('ecoCoins')}</span>
          </div>
        </div>

        {/* БЛОК СТАТИСТИКИ - ТОЛЬКО 3 БЛОКА В НОВОМ ПОРЯДКЕ БЕЗ ПРОГРЕСС-БАРА */}
        <div className="achievements-stats">
          <div className="stat-card">
            <div className="stat-value">{total}</div>
            <div className="stat-label">{t('allAchievements')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{completed}</div>
            <div className="stat-label">{t('completed')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{percentage}%</div>
            <div className="stat-label">{t('progress')}</div>
          </div>
        </div>

        <div className="achievements-tabs-container">
          <div className="achievements-tabs">
            <button 
              className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
              onClick={() => handleTabChange('my')}
            >
              <span className="tab-label">{t('myAchievements')}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              <span className="tab-label">{t('allAchievements')}</span>
            </button>
          </div>
        </div>

        <div className="achievements-list">
          {translating ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>{t('achievementsTranslating') || 'Переводим достижения...'}</p>
            </div>
          ) : achievements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏆</div>
              <h3>{t('noAchievements')}</h3>
              <p>{activeTab === 'my' ? t('noMyAchievementsHint') : t('noAchievementsHint')}</p>
            </div>
          ) : (
            <>
              {achievements.map(achievement => {
                const progressPercentage = getProgressPercentage(
                  achievement.progress,
                  achievement.requirement_value
                )
                const isCompleted = achievement.completed
                const isClaimed = achievement.claimed
                const canClaim = canClaimReward(achievement)
                
                return (
                  <div 
                    key={achievement.id} 
                    className={`achievement-card ${isCompleted ? 'completed' : ''} ${canClaim ? 'unclaimed' : ''} ${achievement.rarity}`}
                    style={{ borderLeftColor: getRarityColor(achievement.rarity) }}
                  >
                    {canClaim && (
                      <div className="achievement-unclaimed-badge">
                        <span className="unclaimed-badge-text">{t('claimReward')}</span>
                        <span className="material-icons">redeem</span>
                      </div>
                    )}
                    
                    <div className="achievement-header">
                      <div className="achievement-icon">
                        <span style={{ fontSize: '28px' }}>{achievement.icon}</span>
                      </div>
                      <div className="achievement-info">
                        <h3 className="achievement-name">{achievement.name}</h3>
                        <p className="achievement-description">{achievement.description}</p>
                      </div>
                      <div className="achievement-points">
                        <span className="points-value">+{achievement.points}</span>
                      </div>
                    </div>

                    <div className="achievement-progress">
                      <div className="progress-info">
                        <span className="progress-text">
                          {achievement.progress} / {achievement.requirement_value}
                          {achievement.requirement_type === 'streak' && ' дней'}
                        </span>
                        <span className="progress-percentage">{progressPercentage}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="achievement-footer">
                      <div className="achievement-meta">
                        <span 
                          className="meta-rarity"
                          style={{ color: getRarityColor(achievement.rarity) }}
                        >
                          {t(`${achievement.rarity}`)}
                        </span>
                        {achievement.completed_at && (
                          <span className="meta-date">
                            <span className="material-icons">event</span>
                            {formatDate(achievement.completed_at)}
                          </span>
                        )}
                      </div>
                      
                      <div className="achievement-actions">
                        {canClaim ? (
                          <button 
                            className="claim-btn primary"
                            onClick={() => handleClaimClick(achievement)}
                          >
                            <span className="btn-text">{t('claimReward')}</span>
                            <span className="material-icons">redeem</span>
                          </button>
                        ) : isClaimed ? (
                          <span className="claimed-badge">
                            <span className="badge-text">{t('claimed')}</span>
                            <span className="material-icons">check_circle</span>
                          </span>
                        ) : !isCompleted ? (
                          <span className="progress-badge">
                            <span className="badge-text">{t('inProgress')}</span>
                            <span className="material-icons">trending_up</span>
                          </span>
                        ) : (
                          <span className="completed-badge">
                            <span className="badge-text">{t('completed')}</span>
                            <span className="material-icons">emoji_events</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

            {/* ПАГИНАЦИЯ - НОВАЯ ВЕРСИЯ */}
        {totalPages > 1 && (
          <div className="achievements-pagination-container">
            <div className="achievements-pagination-info">
              {t('showingAchievements') || 'Показано'} <strong>
                {(currentPage - 1) * achievementsPerPage + 1}-
                {Math.min(currentPage * achievementsPerPage, totalAchievements)}
              </strong> {t('ofTotal') || 'из'} <strong>{totalAchievements}</strong>
            </div>
            <div className="achievements-pagination-buttons">
              {renderPaginationButtons()}
            </div>
          </div>
        )}
      </div>

{/* МОДАЛЬНОЕ ОКНО С НОВЫМ ДИЗАЙНОМ */}
{showClaimModal && selectedAchievement && (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h2 className="modal-title">
          {t('confirmClaim')}
        </h2>
        <button 
          className="modal-close-btn"
          onClick={handleCloseModal}
          disabled={claiming}
        >
          <span className="material-icons">close</span>
        </button>
      </div>
      
      <div className="modal-body">
        <div className="achievement-preview">
          <div className="preview-icon">
            <span style={{ fontSize: '40px' }}>{selectedAchievement.icon}</span>
          </div>
          <div className="preview-info">
            <h3 className="preview-name">{selectedAchievement.name}</h3>
            <p className="preview-description">{selectedAchievement.description}</p>
          </div>
        </div>
        
        {/* БЛОК НАГРАДЫ С ТЕКСТОМ СЛЕВА И ЗНАЧЕНИЕМ СПРАВА */}
        <div className="reward-section-inline">
          <div className="reward-inline-container">
            <div className="reward-text-left">
              <span className="reward-label-inline">
                {t('youWillReceive')}
              </span>
            </div>
            <div className="reward-value-right">
              <span className="reward-plus-inline">+</span>
              <span className="reward-number-inline">{selectedAchievement.points}</span>
              <img 
                src={ecoinsImage} 
                alt="Экоины" 
                className="reward-icon-inline"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="modal-footer">
        <button 
          className="modal-btn cancel-btn"
          onClick={handleCloseModal}
          disabled={claiming}
        >
          {t('cancel')}
        </button>
        <button 
          className="modal-btn confirm-btn"
          onClick={handleConfirmClaim}
          disabled={claiming}
        >
          {claiming ? (
            <>
              <div className="claim-spinner-minimal"></div>
              <span>{t('processing')}</span>
            </>
          ) : (
            <>
              <span className="material-icons" style={{ marginRight: '8px', fontSize: '18px' }}>redeem</span>
              {t('getReward')}
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}
 
export default AchievementsPage