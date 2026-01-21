// Утилита для управления темой приложения

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
}

export const DEFAULT_THEME = THEMES.LIGHT

// Получить сохраненную тему из localStorage
export const getSavedTheme = () => {
  try {
    // Сначала проверяем appSettings (более приоритетные настройки)
    const appSettings = localStorage.getItem('appSettings')
    if (appSettings) {
      const settings = JSON.parse(appSettings)
      if (settings.theme && Object.values(THEMES).includes(settings.theme)) {
        return settings.theme
      }
    }
    
    // Если в appSettings нет темы, проверяем старое место хранения
    const savedTheme = localStorage.getItem('appTheme')
    return Object.values(THEMES).includes(savedTheme) ? savedTheme : DEFAULT_THEME
  } catch (error) {
    console.warn('Не удалось получить сохраненную тему:', error)
    return DEFAULT_THEME
  }
}

// Сохранить тему в localStorage
export const saveTheme = (theme) => {
  try {
    if (Object.values(THEMES).includes(theme)) {
      // Сохраняем в старое место для совместимости
      localStorage.setItem('appTheme', theme)
      
      // Также обновляем в appSettings если они существуют
      const appSettings = localStorage.getItem('appSettings')
      if (appSettings) {
        try {
          const settings = JSON.parse(appSettings)
          settings.theme = theme
          localStorage.setItem('appSettings', JSON.stringify(settings))
        } catch (error) {
          console.warn('Ошибка обновления темы в appSettings:', error)
        }
      }
    }
  } catch (error) {
    console.warn('Не удалось сохранить тему:', error)
  }
}

// Сохранить тему в базу данных
export const saveThemeToDatabase = async (theme) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('Пользователь не авторизован, тема не сохранена в БД')
      return false
    }

    const response = await fetch('/api/user-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        theme: theme
      })
    })

    if (response.ok) {
      console.log('Тема сохранена в базу данных:', theme)
      return true
    } else {
      console.warn('Не удалось сохранить тему в БД:', response.statusText)
      return false
    }
  } catch (error) {
    console.warn('Ошибка при сохранении темы в БД:', error)
    return false
  }
}

// Загрузить тему из базы данных
export const loadThemeFromDatabase = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      return null
    }

    const response = await fetch('/api/user-settings', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.settings && data.settings.theme) {
        console.log('Тема загружена из базы данных:', data.settings.theme)
        return data.settings.theme
      }
    }
    return null
  } catch (error) {
    console.warn('Ошибка при загрузке темы из БД:', error)
    return null
  }
}

// Определить системную тему
export const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT
  }
  return THEMES.LIGHT
}

// Получить активную тему (с учетом auto режима)
export const getActiveTheme = (theme = getSavedTheme()) => {
  if (theme === THEMES.AUTO) {
    return getSystemTheme()
  }
  return theme
}

// Применить тему к документу
export const applyTheme = (theme) => {
  const activeTheme = getActiveTheme(theme)
  
  // Применяем к html элементу
  document.documentElement.setAttribute('data-theme', activeTheme)
  
  // Применяем к body
  document.body.setAttribute('data-theme', activeTheme)
  
  // Применяем к основным контейнерам
  const containers = [
    '.main-container',
    '.main-card',
    '.sidebar',
    '.footer', 
    '.header',
    '.auth-page',
    '.terms-page',
    '.privacy-page',
    '.about-page',
    '.dashboard-layout',
    '.settings-page',
    '.teams-page',
    '.messages-page',
    '.pet-page',
    '.statistics-page',
    '.leaderboard-page',
    '.feed-page',
    '.friends-page',
    '.reviews-page',
    '.contribution-page'
  ]
  
  containers.forEach(selector => {
    const element = document.querySelector(selector)
    if (element) {
      element.setAttribute('data-theme', activeTheme)
    }
  })
  
  // Сохраняем тему локально
  saveTheme(theme)
  
  // Сохраняем тему в БД (асинхронно, не блокируем UI)
  saveThemeToDatabase(theme).catch(error => {
    console.warn('Не удалось сохранить тему в БД:', error)
  })
  
  return activeTheme
}

// Инициализация темы при загрузке приложения
export const initializeTheme = async () => {
  // Проверяем, авторизован ли пользователь
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  
  let savedTheme = DEFAULT_THEME
  
  if (token && user) {
    // Если пользователь авторизован, пытаемся загрузить тему из БД
    const dbTheme = await loadThemeFromDatabase()
    savedTheme = dbTheme || getSavedTheme()
  } else {
    // Если пользователь не авторизован, используем сохраненные настройки из localStorage
    const appSettings = localStorage.getItem('appSettings')
    if (appSettings) {
      try {
        const settings = JSON.parse(appSettings)
        savedTheme = settings.theme || getSavedTheme()
      } catch (error) {
        console.warn('Ошибка парсинга настроек приложения:', error)
        savedTheme = getSavedTheme()
      }
    } else {
      savedTheme = getSavedTheme()
    }
  }
  
  const activeTheme = applyTheme(savedTheme)
  
  // Если тема была загружена из БД, обновляем localStorage
  if (token && user && savedTheme !== getSavedTheme()) {
    saveTheme(savedTheme)
  }
  
  // Слушаем изменения системной темы для auto режима
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleSystemThemeChange = (e) => {
      const currentTheme = getSavedTheme()
      if (currentTheme === THEMES.AUTO) {
        applyTheme(currentTheme)
      }
    }
    
    // Современный способ
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
    } else {
      // Fallback для старых браузеров
      mediaQuery.addListener(handleSystemThemeChange)
    }
  }
  
  return activeTheme
}

// Переключить тему
export const toggleTheme = () => {
  const currentTheme = getSavedTheme()
  const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
  return applyTheme(newTheme)
}

// Получить название темы для отображения
export const getThemeDisplayName = (theme, language = 'RU') => {
  const names = {
    [THEMES.LIGHT]: {
      RU: 'Светлая',
      EN: 'Light',
      BY: 'Светлая'
    },
    [THEMES.DARK]: {
      RU: 'Темная',
      EN: 'Dark', 
      BY: 'Цемная'
    },
    [THEMES.AUTO]: {
      RU: 'Автоматическая',
      EN: 'Auto',
      BY: 'Аўтаматычная'
    }
  }
  
  return names[theme]?.[language] || names[theme]?.RU || theme
}

// Проверить, является ли тема темной
export const isDarkTheme = (theme = getSavedTheme()) => {
  return getActiveTheme(theme) === THEMES.DARK
}

// Синхронизировать тему между localStorage и БД
export const syncTheme = async () => {
  try {
    const localTheme = getSavedTheme()
    const dbTheme = await loadThemeFromDatabase()
    
    if (dbTheme && dbTheme !== localTheme) {
      // Если в БД есть более новая тема, применяем её
      applyTheme(dbTheme)
      return dbTheme
    } else if (!dbTheme && localTheme !== DEFAULT_THEME) {
      // Если в БД нет темы, но есть в localStorage, сохраняем в БД
      await saveThemeToDatabase(localTheme)
      return localTheme
    }
    
    return localTheme
  } catch (error) {
    console.warn('Ошибка синхронизации темы:', error)
    return getSavedTheme()
  }
}