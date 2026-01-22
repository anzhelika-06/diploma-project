import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { applyTheme, getSavedTheme, THEMES, getThemeDisplayName } from '../utils/themeManager'
import { useLanguage } from '../contexts/LanguageContext'
import '../styles/pages/SettingsPage.css'

const SettingsPage = () => {
  const { currentLanguage, changeLanguage, t } = useLanguage()
  const [activeTab, setActiveTab] = useState('appearance')
  const [user, setUser] = useState(null)
  const [settings, setSettings] = useState({
    theme: getSavedTheme(),
    language: currentLanguage,
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
  const [showClearCacheModal, setShowClearCacheModal] = useState(false)
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'Природа',
    subject: '',
    message: '',
    co2Saved: ''
  })

  useEffect(() => {
    loadUserData()
    loadUserSettings()
  }, [])

  const loadUserData = () => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }

  const loadUserSettings = async () => {
  try {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token') // ДОБАВЛЯЕМ ПРОВЕРКУ НА ТОКЕН
    
    // ИСПРАВЛЯЕМ: проверяем и токен, и данные пользователя
    if (!userData || !token) {
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
      return
    }

    const user = JSON.parse(userData)
    
    // ПРОВЕРЯЕМ ЧТО У ПОЛЬЗОВАТЕЛЯ ЕСТЬ ID
    if (!user || !user.id) {
      console.error('У пользователя нет ID или неверные данные пользователя')
      // Используем настройки из localStorage
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
      return
    }
    
    // ОТПРАВЛЯЕМ userId В ЗАГОЛОВКЕ, КАК ОЖИДАЕТ БЭКЕНД
    const response = await fetch('/api/user-settings', {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user.id.toString()
      }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.settings) {
        setSettings(data.settings)
        // Применяем тему через новую систему
        applyTheme(data.settings.theme)
      }
    } else if (response.status === 404) {
      // Если настроек нет в БД, создаем их с дефолтными значениями
      await createDefaultSettings(user.id)
      loadUserSettings() // Загружаем заново
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
  }
} 
// Функция для создания настроек по умолчанию
const createDefaultSettings = async (userId) => {
  try {
    const response = await fetch('/api/user-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString()
      },
      body: JSON.stringify({
        theme: getSavedTheme(),
        language: currentLanguage,
        notifications: true,
        ecoTips: true,
        emailNotifications: true,
        pushNotifications: false,
        privacyLevel: 1
      })
    })
    
    if (!response.ok) {
      console.error('Ошибка создания настроек:', response.status)
    }
  } catch (error) {
    console.error('Ошибка создания настроек:', error)
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
          'X-User-Id': user.id.toString() // Используем правильный заголовок
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
  // При смене темы в настройках сохраняем в БД (skipSave: false по умолчанию)
  applyTheme(theme)
}

  const handleLanguageChange = async (language) => {
    try {
      const newSettings = { ...settings, language }
      setSettings(newSettings)
      
      // Сохраняем настройки локально
      localStorage.setItem('appSettings', JSON.stringify(newSettings))
      
      // Пытаемся сохранить в БД
      await saveSettings(newSettings)
      
      // Используем новую систему смены языка
      await changeLanguage(language)
    } catch (error) {
      console.error('Ошибка при смене языка:', error)
      // Показываем пользователю сообщение об ошибке если нужно
    }
  }

  const handleNotificationToggle = (type) => {
    const newSettings = { ...settings, [type]: !settings[type] }
    saveSettings(newSettings)
  }

  const handleLogout = () => {
    // Сохраняем текущую тему перед выходом
    const currentTheme = settings.theme
    
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    
    // Сохраняем настройки в localStorage для следующего входа (включая тему)
    const settingsToKeep = {
      theme: currentTheme,
      language: settings.language,
      notifications: settings.notifications,
      ecoTips: settings.ecoTips,
      emailNotifications: settings.emailNotifications,
      pushNotifications: settings.pushNotifications,
      privacyLevel: settings.privacyLevel
    }
    localStorage.setItem('appSettings', JSON.stringify(settingsToKeep))
    
    // Применяем текущую тему (она должна остаться такой же)
    applyTheme(currentTheme)
    
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
    // Очищаем localStorage (кроме важных данных пользователя)
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    const appSettings = localStorage.getItem('appSettings')
    
    localStorage.clear()
    
    // Восстанавливаем важные данные
    if (userData) localStorage.setItem('user', userData)
    if (token) localStorage.setItem('token', token)
    if (appSettings) localStorage.setItem('appSettings', appSettings)
    
    // Очищаем sessionStorage
    sessionStorage.clear()
    
    // Очищаем кэш браузера если возможно
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name)
        })
      })
    }
    
    setShowClearCacheModal(false)
    alert('Кэш успешно очищен!')
  }

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    try {
      // Здесь будет API запрос отправки обратной связи
      console.log('Отправка обратной связи:', feedbackForm)
      alert('Спасибо за обратную связь! Мы рассмотрим ваше сообщение.')
      setFeedbackForm({ type: 'Природа', subject: '', message: '', co2Saved: '' })
      setShowFeedbackModal(false)
    } catch (error) {
      console.error('Ошибка отправки обратной связи:', error)
      alert('Ошибка при отправке сообщения')
    }
  }

  const tabs = [
    { id: 'appearance', label: t('settingsAppearance') || 'Внешний вид', icon: 'palette' },
    { id: 'notifications', label: t('settingsNotifications') || 'Уведомления', icon: 'notifications' },
    { id: 'privacy', label: t('settingsPrivacy') || 'Конфиденциальность', icon: 'security' },
    { id: 'account', label: t('settingsAccount') || 'Аккаунт', icon: 'account_circle' },
    { id: 'support', label: t('settingsSupport') || 'Поддержка', icon: 'help' }
  ]

  const languages = [
    { code: 'RU', name: t('languageRussian') || 'Русский' },
    { code: 'BY', name: t('languageBelarusian') || 'Беларуская' },
    { code: 'EN', name: t('languageEnglish') || 'English' }
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
        <h1 className="settings-title">{t('settingsTitle')}</h1>
        
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
              <h2>{t('appearanceTitle')}</h2>
              
              <div className="setting-group">
                <h3>{t('themeSelectionTitle')}</h3>
                <p className="setting-description">{t('themeSelectionDescription')}</p>
                <div className="theme-options">
                  <button
                    className={`theme-card ${settings.theme === THEMES.LIGHT ? 'active' : ''}`}
                    onClick={() => handleThemeChange(THEMES.LIGHT)}
                  >
                    <span className="material-icons theme-icon light-theme-icon">light_mode</span>
                    <span className="theme-name">{getThemeDisplayName(THEMES.LIGHT, currentLanguage)}</span>
                    <span className="theme-description">{t('lightThemeDescription')}</span>
                  </button>
                  <button
                    className={`theme-card ${settings.theme === THEMES.DARK ? 'active' : ''}`}
                    onClick={() => handleThemeChange(THEMES.DARK)}
                  >
                    <span className="material-icons theme-icon dark-theme-icon">dark_mode</span>
                    <span className="theme-name">{getThemeDisplayName(THEMES.DARK, currentLanguage)}</span>
                    <span className="theme-description">{t('darkThemeDescription')}</span>
                  </button>
                </div>
              </div>

              <div className="setting-group">
                <h3>{t('languageSelectionTitle')}</h3>
                <p className="setting-description">{t('languageSelectionDescription')}</p>
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
              <h2>{t('notificationsTitle')}</h2>
              
              <div className="setting-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>{t('generalNotifications')}</h3>
                    <p>{t('generalNotificationsDesc')}</p>
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
                    <h3>{t('dailyEcoTips')}</h3>
                    <p>{t('dailyEcoTipsDesc')}</p>
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
                    <h3>{t('emailNotifications')}</h3>
                    <p>{t('emailNotificationsDesc')}</p>
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
                    <h3>{t('pushNotifications')}</h3>
                    <p>{t('pushNotificationsDesc')}</p>
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
            </div>
          )}

          {/* Конфиденциальность */}
          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h2>{t('privacyTitle')}</h2>
              
              <div className="setting-group">
                <div className="privacy-item">
                  <div className="privacy-icon">
                    <span className="material-icons">vpn_key</span>
                  </div>
                  <div className="privacy-content">
                    <h3>{t('resetPassword')}</h3>
                    <p>{t('resetPasswordDesc')}</p>
                    <button 
                      className="action-btn secondary"
                      onClick={() => setShowResetPasswordModal(true)}
                    >
                      <span className="material-icons">vpn_key</span>
                      {t('resetPassword')}
                    </button>
                  </div>
                </div>

                <div className="privacy-item">
                  <div className="privacy-icon">
                    <span className="material-icons">description</span>
                  </div>
                  <div className="privacy-content">
                    <h3>{t('privacyPolicyTitle')}</h3>
                    <p>{t('privacyPolicyDesc')}</p>
                    <Link to="/privacy" state={{ from: '/settings' }} className="action-btn secondary">
                      <span className="material-icons">description</span>
                      {t('readPolicy')}
                    </Link>
                  </div>
                </div>

                <div className="privacy-item">
                  <div className="privacy-icon">
                    <span className="material-icons">assignment</span>
                  </div>
                  <div className="privacy-content">
                    <h3>{t('termsOfUseTitle')}</h3>
                    <p>{t('termsOfUseDesc')}</p>
                    <Link to="/terms" state={{ from: '/settings' }} className="action-btn secondary">
                      <span className="material-icons">assignment</span>
                      {t('readTerms')}
                    </Link>
                  </div>
                </div>

                <div className="privacy-item">
                  <div className="privacy-icon">
                    <span className="material-icons">shield</span>
                  </div>
                  <div className="privacy-content">
                    <h3>{t('dataSecurity')}</h3>
                    <p>{t('dataSecurityDesc')}</p>
                    <div className="security-badges">
                      <span className="security-badge">
                        <span className="material-icons">lock</span>
                        {t('sslEncryption')}
                      </span>
                      <span className="security-badge">
                        <span className="material-icons">shield</span>
                        {t('gdprCompliance')}
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
              <h2>{t('accountManagement')}</h2>
              
              <div className="setting-group">
                <div className="account-item">
                  <div className="account-icon">
                    <span className="material-icons">cleaning_services</span>
                  </div>
                  <div className="account-content">
                    <h3>{t('clearCache')}</h3>
                    <p>{t('clearCacheDesc')}</p>
                    <button 
                      className="action-btn secondary" 
                      onClick={() => setShowClearCacheModal(true)}
                    >
                      <span className="material-icons">cleaning_services</span>
                      {t('clearCache')}
                    </button>
                  </div>
                </div>

                <div className="account-item">
                  <div className="account-icon">
                    <span className="material-icons">download</span>
                  </div>
                  <div className="account-content">
                    <h3>{t('exportData')}</h3>
                    <p>{t('exportDataDesc')}</p>
                    <button className="action-btn secondary">
                      <span className="material-icons">download</span>
                      {t('exportData')}
                    </button>
                  </div>
                </div>

                <div className="account-item danger-zone">
                  <div className="account-icon">
                    <span className="material-icons">logout</span>
                  </div>
                  <div className="account-content">
                    <h3>{t('logout')}</h3>
                    <p>{t('logoutDesc')}</p>
                    <button 
                      className="action-btn secondary"
                      onClick={() => setShowLogoutModal(true)}
                    >
                      <span className="material-icons">logout</span>
                      {t('logout')}
                    </button>
                  </div>
                </div>

                <div className="account-item danger-zone">
                  <div className="account-icon">
                    <span className="material-icons">delete_forever</span>
                  </div>
                  <div className="account-content">
                    <h3>{t('deleteAccount')}</h3>
                    <p>{t('deleteAccountDesc')}</p>
                    <button 
                      className="action-btn danger"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      <span className="material-icons">delete_forever</span>
                      {t('deleteAccount')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Поддержка */}
          {activeTab === 'support' && (
            <div className="settings-section">
              <h2>{t('supportTitle')}</h2>
              
              <div className="setting-group">
                <div className="support-item">
                  <div className="support-icon">
                    <span className="material-icons">help</span>
                  </div>
                  <div className="support-content">
                    <h3>{t('faqTitle')}</h3>
                    <p>{t('faqDesc')}</p>
                    <button 
                      className="action-btn secondary"
                      onClick={() => setShowFaqModal(true)}
                    >
                      <span className="material-icons">help</span>
                      {t('openFAQ')}
                    </button>
                  </div>
                </div>

                <div className="support-item">
                  <div className="support-icon">
                    <span className="material-icons">contact_support</span>
                  </div>
                  <div className="support-content">
                    <h3>{t('contactSupport')}</h3>
                    <p>{t('contactSupportDesc')}</p>
                    <button 
                      className="action-btn secondary"
                      onClick={() => setShowFeedbackModal(true)}
                    >
                      <span className="material-icons">contact_support</span>
                      {t('writeToSupport')}
                    </button>
                  </div>
                </div>

                <div className="support-item">
                  <div className="support-icon">
                    <span className="material-icons">info</span>
                  </div>
                  <div className="support-content">
                    <h3>{t('aboutApp')}</h3>
                    <p>{t('aboutAppDesc')}</p>
                    <Link to="/about" className="action-btn secondary">
                      <span className="material-icons">info</span>
                      {t('aboutApp')}
                    </Link>
                  </div>
                </div>

                <div className="support-item">
                  <div className="support-icon">
                    <span className="material-icons">auto_stories</span>
                  </div>
                  <div className="support-content">
                    <h3>{t('shareStory')}</h3>
                    <p>{t('shareStoryDesc')}</p>
                    <button 
                      className="action-btn secondary"
                      onClick={() => {
                        setFeedbackForm({...feedbackForm, type: 'Природа'})
                        setShowFeedbackModal(true)
                      }}
                    >
                      <span className="material-icons">auto_stories</span>
                      {t('tellStory')}
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
              <h3>{t('logoutModalTitle')}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowLogoutModal(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p>{t('logoutConfirm')}</p>
              <p>{t('logoutWarning')}</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowLogoutModal(false)}
              >
                {t('cancel')}
              </button>
              <button 
                className="btn-danger"
                onClick={handleLogout}
              >
                {t('logout')}
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
              <h3>{t('deleteAccountModalTitle')}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p><strong>{t('deleteWarning')}</strong></p>
              <p>{t('deleteWillRemove')}</p>
              <ul>
                <li>{t('deleteProfile')}</li>
                <li>{t('deleteHistory')}</li>
                <li>{t('deleteTeams')}</li>
                <li>{t('deleteStories')}</li>
                <li>{t('deleteAchievements')}</li>
              </ul>
              <p><strong>{t('deleteConfirm')}</strong></p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                {t('cancel')}
              </button>
              <button 
                className="btn-danger"
                onClick={handleDeleteAccount}
              >
                {t('deleteForever')}
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
                {t('sendLink')}
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
              <h3>{t('addStoryTitle')}</h3>
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
                  <label>{t('storyCategory')}</label>
                  <select 
                    value={feedbackForm.type}
                    onChange={(e) => setFeedbackForm({...feedbackForm, type: e.target.value})}
                    className="form-select"
                  >
                    <option value="Энергия">⚡ {t('categoryEnergy')}</option>
                    <option value="Вода">💧 {t('categoryWater')}</option>
                    <option value="Отходы">♻️ {t('categoryWaste')}</option>
                    <option value="Транспорт">🚲 {t('categoryTransport')}</option>
                    <option value="Питание">🍽️ {t('categoryFood')}</option>
                    <option value="Природа">🌿 {t('categoryNature')}</option>
                    <option value="Быт">🏠 {t('categoryHousehold')}</option>
                    <option value="Потребление">🛒 {t('categoryConsumption')}</option>
                    <option value="Планирование">📋 {t('categoryPlanning')}</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>{t('storyTitle')}</label>
                  <input 
                    type="text"
                    value={feedbackForm.subject}
                    onChange={(e) => setFeedbackForm({...feedbackForm, subject: e.target.value})}
                    placeholder={t('storyTitlePlaceholder')}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t('co2Saved')}</label>
                  <input 
                    type="number"
                    value={feedbackForm.co2Saved || ''}
                    onChange={(e) => setFeedbackForm({...feedbackForm, co2Saved: e.target.value})}
                    placeholder={t('co2SavedPlaceholder')}
                    className="form-input"
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('storyContent')}</label>
                  <textarea 
                    value={feedbackForm.message}
                    onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})}
                    placeholder={t('storyContentPlaceholder')}
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
                  {t('cancel')}
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                >
                  {t('addToStories')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Модальное окно очистки кэша */}
      {showClearCacheModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowClearCacheModal(false)} />
          <div className="modal">
            <div className="modal-header">
              <h3>Очистка кэша</h3>
              <button 
                className="modal-close"
                onClick={() => setShowClearCacheModal(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Вы уверены, что хотите очистить кэш?</strong></p>
              <p>Будут удалены:</p>
              <ul>
                <li>Временные файлы приложения</li>
                <li>Кэшированные данные</li>
                <li>Данные сессии</li>
                <li>Кэш браузера</li>
              </ul>
              <p><strong>Ваши настройки и данные аккаунта сохранятся.</strong></p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowClearCacheModal(false)}
              >
                Отмена
              </button>
              <button 
                className="btn-primary"
                onClick={handleClearCache}
              >
                Очистить кэш
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SettingsPage