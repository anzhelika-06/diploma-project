import { useState, useEffect } from 'react'
import '../styles/pages/AchievementsPage.css'
import { useLanguage } from '../contexts/LanguageContext'
import { translateStoryContent } from '../utils/translations'
import ecoinsImage from '../assets/images/ecoins.png'
import { useEventTracker } from '../hooks/useEventTracker'

const AchievementsPage = () => {
  const { currentLanguage, t } = useLanguage()
  const { trackEvent } = useEventTracker()
  
  const [activeTab, setActiveTab] = useState('all')
  const [ecoCoins, setEcoCoins] = useState(0)
  const [allAchievements, setAllAchievements] = useState([])
  const [visibleAchievements, setVisibleAchievements] = useState([])
  const [translatedAchievements, setTranslatedAchievements] = useState([])
  const [allUserAchievements, setAllUserAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState(null)
  
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    percentage: 0
  })
  
  const [currentPage, setCurrentPage] = useState(1)
  const achievementsPerPage = 10
  
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
        
        const allSystemAchievements = achievementsData.achievements || []
        
        setAllAchievements(allSystemAchievements)
        
        const visibleSystemAchievements = allSystemAchievements.filter(ach => {
          return ach.is_hidden !== true
        })
        
        setVisibleAchievements(visibleSystemAchievements)
        
        const userRes = await fetch(`/api/achievements/user/${user.id}`)
        if (!userRes.ok) throw new Error(`HTTP ${userRes.status}`)
        const userData = await userRes.json()
        
        if (!userData.success) {
          throw new Error(userData.error || t('loadUserError'))
        }
        
        const allUserAchievementsData = userData.achievements || []
        
        setAllUserAchievements(allUserAchievementsData)
        setEcoCoins(userData.ecoCoins || 0)
        
        const totalAll = allSystemAchievements.length
        const completedAll = allUserAchievementsData.filter(ach => ach.completed).length
        const percentageAll = totalAll > 0 
          ? Math.round((completedAll / totalAll) * 100) 
          : 0
        
        setStats({
          total: totalAll,
          completed: completedAll,
          percentage: percentageAll
        })
        
        const recentlyUnlocked = allUserAchievementsData.filter(ach => 
          ach.completed && !ach.claimed_at && 
          ach.completed_at && 
          (new Date() - new Date(ach.completed_at)) < 24 * 60 * 60 * 1000
        ) || []
        
        if (recentlyUnlocked.length > 0) {
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

  useEffect(() => {
    const translateAchievements = async () => {
      if (visibleAchievements.length === 0) {
        setTranslatedAchievements([])
        return
      }

      if (!('Translator' in self)) {
        console.warn('Chrome Translator API не поддерживается')
        setTranslatedAchievements(visibleAchievements)
        return
      }

      setTranslating(true)
      
      try {
        const translated = await Promise.all(
          visibleAchievements.map(async (achievement) => {
            try {
              const nameLanguage = detectLanguage(achievement.name)
              const descLanguage = detectLanguage(achievement.description)
              const targetLang = currentLanguage.toLowerCase()
              
              let translatedName = achievement.name
              let translatedDescription = achievement.description
              
              if (nameLanguage !== targetLang) {
                try {
                  translatedName = await translateStoryContent(achievement.name, currentLanguage, nameLanguage)
                } catch (error) {
                  translatedName = achievement.name
                }
              }
              
              if (descLanguage !== targetLang) {
                try {
                  translatedDescription = await translateStoryContent(achievement.description, currentLanguage, descLanguage)
                } catch (error) {
                  translatedDescription = achievement.description
                }
              }
              
              return {
                ...achievement,
                name: translatedName,
                description: translatedDescription
              }
            } catch (error) {
              return achievement
            }
          })
        )
        
        setTranslatedAchievements(translated)
      } catch (error) {
        setTranslatedAchievements(visibleAchievements)
      } finally {
        setTranslating(false)
      }
    }

    translateAchievements()
  }, [currentLanguage, visibleAchievements])

  const getAchievementsWithProgress = () => {
    let achievementsToShow = []
    
    if (activeTab === 'my') {
      // Вкладка "Мои достижения" - показываем все достижения пользователя
      achievementsToShow = allUserAchievements.map(userAch => {
        const achievementInfo = allAchievements.find(a => a.id === userAch.id)
        
        if (!achievementInfo) {
          return {
            id: userAch.id,
            name: userAch.name || `Достижение #${userAch.id}`,
            description: userAch.description || '',
            icon: userAch.icon || '🏆',
            points: userAch.points || 0,
            requirement_type: userAch.requirement_type || 'count',
            requirement_value: userAch.requirement_value || 1,
            rarity: userAch.rarity || 'common',
            is_hidden: userAch.is_hidden || true,
            progress: userAch.progress || 0,
            current_value: userAch.current_value || 0,
            completed: userAch.completed || false,
            completed_at: userAch.completed_at || null,
            claimed_at: userAch.claimed_at || null,
            claimed: !!userAch.claimed_at,
            started_at: userAch.started_at || null
          }
        }
        
        return {
          ...achievementInfo,
          progress: userAch.progress || 0,
          current_value: userAch.current_value || 0,
          completed: userAch.completed || false,
          completed_at: userAch.completed_at || null,
          claimed_at: userAch.claimed_at || null,
          claimed: !!userAch.claimed_at,
          started_at: userAch.started_at || null
        }
      })
      
      // Показываем только достижения с прогрессом
      achievementsToShow = achievementsToShow.filter(a => a.progress > 0)
      
    } else {
      // Вкладка "Все достижения" - показываем только видимые
      const achievementsToUse = translating ? visibleAchievements : translatedAchievements
      
      achievementsToShow = achievementsToUse.map(achievement => {
        const userAchievement = allUserAchievements.find(ua => ua.id === achievement.id)
        
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
    
    return achievementsToShow
  }

  const getCurrentAchievements = () => {
    return getAchievementsWithProgress()
  }

  const getPaginatedAchievements = () => {
    let allFiltered = getCurrentAchievements()
    
    allFiltered.sort((a, b) => {
      const aCanClaim = a.completed && !a.claimed
      const bCanClaim = b.completed && !b.claimed
      
      if (aCanClaim && !bCanClaim) return -1
      if (!aCanClaim && bCanClaim) return 1
      
      if (a.completed && !b.completed) return -1
      if (!a.completed && b.completed) return 1
      
      const aProgress = a.progress / (a.requirement_value || 1)
      const bProgress = b.progress / (b.requirement_value || 1)
      
      if (aProgress > bProgress) return -1
      if (aProgress < bProgress) return 1
      
      return a.id - b.id
    })
    
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
    setCurrentPage(1)
    
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
        const updatedAllUserAchievements = allUserAchievements.map(ua => 
          ua.id === selectedAchievement.id 
            ? { ...ua, claimed_at: new Date().toISOString() }
            : ua
        )
        
        setAllUserAchievements(updatedAllUserAchievements)
        setEcoCoins(result.ecoCoins)
        
        const updatedCompletedCount = updatedAllUserAchievements.filter(ach => ach.completed).length
        
        setStats(prev => ({
          total: prev.total,
          completed: updatedCompletedCount,
          percentage: prev.total > 0 ? Math.round((updatedCompletedCount / prev.total) * 100) : 0
        }))
        
        trackEvent('achievement_reward_claimed', {
          userId: user.id,
          achievementId: selectedAchievement.id,
          achievementName: selectedAchievement.name,
          points: selectedAchievement.points,
          newBalance: result.ecoCoins
        })
        
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

  const renderPaginationButtons = () => {
    const { totalPages } = getPaginatedAchievements()
    const buttons = []
    
    if (totalPages <= 1) return null
    
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
    
    buttons.push(
      <button
        key="1"
        className={`achievements-pagination-button ${currentPage === 1 ? 'active' : ''}`}
        onClick={() => goToPage(1)}
      >
        1
      </button>
    )
    
    if (currentPage > 3) {
      buttons.push(
        <span key="ellipsis-start" className="achievements-pagination-ellipsis">
          ...
        </span>
      )
    }
    
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
    
    if (currentPage < totalPages - 2) {
      buttons.push(
        <span key="ellipsis-end" className="achievements-pagination-ellipsis">
          ...
        </span>
      )
    }
    
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

  const visibleCompletedCount = allUserAchievements.filter(ua => {
    const achievement = allAchievements.find(a => a.id === ua.id)
    return ua.completed && achievement && achievement.is_hidden !== true
  }).length

  const visibleTotalCount = visibleAchievements.length

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

  const getStatTranslations = () => {
    return {
      allAchievementsLabel: t('allAchievements') || 'All Achievements',
      completedLabel: t('completed') || 'Completed',
      progressLabel: t('progress') || 'Progress',
      visibleHint: t('visibleHint') || 'visible',
      fromAll: t('fromAll') || 'from all',
      visibleAchievements: t('visibleAchievements') || 'visible achievements'
    }
  }

  const translations = getStatTranslations()

  return (
    <div className="achievements-page">
      <div className="achievements-container">
        <div className="achievements-header">
          <h1 className="achievements-title">{t('titleAch')}</h1>
          <div className="eco-coins-balance">
            <img 
              src={ecoinsImage} 
              alt={t('ecoCoins') || 'Eco Coins'} 
              className="eco-coins-icon"
            />
            <span className="eco-coins-amount">{ecoCoins}</span>
            <span className="eco-coins-label">{t('ecoCoins')}</span>
          </div>
        </div>

        <div className="achievements-stats">
          <div className="stat-card">
            <div className="stat-value">{total}</div>
            <div className="stat-label">{translations.allAchievementsLabel}</div>
            <div className="stat-hint">
              ({visibleTotalCount} {translations.visibleHint})
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{completed}</div>
            <div className="stat-label">{translations.completedLabel}</div>
            <div className="stat-hint">
              ({visibleCompletedCount} {translations.visibleHint})
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{percentage}%</div>
            <div className="stat-label">{translations.progressLabel}</div>
            <div className="stat-hint">
              {translations.fromAll} {translations.visibleAchievements.toLowerCase()}
            </div>
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
          {translating && activeTab === 'all' ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>{t('achievementsTranslating') || 'Translating achievements...'}</p>
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
                        <img 
                          src={ecoinsImage} 
                          alt={t('ecoCoins') || 'Eco Coins'} 
                          className="points-icon"
                        />
                      </div>
                    </div>

                    <div className="achievement-progress">
                      <div className="progress-info">
                        <span className="progress-text">
                          {achievement.progress} / {achievement.requirement_value}
                          {achievement.requirement_type === 'streak' && ` ${t('days') || 'days'}`}
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
                          {t(`${achievement.rarity}`) || achievement.rarity}
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

        {totalPages > 1 && (
          <div className="achievements-pagination-container">
            <div className="achievements-pagination-info">
              {t('showingAchievements') || 'Showing'} <strong>
                {(currentPage - 1) * achievementsPerPage + 1}-
                {Math.min(currentPage * achievementsPerPage, totalAchievements)}
              </strong> {t('ofTotal') || 'of'} <strong>{totalAchievements}</strong>
            </div>
            <div className="achievements-pagination-buttons">
              {renderPaginationButtons()}
            </div>
          </div>
        )}
      </div>

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
                      alt={t('ecoCoins') || 'Eco Coins'} 
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