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
      localStorage.setItem('appTheme', theme)
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

    const response = await fetch('http://localhost:3001/api/user-settings', {
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

    const response = await fetch('http://localhost:3001/api/user-settings', {
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
  // Сначала пытаемся загрузить тему из БД
  const dbTheme = await loadThemeFromDatabase()
  
  // Если есть тема в БД, используем её, иначе берем из localStorage
  const savedTheme = dbTheme || getSavedTheme()
  const activeTheme = applyTheme(savedTheme)
  
  // Если тема была загружена из БД, обновляем localStorage
  if (dbTheme && dbTheme !== getSavedTheme()) {
    saveTheme(dbTheme)
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