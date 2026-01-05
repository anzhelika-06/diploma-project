import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../styles/pages/AuthPage.css'
import homeIcon from '../assets/images/home.png'
import listikVideo from '../assets/videos/listik.webm'
import { getRandomPhrase } from '../utils/randomPhrases'
import listikRu from '../assets/audio/listik-ru.mp3'
import listikEn from '../assets/audio/listik-en.mp3'
import listikBy from '../assets/audio/listik-by.mp3'
import listikImage from '../assets/images/listik.png'

const AuthPage = ({ translations, currentLanguage }) => {
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  })
  const [randomPhrase, setRandomPhrase] = useState('')
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef(null)
  const videoRef = useRef(null)
  const [showStaticLeaf, setShowStaticLeaf] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showSoundButton, setShowSoundButton] = useState(false)

  // Генерируем случайную фразу при загрузке компонента
  useEffect(() => {
    setRandomPhrase(getRandomPhrase(currentLanguage))
  }, [currentLanguage])

  // Воспроизводим голос листика при монтировании компонента
  useEffect(() => {
    // Сбрасываем все состояния при монтировании
    setShowStaticLeaf(false)
    setIsTransitioning(false)
    setShowSoundButton(false)
    
    // Останавливаем предыдущее аудио если есть
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
    
    // Устанавливаем параметры
    audioRef.current.volume = 0.7
    audioRef.current.playbackRate = 1.2
    
    // Обработчик окончания аудио
    audioRef.current.addEventListener('ended', () => {
      setIsTransitioning(true)
      setTimeout(() => {
        setShowStaticLeaf(true)
        setIsTransitioning(false)
      }, 100)
    })
    
    const playAudio = async () => {
      try {
        await audioRef.current.play()
        console.log('Audio started successfully')
        setShowSoundButton(false)
        // Запускаем видео программно
        if (videoRef.current) {
          videoRef.current.play().catch(console.log)
        }
      } catch (error) {
        console.log('Audio blocked, showing sound button')
        setShowSoundButton(true)
      }
    }
    
    // Запускаем сразу
    setTimeout(playAudio, 300)
    
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
        // Сбрасываем аудио на начало
        audioRef.current.currentTime = 0
        await audioRef.current.play()
        setShowSoundButton(false)
        // Запускаем видео программно
        if (videoRef.current) {
          videoRef.current.play().catch(console.log)
        }
        console.log('Audio started by user click')
      } catch (error) {
        console.log('Failed to play audio even after user click:', error)
      }
    }
  }

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
              <div className="form-fields-container">
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
              </div>
              
              <div className="button-group">
                <button 
                  type="submit" 
                  className="auth-submit-button"
                  disabled={isLoading}
                >
                  {isLoading ? '...' : translations.loginButton}
                </button>
              </div>
              
              <div className="auth-register-link">
                {translations.noAccountText} <Link to="/register" className="register-link">{translations.registerLink}</Link>
              </div>
            </form>
          </div>

          {/* Правый блок с видео и фразой */}
          <div className="right-section">
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
                
                {/* Кнопка звука для случаев блокировки автовоспроизведения */}
                {showSoundButton && (
                  <button 
                    className="sound-button"
                    onClick={handleSoundButtonClick}
                    title={translations.enableLeafSound}
                    aria-label={translations.enableLeafSound}
                  >
                    🔊
                  </button>
                )}
              </div>
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