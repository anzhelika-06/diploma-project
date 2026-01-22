import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/pages/AuthPage.css'
import homeIcon from '../assets/images/home.png'
import homeIconWhite from '../assets/images/home-white.png'
import listikVideo from '../assets/videos/listik.webm'
import { getRandomPhrase } from '../utils/randomPhrases'
import listikRu from '../assets/audio/listik-ru.mp3'
import listikEn from '../assets/audio/listik-en.mp3'
import listikBy from '../assets/audio/listik-by.mp3'
import listikImage from '../assets/images/listik.png'
import { applyTheme, getSavedTheme } from '../utils/themeManager'
import { useLanguage } from '../contexts/LanguageContext'

const AuthPage = () => {
  const navigate = useNavigate()
  const { currentLanguage, t } = useLanguage()
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  })
  const [randomPhrase, setRandomPhrase] = useState('')
  const [staticPhrase, setStaticPhrase] = useState('')
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef(null)
  const videoRef = useRef(null)
  const [showStaticLeaf, setShowStaticLeaf] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showSoundButton, setShowSoundButton] = useState(true)
  const [leafText, setLeafText] = useState('')
  const [showLeafText, setShowLeafText] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('light')

// Устанавливаем рандомную фразу над листиком и статичную под ним
useEffect(() => {
  // Применяем сохраненную тему без сохранения в БД
  const savedTheme = getSavedTheme()
  // Используем skipSave: true чтобы не пытаться сохранить в БД на странице авторизации
  applyTheme(savedTheme, { skipSave: true })
  setCurrentTheme(savedTheme)
  
  const randomBubblePhrase = getRandomPhrase(currentLanguage)
  const staticBottomPhrase = t('leafStaticPhrase') || "Привет! Каждый твой выбор теперь — это вклад. Следим за следом вместе?"
  
  setRandomPhrase(randomBubblePhrase)
  setStaticPhrase(staticBottomPhrase)
  setLeafText(randomBubblePhrase)
  setShowLeafText(true)
}, [currentLanguage, t])

  // Получить правильную иконку домика в зависимости от темы
  const getHomeIcon = () => {
    return currentTheme === 'dark' ? homeIconWhite : homeIcon
  }

  // Инициализация аудио без автоматического воспроизведения
  useEffect(() => {
    setShowStaticLeaf(true)
    setIsTransitioning(false)
    
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    
    const audioMap = {
      'RU': listikRu,
      'EN': listikEn,
      'BY': listikBy
    }
    
    const audioSrc = audioMap[currentLanguage] || listikRu
    audioRef.current = new Audio(audioSrc)
    audioRef.current.volume = 0.7
    audioRef.current.playbackRate = 1.2
    
    audioRef.current.addEventListener('ended', () => {
      setIsTransitioning(true)
      setTimeout(() => {
        setShowStaticLeaf(true)
        setIsTransitioning(false)
      }, 100)
    })
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current.removeEventListener('ended', () => {})
        audioRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.pause()
      }
    }
  }, [currentLanguage])

  // Функция для ручного включения звука
  const handleSoundButtonClick = async () => {
    if (audioRef.current) {
      try {
        setShowStaticLeaf(false)
        audioRef.current.currentTime = 0
        await audioRef.current.play()
        setShowSoundButton(false)
        if (videoRef.current) {
          videoRef.current.play().catch(console.log)
        }
      } catch (error) {
        console.log('Audio play failed:', error)
      }
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    
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
    
    if (!formData.login.trim()) {
      newErrors.login = t('loginRequired')
    }
    
    if (!formData.password.trim()) {
      newErrors.password = t('passwordRequired')
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true)
    setErrors({})
    
    try {
      // Создаем объект без пароля для логирования
      const loginData = {
        login: formData.login.trim(),
        password: formData.password
      }
      
      // Безопасная отправка без логирования пароля
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Сохраняем данные пользователя в localStorage
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token) // Добавляем токен
        localStorage.setItem('isAuthenticated', 'true')
        
        // Редирект на страницу ленты
        navigate('/feed')
      } else {
        let errorMessage = t('serverError')
        
        switch (data.error) {
          case 'USER_NOT_FOUND':
            errorMessage = t('userNotFound')
            break
          case 'INVALID_CREDENTIALS':
            errorMessage = t('invalidCredentials')
            break
          case 'MISSING_FIELDS':
            errorMessage = t('serverError')
            break
          default:
            errorMessage = t('serverError')
        }
        
        setErrors({ general: errorMessage })
      }
    } catch (error) {
      console.error('Ошибка при авторизации:', error)
      setErrors({ general: t('networkError') })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page" data-theme={currentTheme}>
      <div className="auth-white-block">
        <div className="home-link">
          <Link to="/" className="home-link-content">
            <img src={getHomeIcon()} alt={t('homeAlt')} className="home-icon" />
            <span className="home-text">{t('homeText')}</span>
          </Link>
        </div>

        <div className="auth-container">
          <div className="auth-form-block">
            <h1 className="auth-title">{t('loginTitle')}</h1>
            
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-fields-container">
                <div className="form-group">
                  <input
                    type="text"
                    name="login"
                    value={formData.login}
                    onChange={handleInputChange}
                    placeholder={t('loginPlaceholder')}
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
                    placeholder={t('passwordPlaceholder')}
                    className={`auth-input ${errors.password ? 'error' : ''}`}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  {errors.password && <div className="error-message">{errors.password}</div>}
                  {errors.general && <div className="error-message">{errors.general}</div>}
                </div>
              </div>
              
              <div className="button-group">
                <button 
                  type="submit" 
                  className="auth-submit-button"
                  disabled={isLoading}
                >
                  {isLoading ? '...' : t('loginButton')}
                </button>
              </div>
              
              <div className="auth-register-link">
                {t('noAccountText')} <Link to="/register" className="register-link">{t('registerLink')}</Link>
              </div>
            </form>
          </div>

          <div className="right-section">
            {showLeafText && (
              <div className="leaf-text-bubble">
                <div className="leaf-text">
                  {leafText}
                </div>
              </div>
            )}
            
            <div className="video-block">
              <div className={`listik-container ${isTransitioning ? 'transitioning' : ''}`}>
                {showStaticLeaf ? (
                  <img 
                    src={listikImage} 
                    alt="Листик" 
                    className="listik-video listik-static"
                  />
                ) : (
                  <video 
                    ref={videoRef}
                    className="listik-video" 
                    autoPlay={false}
                    loop 
                    muted
                    playsInline
                  >
                    <source src={listikVideo} type="video/mp4" />
                    Ваш браузер не поддерживает видео.
                  </video>
                )}
                
                {showSoundButton && (
                  <button 
                    className="sound-button"
                    onClick={handleSoundButtonClick}
                    title={t('enableLeafSound')}
                    aria-label={t('enableLeafSound')}
                  >
                    🔊
                  </button>
                )}
              </div>
            </div>
            
            <div className="static-phrase">
              {staticPhrase}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage