// src/hooks/useEventTracker.js
import { useCallback } from 'react'

export const useEventTracker = () => {
  const trackEvent = useCallback((achievementType, data = {}) => {
    // Отправляем событие на сервер
    fetch('/api/achievements/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        achievementType,
        data,
        timestamp: new Date().toISOString()
      })
    }).catch(console.error)
    
    // Также отправляем событие в локальный обработчик
    window.dispatchEvent(new CustomEvent('achievementEvent', {
      detail: { achievementType, data }
    }))
  }, [])

  return { trackEvent }
}