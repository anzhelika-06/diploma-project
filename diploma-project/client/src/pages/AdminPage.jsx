import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAdminCheck } from '../hooks/useAdminCheck';
import { getEmojiByCarbon } from '../utils/emojiMapper';
import { exportAllUsers, exportAllSupportTickets, exportAllReports } from '../utils/excelExport';
import { translateStoryContent, detectTextLanguage } from '../utils/translations';
import '../styles/pages/AdminPage.css';

const AdminPage = () => {
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading, user: currentUser } = useAdminCheck();
  

  
  // Состояния для пользователей
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Детали банов для каждого пользователя
  const [banDetails, setBanDetails] = useState({});
  
  // Состояния для поддержки
  const [supportTickets, setSupportTickets] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState(null);
  
  // Фильтры для обращений
  const [supportFilters, setSupportFilters] = useState({
    search: '',
    status: 'all'
  });
  
  // Добавляем новые состояния для dropdown галочек обращений
  const [supportStatusDropdownOpen, setSupportStatusDropdownOpen] = useState(false);
  
  // Пагинация для обращений
  const [supportPagination, setSupportPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });

  // Модалка ответа на обращение
  const [responseModal, setResponseModal] = useState({
    isOpen: false,
    ticketId: null,
    ticketNumber: '',
    userId: null,
    username: '',
    userEmail: '',
    subject: '',
    message: '',
    response: '',
    error: ''
  });

  // Фильтры для пользователей
  const [filters, setFilters] = useState({
    search: '',
    is_admin: null,
    is_banned: null
  });
  
  // Сортировка для пользователей
  const [sortConfig, setSortConfig] = useState({
    key: 'id',
    direction: 'asc'
  });
  
  // Пагинация для пользователей
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  
  // Модалки
  const [banModal, setBanModal] = useState({
    isOpen: false,
    userId: null,
    username: '',
    currentBanCount: 0,
    reason: '',
    duration: '24',
    durationType: 'hours',
    error: ''
  });
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  // Статистика
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalBanned: 0,
    totalTickets: 0,
    pendingTickets: 0,
    answeredTickets: 0,
    closedTickets: 0
  });

  // ==================== СОСТОЯНИЯ ДЛЯ ОТЗЫВОВ ====================
  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [storiesError, setStoriesError] = useState(null);

  // ==================== СОСТОЯНИЯ ДЛЯ ЖАЛОБ ====================
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState(null);
  const [reportsFilters, setReportsFilters] = useState({
    search: '',
    status: 'all'
  });
  const [reportsPagination, setReportsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [reportsSortConfig, setReportsSortConfig] = useState({
    key: 'id',
    direction: 'asc'
  });
  const [reportsStatusDropdownOpen, setReportsStatusDropdownOpen] = useState(false);
  const [reportDetailsModal, setReportDetailsModal] = useState({
    isOpen: false,
    report: null,
    adminResponse: '',
    responseError: false
  });
  const [screenshotPreviewModal, setScreenshotPreviewModal] = useState({
    isOpen: false,
    imageUrl: '',
    imageName: ''
  });
  const [storyStats, setStoryStats] = useState({
    total: 0,
    published: 0,
    pending: 0,
    draft: 0,
  });
  const [categoryStats, setCategoryStats] = useState([]);
  const [storyFilters, setStoryFilters] = useState({
    status: 'all',
    category: 'all',
    search: ''
  });
  const [storiesPagination, setStoriesPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [storyStatusDropdownOpen, setStoryStatusDropdownOpen] = useState(false);
  const [storyCategoryDropdownOpen, setStoryCategoryDropdownOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [translatedContent, setTranslatedContent] = useState({
    title: '',
    content: '',
    isTranslating: false
  });

  // Рефы
  const isInitialMount = useRef(true);
  const searchDebounceTimer = useRef(null);
  const supportSearchDebounceTimer = useRef(null);

  // ==================== КОНСТАНТЫ ====================

  const banDurations = useMemo(() => [
    { value: '1', label: t('banDuration1h') || '1 час', type: 'hours' },
    { value: '24', label: t('banDuration24h') || '24 часа', type: 'hours' },
    { value: '168', label: t('banDuration7d') || '7 дней', type: 'hours' },
    { value: '720', label: t('banDuration30d') || '30 дней', type: 'hours' },
    { value: 'permanent', label: t('banDurationPermanent') || 'Навсегда', type: 'permanent' }
  ], [t]);

  const tabs = [
    { id: 'users', label: t('adminTabUsers') || 'Пользователи', icon: 'people' },
    { id: 'funds', label: t('adminTabFunds') || 'Фонды', icon: 'account_balance' },
    { id: 'reports', label: t('adminTabReports') || 'Жалобы', icon: 'report' },
    { id: 'reviews', label: t('adminTabReviews') || 'Отзывы', icon: 'rate_review' },
    { id: 'support', label: t('adminTabSupport') || 'Вопросы', icon: 'help_outline' }
  ];

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);

  const roleOptions = useMemo(() => [
    { id: null, label: t('allRoles') || 'Все роли', value: null },
    { id: 'admin', label: t('adminsA') || 'Администраторы', value: true },
    { id: 'user', label: t('users') || 'Пользователи', value: false }
  ], [t]);

  const statusOptions = useMemo(() => [
    { id: null, label: t('allStatuses') || 'Все статусы', value: null },
    { id: 'banned', label: t('banned') || 'Заблокированные', value: true },
    { id: 'active', label: t('active') || 'Активные', value: false }
  ], [t]);

  // Options для статусов обращений
  const supportStatusOptions = useMemo(() => [
    { id: 'all', label: t('allStatuses') || 'Все статусы', value: 'all' },
    { id: 'pending', label: t('pending') || 'Ожидают', value: 'pending' },
    { id: 'answered', label: t('answered') || 'Отвеченные', value: 'answered' },
    { id: 'closed', label: t('closed') || 'Закрытые', value: 'closed' }
  ], [t]);

  // Options для статусов историй
  const storyStatusOptions = useMemo(() => [
    { id: 'all', label: t('allStatuses') || 'Все статусы', value: 'all' },
    { id: 'draft', label: t('draft') || 'Черновик', value: 'draft' },
    { id: 'pending', label: t('pending') || 'На проверке', value: 'pending' },
    { id: 'published', label: t('published') || 'Опубликованные', value: 'published' },
  ], [t]);

  // ==================== УТИЛИТНЫЕ ФУНКЦИИ ====================

  const showSuccessModal = (title, message) => {
    setSuccessModal({
      isOpen: true,
      title,
      message
    });
    
    setTimeout(() => {
      setSuccessModal(prev => ({ ...prev, isOpen: false }));
    }, 3000);
  };

  const getRoleLabel = () => {
    const option = roleOptions.find(opt => opt.value === filters.is_admin);
    return option ? option.label : roleOptions[0].label;
  };

  const getStatusLabel = (value) => {
    const option = statusOptions.find(opt => opt.value === value);
    return option ? option.label : statusOptions[0].label;
  };

  const formatDate = (dateInput) => {
    if (!dateInput || dateInput === 'null' || dateInput === 'undefined' || dateInput === null) {
      return '—';
    }
    
    try {
      let date;
      
      if (typeof dateInput === 'string') {
        if (dateInput.includes('T')) {
          date = new Date(dateInput);
        } else if (dateInput.includes('-') && dateInput.includes(':')) {
          date = new Date(dateInput.replace(' ', 'T') + 'Z');
        } else if (dateInput.includes('-')) {
          date = new Date(dateInput + 'T00:00:00Z');
        } else {
          const timestamp = parseInt(dateInput);
          if (!isNaN(timestamp)) {
            date = new Date(timestamp);
          } else {
            date = new Date(dateInput);
          }
        }
      } else if (typeof dateInput === 'number') {
        date = new Date(dateInput);
      } else {
        date = dateInput;
      }
      
      if (isNaN(date.getTime())) {
        return 'Некорректная дата';
      }
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}.${month}.${year} ${hours}:${minutes}`;
      
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Ошибка даты';
    }
  };

  const getUserAvatar = (user) => {
    if (!user) return '👤';
    
    if (user.avatar_emoji && user.avatar_emoji.length <= 10) {
      return getEmojiByCarbon(user.carbon_saved || 0);
    }
    
    if (user.avatar_emoji) {
      return user.avatar_emoji;
    }
    
    return getEmojiByCarbon(user.carbon_saved || 0);
  };

  const getTranslatedEcoLevel = (carbonSaved) => {
    const carbon = carbonSaved || 0;
    
    let levelKey = 'ecoNovice';
    
    if (carbon >= 5000) levelKey = 'ecoHero';
    else if (carbon >= 4000) levelKey = 'ecoMaster';
    else if (carbon >= 3000) levelKey = 'ecoActivist';
    else if (carbon >= 2000) levelKey = 'ecoEnthusiast';
    else if (carbon >= 1000) levelKey = 'ecoStarter';
    
    const translated = t(levelKey);
    if (translated && translated !== levelKey) {
      return translated;
    }
    
    // Если нет перевода, возвращаем дефолтный текст
    if (carbon >= 5000) return t('ecoHero') || 'Эко-герой';
    else if (carbon >= 4000) return t('ecoMaster') || 'Эко-мастер';
    else if (carbon >= 3000) return t('ecoActivist') || 'Эко-активист';
    else if (carbon >= 2000) return t('ecoEnthusiast') || 'Эко-энтузиаст';
    else if (carbon >= 1000) return t('ecoStarter') || 'Эко-стартер';
    else return t('ecoNovice') || 'Эко-новичок';
  };

  const getEcoLevelClass = (carbonSaved) => {
    const carbon = carbonSaved || 0;
    
    if (carbon >= 5000) return 'level-hero';
    else if (carbon >= 4000) return 'level-master';
    else if (carbon >= 3000) return 'level-activist';
    else if (carbon >= 2000) return 'level-enthusiast';
    else if (carbon >= 1000) return 'level-starter';
    else return 'level-novice';
  };

  const formatCarbonSaved = (carbonSaved) => {
    const value = carbonSaved || 0;
    const unit = t('carbonUnit') || 'кг';
    return `${value.toLocaleString()} ${unit}`;
  };

  const getBanInfoText = () => {
    const currentCount = banModal.currentBanCount;
    const newCount = currentCount + 1;
    
    if (currentCount >= 3) {
      return {
        type: 'permanent',
        title: t('banPermanent') || 'Блокировка навсегда',
        subtitle: t('violationNumber', { number: newCount }) || `(нарушение №${newCount})`,
        description: t('banPermanentDesc') || 'Пользователь получает вечную блокировку за 4 и более нарушений.',
        color: '#dc3545',
        icon: 'warning'
      };
    }
    
    if (banModal.durationType === 'permanent') {
      return {
        type: 'permanent-manual',
        title: t('banPermanent') || 'Блокировка навсегда',
        subtitle: t('violationNumber', { number: newCount }) || `(нарушение №${newCount})`,
        color: '#dc3545',
        icon: 'warning'
      };
    }
    
    const durationLabel = banDurations.find(d => d.value === banModal.duration)?.label || '24 часа';
    return {
      type: 'temporary',
      title: `${durationLabel}`,
      subtitle: t('violationNumber', { number: newCount }) || `(нарушение №${newCount})`,
      color: '#ffc107',
      icon: 'schedule'
    };
  };

  // Функции для получения лейблов статусов
  const getSupportStatusLabel = () => {
    const option = supportStatusOptions.find(opt => opt.value === supportFilters.status);
    return option ? option.label : supportStatusOptions[0].label;
  };

  const getSupportStatusBadgeLabel = (status) => {
    switch(status) {
      case 'pending': return t('statusPending') || 'Ожидает';
      case 'answered': return t('answered') || 'Отвечено';
      case 'closed': return t('closed') || 'Закрыто';
      default: return status;
    }
  };

  const getStoryStatusLabel = () => {
    const option = storyStatusOptions.find(opt => opt.value === storyFilters.status);
    return option ? option.label : storyStatusOptions[0].label;
  };

  const getStoryStatusBadgeLabel = (status) => {
    switch(status) {
      case 'published': return t('published') || 'Опубликовано';
      case 'pending': return t('pending') || 'На проверке';
      case 'draft': return t('draft') || 'Черновик';
      default: return status;
    }
  };

  const getCategoryLabel = () => {
    if (storyFilters.category === 'all') return t('allCategories') || 'Все категории';
    
    const category = categoryStats.find(c => c.category === storyFilters.category);
    const translatedCategory = getTranslatedCategory(storyFilters.category);
    return category ? `${translatedCategory} (${category.count})` : translatedCategory;
  };

  // Функция для перевода категорий
  const getTranslatedCategory = (category) => {
    const categoryTranslations = {
      'Транспорт': t('categoryTransport') || 'Транспорт',
      'Питание': t('categoryFood') || 'Питание',
      'Энергия': t('categoryEnergy') || 'Энергия',
      'Отходы': t('categoryWaste') || 'Отходы',
      'Вода': t('categoryWater') || 'Вода',
      'Общее': t('categoryGeneral') || 'Общее',
      'Потребление': t('categoryConsumption') || 'Потребление',
      'Природа': t('categoryNature') || 'Природа',
      'Быт': t('categoryHousehold') || 'Быт',
      'Планирование': t('categoryPlanning') || 'Планирование',
      // English categories
      'Transport': t('categoryTransport') || 'Транспорт',
      'Food': t('categoryFood') || 'Питание',
      'Energy': t('categoryEnergy') || 'Энергия',
      'Waste': t('categoryWaste') || 'Отходы',
      'Water': t('categoryWater') || 'Вода',
      'General': t('categoryGeneral') || 'Общее',
      'Consumption': t('categoryConsumption') || 'Потребление',
      'Nature': t('categoryNature') || 'Природа',
      'Household': t('categoryHousehold') || 'Быт',
      'Planning': t('categoryPlanning') || 'Планирование'
    };
    
    return categoryTranslations[category] || category;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#ff9800';
      case 'answered': return '#4caf50';
      case 'closed': return '#9e9e9e';
      case 'published': return '#4caf50';
      case 'draft': return '#757575';
      default: return '#666';
    }
  };

  // Функция для получения текста тултипа с информацией о бане
  const getBanTooltipText = (user) => {
    const details = banDetails[user.id];
    
    if (!details) {
      return 'Загрузка информации о бане...';
    }
    
    let tooltipText = '';
    // Информация о типе бана
    if (details.is_permanent || details.expires_at === null) {
      tooltipText = 'БАН НАВСЕГДА';
    } else if (details.expires_at) {
      const formattedDate = formatDate(details.expires_at);
      tooltipText = `Бан до: ${formattedDate}`;
    } else {
      tooltipText = 'Пользователь забанен';
    }
    
    // Дата начала бана
    if (details.created_at) {
      const startDate = formatDate(details.created_at);
      tooltipText += `\nДата начала: ${startDate}`;
    }
    
    // Причина
    if (details.reason) {
      tooltipText += `\nПричина: ${details.reason}`;
    } else if (user.ban_reason) {
      tooltipText += `\nПричина: ${user.ban_reason}`;
    }
    
    return tooltipText;
  };

  // ==================== ЭФФЕКТЫ ====================

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleDropdownOpen && !e.target.closest('.admin-filter-dropdown')) {
        setRoleDropdownOpen(false);
      }
      
      if (statusDropdownOpen && !e.target.closest('.admin-filter-dropdown')) {
        setStatusDropdownOpen(false);
      }
      
      if (supportStatusDropdownOpen && !e.target.closest('.support-filter-dropdown')) {
        setSupportStatusDropdownOpen(false);
      }
      
      if (durationDropdownOpen && !e.target.closest('.modal-dropdown') && !e.target.closest('.modal-overlay')) {
        setDurationDropdownOpen(false);
      }
      
      if (storyStatusDropdownOpen && !e.target.closest('.story-filter-dropdown')) {
        setStoryStatusDropdownOpen(false);
      }
      
      if (storyCategoryDropdownOpen && !e.target.closest('.story-filter-dropdown')) {
        setStoryCategoryDropdownOpen(false);
      }
      
      if (reportsStatusDropdownOpen && !e.target.closest('.admin-filter-dropdown')) {
        setReportsStatusDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setRoleDropdownOpen(false);
        setStatusDropdownOpen(false);
        setSupportStatusDropdownOpen(false);
        setDurationDropdownOpen(false);
        setStoryStatusDropdownOpen(false);
        setStoryCategoryDropdownOpen(false);
        setReportsStatusDropdownOpen(false);
      }
    });
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', () => {});
    };
  }, [roleDropdownOpen, statusDropdownOpen, supportStatusDropdownOpen, durationDropdownOpen, storyStatusDropdownOpen, storyCategoryDropdownOpen, reportsStatusDropdownOpen]);

  // Загрузка обращений при переключении на вкладку
  useEffect(() => {
    if (activeTab === 'support' && isAdmin && !adminLoading) {
      loadSupportTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAdmin, adminLoading]);

  // Загрузка начальных данных пользователей
  useEffect(() => {
    if (activeTab === 'users' && isAdmin && !adminLoading) {
      if (isInitialMount.current) {
        loadInitialData();
        isInitialMount.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAdmin, adminLoading]);

  // Загрузка статистики при монтировании
  useEffect(() => {
    if (isAdmin && !adminLoading) {
      loadStatsFromDB();
      loadSupportStatsFromDB();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, adminLoading]);

  // Загрузка деталей банов при изменении списка пользователей
  useEffect(() => {
    if (activeTab === 'users' && users.length > 0 && isAdmin && !adminLoading) {
      loadBanDetailsForUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users.length, activeTab, isAdmin, adminLoading]); // Используем users.length вместо users

  // Загрузка данных для вкладки отзывов
  useEffect(() => {
    if (activeTab === 'reviews' && isAdmin && !adminLoading) {
      loadStoriesData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAdmin, adminLoading]);

  // Загрузка данных для вкладки жалоб
  useEffect(() => {
    if (activeTab === 'reports' && isAdmin && !adminLoading) {
      // Загружаем жалобы при переключении на вкладку
      const loadReportsData = async () => {
        if (reportsLoading) return;
        
        setReportsLoading(true);
        setReportsError(null);
        
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            setReportsError('Токен не найден');
            return;
          }
          
          const params = new URLSearchParams({
            page: '1',
            limit: reportsPagination.limit.toString(),
            status: reportsFilters.status,
            search: reportsFilters.search
          });
          
          const response = await fetch(`/api/reports/admin?${params}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch reports');
          }
          
          const data = await response.json();
          
          if (data.success) {
            setReports(data.reports);
            setReportsPagination(data.pagination);
          } else {
            setReportsError(data.error || 'Ошибка загрузки жалоб');
          }
        } catch (error) {
          console.error('Error loading reports:', error);
          setReportsError('Ошибка загрузки жалоб');
        } finally {
          setReportsLoading(false);
        }
      };
      
      loadReportsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAdmin, adminLoading]);

  // Перезагрузка жалоб при изменении фильтров
  useEffect(() => {
    if (activeTab === 'reports' && isAdmin && !adminLoading && !reportsLoading) {
      const timer = setTimeout(() => {
        loadReports(reportsFilters, 1);
      }, 300);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportsFilters.search, reportsFilters.status]);

  // Очистка таймеров
  useEffect(() => {
    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
      if (supportSearchDebounceTimer.current) {
        clearTimeout(supportSearchDebounceTimer.current);
      }
    };
  }, []);

  // ==================== ФУНКЦИИ ДЛЯ ОТЗЫВОВ (ИСТОРИЙ) ====================

  const loadStoriesData = useCallback(async () => {
    if (!isAdmin || adminLoading || storiesLoading) return;
    
    setStoriesLoading(true);
    setStoriesError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStoriesError(t('authRequired') || 'Требуется авторизация');
        setStoriesLoading(false);
        return;
      }
      
      // Загружаем статистику историй
      await loadStoryStats();
      
      // Загружаем категории
      await loadCategoryStats();
      
      // Загружаем сами истории
      await loadStories();
      
    } catch (err) {
      console.error('Error loading stories data:', err);
      setStoriesError(t('networkError') || 'Ошибка сети');
    } finally {
      setStoriesLoading(false);
    }
  }, [isAdmin, adminLoading, storiesLoading, t]);

  const loadStoryStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('🔄 Загрузка статистики историй...');
      
      const response = await fetch('/api/stories/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Ответ сервера stats:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Данные статистики:', data);
        
        if (data.success) {
          // Проверяем разные возможные структуры ответа
          if (data.stats) {
            // Структура: { stats: { total_stories, published_stories, pending_stories, draft_stories, ... } }
            setStoryStats({
              total: data.stats.total_stories || 0,
              published: data.stats.published_stories || 0,
              pending: data.stats.pending_stories || 0,
              draft: data.stats.draft_stories || 0,
            });
            console.log('✅ Статистика загружена из data.stats:', data.stats);
          } else if (data.total !== undefined) {
            // Структура: { total, published, pending, draft, ... }
            setStoryStats({
              total: data.total || 0,
              published: data.published || 0,
              pending: data.pending || 0,
              draft: data.draft || 0,
            });
            console.log('✅ Статистика загружена из прямой структуры:', data);
          } else {
            console.warn('⚠️ Неожиданная структура статистики:', data);
            setStoryStats({
              total: 0,
              published: 0,
              pending: 0,
              draft: 0,
            });
          }
        } else {
          console.error('❌ Ошибка в ответе stats:', data.error);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка HTTP stats:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки статистики историй:', error);
    }
  };

  const loadCategoryStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('🔄 Загрузка статистики по категориям...');
      console.log('🔑 Токен:', token ? 'есть' : 'нет');
      
      const response = await fetch('/api/stories/admin/category-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Ответ сервера:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Данные категорий:', data);
        
        if (data.success && data.categories) {
          setCategoryStats(data.categories);
          console.log('✅ Категории загружены:', data.categories.length, 'категорий');
        } else {
          console.warn('⚠️ Неожиданная структура данных категорий:', data);
          setCategoryStats([]);
        }
      } else {
        console.error('❌ Ошибка HTTP:', response.status);
        setCategoryStats([]);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки статистики категорий:', error);
      setCategoryStats([]);
    }
  };

  const loadStories = async (customFilters = null, customPage = null) => {
    try {
      const token = localStorage.getItem('token');
      
      // Используем переданные фильтры или текущие из состояния
      const filtersToUse = customFilters || storyFilters;
      const pageToUse = customPage || storiesPagination.page;
      
      const params = new URLSearchParams({
        page: pageToUse.toString(),
        limit: storiesPagination.limit.toString()
      });
      
      if (filtersToUse.status !== 'all') {
        params.append('status', filtersToUse.status);
      }
      
      if (filtersToUse.category !== 'all') {
        params.append('category', filtersToUse.category);
      }
      
      if (filtersToUse.search) {
        params.append('search', filtersToUse.search);
      }
      
      console.log('🔄 Загрузка историй...', params.toString());
      
      // Пробуем оба возможных маршрута
      const url = `/api/stories/admin?${params}`;
      console.log('📡 Запрос к:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Ответ сервера stories:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Данные историй:', data);
        
        if (data.success) {
          setStories(data.stories || []);
          setStoriesPagination(prev => ({
            ...prev,
            page: pageToUse,
            total: data.pagination?.total || 0,
            totalPages: data.pagination?.totalPages || 1
          }));
          console.log('✅ Истории загружены:', data.stories?.length || 0, 'шт.');
        } else {
          console.error('❌ Ошибка в ответе stories:', data.error);
          // Попробуем альтернативный маршрут
          await tryAlternativeStoriesRoute(filtersToUse, pageToUse);
        }
      } else if (response.status === 404) {
        // Если 404, пробуем альтернативный маршрут
        console.log('⚠️ Маршрут /api/stories/admin не найден, пробуем /api/stories/admin/all');
        await tryAlternativeStoriesRoute(filtersToUse, pageToUse);
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка HTTP stories:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки историй:', error);
    }
  };
  
  // Альтернативный маршрут для историй
  const tryAlternativeStoriesRoute = async (filters, page) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: storiesPagination.limit.toString()
      });
      
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      
      const response = await fetch(`/api/stories/admin/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStories(data.stories || []);
          setStoriesPagination(prev => ({
            ...prev,
            page: page,
            total: data.pagination?.total || 0,
            totalPages: data.pagination?.totalPages || 1
          }));
          console.log('✅ Истории загружены через альтернативный маршрут:', data.stories?.length || 0, 'шт.');
        }
      }
    } catch (error) {
      console.error('❌ Ошибка в альтернативном маршруте:', error);
    }
  };
  
  

  const handleStoryFilterChange = (type, value) => {
    const newFilters = { ...storyFilters, [type]: value };
    setStoryFilters(newFilters);
    
    // Сбрасываем на первую страницу при изменении фильтров
    setStoriesPagination(prev => ({ ...prev, page: 1 }));
    
    // Загружаем заново с новыми фильтрами сразу
    if (type === 'search') {
      // Для поиска добавляем небольшую задержку
      setTimeout(() => {
        loadStoryStats();
        loadStories(newFilters, 1);
      }, 300);
    } else {
      // Для статуса и категории загружаем сразу
      loadStoryStats();
      loadStories(newFilters, 1);
    }
  };

  const handleStoryClearFilters = () => {
    const clearedFilters = {
      search: '',
      status: 'all',
      category: 'all'
    };
    setStoryFilters(clearedFilters);
    setStoriesPagination(prev => ({ ...prev, page: 1 }));
    setStoryStatusDropdownOpen(false);
    setStoryCategoryDropdownOpen(false);
    
    // Загружаем с очищенными фильтрами
    loadStoryStats();
    loadStories(clearedFilters, 1);
  };

  const handleStoryAction = async (storyId, action) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/stories/admin/${storyId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Обновляем данные
          loadStoryStats();
          loadStories();
          
          // Показываем уведомление
          let message = '';
          switch(action) {
            case 'publish':
              message = t('storyPublished') || 'История опубликована';
              break;
            case 'reject':
              message = t('storyRejected') || 'История отклонена';
              break;
            case 'unpublish':
              message = t('storyUnpublished') || 'История снята с публикации';
              break;
            default:
              message = t('operationCompleted') || 'Операция выполнена';
          }
          
          showSuccessModal(
            t('success') || 'Успешно',
            message
          );
        }
      }
    } catch (error) {
      console.error('Error updating story status:', error);
      showSuccessModal(
        t('error') || 'Ошибка',
        t('operationFailed') || 'Операция не выполнена'
      );
    }
  };

  const openStoryPreview = async (story) => {
    setSelectedStory(story);
    setPreviewModalOpen(true);
    setTranslatedContent({
      title: '',
      content: '',
      isTranslating: false
    });

    // Если язык не русский, переводим контент
    if (currentLanguage !== 'ru' && story.content) {
      setTranslatedContent(prev => ({ ...prev, isTranslating: true }));
      
      try {
        // Определяем язык заголовка и контента
        const titleLanguage = await detectTextLanguage(story.title);
        const contentLanguage = await detectTextLanguage(story.content);
        const targetLang = currentLanguage.toLowerCase();

        let translatedTitle = story.title;
        let translatedContent = story.content;

        // Переводим заголовок если нужно
        if (titleLanguage !== targetLang) {
          try {
            translatedTitle = await translateStoryContent(story.title, currentLanguage, titleLanguage);
          } catch (error) {
            console.warn('⚠️ Ошибка перевода заголовка:', error);
            translatedTitle = story.title;
          }
        }

        // Переводим контент если нужно
        if (contentLanguage !== targetLang) {
          try {
            translatedContent = await translateStoryContent(story.content, currentLanguage, contentLanguage);
          } catch (error) {
            console.warn('⚠️ Ошибка перевода контента:', error);
            translatedContent = story.content;
          }
        }

        setTranslatedContent({
          title: translatedTitle,
          content: translatedContent,
          isTranslating: false
        });
      } catch (error) {
        console.error('Translation error:', error);
        setTranslatedContent({
          title: story.title,
          content: story.content,
          isTranslating: false
        });
      }
    }
  };

  const closeStoryPreview = () => {
    setPreviewModalOpen(false);
    setSelectedStory(null);
    setTranslatedContent({
      title: '',
      content: '',
      isTranslating: false
    });
  };

  const handlePublishStory = (story) => {
    setConfirmModal({
      isOpen: true,
      title: t('confirmPublish') || 'Опубликовать историю?',
      message: t('confirmPublishMessage', { 
        title: story.title,
        author: story.user_nickname
      }) || `Опубликовать историю "${story.title}" от ${story.user_nickname}?`,
      onConfirm: () => handleStoryAction(story.id, 'publish')
    });
  };

  const handleRejectStory = (story) => {
    setConfirmModal({
      isOpen: true,
      title: t('confirmReject') || 'Отклонить историю?',
      message: t('confirmRejectMessage', { 
        title: story.title,
        author: story.user_nickname
      }) || `Отклонить историю "${story.title}" от ${story.user_nickname}?`,
      onConfirm: () => handleStoryAction(story.id, 'reject')
    });
  };

  const handleUnpublishStory = (story) => {
    setConfirmModal({
      isOpen: true,
      title: t('confirmUnpublish') || 'Снять с публикации?',
      message: t('confirmUnpublishMessage', { 
        title: story.title,
        author: story.user_nickname
      }) || `Снять с публикации историю "${story.title}" от ${story.user_nickname}? История будет перемещена в черновики.`,
      onConfirm: () => handleStoryAction(story.id, 'unpublish')
    });
  };

  const handleStoryPageChange = (newPage) => {
    if (newPage < 1 || newPage > storiesPagination.totalPages || newPage === storiesPagination.page) return;
    setStoriesPagination(prev => ({ ...prev, page: newPage }));
    loadStories(null, newPage);
  };

  // ==================== ФУНКЦИИ ДЛЯ ПОДДЕРЖКИ ====================

  const loadSupportStatsFromDB = useCallback(async () => {
    if (!isAdmin || adminLoading) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const statsResponse = await fetch(`/api/admin/simple-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(prev => ({
            ...prev,
            totalTickets: parseInt(statsData.totalTickets) || 0,
            pendingTickets: parseInt(statsData.pendingTickets) || 0,
            answeredTickets: parseInt(statsData.answeredTickets) || 0,
            closedTickets: parseInt(statsData.closedTickets) || 0
          }));
        }
      }
    } catch (error) {
      console.error('Error loading support stats:', error);
    }
  }, [isAdmin, adminLoading]);

  const loadSupportTickets = useCallback(async (filtersToUse = supportFilters, page = supportPagination.page) => {
    if (!isAdmin || adminLoading || supportLoading) return;
    
    setSupportLoading(true);
    setSupportError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSupportError(t('authRequired') || 'Требуется авторизация');
        setSupportLoading(false);
        return;
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: supportPagination.limit.toString()
      });
      
      // Всегда отправляем статус, даже 'all'
      if (filtersToUse.status) {
        params.append('status', filtersToUse.status);
      }
      
      if (filtersToUse.search) {
        params.append('search', filtersToUse.search);
      }
      
      console.log('Loading support tickets with params:', Object.fromEntries(params));
      
      const response = await fetch(`/api/admin/support/tickets?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
  
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
  
      const data = await response.json();
      
      if (data.success) {
        console.log('Support tickets loaded:', data.tickets?.length || 0, 'tickets');
        setSupportTickets(data.tickets || []);
        setSupportPagination(prev => ({
          ...prev,
          page,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1
        }));
      } else {
        setSupportError(data.message || t('errorLoadingTickets') || 'Ошибка загрузки обращений');
      }
      
    } catch (err) {
      console.error('Error loading support tickets:', err);
      setSupportError(t('networkError') || 'Ошибка сети');
    } finally {
      setSupportLoading(false);
    }
  }, [isAdmin, adminLoading, supportLoading, t, navigate, supportPagination.limit, supportFilters]);

  const handleSupportFilterChange = useCallback((type, value) => {
    const newFilters = { ...supportFilters, [type]: value };
    setSupportFilters(newFilters);
    
    if (supportSearchDebounceTimer.current) {
      clearTimeout(supportSearchDebounceTimer.current);
    }
    
    // Для статуса загружаем сразу, для поиска - с задержкой
    if (type === 'status') {
      supportSearchDebounceTimer.current = setTimeout(() => {
        loadSupportTickets(newFilters, 1);
      }, 100);
    } else {
      supportSearchDebounceTimer.current = setTimeout(() => {
        loadSupportTickets(newFilters, 1);
      }, 300);
    }
  }, [supportFilters, loadSupportTickets]);

  const handleSupportPageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > supportPagination.totalPages || newPage === supportPagination.page) return;
    loadSupportTickets(supportFilters, newPage);
  }, [supportFilters, supportPagination.totalPages, supportPagination.page, loadSupportTickets]);

  const handleResponseSubmit = async () => {
    if (!responseModal.response.trim()) {
      setResponseModal(prev => ({ ...prev, error: t('responseRequired') || 'Введите ответ' }));
      return;
    }
    
    if (responseModal.response.length > 2000) {
      setResponseModal(prev => ({ 
        ...prev, 
        error: t('responseTooLong') || 'Ответ слишком длинный (макс. 2000 символов)' 
      }));
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/support/tickets/${responseModal.ticketId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          response: responseModal.response.trim(),
          status: 'answered'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        loadSupportTickets();
        loadSupportStatsFromDB();
        
        showSuccessModal(
          t('responseSent') || 'Ответ отправлен',
          t('responseSentToUser', { username: responseModal.username }) || 
          `Ответ отправлен пользователю ${responseModal.username}`
        );
        
        setResponseModal(prev => ({ ...prev, isOpen: false }));
      } else {
        setResponseModal(prev => ({ ...prev, error: data.message }));
      }
      
    } catch (err) {
      console.error('Error sending response:', err);
      setResponseModal(prev => ({ 
        ...prev, 
        error: t('networkError') || 'Ошибка сети' 
      }));
    }
  };

  const handleCloseTicket = async (ticket) => {
    setConfirmModal({
      isOpen: true,
      title: t('confirmCloseTicket') || 'Закрыть обращение?',
      message: t('confirmCloseTicketMessage', { 
        ticketNumber: ticket.ticket_number,
        subject: ticket.subject
      }) || `Вы уверены, что хотите закрыть обращение ${ticket.ticket_number}?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          
          const response = await fetch(`/api/admin/support/tickets/${ticket.id}/close`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          if (data.success) {
            loadSupportTickets();
            loadSupportStatsFromDB();
            showSuccessModal(
              t('ticketClosed') || 'Обращение закрыто',
              t('ticketClosedSuccess', { ticketNumber: ticket.ticket_number }) || 
              `Обращение ${ticket.ticket_number} закрыто`
            );
          } else {
            showSuccessModal(
              t('error') || 'Ошибка', 
              data.message || t('operationFailed') || 'Операция не выполнена'
            );
          }
        } catch (err) {
          console.error('Error closing ticket:', err);
          showSuccessModal(
            t('networkErrorTitle') || 'Ошибка сети', 
            t('networkError') || 'Ошибка сети'
          );
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  // ==================== ФУНКЦИИ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ====================

  const loadStatsFromDB = useCallback(async () => {
    if (!isAdmin || adminLoading) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const statsResponse = await fetch(`/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(prev => ({
            ...prev,
            totalUsers: parseInt(statsData.totalUsers) || 0,
            totalAdmins: parseInt(statsData.totalAdmins) || 0,
            totalBanned: parseInt(statsData.totalBanned) || 0,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [isAdmin, adminLoading]);

  // Функция загрузки деталей бана для конкретного пользователя
  const loadBanDetailsForUser = useCallback(async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const response = await fetch(`/api/admin/users/${userId}/ban-details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.banDetails || {};
        }
      }
    } catch (error) {
      console.error(`Error loading ban details for user ${userId}:`, error);
    }
    return null;
  }, []);

  // Загрузка деталей банов для всех забаненных пользователей
  const loadBanDetailsForUsers = useCallback(async () => {
    if (!isAdmin || adminLoading || loading) return;
    
    const bannedUsers = users.filter(user => user.is_banned);
    
    for (const user of bannedUsers) {
      if (!banDetails[user.id]) {
        const details = await loadBanDetailsForUser(user.id);
        if (details) {
          setBanDetails(prev => ({ 
            ...prev, 
            [user.id]: details 
          }));
        }
      }
    }
  }, [users, isAdmin, adminLoading, loading, banDetails, loadBanDetailsForUser]);

  const loadUsers = useCallback(async (filtersToUse = filters, sortToUse = sortConfig, page = pagination.page) => {
    if (!isAdmin || adminLoading || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t('authRequired') || 'Требуется авторизация');
        setLoading(false);
        return;
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (sortToUse.key) {
        params.append('sortBy', sortToUse.key);
        params.append('sortOrder', sortToUse.direction === 'desc' ? 'DESC' : 'ASC');
      }
      
      if (filtersToUse.search) {
        params.append('search', filtersToUse.search);
      }
      if (filtersToUse.is_admin !== null) {
        params.append('is_admin', filtersToUse.is_admin.toString());
      }
      if (filtersToUse.is_banned !== null) {
        params.append('is_banned', filtersToUse.is_banned.toString());
      }
      
      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (response.status === 403) {
        setError(t('accessDenied') || 'Доступ запрещен. У вас нет прав администратора.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const usersData = data.users || [];
        const total = data.pagination?.total || 0;
        const totalPages = Math.ceil(total / pagination.limit);
        
        setUsers(usersData);
        setPagination(prev => ({
          ...prev,
          page,
          total,
          totalPages
        }));
      } else {
        setError(data.message || t('errorLoadingUsers') || 'Ошибка загрузки пользователей');
      }
      
    } catch (err) {
      console.error('Error loading users:', err);
      setError(t('networkError') || 'Ошибка сети. Проверьте подключение.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, adminLoading, loading, t, navigate, pagination.limit, filters, sortConfig]);

  const loadInitialData = useCallback(async () => {
    if (!isAdmin || adminLoading) return;
    
    await Promise.all([
      loadStatsFromDB(),
      loadUsers({ search: '', is_admin: null, is_banned: null }, sortConfig, 1)
    ]);
  }, [isAdmin, adminLoading, loadStatsFromDB, loadUsers, sortConfig]);

  const loadUserBanHistory = useCallback(async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return 0;
      
      const response = await fetch(`/api/admin/users/${userId}/ban-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.totalBans || 0;
        }
      }
    } catch (error) {
      console.error('Error loading ban history:', error);
    }
    
    return 0;
  }, []);

  const openBanModal = async (user) => {
    if (user.is_banned) {
      let message;
      const userBanDetails = banDetails[user.id];
      
      if (userBanDetails?.expires_at === null || userBanDetails?.is_permanent) {
        message = t('userAlreadyPermanentlyBanned', { 
          username: user.nickname || user.email 
        }) || `Пользователь ${user.nickname || user.email} уже забанен навсегда`;
      } else {
        message = t('userAlreadyBanned', { 
          username: user.nickname || user.email 
        }) || `Пользователь ${user.nickname || user.email} уже забанен`;
      }
      
      showSuccessModal(t('cannot') || 'Невозможно', message);
      return;
    }
    
    if (user.is_admin) {
      showSuccessModal(t('cannot') || 'Невозможно', t('cannotBanAdmin') || 'Нельзя заблокировать администратора');
      return;
    }
    
    if (currentUser?.id === user.id) {
      showSuccessModal(t('cannot') || 'Невозможно', t('cannotBanSelf') || 'Нельзя заблокировать самого себя');
      return;
    }
    
    const banCountFromTable = user.ban_count || 0;
    const banCountFromHistory = await loadUserBanHistory(user.id);
    const currentBanCount = Math.max(banCountFromTable, banCountFromHistory);
    
    let defaultDuration = '24';
    let defaultDurationType = 'hours';
    
    if (currentBanCount >= 3) {
      defaultDuration = 'permanent';
      defaultDurationType = 'permanent';
    }
    
    setBanModal({
      isOpen: true,
      userId: user.id,
      username: user.nickname || user.email,
      currentBanCount: currentBanCount,
      reason: '',
      duration: defaultDuration,
      durationType: defaultDurationType,
      error: ''
    });
    setDurationDropdownOpen(false);
  };

  const closeBanModal = () => {
    setBanModal({
      isOpen: false,
      userId: null,
      username: '',
      currentBanCount: 0,
      reason: '',
      duration: '24',
      durationType: 'hours',
      error: ''
    });
    setDurationDropdownOpen(false);
  };

  const calculateBanDuration = () => {
    const currentCount = banModal.currentBanCount;
    const newCount = currentCount + 1;
    
    if (newCount >= 4) {
      return {
        duration: null,
        isPermanent: true,
        reason: t('automaticPermanentBan') || 'Автоматическая вечная блокировка (4 и более нарушений)'
      };
    }
    
    if (banModal.durationType === 'permanent') {
      return {
        duration: null,
        isPermanent: true,
        reason: banModal.reason.trim()
      };
    }
    
    return {
      duration: parseInt(banModal.duration),
      isPermanent: false,
      reason: banModal.reason.trim()
    };
  };

  const confirmBan = async () => {
    if (!banModal.reason.trim()) {
      setBanModal(prev => ({ ...prev, error: t('specifyReason') || 'Укажите причину бана' }));
      return;
    }
    
    if (banModal.reason.length > 500) {
      setBanModal(prev => ({ ...prev, error: t('reasonTooLong') || 'Причина слишком длинная (макс. 500 символов)' }));
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const { duration, isPermanent, reason } = calculateBanDuration();
      const newBanCount = banModal.currentBanCount + 1;
      
      const response = await fetch(`/api/admin/users/${banModal.userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          reason: reason,
          duration_hours: duration,
          is_permanent: isPermanent
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Загружаем обновленные детали бана
        const updatedBanDetails = await loadBanDetailsForUser(banModal.userId);
        if (updatedBanDetails) {
          setBanDetails(prev => ({
            ...prev,
            [banModal.userId]: updatedBanDetails
          }));
        }
        
        const updatedUsers = users.map(user => 
          user.id === banModal.userId ? { 
            ...user, 
            is_banned: true,
            ban_reason: reason,
            ban_count: newBanCount
          } : user
        );
        
        setUsers(updatedUsers);
        
        loadStatsFromDB();
        loadUsers(filters, sortConfig, pagination.page);
        
        let successMessage = '';
        if (newBanCount >= 4) {
          successMessage = t('userPermanentlyBanned', { 
            username: banModal.username,
            count: newBanCount 
          }) || `Пользователь ${banModal.username} заблокирован навсегда (${newBanCount} нарушений)`;
        } else if (isPermanent) {
          successMessage = t('userPermanentlyBannedManual', { 
            username: banModal.username 
          }) || `Пользователь ${banModal.username} заблокирован навсегда`;
        } else {
          const durationLabel = banDurations.find(d => d.value === banModal.duration)?.label || '24 часа';
          successMessage = t('userBannedSuccess', { 
            username: banModal.username,
            duration: durationLabel
          }) || `Пользователь ${banModal.username} был забанен на ${durationLabel}`;
        }
        
        showSuccessModal(t('userBanned') || 'Пользователь забанен', successMessage);
        closeBanModal();
      } else {
        setBanModal(prev => ({ ...prev, error: data.message }));
      }
      
    } catch (err) {
      console.error('Error banning user:', err);
      setBanModal(prev => ({ 
        ...prev, 
        error: t('networkError') || 'Ошибка сети' 
      }));
    }
  };

  const handleUnban = async (user) => {
    const realBanCount = await loadUserBanHistory(user.id);
    
    setConfirmModal({
      isOpen: true,
      title: t('confirmUnban') || 'Разбанить пользователя?',
      message: t('confirmUnbanMessage', { 
        username: user.nickname || user.email,
        count: realBanCount
      }) || `Вы уверены, что хотите разбанить пользователя ${user.nickname || user.email}? (Был забанен ${realBanCount} раз)`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          
          const response = await fetch(`/api/admin/users/${user.id}/unban`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          if (data.success) {
            // Удаляем детали бана
            setBanDetails(prev => {
              const newDetails = { ...prev };
              delete newDetails[user.id];
              return newDetails;
            });
            
            const updatedUsers = users.map(u => 
              u.id === user.id ? { 
                ...u, 
                is_banned: false,
                ban_reason: null,
                ban_count: 0
              } : u
            );
            
            setUsers(updatedUsers);
            
            loadStatsFromDB();
            loadUsers(filters, sortConfig, pagination.page);
            
            showSuccessModal(
              t('userUnbanned') || 'Пользователь разбанен', 
              t('userUnbannedSuccess', { username: user.nickname || user.email }) || 
              `Пользователь ${user.nickname || user.email} был разбанен`
            );
          } else {
            showSuccessModal(
              t('error') || 'Ошибка', 
              data.message || t('operationFailed') || 'Операция не выполнена'
            );
          }
        } catch (err) {
          console.error('Error unbanning user:', err);
          showSuccessModal(
            t('networkErrorTitle') || 'Ошибка сети', 
            t('networkError') || 'Ошибка сети'
          );
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  const handleAdminToggle = (user) => {
    const action = user.is_admin ? 'removeAdmin' : 'makeAdmin';
    const messages = {
      makeAdmin: {
        title: t('confirmMakeAdmin') || 'Назначить администратором?',
        message: t('confirmMakeAdminMessage', { username: user.nickname || user.email }) || 
          `Назначить пользователя ${user.nickname || user.email} администратором?`,
        success: t('makeAdminSuccess', { username: user.nickname || user.email }) || 
          `Пользователь ${user.nickname || user.email} назначен администратором`
      },
      removeAdmin: {
        title: t('confirmRemoveAdmin') || 'Убрать права администратора?',
        message: t('confirmRemoveAdminMessage', { username: user.nickname || user.email }) || 
          `Убрать права администратора у пользователя ${user.nickname || user.email}?`,
        success: t('removeAdminSuccess', { username: user.nickname || user.email }) || 
          `Пользователь ${user.nickname || user.email} лишен прав администратора`
      }
    };
    
    setConfirmModal({
      isOpen: true,
      title: messages[action].title,
      message: messages[action].message,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          
          const response = await fetch(`/api/admin/users/${user.id}/admin`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ is_admin: !user.is_admin })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          if (data.success) {
            const updatedUsers = users.map(u => 
              u.id === user.id ? { ...u, is_admin: !user.is_admin } : u
            );
            
            setUsers(updatedUsers);
            
            loadStatsFromDB();
            loadUsers(filters, sortConfig, pagination.page);
            
            showSuccessModal(t('success') || 'Успешно', messages[action].success);
          } else {
            showSuccessModal(
              t('error') || 'Ошибка', 
              data.message || t('operationFailed') || 'Операция не выполнена'
            );
          }
        } catch (err) {
          console.error('Error updating admin status:', err);
          showSuccessModal(
            t('networkErrorTitle') || 'Ошибка сети', 
            t('networkError') || 'Ошибка сети'
          );
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  // ==================== ОБРАБОТЧИКИ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ====================

  const handleFilterChange = useCallback((filterType, value) => {
    const newFilters = { 
      ...filters, 
      [filterType]: value 
    };
    
    setFilters(newFilters);
    loadUsers(newFilters, sortConfig, 1);
  }, [filters, sortConfig, loadUsers]);

  const handleSearchChange = useCallback((searchValue) => {
    setFilters(prev => ({ ...prev, search: searchValue }));
    
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    
    searchDebounceTimer.current = setTimeout(() => {
      loadUsers({ ...filters, search: searchValue }, sortConfig, 1);
    }, 500);
  }, [filters, sortConfig, loadUsers]);

  const handleSort = useCallback((key) => {
    if (key === 'email') return;
    
    const newSortConfig = {
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc'
    };
    
    setSortConfig(newSortConfig);
    loadUsers(filters, newSortConfig, 1);
  }, [sortConfig, filters, loadUsers]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === pagination.page) return;
    loadUsers(filters, sortConfig, newPage);
  }, [filters, sortConfig, pagination.totalPages, pagination.page, loadUsers]);

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
      loadUsers(filters, sortConfig, 1);
    }
  };

  const handleSearchClick = () => {
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    loadUsers(filters, sortConfig, 1);
  };

  const handleClearFilters = () => {
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    
    const clearedFilters = {
      search: '',
      is_admin: null,
      is_banned: null
    };
    
    setFilters(clearedFilters);
    setRoleDropdownOpen(false);
    setStatusDropdownOpen(false);
    loadUsers(clearedFilters, sortConfig, 1);
  };

  const handleRefresh = () => {
    if (activeTab === 'users') {
      loadStatsFromDB();
      loadUsers(filters, sortConfig, pagination.page);
    } else if (activeTab === 'support') {
      loadSupportStatsFromDB();
      loadSupportTickets();
    } else if (activeTab === 'reviews') {
      loadStoriesData();
    }
  };

  // ==================== РЕНДЕРИНГ ====================

  const renderTableHeader = (key, label, sortable = true) => {
    const isSorted = sortConfig.key === key;
    const direction = sortConfig.direction;
    
    if (sortable) {
      return (
        <th 
          onClick={() => handleSort(key)}
          className={`sortable ${isSorted ? 'sorted' : ''}`}
          style={{ cursor: 'pointer' }}
        >
          {t(label) || label}
          {isSorted && (
            <span className="sort-icon">
              {direction === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </th>
      );
    }
    
    return <th>{t(label) || label}</th>;
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    pages.push(
      <button
        key="prev"
        onClick={() => handlePageChange(pagination.page - 1)}
        disabled={pagination.page === 1 || loading}
        className="pagination-button"
      >
        <span className="material-icons">chevron_left</span>
      </button>
    );
    
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className={`pagination-button ${1 === pagination.page ? 'active' : ''}`}
          disabled={loading}
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="pagination-ellipsis">
            ...
          </span>
        );
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-button ${i === pagination.page ? 'active' : ''}`}
          disabled={loading}
        >
          {i}
        </button>
      );
    }
    
    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="pagination-ellipsis">
            ...
          </span>
        );
      }
      
      pages.push(
        <button
          key={pagination.totalPages}
          onClick={() => handlePageChange(pagination.totalPages)}
          className={`pagination-button ${pagination.totalPages === pagination.page ? 'active' : ''}`}
          disabled={loading}
        >
          {pagination.totalPages}
        </button>
      );
    }
    
    pages.push(
      <button
        key="next"
        onClick={() => handlePageChange(pagination.page + 1)}
        disabled={pagination.page === pagination.totalPages || loading}
        className="pagination-button"
      >
        <span className="material-icons">chevron_right</span>
      </button>
    );
    
    return (
      <div className="pagination-container">
        <div className="pagination-info">
          {t('showing') || 'Показано'}: <strong>{(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> {t('of') || 'из'} <strong>{pagination.total}</strong>
        </div>
        <div className="pagination-buttons">
          {pages}
        </div>
      </div>
    );
  };

  const renderSupportPagination = () => {
    if (supportPagination.totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, supportPagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(supportPagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    pages.push(
      <button
        key="prev"
        onClick={() => handleSupportPageChange(supportPagination.page - 1)}
        disabled={supportPagination.page === 1 || supportLoading}
        className="pagination-button"
      >
        <span className="material-icons">chevron_left</span>
      </button>
    );
    
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handleSupportPageChange(1)}
          className={`pagination-button ${1 === supportPagination.page ? 'active' : ''}`}
          disabled={supportLoading}
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="pagination-ellipsis">
            ...
          </span>
        );
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handleSupportPageChange(i)}
          className={`pagination-button ${i === supportPagination.page ? 'active' : ''}`}
          disabled={supportLoading}
        >
          {i}
        </button>
      );
    }
    
    if (endPage < supportPagination.totalPages) {
      if (endPage < supportPagination.totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="pagination-ellipsis">
            ...
          </span>
        );
      }
      
      pages.push(
        <button
          key={supportPagination.totalPages}
          onClick={() => handleSupportPageChange(supportPagination.totalPages)}
          className={`pagination-button ${supportPagination.totalPages === supportPagination.page ? 'active' : ''}`}
          disabled={supportLoading}
        >
          {supportPagination.totalPages}
        </button>
      );
    }
    
    pages.push(
      <button
        key="next"
        onClick={() => handleSupportPageChange(supportPagination.page + 1)}
        disabled={supportPagination.page === supportPagination.totalPages || supportLoading}
        className="pagination-button"
      >
        <span className="material-icons">chevron_right</span>
      </button>
    );
    
    return (
      <div className="pagination-container">
        <div className="pagination-info">
          {t('showing') || 'Показано'}: <strong>{(supportPagination.page - 1) * supportPagination.limit + 1}-{Math.min(supportPagination.page * supportPagination.limit, supportPagination.total)}</strong> {t('of') || 'из'} <strong>{supportPagination.total}</strong>
        </div>
        <div className="pagination-buttons">
          {pages}
        </div>
      </div>
    );
  };

  const renderStoriesPagination = () => {
    if (storiesPagination.totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, storiesPagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(storiesPagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    pages.push(
      <button
        key="prev"
        onClick={() => handleStoryPageChange(storiesPagination.page - 1)}
        disabled={storiesPagination.page === 1 || storiesLoading}
        className="pagination-button"
      >
        <span className="material-icons">chevron_left</span>
      </button>
    );
    
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handleStoryPageChange(1)}
          className={`pagination-button ${1 === storiesPagination.page ? 'active' : ''}`}
          disabled={storiesLoading}
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="pagination-ellipsis">
            ...
          </span>
        );
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handleStoryPageChange(i)}
          className={`pagination-button ${i === storiesPagination.page ? 'active' : ''}`}
          disabled={storiesLoading}
        >
          {i}
        </button>
      );
    }
    
    if (endPage < storiesPagination.totalPages) {
      if (endPage < storiesPagination.totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="pagination-ellipsis">
            ...
          </span>
        );
      }
      
      pages.push(
        <button
          key={storiesPagination.totalPages}
          onClick={() => handleStoryPageChange(storiesPagination.totalPages)}
          className={`pagination-button ${storiesPagination.totalPages === storiesPagination.page ? 'active' : ''}`}
          disabled={storiesLoading}
        >
          {storiesPagination.totalPages}
        </button>
      );
    }
    
    pages.push(
      <button
        key="next"
        onClick={() => handleStoryPageChange(storiesPagination.page + 1)}
        disabled={storiesPagination.page === storiesPagination.totalPages || storiesLoading}
        className="pagination-button"
      >
        <span className="material-icons">chevron_right</span>
      </button>
    );
    
    return (
      <div className="pagination-container">
        <div className="pagination-info">
          {t('showing') || 'Показано'}: <strong>{(storiesPagination.page - 1) * storiesPagination.limit + 1}-{Math.min(storiesPagination.page * storiesPagination.limit, storiesPagination.total)}</strong> {t('of') || 'из'} <strong>{storiesPagination.total}</strong>
        </div>
        <div className="pagination-buttons">
          {pages}
        </div>
      </div>
    );
  };

  const renderUsersTab = () => {
    return (
      <div className="admin-section">
        <div className="section-header">
          <h2>{t('manageUsers') || 'Управление пользователями'}</h2>
          <div className="section-actions">
            <button 
              onClick={handleRefresh} 
              className="refresh-button"
              disabled={loading || adminLoading}
            >
              <span className="material-icons">refresh</span>
              {t('refresh') || 'Обновить'}
            </button>
            <button 
              onClick={async () => {
                try {
                  const result = await exportAllUsers(t);
                  if (!result.success) {
                    console.error('Export error:', result.error);
                  }
                } catch (error) {
                  console.error('Export error:', error.message);
                }
              }}
              className="export-button"
              disabled={loading}
              title={t('exportToExcel') || 'Экспорт в Excel (все пользователи)'}
            >
              <span className="material-icons">download</span>
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon users">
              <span className="material-icons">people</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalUsers || 0}</div>
              <div className="stat-label">{t('totalUsers') || 'Всего пользователей'}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon admins">
              <span className="material-icons">admin_panel_settings</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalAdmins || 0}</div>
              <div className="stat-label">{t('totalAdmins') || 'Администраторов'}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon banned">
              <span className="material-icons">block</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalBanned || 0}</div>
              <div className="stat-label">{t('totalBanned') || 'Забаненных'}</div>
            </div>
          </div>
        </div>

        <div className="filters-panel">
          <div className="search-box">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder={t('searchPlaceholder') || "Поиск по email или никнейму..."}
              className="search-input"
              disabled={loading}
            />
            <button onClick={handleSearchClick} className="search-button" disabled={loading}>
              <span className="material-icons">search</span>
            </button>
          </div>
          
          <div className="filter-buttons">
            <div className="admin-filter-dropdown">
              <div 
                className={`admin-dropdown-trigger ${roleDropdownOpen ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setRoleDropdownOpen(!roleDropdownOpen);
                  setStatusDropdownOpen(false);
                }}
              >
                <span>{getRoleLabel()}</span>
                <svg 
                  className={`admin-dropdown-arrow ${roleDropdownOpen ? 'rotated' : ''}`}
                  width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" 
                    fill="currentColor"
                  />
                </svg>
              </div>
              {roleDropdownOpen && (
                <div className="admin-dropdown-options">
                  {roleOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`admin-dropdown-option ${filters.is_admin === option.value ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilterChange('is_admin', option.value);
                        setRoleDropdownOpen(false);
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-filter-dropdown">
              <div 
                className={`admin-dropdown-trigger ${statusDropdownOpen ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusDropdownOpen(!statusDropdownOpen);
                  setRoleDropdownOpen(false);
                }}
              >
                <span>{getStatusLabel(filters.is_banned)}</span>
                <svg 
                  className={`admin-dropdown-arrow ${statusDropdownOpen ? 'rotated' : ''}`}
                  width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" 
                    fill="currentColor"
                  />
                </svg>
              </div>
              {statusDropdownOpen && (
                <div className="admin-dropdown-options">
                  {statusOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`admin-dropdown-option ${filters.is_banned === option.value ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilterChange('is_banned', option.value);
                        setStatusDropdownOpen(false);
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleClearFilters}
              className="admin-clear-filters-button"
              disabled={loading || (!filters.search && filters.is_admin === null && filters.is_banned === null)}
            >
              <span className="material-icons">clear_all</span>
              {t('clearFilters') || 'Сбросить'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('loadingUsers') || 'Загрузка пользователей...'}</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <span className="material-icons">error_outline</span>
            <h3>{t('error') || 'Ошибка'}</h3>
            <p>{error}</p>
            <button onClick={handleRefresh} className="retry-button">
              <span className="material-icons">refresh</span>
              {t('tryAgain') || 'Попробовать снова'}
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons">people_outline</span>
            <h3>{t('noUsersFound') || 'Пользователи не найдены'}</h3>
            <p>
              {filters.search || filters.is_admin !== null || filters.is_banned !== null 
                ? t('changeSearchParams') || 'Измените параметры поиска или попробуйте позже.'
                : t('noUsersInSystem') || 'В системе пока нет пользователей.'}
            </p>
            {(filters.search || filters.is_admin !== null || filters.is_banned !== null) && (
              <button 
                onClick={handleClearFilters}
                className="retry-button"
              >
                {t('showAllUsers') || 'Показать всех пользователей'}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    {renderTableHeader('id', 'ID')}
                    {renderTableHeader('email', 'Email', false)}
                    {renderTableHeader('nickname', 'nickname')}
                    {renderTableHeader('created_at', 'registrationDate')}
                    <th>{t('ecoLevel') || 'Эко-уровень'}</th>
                    {renderTableHeader('carbon_saved', 'CO₂')}
                    <th>{t('status') || 'Статус'}</th>
                    <th>{t('bansCount') || 'Баны'}</th>
                    <th>{t('actions') || 'Действия'}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr 
                      key={user.id} 
                      className={`
                        ${user.is_admin ? 'admin-row' : ''}
                        ${user.is_banned ? 'banned-row' : ''}
                        ${currentUser?.id === user.id ? 'current-user-row' : ''}
                      `}
                    >
                      <td className="user-id">#{user.id}</td>
                      <td className="user-email">
                        <div className="email-cell">
                          <span className="email-text">{user.email}</span>
                        </div>
                      </td>
                      <td className="user-nickname">
                        <div className="nickname-cell">
                          <span className="avatar-emoji">{getUserAvatar(user)}</span>
                          <span className="nickname-text">{user.nickname || t('noNickname') || 'Без никнейма'}</span>
                        </div>
                      </td>
                      <td className="registration-date">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="eco-level">
                        <span className={`level-badge ${getEcoLevelClass(user.carbon_saved || 0)}`}>
                          {getTranslatedEcoLevel(user.carbon_saved || 0)}
                        </span>
                      </td>
                      <td className="carbon-saved">
                        <div className="carbon-info">
                          <span className="material-icons">eco</span>
                          {formatCarbonSaved(user.carbon_saved || 0)}
                        </div>
                      </td>
                      <td className="user-status">
                        <div className="status-cell">
                          {user.is_banned ? (
                            <span className="status-badge banned with-info-icon">
                              <span className="material-icons">block</span>
                              {t('banned') || 'Забанен'}
                              <span 
                                className="material-icons ban-info-icon" 
                                title={getBanTooltipText(user)}
                              >
                                {(() => {
                                  const details = banDetails[user.id];
                                  if (!details) return 'hourglass_empty';
                                  if (details.is_permanent || details.expires_at === null) return 'warning';
                                  return 'info';
                                })()}
                              </span>
                            </span>
                          ) : user.is_admin ? (
                            <span className="status-badge admin">
                              <span className="material-icons">admin_panel_settings</span>
                              {t('admin') || 'Админ'}
                            </span>
                          ) : (
                            <span className="status-badge active">
                              <span className="material-icons">check_circle</span>
                              {t('active') || 'Активен'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="ban-count-cell">
                        <div className="ban-count-info">
                          <span className={`ban-count ${(user.ban_count || 0) >= 3 ? 'ban-count-danger' : ''}`}>
                            {user.ban_count || 0}
                          </span>
                          {!user.is_banned && (user.ban_count || 0) >= 3 && (
                            <span className="ban-warning-icon" title={t('nextBanPermanent') || 'Следующий бан будет вечным'}>
                              <span className="material-icons">warning</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="user-actions">
                        <div className="action-buttons">
                          {!user.is_banned && (
                            <button
                              onClick={() => handleAdminToggle(user)}
                              className={`action-button ${user.is_admin ? 'remove-admin' : 'make-admin'}`}
                              title={user.is_admin ? 
                                t('removeAdminRights') || 'Убрать права администратора' :
                                t('makeAdmin') || 'Назначить администратором'
                              }
                              disabled={currentUser?.id === user.id}
                            >
                              <span className="material-icons">
                                {user.is_admin ? 'person_remove' : 'admin_panel_settings'}
                              </span>
                            </button>
                          )}
                          
                          <button
                            onClick={() => user.is_banned ? handleUnban(user) : openBanModal(user)}
                            className={`action-button ${user.is_banned ? 'unban' : 'ban'}`}
                            title={user.is_banned ? 
                              t('unbanUser') || 'Разбанить пользователя' :
                              t('banUser') || 'Забанить пользователя'
                            }
                            disabled={currentUser?.id === user.id || user.is_admin}
                          >
                            <span className="material-icons">
                              {user.is_banned ? 'lock_open' : 'block'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {renderPagination()}
          </>
        )}
      </div>
    );
  };

  const renderSupportTab = () => {
    return (
      <div className="admin-section">
        <div className="section-header">
          <h2>{t('manageSupportTickets') || 'Управление обращениями'}</h2>
          <div className="section-actions">
            <button 
              onClick={handleRefresh}
              className="refresh-button"
              disabled={supportLoading}
            >
              <span className="material-icons">refresh</span>
              {t('refresh') || 'Обновить'}
            </button>
            <button 
              onClick={async () => {
                try {
                  const result = await exportAllSupportTickets(t, currentLanguage);
                  if (!result.success) {
                    console.error('Export error:', result.error);
                  }
                } catch (error) {
                  console.error('Export error:', error.message);
                }
              }}
              className="export-button"
              disabled={supportLoading}
              title={t('exportToExcel') || 'Экспорт в Excel (все тикеты)'}
            >
              <span className="material-icons">download</span>
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon support">
              <span className="material-icons">help_outline</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">
                {stats.totalTickets || 0}
              </div>
              <div className="stat-label">{t('totalTickets') || 'Всего обращений'}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon pending">
              <span className="material-icons">schedule</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">
                {stats.pendingTickets || 0}
              </div>
              <div className="stat-label">{t('pendingTickets') || 'Ожидают ответа'}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon answered">
              <span className="material-icons">check_circle</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">
                {stats.answeredTickets || 0}
              </div>
              <div className="stat-label">{t('answeredTickets') || 'Отвечено'}</div>
            </div>
          </div>
        </div>

        <div className="filters-panel">
          <div className="search-box">
            <input
              type="text"
              value={supportFilters.search}
              onChange={(e) => handleSupportFilterChange('search', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadSupportTickets()}
              placeholder={t('searchSupportPlaceholder') || "Поиск по теме или email..."}
              className="search-input"
              disabled={supportLoading}
            />
            <button onClick={() => loadSupportTickets()} className="search-button" disabled={supportLoading}>
              <span className="material-icons">search</span>
            </button>
          </div>
          
          <div className="filter-buttons">
            <div className="support-filter-dropdown admin-filter-dropdown">
              <div 
                className={`admin-dropdown-trigger ${supportStatusDropdownOpen ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSupportStatusDropdownOpen(!supportStatusDropdownOpen);
                }}
              >
                <span>{getSupportStatusLabel()}</span>
                <svg 
                  className={`admin-dropdown-arrow ${supportStatusDropdownOpen ? 'rotated' : ''}`}
                  width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" 
                    fill="currentColor"
                  />
                </svg>
              </div>
              {supportStatusDropdownOpen && (
                <div className="admin-dropdown-options">
                  {supportStatusOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`admin-dropdown-option ${supportFilters.status === option.value ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSupportFilterChange('status', option.value);
                        setSupportStatusDropdownOpen(false);
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                setSupportFilters({ search: '', status: 'all' });
                setSupportStatusDropdownOpen(false);
                loadSupportTickets({ search: '', status: 'all' }, 1);
              }}
              className="admin-clear-filters-button"
              disabled={supportLoading || (!supportFilters.search && supportFilters.status === 'all')}
            >
              <span className="material-icons">clear_all</span>
              {t('clearFilters') || 'Сбросить'}
            </button>
          </div>
        </div>

        {supportLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('loadingTickets') || 'Загрузка обращений...'}</p>
          </div>
        ) : supportError ? (
          <div className="error-state">
            <span className="material-icons">error_outline</span>
            <h3>{t('error') || 'Ошибка'}</h3>
            <p>{supportError}</p>
            <button onClick={() => loadSupportTickets()} className="retry-button">
              <span className="material-icons">refresh</span>
              {t('tryAgain') || 'Попробовать снова'}
            </button>
          </div>
        ) : supportTickets.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons">support</span>
            <h3>{t('noTicketsFound') || 'Обращения не найдены'}</h3>
            <p>
              {supportFilters.search || supportFilters.status !== 'all' 
                ? t('changeSearchParams') || 'Измените параметры поиска.'
                : t('noTicketsInSystem') || 'Нет обращений в системе.'}
            </p>
            {(supportFilters.search || supportFilters.status !== 'all') && (
              <button 
                onClick={() => {
                  setSupportFilters({ search: '', status: 'all' });
                  loadSupportTickets({ search: '', status: 'all' }, 1);
                }}
                className="retry-button"
              >
                {t('showAllTickets') || 'Показать все обращения'}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="support-tickets-container">
              <table className="support-tickets-table">
                <thead>
                  <tr>
                    <th>{t('ticketNumber') || '№'}</th>
                    <th>{t('user') || 'Пользователь'}</th>
                    <th>{t('subject') || 'Тема'}</th>
                    <th>{t('status') || 'Статус'}</th>
                    <th>{t('createdAt') || 'Дата'}</th>
                    <th>{t('actions') || 'Действия'}</th>
                  </tr>
                </thead>
                <tbody>
                  {supportTickets.map(ticket => (
                    <tr key={ticket.id} className={`ticket-row ${ticket.status}`}>
                      <td className="ticket-number">
                        <strong>{ticket.ticket_number}</strong>
                      </td>
                      <td className="ticket-user">
                        <div className="user-info">
                          <div className="user-email">{ticket.user_email}</div>
                          {ticket.user_nickname && (
                            <div className="user-nickname">{ticket.user_nickname}</div>
                          )}
                        </div>
                      </td>
                      <td className="ticket-subject" title={ticket.subject}>
                        {ticket.subject}
                      </td>
                      <td className="ticket-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(ticket.status) }}
                        >
                          {getSupportStatusBadgeLabel(ticket.status)}
                        </span>
                      </td>
                      <td className="ticket-date">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="ticket-actions">
                        <div className="action-buttons">
                          <button
                            onClick={() => {
                              setResponseModal({
                                isOpen: true,
                                ticketId: ticket.id,
                                ticketNumber: ticket.ticket_number,
                                userId: ticket.user_id,
                                username: ticket.user_nickname || ticket.user_email,
                                userEmail: ticket.user_email,
                                subject: ticket.subject,
                                message: ticket.message,
                                response: ticket.admin_response || '',
                                error: ''
                              });
                            }}
                            className="action-button view-response"
                            title={ticket.admin_response ? 
                              t('viewResponse') || 'Просмотреть' : 
                              t('respondToTicket') || 'Ответить'
                            }
                          >
                            <span className="material-icons">
                              {ticket.admin_response ? 'visibility' : 'reply'}
                            </span>
                          </button>
                          
                          {ticket.status === 'pending' && (
                            <button
                              onClick={() => handleCloseTicket(ticket)}
                              className="action-button close-ticket"
                              title={t('closeTicket') || 'Закрыть обращение'}
                            >
                              <span className="material-icons">check_circle</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {renderSupportPagination()}
          </>
        )}
      </div>
    );
  };

  const renderReviewsTab = () => {
    return (
      <div className="admin-section">
        <div className="section-header">
          <h2>{t('manageReviews') || 'Управление историями'}</h2>
          <div className="section-actions">
            <button 
              onClick={handleRefresh}
              className="refresh-button"
              disabled={storiesLoading}
            >
              <span className="material-icons">refresh</span>
              {t('refresh') || 'Обновить'}
            </button>
          </div>
        </div>

        {/* Четыре блока статистики */}
        <div className="stats-grid">
         <div className="stat-card">
  <div className="stat-icon stories">
    <span className="material-icons">history</span>
  </div>
  <div className="stat-info">
    <div className="stat-value">{storyStats.total || 0}</div>
    <div className="stat-label">{t('totalStories') || 'Всего историй'}</div>
  </div>
</div>

<div className="stat-card">
  <div className="stat-icon published">
    <span className="material-icons">check_circle</span>
  </div>
  <div className="stat-info">
    <div className="stat-value">{storyStats.published || 0}</div>
    <div className="stat-label">{t('published') || 'Опубликованные'}</div>
  </div>
</div>

<div className="stat-card">
  <div className="stat-icon pending-stories">
    <span className="material-icons">schedule</span>
  </div>
  <div className="stat-info">
    <div className="stat-value">{storyStats.pending || 0}</div>
    <div className="stat-label">{t('pendingReview') || 'На проверке'}</div>
  </div>
</div>

<div className="stat-card">
  <div className="stat-icon draft">
    <span className="material-icons">description</span>
  </div>
  <div className="stat-info">
    <div className="stat-value">{storyStats.draft || 0}</div>
    <div className="stat-label">{t('draft') || 'Черновики'}</div>
  </div>
</div>
        </div>

        {/* Статистика по категориям */}
        {categoryStats.length > 0 && (
          <div className="category-stats-section">
            <h3>{t('storiesByCategory') || 'Истории по категориям'}</h3>
            <div className="category-stats-grid">
              {categoryStats.map(category => (
                <div key={category.category} className="category-stat-item">
                  <div className="category-name">{getTranslatedCategory(category.category)}</div>
                  <div className="category-count">{category.count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Фильтры */}
        <div className="filters-panel">
          <div className="search-box">
            <input
              type="text"
              value={storyFilters.search}
              onChange={(e) => handleStoryFilterChange('search', e.target.value)}
              placeholder={t('searchStoriesPlaceholder') || "Поиск по заголовку или автору..."}
              className="search-input"
              disabled={storiesLoading}
            />
            <button onClick={() => loadStories()} className="search-button" disabled={storiesLoading}>
              <span className="material-icons">search</span>
            </button>
          </div>
          
          <div className="filter-buttons">
            <div className="story-filter-dropdown admin-filter-dropdown">
              <div 
                className={`admin-dropdown-trigger ${storyStatusDropdownOpen ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setStoryStatusDropdownOpen(!storyStatusDropdownOpen);
                  setStoryCategoryDropdownOpen(false);
                }}
              >
                <span>{getStoryStatusLabel()}</span>
                <svg 
                  className={`admin-dropdown-arrow ${storyStatusDropdownOpen ? 'rotated' : ''}`}
                  width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" 
                    fill="currentColor"
                  />
                </svg>
              </div>
              {storyStatusDropdownOpen && (
                <div className="admin-dropdown-options">
                  {storyStatusOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`admin-dropdown-option ${storyFilters.status === option.value ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStoryFilterChange('status', option.value);
                        setStoryStatusDropdownOpen(false);
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="story-filter-dropdown admin-filter-dropdown">
              <div 
                className={`admin-dropdown-trigger ${storyCategoryDropdownOpen ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setStoryCategoryDropdownOpen(!storyCategoryDropdownOpen);
                  setStoryStatusDropdownOpen(false);
                }}
              >
                <span>{getCategoryLabel()}</span>
                <svg 
                  className={`admin-dropdown-arrow ${storyCategoryDropdownOpen ? 'rotated' : ''}`}
                  width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" 
                    fill="currentColor"
                  />
                </svg>
              </div>
              {storyCategoryDropdownOpen && (
                <div className="admin-dropdown-options">
                  <div
                    className={`admin-dropdown-option ${storyFilters.category === 'all' ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStoryFilterChange('category', 'all');
                      setStoryCategoryDropdownOpen(false);
                    }}
                  >
                    {t('allCategories') || 'Все категории'}
                  </div>
                  {categoryStats.map(category => (
                    <div
                      key={category.category}
                      className={`admin-dropdown-option ${storyFilters.category === category.category ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStoryFilterChange('category', category.category);
                        setStoryCategoryDropdownOpen(false);
                      }}
                    >
                      {getTranslatedCategory(category.category)} ({category.count})
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleStoryClearFilters}
              className="admin-clear-filters-button"
              disabled={storiesLoading || (!storyFilters.search && storyFilters.status === 'all' && storyFilters.category === 'all')}
            >
              <span className="material-icons">clear_all</span>
              {t('clearFilters') || 'Сбросить'}
            </button>
          </div>
        </div>

        {storiesLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('loadingStories') || 'Загрузка историй...'}</p>
          </div>
        ) : storiesError ? (
          <div className="error-state">
            <span className="material-icons">error_outline</span>
            <h3>{t('error') || 'Ошибка'}</h3>
            <p>{storiesError}</p>
            <button onClick={loadStoriesData} className="retry-button">
              <span className="material-icons">refresh</span>
              {t('tryAgain') || 'Попробовать снова'}
            </button>
          </div>
        ) : stories.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons">history</span>
            <h3>{t('noStoriesFound') || 'Истории не найдены'}</h3>
            <p>
              {storyFilters.search || storyFilters.status !== 'all' || storyFilters.category !== 'all'
                ? t('changeSearchParams') || 'Измените параметры поиска.'
                : t('noStoriesInSystem') || 'Нет историй в системе.'}
            </p>
            {(storyFilters.search || storyFilters.status !== 'all' || storyFilters.category !== 'all') && (
              <button 
                onClick={handleStoryClearFilters}
                className="retry-button"
              >
                {t('showAllStories') || 'Показать все истории'}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="stories-table-container">
              <table className="stories-table">
                <thead>
                  <tr>
                    <th>{t('title') || 'Заголовок'}</th>
                    <th>{t('author') || 'Автор'}</th>
                    <th>{t('category') || 'Категория'}</th>
                    <th>{t('carbonSaved') || 'CO₂ сохранено'}</th>
                    <th>{t('status') || 'Статус'}</th>
                    <th>{t('createdAt') || 'Дата'}</th>
                    <th>{t('actions') || 'Действия'}</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map(story => (
                    <tr key={story.id} className={`story-row ${story.status}`}>
                      <td className="story-title" title={story.title}>
                        {story.title}
                      </td>
                      <td className="story-author">
                        <div className="author-info">
                          <div className="author-name">{story.user_nickname}</div>
                          <div className="story-likes">
                            <span className="material-icons">favorite</span>
                            {story.likes_count || 0}
                          </div>
                        </div>
                      </td>
                      <td className="story-category">
                        <span className="category-badge">{getTranslatedCategory(story.category)}</span>
                      </td>
                      <td className="story-carbon">
                        {story.carbon_saved ? formatCarbonSaved(story.carbon_saved) : '—'}
                      </td>
                      <td className="story-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(story.status) }}
                        >
                          {getStoryStatusBadgeLabel(story.status)}
                        </span>
                      </td>
                      <td className="story-date">
                        {formatDate(story.created_at)}
                      </td>
                      <td className="story-actions">
                        <div className="action-buttons">
                          <button
                            onClick={() => openStoryPreview(story)}
                            className="action-button preview"
                            title={t('previewStory') || 'Просмотреть историю'}
                          >
                            <span className="material-icons">visibility</span>
                          </button>
                          
                          {story.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handlePublishStory(story)}
                                className="action-button publish"
                                title={t('publishStory') || 'Опубликовать'}
                              >
                                <span className="material-icons">check_circle</span>
                              </button>
                              <button
                                onClick={() => handleRejectStory(story)}
                                className="action-button reject"
                                title={t('rejectStory') || 'Отклонить'}
                              >
                                <span className="material-icons">cancel</span>
                              </button>
                            </>
                          )}
                          
                          {story.status === 'draft' && (
                            <button
                              onClick={() => handlePublishStory(story)}
                              className="action-button publish"
                              title={t('publishStory') || 'Опубликовать'}
                            >
                              <span className="material-icons">publish</span>
                            </button>
                          )}
                          
                          {story.status === 'published' && (
                            <button
                              onClick={() => handleUnpublishStory(story)}
                              className="action-button unpublish"
                              title={t('unpublishStory') || 'Снять с публикации'}
                            >
                              <span className="material-icons">unpublished</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {renderStoriesPagination()}
          </>
        )}
      </div>
    );
  };

  // ==================== ФУНКЦИИ ДЛЯ ЖАЛОБ ====================
  
  const loadReports = useCallback(async (filtersToUse, page) => {
    if (!isAdmin || adminLoading || reportsLoading) return;
    
    // Используем текущие значения, если не переданы параметры
    const filters = filtersToUse || reportsFilters;
    const currentPage = page || reportsPagination.page;
    const limit = reportsPagination.limit;
    
    setReportsLoading(true);
    setReportsError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setReportsError('Токен не найден');
        return;
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        status: filters.status,
        search: filters.search
      });
      
      const response = await fetch(`/api/reports/admin?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setReports(data.reports);
        setReportsPagination(data.pagination);
      } else {
        setReportsError(data.error || 'Ошибка загрузки жалоб');
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setReportsError('Ошибка загрузки жалоб');
    } finally {
      setReportsLoading(false);
    }
  }, [isAdmin, adminLoading, reportsLoading, reportsFilters, reportsPagination.page, reportsPagination.limit]);

  const handleReportStatusChange = async (reportId, newStatus, adminResponse = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          admin_response: adminResponse,
          reviewed_by: currentUser?.id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        loadReports();
        showSuccessModal(t('success') || 'Успешно', t('reportStatusUpdated') || 'Статус жалобы обновлен');
      }
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const renderReportsTab = () => {
    // Подсчет статистики по жалобам
    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.status === 'pending').length;
    const reviewingReports = reports.filter(r => r.status === 'reviewing').length;
    const resolvedReports = reports.filter(r => r.status === 'resolved').length;
    
    const statusOptions = [
      { id: 'all', value: 'all', label: t('allStatuses') || 'Все статусы' },
      { id: 'pending', value: 'pending', label: t('pending') || 'Ожидает' },
      { id: 'reviewing', value: 'reviewing', label: t('reviewing') || 'На рассмотрении' },
      { id: 'resolved', value: 'resolved', label: t('resolved') || 'Решено' },
      { id: 'rejected', value: 'rejected', label: t('rejected') || 'Отклонено' }
    ];
    
    const getStatusLabel = () => {
      const option = statusOptions.find(opt => opt.value === reportsFilters.status);
      return option ? option.label : t('allStatuses') || 'Все статусы';
    };
    
    // Функция сортировки
    const handleSort = (key) => {
      let direction = 'asc';
      if (reportsSortConfig.key === key && reportsSortConfig.direction === 'asc') {
        direction = 'desc';
      }
      setReportsSortConfig({ key, direction });
    };
    
    // Сортировка отчетов
    const sortedReports = [...reports].sort((a, b) => {
      if (reportsSortConfig.key === 'id') {
        return reportsSortConfig.direction === 'asc' ? a.id - b.id : b.id - a.id;
      }
      return 0;
    });
    
    return (
      <div className="admin-section">
        <div className="section-header">
          <h2>{t('manageReports') || 'Жалобы пользователей'}</h2>
          <div className="section-actions">
            <button 
              className="refresh-button"
              onClick={() => loadReports(reportsFilters, 1)}
              disabled={reportsLoading}
            >
              <span className="material-icons">refresh</span>
              {t('refresh') || 'Обновить'}
            </button>
            <button 
              onClick={async () => {
                try {
                  const result = await exportAllReports(t);
                  if (!result.success) {
                    console.error('Export error:', result.error);
                  }
                } catch (error) {
                  console.error('Export error:', error.message);
                }
              }}
              className="export-button"
              disabled={reportsLoading}
              title={t('exportToExcel') || 'Экспорт в Excel (все жалобы)'}
            >
              <span className="material-icons">download</span>
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon reports-all">
              <span className="material-icons">report</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">{totalReports}</div>
              <div className="stat-label">{t('allReports') || 'Все жалобы'}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon pending">
              <span className="material-icons">pending</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">{pendingReports}</div>
              <div className="stat-label">{t('pending') || 'Ожидает'}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon reviewing">
              <span className="material-icons">rate_review</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">{reviewingReports}</div>
              <div className="stat-label">{t('reviewing') || 'На рассмотрении'}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon resolved">
              <span className="material-icons">check_circle</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">{resolvedReports}</div>
              <div className="stat-label">{t('resolved') || 'Решено'}</div>
            </div>
          </div>
        </div>

        <div className="filters-panel">
          <div className="search-box">
            <input
              type="text"
              value={reportsFilters.search}
              onChange={(e) => setReportsFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder={t('searchReports') || 'Поиск по жалобам...'}
              className="search-input"
              disabled={reportsLoading}
            />
            <button className="search-button" disabled={reportsLoading}>
              <span className="material-icons">search</span>
            </button>
          </div>
          
          <div className="filter-buttons">
            <div className="admin-filter-dropdown">
              <div 
                className={`admin-dropdown-trigger ${reportsStatusDropdownOpen ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setReportsStatusDropdownOpen(!reportsStatusDropdownOpen);
                }}
              >
                <span>{getStatusLabel()}</span>
                <svg 
                  className={`admin-dropdown-arrow ${reportsStatusDropdownOpen ? 'rotated' : ''}`}
                  width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" 
                    fill="currentColor"
                  />
                </svg>
              </div>
              {reportsStatusDropdownOpen && (
                <div className="admin-dropdown-options">
                  {statusOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`admin-dropdown-option ${reportsFilters.status === option.value ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportsFilters(prev => ({ ...prev, status: option.value }));
                        setReportsStatusDropdownOpen(false);
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button
              className="admin-clear-filters-button"
              onClick={() => {
                setReportsFilters({ search: '', status: 'all' });
                setReportsSortConfig({ key: 'id', direction: 'asc' });
              }}
              disabled={reportsFilters.search === '' && reportsFilters.status === 'all'}
            >
              <span className="material-icons">clear_all</span>
              {t('clearFilters') || 'Сбросить фильтры'}
            </button>
          </div>
        </div>

        {reportsLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>{t('loading') || 'Загрузка...'}</p>
          </div>
        ) : reportsError ? (
          <div className="error-state">
            <span className="material-icons">error</span>
            <p>{reportsError}</p>
            <button 
              onClick={() => loadReports(reportsFilters, 1)}
              className="retry-button"
            >
              <span className="material-icons">refresh</span>
              {t('retry') || 'Повторить'}
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons">report</span>
            <p>{t('noReports') || 'Жалоб нет'}</p>
          </div>
        ) : (
          <>
            <div className="reports-table-container">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th 
                      style={{ width: '60px', cursor: 'pointer' }}
                      onClick={() => handleSort('id')}
                      className="sortable"
                    >
                      ID
                      {reportsSortConfig.key === 'id' && (
                        <span className="sort-icon">
                          {reportsSortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th style={{ width: '200px' }}>{t('reporter') || 'Отправитель'}</th>
                    <th style={{ width: '200px' }}>{t('reportedUser') || 'На пользователя'}</th>
                    <th style={{ width: '250px' }}>{t('reason') || 'Причина'}</th>
                    <th style={{ width: '150px' }}>{t('status') || 'Статус'}</th>
                    <th style={{ width: '120px' }}>{t('date') || 'Дата'}</th>
                    <th style={{ width: '120px' }}>{t('actions') || 'Действия'}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReports.map(report => (
                    <tr key={report.id}>
                      <td className="report-id">{report.id}</td>
                      <td>
                        <div className="report-user-cell">
                          <div className="report-user-name">{report.reporter_nickname}</div>
                          <div className="report-user-email">{report.reporter_email}</div>
                        </div>
                      </td>
                      <td>
                        <div className="report-user-cell">
                          <div className="report-user-name">{report.reported_nickname}</div>
                          <div className="report-user-email">{report.reported_email}</div>
                        </div>
                      </td>
                      <td>
                        <div className="report-reason-cell">
                          {report.reason}
                        </div>
                      </td>
                      <td>
                        <span className={`report-status-badge status-${report.status}`}>
                          {report.status === 'pending' ? t('pending') || 'Ожидает' :
                           report.status === 'reviewing' ? t('reviewing') || 'На рассмотрении' :
                           report.status === 'resolved' ? t('resolved') || 'Решено' :
                           t('rejected') || 'Отклонено'}
                        </span>
                      </td>
                      <td className="report-date">{new Date(report.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="report-actions">
                          <button
                            className="report-action-btn view"
                            title={t('viewDetails') || 'Просмотр'}
                            onClick={() => {
                              setReportDetailsModal({
                                isOpen: true,
                                report: report,
                                adminResponse: report.admin_response || ''
                              });
                            }}
                          >
                            <span className="material-icons">visibility</span>
                          </button>
                          
                          {report.status === 'pending' && (
                            <button
                              className="report-action-btn start-review"
                              title={t('startReview') || 'Начать рассмотрение'}
                              onClick={() => handleReportStatusChange(report.id, 'reviewing')}
                            >
                              <span className="material-icons">rate_review</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reportsPagination.totalPages > 1 && (
              <div className="pagination-container">
                <button
                  onClick={() => loadReports(reportsFilters, reportsPagination.page - 1)}
                  disabled={reportsPagination.page === 1}
                  className="pagination-button"
                >
                  <span className="material-icons">chevron_left</span>
                </button>
                <span className="pagination-info">
                  {t('page') || 'Страница'} {reportsPagination.page} {t('of') || 'из'} {reportsPagination.totalPages}
                </span>
                <button
                  onClick={() => loadReports(reportsFilters, reportsPagination.page + 1)}
                  disabled={reportsPagination.page === reportsPagination.totalPages}
                  className="pagination-button"
                >
                  <span className="material-icons">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'support':
        return renderSupportTab();
      case 'reviews':
        return renderReviewsTab();
      case 'funds':
        return (
          <div className="admin-section">
            <h2>{t('manageFunds') || 'Управление фондами'}</h2>
            <div className="admin-empty-state">
              <span className="material-icons">account_balance</span>
              <p>{t('fundsComingSoon') || 'Здесь будет управление экологическими фондами и их финансированием'}</p>
            </div>
          </div>
        );
      case 'reports':
        return renderReportsTab();
      default:
        return renderUsersTab();
    }
  };

  // ==================== РЕНДЕРИНГ КОМПОНЕНТА ====================

  if (adminLoading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('checkingPermissions') || 'Проверка прав доступа...'}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="error-state">
          <span className="material-icons">block</span>
          <h3>{t('accessDenied') || 'Доступ запрещен'}</h3>
          <p>{t('noAdminRights') || 'У вас нет прав доступа к админ-панели'}</p>
          <button onClick={() => navigate('/')} className="retry-button">
            <span className="material-icons">home</span>
            {t('goHome') || 'На главную'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">
            <span className="material-icons">admin_panel_settings</span>
            {t('adminPanel') || 'Панель администратора'}
          </h1>
        </div>
        
        <div className="admin-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="material-icons tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="admin-content">
          {renderTabContent()}
        </div>
      </div>

      {/* Модалка блокировки */}
      {banModal.isOpen && (
        <div className="modal-overlay" onClick={closeBanModal}>
          <div 
            className="modal ban-modal" 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                <span className="material-icons">block</span>
                {t('banUser') || 'Заблокировать пользователя'}
              </h3>
              <button className="modal-close" onClick={closeBanModal}>
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="ban-user-header">
                <div className="ban-user-info-row">
                  <div className="ban-user-name-col">
                    <span className="ban-user-label">{t('user') || 'Пользователь'}:</span>
                    <span className="ban-user-name">{banModal.username}</span>
                  </div>
                  <div className="ban-user-count-col">
                    <span className="ban-count-label">{t('previousBans') || 'Предыдущие баны'}:</span>
                    <span className={`ban-count-value ${banModal.currentBanCount >= 3 ? 'ban-count-danger' : ''}`}>
                      {banModal.currentBanCount}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="ban-info-box">
                {(() => {
                  const banInfo = getBanInfoText();
                  return (
                    <div className="ban-info-content" style={{ borderLeftColor: banInfo.color }}>
                      <div className="ban-info-header">
                        <span className="material-icons" style={{ color: banInfo.color }}>
                          {banInfo.icon}
                        </span>
                        <div className="ban-info-title">
                          <div className="ban-info-main-title">{banInfo.title}</div>
                          <div className="ban-info-subtitle">{banInfo.subtitle}</div>
                        </div>
                      </div>
                      {banInfo.description && (
                        <div className="ban-info-description">
                          {banInfo.description}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              <div className="form-group">
                <label>
                  {t('banReason') || 'Причина блокировки:'}
                  <span className="required-star">*</span>
                </label>
                <textarea
                  value={banModal.reason}
                  onChange={(e) => setBanModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder={t('banReasonPlaceholder') || "Опишите причину блокировки..."}
                  className="ban-reason-input"
                  rows="3"
                  maxLength="500"
                />
                <div className="character-counter">
                  {banModal.reason.length}/500 {t('characters') || 'символов'}
                </div>
              </div>
              
              <div className="form-group">
                <label>{t('banDuration') || 'Длительность блокировки:'}</label>
                <div className="modal-dropdown">
                  <div 
                    className={`modal-dropdown-trigger ${durationDropdownOpen ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDurationDropdownOpen(!durationDropdownOpen);
                    }}
                  >
                    <span>{banDurations.find(d => d.value === banModal.duration)?.label || banDurations[1].label}</span>
                    <svg 
                      className={`modal-dropdown-arrow ${durationDropdownOpen ? 'rotated' : ''}`}
                      width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" 
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  {durationDropdownOpen && (
                    <div className="modal-dropdown-options">
                      {banDurations.map(duration => (
                        <div
                          key={duration.value}
                          className={`modal-dropdown-option ${banModal.duration === duration.value ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setBanModal(prev => ({ 
                              ...prev, 
                              duration: duration.value,
                              durationType: duration.type
                            }));
                            setDurationDropdownOpen(false);
                          }}
                        >
                          {duration.label}
                          {duration.type === 'permanent' && (
                            <span className="permanent-badge">
                              {t('permanent') || 'Навсегда'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {banModal.error && (
                <div className="form-error">
                  <span className="material-icons">error</span>
                  {banModal.error}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeBanModal}>
                {t('cancel') || 'Отмена'}
              </button>
              <button className="btn btn-danger" onClick={confirmBan}>
                <span className="material-icons">block</span>
                {t('ban') || 'Заблокировать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка ответа на обращение */}
      {responseModal.isOpen && (
        <div className="modal-overlay" onClick={() => setResponseModal(prev => ({ ...prev, isOpen: false }))}>
          <div 
            className="modal response-modal large" 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                <span className="material-icons">reply</span>
                {responseModal.response ? t('editResponse') || 'Редактировать ответ' : t('respondToTicket') || 'Ответить на обращение'}
              </h3>
              <button 
                className="modal-close"
                onClick={() => setResponseModal(prev => ({ ...prev, isOpen: false }))}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="ticket-info-section">
                <div className="ticket-header">
                  <div className="ticket-number-display">
                    <strong>{t('ticketNumber') || '№ обращения'}:</strong> {responseModal.ticketNumber}
                  </div>
                  <div className="ticket-user-info">
                    <strong>{t('user') || 'Пользователь'}:</strong> {responseModal.username} ({responseModal.userEmail})
                  </div>
                </div>
                
                <div className="form-group">
                  <label>{t('subject') || 'Тема'}:</label>
                  <div className="readonly-field">{responseModal.subject}</div>
                </div>
                
                <div className="form-group">
                  <label>{t('userMessage') || 'Сообщение пользователя'}:</label>
                  <div className="readonly-field message-field">
                    {responseModal.message}
                  </div>
                </div>
                
                <div className="form-group">
                  <label>
                    {t('yourResponse') || 'Ваш ответ'}:
                    <span className="required-star">*</span>
                  </label>
                  <textarea
                    value={responseModal.response}
                    onChange={(e) => setResponseModal(prev => ({ ...prev, response: e.target.value }))}
                    placeholder={t('responsePlaceholder') || "Введите ваш ответ пользователю..."}
                    className="response-input"
                    rows="6"
                    maxLength="2000"
                  />
                  <div className="character-counter">
                    {responseModal.response.length}/2000 {t('characters') || 'символов'}
                  </div>
                </div>
                
                {responseModal.error && (
                  <div className="form-error">
                    <span className="material-icons">error</span>
                    {responseModal.error}
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setResponseModal(prev => ({ ...prev, isOpen: false }))}
              >
                {t('cancel') || 'Отмена'}
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleResponseSubmit}
              >
                <span className="material-icons">send</span>
                {responseModal.response ? t('updateResponse') || 'Обновить' : t('sendResponse') || 'Отправить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка предпросмотра истории */}
      {previewModalOpen && selectedStory && (
        <div className="modal-overlay" onClick={closeStoryPreview}>
          <div 
            className="modal story-preview-modal large" 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                <span className="material-icons">visibility</span>
                {t('storyPreview') || 'Предпросмотр истории'}
              </h3>
              <button 
                className="modal-close"
                onClick={closeStoryPreview}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="story-preview-content">
                <div className="story-preview-header">
                  <h2 className="story-preview-title">
                    {currentLanguage !== 'ru' && translatedContent.title 
                      ? translatedContent.title 
                      : selectedStory.title}
                  </h2>
                  <div className="story-preview-meta">
                    <div className="story-author-preview">
                      <span className="material-icons">person</span>
                      {selectedStory.user_nickname}
                    </div>
                    <div className="story-category-preview">
                      <span className="material-icons">category</span>
                      {getTranslatedCategory(selectedStory.category)}
                    </div>
                    <div className="story-date-preview">
                      <span className="material-icons">calendar_today</span>
                      {formatDate(selectedStory.created_at)}
                    </div>
                    {selectedStory.carbon_saved && (
                      <div className="story-carbon-preview">
                        <span className="material-icons">eco</span>
                        {formatCarbonSaved(selectedStory.carbon_saved)} {t('carbonSaved') || 'CO₂ сохранено'}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="story-preview-body">
                  <div className="story-content-preview">
                    {translatedContent.isTranslating ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>
                        {t('translating') || 'Перевод...'}
                      </div>
                    ) : (
                      currentLanguage !== 'ru' && translatedContent.content 
                        ? translatedContent.content 
                        : selectedStory.content
                    )}
                  </div>
                </div>
                
                <div className="story-preview-footer">
                  <div className="story-stats-preview">
                    <div className="story-likes-preview">
                      {selectedStory.likes_count || 0} {t('likes') || 'лайков'}
                    </div>
                    <div className="story-status-preview">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(selectedStory.status) }}
                      >
                        {getStoryStatusBadgeLabel(selectedStory.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={closeStoryPreview}
              >
                {t('close') || 'Закрыть'}
              </button>
              {selectedStory.status === 'pending' && (
                <>
                  <button 
                    className="btn btn-danger"
                    onClick={() => {
                      closeStoryPreview();
                      handleRejectStory(selectedStory);
                    }}
                  >
                    <span className="material-icons">cancel</span>
                    {t('rejectStory') || 'Отклонить'}
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={() => {
                      closeStoryPreview();
                      handlePublishStory(selectedStory);
                    }}
                  >
                    <span className="material-icons">check_circle</span>
                    {t('publishStory') || 'Опубликовать'}
                  </button>
                </>
              )}
              {selectedStory.status === 'published' && (
                <button 
                  className="btn btn-warning"
                  onClick={() => {
                    closeStoryPreview();
                    handleUnpublishStory(selectedStory);
                  }}
                >
                  <span className="material-icons">unpublished</span>
                  {t('unpublishStory') || 'Снять с публикации'}
                </button>
              )}
              {selectedStory.status === 'draft' && (
                <button 
                  className="btn btn-success"
                  onClick={() => {
                    closeStoryPreview();
                    handlePublishStory(selectedStory);
                  }}
                >
                  <span className="material-icons">publish</span>
                  {t('publishStory') || 'Опубликовать'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модалка подтверждения */}
      {confirmModal.isOpen && (
        <div className={`modal-overlay ${reportDetailsModal.isOpen ? 'nested-modal' : ''}`} onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{confirmModal.title}</h3>
              <button 
                className="modal-close"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="modal-body">
              <p>{confirmModal.message}</p>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                {t('cancel') || 'Отмена'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  confirmModal.onConfirm?.();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
              >
                {t('confirm') || 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка успеха */}
      {successModal.isOpen && (
        <div className={`modal-overlay ${reportDetailsModal.isOpen ? 'nested-modal' : ''}`} onClick={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal success-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="material-icons">check_circle</span>
                {successModal.title}
              </h3>
              <button 
                className="modal-close"
                onClick={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="modal-body">
              <p>{successModal.message}</p>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-success"
                onClick={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}
              >
                {t('ok') || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка деталей жалобы */}
      {reportDetailsModal.isOpen && reportDetailsModal.report && (
        <div className="modal-overlay" onClick={() => setReportDetailsModal({ isOpen: false, report: null, adminResponse: '', responseError: false })}>
          <div 
            className="modal report-details-modal" 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                <span className="material-icons">report</span>
                {t('reportDetails') || 'Детали жалобы'} #{reportDetailsModal.report.id}
              </h3>
              <button
                className="modal-close"
                onClick={() => setReportDetailsModal({ isOpen: false, report: null, adminResponse: '', responseError: false })}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="report-detail-section">
                <h4>{t('reporter') || 'Отправитель'}</h4>
                <div className="report-user-info">
                  <div className="report-user-name">{reportDetailsModal.report.reporter_nickname}</div>
                  <div className="report-user-email">{reportDetailsModal.report.reporter_email}</div>
                </div>
              </div>

              <div className="report-detail-section">
                <h4>{t('reportedUser') || 'На пользователя'}</h4>
                <div className="report-user-info">
                  <div className="report-user-name">{reportDetailsModal.report.reported_nickname}</div>
                  <div className="report-user-email">{reportDetailsModal.report.reported_email}</div>
                </div>
              </div>

              <div className="report-detail-section">
                <h4>{t('reason') || 'Причина'}</h4>
                <p className="report-detail-text">{reportDetailsModal.report.reason}</p>
              </div>

              {reportDetailsModal.report.description && (
                <div className="report-detail-section">
                  <h4>{t('description') || 'Описание'}</h4>
                  <p className="report-detail-text">{reportDetailsModal.report.description}</p>
                </div>
              )}

              {reportDetailsModal.report.screenshots && reportDetailsModal.report.screenshots.length > 0 && (
                <div className="report-detail-section">
                  <h4>{t('screenshots') || 'Скриншоты'} ({reportDetailsModal.report.screenshots.length})</h4>
                  <div className="report-screenshots-grid">
                    {reportDetailsModal.report.screenshots.map((screenshot, index) => (
                      <div 
                        key={index}
                        className="report-screenshot-item"
                        onClick={() => {
                          setScreenshotPreviewModal({
                            isOpen: true,
                            imageUrl: screenshot,
                            imageName: `${t('screenshot') || 'Скриншот'} ${index + 1}`
                          });
                        }}
                      >
                        <img 
                          src={screenshot} 
                          alt={`Screenshot ${index + 1}`}
                          className="report-screenshot-thumb"
                        />
                        <div className="report-screenshot-overlay">
                          <span className="material-icons">zoom_in</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="report-detail-section">
                <h4>{t('currentStatus') || 'Текущий статус'}</h4>
                <span className={`report-status-badge status-${reportDetailsModal.report.status}`}>
                  {reportDetailsModal.report.status === 'pending' ? t('pending') || 'Ожидает' :
                   reportDetailsModal.report.status === 'reviewing' ? t('reviewing') || 'На рассмотрении' :
                   reportDetailsModal.report.status === 'resolved' ? t('resolved') || 'Решено' :
                   t('rejected') || 'Отклонено'}
                </span>
              </div>

              <div className="report-detail-section">
                <h4>{t('date') || 'Дата'}</h4>
                <p className="report-detail-text">{new Date(reportDetailsModal.report.created_at).toLocaleString()}</p>
              </div>

              {/* Поле для ответа администратора */}
              {(reportDetailsModal.report.status === 'reviewing' || reportDetailsModal.report.status === 'resolved' || reportDetailsModal.report.status === 'rejected') && (
                <div className="report-detail-section">
                  <h4>{t('adminResponse') || 'Ответ администратора'}</h4>
                  {reportDetailsModal.report.admin_response ? (
                    <div className="admin-response-display">
                      <p className="report-detail-text admin-response-text">{reportDetailsModal.report.admin_response}</p>
                    </div>
                  ) : (
                    <>
                      <textarea
                        className={`admin-response-input ${reportDetailsModal.responseError ? 'error' : ''}`}
                        placeholder={t('adminResponsePlaceholder') || 'Введите ответ пользователю...'}
                        value={reportDetailsModal.adminResponse}
                        onChange={(e) => setReportDetailsModal(prev => ({ 
                          ...prev, 
                          adminResponse: e.target.value,
                          responseError: false 
                        }))}
                        rows={5}
                      />
                      {reportDetailsModal.responseError && (
                        <p className="validation-error">{t('adminResponseRequired') || 'Пожалуйста, введите ответ пользователю'}</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              {reportDetailsModal.report.status === 'reviewing' && !reportDetailsModal.report.admin_response && (
                <>
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      if (!reportDetailsModal.adminResponse.trim()) {
                        setReportDetailsModal(prev => ({ ...prev, responseError: true }));
                        return;
                      }
                      handleReportStatusChange(reportDetailsModal.report.id, 'resolved', reportDetailsModal.adminResponse);
                      setReportDetailsModal({ isOpen: false, report: null, adminResponse: '', responseError: false });
                    }}
                  >
                    <span className="material-icons">check_circle</span>
                    {t('resolve') || 'Решить'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      if (!reportDetailsModal.adminResponse.trim()) {
                        setReportDetailsModal(prev => ({ ...prev, responseError: true }));
                        return;
                      }
                      handleReportStatusChange(reportDetailsModal.report.id, 'rejected', reportDetailsModal.adminResponse);
                      setReportDetailsModal({ isOpen: false, report: null, adminResponse: '', responseError: false });
                    }}
                  >
                    <span className="material-icons">close</span>
                    {t('reject') || 'Отклонить'}
                  </button>
                </>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => setReportDetailsModal({ isOpen: false, report: null, adminResponse: '', responseError: false })}
              >
                {t('close') || 'Закрыть'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка просмотра скриншота */}
      {screenshotPreviewModal.isOpen && (
        <div className="modal-overlay" onClick={() => setScreenshotPreviewModal({ isOpen: false, imageUrl: '', imageName: '' })}>
          <div 
            className="screenshot-preview-modal" 
            onClick={e => e.stopPropagation()}
          >
            <div className="screenshot-preview-header">
              <h3>{screenshotPreviewModal.imageName}</h3>
              <button
                className="modal-close"
                onClick={() => setScreenshotPreviewModal({ isOpen: false, imageUrl: '', imageName: '' })}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="screenshot-preview-body">
              <img 
                src={screenshotPreviewModal.imageUrl} 
                alt={screenshotPreviewModal.imageName}
                className="screenshot-preview-image"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;