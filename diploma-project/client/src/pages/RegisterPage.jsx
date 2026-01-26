import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/pages/RegisterPage.css'
import homeIcon from '../assets/images/home.png'
import homeIconWhite from '../assets/images/home-white.png'
import treeStage1 from '../assets/images/tree-growth-stage1.png'
import treeStage2 from '../assets/images/tree growth stage2.png'
import treeStage3 from '../assets/images/tree growth stage3.png'
import { getRegistrationPhrase } from '../utils/randomPhrases'
import { applyTheme, getSavedTheme } from '../utils/themeManager'
import { useLanguage } from '../contexts/LanguageContext'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { currentLanguage, t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    login: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    birthdate: '',
    gender: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [registrationPhrase, setRegistrationPhrase] = useState('')
  
  // Состояния для селекторов даты
  const [isDayOpen, setIsDayOpen] = useState(false)
  const [isMonthOpen, setIsMonthOpen] = useState(false)
  const [isYearOpen, setIsYearOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('light')

  const totalSteps = 3
  const treeImages = [treeStage1, treeStage2, treeStage3]

  // Получить правильную иконку домика в зависимости от темы
  const getHomeIcon = () => {
    return currentTheme === 'dark' ? homeIconWhite : homeIcon
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

  const handleGenderSelect = (gender) => {
    setFormData({
      ...formData,
      gender: gender
    })
    setIsGenderDropdownOpen(false)
    
    // Очищаем ошибку при выборе
    if (errors.gender) {
      setErrors({
        ...errors,
        gender: ''
      })
    }
  }

  const handleGenderDropdownToggle = () => {
    // Очищаем ошибку при открытии селектора
    if (errors.gender) {
      setErrors({
        ...errors,
        gender: ''
      })
    }
    setIsGenderDropdownOpen(!isGenderDropdownOpen)
  }

  // Функции для работы с датой
  const getCurrentDate = () => {
    const today = new Date()
    return {
      day: today.getDate().toString(),
      month: (today.getMonth() + 1).toString(),
      year: today.getFullYear().toString()
    }
  }

  const [dateSelectors, setDateSelectors] = useState(() => {
    const current = getCurrentDate()
    return {
      day: current.day,
      month: current.month,
      year: current.year
    }
  })

  const handleDateChange = (type, value) => {
    const newSelectors = { ...dateSelectors, [type]: value }
    setDateSelectors(newSelectors)
    
    // Формируем дату в формате YYYY-MM-DD
    const formattedDate = `${newSelectors.year}-${newSelectors.month.padStart(2, '0')}-${newSelectors.day.padStart(2, '0')}`
    setFormData({
      ...formData,
      birthdate: formattedDate
    })
    
    // Очищаем ошибку при выборе даты
    if (errors.birthdate) {
      setErrors({
        ...errors,
        birthdate: ''
      })
    }
    
    // Закрываем селектор
    if (type === 'day') setIsDayOpen(false)
    if (type === 'month') setIsMonthOpen(false)
    if (type === 'year') setIsYearOpen(false)
  }

  const handleDateSelectorClick = (type) => {
    // Очищаем ошибку при клике на любой селектор даты
    if (errors.birthdate) {
      setErrors({
        ...errors,
        birthdate: ''
      })
    }
    
    // Открываем нужный селектор
    if (type === 'day') setIsDayOpen(!isDayOpen)
    if (type === 'month') setIsMonthOpen(!isMonthOpen)
    if (type === 'year') setIsYearOpen(!isYearOpen)
  }

  // Генерируем опции для селекторов
  const getDaysInMonth = (month, year) => {
    return new Date(parseInt(year), parseInt(month), 0).getDate()
  }

  const dayOptions = []
  const daysInMonth = getDaysInMonth(dateSelectors.month, dateSelectors.year)
  for (let i = 1; i <= daysInMonth; i++) {
    dayOptions.push({ value: i.toString(), label: i.toString().padStart(2, '0') })
  }

  const monthOptions = [
    { value: '1', label: currentLanguage === 'RU' ? 'Январь' : currentLanguage === 'EN' ? 'January' : 'Студзень' },
    { value: '2', label: currentLanguage === 'RU' ? 'Февраль' : currentLanguage === 'EN' ? 'February' : 'Люты' },
    { value: '3', label: currentLanguage === 'RU' ? 'Март' : currentLanguage === 'EN' ? 'March' : 'Сакавік' },
    { value: '4', label: currentLanguage === 'RU' ? 'Апрель' : currentLanguage === 'EN' ? 'April' : 'Красавік' },
    { value: '5', label: currentLanguage === 'RU' ? 'Май' : currentLanguage === 'EN' ? 'May' : 'Травень' },
    { value: '6', label: currentLanguage === 'RU' ? 'Июнь' : currentLanguage === 'EN' ? 'June' : 'Чэрвень' },
    { value: '7', label: currentLanguage === 'RU' ? 'Июль' : currentLanguage === 'EN' ? 'July' : 'Ліпень' },
    { value: '8', label: currentLanguage === 'RU' ? 'Август' : currentLanguage === 'EN' ? 'August' : 'Жнівень' },
    { value: '9', label: currentLanguage === 'RU' ? 'Сентябрь' : currentLanguage === 'EN' ? 'September' : 'Верасень' },
    { value: '10', label: currentLanguage === 'RU' ? 'Октябрь' : currentLanguage === 'EN' ? 'October' : 'Кастрычнік' },
    { value: '11', label: currentLanguage === 'RU' ? 'Ноябрь' : currentLanguage === 'EN' ? 'November' : 'Лістапад' },
    { value: '12', label: currentLanguage === 'RU' ? 'Декабрь' : currentLanguage === 'EN' ? 'December' : 'Снежань' }
  ]

  const yearOptions = []
  const currentYear = new Date().getFullYear()
  for (let year = currentYear; year >= currentYear - 100; year--) {
    yearOptions.push({ value: year.toString(), label: year.toString() })
  }

  // Валидация при смене шага
  useEffect(() => {
    if (currentStep === 3) {
      // Проверяем валидацию 3-го шага при переходе на него
      const stepErrors = validateStep(3)
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors)
      }
    }
  }, [currentStep, formData.birthdate, formData.gender, t])

  // Установка случайной фразы регистрации при смене языка
  useEffect(() => {
    // Применяем сохраненную тему при загрузке страницы БЕЗ сохранения в БД
    const savedTheme = getSavedTheme()
    applyTheme(savedTheme, { skipSave: true })
    setCurrentTheme(savedTheme)
    
    const phrase = getRegistrationPhrase(currentLanguage)
    setRegistrationPhrase(phrase)
  }, [currentLanguage])
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-gender-dropdown')) {
        setIsGenderDropdownOpen(false)
      }
      if (!event.target.closest('.date-selector')) {
        setIsDayOpen(false)
        setIsMonthOpen(false)
        setIsYearOpen(false)
      }
    }

    if (isGenderDropdownOpen || isDayOpen || isMonthOpen || isYearOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isGenderDropdownOpen, isDayOpen, isMonthOpen, isYearOpen])

  const validateStep = (step) => {
    const newErrors = {}
    
    if (step === 1) {
      // Валидация логина (email)
      if (!formData.login.trim()) {
        newErrors.login = t('registerLoginRequired')
      } else {
        // Строгая валидация email - только латинские символы, цифры и разрешенные символы
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        const email = formData.login.trim()
        
        if (!emailRegex.test(email)) {
          newErrors.login = t('invalidEmail')
        } else {
          // Дополнительная проверка доменной зоны - только известные почтовые сервисы
          const domainPart = email.split('@')[1]
          const allowedDomains = [
            // Gmail и Google
            'gmail.com', 'googlemail.com',
            // Microsoft
            'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
            // Yahoo
            'yahoo.com', 'yahoo.co.uk', 'yahoo.de', 'yahoo.fr',
            // Российские
            'mail.ru', 'bk.ru', 'inbox.ru', 'list.ru',
            'yandex.ru', 'yandex.com', 'ya.ru',
            'rambler.ru', 'lenta.ru',
            // Белорусские
            'tut.by', 'mail.by', 'yandex.by',
            // Украинские
            'ukr.net', 'i.ua', 'meta.ua',
            // Другие популярные
            'aol.com', 'icloud.com', 'me.com', 'mac.com',
            'protonmail.com', 'tutanota.com',
            // Корпоративные зоны (для примера)
            'example.com', 'test.com', 'demo.org'
          ]
          
          const domain = domainPart.toLowerCase()
          
          if (!allowedDomains.includes(domain)) {
            newErrors.login = t('invalidEmail')
          }
        }
      }
      
      // Валидация никнейма
      if (!formData.nickname.trim()) {
        newErrors.nickname = t('nicknameRequired')
      }
    } else if (step === 2) {
      // Валидация пароля - минимум 6 символов, буквы и цифры
      if (!formData.password.trim()) {
        newErrors.password = t('passwordRequired')
      } else {
        if (formData.password.length < 6) {
          newErrors.password = t('passwordTooShort')
        } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
          newErrors.password = t('passwordTooWeak')
        }
      }
      
      // Валидация повтора пароля
      if (!formData.confirmPassword.trim()) {
        newErrors.confirmPassword = t('confirmPasswordRequired')
      } else if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('passwordMismatch')
      }
    } else if (step === 3) {
      // Валидация даты рождения
      if (!formData.birthdate) {
        newErrors.birthdate = t('birthdateRequired')
      } else {
        const birthDate = new Date(formData.birthdate)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        
        if (age < 18) {
          newErrors.birthdate = t('ageRestriction')
        }
      }
      
      // Валидация пола
      if (!formData.gender) {
        newErrors.gender = t('genderRequired')
      }
    }
    
    return newErrors
  }

  const handleNext = () => {
    const stepErrors = validateStep(currentStep)
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    
    setErrors({})
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setErrors({})
    }
  }

  const handleSubmit = async () => {
    const stepErrors = validateStep(currentStep)
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    
    setIsLoading(true)
    setErrors({})
    
    try {
      // Создаем объект данных для регистрации
      const registrationData = {
        login: formData.login.trim(),
        nickname: formData.nickname.trim(),
        password: formData.password,
        birthdate: formData.birthdate,
        gender: formData.gender
      }
      
      // Отправляем данные регистрации
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // ✅ ВАЖНО: Теперь сервер возвращает токен
        console.log('✅ Регистрация успешна!')
        console.log('🔑 Токен получен:', data.token ? 'Да' : 'Нет')
        console.log('👤 Данные пользователя:', data.user)
        
        // Сохраняем пользователя и токен в localStorage
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token) // ← СОХРАНЯЕМ ТОКЕН
        
        // Показываем модалку успеха
        setShowSuccessModal(true)
        
        // Редирект на главную страницу через 2 секунды
        setTimeout(() => {
          navigate('/') // Идем на главную, а не на авторизацию
        }, 2000)
      } else {
        // Обработка ошибок с сервера
        let errorMessage = t('serverError')
        
        switch (data.error) {
          case 'USER_EXISTS':
            errorMessage = t('userExists')
            break
          case 'INVALID_EMAIL':
            errorMessage = t('invalidEmail')
            break
          case 'PASSWORD_TOO_SHORT':
            errorMessage = t('passwordTooShort')
            break
          case 'PASSWORD_TOO_WEAK':
            errorMessage = t('passwordTooWeak')
            break
          case 'AGE_RESTRICTION':
            errorMessage = t('ageRestriction')
            break
          case 'MISSING_FIELDS':
            errorMessage = 'Все поля обязательны для заполнения'
            break
          default:
            errorMessage = t('serverError')
        }
        
        setErrors({ general: errorMessage })
        setErrorMessage(errorMessage)
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error('❌ Ошибка при регистрации:', error)
      const networkErrorMessage = t('networkError')
      setErrors({ general: networkErrorMessage })
      setErrorMessage(networkErrorMessage)
      setShowErrorModal(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    navigate('/') // Идем на главную
  }

  const handleErrorModalClose = () => {
    setShowErrorModal(false)
    setErrorMessage('')
  }

  const getStepText = () => {
    return t('stepOf')
      .replace('{current}', currentStep)
      .replace('{total}', totalSteps)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div className="form-group">
              <input
                type="text"
                name="login"
                value={formData.login}
                onChange={handleInputChange}
                placeholder={t('registerLoginPlaceholder')}
                className={`auth-input ${errors.login ? 'error' : ''}`}
                disabled={isLoading}
              />
              {errors.login && <div className="error-message">{errors.login}</div>}
            </div>
            
            <div className="form-group">
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                placeholder={t('nicknamePlaceholder')}
                className={`auth-input ${errors.nickname ? 'error' : ''}`}
                disabled={isLoading}
              />
              {errors.nickname && <div className="error-message">{errors.nickname}</div>}
            </div>
          </>
        )
      
      case 2:
        return (
          <>
            <div className="form-group">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t('passwordPlaceholder')}
                className={`auth-input ${errors.password ? 'error' : ''}`}
                disabled={isLoading}
                autoComplete="new-password"
              />
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>
            
            <div className="form-group">
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder={t('confirmPasswordPlaceholder')}
                className={`auth-input ${errors.confirmPassword ? 'error' : ''}`}
                disabled={isLoading}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
            </div>
          </>
        )
      
      case 3:
        return (
          <>
            <div className="form-group">
              <div className="date-selector-group">
                {/* День */}
                <div className="date-selector">
                  <label className="date-selector-label">
                    {currentLanguage === 'RU' ? 'День' : currentLanguage === 'EN' ? 'Day' : 'Дзень'}
                  </label>
                  <div className={`custom-selector ${isDayOpen ? 'open' : ''}`}>
                    <div 
                      className="selector-trigger"
                      onClick={() => handleDateSelectorClick('day')}
                    >
                      <span className="selector-value">
                        {dayOptions.find(opt => opt.value === dateSelectors.day)?.label || '01'}
                      </span>
                      <svg 
                        className={`selector-arrow ${isDayOpen ? 'rotated' : ''}`}
                        width="12" 
                        height="12" 
                        viewBox="0 0 12 12" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M2 4L6 8L10 4" stroke="#535E51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    
                    {isDayOpen && (
                      <div className="selector-options">
                        {dayOptions.map((option) => (
                          <div 
                            key={option.value}
                            className={`selector-option ${option.value === dateSelectors.day ? 'selected' : ''}`}
                            onClick={() => handleDateChange('day', option.value)}
                          >
                            {option.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Месяц */}
                <div className="date-selector">
                  <label className="date-selector-label">
                    {currentLanguage === 'RU' ? 'Месяц' : currentLanguage === 'EN' ? 'Month' : 'Месяц'}
                  </label>
                  <div className={`custom-selector ${isMonthOpen ? 'open' : ''}`}>
                    <div 
                      className="selector-trigger"
                      onClick={() => handleDateSelectorClick('month')}
                    >
                      <span className="selector-value">
                        {monthOptions.find(opt => opt.value === dateSelectors.month)?.label || monthOptions[0].label}
                      </span>
                      <svg 
                        className={`selector-arrow ${isMonthOpen ? 'rotated' : ''}`}
                        width="12" 
                        height="12" 
                        viewBox="0 0 12 12" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M2 4L6 8L10 4" stroke="#535E51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    
                    {isMonthOpen && (
                      <div className="selector-options">
                        {monthOptions.map((option) => (
                          <div 
                            key={option.value}
                            className={`selector-option ${option.value === dateSelectors.month ? 'selected' : ''}`}
                            onClick={() => handleDateChange('month', option.value)}
                          >
                            {option.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Год */}
                <div className="date-selector">
                  <label className="date-selector-label">
                    {currentLanguage === 'RU' ? 'Год' : currentLanguage === 'EN' ? 'Year' : 'Год'}
                  </label>
                  <div className={`custom-selector ${isYearOpen ? 'open' : ''}`}>
                    <div 
                      className="selector-trigger"
                      onClick={() => handleDateSelectorClick('year')}
                    >
                      <span className="selector-value">
                        {yearOptions.find(opt => opt.value === dateSelectors.year)?.label || new Date().getFullYear().toString()}
                      </span>
                      <svg 
                        className={`selector-arrow ${isYearOpen ? 'rotated' : ''}`}
                        width="12" 
                        height="12" 
                        viewBox="0 0 12 12" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M2 4L6 8L10 4" stroke="#535E51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    
                    {isYearOpen && (
                      <div className="selector-options">
                        {yearOptions.map((option) => (
                          <div 
                            key={option.value}
                            className={`selector-option ${option.value === dateSelectors.year ? 'selected' : ''}`}
                            onClick={() => handleDateChange('year', option.value)}
                          >
                            {option.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {errors.birthdate && <div className="error-message birthdate-error">{errors.birthdate}</div>}
            </div>
            
            <div className="form-group">
              <div className={`custom-gender-dropdown ${errors.gender ? 'error' : ''}`}>
                <div 
                  className={`gender-dropdown-trigger ${isGenderDropdownOpen ? 'active' : ''}`}
                  onClick={handleGenderDropdownToggle}
                >
                  <span className={formData.gender ? 'selected' : 'placeholder'}>
                    {formData.gender ? 
                      (formData.gender === 'male' ? t('genderMale') : t('genderFemale')) : 
                      t('genderPlaceholder')
                    }
                  </span>
                  <svg 
                    className={`dropdown-arrow-gender ${isGenderDropdownOpen ? 'rotated' : ''}`}
                    width="12" 
                    height="12" 
                    viewBox="0 0 12 12" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M2 4L6 8L10 4" stroke="#535E51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                
                {isGenderDropdownOpen && (
                  <div className="gender-dropdown-options">
                    <div 
                      className="gender-dropdown-option"
                      onClick={() => handleGenderSelect('male')}
                    >
                      {t('genderMale')}
                    </div>
                    <div 
                      className="gender-dropdown-option"
                      onClick={() => handleGenderSelect('female')}
                    >
                      {t('genderFemale')}
                    </div>
                  </div>
                )}
              </div>
              {errors.gender && <div className="error-message">{errors.gender}</div>}
            </div>
          </>
        )
      
      default:
        return null
    }
  }

  const renderButtons = () => {
    return (
      <div className="button-group">
        {currentStep > 1 && (
          <button 
            type="button" 
            className="auth-back-button"
            onClick={handleBack}
            disabled={isLoading}
          >
            {t('backButton')}
          </button>
        )}
        <button 
          type="button"
          className="auth-submit-button"
          onClick={currentStep === 3 ? handleSubmit : handleNext}
          disabled={isLoading}
        >
          {isLoading ? '...' : (currentStep === 3 ? t('registerButton') : t('nextButton'))}
        </button>
      </div>
    )
  }

  const renderAuthLink = () => {
    return (
      <div className="auth-register-link">
        {t('hasAccountText')} <Link to="/auth" className="register-link">{t('loginLink')}</Link>
      </div>
    )
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
            <h1 className="auth-title">{t('registerTitle')}</h1>
            
            <form className="auth-form" noValidate>
              <div className="form-fields-container">
                {renderStepContent()}
              </div>
              
              {renderButtons()}
              {renderAuthLink()}
            </form>
          </div>

          <div className="right-section">
            {/* Случайная фраза над деревом */}
            <div className="registration-phrase-bubble">
              <div className="registration-phrase-text">
                {registrationPhrase}
              </div>
            </div>
            
            <div className="video-block">
              <img 
                src={treeImages[currentStep - 1]} 
                alt={`Tree growth stage ${currentStep}`}
                className="tree-image"
              />
            </div>
            
            <div className="random-phrase">
              {getStepText()}
            </div>
          </div>
        </div>

        {/* Условия использования в низу белого блока */}
        <div className="terms-section-bottom">
          <p className="terms-text-bottom">
            {t('termsText')} <Link to="/terms" state={{ from: '/register' }} className="terms-link-bottom">{t('termsOfService')}</Link>
            <br />
            <Link to="/privacy" state={{ from: '/register' }} className="terms-link-bottom">{t('privacyPolicy')}</Link>.
          </p>
        </div>
      </div>

      {/* Модальное окно ошибки */}
      {showErrorModal && (
        <div className="error-modal-overlay">
          <div className="error-modal">
            <div className="error-modal-header">
              <h3>{t('registrationErrorTitle')}</h3>
              <button 
                className="error-modal-close"
                onClick={handleErrorModalClose}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <div className="error-modal-body">
              <p>{errorMessage}</p>
            </div>
            <div className="error-modal-footer">
              <button 
                className="error-modal-button"
                onClick={handleErrorModalClose}
              >
                {t('errorModalOk')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно успешной регистрации */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-modal-header">
              <h3>Регистрация успешна!</h3>
            </div>
            <div className="success-modal-body">
              <p>Вы успешно зарегистрированы и авторизованы!</p>
            </div>
            <div className="success-modal-footer">
              <button 
                className="success-modal-button"
                onClick={handleSuccessModalClose}
              >
                Перейти на главную
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegisterPage