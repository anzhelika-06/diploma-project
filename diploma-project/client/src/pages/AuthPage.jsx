import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/components/AuthPage.css'

const AuthPage = ({ translations, currentLanguage, onLanguageChange }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isLogin) {
      // Логика входа
      console.log('Вход:', { email: formData.email, password: formData.password })
    } else {
      // Логика регистрации
      if (formData.password !== formData.confirmPassword) {
        alert('Пароли не совпадают')
        return
      }
      console.log('Регистрация:', formData)
    }
  }

  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: ''
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-container">
          {/* Заголовок с логотипом и языковым селектором */}
          <div className="auth-header">
            <Link to="/" className="auth-logo-link">
              <div className="auth-logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="#7cb342"/>
                  <path d="M12 16C15.31 16 18 13.31 18 10C18 6.69 15.31 4 12 4C8.69 4 6 6.69 6 10C6 13.31 8.69 16 12 16Z" fill="#7cb342" fillOpacity="0.3"/>
                </svg>
                <span className="auth-logo-text">EcoSteps</span>
              </div>
            </Link>
            
            {/* Языковой селектор */}
            <div className="auth-language-selector">
              <select 
                value={currentLanguage} 
                onChange={(e) => onLanguageChange(e.target.value)}
                className="auth-language-select"
              >
                <option value="ru">RU</option>
                <option value="en">EN</option>
                <option value="by">BY</option>
              </select>
            </div>
          </div>

          {/* Форма авторизации */}
          <div className="auth-form-container">
            <h1 className="auth-title">
              {isLogin ? translations.loginTitle : translations.registerTitle}
            </h1>
            
            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="name">{translations.nameLabel}</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={translations.namePlaceholder}
                    required={!isLogin}
                  />
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="email">{translations.emailLabel}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={translations.emailPlaceholder}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">{translations.passwordLabel}</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={translations.passwordPlaceholder}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">{translations.confirmPasswordLabel}</label>
                  <div className="password-input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder={translations.confirmPasswordPlaceholder}
                      required={!isLogin}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
              )}
              
              <button type="submit" className="auth-submit-button">
                {isLogin ? translations.loginButton : translations.registerButton}
              </button>
            </form>
            
            <div className="auth-switch">
              <p>
                {isLogin ? translations.noAccountText : translations.hasAccountText}
                <button 
                  type="button" 
                  className="auth-switch-button"
                  onClick={toggleAuthMode}
                >
                  {isLogin ? translations.registerLink : translations.loginLink}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage