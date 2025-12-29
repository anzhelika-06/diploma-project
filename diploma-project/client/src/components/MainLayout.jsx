import { useState } from 'react'
import './MainLayout.css'
import logoIcon from '../assets/images/logo-icon.png'

const MainLayout = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('RU')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const languages = ['RU', 'EN', 'BY']
  const availableLanguages = languages.filter(lang => lang !== selectedLanguage)

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language)
    setIsDropdownOpen(false)
  }

  return (
    <div className="main-container">
      {/* Основная карточка с фиксированным размером */}
      <div className="main-card">
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
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="selected-language">{selectedLanguage}</span>
                <span className="dropdown-arrow">▽</span>
                {isDropdownOpen && (
                  <div className="dropdown-options">
                    {availableLanguages.map(language => (
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
            Уменьшите свой углеродный след
          </h1>
          <p className="main-subtitle">
            Отслеживайте, соревнуйтесь<br />
            и меняйте ситуацию к лучшему
          </p>
          
          <div className="action-buttons">
            <button className="btn primary-btn">Демо-калькулятор</button>
            <button className="btn secondary-btn">Войти</button>
          </div>
        </main>

        {/* Футер с ссылками */}
        <footer className="footer">
          <div className="footer-links">
            <a href="#about" className="footer-link">Подробнее о нас</a>
            <a href="#register" className="footer-link">Зарегистрироваться</a>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default MainLayout