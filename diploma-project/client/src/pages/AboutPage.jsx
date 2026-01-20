import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import '../styles/pages/AboutPage.css'
import homeIcon from '../assets/images/home.png'
import homeIconWhite from '../assets/images/home-white.png'
import { getEmojiByCode, getEmojiByCarbon } from '../utils/emojiMapper'
import { 
  translateCategory, 
  translateEcoLevel, 
  translateStoryContent,
  formatCarbonFootprint
} from '../utils/translations'
import { applyTheme, getSavedTheme } from '../utils/themeManager'

const AboutPage = ({ translations, currentLanguage }) => {
  const [activeTab, setActiveTab] = useState('about') // about, stories, ratings
  const [storiesFilter, setStoriesFilter] = useState('all') // all, best, recent
  const [selectedCategory, setSelectedCategory] = useState('all') // all, или конкретная категория
  const [ratingsTab, setRatingsTab] = useState('users') // users, teams
  const [stories, setStories] = useState([])
  const [translatedStories, setTranslatedStories] = useState([]) // Переведенные истории
  const [currentTheme, setCurrentTheme] = useState('light')
  const [categories, setCategories] = useState([])
  const [userRatings, setUserRatings] = useState([])
  const [teamRatings, setTeamRatings] = useState([])
  const [loading, setLoading] = useState(false)
  const [translating, setTranslating] = useState(false) // Состояние перевода
  const [likedStories, setLikedStories] = useState(new Set()) // Отслеживаем лайкнутые истории
  const [showAuthModal, setShowAuthModal] = useState(false) // Модальное окно авторизации
  const [socket, setSocket] = useState(null) // WebSocket соединение
  const [stats, setStats] = useState({
    activeUsers: 0,
    co2Saved: 0,
    ecoTeams: 0,
    successStories: 0
  })

  // Получить правильную иконку домика в зависимости от темы
  const getHomeIcon = () => {
    return currentTheme === 'dark' ? homeIconWhite : homeIcon
  }

  // Подключение к WebSocket
  useEffect(() => {
    const newSocket = io('http://localhost:3001')
    
    newSocket.on('connect', () => {
      console.log('🔌 WebSocket подключен:', newSocket.id)
      
      // Аутентификация (для демо используем userId: 1)
      // В реальном приложении userId должен браться из контекста авторизации
      newSocket.emit('authenticate', {
        userId: 1,
        nickname: 'DemoUser'
      })
    })
    
    newSocket.on('authenticated', (data) => {
      console.log('✅ Аутентификация успешна:', data)
    })
    
    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket отключен')
    })
    
    // Слушаем обновления лайков
    newSocket.on('story:like:update', (data) => {
      console.log('📡 Получено обновление лайка:', data)
      
      // Обновляем оригинальные истории
      setStories(prevStories => 
        prevStories.map(story => 
          story.id === data.storyId 
            ? { ...story, likes_count: data.likes }
            : story
        )
      )
      
      // Обновляем переведенные истории
      setTranslatedStories(prevTranslated => 
        prevTranslated.map(story => 
          story.id === data.storyId 
            ? { ...story, likes_count: data.likes }
            : story
        )
      )
    })
    
    // Слушаем события онлайн/офлайн пользователей
    newSocket.on('user:online', (data) => {
      console.log('👤 Пользователь онлайн:', data)
    })
    
    newSocket.on('user:offline', (data) => {
      console.log('👋 Пользователь офлайн:', data)
    })
    
    // Слушаем личные сообщения (для будущего функционала)
    newSocket.on('message:received', (data) => {
      console.log('💬 Получено личное сообщение:', data)
      // Здесь можно показать уведомление
    })
    
    setSocket(newSocket)
    
    // Отключаемся при размонтировании компонента
    return () => {
      newSocket.close()
    }
  }, [])

  // Загрузка историй
  const loadStories = async (filter = 'all', category = 'all', page = 1) => {
    try {
      setLoading(true)
      // Для демонстрации используем ID первого пользователя
      const url = `http://localhost:3001/api/stories?filter=${filter}&userId=1&category=${category}&page=${page}&limit=10`
      console.log('🔄 Загружаем истории:', { filter, category, page, url })
      
      const response = await fetch(url, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      
      console.log('📊 Получены истории:', {
        success: data.success,
        count: data.stories?.length,
        firstStory: data.stories?.[0]?.title,
        firstStoryLikes: data.stories?.[0]?.likes_count,
        firstStoryAvatar: data.stories?.[0]?.user_avatar
      })
      
      if (data.success) {
        if (page === 1) {
          setStories(data.stories)
        } else {
          // Добавляем к существующим историям при загрузке следующих страниц
          setStories(prev => [...prev, ...data.stories])
        }
        
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
      console.log('🔄 Загружаем рейтинг пользователей...')
      const response = await fetch(`http://localhost:3001/api/rankings/users`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      
      console.log('📊 Получен рейтинг пользователей:', {
        success: data.success,
        count: data.users?.length,
        firstUser: data.users?.[0]?.nickname,
        firstUserCarbon: data.users?.[0]?.carbon_saved,
        firstUserAvatar: data.users?.[0]?.avatar_emoji
      })
      
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

  // Функция для определения языка текста
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

  // Универсальный перевод историй с любого языка на выбранный
  const translateStories = async () => {
    if (stories.length === 0) {
      setTranslatedStories([])
      return
    }

    // Если Chrome Translator API недоступен, используем оригинальные истории
    if (!('Translator' in self)) {
      console.warn('Chrome Translator API не поддерживается в этом браузере')
      setTranslatedStories(stories)
      return
    }

    console.log('🔄 Начинаем перевод историй:', {
      storiesCount: stories.length,
      currentLanguage,
      firstStoryTitle: stories[0]?.title
    })

    setTranslating(true)
    
    try {
      // Переводим все истории параллельно
      const translated = await Promise.all(
        stories.map(async (story, index) => {
          try {
            // Определяем язык заголовка и содержимого
            const titleLanguage = detectLanguage(story.title)
            const contentLanguage = detectLanguage(story.content)
            
            // Переводим только если язык отличается от выбранного
            const targetLang = currentLanguage.toLowerCase()
            
            console.log(`📝 История ${index + 1}: "${story.title.substring(0, 50)}..."`, {
              titleLanguage,
              contentLanguage,
              targetLanguage: currentLanguage,
              targetLangLower: targetLang,
              needTitleTranslation: titleLanguage !== targetLang,
              needContentTranslation: contentLanguage !== targetLang
            })
            
            let translatedTitle = story.title
            let translatedContent = story.content
            
            // Переводим заголовок если нужно
            if (titleLanguage !== targetLang) {
              console.log(`🔄 ПЕРЕВОДИМ ЗАГОЛОВОК: "${story.title}" с ${titleLanguage} на ${targetLang}`)
              
              // Специальная отладка для "Zero Waste Challenge"
              if (story.title.includes('Zero Waste')) {
                console.log('🎯 СПЕЦИАЛЬНАЯ ОТЛАДКА для Zero Waste Challenge:', {
                  originalTitle: story.title,
                  titleLanguage,
                  targetLang,
                  currentLanguage,
                  storyId: story.id
                })
              }
              
              try {
                translatedTitle = await translateStoryContent(story.title, currentLanguage, titleLanguage)
                console.log(`✅ ЗАГОЛОВОК ПЕРЕВЕДЕН: "${story.title}" → "${translatedTitle}"`)
                
                // Проверяем, действительно ли заголовок изменился
                if (translatedTitle === story.title) {
                  console.warn(`⚠️ ЗАГОЛОВОК НЕ ИЗМЕНИЛСЯ! Возможно, перевод не сработал`)
                }
              } catch (error) {
                console.error(`❌ ОШИБКА ПЕРЕВОДА ЗАГОЛОВКА:`, error)
                translatedTitle = story.title // Оставляем оригинал при ошибке
              }
            } else {
              console.log(`⏭️ Заголовок НЕ НУЖДАЕТСЯ в переводе (${titleLanguage} = ${targetLang})`)
            }
            
            // Переводим содержимое если нужно
            if (contentLanguage !== targetLang) {
              console.log(`🔄 Переводим содержимое с ${contentLanguage} на ${targetLang}`)
              try {
                translatedContent = await translateStoryContent(story.content, currentLanguage, contentLanguage)
                console.log(`✅ Содержимое переведено`)
              } catch (error) {
                console.error(`❌ Ошибка перевода содержимого:`, error)
                translatedContent = story.content // Оставляем оригинал при ошибке
              }
            } else {
              console.log(`⏭️ Содержимое не нуждается в переводе (${contentLanguage} = ${targetLang})`)
            }
            
            return {
              ...story,
              title: translatedTitle,
              content: translatedContent
            }
          } catch (error) {
            console.warn(`❌ Ошибка перевода истории ${story.id}:`, error)
            return story // Возвращаем оригинал при ошибке
          }
        })
      )
      
      console.log('✅ Перевод завершен:', {
        originalCount: stories.length,
        translatedCount: translated.length,
        firstTranslatedTitle: translated[0]?.title
      })
      
      setTranslatedStories(translated)
    } catch (error) {
      console.error('❌ Критическая ошибка перевода:', error)
      setTranslatedStories(stories) // Используем оригинальные истории при ошибке
    } finally {
      setTranslating(false)
    }
  }

  // Лайк истории
  const handleLikeStory = async (storyId) => {
    // Проверяем авторизацию
    const user = localStorage.getItem('user')
    console.log('🔍 Проверка авторизации:', user)
    
    if (!user) {
      console.log('❌ Пользователь не авторизован')
      setShowAuthModal(true)
      return
    }

    try {
      const userData = JSON.parse(user)
      console.log('👤 Данные пользователя:', userData)
      console.log('🆔 ID пользователя:', userData.id, 'Тип:', typeof userData.id)
      
      const requestBody = { userId: userData.id }
      console.log('📤 Отправляем запрос:', requestBody)
      
      const response = await fetch(`http://localhost:3001/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📥 Ответ сервера:', response.status)
      const data = await response.json()
      console.log('📊 Данные ответа:', data)
      
      if (data.success) {
        console.log('✅ Лайк успешно обработан')
        // Обновляем оригинальные истории
        setStories(prevStories => 
          prevStories.map(story => 
            story.id === storyId 
              ? { ...story, likes_count: data.likes, is_liked: data.isLiked }
              : story
          )
        )
        
        // Обновляем переведенные истории (чтобы не перезагружать перевод)
        setTranslatedStories(prevTranslated => 
          prevTranslated.map(story => 
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
      } else {
        console.error('❌ Ошибка от сервера:', data)
      }
    } catch (error) {
      console.error('❌ Ошибка при лайке:', error)
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

  // Перевод историй при смене языка или загрузке новых историй
  useEffect(() => {
    if (stories.length > 0) {
      translateStories()
    }
  }, [currentLanguage, stories.length]) // Упрощенные зависимости

  // Загрузка статистики при монтировании компонента
  useEffect(() => {
    // Применяем сохраненную тему при загрузке страницы
    const savedTheme = getSavedTheme()
    applyTheme(savedTheme)
    setCurrentTheme(savedTheme)
    
    loadStats()
  }, [])

  return (
    <div className="about-page" data-theme={currentTheme}>
      <div className="about-white-block">
        {/* Ссылка "Главная" */}
        <div className="home-link">
          <Link to="/" className="home-link-content">
            <img src={getHomeIcon()} alt={translations.homeAlt} className="home-icon" />
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
                  <div className="feature-card">
                    <div className="feature-icon">🎯</div>
                    <h3>{translations.aboutFeatureEducation}</h3>
                    <p>{translations.aboutFeatureEducationDesc}</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">📈</div>
                    <h3>{translations.aboutFeatureProgress}</h3>
                    <p>{translations.aboutFeatureProgressDesc}</p>
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
                <div className="categories-island-content">
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
              </div>

              {loading ? (
                <div className="loading">
                  {translations.aboutStoriesLoading}
                </div>
              ) : translating ? (
                <div className="loading">
                  {translations.storiesTranslating}
                </div>
              ) : (
                <div className="stories-grid">
                  {translatedStories.map((story) => (
                    <div key={story.id} className="story-card">
                      <div className="story-header">
                        <div className="story-user">{getEmojiByCode(story.user_avatar)} {story.user_nickname}</div>
                        <div className="story-category">{translateCategory(story.category, currentLanguage)}</div>
                        <div className="story-date">{new Date(story.created_at).toLocaleDateString(
                          currentLanguage === 'EN' ? 'en-US' : 
                          currentLanguage === 'BY' ? 'be-BY' : 'ru-RU'
                        )}</div>
                      </div>
                      <h3 className="story-title">{story.title}</h3>
                      <p className="story-content">{story.content}</p>
                      <div className="story-footer">
                        <div className="carbon-saved">
                          🌱 {translations.aboutCarbonSaved} {formatCarbonFootprint(story.carbon_saved, currentLanguage)}
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
                      <div className="rating-avatar">
                        {getEmojiByCarbon(user.carbon_saved)}
                      </div>
                      <div className="rating-info">
                        <div className="rating-name">{user.nickname}</div>
                        <div className="rating-level">{translateEcoLevel(user.eco_level, currentLanguage)}</div>
                      </div>
                      <div className="rating-score">
                        {formatCarbonFootprint(user.carbon_saved, currentLanguage)}
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
                      <div className="rating-avatar">{team.avatar_emoji}</div>
                      <div className="rating-info">
                        <div className="rating-name">{team.name}</div>
                        <div className="rating-level">{team.member_count} {translations.aboutMembersCount}</div>
                      </div>
                      <div className="rating-score">
                        {formatCarbonFootprint(team.carbon_saved, currentLanguage)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно авторизации */}
      {showAuthModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowAuthModal(false)} />
          <div className="auth-modal">
            <div className="modal-header">
              <h3>Требуется авторизация</h3>
              <button className="modal-close" onClick={() => setShowAuthModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Чтобы ставить лайки историям, необходимо войти в систему.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowAuthModal(false)}
              >
                Остаться здесь
              </button>
              <button 
                className="btn-primary" 
                onClick={() => window.location.href = '/auth'}
              >
                Войти в систему
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AboutPage