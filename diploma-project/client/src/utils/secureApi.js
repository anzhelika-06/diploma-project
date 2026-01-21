// Утилита для безопасных API запросов без логирования чувствительных данных

// Список полей, которые не должны логироваться
const SENSITIVE_FIELDS = ['password', 'confirmPassword', 'token', 'secret']

// Функция для очистки объекта от чувствительных данных для логирования
const sanitizeForLogging = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  
  const sanitized = { ...obj }
  
  SENSITIVE_FIELDS.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[HIDDEN]'
    }
  })
  
  return sanitized
}

// Безопасная функция для отправки POST запросов
export const securePost = async (url, data, options = {}) => {
  try {
    // Логируем только безопасные данные
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Secure POST request:', {
        url,
        data: sanitizeForLogging(data),
        timestamp: new Date().toISOString()
      })
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    })
    
    const result = await response.json()
    
    // Логируем ответ (тоже без чувствительных данных)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Secure POST response:', {
        url,
        status: response.status,
        success: result.success,
        timestamp: new Date().toISOString()
      })
    }
    
    return { response, data: result }
  } catch (error) {
    console.error('🔒 Secure POST error:', {
      url,
      error: error.message,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

// Безопасная функция для отправки PUT запросов
export const securePut = async (url, data, options = {}) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Secure PUT request:', {
        url,
        data: sanitizeForLogging(data),
        timestamp: new Date().toISOString()
      })
    }
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    })
    
    const result = await response.json()
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Secure PUT response:', {
        url,
        status: response.status,
        success: result.success,
        timestamp: new Date().toISOString()
      })
    }
    
    return { response, data: result }
  } catch (error) {
    console.error('🔒 Secure PUT error:', {
      url,
      error: error.message,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

// Функция для очистки localStorage от чувствительных данных при логировании
export const sanitizeLocalStorage = () => {
  const storage = { ...localStorage }
  
  // Скрываем токены и другие чувствительные данные
  if (storage.token) storage.token = '[HIDDEN]'
  if (storage.refreshToken) storage.refreshToken = '[HIDDEN]'
  
  return storage
}

// Функция для безопасного логирования состояния приложения
export const secureLog = (message, data = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔒 ${message}`, sanitizeForLogging(data))
  }
}