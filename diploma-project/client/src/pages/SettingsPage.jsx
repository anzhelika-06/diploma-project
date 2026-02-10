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
    theme: getSavedTheme() || 'light',
    language: currentLanguage || 'RU',
    notifications: true,
    ecoTips: true,
    privacyLevel: 1
  })
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [deleteEmailConfirmation, setDeleteEmailConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [accountDeleted, setAccountDeleted] = useState(false)
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
      
      // Если нет токена, используем локальные настройки
      if (!userData || !token) {
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
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-User-Id': userId.toString()  // Добавляем обязательный заголовок
      }
      
      const response = await fetch('/api/user-settings', {
        headers: headers
      })
  
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          // Убеждаемся, что все свойства определены
          const loadedSettings = {
            theme: data.settings.theme || 'light',
            language: data.settings.language || 'RU',
            notifications: data.settings.notifications !== undefined ? data.settings.notifications : true,
            ecoTips: data.settings.ecoTips !== undefined ? data.settings.ecoTips : true,
            privacyLevel: data.settings.privacyLevel || 1
          }
          setSettings(loadedSettings)
          applyTheme(loadedSettings.theme)
        }
      } else if (response.status === 401) {
        console.warn('⚠️ Unauthorized access to user settings, but keeping token for other features')
        // НЕ удаляем токен, так как он может быть валидным для других функций
        // localStorage.removeItem('token')
        // Fallback на локальные настройки
        const savedSettings = localStorage.getItem('appSettings')
        if (savedSettings) {
          const localSettings = JSON.parse(savedSettings)
          setSettings(localSettings)
        }
      } else {
        const savedSettings = localStorage.getItem('appSettings')
        if (savedSettings) {
          const localSettings = JSON.parse(savedSettings)
          setSettings(localSettings)
        }
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
      const savedSettings = localStorage.getItem('appSettings')
      if (savedSettings) {
        const localSettings = JSON.parse(savedSettings)
        setSettings(localSettings)
      }
    }
  }
  
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
          privacyLevel: 1
        })
      })
    } catch (error) {
      console.error('❌ Ошибка создания настроек:', error)
    }
  }

  const saveSettingsToServer = async (newSettings) => {
    try {
      const userData = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      
      // Если нет токена, просто сохраняем локально
      if (!userData || !token) {
        return
      }
      
      const user = JSON.parse(userData)
      const userId = user.id
      
      if (!userId) {
        console.error('❌ У пользователя нет ID для сохранения настроек')
        return
      }
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-User-Id': userId.toString()
      }
      
      const response = await fetch('/api/user-settings', {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(newSettings)
      })
      
      if (response.ok) {
        console.log('✅ Settings saved to server successfully')
      } else if (response.status === 401) {
        console.warn('⚠️ Unauthorized access to save settings, keeping local settings')
      } else {
        console.warn('⚠️ Failed to save settings to server, keeping local settings')
      }
    } catch (error) {
      console.error('❌ Error saving settings to server:', error)
    }
  }

  const saveSettings = async (newSettings) => {
    try {
      const userData = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      
      // Сначала сохраняем локально
      localStorage.setItem('appSettings', JSON.stringify(newSettings))
      // НЕ вызываем setSettings здесь, так как это уже сделано в вызывающей функции
  
      // Если есть токен, отправляем на сервер
      if (userData && token) {
        try {
          const user = JSON.parse(userData)
          const userId = user.id
          
          if (!userId) {
            console.error('❌ У пользователя нет ID для сохранения настроек')
            return
          }
          
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-User-Id': userId.toString()  // Добавляем обязательный заголовок
          }
          
          const response = await fetch('/api/user-settings', {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(newSettings)
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.settings) {
              // Убеждаемся, что все свойства определены
              const savedSettings = {
                theme: data.settings.theme || 'light',
                language: data.settings.language || 'RU',
                notifications: data.settings.notifications !== undefined ? data.settings.notifications : true,
                ecoTips: data.settings.ecoTips !== undefined ? data.settings.ecoTips : true,
                privacyLevel: data.settings.privacyLevel || 1
              }
              // Обновляем настройки только после успешного ответа сервера
              setSettings(savedSettings)
              localStorage.setItem('appSettings', JSON.stringify(savedSettings))
            }
          } else if (response.status === 401) {
            console.warn('⚠️ Unauthorized access to save settings, but keeping local settings')
            // НЕ удаляем токен, используем локальные настройки
          }
        } catch (error) {
          console.error('❌ Ошибка сохранения на сервере, используем локальные настройки:', error)
        }
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения настроек:', error)
    }
  }
  
  const handleThemeChange = (theme) => {
    const newSettings = { ...settings, theme }
    
    // Мгновенно обновляем UI
    setSettings(newSettings)
    applyTheme(theme)
    
    // Сохраняем локально
    localStorage.setItem('appSettings', JSON.stringify(newSettings))
    
    // Асинхронно сохраняем на сервер
    saveSettingsToServer(newSettings)
  }

  const handleLanguageChange = async (language) => {
    try {
      const newSettings = { ...settings, language }
      
      // Мгновенно обновляем UI
      setSettings(newSettings)
      
      // Сохраняем локально
      localStorage.setItem('appSettings', JSON.stringify(newSettings))
      
      // Асинхронно сохраняем на сервер
      saveSettingsToServer(newSettings)
      
      // Меняем язык
      await changeLanguage(language)
    } catch (error) {
      console.error('Ошибка при смене языка:', error)
    }
  }

  const handleNotificationToggle = (type) => {
    const newValue = !settings[type]
    const newSettings = { ...settings, [type]: newValue }
    
    console.log(`Toggling ${type} from ${settings[type]} to ${newValue}`)
    
    // Мгновенно обновляем UI
    setSettings(newSettings)
    
    // Сохраняем локально
    localStorage.setItem('appSettings', JSON.stringify(newSettings))
    
    // Асинхронно сохраняем на сервер (без ожидания)
    saveSettingsToServer(newSettings)
  }

  const handleLogout = () => {
    const currentTheme = settings.theme
    
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    
    const settingsToKeep = {
      theme: currentTheme,
      language: settings.language || 'RU',
      notifications: true,
      ecoTips: true,
      privacyLevel: 1
    }
    localStorage.setItem('appSettings', JSON.stringify(settingsToKeep))
    
    applyTheme(currentTheme)
    showSuccess(t('loggedOutSuccess'), t('loggedOutDetails'));
    window.location.href = '/'
  }

  const handleDeleteAccount = async () => {
    try {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!userData || !token) {
        setDeleteError(t('authRequired') || 'Требуется авторизация');
        return;
      }
      
      const user = JSON.parse(userData);
      
      if (deleteEmailConfirmation.trim() !== user.email) {
        setDeleteError(t('emailDoesNotMatch') || 'Email не совпадает');
        return;
      }
      
      setIsDeleting(true);
      setDeleteError('');
      
      const response = await fetch('/api/user-settings/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAccountDeleted(true);
        setIsDeleting(false);
        
        setTimeout(() => {
          const resetSettings = data.settings || {
            theme: 'light',
            language: 'RU',
            notifications: true,
            ecoTips: true,
            privacyLevel: 1
          };
          
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          
          localStorage.setItem('appSettings', JSON.stringify(resetSettings));
          
          if (resetSettings.theme) {
            applyTheme(resetSettings.theme);
          }
          
          setShowDeleteModal(false);
          
          showSuccess(
            t('accountDeletedSuccess') || 'Аккаунт успешно удален!',
            t('redirectedToHome') || 'Вы перенаправлены на главную страницу'
          );
          
          window.location.href = '/';
        }, 2000);
        
      } else {
        let errorMessage = t('deleteAccountError') || 'Ошибка при удалении аккаунта';
        if (data.message) {
          errorMessage += `: ${data.message}`;
        }
        
        setDeleteError(errorMessage);
        setIsDeleting(false);
      }
      
    } catch (error) {
      setDeleteError(
        (t('deleteAccountError') || 'Ошибка при удалении аккаунта') + 
        `: ${error.message}`
      );
      setIsDeleting(false);
    }
  };
  
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
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    const appSettings = localStorage.getItem('appSettings')
    
    localStorage.clear()
    
    if (userData) localStorage.setItem('user', userData)
    if (token) localStorage.setItem('token', token)
    if (appSettings) localStorage.setItem('appSettings', appSettings)
    
    sessionStorage.clear()
    
    if ('caches' in window) {
      caches.keys().then(names => {
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

  // Функции для поддержки
  const loadMyQuestions = async () => {
    try {
      setQuestionsLoading(true);
      
      const userData = localStorage.getItem('user');
      
      if (!userData) {
        setMyQuestions([]);
        showError(t('authRequired'), t('needToLogin'));
        return;
      }
      
      const user = JSON.parse(userData);
      
      const response = await fetch('/api/support/my-questions', {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.tickets) {
        setMyQuestions(data.tickets);
        
        if (data.tickets.length === 0) {
          showSuccess(t('noQuestionsFound'), t('createFirstQuestionDesc'));
        }
      } else {
        setMyQuestions([]);
        showError(
          t('errorLoadingQuestions'), 
          data.message || t('serverError')
        );
      }
      
    } catch (error) {
      setMyQuestions([]);
      showError(
        t('errorLoadingQuestions'), 
        t('checkInternetConnection') + `: ${error.message}`
      );
    } finally {
      setQuestionsLoading(false);
    }
  };
  
  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const userData = localStorage.getItem('user');
      
      if (!userData) {
        showError(t('authRequired'), t('needToLogin'));
        return;
      }
      
      const user = JSON.parse(userData);
      
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
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSupportSuccess(true);
        
        showSuccess(
          t('supportRequestSent'), 
          t('supportWillRespond') + (data.ticket?.ticket_number ? ` (${data.ticket.ticket_number})` : '')
        );
        
        setSupportForm({ subject: '', message: '' });
        
        setTimeout(() => {
          setShowSupportModal(false);
          setSupportSuccess(false);
        }, 5000);
        
        await loadMyQuestions();
      } else {
        showError(
          t('errorSendingRequest'), 
          data.message || t('unknownError') + ` (Код ошибки: ${data.error || 'неизвестен'})`
        );
      }
      
    } catch (error) {
      showError(
        t('errorSendingRequest'), 
        t('checkInternetConnection') + `: ${error.message}`
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
                      checked={!!settings.notifications}
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
                      checked={!!settings.ecoTips}
                      onChange={() => handleNotificationToggle('ecoTips')}
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
                      onClick={() => {
                        setShowDeleteModal(true);
                        setDeleteEmailConfirmation('');
                        setDeleteError('');
                        setAccountDeleted(false);
                        setIsDeleting(false);
                      }}
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
                className="modal-btn secondary"
                onClick={() => setShowLogoutModal(false)}
              >
                {t('cancel')}
              </button>
              <button 
                className="modal-btn danger"
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
          <div className="modal-overlay" onClick={() => {
            if (!isDeleting && !accountDeleted) {
              setShowDeleteModal(false);
            }
          }} />
          <div className="modal delete-account-modal">
            <div className="modal-header">
              <h3>{accountDeleted ? t('accountDeletedTitle') : t('deleteAccountModalTitle')}</h3>
              {!accountDeleted && (
                <button 
                  className="modal-close"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  <span className="material-icons">close</span>
                </button>
              )}
            </div>
            
            <div className="modal-body">
              {!accountDeleted ? (
                <div className="delete-content">
                  <div className="warning-message">
                    <span className="material-icons">warning</span>
                    <p>{t('deleteWarning')}</p>
                  </div>
                  
                  <div className="will-be-deleted">
                    <p className="section-title">{t('willBeDeleted')}</p>
                    <div className="deleted-items">
                      <div className="deleted-item">
                        <span className="material-icons">account_circle</span>
                        <span>{t('deleteProfile')}</span>
                      </div>
                      <div className="deleted-item">
                        <span className="material-icons">history</span>
                        <span>{t('deleteHistory')}</span>
                      </div>
                      <div className="deleted-item">
                        <span className="material-icons">group</span>
                        <span>{t('deleteTeams')}</span>
                      </div>
                      <div className="deleted-item">
                        <span className="material-icons">emoji_events</span>
                        <span>{t('deleteAchievements')}</span>
                      </div>
                      <div className="deleted-item">
                        <span className="material-icons">contact_support</span>
                        <span>{t('deleteSupportTickets')}</span>
                      </div>
                      <div className="deleted-item">
                        <span className="material-icons">settings</span>
                        <span>{t('deleteSettings')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="email-confirmation-section">
                    <p className="confirmation-title">{t('typeEmailToConfirm')}</p>
                    
                    <div className="current-email">
                      <span className="material-icons">email</span>
                      <span>{user?.email}</span>
                    </div>
                    
                    <div className="email-input-wrapper">
                      <input
                        type="email"
                        value={deleteEmailConfirmation || ''}
                        onChange={(e) => {
                          setDeleteEmailConfirmation(e.target.value);
                          setDeleteError('');
                        }}
                        placeholder={t('enterEmailPlaceholder')}
                        className={`email-input ${deleteError ? 'error' : ''}`}
                        disabled={isDeleting}
                        autoFocus
                      />
                      
                      {deleteError && (
                        <div className="input-error-message">
                          <span className="material-icons">error</span>
                          <span>{deleteError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="success-message">
                  <div className="success-icon">
                    <span className="material-icons">check_circle</span>
                  </div>
                  <h4>{t('accountDeletedSuccess')}</h4>
                  <p>{t('accountDeletedDetails')}</p>
                  <div className="redirect-info">
                    <span className="material-icons">timer</span>
                    <span>{t('redirectingIn')} <strong>3 {t('seconds')}</strong></span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              {!accountDeleted ? (
                <>
                  <button 
                    className="modal-btn secondary"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteEmailConfirmation('');
                      setDeleteError('');
                    }}
                    disabled={isDeleting}
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    className="modal-btn danger"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || !deleteEmailConfirmation.trim()}
                  >
                    {isDeleting ? (
                      <>
                        <span className="material-icons loading-icon">hourglass_empty</span>
                        {t('deleting')}
                      </>
                    ) : (
                      <>
                        <span className="material-icons">delete_forever</span>
                        {t('deleteAccount')}
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button 
                  className="modal-btn primary"
                  onClick={() => {
                    window.location.href = '/';
                  }}
                >
                  <span className="material-icons">home</span>
                  {t('goToHomePage')}
                </button>
              )}
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
              <h3>{t('resetPasswordTitle') || 'Сброс пароля'}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowResetPasswordModal(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p>{t('resetPasswordDesc') || 'Мы отправим ссылку для сброса пароля на ваш email:'}</p>
              <p><strong>{user?.email}</strong></p>
              <p>{t('checkSpamFolder') || 'Проверьте папку "Спам", если письмо не придет в течение нескольких минут.'}</p>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn secondary"
                onClick={() => setShowResetPasswordModal(false)}
              >
                {t('cancel')}
              </button>
              <button 
                className="modal-btn primary"
                onClick={handleResetPassword}
              >
                {t('sendLink') || 'Отправить ссылку'}
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
                className="modal-btn secondary"
                onClick={() => setShowFaqModal(false)}
              >
                {t('close')}
              </button>
              <button 
                className="modal-btn primary"
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
                className="modal-btn secondary"
                onClick={() => setShowClearCacheModal(false)}
              >
                {t('cancel')}
              </button>
              <button 
                className="modal-btn primary"
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
    <div 
      className="modal notification-modal"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 2002
      }}
    >
      <div className="modal-header">
        <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
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
        <p style={{ textAlign: 'center', fontSize: '16px', marginBottom: '20px' }}>
          {tempNotification.body}
        </p>
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <span className="material-icons" style={{ fontSize: '64px', color: '#10b981' }}>
            cleaning_services
          </span>
        </div>
      </div>
      <div className="modal-footer">
        <button 
          className="modal-btn primary"
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
                        value={supportForm.subject || ''}
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
                        value={supportForm.message || ''}
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
                      className="modal-btn secondary"
                      onClick={() => setShowSupportModal(false)}
                      disabled={supportSuccess}
                    >
                      {t('cancel')}
                    </button>
                    <button 
                      type="submit"
                      className="modal-btn primary"
                      disabled={supportSuccess}
                    >
                      {t('sendMessage')}
                    </button>
                  </>
                )}
                {supportSuccess && (
                  <button 
                    type="button"
                    className="modal-btn primary"
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
                    className="modal-btn primary"
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
                    className="modal-btn primary"
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
                className="modal-btn secondary"
                onClick={() => setShowMyQuestionsModal(false)}
              >
                {t('close')}
              </button>
              {!questionsLoading && myQuestions && myQuestions.length > 0 && (
                <button 
                  type="button"
                  className="modal-btn secondary"
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
                className="modal-btn primary"
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
                className="modal-btn secondary"
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