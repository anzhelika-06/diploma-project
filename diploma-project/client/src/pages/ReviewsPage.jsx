import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../contexts/SocketContext'
import '../styles/pages/ReviewsPage.css'
import { getEmojiByCode } from '../utils/emojiMapper'
import { 
  translateCategory, 
  translateStoryContent,
  formatCarbonFootprint
} from '../utils/translations'
import { applyTheme, getSavedTheme } from '../utils/themeManager'
import { useLanguage } from '../contexts/LanguageContext'
import { useEventTracker } from '../hooks/useEventTracker' // Импортируем хук

const ReviewsPage = () => {
  const { currentLanguage, t } = useLanguage()
  const { trackEvent } = useEventTracker() // Используем хук
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [storiesFilter, setStoriesFilter] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stories, setStories] = useState([])
  const [translatedStories, setTranslatedStories] = useState([])
  const [currentTheme, setCurrentTheme] = useState('light')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [likedStories, setLikedStories] = useState(new Set())
  const [expandedStories, setExpandedStories] = useState(new Set())
  const [socket, setSocket] = useState(null)
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalStories, setTotalStories] = useState(0)
  const STORIES_PER_PAGE = 9
  
  // Состояния для формы создания истории
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newStory, setNewStory] = useState({
    title: '',
    content: '',
    category: 'Общее',
    carbon_saved: 0
  })
  const [creatingStory, setCreatingStory] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  // Состояния для кастомного дропдауна
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const categoryDropdownRef = useRef(null)
  
  // Состояния для модальных окон
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState(null)
  
  // Состояния для уведомлений
  const [tempNotification, setTempNotification] = useState({ 
    show: false, 
    title: '', 
    body: '',
    type: 'success'
  })

  // Флаг для предотвращения перевода при обновлении лайков
  const skipTranslationRef = useRef(false)

  // Проверка авторизации и получение пользователя
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      navigate('/auth')
      return
    }
    
    try {
      const user = JSON.parse(userStr)
      setCurrentUser(user)
    } catch (error) {
      console.error('Ошибка при парсинге пользователя:', error)
      navigate('/auth')
    }
  }, [navigate])

  // Загрузка лайков пользователя при монтировании
  useEffect(() => {
    if (currentUser) {
      const savedLikes = localStorage.getItem(`user_likes_${currentUser.id}`)
      if (savedLikes) {
        try {
          const likesArray = JSON.parse(savedLikes)
          setLikedStories(new Set(likesArray))
        } catch (error) {
          console.error('Ошибка при загрузке лайков:', error)
        }
      }
    }
  }, [currentUser])

  // Закрытие дропдауна при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setIsCategoryDropdownOpen(false);
      }
    });
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', () => {});
    };
  }, []);

  // Функция для показа уведомлений
  const showNotification = (type, title, body) => {
    setTempNotification({
      show: true,
      type,
      title,
      body
    });
    
    setTimeout(() => {
      setTempNotification({ show: false, title: '', body: '', type: 'success' });
    }, 3000);
  };

  // Сохранение лайков в localStorage
  const saveLikesToStorage = useCallback((likedStoriesSet) => {
    if (currentUser) {
      const likesArray = Array.from(likedStoriesSet)
      localStorage.setItem(`user_likes_${currentUser.id}`, JSON.stringify(likesArray))
    }
  }, [currentUser])

  // Обновление состояния лайков при загрузке историй с сервера
  const updateLikesFromServer = useCallback((serverStories) => {
    if (!serverStories || !currentUser) return
    
    const serverLikes = new Set()
    serverStories.forEach(story => {
      if (story.is_liked) {
        serverLikes.add(story.id)
      }
    })
    
    setLikedStories(prev => {
      const combined = new Set([...prev, ...serverLikes])
      saveLikesToStorage(combined)
      return combined
    })
  }, [currentUser, saveLikesToStorage])

  // Получаем глобальный socket
  const { socket: globalSocket, isConnected } = useSocket();

  // Используем глобальный socket
  useEffect(() => {
    if (globalSocket) {
      setSocket(globalSocket);
    }
  }, [globalSocket]);

  // Подключение обработчиков WebSocket
  useEffect(() => {
    if (!socket || !currentUser) return;

    console.log('🔌 ReviewsPage: Подключение обработчиков к глобальному socket');
    
    const handleLikeUpdate = (data) => {
      console.log('🔄 WebSocket обновление лайков:', data);
      
      skipTranslationRef.current = true;
      
      setStories(prevStories => 
        prevStories.map(story => 
          story.id === data.storyId 
            ? { ...story, likes_count: data.likes }
            : story
        )
      );
      
      setTranslatedStories(prevTranslated => 
        prevTranslated.map(story => 
          story.id === data.storyId 
            ? { ...story, likes_count: data.likes }
            : story
        )
      );
      
      setTimeout(() => {
        skipTranslationRef.current = false;
      }, 100);
    };
    
    socket.on('story:like:update', handleLikeUpdate);
    
    return () => {
      console.log('🔌 ReviewsPage: Отключение обработчиков');
      socket.off('story:like:update', handleLikeUpdate);
    };
  }, [socket, currentUser]);

  // Загрузка всех историй с пагинацией
  const loadAllStories = async (filter = 'all', category = 'all', page = 1) => {
    try {
      setLoading(true)
      
      const url = `/api/stories?filter=${filter}&category=${category}&page=${page}&limit=${STORIES_PER_PAGE}`
      console.log('🔍 Запрос к API (все истории):', url)
      
      const response = await fetch(url)
      const data = await response.json()
      
      console.log('📥 Ответ от API (все истории):', data)
      
      if (data.success) {
        let sortedStories = [...data.stories]
        
        if (filter === 'best') {
          sortedStories.sort((a, b) => {
            if (b.likes_count !== a.likes_count) {
              return b.likes_count - a.likes_count
            }
            return new Date(b.created_at) - new Date(a.created_at)
          })
        } else if (filter === 'recent') {
          sortedStories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        }
        
        const storiesWithTranslationFlag = sortedStories.map(story => ({
          ...story,
          _needsTranslation: true
        }))
        
        setStories(storiesWithTranslationFlag)
        updateLikesFromServer(sortedStories)
        
        const totalFromServer = data.pagination?.total || data.total || data.stories.length
        const totalPagesFromServer = data.pagination?.totalPages || Math.ceil(totalFromServer / STORIES_PER_PAGE)
        
        console.log('📊 Пагинационные данные (все истории):', {
          totalFromServer,
          totalPagesFromServer,
          storiesCount: data.stories.length,
          currentPage: page
        })
        
        setTotalStories(totalFromServer)
        setTotalPages(totalPagesFromServer)
        
        if (page !== currentPage) {
          setExpandedStories(new Set())
        }
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки историй:', error)
    } finally {
      setLoading(false)
    }
  }

  // Загрузка моих историй с пагинацией
  const loadMyStories = async (status = 'all', category = 'all', page = 1) => {
    try {
      setLoading(true)
      
      if (!currentUser) {
        navigate('/auth')
        return
      }
      
      const url = `/api/stories/my?userId=${currentUser.id}&status=${status}&category=${category}&page=${page}&limit=${STORIES_PER_PAGE}`
      console.log('📡 Запрос к API (мои истории):', url)
      
      const response = await fetch(url)
      const data = await response.json()
      
      console.log('📥 Ответ от API (мои истории):', data)
      
      if (data.success) {
        let sortedStories = [...data.stories]
        sortedStories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        
        const storiesWithTranslationFlag = sortedStories.map(story => ({
          ...story,
          _needsTranslation: true
        }))
        
        setStories(storiesWithTranslationFlag)
        updateLikesFromServer(sortedStories)
        
        const totalFromServer = data.pagination?.total || data.total || data.stories.length
        const totalPagesFromServer = data.pagination?.totalPages || Math.ceil(totalFromServer / STORIES_PER_PAGE)
        
        console.log('📊 Пагинационные данные (мои истории):', {
          totalFromServer,
          totalPagesFromServer,
          storiesCount: data.stories.length,
          currentPage: page
        })
        
        setTotalStories(totalFromServer)
        setTotalPages(totalPagesFromServer)
        
        if (page !== currentPage) {
          setExpandedStories(new Set())
        }
      } else {
        console.error('❌ Ошибка при загрузке моих историй:', data)
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки моих историй:', error)
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
      console.error('❌ Ошибка загрузки категорий:', error)
    }
  }

  // Определение языка текста
  const detectLanguage = useCallback((text) => {
    if (!text) return 'ru'
    
    const latinChars = (text.match(/[a-zA-Z]/g) || []).length
    const cyrillicChars = (text.match(/[а-яёА-ЯЁ]/g) || []).length
    const belarusianChars = (text.match(/[ўЎіІ]/g) || []).length
    
    const totalLetters = latinChars + cyrillicChars + belarusianChars
    
    if (belarusianChars > 0) {
      return 'by'
    } else if (totalLetters > 0 && (latinChars / totalLetters) > 0.5) {
      return 'en'
    } else if (totalLetters > 0 && (cyrillicChars / totalLetters) > 0.5) {
      return 'ru'
    } else if (latinChars > 0 && cyrillicChars === 0) {
      return 'en'
    }
    
    return 'ru'
  }, [])

  // Перевод историй
  const translateStories = useCallback(async () => {
    if (skipTranslationRef.current) {
      console.log('⏭️ Пропуск перевода из-за флага')
      return
    }
    
    if (stories.length === 0) {
      setTranslatedStories([])
      return
    }

    if (!('Translator' in self)) {
      setTranslatedStories(stories)
      return
    }

    setTranslating(true)
    
    try {
      const storiesToTranslate = stories.filter(story => story._needsTranslation !== false)
      
      if (storiesToTranslate.length === 0) {
        setTranslatedStories(stories)
        return
      }
      
      console.log(`📝 Переводим ${storiesToTranslate.length} из ${stories.length} историй`)
      
      const translated = await Promise.all(
        stories.map(async (story) => {
          try {
            if (story._needsTranslation === false) {
              return story
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
                console.warn('⚠️ Ошибка перевода заголовка:', error)
                translatedTitle = story.title
              }
            }
            
            if (contentLanguage !== targetLang) {
              try {
                translatedContent = await translateStoryContent(story.content, currentLanguage, contentLanguage)
              } catch (error) {
                console.warn('⚠️ Ошибка перевода контента:', error)
                translatedContent = story.content
              }
            }
            
            return {
              ...story,
              title: translatedTitle,
              content: translatedContent,
              _needsTranslation: false,
              _translatedAt: new Date().toISOString(),
              _targetLanguage: currentLanguage
            }
          } catch (error) {
            console.error('❌ Ошибка при переводе истории:', error)
            return {
              ...story,
              _needsTranslation: false,
              _targetLanguage: currentLanguage
            }
          }
        })
      )
      
      setTranslatedStories(translated)
    } catch (error) {
      console.error('❌ Общая ошибка перевода:', error)
      setTranslatedStories(stories.map(story => ({
        ...story,
        _needsTranslation: false,
        _targetLanguage: currentLanguage
      })))
    } finally {
      setTranslating(false)
    }
  }, [stories, currentLanguage, detectLanguage])

  // Лайк истории
  const handleLikeStory = async (storyId) => {
    if (!currentUser) {
      navigate('/auth')
      return
    }

    try {
      const response = await fetch(`/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id })
      })
      
      const data = await response.json()
      
      if (data.success) {
        skipTranslationRef.current = true
        
        const wasLiked = likedStories.has(storyId)
        const isLikedNow = data.isLiked
        
        setStories(prevStories => 
          prevStories.map(story => 
            story.id === storyId 
              ? { 
                  ...story, 
                  likes_count: data.likes,
                  is_liked: isLikedNow,
                  _needsTranslation: false
                }
              : story
          )
        )
        
        setTranslatedStories(prevTranslated => 
          prevTranslated.map(story => 
            story.id === storyId 
              ? { 
                  ...story, 
                  likes_count: data.likes,
                  is_liked: isLikedNow
                }
              : story
          )
        )
        
        setLikedStories(prev => {
          const newSet = new Set(prev)
          if (isLikedNow) {
            newSet.add(storyId)
          } else {
            newSet.delete(storyId)
          }
          saveLikesToStorage(newSet)
          return newSet
        })
        
        // Отслеживаем событие лайка
        if (isLikedNow) {
          trackEvent('story_liked', {
            userId: currentUser.id,
            storyId: storyId,
            action: 'like',
            totalLikes: data.likes
          })
        } else {
          trackEvent('story_unliked', {
            userId: currentUser.id,
            storyId: storyId,
            action: 'unlike',
            totalLikes: data.likes
          })
        }
        
        if (socket) {
          socket.emit('story:like', {
            storyId: storyId,
            userId: currentUser.id,
            action: isLikedNow ? 'like' : 'unlike'
          })
        }
        
        setTimeout(() => {
          skipTranslationRef.current = false
        }, 100)
      } else if (data.error === 'TOO_MANY_LIKES') {
        setErrorModalData({
          title: t('error') || 'Ошибка',
          message: data.message || t('tooManyLikes') || 'Слишком много лайков. Подождите немного.'
        })
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error('❌ Ошибка при лайке:', error)
      skipTranslationRef.current = false
    }
  }

  // Создание новой истории
  const handleCreateStory = async () => {
    if (!currentUser) {
      navigate('/auth')
      return
    }

    try {
      setCreatingStory(true)
      
      const storyData = {
        userId: currentUser.id,
        title: newStory.title.trim(),
        content: newStory.content.trim(),
        category: newStory.category,
        carbon_saved: parseFloat(newStory.carbon_saved) || 0
      }
      
      console.log('📤 Отправка данных для создания истории:', storyData)
      
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCurrentPage(1)
        if (activeTab === 'my') {
          loadMyStories(statusFilter, selectedCategory, 1)
        } else {
          loadAllStories(storiesFilter, selectedCategory, 1)
        }
        
        // Отслеживаем событие создания истории
        trackEvent('story_created', {
          userId: currentUser.id,
          storyId: data.story?.id,
          category: newStory.category,
          title: newStory.title,
          contentLength: newStory.content.length,
          carbonSaved: newStory.carbon_saved,
          status: 'pending',
          wordCount: newStory.content.split(' ').length
        })
        
        // Отслеживаем создание первой истории
        if (stories.length === 0 && activeTab === 'my') {
          trackEvent('first_story', {
            userId: currentUser.id,
            storyId: data.story?.id
          })
        }
        
        // Отслеживаем создание истории определенной категории
        if (newStory.category === 'ecology') {
          trackEvent('ecology_story_created', {
            userId: currentUser.id,
            storyId: data.story?.id,
            category: newStory.category
          })
        }
        
        setNewStory({
          title: '',
          content: '',
          category: 'food',
          carbon_saved: 0
        })
        setShowCreateModal(false)
        
        showNotification('success', 
          t('storyCreatedSuccess') || 'История успешно создана!', 
          t('storyCreatedDesc') || 'Она появится после проверки модератором.'
        )
      } else {
        showNotification('error', 
          t('error') || 'Ошибка', 
          data.message || t('storyCreateError') || 'Ошибка при создании истории'
        )
      }
    } catch (error) {
      console.error('❌ Ошибка при создании истории:', error)
      showNotification('error', 
        t('error') || 'Ошибка', 
        t('storyCreateError') || 'Ошибка при создании истории'
      )
    } finally {
      setCreatingStory(false)
    }
  }

  // Открытие модального окна подтверждения удаления
  const openDeleteConfirmation = (storyId) => {
    setStoryToDelete(storyId)
    setShowDeleteModal(true)
  }

  // Удаление моей истории
  const handleDeleteStory = async () => {
    if (!storyToDelete) return

    try {
      const response = await fetch(`/api/stories/${storyToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Отслеживаем событие удаления истории
        trackEvent('story_deleted', {
          userId: currentUser.id,
          storyId: storyToDelete
        })
        
        if (activeTab === 'my') {
          loadMyStories(statusFilter, selectedCategory, currentPage)
        } else {
          loadAllStories(storiesFilter, selectedCategory, currentPage)
        }
        
        showNotification('success', 
          t('storyDeletedSuccess') || 'История успешно удалена', 
          t('storyDeletedDesc') || 'История была удалена из вашего профиля.'
        )
      } else {
        showNotification('error', 
          t('error') || 'Ошибка', 
          data.message || t('storyDeleteError') || 'Ошибка при удалении истории'
        )
      }
    } catch (error) {
      console.error('❌ Ошибка при удалении истории:', error)
      showNotification('error', 
        t('error') || 'Ошибка', 
        t('storyDeleteError') || 'Ошибка при удалении истории'
      )
    } finally {
      setShowDeleteModal(false)
      setStoryToDelete(null)
    }
  }

  // Свернуть/развернуть историю
  const toggleStoryExpansion = (storyId) => {
    setExpandedStories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(storyId)) {
        newSet.delete(storyId)
      } else {
        newSet.add(storyId)
      }
      return newSet
    })
    
    // Отслеживаем просмотр истории
    if (currentUser) {
      trackEvent('story_viewed', {
        userId: currentUser.id,
        storyId: storyId,
        action: 'expand'
      })
    }
  }

  // Обработчик смены вкладки
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
    
    // Отслеживаем переключение вкладок
    if (currentUser) {
      trackEvent('stories_tab_changed', {
        userId: currentUser.id,
        tab: tab,
        previousTab: activeTab
      })
    }
    
    if (tab === 'my') {
      setStatusFilter('all')
      loadMyStories('all', selectedCategory, 1)
    } else if (tab === 'all') {
      loadAllStories(storiesFilter, selectedCategory, 1)
    }
  }

  const handleFilterChange = (newFilter) => {
    setCurrentPage(1)
    setStoriesFilter(newFilter)
    
    // Отслеживаем изменение фильтра
    if (currentUser) {
      trackEvent('stories_filter_changed', {
        userId: currentUser.id,
        filter: newFilter,
        category: selectedCategory
      })
    }
  }

  // Обработчик изменения статуса фильтра
  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus)
    setCurrentPage(1)
  }

  // Обработчик изменения категории
  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setCurrentPage(1)
    
    // Отслеживаем изменение категории
    if (currentUser) {
      trackEvent('stories_category_changed', {
        userId: currentUser.id,
        category: category
      })
    }
  }

  // Обработчик выбора категории в модалке
  const handleCategorySelect = (category) => {
    setNewStory({...newStory, category});
    setIsCategoryDropdownOpen(false);
  };

  // Обработчик смены страницы
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    
    setCurrentPage(page)
    
    // Отслеживаем смену страницы
    if (currentUser) {
      trackEvent('stories_page_changed', {
        userId: currentUser.id,
        page: page,
        totalPages: totalPages
      })
    }
    
    if (activeTab === 'all') {
      loadAllStories(storiesFilter, selectedCategory, page)
    } else if (activeTab === 'my') {
      loadMyStories(statusFilter, selectedCategory, page)
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Получение названия выбранной категории для дропдауна
  const getSelectedCategoryName = () => {
    if (!newStory.category || newStory.category === '') {
      return t('selectCategory') || 'Выберите категорию'
    }
    const category = categories.find(c => c.category === newStory.category)
    return category ? translateCategory(category.category, currentLanguage) : newStory.category
  }

  // Отслеживаем открытие модалки создания истории
  useEffect(() => {
    if (showCreateModal && currentUser) {
      trackEvent('create_story_modal_opened', {
        userId: currentUser.id
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreateModal, currentUser?.id]) // Используем currentUser?.id вместо currentUser

  // Загрузка данных при изменении фильтров
  useEffect(() => {
    setCurrentPage(1)
    if (activeTab === 'all') {
      loadAllStories(storiesFilter, selectedCategory, 1)
    } else if (activeTab === 'my') {
      loadMyStories(statusFilter, selectedCategory, 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storiesFilter, selectedCategory, statusFilter])

  // Обработка переключения вкладок
  useEffect(() => {
    if (activeTab === 'my') {
      loadMyStories(statusFilter, selectedCategory, currentPage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Загрузка категорий при монтировании
  useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ВСЕГДА переводим при изменении языка или историй
  useEffect(() => {
    if (stories.length > 0) {
      translateStories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage, stories.length]) // Используем stories.length вместо stories

  // Применение темы
  useEffect(() => {
    const savedTheme = getSavedTheme()
    applyTheme(savedTheme)
    setCurrentTheme(savedTheme)
  }, [])

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(
      currentLanguage === 'EN' ? 'en-US' : 
      currentLanguage === 'BY' ? 'be-BY' : 'ru-RU'
    )
  }

  // Получение статуса истории
  const getStatusLabel = (status) => {
    switch(status) {
      case 'published': return t('statusPublished') || 'Опубликовано'
      case 'pending': return t('statusPending') || 'На проверке'
      default: return status
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'published': return '#4caf50'
      case 'pending': return '#ff9800'
      case 'draft': return '#757575'
      default: return '#666'
    }
  }

  // Получение состояния лайка для конкретной истории
  const isStoryLiked = (storyId) => {
    if (likedStories.has(storyId)) {
      return true
    }
    
    const story = stories.find(s => s.id === storyId)
    if (story && story.is_liked) {
      return true
    }
    
    const translatedStory = translatedStories.find(s => s.id === storyId)
    if (translatedStory && translatedStory.is_liked) {
      return true
    }
    
    return false
  }

  // Рендер пагинации
  const renderPagination = () => {
    if (totalPages <= 1) {
      return null
    }
    
    const pages = []
    const maxVisiblePages = 5
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          className="reviews-pagination-button"
          onClick={() => handlePageChange(currentPage - 1)}
          aria-label="Предыдущая страница"
        >
          ←
        </button>
      )
    }
    
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          className="reviews-pagination-button"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      )
      if (startPage > 2) {
        pages.push(<span key="dots1" className="reviews-pagination-ellipsis">...</span>)
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`reviews-pagination-button ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      )
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="dots2" className="reviews-pagination-ellipsis">...</span>)
      }
      pages.push(
        <button
          key={totalPages}
          className="reviews-pagination-button"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      )
    }
    
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          className="reviews-pagination-button"
          onClick={() => handlePageChange(currentPage + 1)}
          aria-label="Следующая страница"
        >
          →
        </button>
      )
    }
    
    return (
      <div className="reviews-pagination-container">
        <div className="reviews-pagination-info">
          {t('showingStories') || 'Показано'} <strong>{(currentPage - 1) * STORIES_PER_PAGE + 1}-
          {Math.min(currentPage * STORIES_PER_PAGE, totalStories)}</strong> {t('ofTotal') || 'из'} <strong>{totalStories}</strong>
        </div>
        <div className="reviews-pagination-buttons">
          {pages}
        </div>
      </div>
    )
  }

  return (
    <div className="reviews-page-container" data-theme={currentTheme}>
      <div className="reviews-page-wrapper">
        <div className="reviews-page-header">
          <h1 className="reviews-page-title">{t('reviewsPageTitle') || 'Истории успеха'}</h1>
          <p className="reviews-page-subtitle">{t('reviewsPageSubtitle') || 'Читайте и делитесь своими эко-историями'}</p>
        </div>

        <div className="reviews-tabs-container">
          <div className="reviews-page-tabs">
            <button 
              className={`reviews-page-tab ${activeTab === 'all' ? 'reviews-page-tab-active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              <span className="reviews-page-tab-label">{t('allStoriesTab') || 'Все истории'}</span>
            </button>
            <button 
              className={`reviews-page-tab ${activeTab === 'my' ? 'reviews-page-tab-active' : ''}`}
              onClick={() => handleTabChange('my')}
            >
              <span className="reviews-page-tab-label">{t('myStoriesTab') || 'Мои истории'}</span>
            </button>
          </div>
        </div>

        {activeTab === 'my' && (
          <div className="reviews-create-section">
            <button 
              className="reviews-create-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <span className="material-icons">add</span>
              {t('createNewStory') || 'Написать историю'}
            </button>
          </div>
        )}

        <div className="reviews-filters-container">
          {activeTab === 'all' && (
            <div className="reviews-filter-group">
              <div className="reviews-stories-filters">
                <button 
                  className={`reviews-filter-btn ${storiesFilter === 'all' ? 'reviews-filter-btn-active' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  {t('allStories') || 'Все'}
                </button>
                <button 
                  className={`reviews-filter-btn ${storiesFilter === 'best' ? 'reviews-filter-btn-active' : ''}`}
                  onClick={() => handleFilterChange('best')}
                >
                  {t('bestStories') || 'Лучшие'}
                </button>
                <button 
                  className={`reviews-filter-btn ${storiesFilter === 'recent' ? 'reviews-filter-btn-active' : ''}`}
                  onClick={() => handleFilterChange('recent')}
                >
                  {t('recentStories') || 'Новые'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'my' && (
            <div className="reviews-filter-group">
              <div className="reviews-status-filters">
                <button 
                  className={`reviews-status-btn ${statusFilter === 'all' ? 'reviews-status-btn-active' : ''}`}
                  onClick={() => handleStatusFilterChange('all')}
                >
                  {t('allStatuses') || 'Все'}
                </button>
                <button 
                  className={`reviews-status-btn ${statusFilter === 'published' ? 'reviews-status-btn-active' : ''}`}
                  onClick={() => handleStatusFilterChange('published')}
                >
                  {t('statusPublished') || 'Опубликовано'}
                </button>
                <button 
                  className={`reviews-status-btn ${statusFilter === 'pending' ? 'reviews-status-btn-active' : ''}`}
                  onClick={() => handleStatusFilterChange('pending')}
                >
                  {t('statusPending') || 'На проверке'}
                </button>
                <button 
                  className={`reviews-status-btn ${statusFilter === 'draft' ? 'reviews-status-btn-active' : ''}`}
                  onClick={() => handleStatusFilterChange('draft')}
                >
                  {t('draft') || 'Черновик'}
                </button>
              </div>
            </div>
          )}

          <div className="reviews-filter-group">
            <div className="reviews-categories-island">
              <div className="reviews-categories-content">
                <span className="reviews-categories-label">{t('categories') || 'Категории'}:</span>
                <div className="reviews-categories-buttons">
                  <button 
                    className={`reviews-category-chip ${selectedCategory === 'all' ? 'reviews-category-chip-active' : ''}`}
                    onClick={() => handleCategoryChange('all')}
                  >
                    {t('allCategories') || 'Все'}
                  </button>
                  {categories.map(category => (
                    <button 
                      key={category.category}
                      className={`reviews-category-chip ${selectedCategory === category.category ? 'reviews-category-chip-active' : ''}`}
                      onClick={() => handleCategoryChange(category.category)}
                    >
                      {translateCategory(category.category, currentLanguage)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="reviews-content-area">
          {loading ? (
            <div className="reviews-loading">
              {t('loadingStories') || 'Загрузка историй...'}
            </div>
          ) : translating ? (
            <div className="reviews-loading">
              {t('translatingStories') || 'Перевод историй...'}
            </div>
          ) : stories.length === 0 ? (
            <div className="reviews-empty-state">
              <div className="reviews-empty-icon">📝</div>
              <h3>{t('noStoriesTitle') || 'Пока нет историй'}</h3>
              <p>
                {activeTab === 'my' 
                  ? (t('noMyStoriesDesc') || 'У вас еще нет историй. Напишите свою первую историю!')
                  : (t('noAllStoriesDesc') || 'Здесь пока нет историй. Будьте первым!')
                }
              </p>
              {activeTab === 'my' && (
                <button 
                  className="reviews-create-btn reviews-empty-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  {t('createFirstStory') || 'Написать историю'}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="reviews-stories-grid">
                {translatedStories.map((story) => {
                  const isExpanded = expandedStories.has(story.id)
                  const contentPreview = story.content.length > 200 && !isExpanded
                    ? story.content.substring(0, 200) + '...'
                    : story.content
                  
                  const isLiked = isStoryLiked(story.id)
                  
                  return (
                    <div key={story.id} className="reviews-story-card">
                      <div className="reviews-story-header">
                        <div className="reviews-story-user">
                          <div className="reviews-story-avatar">
                            {getEmojiByCode(story.user_avatar)}
                          </div>
                          <div className="reviews-story-user-info">
                            <div className="reviews-story-username">{story.user_nickname}</div>
                            <div className="reviews-story-date">{formatDate(story.created_at)}</div>
                          </div>
                        </div>
                        <div className="reviews-story-meta">
                          <div className="reviews-story-category">
                            {translateCategory(story.category, currentLanguage)}
                          </div>
                          {activeTab === 'my' && story.status && (
                            <div 
                              className="reviews-story-status"
                              style={{ backgroundColor: getStatusColor(story.status) }}
                            >
                              {getStatusLabel(story.status)}
                            </div>
                          )}
                        </div>
                      </div>
                      <h3 className="reviews-story-title">{story.title}</h3>
                      <p className={`reviews-story-content ${isExpanded ? 'reviews-story-content-expanded' : ''}`}>
                        {contentPreview}
                      </p>
                      {story.content.length > 200 && (
                        <button 
                          className="reviews-expand-btn"
                          onClick={() => toggleStoryExpansion(story.id)}
                        >
                          {isExpanded 
                            ? (t('collapseStory') || 'Свернуть') + ' ↑'
                            : (t('expandStory') || 'Развернуть') + ' ↓'
                          }
                        </button>
                      )}
                      <div className="reviews-story-footer">
                        <div className="reviews-carbon-saved">
                          🌱 {t('carbonSaved') || 'Сохранено CO₂'}: {formatCarbonFootprint(story.carbon_saved, currentLanguage)}
                        </div>
                        <div className="reviews-story-actions">
                          <button 
                            className={`reviews-like-btn ${isLiked ? 'reviews-like-btn-active' : ''}`}
                            onClick={() => handleLikeStory(story.id)}
                          >
                            <span className={`reviews-heart-icon ${isLiked ? 'heart-red' : 'heart-gray'}`}>
                              {isLiked ? '❤️' : '🤍'}
                            </span> 
                            <span className="reviews-likes-count">{story.likes_count}</span>
                          </button>
                          {activeTab === 'my' && (
                            <button 
                              className="reviews-delete-btn"
                              onClick={() => openDeleteConfirmation(story.id)}
                              title={t('deleteStory') || 'Удалить историю'}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {renderPagination()}
            </>
          )}  
        </div>
      </div>

      {/* Модальное окно создания истории */}
      {showCreateModal && (
        <>
          <div className="reviews-modal-overlay" onClick={() => !creatingStory && setShowCreateModal(false)} />
          
          <div className="reviews-create-modal">
            <div className="reviews-modal-header">
              <h3>{t('createStoryTitle') || 'Написать историю'}</h3>
              <button 
                className="reviews-modal-close" 
                onClick={() => !creatingStory && setShowCreateModal(false)}
                disabled={creatingStory}
              >
                ✕
              </button>
            </div>
            
            <div className="reviews-modal-body-no-scroll">
              <div className="reviews-modal-form-container">
                <div className="reviews-form-group">
                  <label>{t('storyTitle') || 'Заголовок'} *</label>
                  <input 
                    type="text"
                    value={newStory.title}
                    onChange={(e) => setNewStory({...newStory, title: e.target.value})}
                    placeholder={t('storyTitlePlaceholder') || 'Например: Как я начал сортировать мусор'}
                    className="reviews-form-input"
                    disabled={creatingStory}
                  />
                </div>
                
                <div className="reviews-form-group">
                  <label>{t('storyContent') || 'Содержание'} *</label>
                  <textarea 
                    value={newStory.content}
                    onChange={(e) => setNewStory({...newStory, content: e.target.value})}
                    placeholder={t('storyContentPlaceholder') || 'Расскажите вашу историю...'}
                    className="reviews-form-textarea"
                    rows="6"
                    disabled={creatingStory}
                  />
                </div>
                
                {/* Кастомный дропдаун для категории */}
                <div className="reviews-form-group">
                  <label>{t('category') || 'Категория'} *</label>
                  <div 
                    className="reviews-category-dropdown-wrapper"
                    ref={categoryDropdownRef}
                  >
                    <div 
                      className={`reviews-category-dropdown-trigger ${isCategoryDropdownOpen ? 'active' : ''}`}
                      onClick={() => !creatingStory && setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    >
                      <span className="reviews-category-dropdown-selected">
                        {getSelectedCategoryName()}
                      </span>
                      <svg 
                        className={`reviews-category-dropdown-arrow ${isCategoryDropdownOpen ? 'rotated' : ''}`}
                        width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" 
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                    
                    {isCategoryDropdownOpen && (
                      <div className="reviews-category-dropdown-options">
                        {categories.map(category => (
                          <div
                            key={category.category}
                            className={`reviews-category-dropdown-option ${newStory.category === category.category ? 'selected' : ''}`}
                            onClick={() => handleCategorySelect(category.category)}
                          >
                            {translateCategory(category.category, currentLanguage)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="reviews-form-group">
                  <label>{t('carbonSaved') || 'Сохранено CO₂ (кг)'}</label>
                  <input 
                    type="number"
                    value={newStory.carbon_saved}
                    onChange={(e) => setNewStory({...newStory, carbon_saved: parseFloat(e.target.value) || 0})}
                    placeholder={t('carbonSavedPlaceholder') || '0'}
                    className="reviews-form-input"
                    disabled={creatingStory}
                    min="0"
                    step="0.1"
                  />
                  <div className="reviews-form-hint">
                    {t('carbonSavedHint') || 'Примерное количество сэкономленного CO₂ в килограммах'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="reviews-modal-footer">
              <button 
                className="reviews-btn-secondary" 
                onClick={() => !creatingStory && setShowCreateModal(false)}
                disabled={creatingStory}
              >
                {t('cancel') || 'Отмена'}
              </button>
              <button 
                className="reviews-btn-primary" 
                onClick={handleCreateStory}
                disabled={creatingStory || !newStory.title.trim() || !newStory.content.trim() || !newStory.category}
              >
                {creatingStory 
                  ? (t('creatingStory') || 'Создание...')
                  : (t('createStoryButton') || 'Создать историю')
                }
              </button>
            </div>
          </div>
        </>
      )}

      {/* Модальное окно подтверждения удаления */}
      {showDeleteModal && (
        <>
          <div className="reviews-modal-overlay" onClick={() => setShowDeleteModal(false)} />
          
          <div className="reviews-confirm-modal">
            <div className="reviews-confirm-modal-content">
              <div className="reviews-confirm-modal-icon">🗑️</div>
              <h3 className="reviews-confirm-modal-title">
                {t('confirmDeleteTitle') || 'Удалить историю?'}
              </h3>
              <p className="reviews-confirm-modal-message">
                {t('confirmDeleteMessage') || 'Вы уверены, что хотите удалить эту историю? Это действие нельзя отменить.'}
              </p>
              <div className="reviews-confirm-modal-buttons">
                <button 
                  className="reviews-confirm-modal-btn reviews-confirm-modal-btn-cancel"
                  onClick={() => setShowDeleteModal(false)}
                >
                  {t('cancel') || 'Отмена'}
                </button>
                <button 
                  className="reviews-confirm-modal-btn reviews-confirm-modal-btn-delete"
                  onClick={handleDeleteStory}
                >
                  {t('delete') || 'Удалить'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Временное уведомление об успехе/ошибке */}
      {tempNotification.show && (
        <>
          <div className="reviews-modal-overlay" onClick={() => setTempNotification({ show: false, title: '', body: '', type: 'success' })} />
          <div 
            className="reviews-notification-modal"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2002
            }}
          >
            <div className="reviews-notification-header">
              <h3 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '100%',
                gap: '8px'
              }}>
                <span 
                  className="material-icons" 
                  style={{ 
                    color: tempNotification.type === 'success' ? '#10b981' : '#ef4444'
                  }}
                >
                  {tempNotification.type === 'success' ? 'check_circle' : 'error'}
                </span>
                {tempNotification.title}
              </h3>
              <button 
                className="reviews-notification-close"
                onClick={() => setTempNotification({ show: false, title: '', body: '', type: 'success' })}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="reviews-notification-body">
              <p style={{ textAlign: 'center', fontSize: '16px', marginBottom: '20px' }}>
                {tempNotification.body}
              </p>
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <span 
                  className="material-icons" 
                  style={{ 
                    fontSize: '64px', 
                    color: tempNotification.type === 'success' ? '#10b981' : '#ef4444' 
                  }}
                >
                  {tempNotification.type === 'success' ? 'thumb_up' : 'warning'}
                </span>
              </div>
            </div>
            <div className="reviews-notification-footer">
              <button 
                className="reviews-notification-btn reviews-notification-btn-ok"
                onClick={() => setTempNotification({ show: false, title: '', body: '', type: 'success' })}
                style={{ width: '100%' }}
              >
                OK
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ReviewsPage