// src/hooks/useEventTracker.js
import { useCallback } from 'react'

export const useEventTracker = () => {
  const trackEvent = useCallback((eventName, eventData = {}) => {
    // Используем относительный путь для фронтенда
    const BASE_URL = '' // Относительный путь к API
    
    // Получаем пользователя из localStorage
    const userStr = localStorage.getItem('user')
    let userId = null
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        userId = user.id
      } catch (error) {
        console.error('Ошибка парсинга пользователя:', error)
      }
    }
    
    // Логируем событие локально (обязательно)
    console.log(`[Analytics] ${eventName}:`, { userId, ...eventData })
    
    // Собираем данные для отправки
    const payload = {
      userId,
      eventName,
      data: eventData,
      timestamp: new Date().toISOString(),
      pageUrl: window.location.pathname,
      userAgent: navigator.userAgent.substring(0, 100)
    }
    
    console.log(`📊 Отправка события: ${eventName}`, payload)
    
    // Отправляем на сервер только если есть userId
    if (userId) {
      // Используем относительный путь, так как API находится на том же домене
      fetch(`${BASE_URL}/api/achievements/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          achievementType: eventName, // Сервер ожидает поле achievementType, не eventName
          data: eventData,
          timestamp: payload.timestamp
        })
      })
      .then(response => {
        if (!response.ok) {
          console.warn(`⚠️ API ответил со статусом ${response.status} для события: ${eventName}`)
          return null
        }
        return response.json()
      })
      .then(result => {
        if (result && result.success) {
          console.log(`✅ Событие успешно отправлено: ${eventName}`)
        } else if (result) {
          console.warn(`⚠️ Сервер вернул ошибку для события ${eventName}:`, result)
        }
      })
      .catch(error => {
        console.error(`❌ Ошибка сети при отправке события ${eventName}:`, error)
        // Сохраняем для оффлайн отправки
        saveOfflineEvent(eventName, payload)
      })
    } else {
      console.warn(`⚠️ Событие ${eventName} не отправлено: userId не найден`)
    }
    
    // Локальное событие для других компонентов
    try {
      window.dispatchEvent(new CustomEvent('analyticsEvent', {
        detail: { 
          eventName, 
          data: eventData,
          timestamp: payload.timestamp
        }
      }))
    } catch (e) {
      console.warn('Ошибка диспатча локального события:', e)
    }
  }, [])

  // Функция для сохранения оффлайн событий
  const saveOfflineEvent = (eventName, payload) => {
    try {
      const offlineEvents = JSON.parse(localStorage.getItem('offlineEvents') || '[]')
      offlineEvents.push({
        eventName,
        payload,
        failedAt: new Date().toISOString(),
        retryCount: 0
      })
      localStorage.setItem('offlineEvents', JSON.stringify(offlineEvents.slice(-50)))
      
      console.log(`💾 Событие сохранено для оффлайн отправки: ${eventName}`)
    } catch (e) {
      console.error('Ошибка сохранения оффлайн события:', e)
    }
  }

  return { trackEvent }
}