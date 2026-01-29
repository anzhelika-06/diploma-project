import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAdminCheck } from '../hooks/useAdminCheck';
import { getEmojiByCarbon, getEcoLevelText } from '../utils/emojiMapper';
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
  
  // Состояния для поддержки
  const [supportTickets, setSupportTickets] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState(null);
  
  // Фильтры для обращений
  const [supportFilters, setSupportFilters] = useState({
    search: '',
    status: 'pending'
  });
  
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
    pendingTickets: 0
  });

  // Рефы
  const isInitialMount = useRef(true);
  const searchDebounceTimer = useRef(null);
  const supportSearchDebounceTimer = useRef(null);

  // Константы
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
    { id: 'achievements', label: t('adminTabAchievements') || 'Достижения', icon: 'emoji_events' },
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
      
      if (durationDropdownOpen && !e.target.closest('.modal-dropdown') && !e.target.closest('.modal-overlay')) {
        setDurationDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setRoleDropdownOpen(false);
        setStatusDropdownOpen(false);
        setDurationDropdownOpen(false);
      }
    });
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', () => {});
    };
  }, [roleDropdownOpen, statusDropdownOpen, durationDropdownOpen]);

  // Загрузка обращений при переключении на вкладку
  useEffect(() => {
    if (activeTab === 'support' && isAdmin && !adminLoading) {
      loadSupportTickets();
    }
  }, [activeTab, isAdmin, adminLoading]);

  // Загрузка начальных данных пользователей
  useEffect(() => {
    if (activeTab === 'users' && isAdmin && !adminLoading) {
      if (isInitialMount.current) {
        loadInitialData();
        isInitialMount.current = false;
      }
    }
  }, [activeTab, isAdmin, adminLoading]);

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

  // ==================== ФУНКЦИИ ДЛЯ ПОДДЕРЖКИ ====================

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
      
      if (filtersToUse.status && filtersToUse.status !== 'all') {
        params.append('status', filtersToUse.status);
      }
      
      if (filtersToUse.search) {
        params.append('search', filtersToUse.search);
      }
      
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
        setSupportTickets(data.tickets || []);
        setSupportPagination(prev => ({
          ...prev,
          page,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1
        }));
        
        // Обновляем статистику
        if (data.stats) {
          setStats(prev => ({
            ...prev,
            pendingTickets: data.stats.pending || 0
          }));
        }
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
    
    supportSearchDebounceTimer.current = setTimeout(() => {
      loadSupportTickets(newFilters, 1);
    }, 300);
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
            setStats({
              totalUsers: parseInt(statsData.totalUsers) || 0,
              totalAdmins: parseInt(statsData.totalAdmins) || 0,
              totalBanned: parseInt(statsData.totalBanned) || 0,
              pendingTickets: parseInt(statsData.pendingTickets) || 0
            });
            return;
          }
        }
      } catch (statsError) {
        console.log('Regular stats endpoint failed:', statsError.message);
      }
      
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
            setStats({
              totalUsers: parseInt(simpleStatsData.totalUsers) || 0,
              totalAdmins: parseInt(simpleStatsData.totalAdmins) || 0,
              totalBanned: parseInt(simpleStatsData.totalBanned) || 0,
              pendingTickets: parseInt(simpleStatsData.pendingTickets) || 0
            });
            return;
          }
        }
      } catch (simpleError) {
        console.log('Simple stats also failed:', simpleError.message);
      }
      
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [isAdmin, adminLoading]);

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
        
        if (updateStats || (!filtersToUse.search && filtersToUse.is_admin === null && filtersToUse.is_banned === null && page === 1)) {
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

  const loadInitialData = useCallback(async () => {
    if (!isAdmin || adminLoading) return;
    
    await Promise.all([
      loadStatsFromDB(),
      loadUsers({ search: '', is_admin: null, is_banned: null }, sortConfig, 1, false)
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
      if (user.ban_expires_at === null) {
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
        const updatedUsers = users.map(user => 
          user.id === banModal.userId ? { 
            ...user, 
            is_banned: true,
            ban_reason: reason,
            ban_count: newBanCount,
            ban_expires_at: duration ? new Date(Date.now() + duration * 3600000).toISOString() : null
          } : user
        );
        
        setUsers(updatedUsers);
        
        setStats(prev => ({
          ...prev,
          totalBanned: prev.totalBanned + (data.user.is_banned && !data.user.was_banned ? 1 : 0)
        }));
        
        loadUsers(filters, sortConfig, pagination.page, false);
        
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
            const updatedUsers = users.map(u => 
              u.id === user.id ? { 
                ...u, 
                is_banned: false,
                ban_reason: null,
                ban_count: 0,
                ban_expires_at: null
              } : u
            );
            
            setUsers(updatedUsers);
            setStats(prev => ({
              ...prev,
              totalBanned: Math.max(0, prev.totalBanned - 1)
            }));
            
            loadUsers(filters, sortConfig, pagination.page, false);
            
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
            setStats(prev => ({
              ...prev,
              totalAdmins: !user.is_admin ? prev.totalAdmins + 1 : Math.max(0, prev.totalAdmins - 1)
            }));
            
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

  // ==================== УТИЛИТЫ ====================

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

  const getStatusLabel = () => {
    const option = statusOptions.find(opt => opt.value === filters.is_banned);
    return option ? option.label : statusOptions[0].label;
  };

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
    
    return getEcoLevelText(carbon);
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
    
    if (value >= 1000) {
      const tons = (value / 1000).toFixed(1);
      return `${tons} ${t('units.tons') || 'т'}`;
    }
    
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

  // ==================== ОБРАБОТЧИКИ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ====================

  const handleFilterChange = useCallback((filterType, value) => {
    const newFilters = { 
      ...filters, 
      [filterType]: value 
    };
    
    setFilters(newFilters);
    loadUsers(newFilters, sortConfig, 1, false);
  }, [filters, sortConfig, loadUsers]);

  const handleSearchChange = useCallback((searchValue) => {
    setFilters(prev => ({ ...prev, search: searchValue }));
    
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    
    searchDebounceTimer.current = setTimeout(() => {
      loadUsers({ ...filters, search: searchValue }, sortConfig, 1, false);
    }, 500);
  }, [filters, sortConfig, loadUsers]);

  const handleSort = useCallback((key) => {
    if (key === 'email') return;
    
    const newSortConfig = {
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc'
    };
    
    setSortConfig(newSortConfig);
    loadUsers(filters, newSortConfig, 1, false);
  }, [sortConfig, filters, loadUsers]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === pagination.page) return;
    loadUsers(filters, sortConfig, newPage, false);
  }, [filters, sortConfig, pagination.totalPages, pagination.page, loadUsers]);

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
      loadUsers(filters, sortConfig, 1, false);
    }
  };

  const handleSearchClick = () => {
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    loadUsers(filters, sortConfig, 1, false);
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
    loadUsers(clearedFilters, sortConfig, 1, true);
  };

  const handleRefresh = () => {
    if (activeTab === 'users') {
      loadStatsFromDB();
      loadUsers(filters, sortConfig, pagination.page, false);
    } else if (activeTab === 'support') {
      loadSupportTickets();
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
                <span>{getStatusLabel()}</span>
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
                            <span className="status-badge banned">
                              <span className="material-icons">block</span>
                              {t('banned') || 'Забанен'}
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
                          {(user.ban_count || 0) >= 3 && (
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
    const statusOptions = [
      { value: 'all', label: t('allStatuses') || 'Все статусы' },
      { value: 'pending', label: t('pending') || 'Ожидают' },
      { value: 'answered', label: t('answered') || 'Отвеченные' },
      { value: 'closed', label: t('closed') || 'Закрытые' }
    ];

    const getStatusColor = (status) => {
      switch(status) {
        case 'pending': return '#ff9800';
        case 'answered': return '#4caf50';
        case 'closed': return '#9e9e9e';
        default: return '#666';
      }
    };

    const getStatusLabel = (status) => {
      switch(status) {
        case 'pending': return t('statusPending') || 'Ожидает';
        case 'answered': return t('answered') || 'Отвечено';
        case 'closed': return t('closed') || 'Закрыто';
        default: return status;
      }
    };

    return (
      <div className="admin-section">
        <div className="section-header">
          <h2>{t('manageSupportTickets') || 'Управление обращениями'}</h2>
          <div className="section-actions">
            <button 
              onClick={() => loadSupportTickets()} 
              className="refresh-button"
              disabled={supportLoading}
            >
              <span className="material-icons">refresh</span>
              {t('refresh') || 'Обновить'}
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon support">
              <span className="material-icons">support</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">{supportPagination.total || 0}</div>
              <div className="stat-label">{t('totalTickets') || 'Всего обращений'}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon pending">
              <span className="material-icons">schedule</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.pendingTickets || 0}</div>
              <div className="stat-label">{t('pendingTickets') || 'Ожидают ответа'}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon answered">
              <span className="material-icons">check_circle</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">
                {supportTickets.filter(t => t.status === 'answered').length}
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
            <select
              value={supportFilters.status}
              onChange={(e) => handleSupportFilterChange('status', e.target.value)}
              className="admin-filter-select"
              disabled={supportLoading}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => {
                setSupportFilters({ search: '', status: 'pending' });
                loadSupportTickets({ search: '', status: 'pending' }, 1);
              }}
              className="admin-clear-filters-button"
              disabled={supportLoading}
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
                          {getStatusLabel(ticket.status)}
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'support':
        return renderSupportTab();
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