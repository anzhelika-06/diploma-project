import { createContext, useContext, useState, useEffect } from 'react'
import { 
  translations, 
  getSavedLanguage, 
  saveLanguageEverywhere, 
  loadLanguageFromDatabase,
  defaultLanguage 
} from '../utils/translations'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(getSavedLanguage())
  const [isLoading, setIsLoading] = useState(true)

  // Загружаем язык при инициализации
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Сначала пытаемся загрузить из БД (если пользователь авторизован)
        const dbLanguage = await loadLanguageFromDatabase()
        
        if (dbLanguage) {
          setCurrentLanguage(dbLanguage)
          // Синхронизируем с localStorage
          localStorage.setItem('selectedLanguage', dbLanguage)
        } else {
          // Используем язык из localStorage
          const savedLanguage = getSavedLanguage()
          setCurrentLanguage(savedLanguage)
        }
      } catch (error) {
        console.warn('Ошибка загрузки языка:', error)
        // Fallback к языку по умолчанию
        setCurrentLanguage(defaultLanguage)
      } finally {
        setIsLoading(false)
      }
    }

    initializeLanguage()
  }, [])
// Функция для смены языка
const changeLanguage = async (newLanguage) => {
  try {
    setCurrentLanguage(newLanguage)
    
    // Сохраняем язык везде
    await saveLanguageEverywhere(newLanguage)
    
    // Обновляем appSettings в localStorage
    try {
      const appSettings = localStorage.getItem('appSettings')
      if (appSettings) {
        const settings = JSON.parse(appSettings)
        settings.language = newLanguage
        localStorage.setItem('appSettings', JSON.stringify(settings))
      } else {
        // Создаем базовые appSettings если их нет
        localStorage.setItem('appSettings', JSON.stringify({
          language: newLanguage,
          theme: 'light'
        }))
      }
    } catch (error) {
      console.warn('Не удалось обновить appSettings:', error)
    }
    
    // Уведомляем другие компоненты об изменении языка
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: newLanguage } 
    }))
    
    console.log('Язык изменен на:', newLanguage)
  } catch (error) {
    console.error('Ошибка смены языка:', error)
    // Не выбрасываем ошибку дальше, чтобы не ломать UI
  }
}

  // Функция для получения переводов
  const t = (key, params = {}) => {
    const keys = key.split('.')
    let value = translations[currentLanguage]
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Fallback к русскому языку
        value = translations[defaultLanguage]
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey]
          } else {
            console.warn(`Translation key not found: ${key}`)
            return key
          }
        }
        break
      }
    }
    
    // Заменяем параметры в строке
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match
      })
    }
    
    return value || key
  }

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    isLoading,
    translations: translations[currentLanguage] || translations[defaultLanguage]
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}