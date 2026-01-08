import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/pages/AboutPage.css'
import homeIcon from '../assets/images/home.png'
import { getEmojiByCode, getEmojiByCarbon } from '../utils/emojiMapper'
import { 
  translateCategory, 
  translateEcoLevel, 
  translateContent
} from '../utils/translations'

const AboutPage = ({ translations, currentLanguage }) => {
  const [activeTab, setActiveTab] = useState('about') // about, stories, ratings
  const [storiesFilter, setStoriesFilter] = useState('all') // all, best, recent
  const [selectedCategory, setSelectedCategory] = useState('all') // all, или конкретная категория
  const [ratingsTab, setRatingsTab] = useState('users') // users, teams
  const [stories, setStories] = useState([])
  const [categories, setCategories] = useState([])
  const [userRatings, setUserRatings] = useState([])
  const [teamRatings, setTeamRatings] = useState([])
  const [loading, setLoading] = useState(false)
  const [likedStories, setLikedStories] = useState(new Set()) // Отслеживаем лайкнутые истории
  const [stats, setStats] = useState({
    activeUsers: 0,
    co2Saved: 0,
    ecoTeams: 0,
    successStories: 0
  })

  // Загрузка историй
  const loadStories = async (filter = 'all', category = 'all') => {
    try {
      setLoading(true)
      // Для демонстрации используем ID первого пользователя
      const response = await fetch(`http://localhost:3001/api/stories?filter=${filter}&userId=1&category=${category}`)
      const data = await response.json()
      
      if (data.success) {
        setStories(data.stories)
        
        // Обновляем состояние лайкнутых историй
        const liked = new Set()
        data.stories.forEach(story => {
          if (story.is_liked) {
            liked.add(story.id)
          }
        })
        setLikedStories(liked)
      }
    } catch (error) {
      console.error('Ошибка загрузки историй:', error)
    } finally {
      setLoading(false)
    }
  }

  // Загрузка категорий
  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/stories/categories')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error)
    }
  }

  // Загрузка рейтингов пользователей
  const loadUserRatings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/rankings/users')
      const data = await response.json()
      
      if (data.success) {
        setUserRatings(data.users)
      }
    } catch (error) {
      console.error('Ошибка загрузки рейтинга пользователей:', error)
    }
  }

  // Загрузка рейтингов команд
  const loadTeamRatings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/rankings/teams')
      const data = await response.json()
      
      if (data.success) {
        setTeamRatings(data.teams)
      }
    } catch (error) {
      console.error('Ошибка загрузки рейтинга команд:', error)
    }
  }

  // Загрузка статистики через API
  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
      // Fallback к статическим значениям при ошибке
      setStats({
        activeUsers: 12,
        co2Saved: 29.4,
        ecoTeams: 5,
        successStories: 12
      })
    }
  }

  // Лайк истории
  const handleLikeStory = async (storyId) => {
    try {
      // Для демонстрации используем ID первого пользователя
      const response = await fetch(`http://localhost:3001/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: 1 })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Обновляем локальное состояние
        setStories(prevStories => 
          prevStories.map(story => 
            story.id === storyId 
              ? { ...story, likes_count: data.likes, is_liked: data.isLiked }
              : story
          )
        )
        
        // Обновляем состояние лайкнутых историй
        setLikedStories(prev => {
          const newSet = new Set(prev)
          if (data.isLiked) {
            newSet.add(storyId)
          } else {
            newSet.delete(storyId)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error('Ошибка при лайке:', error)
    }
  }

  // Загрузка данных при смене фильтра историй или категории
  useEffect(() => {
    if (activeTab === 'stories') {
      loadStories(storiesFilter, selectedCategory)
    }
  }, [activeTab, storiesFilter, selectedCategory])

  // Загрузка категорий при переходе на вкладку историй
  useEffect(() => {
    if (activeTab === 'stories' && categories.length === 0) {
      loadCategories()
    }
  }, [activeTab])

  // Загрузка рейтингов при переходе на вкладку
  useEffect(() => {
    if (activeTab === 'ratings') {
      if (ratingsTab === 'users') {
        loadUserRatings()
      } else {
        loadTeamRatings()
      }
    }
  }, [activeTab, ratingsTab])

  // Перевод данных при смене языка - убираем сложную логику
  useEffect(() => {
    // Данные переводятся динамически при отображении через translateCategory и translateEcoLevel
  }, [currentLanguage])

  // Загрузка статистики при монтировании компонента
  useEffect(() => {
    loadStats()
  }, [])

  return (
    <div className="about-page">
      <div className="about-white-block">
        {/* Ссылка "Главная" */}
        <div className="home-link">
          <Link to="/" className="home-link-content">
            <img src={homeIcon} alt={translations.homeAlt} className="home-icon" />
            <span className="home-text">{translations.homeText}</span>
          </Link>
        </div>

        {/* Заголовок страницы */}
        <div className="about-header">
          <h1 className="about-title">{translations.aboutPageTitle}</h1>
          <p className="about-subtitle">{translations.aboutPageSubtitle}</p>
        </div>

        {/* Навигация по табам */}
        <div className="about-tabs">
          <button 
            className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            {translations.aboutTabAbout}
          </button>
          <button 
            className={`tab-button ${activeTab === 'stories' ? 'active' : ''}`}
            onClick={() => setActiveTab('stories')}
          >
            {translations.aboutTabStories}
          </button>
          <button 
            className={`tab-button ${activeTab === 'ratings' ? 'active' : ''}`}
            onClick={() => setActiveTab('ratings')}
          >
            {translations.aboutTabRatings}
          </button>
        </div>

        {/* Контент табов */}
        <div className="about-content">
          {activeTab === 'about' && (
            <div className="about-info">
              <div className="info-section">
                <h2>{translations.aboutMissionTitle}</h2>
                <p>
                  {translations.aboutMissionText}
                </p>
              </div>
              
              <div className="info-section">
                <h2>{translations.aboutWhatWeOfferTitle}</h2>
                <div className="features-grid">
                  <div className="feature-card">
                    <div className="feature-icon">📊</div>
                    <h3>{translations.aboutFeatureCalculator}</h3>
                    <p>{translations.aboutFeatureCalculatorDesc}</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">👥</div>
                    <h3>{translations.aboutFeatureCommunity}</h3>
                    <p>{translations.aboutFeatureCommunityDesc}</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">🏆</div>
                    <h3>{translations.aboutFeatureRatings}</h3>
                    <p>{translations.aboutFeatureRatingsDesc}</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">📖</div>
                    <h3>{translations.aboutFeatureStories}</h3>
                    <p>{translations.aboutFeatureStoriesDesc}</p>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h2>{translations.aboutAchievementsTitle}</h2>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number">{stats.activeUsers.toLocaleString()}</div>
                    <div className="stat-label">{translations.aboutActiveUsers}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.co2Saved}т</div>
                    <div className="stat-label">{translations.aboutCO2Saved}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.ecoTeams}</div>
                    <div className="stat-label">{translations.aboutEcoTeams}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.successStories.toLocaleString()}</div>
                    <div className="stat-label">{translations.aboutSuccessStories}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stories' && (
            <div className="stories-section">
              <div className="stories-filters">
                <button 
                  className={`filter-button ${storiesFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStoriesFilter('all')}
                >
                  {translations.aboutStoriesAll}
                </button>
                <button 
                  className={`filter-button ${storiesFilter === 'best' ? 'active' : ''}`}
                  onClick={() => setStoriesFilter('best')}
                >
                  {translations.aboutStoriesBest}
                </button>
                <button 
                  className={`filter-button ${storiesFilter === 'recent' ? 'active' : ''}`}
                  onClick={() => setStoriesFilter('recent')}
                >
                  {translations.aboutStoriesRecent}
                </button>
              </div>

              {/* Анимированный островок с категориями */}
              <div className="categories-island animated-border">
                <span className="categories-label">{translations.aboutCategoriesLabel}</span>
                <div className="categories-buttons">
                  <button 
                    className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    {translations.aboutCategoriesAll}
                  </button>
                  {categories.map(category => (
                    <button 
                      key={category.category}
                      className={`category-chip ${selectedCategory === category.category ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(category.category)}
                    >
                      {translateCategory(category.category, currentLanguage)}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="loading">
                  {translations.aboutStoriesLoading}
                </div>
              ) : (
                <div className="stories-grid">
                  {stories.map(story => (
                    <div key={story.id} className="story-card">
                      <div className="story-header">
                        <div className="story-user">{getEmojiByCode(story.user_avatar)} {story.user_nickname}</div>
                        <div className="story-category">{translateCategory(story.category, currentLanguage)}</div>
                        <div className="story-date">{new Date(story.created_at).toLocaleDateString('ru-RU')}</div>
                      </div>
                      <h3 className="story-title">{story.title}</h3>
                      <p className="story-content">{story.content}</p>
                      <div className="story-footer">
                        <div className="carbon-saved">
                          🌱 {translations.aboutCarbonSaved} {story.carbon_saved} {translations.kgCO2}
                        </div>
                        <div className="story-likes">
                          <button 
                            className={`like-button ${likedStories.has(story.id) ? 'liked' : ''}`}
                            onClick={() => handleLikeStory(story.id)}
                          >
                            <span className="heart-icon">❤️</span> {story.likes_count}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ratings' && (
            <div className="ratings-section">
              <div className="ratings-tabs">
                <button 
                  className={`rating-tab ${ratingsTab === 'users' ? 'active' : ''}`}
                  onClick={() => setRatingsTab('users')}
                >
                  {translations.aboutRatingsUsers}
                </button>
                <button 
                  className={`rating-tab ${ratingsTab === 'teams' ? 'active' : ''}`}
                  onClick={() => setRatingsTab('teams')}
                >
                  {translations.aboutRatingsTeams}
                </button>
              </div>

              {ratingsTab === 'users' && (
                <div className="rating-list">
                  <h3>🏆 {translations.aboutTopUsers}</h3>
                  {userRatings.map((user, index) => (
                    <div key={user.id} className="rating-item">
                      <div className="rating-position">#{index + 1}</div>
                      <div className="rating-avatar">{getEmojiByCarbon(user.carbon_saved)}</div>
                      <div className="rating-info">
                        <div className="rating-name">{user.nickname}</div>
                        <div className="rating-level">{translateEcoLevel(user.eco_level, currentLanguage)}</div>
                      </div>
                      <div className="rating-score">
                        {user.carbon_saved} {translations.kgCO2}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {ratingsTab === 'teams' && (
                <div className="rating-list">
                  <h3>🏆 {translations.aboutTopTeams}</h3>
                  {teamRatings.map((team, index) => (
                    <div key={team.id} className="rating-item">
                      <div className="rating-position">#{index + 1}</div>
                      <div className="rating-avatar">{getEmojiByCode(team.avatar_emoji)}</div>
                      <div className="rating-info">
                        <div className="rating-name">{team.name}</div>
                        <div className="rating-level">{team.member_count} {translations.aboutMembersCount}</div>
                      </div>
                      <div className="rating-score">
                        {team.carbon_saved} {translations.kgCO2}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AboutPage