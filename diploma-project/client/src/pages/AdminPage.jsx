import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAdminCheck } from '../hooks/useAdminCheck';
import { getEmojiByCarbon, getEcoLevelText } from '../utils/emojiMapper';
import '../styles/pages/AdminPage.css';

const AdminPage = () => {
  const { t, currentLanguage } = useLanguage(); // Добавляем currentLanguage
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading, user: currentUser } = useAdminCheck();
  
  // Если не админ или загрузка - показываем соответствующий контент
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      console.log('User is not admin, redirecting to home');
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Фильтры и сортировка
  const [filters, setFilters] = useState({
    search: '',
    is_admin: null,
    is_banned: null
  });
  
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc'
  });
  
  // Пагинация
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

  // Модалки успеха
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  // Статистика - загружается отдельно и не меняется при фильтрации
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalBanned: 0
  });

  // Ref для отслеживания первого рендера
  const isInitialMount = useRef(true);
  
  // Ref для таймера debounce
  const searchDebounceTimer = useRef(null);

  // Предустановленные причины и длительности бана
  const banReasons = useMemo(() => [
    { id: 'spam', label: t('banReasonSpam') || 'Спам или реклама' },
    { id: 'harassment', label: t('banReasonHarassment') || 'Оскорбления или травля' },
    { id: 'fake_news', label: t('banReasonFakeNews') || 'Распространение фейковых новостей' },
    { id: 'cheating', label: t('banReasonCheating') || 'Читерство или накрутка' },
    { id: 'inappropriate_content', label: t('banReasonInappropriate') || 'Неуместный контент' },
    { id: 'multiple_accounts', label: t('banReasonMultipleAccounts') || 'Создание множественных аккаунтов' },
    { id: 'other', label: t('banReasonOther') || 'Другая причина' }
  ], [t]);
  
  const banDurations = useMemo(() => [
    { value: '1', label: t('banDuration1h') || '1 час', type: 'hours' },
    { value: '24', label: t('banDuration24h') || '24 часа', type: 'hours' },
    { value: '72', label: t('banDuration3d') || '3 дня', type: 'hours' },
    { value: '168', label: t('banDuration7d') || '7 дней', type: 'hours' },
    { value: '720', label: t('banDuration30d') || '30 дней', type: 'hours' },
    { value: 'permanent', label: t('banDurationPermanent') || 'Навсегда', type: 'permanent' }
  ], [t]);

  // Вкладки
  const tabs = [
    { id: 'users', label: t('adminTabUsers') || 'Пользователи', icon: 'people' },
    { id: 'funds', label: t('adminTabFunds') || 'Фонды', icon: 'account_balance' },
    { id: 'achievements', label: t('adminTabAchievements') || 'Достижения', icon: 'emoji_events' },
    { id: 'reports', label: t('adminTabReports') || 'Жалобы', icon: 'report' },
    { id: 'reviews', label: t('adminTabReviews') || 'Отзывы', icon: 'rate_review' }
  ];

  // Функция для показа модалки успеха
  const showSuccessModal = (title, message) => {
    setSuccessModal({
      isOpen: true,
      title,
      message
    });
    
    // Автоматически закрыть через 3 секунды
    setTimeout(() => {
      setSuccessModal(prev => ({ ...prev, isOpen: false }));
    }, 3000);
  };

  // Функция для загрузки статистики (использует отдельный endpoint если есть, или рассчитывает из всех пользователей)
  const loadStatsFromDB = useCallback(async () => {
    if (!isAdmin || adminLoading) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Используем самый простой endpoint для статистики
      try {
        const statsResponse = await fetch(`/api/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          if (statsData.success) {
            console.log('Stats loaded successfully:', statsData);
            
            setStats({
              totalUsers: parseInt(statsData.totalUsers) || 0,
              totalAdmins: parseInt(statsData.totalAdmins) || 0,
              totalBanned: parseInt(statsData.totalBanned) || 0
            });
            return;
          }
        }
      } catch (statsError) {
        console.log('Regular stats endpoint failed:', statsError.message);
      }
      
      // Если основной endpoint не сработал, пробуем simple-stats
      try {
        const simpleStatsResponse = await fetch(`/api/admin/simple-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (simpleStatsResponse.ok) {
          const simpleStatsData = await simpleStatsResponse.json();
          if (simpleStatsData.success) {
            console.log('Simple stats loaded successfully:', simpleStatsData);
            
            setStats({
              totalUsers: parseInt(simpleStatsData.totalUsers) || 0,
              totalAdmins: parseInt(simpleStatsData.totalAdmins) || 0,
              totalBanned: parseInt(simpleStatsData.totalBanned) || 0
            });
            return;
          }
        }
      } catch (simpleError) {
        console.log('Simple stats also failed:', simpleError.message);
      }
      
      console.log('All stats endpoints failed, using fallback');
      
    } catch (error) {
      console.error('Error loading stats:', error);
      // В случае ошибки, НЕ используем текущие данные пользователей для статистики
      // чтобы не сбрасывать статистику на 0
    }
  }, [isAdmin, adminLoading]);

  // Загрузка пользователей через /api/admin/users с пагинацией
  const loadUsers = useCallback(async (filtersToUse = filters, sortToUse = sortConfig, page = pagination.page, updateStats = false) => {
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
      
      // Загружаем пользователей с учетом фильтров и пагинации
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      
      // Добавляем сортировку
      if (sortToUse.key) {
        params.append('sortBy', sortToUse.key);
        params.append('sortOrder', sortToUse.direction === 'desc' ? 'DESC' : 'ASC');
      }
      
      // Добавляем фильтры, если они есть
      if (filtersToUse.search) {
        params.append('search', filtersToUse.search);
      }
      if (filtersToUse.is_admin !== null) {
        params.append('is_admin', filtersToUse.is_admin.toString());
      }
      if (filtersToUse.is_banned !== null) {
        params.append('is_banned', filtersToUse.is_banned.toString());
      }
      
      console.log('Loading users with params:', params.toString());
      
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
        
        console.log('Loaded users:', usersData.length, 'Total:', total, 'Page:', page, 'Filters:', filtersToUse);
        
        setUsers(usersData);
        setPagination(prev => ({
          ...prev,
          page,
          total,
          totalPages
        }));
        
        // Обновляем статистику только если явно указано или это загрузка без фильтров
        if (updateStats || (!filtersToUse.search && filtersToUse.is_admin === null && filtersToUse.is_banned === null && page === 1)) {
          // Обновляем статистику из БД отдельно
          await loadStatsFromDB();
        }
      } else {
        setError(data.message || t('errorLoadingUsers') || 'Ошибка загрузки пользователей');
      }
      
    } catch (err) {
      console.error('Error loading users:', err);
      setError(t('networkError') || 'Ошибка сети. Проверьте подключение.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, adminLoading, loading, t, navigate, pagination.limit, filters, sortConfig, loadStatsFromDB]);

  // Функция для первоначальной загрузки данных
  const loadInitialData = useCallback(async () => {
    if (!isAdmin || adminLoading) return;
    
    console.log('Loading initial data...');
    
    // Загружаем статистику и пользователей одновременно
    await Promise.all([
      loadStatsFromDB(),
      loadUsers({ search: '', is_admin: null, is_banned: null }, sortConfig, 1, false)
    ]);
  }, [isAdmin, adminLoading, loadStatsFromDB, loadUsers, sortConfig]);

  // Обработчик изменения страницы
  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === pagination.page) return;
    
    loadUsers(filters, sortConfig, newPage, false);
  }, [filters, sortConfig, pagination.totalPages, pagination.page, loadUsers]);

  // Загружаем данные при первой загрузке страницы
  useEffect(() => {
    if (activeTab === 'users' && isAdmin && !adminLoading) {
      if (isInitialMount.current) {
        loadInitialData();
        isInitialMount.current = false;
      }
    }
  }, [activeTab, isAdmin, adminLoading, loadInitialData]);

  // Обработчик изменения фильтров (кроме поиска)
  const handleFilterChange = useCallback((filterType, value) => {
    const newFilters = { 
      ...filters, 
      [filterType]: value === '' ? null : value === 'true'
    };
    
    setFilters(newFilters);
    
    // Для не-поисковых фильтров загружаем сразу, сбрасываем на первую страницу
    loadUsers(newFilters, sortConfig, 1, false);
  }, [filters, sortConfig, loadUsers]);

  // Обработчик изменения поиска с debounce
  const handleSearchChange = useCallback((searchValue) => {
    setFilters(prev => ({ ...prev, search: searchValue }));
    
    // Очищаем предыдущий таймер
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    
    // Устанавливаем новый таймер с debounce
    searchDebounceTimer.current = setTimeout(() => {
      loadUsers({ ...filters, search: searchValue }, sortConfig, 1, false);
    }, 500); // 500ms debounce для поиска
  }, [filters, sortConfig, loadUsers]);

  // Обработчик сортировки
  const handleSort = useCallback((key) => {
    // Не позволяем сортировку по email
    if (key === 'email') return;
    
    const newSortConfig = {
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc'
    };
    
    setSortConfig(newSortConfig);
    
    // Загружаем с новой сортировкой, сбрасываем на первую страницу
    loadUsers(filters, newSortConfig, 1, false);
  }, [sortConfig, filters, loadUsers]);

  // Утилиты
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Получаем аватар пользователя
  const getUserAvatar = (user) => {
    if (!user) return '👤';
    
    // Если пользователь уже имеет emoji-аватар, используем его
    if (user.avatar_emoji && user.avatar_emoji.length <= 10) {
      // Это может быть код (например, 'star', 'leaf'), преобразуем в эмодзи
      return getEmojiByCarbon(user.carbon_saved || 0);
    }
    
    // Если avatar_emoji уже является эмодзи
    if (user.avatar_emoji) {
      return user.avatar_emoji;
    }
    
    // Иначе используем carbon_saved для определения эмодзи
    return getEmojiByCarbon(user.carbon_saved || 0);
  };

  // Получаем перевод эко-уровня - ПЕРЕПИСЫВАЕМ ЭТУ ФУНКЦИЮ
  const getTranslatedEcoLevel = (carbonSaved) => {
    const carbon = carbonSaved || 0;
    
    // Используем логику из emojiMapper.js для определения уровня
    let levelKey = 'ecoNovice';
    
    if (carbon >= 5000) levelKey = 'ecoHero';
    else if (carbon >= 4000) levelKey = 'ecoMaster';
    else if (carbon >= 3000) levelKey = 'ecoActivist';
    else if (carbon >= 2000) levelKey = 'ecoEnthusiast';
    else if (carbon >= 1000) levelKey = 'ecoStarter';
    
    // Пробуем получить перевод из системы переводов
    const translated = t(levelKey);
    if (translated && translated !== levelKey) {
      return translated;
    }
    
    // Если перевода нет, возвращаем русскую версию
    return getEcoLevelText(carbon);
  };

  // Получаем класс для бейджа уровня
  const getEcoLevelClass = (carbonSaved) => {
    const carbon = carbonSaved || 0;
    
    if (carbon >= 5000) return 'level-hero';
    else if (carbon >= 4000) return 'level-master';
    else if (carbon >= 3000) return 'level-activist';
    else if (carbon >= 2000) return 'level-enthusiast';
    else if (carbon >= 1000) return 'level-starter';
    else return 'level-novice';
  };

  // Получаем перевод единицы измерения
  const getCarbonUnit = () => {
    return t('carbonUnit') || 'кг';
  };

  // Форматируем количество CO₂ с переводом единиц
  const formatCarbonSaved = (carbonSaved) => {
    const value = carbonSaved || 0;
    const unit = getCarbonUnit();
    
    // Если значение больше 1000 кг, показываем в тоннах
    if (value >= 1000) {
      const tons = (value / 1000).toFixed(1);
      return `${tons} ${t('units.tons') || 'т'}`;
    }
    
    return `${value.toLocaleString()} ${unit}`;
  };

  // Функции модалок
  const openBanModal = (user) => {
    if (user.is_admin) {
      showSuccessModal(t('cannot') || 'Невозможно', t('cannotBanAdmin') || 'Нельзя заблокировать администратора');
      return;
    }
    
    if (currentUser?.id === user.id) {
      showSuccessModal(t('cannot') || 'Невозможно', t('cannotBanSelf') || 'Нельзя заблокировать самого себя');
      return;
    }
    
    setBanModal({
      isOpen: true,
      userId: user.id,
      username: user.nickname || user.email,
      reason: user.ban_reason || banReasons[0].id,
      duration: '24',
      durationType: 'hours',
      error: ''
    });
  };

  const closeBanModal = () => {
    setBanModal({
      isOpen: false,
      userId: null,
      username: '',
      reason: '',
      duration: '24',
      durationType: 'hours',
      error: ''
    });
  };

  const confirmBan = async () => {
    if (!banModal.reason) {
      setBanModal(prev => ({ ...prev, error: t('specifyReason') || 'Укажите причину бана' }));
      return;
    }
    
    const reasonText = banReasons.find(r => r.id === banModal.reason)?.label || banModal.reason;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/users/${banModal.userId}/ban`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          is_banned: true,
          ban_reason: reasonText,
          ban_duration: banModal.durationType === 'permanent' ? null : parseInt(banModal.duration)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Обновляем локально после успешного ответа от сервера
        const updatedUsers = users.map(user => 
          user.id === banModal.userId ? { 
            ...user, 
            is_banned: true,
            ban_reason: reasonText 
          } : user
        );
        
        setUsers(updatedUsers);
        
        // Обновляем статистику после изменения
        setStats(prev => ({
          ...prev,
          totalBanned: prev.totalBanned + 1
        }));
        
        // Перезагружаем текущую страницу без обновления статистики
        loadUsers(filters, sortConfig, pagination.page, false);
        
        showSuccessModal(t('userBanned') || 'Пользователь забанен', 
          data.message || t('userBannedSuccess', { username: banModal.username }) || 
          `Пользователь ${banModal.username} был забанен`);
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

  const handleUnban = (user) => {
    setConfirmModal({
      isOpen: true,
      title: t('confirmUnban') || 'Разбанить пользователя?',
      message: t('confirmUnbanMessage', { username: user.nickname || user.email }) || 
        `Вы уверены, что хотите разбанить пользователя ${user.nickname || user.email}?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          
          const response = await fetch(`/api/admin/users/${user.id}/ban`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
              is_banned: false,
              ban_reason: null
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          if (data.success) {
            const updatedUsers = users.map(u => 
              u.id === user.id ? { 
                ...u, 
                is_banned: false,
                ban_reason: null 
              } : u
            );
            
            setUsers(updatedUsers);
            // Обновляем статистику после изменения
            setStats(prev => ({
              ...prev,
              totalBanned: Math.max(0, prev.totalBanned - 1)
            }));
            
            // Перезагружаем текущую страницу без обновления статистики
            loadUsers(filters, sortConfig, pagination.page, false);
            
            showSuccessModal(
              t('userUnbanned') || 'Пользователь разбанен', 
              data.message || t('userUnbannedSuccess', { username: user.nickname || user.email }) || 
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
            // Обновляем статистику после изменения (локально)
            setStats(prev => ({
              ...prev,
              totalAdmins: !user.is_admin ? prev.totalAdmins + 1 : Math.max(0, prev.totalAdmins - 1)
            }));
            
            // Перезагружаем текущую страницу без обновления статистики из БД
            loadUsers(filters, sortConfig, pagination.page, false);
            
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

  // Обработчик поиска (нажатие Enter)
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      // Очищаем таймер debounce
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
      // Загружаем сразу, сбрасываем на первую страницу
      loadUsers(filters, sortConfig, 1, false);
    }
  };

  // Обработчик клика на кнопку поиска
  const handleSearchClick = () => {
    // Очищаем таймер debounce
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    // Загружаем сразу, сбрасываем на первую страницу
    loadUsers(filters, sortConfig, 1, false);
  };

  // Сброс фильтров
  const handleClearFilters = () => {
    // Очищаем таймер debounce
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    
    const clearedFilters = {
      search: '',
      is_admin: null,
      is_banned: null
    };
    
    setFilters(clearedFilters);
    // Загружаем всех пользователей, сбрасываем на первую страницу и обновляем статистику
    loadUsers(clearedFilters, sortConfig, 1, true);
  };

  // Кнопка обновить - обновляет и статистику и пользователей
  const handleRefresh = () => {
    loadStatsFromDB();
    loadUsers(filters, sortConfig, pagination.page, false);
  };

  // Рендер заголовка таблицы (без сортировки по email)
  const renderTableHeader = (key, label, sortable = true) => {
    const isSorted = sortConfig.key === key;
    const direction = sortConfig.direction;
    
    if (sortable && key !== 'email') {
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
    
    // Для email и других несортируемых колонок
    return <th>{t(label) || label}</th>;
  };

  // Компонент пагинации
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Кнопка "Назад"
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
    
    // Первая страница
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
    
    // Основные страницы
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
    
    // Последняя страница
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
    
    // Кнопка "Вперед"
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

  // Очищаем таймер при размонтировании компонента
  useEffect(() => {
    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, []);

  // Рендер вкладки пользователей
  const renderUsersTab = () => {
    // Добавляем отладку для проверки эко-уровней
    console.log('Проверка эко-уровней пользователей:');
    users.forEach(user => {
      const carbon = user.carbon_saved || 0;
      const levelText = getEcoLevelText(carbon);
      const translatedLevel = getTranslatedEcoLevel(carbon);
      console.log(`ID: ${user.id}, Carbon: ${carbon} кг, Level: ${levelText}, Translated: ${translatedLevel}`);
    });
    
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
          </div>
        </div>

        {/* Статистика - только 3 блока, показывает данные из БД */}
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

        {/* Фильтры */}
   {/* Фильтры */}
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
    <select
      value={filters.is_admin ?? ''}
      onChange={(e) => handleFilterChange('is_admin', e.target.value)}
      className="admin-filter-select"  // ИЗМЕНЕНО: admin-filter-select вместо filter-select
      disabled={loading}
    >
      <option value="">{t('allRoles') || 'Все роли'}</option>
      <option value="true">{t('adminsA') || 'Администраторы'}</option>
      <option value="false">{t('users') || 'Пользователи'}</option>
    </select>
    
    <select
      value={filters.is_banned ?? ''}
      onChange={(e) => handleFilterChange('is_banned', e.target.value)}
      className="admin-filter-select"  // ИЗМЕНЕНО: admin-filter-select вместо filter-select
      disabled={loading}
    >
      <option value="">{t('allStatuses') || 'Все статусы'}</option>
      <option value="true">{t('banned') || 'Заблокированные'}</option>
      <option value="false">{t('active') || 'Активные'}</option>
    </select>
    
    <button
      onClick={handleClearFilters}
      className="admin-clear-filters-button"  // ИЗМЕНЕНО: admin-clear-filters-button вместо clear-filters-button
      disabled={loading || (!filters.search && filters.is_admin === null && filters.is_banned === null)}
    >
      <span className="material-icons">clear_all</span>
      {t('clearFilters') || 'Сбросить'}
    </button>
  </div>
</div>

        {/* Загрузка/ошибки/контент */}
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
                            <span className="status-badge banned" title={user.ban_reason}>
                              <span className="material-icons">block</span>
                              {t('banned') || 'Забанен'}
                              {user.ban_reason && (
                                <span className="ban-reason-hint" title={user.ban_reason}>
                                  <span className="material-icons">info</span>
                                </span>
                              )}
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
            
            {/* Пагинация */}
            {renderPagination()}
          </>
        )}
      </div>
    );
  };

  // Рендер других вкладок
  const renderTabContent = () => {
    switch (activeTab) {
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
      case 'achievements':
        return (
          <div className="admin-section">
            <h2>{t('manageAchievements') || 'Управление достижениями'}</h2>
            <div className="admin-empty-state">
              <span className="material-icons">emoji_events</span>
              <p>{t('achievementsComingSoon') || 'Здесь будет управление достижениями пользователей и наградами'}</p>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="admin-section">
            <h2>{t('manageReports') || 'Жалобы пользователей'}</h2>
            <div className="admin-empty-state">
              <span className="material-icons">report</span>
              <p>{t('reportsComingSoon') || 'Здесь будут жалобы пользователей и модерация контента'}</p>
            </div>
          </div>
        );
      case 'reviews':
        return (
          <div className="admin-section">
            <h2>{t('manageReviews') || 'Отзывы о платформе'}</h2>
            <div className="admin-empty-state">
              <span className="material-icons">rate_review</span>
              <p>{t('reviewsComingSoon') || 'Здесь будут отзывы пользователей о платформе'}</p>
            </div>
          </div>
        );
      default:
        return renderUsersTab();
    }
  };

  // Если проверка прав еще идет
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

  // Если пользователь не админ
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

  // Основной рендер админ-панели
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
          <div className="modal ban-modal" onClick={e => e.stopPropagation()}>
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
              <p className="ban-user-info">
                {t('user') || 'Пользователь'}: <strong>{banModal.username}</strong>
              </p>
              
              <div className="form-group">
                <label htmlFor="ban-reason">{t('banReason') || 'Причина блокировки:'}</label>
                <select
                  id="ban-reason"
                  value={banModal.reason}
                  onChange={(e) => setBanModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="form-select"
                >
                  {banReasons.map(reason => (
                    <option key={reason.id} value={reason.id}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="ban-duration">{t('banDuration') || 'Длительность блокировки:'}</label>
                <select
                  id="ban-duration"
                  value={banModal.duration}
                  onChange={(e) => setBanModal(prev => ({ 
                    ...prev, 
                    duration: e.target.value,
                    durationType: banDurations.find(d => d.value === e.target.value)?.type || 'hours'
                  }))}
                  className="form-select"
                >
                  {banDurations.map(duration => (
                    <option key={duration.value} value={duration.value}>
                      {duration.label}
                    </option>
                  ))}
                </select>
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

      {/* Модалка подтверждения */}
      {confirmModal.isOpen && (
        <div className="modal-overlay" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
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
        <div className="modal-overlay" onClick={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}>
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
    </div>
  );
};

export default AdminPage;