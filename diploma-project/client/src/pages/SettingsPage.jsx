import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { applyTheme, getSavedTheme, THEMES, getThemeDisplayName } from '../utils/themeManager'
import { useLanguage } from '../contexts/LanguageContext'
import '../styles/pages/SettingsPage.css'
import useNotification from '../hooks/useNotification';

const SettingsPage = () => {
  const { currentLanguage, changeLanguage, t } = useLanguage()
  const { showSuccess, showError } = useNotification()
  const [activeTab, setActiveTab] = useState('appearance')
  const [tempNotification, setTempNotification] = useState({ show: false, title: '', body: '' })
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
  const [showFaqModal, setShowFaqModal] = useState(false)
  const [showClearCacheModal, setShowClearCacheModal] = useState(false)
  
  // Состояния для поддержки
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showMyQuestionsModal, setShowMyQuestionsModal] = useState(false)
  const [supportForm, setSupportForm] = useState({
    subject: '',
    message: ''
  })
  const [myQuestions, setMyQuestions] = useState([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [showQuestionDetailsModal, setShowQuestionDetailsModal] = useState(false)
const [supportSuccess, setSupportSuccess] = useState(false)
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
      const token = localStorage.getItem('token')
      
      console.log('🔐 Проверка авторизации:', {
        hasUser: !!userData,
        hasToken: !!token,
        userId: userData ? JSON.parse(userData).id : 'none'
      })
      
      // Если нет токена, используем локальные настройки
      if (!userData || !token) {
        console.log('👤 Нет авторизации, локальные настройки')
        const savedSettings = localStorage.getItem('appSettings')
        if (savedSettings) {
          const localSettings = JSON.parse(savedSettings)
          setSettings(localSettings)
        }
        return
      }
  
      const user = JSON.parse(userData)
      const userId = user.id
      
      if (!userId) {
        console.error('❌ У пользователя нет ID')
        return
      }
      
      console.log(`👤 Загрузка настроек для пользователя ID: ${userId}`)
      
      // ОТПРАВЛЯЕМ ОБА ЗАГОЛОВКА
      const headers = {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString(),
        'Authorization': `Bearer ${token}`
      }
      
      console.log('📤 Заголовки запроса:', headers)
      
      const response = await fetch('/api/user-settings', {
        headers: headers
      })
  
      console.log('📡 Ответ сервера:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          console.log('✅ Настройки загружены из БД')
          setSettings(data.settings)
          applyTheme(data.settings.theme)
        }
      } else if (response.status === 404) {
        console.log('📝 Настроек нет, создаем по умолчанию')
        await createDefaultSettings(userId)
        setTimeout(() => loadUserSettings(), 1000)
      } else if (response.status === 401) {
        console.warn('🔒 Ошибка 401: Требуется авторизация')
        // Возможно токен истек
        localStorage.removeItem('token')
      } else {
        console.warn(`⚠️ Ошибка сервера ${response.status}`)
        const savedSettings = localStorage.getItem('appSettings')
        if (savedSettings) {
          const localSettings = JSON.parse(savedSettings)
          setSettings(localSettings)
        }
      }
    } catch (error) {
      console.warn('🌐 Сетевая ошибка:', error.message)
      const savedSettings = localStorage.getItem('appSettings')
      if (savedSettings) {
        const localSettings = JSON.parse(savedSettings)
        setSettings(localSettings)
      }
    }
  }
  const createDefaultSettings = async (userId) => {
    try {
      console.log(`📝 Создание настроек по умолчанию для пользователя: ${userId}`)
      
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
      
      console.log('📡 Ответ сервера при создании:', response.status)
      
      if (!response.ok) {
        console.warn(`⚠️ Ошибка создания настроек: ${response.status}`)
      } else {
        console.log('✅ Настройки созданы')
      }
    } catch (error) {
      console.error('❌ Ошибка создания настроек:', error)
    }
  }

  const saveSettings = async (newSettings) => {
    try {
      const userData = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      
      console.log('💾 Сохранение настроек...', {
        hasUser: !!userData,
        hasToken: !!token
      })
      
      // ВСЕГДА сохраняем локально
      localStorage.setItem('appSettings', JSON.stringify(newSettings))
      setSettings(newSettings)
  
      // Сохраняем на сервере только если есть токен
      if (userData && token) {
        try {
          const user = JSON.parse(userData)
          const userId = user.id
          
          if (!userId) {
            console.warn('⚠️ У пользователя нет ID')
            return
          }
          
          console.log(`👤 Сохранение в БД для пользователя ID: ${userId}`)
          
          // ОТПРАВЛЯЕМ ОБА ЗАГОЛОВКА
          const headers = {
            'Content-Type': 'application/json',
            'X-User-Id': userId.toString(),
            'Authorization': `Bearer ${token}`
          }
          
          const response = await fetch('/api/user-settings', {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(newSettings)
          })
  
          console.log('📡 Ответ сервера:', response.status, response.statusText)
          
          if (response.ok) {
            console.log('✅ Настройки сохранены в БД')
          } else if (response.status === 401) {
            console.warn('🔒 Ошибка 401: Недействительный токен')
          } else {
            console.warn(`⚠️ Ошибка сервера: ${response.status}`)
          }
        } catch (error) {
          console.warn('⚠️ Ошибка отправки на сервер:', error.message)
        }
      } else {
        console.log('👤 Нет токена, сохраняем только локально')
      }
      
    } catch (error) {
      console.error('❌ Ошибка сохранения настроек:', error)
    }
  }
  const handleThemeChange = (theme) => {
    const newSettings = { ...settings, theme }
    setSettings(newSettings)
    saveSettings(newSettings)
    applyTheme(theme)
  }

  const handleLanguageChange = async (language) => {
    try {
      const newSettings = { ...settings, language }
      setSettings(newSettings)
      
      localStorage.setItem('appSettings', JSON.stringify(newSettings))
      
      await saveSettings(newSettings)
      
      await changeLanguage(language)
    } catch (error) {
      console.error('Ошибка при смене языка:', error)
    }
  }

  const handleNotificationToggle = (type) => {
    const newSettings = { ...settings, [type]: !settings[type] }
    saveSettings(newSettings)
  }

  const handleLogout = () => {
    const currentTheme = settings.theme
    
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    
    // Сохраняем только основные настройки без привязки к пользователю
    const settingsToKeep = {
      theme: currentTheme,
      language: settings.language || 'RU',
      notifications: true,
      ecoTips: true,
      emailNotifications: true,
      pushNotifications: false,
      privacyLevel: 1
    }
    localStorage.setItem('appSettings', JSON.stringify(settingsToKeep))
    
    applyTheme(currentTheme)
    showSuccess(t('loggedOutSuccess'), t('loggedOutDetails'));
    window.location.href = '/'
  }

  const handleDeleteAccount = async () => {
    try {
      alert('Функция удаления аккаунта будет реализована позже')
      setShowDeleteModal(false)
    } catch (error) {
      console.error('Ошибка удаления аккаунта:', error)
      alert('Ошибка при удалении аккаунта')
    }
  }

  const handleResetPassword = async () => {
    try {
      alert('Ссылка для сброса пароля отправлена на ваш email')
      setShowResetPasswordModal(false)
    } catch (error) {
      console.error('Ошибка сброса пароля:', error)
      alert('Ошибка при сбросе пароля')
    }
  }

  const handleClearCache = () => {
    console.log('=== handleClearCache вызван ===');
    
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    const appSettings = localStorage.getItem('appSettings')
    
    console.log('Данные до очистки:', { userData: !!userData, token: !!token, appSettings: !!appSettings });
    
    localStorage.clear()
    
    if (userData) {
      localStorage.setItem('user', userData)
      console.log('user восстановлен');
    }
    if (token) {
      localStorage.setItem('token', token)
      console.log('token восстановлен');
    }
    if (appSettings) {
      localStorage.setItem('appSettings', appSettings)
      console.log('appSettings восстановлены');
    }
    
    sessionStorage.clear()
    console.log('sessionStorage очищен');
    
    if ('caches' in window) {
      caches.keys().then(names => {
        console.log('Удаляем кэши:', names);
        names.forEach(name => {
          caches.delete(name)
        })
      })
    }
    
    setShowClearCacheModal(false);
  
    setTempNotification({
      show: true,
      title: t('cacheClearedSuccess') || 'Кэш очищен!',
      body: t('cacheClearedDetails') || 'Временные файлы удалены.'
    });
    
    setTimeout(() => {
      setTempNotification({ show: false, title: '', body: '' });
    }, 3000);
  };

  // ====== ФУНКЦИИ ДЛЯ ПОДДЕРЖКИ ======

  const loadMyQuestions = async () => {
    try {
      console.log('=== Загрузка вопросов пользователя ===');
      setQuestionsLoading(true);
      
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!userData || !token) {
        console.warn('Пользователь не авторизован');
        setMyQuestions([]);
        showError(t('authRequired'), t('needToLogin'));
        return;
      }
      
      const user = JSON.parse(userData);
      console.log('Загружаем вопросы для пользователя ID:', user.id);
      
      const response = await fetch('/api/support/my-questions', {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        }
      });
      
      console.log('Ответ сервера:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Данные от сервера:', data);
      
      if (data.success && data.tickets) {
        console.log(`Получено ${data.tickets.length} вопросов`);
        setMyQuestions(data.tickets);
        
        if (data.tickets.length === 0) {
          showSuccess(t('noQuestionsFound'), t('createFirstQuestionDesc'));
        }
      } else if (data.success && !data.tickets) {
        console.warn('Сервер вернул success, но нет поля tickets:', data);
        setMyQuestions([]);
      } else {
        console.error('Ошибка от сервера:', data);
        setMyQuestions([]);
        showError(
          t('errorLoadingQuestions'), 
          data.message || t('serverError')
        );
      }
      
    } catch (error) {
      console.error('Ошибка загрузки вопросов:', error);
      setMyQuestions([]);
      showError(
        t('errorLoadingQuestions'), 
        t('checkInternetConnection')
      );
    } finally {
      setQuestionsLoading(false);
    }
  };
  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('=== Отправка вопроса в поддержку ===');
      
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!userData || !token) {
        showError(t('authRequired'), t('needToLogin'));
        return;
      }
      
      const user = JSON.parse(userData);
      console.log('Отправка от пользователя ID:', user.id);
      console.log('Данные формы:', supportForm);
      
      if (!supportForm.subject?.trim() || !supportForm.message?.trim()) {
        showError(t('fillRequiredFields'), t('subjectAndMessageRequired'));
        return;
      }
      
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          subject: supportForm.subject.trim(),
          message: supportForm.message.trim()
        })
      });
      
      console.log('Ответ сервера:', response.status);
      
      const data = await response.json();
      console.log('Данные ответа:', data);
      
      if (data.success) {
        // Показываем успешное уведомление
        setSupportSuccess(true);
        
        // Используем переводы в уведомлении
        showSuccess(
          t('supportRequestSent'), 
          t('supportWillRespond') + (data.ticket?.ticket_number ? ` (${data.ticket.ticket_number})` : '')
        );
        
        // Сбрасываем форму
        setSupportForm({ subject: '', message: '' });
        
        // Через 5 секунд закрываем модалку и сбрасываем состояние
        setTimeout(() => {
          setShowSupportModal(false);
          setSupportSuccess(false);
        }, 5000); // 5000 мс = 5 секунд
        
        // Обновляем список вопросов
        await loadMyQuestions();
      } else {
        console.error('Ошибка от сервера:', data);
        showError(
          t('errorSendingRequest'), 
          data.message || t('unknownError')
        );
      }
      
    } catch (error) {
      console.error('Ошибка отправки вопроса:', error);
      showError(
        t('errorSendingRequest'), 
        t('checkInternetConnection')
      );
    }
  };

  const handleViewQuestionDetails = (question) => {
    setSelectedQuestion(question)
    setShowQuestionDetailsModal(true)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusLabel = (status) => {
    switch(status) {
      case 'pending': return t('statusPending') || 'Ожидает ответа'
      case 'answered': return t('statusAnswered') || 'Отвечено'
      case 'closed': return t('statusClosed') || 'Закрыто'
      default: return status
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#ff9800'
      case 'answered': return '#4caf50'
      case 'closed': return '#9e9e9e'
      default: return '#666'
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
      questionKey: 'faqQuestion1',
      answerKey: 'faqAnswer1'
    },
    {
      questionKey: 'faqQuestion2',
      answerKey: 'faqAnswer2'
    },
    {
      questionKey: 'faqQuestion3',
      answerKey: 'faqAnswer3'
    },
    {
      questionKey: 'faqQuestion4',
      answerKey: 'faqAnswer4'
    },
    {
      questionKey: 'faqQuestion5',
      answerKey: 'faqAnswer5'
    }
  ];

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">{t('settingsTitle')}</h1>
        
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

        <div className="settings-content">
          
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

{activeTab === 'support' && (
  <div className="settings-section">
    <h2>{t('supportTitle')}</h2>
    
    <div className="setting-group">
      {/* 1. FAQ */}
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

      {/* 2. Написать в поддержку */}
      <div className="support-item">
        <div className="support-icon">
          <span className="material-icons">headset</span>
        </div>
        <div className="support-content">
          <h3>{t('contactSupport')}</h3>
          <p>{t('contactSupportDesc')}</p>
          <button 
            className="action-btn secondary"
            onClick={() => setShowSupportModal(true)}
          >
            <span className="material-icons">headset</span>
            {t('writeToSupport')}
          </button>
        </div>
      </div>

      {/* 3. Мои обращения */}
      <div className="support-item">
        <div className="support-icon">
          <span className="material-icons">question_answer</span>
        </div>
        <div className="support-content">
          <h3>{t('mySupportRequests')}</h3>
          <p>{t('mySupportRequestsDesc')}</p>
          <button 
            className="action-btn secondary"
            onClick={() => {
              loadMyQuestions()
              setShowMyQuestionsModal(true)
            }}
          >
            <span className="material-icons">list</span>
            {t('viewMyRequests')}
          </button>
        </div>
      </div>

      {/* 4. О приложении */}
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
        <h3>{t('faqTitle')}</h3>
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
              <h4>{t(item.questionKey)}</h4>
              <p>{t(item.answerKey)}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="modal-footer">
        <button 
          className="btn-secondary"
          onClick={() => setShowFaqModal(false)}
        >
          {t('close')}
        </button>
        <button 
          className="btn-primary"
          onClick={() => {
            setShowFaqModal(false);
            setShowSupportModal(true);
          }}
        >
          {t('askQuestion')}
        </button>
      </div>
    </div>
  </>
)}
      {/* Модальное окно очистки кэша */}
      {showClearCacheModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowClearCacheModal(false)} />
          <div className="modal">
            <div className="modal-header">
              <h3>{t('clearCacheTitle')}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowClearCacheModal(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p><strong>{t('clearCacheConfirmation')}</strong></p>
              <p>{t('clearCacheWillBeDeleted')}</p>
              <ul>
                <li>{t('clearCacheTempFiles')}</li>
                <li>{t('clearCacheCachedData')}</li>
                <li>{t('clearCacheSessionData')}</li>
                <li>{t('clearCacheBrowserCache')}</li>
              </ul>
              <p><strong>{t('clearCacheNote')}</strong></p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowClearCacheModal(false)}
              >
                {t('cancel')}
              </button>
              <button 
                className="btn-primary"
                onClick={handleClearCache}
              >
                {t('clearCacheButton')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Временное уведомление об успешной очистке кэша */}
      {tempNotification.show && (
        <>
          <div className="modal-overlay" onClick={() => setTempNotification({ show: false, title: '', body: '' })} />
          <div className="modal notification-modal">
            <div className="modal-header">
              <h3>
                <span className="material-icons" style={{ color: '#10b981', marginRight: '8px' }}>check_circle</span>
                {tempNotification.title}
              </h3>
              <button 
                className="modal-close"
                onClick={() => setTempNotification({ show: false, title: '', body: '' })}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ textAlign: 'center' }}>{tempNotification.body}</p>
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <span className="material-icons" style={{ fontSize: '48px', color: '#10b981' }}>cleaning_services</span>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-primary"
                onClick={() => setTempNotification({ show: false, title: '', body: '' })}
                style={{ width: '100%' }}
              >
                OK
              </button>
            </div>
          </div>
        </>
      )}

{/* Модальное окно для написания в поддержку */}
{showSupportModal && (
  <>
    <div className="modal-overlay" onClick={() => !supportSuccess && setShowSupportModal(false)} />
    <div className="modal large">
      <div className="modal-header">
        <h3>{supportSuccess ? t('messageSent') : t('writeToSupport')}</h3>
        <button 
          className="modal-close"
          onClick={() => {
            if (!supportSuccess) {
              setShowSupportModal(false);
            }
          }}
          disabled={supportSuccess}
        >
          <span className="material-icons">close</span>
        </button>
      </div>
      <form onSubmit={handleSupportSubmit}>
        <div className="modal-body">
          {supportSuccess ? (
            <div className="success-message">
              <div className="success-icon">
                <span className="material-icons" style={{ color: '#4caf50', fontSize: '64px' }}>check_circle</span>
              </div>
              <h4>{t('supportRequestSent')}</h4>
              <p>
                {t('supportWillRespond')}
              </p>
              <p style={{ marginTop: '16px', color: '#666' }}>
                <span className="material-icons" style={{ fontSize: '20px', verticalAlign: 'middle', marginRight: '8px' }}>schedule</span>
                {t('responseTime')}
              </p>
              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                <p style={{ margin: '0', color: '#0369a1' }}>
                  <span className="material-icons" style={{ fontSize: '20px', verticalAlign: 'middle', marginRight: '8px' }}>info</span>
                  {t('checkStatusInMyRequests')}
                </p>
              </div>
              <div className="countdown" style={{ marginTop: '24px', textAlign: 'center', color: '#666' }}>
                <p>
                  <span className="material-icons" style={{ fontSize: '20px', verticalAlign: 'middle', marginRight: '8px' }}>timer</span>
                  {t('windowWillClose')}
                </p>
                {/* Прогресс-бар */}
                <div 
                  style={{ 
                    width: '100%', 
                    height: '4px', 
                    backgroundColor: '#e0e0e0', 
                    borderRadius: '2px',
                    marginTop: '8px',
                    overflow: 'hidden'
                  }}
                >
                  <div 
                    className="progress-bar"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      backgroundColor: '#4caf50',
                      transform: 'scaleX(1)',
                      transformOrigin: 'left',
                      animation: 'progressCountdown 5s linear forwards'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>{t('supportSubject')} *</label>
                <input 
                  type="text"
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
                  placeholder={t('supportSubjectPlaceholder')}
                  className="form-input"
                  required
                  maxLength={255}
                  disabled={supportSuccess}
                />
              </div>
              
              <div className="form-group">
                <label>{t('supportMessage')} *</label>
                <textarea 
                  value={supportForm.message}
                  onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
                  placeholder={t('supportMessagePlaceholder')}
                  className="form-textarea"
                  rows="8"
                  required
                  disabled={supportSuccess}
                />
                <div className="form-hint">
                  {t('supportMessageHint')}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          {!supportSuccess && (
            <>
              <button 
                type="button"
                className="btn-secondary"
                onClick={() => setShowSupportModal(false)}
                disabled={supportSuccess}
              >
                {t('cancel')}
              </button>
              <button 
                type="submit"
                className="btn-primary"
                disabled={supportSuccess}
              >
                {t('sendMessage')}
              </button>
            </>
          )}
          {supportSuccess && (
            <button 
              type="button"
              className="btn-primary"
              onClick={() => {
                setShowSupportModal(false);
                setSupportSuccess(false);
              }}
              style={{ width: '100%' }}
            >
              {t('close')}
            </button>
          )}
        </div>
      </form>
    </div>
  </>
)}

{/* Модальное окно "Мои обращения" */}
{showMyQuestionsModal && (
  <>
    <div className="modal-overlay" onClick={() => setShowMyQuestionsModal(false)} />
    <div className="modal large">
      <div className="modal-header">
        <h3>{t('mySupportRequests')}</h3>
        <button 
          className="modal-close"
          onClick={() => setShowMyQuestionsModal(false)}
          aria-label={t('close')}
        >
          <span className="material-icons">close</span>
        </button>
      </div>
      <div className="modal-body">
        {questionsLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('loading')}</p>
          </div>
        ) : !myQuestions || !Array.isArray(myQuestions) ? (
          <div className="empty-state error-state">
            <span className="material-icons" style={{ color: '#ef4444', fontSize: '48px' }}>error_outline</span>
            <h4>{t('errorLoadingData')}</h4>
            <p>{t('dataLoadError')}</p>
            <button 
              className="btn-primary"
              onClick={() => {
                loadMyQuestions();
              }}
            >
              <span className="material-icons">refresh</span>
              {t('tryAgain')}
            </button>
          </div>
        ) : myQuestions.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons" style={{ color: '#6b7280', fontSize: '48px' }}>question_answer</span>
            <h4>{t('noQuestionsTitle')}</h4>
            <p>{t('noQuestionsDescription')}</p>
            <button 
              className="btn-primary"
              onClick={() => {
                setShowMyQuestionsModal(false);
                setShowSupportModal(true);
              }}
            >
              {t('createFirstQuestion')}
            </button>
          </div>
        ) : (
          <div className="questions-list">
            {myQuestions.map(question => {
              // Проверка на наличие необходимых полей
              if (!question || typeof question !== 'object') {
                console.warn('Некорректный вопрос:', question);
                return null;
              }

              const ticketNumber = question.ticket_number || question.ticketNumber || `TKT-${question.id || '???'}`;
              const subject = question.subject || t('noSubject');
              const message = question.message || '';
              const status = question.status || 'pending';
              const createdAt = question.created_at || question.createdAt || new Date();
              const hasResponse = Boolean(question.admin_response);
              
              return (
                <div 
                  key={question.id || Math.random()} 
                  className={`question-item ${status}`}
                  onClick={() => handleViewQuestionDetails(question)}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleViewQuestionDetails(question);
                    }
                  }}
                >
                  <div className="question-header">
                    <div className="question-number" title={ticketNumber}>
                      {ticketNumber}
                    </div>
                    <div 
                      className="question-status"
                      style={{ backgroundColor: getStatusColor(status) }}
                      title={getStatusLabel(status)}
                    >
                      {getStatusLabel(status)}
                    </div>
                  </div>
                  <div className="question-subject" title={subject}>
                    {subject}
                  </div>
                  <div className="question-meta">
                    <span className="question-date">
                      {formatDate(createdAt)}
                    </span>
                    {question.updated_at && question.updated_at !== createdAt && (
                      <span className="question-updated">
                        <span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>update</span>
                        {t('updated')}: {formatDate(question.updated_at)}
                      </span>
                    )}
                  </div>
                  {message && (
                    <div className="question-message-preview" title={message}>
                      {message.length > 100 ? 
                        `${message.substring(0, 100)}...` : message}
                    </div>
                  )}
                  {hasResponse && (
                    <div className="question-has-response">
                      <span className="material-icons" style={{ color: '#10b981', marginRight: '4px' }}>check_circle</span>
                      {t('hasResponse')}
                    </div>
                  )}
                  {question.responded_at && (
                    <div className="question-response-date">
                      <span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>schedule</span>
                      {t('answeredAt')}: {formatDate(question.responded_at)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button 
          type="button"
          className="btn-secondary"
          onClick={() => setShowMyQuestionsModal(false)}
        >
          {t('close')}
        </button>
        {!questionsLoading && myQuestions && myQuestions.length > 0 && (
          <button 
            type="button"
            className="btn-secondary"
            onClick={() => {
              loadMyQuestions();
            }}
          >
            <span className="material-icons">refresh</span>
            {t('refresh')}
          </button>
        )}
        <button 
          type="button"
          className="btn-primary"
          onClick={() => {
            setShowMyQuestionsModal(false);
            setShowSupportModal(true);
          }}
        >
          <span className="material-icons">add</span>
          {t('askNewQuestion')}
        </button>
      </div>
    </div>
  </>
)}

      {/* Модальное окно деталей вопроса */}
      {showQuestionDetailsModal && selectedQuestion && (
        <>
          <div className="modal-overlay" onClick={() => setShowQuestionDetailsModal(false)} />
          <div className="modal large">
            <div className="modal-header">
              <h3>{selectedQuestion.subject}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowQuestionDetailsModal(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="question-details">
                <div className="details-header">
                  <div className="details-id">
                    <strong>ID:</strong> {selectedQuestion.ticket_number}
                  </div>
                  <div 
                    className="details-status"
                    style={{ backgroundColor: getStatusColor(selectedQuestion.status) }}
                  >
                    {getStatusLabel(selectedQuestion.status)}
                  </div>
                </div>
                
                <div className="details-date">
                  <strong>{t('createdAt') || 'Создано'}:</strong> {formatDate(selectedQuestion.created_at)}
                </div>
                
                {selectedQuestion.responded_at && (
                  <div className="details-date">
                    <strong>{t('answeredAt') || 'Отвечено'}:</strong> {formatDate(selectedQuestion.responded_at)}
                  </div>
                )}
                
                <div className="details-section">
                  <h4>{t('yourQuestion') || 'Ваш вопрос'}</h4>
                  <div className="details-message">
                    {selectedQuestion.message}
                  </div>
                </div>
                
                {selectedQuestion.admin_response && (
                  <div className="details-section">
                    <h4>{t('adminResponse') || 'Ответ поддержки'}</h4>
                    <div className="details-response">
                      {selectedQuestion.admin_response}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowQuestionDetailsModal(false)}
              >
                {t('close') || 'Закрыть'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SettingsPage
