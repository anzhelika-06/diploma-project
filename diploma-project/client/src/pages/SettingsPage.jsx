import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import EcoTipCard from '../components/EcoTipCard'
import { applyTheme, getSavedTheme, THEMES, getThemeDisplayName } from '../utils/themeManager'
import '../styles/pages/SettingsPage.css'

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('appearance')
  const [user, setUser] = useState(null)
  const [settings, setSettings] = useState({
    theme: getSavedTheme(),
    language: 'RU',
    notifications: true,
    ecoTips: true,
    emailNotifications: true,
    pushNotifications: false,
    privacyLevel: 1
  })
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showFaqModal, setShowFaqModal] = useState(false)
  const [currentTip, setCurrentTip] = useState(null)
  const [loadingTip, setLoadingTip] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'suggestion',
    subject: '',
    message: ''
  })

  useEffect(() => {
    loadUserData()
    loadUserSettings()
    loadDailyTip()
  }, [])

  const loadUserData = () => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }

  const loadUserSettings = async () => {
    try {
      setIsLoading(true)
      const userData = localStorage.getItem('user')
      if (!userData) {
        // Если пользователь не авторизован, используем настройки из localStorage
        const savedSettings = localStorage.getItem('appSettings')
        if (savedSettings) {
          const localSettings = JSON.parse(savedSettings)
          setSettings({
            theme: localSettings.theme || getSavedTheme(),
            language: localSettings.language || 'RU',
            notifications: localSettings.notifications !== undefined ? localSettings.notifications : true,
            ecoTips: localSettings.ecoTips !== undefined ? localSettings.ecoTips : true,
            emailNotifications: localSettings.emailNotifications !== undefined ? localSettings.emailNotifications : true,
            pushNotifications: localSettings.pushNotifications !== undefined ? localSettings.pushNotifications : false,
            privacyLevel: localSettings.privacyLevel || 1
          })
        }
        setIsLoading(false)
        return
      }

      const user = JSON.parse(userData)
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/user-settings', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          setSettings(data.settings)
          // Применяем тему через новую систему
          applyTheme(data.settings.theme)
        }
      } else {
        console.error('Ошибка загрузки настроек:', response.status)
        // Fallback к localStorage
        const savedSettings = localStorage.getItem('appSettings')
        if (savedSettings) {
          const localSettings = JSON.parse(savedSettings)
          setSettings(prev => ({ ...prev, ...localSettings }))
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error)
      // Fallback к localStorage
      const savedSettings = localStorage.getItem('appSettings')
      if (savedSettings) {
        const localSettings = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...localSettings }))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async (newSettings) => {
    try {
      const userData = localStorage.getItem('user')
      
      // Всегда сохраняем в localStorage для быстрого доступа
      localStorage.setItem('appSettings', JSON.stringify(newSettings))
      setSettings(newSettings)

      // Если пользователь авторизован, сохраняем в БД
      if (userData) {
        const user = JSON.parse(userData)
        const response = await fetch('/api/user-settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString()
          },
          body: JSON.stringify(newSettings)
        })

        if (!response.ok) {
          console.error('Ошибка сохранения настроек в БД:', response.status)
          // Настройки уже сохранены в localStorage, продолжаем работу
        }
      }
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error)
      // Настройки уже сохранены в localStorage, продолжаем работу
    }
  }

  const handleThemeChange = (theme) => {
    const newSettings = { ...settings, theme }
    setSettings(newSettings)
    saveSettings(newSettings)
    
    // Используем новую систему управления темами
    applyTheme(theme)
  }

  const handleLanguageChange = (language) => {
    const newSettings = { ...settings, language }
    saveSettings(newSettings)
    // Здесь можно добавить логику смены языка интерфейса
  }

  const handleNotificationToggle = (type) => {
    const newSettings = { ...settings, [type]: !settings[type] }
    saveSettings(newSettings)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    // Оставляем настройки в localStorage для следующего входа
    window.location.href = '/'
  }

  const handleDeleteAccount = async () => {
    try {
      // Здесь будет API запрос на удаление аккаунта
      alert('Функция удаления аккаунта будет реализована позже')
      setShowDeleteModal(false)
    } catch (error) {
      console.error('Ошибка удаления аккаунта:', error)
      alert('Ошибка при удалении аккаунта')
    }
  }

  const handleResetPassword = async () => {
    try {
      // Здесь будет API запрос на сброс пароля
      alert('Ссылка для сброса пароля отправлена на ваш email')
      setShowResetPasswordModal(false)
    } catch (error) {
      console.error('Ошибка сброса пароля:', error)
      alert('Ошибка при сбросе пароля')
    }
  }

  const handleClearCache = () => {
    localStorage.removeItem('appCache')
    sessionStorage.clear()
    // Очищаем кэш браузера если возможно
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name)
        })
      })
    }
    alert('Кэш успешно очищен!')
  }

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    try {
      // Здесь будет API запрос отправки обратной связи
      console.log('Отправка обратной связи:', feedbackForm)
      alert('Спасибо за обратную связь! Мы рассмотрим ваше сообщение.')
      setFeedbackForm({ type: 'suggestion', subject: '', message: '' })
      setShowFeedbackModal(false)
    } catch (error) {
      console.error('Ошибка отправки обратной связи:', error)
      alert('Ошибка при отправке сообщения')
    }
  }

  const loadDailyTip = async () => {
    try {
      console.log('Загружаем совет дня...')
      const response = await fetch('/api/eco-tips/daily')
      console.log('Ответ сервера:', response.status)
      
      if (response.ok) {
        const tip = await response.json()
        console.log('Получен совет:', tip)
        setCurrentTip(tip)
      } else {
        console.error('Ошибка ответа сервера:', response.status)
        // Устанавливаем тестовый совет если API не работает
        setCurrentTip({
          id: 1,
          title: 'Замените лампочки на LED',
          content: 'LED-лампы потребляют на 80% меньше энергии и служат в 25 раз дольше обычных. Одна замена экономит до 40 кг CO₂ в год.',
          category: 'Энергия',
          difficulty: 'easy',
          co2_impact: 40000,
          day_of_year: 1
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки совета дня:', error)
      // Устанавливаем тестовый совет при ошибке
      setCurrentTip({
        id: 1,
        title: 'Замените лампочки на LED',
        content: 'LED-лампы потребляют на 80% меньше энергии и служат в 25 раз дольше обычных. Одна замена экономит до 40 кг CO₂ в год.',
        category: 'Энергия',
        difficulty: 'easy',
        co2_impact: 40000,
        day_of_year: 1
      })
    }
  }

  const loadRandomTip = async () => {
    try {
      setLoadingTip(true)
      console.log('Загружаем случайный совет...')
      const response = await fetch('/api/eco-tips/random')
      
      if (response.ok) {
        const tip = await response.json()
        console.log('Получен случайный совет:', tip)
        setCurrentTip(tip)
      } else {
        console.error('Ошибка загрузки случайного совета:', response.status)
      }
    } catch (error) {
      console.error('Ошибка загрузки случайного совета:', error)
    } finally {
      setLoadingTip(false)
    }
  }

  const tabs = [
    { id: 'appearance', label: 'Внешний вид', icon: 'palette' },
    { id: 'notifications', label: 'Уведомления', icon: 'notifications' },
    { id: 'privacy', label: 'Конфиденциальность', icon: 'security' },
    { id: 'account', label: 'Аккаунт', icon: 'account_circle' },
    { id: 'support', label: 'Поддержка', icon: 'help' }
  ]

  const languages = [
    { code: 'RU', name: 'Русский' },
    { code: 'BY', name: 'Беларуская' },
    { code: 'EN', name: 'English' }
  ]

  const faqItems = [
    {
      question: 'Как рассчитывается экономия CO₂?',
      answer: 'Расчет основан на научных данных о выбросах различных видов деятельности. Например, поездка на велосипеде вместо автомобиля экономит примерно 2.6 кг CO₂ на 10 км.'
    },
    {
      question: 'Как изменить свой эко-уровень?',
      answer: 'Эко-уровень повышается автоматически при накоплении определенного количества сэкономленного CO₂ и выполнении эко-действий.'
    },
    {
      question: 'Можно ли удалить историю успеха?',
      answer: 'Да, вы можете удалить свои истории успеха в разделе "Мои истории" в личном кабинете.'
    },
    {
      question: 'Как работают команды?',
      answer: 'Команды позволяют объединяться с единомышленниками для достижения общих эко-целей. Вы можете создать команду или присоединиться к существующей.'
    },
    {
      question: 'Безопасны ли мои данные?',
      answer: 'Мы используем современные методы шифрования и не передаем ваши данные третьим лицам. Подробнее в политике конфиденциальности.'
    }
  ]

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Настройки</h1>
        
        {/* Вкладки сверху */}
        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="material-icons tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Содержимое вкладок */}
        <div className="settings-content">
          
          {/* Внешний вид */}
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h2>Внешний вид и интерфейс</h2>
              
              <div className="setting-group">
                <h3>Тема оформления</h3>
                <p className="setting-description">Выберите светлую или темную тему интерфейса</p>
                <div className="theme-options">
                  <button
                    className={`theme-btn ${settings.theme === THEMES.LIGHT ? 'active' : ''}`}
                    onClick={() => handleThemeChange(THEMES.LIGHT)}
                  >
                    <span className="material-icons theme-icon">light_mode</span>
                    <span className="theme-name">{getThemeDisplayName(THEMES.LIGHT, 'RU')}</span>
                    <span className="theme-description">Классический светлый интерфейс</span>
                  </button>
                  <button
                    className={`theme-btn ${settings.theme === THEMES.DARK ? 'active' : ''}`}
                    onClick={() => handleThemeChange(THEMES.DARK)}
                  >
                    <span className="material-icons theme-icon">dark_mode</span>
                    <span className="theme-name">{getThemeDisplayName(THEMES.DARK, 'RU')}</span>
                    <span className="theme-description">Темный режим для комфорта глаз</span>
                  </button>
                </div>
              </div>

              <div className="setting-group">
                <h3>Язык интерфейса</h3>
                <p className="setting-description">Выберите предпочитаемый язык приложения</p>
                <div className="language-options">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      className={`language-btn ${settings.language === lang.code ? 'active' : ''}`}
                      onClick={() => handleLanguageChange(lang.code)}
                    >
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Уведомления */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Уведомления и рассылки</h2>
              
              <div className="setting-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Общие уведомления</h3>
                    <p>Получать уведомления о новых функциях, обновлениях и важных событиях</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={() => handleNotificationToggle('notifications')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Ежедневные эко-советы</h3>
                    <p>Получать полезные советы по экологии каждый день. Более 365 уникальных советов!</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.ecoTips}
                      onChange={() => handleNotificationToggle('ecoTips')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Email уведомления</h3>
                    <p>Получать важные уведомления на электронную почту</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={() => handleNotificationToggle('emailNotifications')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Push уведомления</h3>
                    <p>Получать мгновенные уведомления в браузере</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications}
                      onChange={() => handleNotificationToggle('pushNotifications')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* Превью эко-совета */}
              {settings.ecoTips && (
                <div className="notification-preview">
                  <div className="preview-header">
                    <h3>Пример эко-совета дня:</h3>
                    <button 
                      className="refresh-tip-btn"
                      onClick={loadRandomTip}
                      disabled={loadingTip}
                    >
                      <span className="material-icons">{loadingTip ? 'hourglass_empty' : 'refresh'}</span>
                      Другой совет
                    </button>
                  </div>
                  
                  {currentTip ? (
                    <EcoTipCard tip={currentTip} showActions={true} isPreview={true} />
                  ) : (
                    <div className="tip-placeholder">
                      <div className="placeholder-icon">
                        <span className="material-icons">eco</span>
                      </div>
                      <p>Загружаем совет дня...</p>
                      <button onClick={loadDailyTip} className="retry-btn">
                        Попробовать снова
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Конфиденциальность */}
          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h2>Конфиденциальность и безопасность</h2>
              
              <div className="setting-group">
                <div className="privacy-item">
                  <div className="privacy-icon">
                    <span className="material-icons">vpn_key</span>
                  </div>
                  <div className="privacy-content">
                    <h3>Сброс пароля</h3>
                    <p>Изменить пароль для входа в систему. Ссылка будет отправлена на ваш email.</p>
                    <button 
                      className="action-btn secondary"
                      onClick={() => setShowResetPasswordModal(true)}
                    >
                      <span className="material-icons">vpn_key</span>
                      Сбросить пароль
                    </button>
                  </div>
                </div>

                <div className="privacy-item">
                  <div className="privacy-icon">
                    <span className="material-icons">description</span>
                  </div>
                  <div className="privacy-content">
                    <h3>Политика конфиденциальности</h3>
                    <p>Ознакомьтесь с тем, как мы собираем, используем и защищаем ваши данные</p>
                    <Link to="/privacy" className="action-btn secondary">
                      <span className="material-icons">description</span>
                      Читать политику
                    </Link>
                  </div>
                </div>

                <div className="privacy-item">
                  <div className="privacy-icon">
                    <span className="material-icons">assignment</span>
                  </div>
                  <div className="privacy-content">
                    <h3>Условия использования</h3>
                    <p>Правила и условия использования приложения EcoSteps</p>
                    <Link to="/terms" className="action-btn secondary">
                      <span className="material-icons">assignment</span>
                      Читать условия
                    </Link>
                  </div>
                </div>

                <div className="privacy-item">
                  <div className="privacy-icon">
                    <span className="material-icons">shield</span>
                  </div>
                  <div className="privacy-content">
                    <h3>Безопасность данных</h3>
                    <p>Ваши данные защищены современными методами шифрования и не передаются третьим лицам</p>
                    <div className="security-badges">
                      <span className="security-badge">
                        <span className="material-icons">lock</span>
                        SSL шифрование
                      </span>
                      <span className="security-badge">
                        <span className="material-icons">shield</span>
                        GDPR совместимость
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Аккаунт */}
          {activeTab === 'account' && (
            <div className="settings-section">
              <h2>Управление аккаунтом</h2>
              
              <div className="setting-group">
                <div className="account-item">
                  <div className="account-icon">
                    <span className="material-icons">cleaning_services</span>
                  </div>
                  <div className="account-content">
                    <h3>Очистка кэша</h3>
                    <p>Очистить временные файлы, данные приложения и кэш браузера для улучшения производительности</p>
                    <button className="action-btn secondary" onClick={handleClearCache}>
                      <span className="material-icons">cleaning_services</span>
                      Очистить кэш
                    </button>
                  </div>
                </div>

                <div className="account-item">
                  <div className="account-icon">
                    <span className="material-icons">download</span>
                  </div>
                  <div className="account-content">
                    <h3>Экспорт данных</h3>
                    <p>Скачать все ваши данные в формате JSON</p>
                    <button className="action-btn secondary">
                      <span className="material-icons">download</span>
                      Экспортировать данные
                    </button>
                  </div>
                </div>

                <div className="account-item danger-zone">
                  <div className="account-icon">
                    <span className="material-icons">logout</span>
                  </div>
                  <div className="account-content">
                    <h3>Выход из системы</h3>
                    <p>Завершить текущую сессию и выйти из аккаунта</p>
                    <button 
                      className="action-btn secondary"
                      onClick={() => setShowLogoutModal(true)}
                    >
                      <span className="material-icons">logout</span>
                      Выйти из системы
                    </button>
                  </div>
                </div>

                <div className="account-item danger-zone">
                  <div className="account-icon">
                    <span className="material-icons">delete_forever</span>
                  </div>
                  <div className="account-content">
                    <h3>Удаление аккаунта</h3>
                    <p>Безвозвратно удалить аккаунт и все связанные данные. Это действие нельзя отменить!</p>
                    <button 
                      className="action-btn danger"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      <span className="material-icons">delete_forever</span>
                      Удалить аккаунт
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Поддержка */}
          {activeTab === 'support' && (
            <div className="settings-section">
              <h2>Поддержка и помощь</h2>
              
              <div className="setting-group">
                <div className="support-item">
                  <div className="support-icon">
                    <span className="material-icons">help</span>
                  </div>
                  <div className="support-content">
                    <h3>FAQ / Часто задаваемые вопросы</h3>
                    <p>Ответы на популярные вопросы пользователей о работе с приложением</p>
                    <button 
                      className="action-btn secondary"
                      onClick={() => setShowFaqModal(true)}
                    >
                      <span className="material-icons">help</span>
                      Открыть FAQ
                    </button>
                  </div>
                </div>

                <div className="support-item">
                  <div className="support-icon">
                    <span className="material-icons">contact_support</span>
                  </div>
                  <div className="support-content">
                    <h3>Связаться с поддержкой</h3>
                    <p>Отправить сообщение команде поддержки или сообщить о проблеме</p>
                    <button 
                      className="action-btn secondary"
                      onClick={() => setShowFeedbackModal(true)}
                    >
                      <span className="material-icons">contact_support</span>
                      Написать в поддержку
                    </button>
                  </div>
                </div>

                <div className="support-item">
                  <div className="support-icon">
                    <span className="material-icons">info</span>
                  </div>
                  <div className="support-content">
                    <h3>О приложении</h3>
                    <p>Информация о версии, разработчиках и миссии EcoSteps</p>
                    <Link to="/about" className="action-btn secondary">
                      <span className="material-icons">info</span>
                      О приложении
                    </Link>
                  </div>
                </div>

                <div className="support-item">
                  <div className="support-icon">
                    <span className="material-icons">feedback</span>
                  </div>
                  <div className="support-content">
                    <h3>Обратная связь</h3>
                    <p>Поделитесь своим мнением о приложении, предложите улучшения</p>
                    <button 
                      className="action-btn secondary"
                      onClick={() => {
                        setFeedbackForm({...feedbackForm, type: 'feedback'})
                        setShowFeedbackModal(true)
                      }}
                    >
                      <span className="material-icons">feedback</span>
                      Оставить отзыв
                    </button>
                  </div>
                </div>

                <div className="support-item">
                  <div className="support-icon">
                    <span className="material-icons">star_rate</span>
                  </div>
                  <div className="support-content">
                    <h3>Оценить приложение</h3>
                    <p>Помогите нам стать лучше - оставьте оценку в магазине приложений</p>
                    <button className="action-btn secondary">
                      <span className="material-icons">star_rate</span>
                      Оценить приложение
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно выхода */}
      {showLogoutModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowLogoutModal(false)} />
          <div className="modal">
            <div className="modal-header">
              <h3>Выход из системы</h3>
              <button 
                className="modal-close"
                onClick={() => setShowLogoutModal(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p>Вы уверены, что хотите выйти из системы?</p>
              <p>Все несохраненные данные будут потеряны.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowLogoutModal(false)}
              >
                Отмена
              </button>
              <button 
                className="btn-danger"
                onClick={handleLogout}
              >
                Выйти
              </button>
            </div>
          </div>
        </>
      )}

      {/* Модальное окно удаления аккаунта */}
      {showDeleteModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)} />
          <div className="modal">
            <div className="modal-header">
              <h3>Удаление аккаунта</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Внимание!</strong> Это действие нельзя отменить.</p>
              <p>Будут безвозвратно удалены:</p>
              <ul>
                <li>Ваш профиль и все личные данные</li>
                <li>История активности и статистика</li>
                <li>Участие в командах</li>
                <li>Все ваши истории успеха</li>
                <li>Достижения и прогресс</li>
              </ul>
              <p><strong>Вы действительно хотите удалить аккаунт навсегда?</strong></p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Отмена
              </button>
              <button 
                className="btn-danger"
                onClick={handleDeleteAccount}
              >
                Удалить навсегда
              </button>
            </div>
          </div>
        </>
      )}

      {/* Модальное окно сброса пароля */}
      {showResetPasswordModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowResetPasswordModal(false)} />
          <div className="modal">
            <div className="modal-header">
              <h3>Сброс пароля</h3>
              <button 
                className="modal-close"
                onClick={() => setShowResetPasswordModal(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p>Мы отправим ссылку для сброса пароля на ваш email:</p>
              <p><strong>{user?.email}</strong></p>
              <p>Проверьте папку "Спам", если письмо не придет в течение нескольких минут.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowResetPasswordModal(false)}
              >
                Отмена
              </button>
              <button 
                className="btn-primary"
                onClick={handleResetPassword}
              >
                Отправить ссылку
              </button>
            </div>
          </div>
        </>
      )}

      {/* Модальное окно FAQ */}
      {showFaqModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowFaqModal(false)} />
          <div className="modal large">
            <div className="modal-header">
              <h3>Часто задаваемые вопросы</h3>
              <button 
                className="modal-close"
                onClick={() => setShowFaqModal(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="faq-list">
                {faqItems.map((item, index) => (
                  <div key={index} className="faq-item">
                    <h4>{item.question}</h4>
                    <p>{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowFaqModal(false)}
              >
                Закрыть
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  setShowFaqModal(false)
                  setShowFeedbackModal(true)
                }}
              >
                Задать вопрос
              </button>
            </div>
          </div>
        </>
      )}

      {/* Модальное окно обратной связи */}
      {showFeedbackModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)} />
          <div className="modal large">
            <div className="modal-header">
              <h3>Обратная связь</h3>
              <button 
                className="modal-close"
                onClick={() => setShowFeedbackModal(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleFeedbackSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Тип сообщения:</label>
                  <select 
                    value={feedbackForm.type}
                    onChange={(e) => setFeedbackForm({...feedbackForm, type: e.target.value})}
                    className="form-select"
                  >
                    <option value="suggestion">Предложение</option>
                    <option value="bug">Сообщить об ошибке</option>
                    <option value="feedback">Отзыв</option>
                    <option value="question">Вопрос</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Тема сообщения:</label>
                  <input 
                    type="text"
                    value={feedbackForm.subject}
                    onChange={(e) => setFeedbackForm({...feedbackForm, subject: e.target.value})}
                    placeholder="Кратко опишите суть сообщения"
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Сообщение:</label>
                  <textarea 
                    value={feedbackForm.message}
                    onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})}
                    placeholder="Подробно опишите ваше сообщение, предложение или проблему"
                    className="form-textarea"
                    rows="6"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                >
                  Отправить
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

export default SettingsPage