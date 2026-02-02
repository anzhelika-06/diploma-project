import { useState, useEffect } from 'react'
import '../styles/pages/AchievementsPage.css'
import { useLanguage } from '../contexts/LanguageContext'
import { translateStoryContent } from '../utils/translations'
import ecoinsImage from '../assets/images/ecoins.png'

const AchievementsPage = () => {
  const { currentLanguage, t } = useLanguage()
  const [activeTab, setActiveTab] = useState('my')
  const [ecoCoins, setEcoCoins] = useState(0)
  const [allAchievements, setAllAchievements] = useState([])
  const [translatedAchievements, setTranslatedAchievements] = useState([])
  const [userAchievements, setUserAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    totalPoints: 0,
    percentage: 0
  })
  
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
        
        const achievementsRes = await fetch('/api/achievements')
        if (!achievementsRes.ok) throw new Error(`HTTP ${achievementsRes.status}`)
        const achievementsData = await achievementsRes.json()
        
        if (!achievementsData.success) {
          throw new Error(achievementsData.error || t('loadError'))
        }
        
        const achievements = achievementsData.achievements || []
        setAllAchievements(achievements)
        
        const userRes = await fetch(`/api/achievements/user/${user.id}`)
        if (!userRes.ok) throw new Error(`HTTP ${userRes.status}`)
        const userData = await userRes.json()
        
        if (!userData.success) {
          throw new Error(userData.error || t('loadUserError'))
        }
        
        setUserAchievements(userData.achievements || [])
        setEcoCoins(userData.ecoCoins || 0)
        setStats({
          total: userData.achievements?.length || 0,
          completed: userData.stats?.completed || 0,
          totalPoints: userData.stats?.totalPoints || 0,
          percentage: userData.stats?.percentage || 0
        })
        
      } catch (err) {
        console.error('Ошибка загрузки данных:', err)
        setError(t('loadError'))
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [t])

  // Функция для определения языка текста (как в AboutPage)
  const detectLanguage = (text) => {
    if (!text) return 'ru'
    
    // Подсчитываем символы разных алфавитов
    const latinChars = (text.match(/[a-zA-Z]/g) || []).length
    const cyrillicChars = (text.match(/[а-яёА-ЯЁ]/g) || []).length
    const belarusianChars = (text.match(/[ўЎіІ]/g) || []).length
    
    // Общее количество букв
    const totalLetters = latinChars + cyrillicChars + belarusianChars
    
    let detectedLang = 'ru'
    
    // Если есть белорусские символы - белорусский
    if (belarusianChars > 0) {
      detectedLang = 'by'
    }
    // Если латинских символов больше 50% от всех букв - английский
    else if (totalLetters > 0 && (latinChars / totalLetters) > 0.5) {
      detectedLang = 'en'
    }
    // Если кириллических символов больше 50% - русский
    else if (totalLetters > 0 && (cyrillicChars / totalLetters) > 0.5) {
      detectedLang = 'ru'
    }
    // Если только латинские символы и нет кириллицы - английский
    else if (latinChars > 0 && cyrillicChars === 0) {
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
              
              console.log(`📝 Достижение "${achievement.name}":`, {
                nameLanguage,
                descLanguage,
                targetLanguage: currentLanguage,
                needNameTranslation: nameLanguage !== targetLang,
                needDescTranslation: descLanguage !== targetLang
              })
              
              let translatedName = achievement.name
              let translatedDescription = achievement.description
              
              // Переводим название если нужно
              if (nameLanguage !== targetLang) {
                console.log(`🔄 ПЕРЕВОДИМ НАЗВАНИЕ: "${achievement.name}" с ${nameLanguage} на ${targetLang}`)
                try {
                  translatedName = await translateStoryContent(achievement.name, currentLanguage, nameLanguage)
                  console.log(`✅ НАЗВАНИЕ ПЕРЕВЕДЕНО: "${achievement.name}" → "${translatedName}"`)
                } catch (error) {
                  console.error(`❌ ОШИБКА ПЕРЕВОДА НАЗВАНИЯ:`, error)
                  translatedName = achievement.name
                }
              }
              
              // Переводим описание если нужно
              if (descLanguage !== targetLang) {
                console.log(`🔄 Переводим описание с ${descLanguage} на ${targetLang}`)
                try {
                  translatedDescription = await translateStoryContent(achievement.description, currentLanguage, descLanguage)
                  console.log(`✅ Описание переведено`)
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
        
        console.log('✅ Перевод достижений завершен:', {
          originalCount: allAchievements.length,
          translatedCount: translated.length,
          firstTranslatedName: translated[0]?.name
        })
        
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
        completed: userAchievement?.completed || false,
        completed_at: userAchievement?.completed_at || null,
        claimed_at: userAchievement?.claimed_at || null,
        claimed: !!userAchievement?.claimed_at
      }
    })
  }

  const getCurrentAchievements = () => {
    const achievementsWithProgress = getAchievementsWithProgress()
    return activeTab === 'my' 
      ? achievementsWithProgress.filter(a => a.progress > 0)
      : achievementsWithProgress
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

  const handleClaimClick = (achievement) => {
    setSelectedAchievement(achievement)
    setShowClaimModal(true)
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
        const updatedUserAchievements = userAchievements.map(ua => 
          ua.id === selectedAchievement.id 
            ? { ...ua, claimed_at: new Date().toISOString() }
            : ua
        )
        setUserAchievements(updatedUserAchievements)
        setEcoCoins(result.ecoCoins)
        console.log(t('rewardClaimed'))
      } else {
        console.error(t('claimError'), result.error)
      }
    } catch (err) {
      console.error('Ошибка получения награды:', err)
    } finally {
      handleCloseModal()
    }
  }

  const canClaimReward = (achievement) => {
    return achievement.completed && !achievement.claimed
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

  const filteredAchievements = getCurrentAchievements()

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

        <div className="achievements-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">{t('completed')}</div>
            <div className="stat-total">/ {stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalPoints}</div>
            <div className="stat-label">{t('points')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.percentage}%</div>
            <div className="stat-label">{t('progress')}</div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${stats.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="achievements-tabs">
          <button 
            className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            <span className="tab-label">{t('myAchievements')}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span className="tab-label">{t('allAchievements')}</span>
          </button>
        </div>

        <div className="achievements-list">
          {translating ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>{t('achievementsTranslating') || 'Переводим достижения...'}</p>
            </div>
          ) : filteredAchievements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <h3>{t('noAchievements')}</h3>
              <p>{t('noAchievementsHint')}</p>
            </div>
          ) : (
            filteredAchievements.map(achievement => {
              const progressPercentage = getProgressPercentage(
                achievement.progress,
                achievement.requirement_value
              )
              const isCompleted = achievement.completed
              const isClaimed = achievement.claimed
              
              return (
                <div 
                  key={achievement.id} 
                  className={`achievement-card ${isCompleted ? 'completed' : ''} ${achievement.rarity}`}
                  style={{ borderLeftColor: getRarityColor(achievement.rarity) }}
                >
                  <div className="achievement-header">
                    <div className="achievement-icon">
                      <span style={{ fontSize: '28px' }}>{achievement.icon}</span>
                    </div>
                    <div className="achievement-info">
                      <h3 className="achievement-name">{achievement.name}</h3>
                      <p className="achievement-description">{achievement.description}</p>
                    </div>
                    <div className="achievement-points">
                      <img 
                        src={ecoinsImage} 
                        alt="Экоины" 
                        className="points-icon"
                      />
                      <span className="points-value">+{achievement.points}</span>
                    </div>
                  </div>

                  <div className="achievement-progress">
                    <div className="progress-info">
                      <span className="progress-text">
                        {achievement.progress} / {achievement.requirement_value}
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
                    </div>
                    
                    <div className="achievement-actions">
                      {canClaimReward(achievement) ? (
                        <button 
                          className="claim-btn"
                          onClick={() => handleClaimClick(achievement)}
                        >
                          <span className="btn-text">{t('claimReward')}</span>
                        </button>
                      ) : isClaimed ? (
                        <span className="claimed-badge">
                          <span className="badge-text">{t('claimed')}</span>
                        </span>
                      ) : !isCompleted ? (
                        <span className="progress-badge">
                          <span className="badge-text">{t('inProgress')}</span>
                        </span>
                      ) : (
                        <span className="completed-badge">
                          <span className="badge-text">{t('completed')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {showClaimModal && selectedAchievement && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{t('confirmClaim')}</h2>
              <button 
                className="modal-close-btn"
                onClick={handleCloseModal}
                disabled={claiming}
              >
                &times;
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
              
              <div className="reward-info">
                <div className="reward-label">{t('reward')}:</div>
                <div className="reward-amount">
                  <img 
                    src={ecoinsImage} 
                    alt="Экоины" 
                    className="reward-icon"
                  />
                  <span className="reward-value">+{selectedAchievement.points} {t('ecoCoins')}</span>
                </div>
              </div>
              
              <p className="confirmation-text">
                {t('confirmClaimText')}
              </p>
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
                {claiming ? t('processing') : t('claimReward')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AchievementsPage