import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSocket } from '../contexts/SocketContext'
import { getCurrentUser } from '../utils/authUtils'
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
import { useLanguage } from '../contexts/LanguageContext'

const AboutPage = () => {
  const { currentLanguage, t } = useLanguage()
  const currentUser = getCurrentUser()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Инициализация состояния из URL
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'about')
  const [storiesFilter, setStoriesFilter] = useState(() => searchParams.get('filter') || 'all')
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'all')
  const [ratingsTab, setRatingsTab] = useState(() => searchParams.get('ratingsTab') || 'users')
  
  const [stories, setStories] = useState([])
  const [translatedStories, setTranslatedStories] = useState([])
  const [currentTheme, setCurrentTheme] = useState('light')
  const [categories, setCategories] = useState([])
  const [userRatings, setUserRatings] = useState([])
  const [teamRatings, setTeamRatings] = useState([])
  const [loading, setLoading] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [likedStories, setLikedStories] = useState(new Set())
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [socket, setSocket] = useState(null)
  const [stats, setStats] = useState({
    activeUsers: 0,
    co2Saved: 0,
    ecoTeams: 0,
    successStories: 0
  })
  
  // Ref для отслеживания инициализации
  const isFirstRender = useRef(true)
  const isInitialized = useRef(false)

  // Функция форматирования CO2
  const formatCO2 = (n) => {
    const num = parseFloat(n) || 0;
    // Если больше 1000, показываем в тысячах с запятой
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.', ',') + ' ' + (t('statsThousand') || 'тыс.');
    }
    return Math.round(num * 10) / 10;
  };

  // Синхронизация состояния с URL
  useEffect(() => {
    const params = {}
    if (activeTab !== 'about') params.tab = activeTab
    if (storiesFilter !== 'all') params.filter = storiesFilter
    if (selectedCategory !== 'all') params.category = selectedCategory
    if (ratingsTab !== 'users') params.ratingsTab = ratingsTab
    
    setSearchParams(params, { replace: true })
  }, [activeTab, storiesFilter, selectedCategory, ratingsTab, setSearchParams])

  // Получить правильную иконку домика в зависимости от темы
  const getHomeIcon = () => {
    return currentTheme === 'dark' ? homeIconWhite : homeIcon
  }

  // Получаем глобальный socket
  const { socket: globalSocket, isConnected } = useSocket();

  // Подключение обработчиков WebSocket
  useEffect(() => {
    if (!globalSocket) return;
    
    console.log('🔌 AboutPage: Подключение обработчиков к глобальному socket');
    
    // Слушаем обновления лайков
    const handleLikeUpdate = (data) => {
      console.log('📡 Получено обновление лайка:', data);
      
      // Обновляем оригинальные истории
      setStories(prevStories => 
        prevStories.map(story => 
          story.id === data.storyId 
            ? { ...story, likes_count: data.likes }
            : story
        )
      );
      
      // Обновляем переведенные истории
      setTranslatedStories(prevTranslated => 
        prevTranslated.map(story => 
          story.id === data.storyId 
            ? { ...story, likes_count: data.likes }
            : story
        )
      );
    };
    
    // Слушаем события онлайн/офлайн пользователей
    const handleUserOnline = (data) => {
      console.log('👤 Пользователь онлайн:', data);
    };
    
    const handleUserOffline = (data) => {
      console.log('👋 Пользователь офлайн:', data);
    };
    
    // Слушаем личные сообщения (для будущего функционала)
    const handleMessageReceived = (data) => {
      console.log('💬 Получено личное сообщение:', data);
      // Здесь можно показать уведомление
    };
    
    globalSocket.on('story:like:update', handleLikeUpdate);
    globalSocket.on('user:online', handleUserOnline);
    globalSocket.on('user:offline', handleUserOffline);
    globalSocket.on('message:received', handleMessageReceived);
    
    setSocket(globalSocket);
    
    // Отключаем обработчики при размонтировании компонента
    return () => {
      console.log('🔌 AboutPage: Отключение обработчиков');
      globalSocket.off('story:like:update', handleLikeUpdate);
      globalSocket.off('user:online', handleUserOnline);
      globalSocket.off('user:offline', handleUserOffline);
      globalSocket.off('message:received', handleMessageReceived);
    };
  }, [globalSocket]);

  // Функция для немедленной сортировки существующих историй
  const sortStoriesImmediately = (filter) => {
    setStories(prevStories => {
      const sortedStories = [...prevStories]
      
      if (filter === 'best') {
        sortedStories.sort((a, b) => {
          // Сначала по количеству лайков (по убыванию)
          if (b.likes_count !== a.likes_count) {
            return b.likes_count - a.likes_count
          }
          // Затем по дате создания (новые первыми)
          return new Date(b.created_at) - new Date(a.created_at)
        })
        console.log('⚡ Мгновенная сортировка по лайкам:', sortedStories.map(s => ({ title: s.title, likes: s.likes_count })))
      } else if (filter === 'recent') {
        sortedStories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        console.log('⚡ Мгновенная сортировка по дате:', sortedStories.map(s => ({ title: s.title, date: s.created_at })))
      }
      
      return sortedStories
    })

    // Также сортируем переведенные истории для немедленного отображения
    setTranslatedStories(prevTranslated => {
      const sortedTranslated = [...prevTranslated]
      
      if (filter === 'best') {
        sortedTranslated.sort((a, b) => {
          // Сначала по количеству лайков (по убыванию)
          if (b.likes_count !== a.likes_count) {
            return b.likes_count - a.likes_count
          }
          // Затем по дате создания (новые первыми)
          return new Date(b.created_at) - new Date(a.created_at)
        })
      } else if (filter === 'recent') {
        sortedTranslated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }
      
      return sortedTranslated
    })
  }

  // Обработчик смены фильтра с немедленной сортировкой
  const handleFilterChange = (newFilter) => {
    console.log('🔄 Смена фильтра на:', newFilter)
    
    // Немедленно сортируем существующие истории
    if (stories.length > 0) {
      sortStoriesImmediately(newFilter)
    }
    
    // Обновляем состояние фильтра (это запустит useEffect для загрузки новых данных)
    setStoriesFilter(newFilter)
  }
  const loadStories = async (filter = 'all', category = 'all', page = 1) => {
    try {
      setLoading(true)
      
      // Сбрасываем истории при смене фильтра (page === 1)
      if (page === 1) {
        setStories([])
      }
      
      // Для демонстрации используем ID первого пользователя
      const url = `/api/stories?filter=${filter}&userId=1&category=${category}&page=${page}&limit=10`
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
        let sortedStories = [...data.stories]
        
        // Дополнительная сортировка на клиенте для гарантии правильного порядка
        if (filter === 'best') {
          sortedStories.sort((a, b) => {
            // Сначала по количеству лайков (по убыванию)
            if (b.likes_count !== a.likes_count) {
              return b.likes_count - a.likes_count
            }
            // Затем по дате создания (новые первыми)
            return new Date(b.created_at) - new Date(a.created_at)
          })
          console.log('🔄 Отсортированы истории по лайкам:', sortedStories.map(s => ({ title: s.title, likes: s.likes_count })))
        } else if (filter === 'recent') {
          sortedStories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        }
        
        if (page === 1) {
          setStories(sortedStories)
        } else {
          // Добавляем к существующим историям при загрузке следующих страниц
          setStories(prev => [...prev, ...sortedStories])
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
      const response = await fetch('/api/stories/categories')
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
      const response = await fetch(`/api/rankings/users`, {
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
      const response = await fetch('/api/rankings/teams')
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
      const response = await fetch('/api/stats')
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

  // Универсальный перевод историй с кэшированием
  const translateStories = async () => {
    if (stories.length === 0) {
      setTranslatedStories([])
      return
    }

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
      const translated = await Promise.all(
        stories.map(async (story, index) => {
          try {
            // Создаем ключ для кэша
            const cacheKey = `about_story_translation_${story.id}_${currentLanguage}`
            
            // Проверяем кэш
            const cached = sessionStorage.getItem(cacheKey)
            if (cached) {
              try {
                const cachedData = JSON.parse(cached)
                // Проверяем, что кэш актуален
                if (cachedData.originalTitle === story.title && 
                    cachedData.originalContent === story.content) {
                  return {
                    ...story,
                    title: cachedData.translatedTitle,
                    content: cachedData.translatedContent
                  }
                }
              } catch (e) {
                console.warn('Ошибка чтения кэша:', e)
              }
            }
            
            const titleLanguage = detectLanguage(story.title)
            const contentLanguage = detectLanguage(story.content)
            const targetLang = currentLanguage.toLowerCase()
            
            let translatedTitle = story.title
            let translatedContent = story.content
            
            if (titleLanguage !== targetLang) {
              try {
                translatedTitle = await translateStoryContent(story.title, currentLanguage, titleLanguage)
              } catch (error) {
                console.error(`❌ ОШИБКА ПЕРЕВОДА ЗАГОЛОВКА:`, error)
                translatedTitle = story.title
              }
            }
            
            if (contentLanguage !== targetLang) {
              try {
                translatedContent = await translateStoryContent(story.content, currentLanguage, contentLanguage)
              } catch (error) {
                console.error(`❌ Ошибка перевода содержимого:`, error)
                translatedContent = story.content
              }
            }
            
            // Сохраняем в кэш
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify({
                originalTitle: story.title,
                originalContent: story.content,
                translatedTitle: translatedTitle,
                translatedContent: translatedContent
              }))
            } catch (e) {
              console.warn('Ошибка сохранения в кэш:', e)
            }
            
            return {
              ...story,
              title: translatedTitle,
              content: translatedContent
            }
          } catch (error) {
            console.warn(`❌ Ошибка перевода истории ${story.id}:`, error)
            return story
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
      setTranslatedStories(stories)
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
      
      const response = await fetch(`/api/stories/${storyId}/like`, {
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
      } else if (data.error === 'TOO_MANY_LIKES') {
        setErrorModalData({
          title: t('error') || 'Ошибка',
          message: data.message || t('tooManyLikes') || 'Слишком много лайков. Подождите немного.'
        })
        setShowErrorModal(true)
      } else {
        console.error('❌ Ошибка от сервера:', data)
      }
    } catch (error) {
      console.error('❌ Ошибка при лайке:', error)
    }
  }

  // Загрузка данных при смене фильтра историй или категории (но не при первой загрузке)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    
    if (!isInitialized.current) {
      return
    }
    
    if (activeTab === 'stories') {
      console.log('🔄 Загружаем истории с фильтром:', { storiesFilter, selectedCategory })
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
    
    // Помечаем что инициализация завершена
    setTimeout(() => {
      isInitialized.current = true
    }, 100)
  }, [])

  return (
    <div className="about-page" data-theme={currentTheme}>
      <div className="about-white-block">
        {/* Ссылка "Главная" */}
        <div className="home-link">
          <Link to={currentUser ? "/feed" : "/"} className="home-link-content">
            <img src={getHomeIcon()} alt={t('homeAlt')} className="home-icon" />
            <span className="home-text">{t('homeText')}</span>
          </Link>
        </div>

        {/* Заголовок страницы */}
        <div className="about-header">
          <h1 className="about-title">{t('aboutPageTitle')}</h1>
          <p className="about-subtitle">{t('aboutPageSubtitle')}</p>
        </div>

        {/* Навигация по табам */}
        <div className="about-tabs">
          <button 
            className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            {t('aboutTabAbout')}
          </button>
          <button 
            className={`tab-button ${activeTab === 'stories' ? 'active' : ''}`}
            onClick={() => setActiveTab('stories')}
          >
            {t('aboutTabStories')}
          </button>
          <button 
            className={`tab-button ${activeTab === 'ratings' ? 'active' : ''}`}
            onClick={() => setActiveTab('ratings')}
          >
            {t('aboutTabRatings')}
          </button>
        </div>

        {/* Контент табов */}
        <div className="about-content">
          {activeTab === 'about' && (
            <div className="about-info">
              <div className="info-section">
                <h2>{t('aboutMissionTitle')}</h2>
                <p>
                  {t('aboutMissionText')}
                </p>
              </div>
              
              <div className="info-section">
                <h2>{t('aboutWhatWeOfferTitle')}</h2>
                <div className="features-grid">
                  <div className="feature-card">
                    <div className="feature-icon">📊</div>
                    <h3>{t('aboutFeatureCalculator')}</h3>
                    <p>{t('aboutFeatureCalculatorDesc')}</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">👥</div>
                    <h3>{t('aboutFeatureCommunity')}</h3>
                    <p>{t('aboutFeatureCommunityDesc')}</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">🏆</div>
                    <h3>{t('aboutFeatureRatings')}</h3>
                    <p>{t('aboutFeatureRatingsDesc')}</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">📖</div>
                    <h3>{t('aboutFeatureStories')}</h3>
                    <p>{t('aboutFeatureStoriesDesc')}</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">🎯</div>
                    <h3>{t('aboutFeatureEducation')}</h3>
                    <p>{t('aboutFeatureEducationDesc')}</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">📈</div>
                    <h3>{t('aboutFeatureProgress')}</h3>
                    <p>{t('aboutFeatureProgressDesc')}</p>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h2>{t('aboutAchievementsTitle')}</h2>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number">{stats.activeUsers.toLocaleString()}</div>
                    <div className="stat-label">{t('aboutActiveUsers')}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{formatCO2(stats.co2Saved)}</div>
                    <div className="stat-label">{t('aboutCO2Saved')}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.ecoTeams}</div>
                    <div className="stat-label">{t('aboutEcoTeams')}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.successStories.toLocaleString()}</div>
                    <div className="stat-label">{t('aboutSuccessStories')}</div>
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
                  onClick={() => handleFilterChange('all')}
                >
                  {t('aboutStoriesAll')}
                </button>
                <button 
                  className={`filter-button ${storiesFilter === 'best' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('best')}
                >
                  {t('aboutStoriesBest')}
                </button>
                <button 
                  className={`filter-button ${storiesFilter === 'recent' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('recent')}
                >
                  {t('aboutStoriesRecent')}
                </button>
              </div>

              {/* Анимированный островок с категориями */}
              <div className="categories-island animated-border">
                <div className="categories-island-content">
                  <span className="categories-label">{t('aboutCategoriesLabel')}</span>
                  <div className="categories-buttons">
                    <button 
                      className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedCategory('all')}
                    >
                      {t('aboutCategoriesAll')}
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
                  {t('aboutStoriesLoading')}
                </div>
              ) : translating ? (
                <div className="loading">
                  {t('storiesTranslating')}
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
                          🌱 {t('aboutCarbonSaved')} {formatCarbonFootprint(story.carbon_saved, currentLanguage)}
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
                  {t('aboutRatingsUsers')}
                </button>
                <button 
                  className={`rating-tab ${ratingsTab === 'teams' ? 'active' : ''}`}
                  onClick={() => setRatingsTab('teams')}
                >
                  {t('aboutRatingsTeams')}
                </button>
              </div>

              {ratingsTab === 'users' && (
                <div className="rating-list">
                  <h3>🏆 {t('aboutTopUsers')}</h3>
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
                  <h3>🏆 {t('aboutTopTeams')}</h3>
                  {teamRatings.map((team, index) => (
                    <div key={team.id} className="rating-item">
                      <div className="rating-position">#{index + 1}</div>
                      <div className="rating-avatar">{team.avatar_emoji}</div>
                      <div className="rating-info">
                        <div className="rating-name">{team.name}</div>
                        <div className="rating-level">{team.member_count} {t('aboutMembersCount')}</div>
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
        <h3>{t('authModalTitle') || 'Требуется регистрация'}</h3>
        <button className="modal-close" onClick={() => setShowAuthModal(false)}>✕</button>
      </div>
      <div className="modal-body">
        <p>{t('authModalText') || 'Чтобы ставить лайки историям, необходимо войти в систему.'}</p>
      </div>
      <div className="modal-footer">
        <button 
          className="btn-secondary" 
          onClick={() => setShowAuthModal(false)}
        >
          {t('authModalCancel') || 'Остаться здесь'}
        </button>
        <button 
          className="btn-primary" 
          onClick={() => window.location.href = '/auth'}
        >
          {t('authModalLogin') || 'Войти в систему'}
        </button>
      </div>
    </div>
  </>
)}
    </div>
  )
}

export default AboutPage
