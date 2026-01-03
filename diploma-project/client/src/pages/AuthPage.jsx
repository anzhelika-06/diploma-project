import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/pages/AuthPage.css'
import homeIcon from '../assets/images/home.png'
import listikVideo from '../assets/videos/listik.webm'
import { getRandomPhrase } from '../utils/randomPhrases'

const AuthPage = ({ translations, currentLanguage, onLanguageChange }) => {
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  })
  const [randomPhrase, setRandomPhrase] = useState('')
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // Генерируем случайную фразу при загрузке компонента
  useEffect(() => {
    setRandomPhrase(getRandomPhrase(currentLanguage))
  }, [currentLanguage])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    
    // Очищаем ошибку при вводе
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const newErrors = {}
    
    // Кастомная валидация с переводами
    if (!formData.login.trim()) {
      newErrors.login = translations.loginRequired
    }
    
    if (!formData.password.trim()) {
      newErrors.password = translations.passwordRequired
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true)
    setErrors({})
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: formData.login.trim(),
          password: formData.password
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Успешная авторизация
        console.log('Пользователь авторизован:', data.user)
        // Здесь можно добавить редирект или сохранение данных пользователя
        alert(`Добро пожаловать, ${data.user.nickname}!`)
      } else {
        // Обработка ошибок с сервера
        let errorMessage = translations.serverError
        
        switch (data.error) {
          case 'USER_NOT_FOUND':
            errorMessage = translations.userNotFound
            break
          case 'INVALID_CREDENTIALS':
            errorMessage = translations.invalidCredentials
            break
          case 'MISSING_FIELDS':
            errorMessage = translations.serverError
            break
          default:
            errorMessage = translations.serverError
        }
        
        setErrors({ general: errorMessage })
      }
    } catch (error) {
      console.error('Ошибка при авторизации:', error)
      setErrors({ general: translations.networkError })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Белый блок как в MainLayout */}
      <div className="auth-white-block">
        {/* Ссылка "Главная" внутри белого блока */}
        <div className="home-link">
          <Link to="/" className="home-link-content">
            <img src={homeIcon} alt={translations.homeAlt} className="home-icon" />
            <span className="home-text">{translations.homeText}</span>
          </Link>
        </div>

        {/* Основной контейнер */}
        <div className="auth-container">
          {/* Левый блок с формой авторизации */}
          <div className="auth-form-block">
            <h1 className="auth-title">{translations.loginTitle}</h1>
            
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <input
                  type="text"
                  name="login"
                  value={formData.login}
                  onChange={handleInputChange}
                  placeholder={translations.loginPlaceholder}
                  className={`auth-input ${errors.login ? 'error' : ''}`}
                  disabled={isLoading}
                />
                {errors.login && <div className="error-message">{errors.login}</div>}
              </div>
              
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={translations.passwordPlaceholder}
                  className={`auth-input ${errors.password ? 'error' : ''}`}
                  disabled={isLoading}
                />
                {errors.password && <div className="error-message">{errors.password}</div>}
                {errors.general && <div className="error-message">{errors.general}</div>}
              </div>
              
              <button 
                type="submit" 
                className="auth-submit-button"
                disabled={isLoading}
              >
                {isLoading ? '...' : translations.loginButton}
              </button>
              
              <div className="auth-register-link">
                {translations.noAccountText} <span className="register-link">{translations.registerLink}</span>
              </div>
            </form>
          </div>

          {/* Правый блок с видео и фразой */}
          <div className="right-section">
            <div className="video-block">
              <video 
                className="listik-video" 
                autoPlay 
                loop 
                muted
                playsInline
              >
                <source src={listikVideo} type="video/mp4" />
                Ваш браузер не поддерживает видео.
              </video>
            </div>
            
            {/* Случайная фраза под видео */}
            <div className="random-phrase">
              {randomPhrase}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage