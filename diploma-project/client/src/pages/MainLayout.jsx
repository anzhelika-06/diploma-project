import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/pages/MainLayout.css'
import logoIcon from '../assets/images/logo-icon.png'
import { availableLanguages } from '../utils/translations'
import { applyTheme, getSavedTheme } from '../utils/themeManager'
import { useLanguage } from '../contexts/LanguageContext'
import DemoCalculator from '../components/DemoCalculator'

const MainLayout = () => {
  const { currentLanguage, changeLanguage, t } = useLanguage()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [shakeCalculator, setShakeCalculator] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('light')
  
  // Обновляем локальное состояние при изменении пропсов
  useEffect(() => {
    // Применяем тему при загрузке
    const savedTheme = getSavedTheme()
    applyTheme(savedTheme)
    setCurrentTheme(savedTheme)
  }, [])
  
  // Фильтруем доступные языки, исключая текущий выбранный
  const languageOptions = availableLanguages.filter(lang => lang !== currentLanguage)

  // Закрытие списка при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.language-selector')) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isDropdownOpen])
  const handleLanguageSelect = async (language) => {
    if (isCalculatorOpen) {
      triggerShake()
      return
    }
    await changeLanguage(language)
    setIsDropdownOpen(false)
  }

  const handleOpenCalculator = () => {
    setIsCalculatorOpen(true)
  }

  const handleCloseCalculator = () => {
    setIsCalculatorOpen(false)
    setShakeCalculator(false)
  }

  const triggerShake = () => {
    setShakeCalculator(true)
    setTimeout(() => setShakeCalculator(false), 500)
  }

  const handleBlockedClick = (e) => {
    if (isCalculatorOpen) {
      e.preventDefault()
      triggerShake()
    }
  }

  // Получаем переводы для текущего языка
  // const t = propTranslations || translations[selectedLanguage]

  return (
    <div className="main-container" data-theme={currentTheme}>
      {/* Основная карточка с фиксированным размером */}
      <div className="main-card" data-theme={currentTheme}>
        {/* Хедер с логотипом и навигацией */}
        <header className="header">
          <div className="logo-section">
            <div className="logo">
              <img src={logoIcon} alt="EcoSteps" className="logo-icon" />
              <span className="logo-text">EcoSteps</span>
            </div>
          </div>
          
          <div className="header-controls">
            <div className="language-selector">
              <div 
                className="custom-select"
                onClick={() => {
                  if (isCalculatorOpen) {
                    triggerShake()
                    return
                  }
                  setIsDropdownOpen(!isDropdownOpen)
                }}
              >
                <span className="selected-language">{currentLanguage}</span>
                <svg className="dropdown-arrow" width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" fill="#222222"/>
                </svg>
                {isDropdownOpen && (
                  <div className="dropdown-options">
                    {languageOptions.map(language => (
                      <div
                        key={language}
                        className="dropdown-option"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLanguageSelect(language)
                        }}
                      >
                        {language}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Основной контент */}
        <main className="main-content">
          <h1 className="main-title">
            {t('mainTitle')}
          </h1>
          <p className="main-subtitle">
            {t('mainSubtitle').split('\n').map((line, index) => (
              <span key={index}>
                {line}
                {index < t('mainSubtitle').split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
          
          <div className="action-buttons">
            <button className="btn primary-btn" onClick={handleOpenCalculator}>
              {t('demoButton')}
            </button>
            <Link to="/auth" className="btn secondary-btn">
              {t('loginButton')}
            </Link>
          </div>
        </main>

        {/* Футер с ссылками */}
        <footer className="footer">
          <div className="footer-links">
            <Link to="/about" className="footer-link">
              {t('aboutLink')}
            </Link>
            <Link to="/register" className="footer-link">
              {t('registerLink')}
            </Link>
          </div>
        </footer>
      </div>

      {/* Модальное окно калькулятора */}
      <DemoCalculator 
        isOpen={isCalculatorOpen}
        onClose={handleCloseCalculator}
        shake={shakeCalculator}
        onShake={triggerShake}
      />
    </div>
  )
}

export default MainLayout