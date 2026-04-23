import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { getEmojiByCarbon } from '../../utils/emojiMapper';
import { exportAllUsers } from '../../utils/excelExport';

const AdminUsersTab = ({
  isAdmin,
  adminLoading,
  currentUser,
  stats,
  showSuccessModal,
  setConfirmModal,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [banDetails, setBanDetails] = useState({});

  const [filters, setFilters] = useState({
    search: '',
    is_admin: null,
    is_banned: null,
  });

  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [banModal, setBanModal] = useState({
    isOpen: false,
    userId: null,
    username: '',
    currentBanCount: 0,
    reason: '',
    duration: '24',
    durationType: 'hours',
    error: '',
  });

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);

  const searchDebounceTimer = useRef(null);

  const banDurations = useMemo(() => [
    { value: '1', label: t('banDuration1h') || '1 час', type: 'hours' },
    { value: '24', label: t('banDuration24h') || '24 часа', type: 'hours' },
    { value: '168', label: t('banDuration7d') || '7 дней', type: 'hours' },
    { value: '720', label: t('banDuration30d') || '30 дней', type: 'hours' },
    { value: 'permanent', label: t('banDurationPermanent') || 'Навсегда', type: 'permanent' },
  ], [t]);

  const roleOptions = useMemo(() => [
    { id: null, label: t('allRoles') || 'Все роли', value: null },
    { id: 'admin', label: t('adminsA') || 'Администраторы', value: true },
    { id: 'user', label: t('users') || 'Пользователи', value: false },
  ], [t]);

  const statusOptions = useMemo(() => [
    { id: null, label: t('allStatuses') || 'Все статусы', value: null },
    { id: 'banned', label: t('banned') || 'Заблокированные', value: true },
    { id: 'active', label: t('active') || 'Активные', value: false },
  ], [t]);

  // ==================== УТИЛИТЫ ====================

  const formatDate = (dateInput) => {
    if (!dateInput || dateInput === 'null' || dateInput === 'undefined' || dateInput === null) return '—';
    try {
      let date;
      if (typeof dateInput === 'string') {
        if (dateInput.includes('T')) date = new Date(dateInput);
        else if (dateInput.includes('-') && dateInput.includes(':')) date = new Date(dateInput.replace(' ', 'T') + 'Z');
        else if (dateInput.includes('-')) date = new Date(dateInput + 'T00:00:00Z');
        else { const ts = parseInt(dateInput); date = !isNaN(ts) ? new Date(ts) : new Date(dateInput); }
      } else if (typeof dateInput === 'number') date = new Date(dateInput);
      else date = dateInput;
      if (isNaN(date.getTime())) return 'Некорректная дата';
      const d = date.getDate().toString().padStart(2, '0');
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const y = date.getFullYear();
      const h = date.getHours().toString().padStart(2, '0');
      const min = date.getMinutes().toString().padStart(2, '0');
      return `${d}.${m}.${y} ${h}:${min}`;
    } catch { return 'Ошибка даты'; }
  };

  const getUserAvatar = (user) => {
    if (!user) return '👤';
    if (user.avatar_emoji && user.avatar_emoji.length <= 10) return getEmojiByCarbon(user.carbon_saved || 0);
    if (user.avatar_emoji) return user.avatar_emoji;
    return getEmojiByCarbon(user.carbon_saved || 0);
  };

  const getTranslatedEcoLevel = (carbonSaved) => {
    const carbon = carbonSaved || 0;
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

  const getRoleLabel = () => {
    const option = roleOptions.find(opt => opt.value === filters.is_admin);
    return option ? option.label : roleOptions[0].label;
  };

  const getStatusLabel = (value) => {
    const option = statusOptions.find(opt => opt.value === value);
    return option ? option.label : statusOptions[0].label;
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
        color: '#dc3545', icon: 'warning',
      };
    }
    if (banModal.durationType === 'permanent') {
      return {
        type: 'permanent-manual',
        title: t('banPermanent') || 'Блокировка навсегда',
        subtitle: t('violationNumber', { number: newCount }) || `(нарушение №${newCount})`,
        color: '#dc3545', icon: 'warning',
      };
    }
    const durationLabel = banDurations.find(d => d.value === banModal.duration)?.label || '24 часа';
    return {
      type: 'temporary',
      title: `${durationLabel}`,
      subtitle: t('violationNumber', { number: newCount }) || `(нарушение №${newCount})`,
      color: '#ffc107', icon: 'schedule',
    };
  };

  const getBanTooltipText = (user) => {
    const details = banDetails[user.id];
    if (!details) return 'Загрузка информации о бане...';
    let tooltipText = '';
    if (details.is_permanent || details.expires_at === null) tooltipText = 'БАН НАВСЕГДА';
    else if (details.expires_at) tooltipText = `Бан до: ${formatDate(details.expires_at)}`;
    else tooltipText = 'Пользователь забанен';
    if (details.created_at) tooltipText += `\nДата начала: ${formatDate(details.created_at)}`;
    if (details.reason) tooltipText += `\nПричина: ${details.reason}`;
    else if (user.ban_reason) tooltipText += `\nПричина: ${user.ban_reason}`;
    return tooltipText;
  };

  // ==================== API ФУНКЦИИ ====================

  const loadBanDetailsForUser = useCallback(async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const response = await fetch(`/api/admin/users/${userId}/ban-details`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) return data.banDetails || {};
      }
    } catch (error) { console.error(`Error loading ban details for user ${userId}:`, error); }
    return null;
  }, []);

  const loadBanDetailsForUsers = useCallback(async () => {
    if (!isAdmin || adminLoading || loading) return;
    const bannedUsers = users.filter(user => user.is_banned);
    for (const user of bannedUsers) {
      if (!banDetails[user.id]) {
        const details = await loadBanDetailsForUser(user.id);
        if (details) setBanDetails(prev => ({ ...prev, [user.id]: details }));
      }
    }
  }, [users, isAdmin, adminLoading, loading, banDetails, loadBanDetailsForUser]);

  const loadUsers = useCallback(async (filtersToUse = filters, sortToUse = sortConfig, page = pagination.page) => {
    if (!isAdmin || adminLoading || loading) return;
    if (users.length === 0) setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { setError(t('authRequired') || 'Требуется авторизация'); setLoading(false); return; }
      const params = new URLSearchParams({ page: page.toString(), limit: pagination.limit.toString() });
      if (sortToUse.key) { params.append('sortBy', sortToUse.key); params.append('sortOrder', sortToUse.direction === 'desc' ? 'DESC' : 'ASC'); }
      if (filtersToUse.search) params.append('search', filtersToUse.search);
      if (filtersToUse.is_admin !== null) params.append('is_admin', filtersToUse.is_admin.toString());
      if (filtersToUse.is_banned !== null) params.append('is_banned', filtersToUse.is_banned.toString());
      const response = await fetch(`/api/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); return; }
      if (response.status === 403) { setError(t('accessDenied') || 'Доступ запрещен.'); setLoading(false); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      if (data.success) {
        const usersData = data.users || [];
        const total = data.pagination?.total || 0;
        const totalPages = Math.ceil(total / pagination.limit);
        setUsers(usersData);
        setPagination(prev => ({ ...prev, page, total, totalPages }));
      } else {
        setError(data.message || t('errorLoadingUsers') || 'Ошибка загрузки пользователей');
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError(t('networkError') || 'Ошибка сети. Проверьте подключение.');
    } finally { setLoading(false); }
  }, [isAdmin, adminLoading, loading, t, navigate, pagination.limit, filters, sortConfig]);

  const loadUserBanHistory = useCallback(async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return 0;
      const response = await fetch(`/api/admin/users/${userId}/ban-history`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.ok) { const data = await response.json(); if (data.success) return data.totalBans || 0; }
    } catch (error) { console.error('Error loading ban history:', error); }
    return 0;
  }, []);

  // ==================== ЭФФЕКТЫ ====================

  useEffect(() => {
    if (isAdmin && !adminLoading) loadUsers({ search: '', is_admin: null, is_banned: null }, sortConfig, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, adminLoading]);

  useEffect(() => {
    if (users.length > 0 && isAdmin && !adminLoading) loadBanDetailsForUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users.length, isAdmin, adminLoading]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleDropdownOpen && !e.target.closest('.admin-filter-dropdown')) setRoleDropdownOpen(false);
      if (statusDropdownOpen && !e.target.closest('.admin-filter-dropdown')) setStatusDropdownOpen(false);
      if (durationDropdownOpen && !e.target.closest('.modal-dropdown') && !e.target.closest('.modal-overlay')) setDurationDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [roleDropdownOpen, statusDropdownOpen, durationDropdownOpen]);

  useEffect(() => {
    return () => { if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current); };
  }, []);

  // ==================== ОБРАБОТЧИКИ ====================

  const handleFilterChange = useCallback((filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    loadUsers(newFilters, sortConfig, 1);
  }, [filters, sortConfig, loadUsers]);

  const handleSearchChange = useCallback((searchValue) => {
    setFilters(prev => ({ ...prev, search: searchValue }));
    if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current);
    searchDebounceTimer.current = setTimeout(() => {
      loadUsers({ ...filters, search: searchValue }, sortConfig, 1);
    }, 500);
  }, [filters, sortConfig, loadUsers]);

  const handleSort = useCallback((key) => {
    if (key === 'email') return;
    const newSortConfig = { key, direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc' };
    setSortConfig(newSortConfig);
    loadUsers(filters, newSortConfig, 1);
  }, [sortConfig, filters, loadUsers]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === pagination.page) return;
    loadUsers(filters, sortConfig, newPage);
  }, [filters, sortConfig, pagination.totalPages, pagination.page, loadUsers]);

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') { if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current); loadUsers(filters, sortConfig, 1); }
  };

  const handleSearchClick = () => {
    if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current);
    loadUsers(filters, sortConfig, 1);
  };

  const handleClearFilters = () => {
    if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current);
    const clearedFilters = { search: '', is_admin: null, is_banned: null };
    setFilters(clearedFilters);
    setRoleDropdownOpen(false);
    setStatusDropdownOpen(false);
    loadUsers(clearedFilters, sortConfig, 1);
  };

  const handleRefresh = () => {
    loadUsers(filters, sortConfig, pagination.page);
  };

  const openBanModal = async (user) => {
    if (user.is_banned) {
      const userBanDetails = banDetails[user.id];
      const message = (userBanDetails?.expires_at === null || userBanDetails?.is_permanent)
        ? t('userAlreadyPermanentlyBanned', { username: user.nickname || user.email }) || `Пользователь ${user.nickname || user.email} уже забанен навсегда`
        : t('userAlreadyBanned', { username: user.nickname || user.email }) || `Пользователь ${user.nickname || user.email} уже забанен`;
      showSuccessModal(t('cannot') || 'Невозможно', message);
      return;
    }
    if (user.is_admin) { showSuccessModal(t('cannot') || 'Невозможно', t('cannotBanAdmin') || 'Нельзя заблокировать администратора'); return; }
    if (currentUser?.id === user.id) { showSuccessModal(t('cannot') || 'Невозможно', t('cannotBanSelf') || 'Нельзя заблокировать самого себя'); return; }
    const banCountFromTable = user.ban_count || 0;
    const banCountFromHistory = await loadUserBanHistory(user.id);
    const currentBanCount = Math.max(banCountFromTable, banCountFromHistory);
    let defaultDuration = '24';
    let defaultDurationType = 'hours';
    if (currentBanCount >= 3) { defaultDuration = 'permanent'; defaultDurationType = 'permanent'; }
    setBanModal({ isOpen: true, userId: user.id, username: user.nickname || user.email, currentBanCount, reason: '', duration: defaultDuration, durationType: defaultDurationType, error: '' });
    setDurationDropdownOpen(false);
  };

  const closeBanModal = () => {
    setBanModal({ isOpen: false, userId: null, username: '', currentBanCount: 0, reason: '', duration: '24', durationType: 'hours', error: '' });
    setDurationDropdownOpen(false);
  };

  const calculateBanDuration = () => {
    const newCount = banModal.currentBanCount + 1;
    if (newCount >= 4) return { duration: null, isPermanent: true, reason: t('automaticPermanentBan') || 'Автоматическая вечная блокировка (4 и более нарушений)' };
    if (banModal.durationType === 'permanent') return { duration: null, isPermanent: true, reason: banModal.reason.trim() };
    return { duration: parseInt(banModal.duration), isPermanent: false, reason: banModal.reason.trim() };
  };

  const confirmBan = async () => {
    if (!banModal.reason.trim()) { setBanModal(prev => ({ ...prev, error: t('specifyReason') || 'Укажите причину бана' })); return; }
    if (banModal.reason.length > 500) { setBanModal(prev => ({ ...prev, error: t('reasonTooLong') || 'Причина слишком длинная (макс. 500 символов)' })); return; }
    try {
      const token = localStorage.getItem('token');
      const { duration, isPermanent, reason } = calculateBanDuration();
      const newBanCount = banModal.currentBanCount + 1;
      const response = await fetch(`/api/admin/users/${banModal.userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason, duration_hours: duration, is_permanent: isPermanent }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      if (data.success) {
        const updatedBanDetails = await loadBanDetailsForUser(banModal.userId);
        if (updatedBanDetails) setBanDetails(prev => ({ ...prev, [banModal.userId]: updatedBanDetails }));
        setUsers(prev => prev.map(u => u.id === banModal.userId ? { ...u, is_banned: true, ban_reason: reason, ban_count: newBanCount } : u));
        loadUsers(filters, sortConfig, pagination.page);
        let successMessage = '';
        if (newBanCount >= 4) successMessage = t('userPermanentlyBanned', { username: banModal.username, count: newBanCount }) || `Пользователь ${banModal.username} заблокирован навсегда (${newBanCount} нарушений)`;
        else if (isPermanent) successMessage = t('userPermanentlyBannedManual', { username: banModal.username }) || `Пользователь ${banModal.username} заблокирован навсегда`;
        else { const durationLabel = banDurations.find(d => d.value === banModal.duration)?.label || '24 часа'; successMessage = t('userBannedSuccess', { username: banModal.username, duration: durationLabel }) || `Пользователь ${banModal.username} был забанен на ${durationLabel}`; }
        showSuccessModal(t('userBanned') || 'Пользователь забанен', successMessage);
        closeBanModal();
      } else { setBanModal(prev => ({ ...prev, error: data.message })); }
    } catch (err) { console.error('Error banning user:', err); setBanModal(prev => ({ ...prev, error: t('networkError') || 'Ошибка сети' })); }
  };

  const handleUnban = async (user) => {
    const realBanCount = await loadUserBanHistory(user.id);
    setConfirmModal({
      isOpen: true,
      title: t('confirmUnban') || 'Разбанить пользователя?',
      message: t('confirmUnbanMessage', { username: user.nickname || user.email, count: realBanCount }) || `Вы уверены, что хотите разбанить пользователя ${user.nickname || user.email}? (Был забанен ${realBanCount} раз)`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/admin/users/${user.id}/unban`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          const data = await response.json();
          if (data.success) {
            setBanDetails(prev => { const n = { ...prev }; delete n[user.id]; return n; });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_banned: false, ban_reason: null, ban_count: 0 } : u));
            loadUsers(filters, sortConfig, pagination.page);
            showSuccessModal(t('userUnbanned') || 'Пользователь разбанен', t('userUnbannedSuccess', { username: user.nickname || user.email }) || `Пользователь ${user.nickname || user.email} был разбанен`);
          } else { showSuccessModal(t('error') || 'Ошибка', data.message || t('operationFailed') || 'Операция не выполнена'); }
        } catch (err) { console.error('Error unbanning user:', err); showSuccessModal(t('networkErrorTitle') || 'Ошибка сети', t('networkError') || 'Ошибка сети'); }
        finally { setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null }); }
      },
    });
  };

  const handleAdminToggle = (user) => {
    const action = user.is_admin ? 'removeAdmin' : 'makeAdmin';
    const messages = {
      makeAdmin: { title: t('confirmMakeAdmin') || 'Назначить администратором?', message: t('confirmMakeAdminMessage', { username: user.nickname || user.email }) || `Назначить пользователя ${user.nickname || user.email} администратором?`, success: t('makeAdminSuccess', { username: user.nickname || user.email }) || `Пользователь ${user.nickname || user.email} назначен администратором` },
      removeAdmin: { title: t('confirmRemoveAdmin') || 'Убрать права администратора?', message: t('confirmRemoveAdminMessage', { username: user.nickname || user.email }) || `Убрать права администратора у пользователя ${user.nickname || user.email}?`, success: t('removeAdminSuccess', { username: user.nickname || user.email }) || `Пользователь ${user.nickname || user.email} лишен прав администратора` },
    };
    setConfirmModal({
      isOpen: true, title: messages[action].title, message: messages[action].message,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/admin/users/${user.id}/admin`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ is_admin: !user.is_admin }),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          const data = await response.json();
          if (data.success) {
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_admin: !user.is_admin } : u));
            loadUsers(filters, sortConfig, pagination.page);
            showSuccessModal(t('success') || 'Успешно', messages[action].success);
          } else { showSuccessModal(t('error') || 'Ошибка', data.message || t('operationFailed') || 'Операция не выполнена'); }
        } catch (err) { console.error('Error updating admin status:', err); showSuccessModal(t('networkErrorTitle') || 'Ошибка сети', t('networkError') || 'Ошибка сети'); }
        finally { setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null }); }
      },
    });
  };

  // ==================== РЕНДЕРИНГ ====================

  const renderTableHeader = (key, label, sortable = true) => {
    const isSorted = sortConfig.key === key;
    const direction = sortConfig.direction;
    if (sortable) {
      return (
        <th onClick={() => handleSort(key)} className={`sortable ${isSorted ? 'sorted' : ''}`}>
          {t(label) || label}
          {isSorted && <span className="sort-icon">{direction === 'asc' ? '↑' : '↓'}</span>}
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
    if (endPage - startPage + 1 < maxVisiblePages) startPage = Math.max(1, endPage - maxVisiblePages + 1);

    pages.push(<button key="prev" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1 || loading} className="pagination-button"><span className="material-icons">chevron_left</span></button>);

    if (startPage > 1) {
      pages.push(<button key={1} onClick={() => handlePageChange(1)} className={`pagination-button ${1 === pagination.page ? 'active' : ''}`} disabled={loading}>1</button>);
      if (startPage > 2) pages.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(<button key={i} onClick={() => handlePageChange(i)} className={`pagination-button ${i === pagination.page ? 'active' : ''}`} disabled={loading}>{i}</button>);
    }

    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) pages.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>);
      pages.push(<button key={pagination.totalPages} onClick={() => handlePageChange(pagination.totalPages)} className={`pagination-button ${pagination.totalPages === pagination.page ? 'active' : ''}`} disabled={loading}>{pagination.totalPages}</button>);
    }

    pages.push(<button key="next" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages || loading} className="pagination-button"><span className="material-icons">chevron_right</span></button>);

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          {t('showing') || 'Показано'}: <strong>{(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> {t('of') || 'из'} <strong>{pagination.total}</strong>
        </div>
        <div className="pagination-buttons">{pages}</div>
      </div>
    );
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>{t('manageUsers') || 'Управление пользователями'}</h2>
        <div className="section-actions">
          <button onClick={handleRefresh} className="refresh-button" disabled={loading || adminLoading}>
            <span className="material-icons">refresh</span>
            {t('refresh') || 'Обновить'}
          </button>
          <button
            onClick={async () => { try { await exportAllUsers(t); } catch (e) { console.error(e); } }}
            className="export-button"
            disabled={loading}
            title={t('exportToExcel') || 'Экспорт в Excel'}
          >
            <span className="material-icons">download</span>
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users"><span className="material-icons">people</span></div>
          <div className="stat-info">
            <div className="stat-value">{stats?.totalUsers || 0}</div>
            <div className="stat-label">{t('totalUsers') || 'Всего пользователей'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon admins"><span className="material-icons">admin_panel_settings</span></div>
          <div className="stat-info">
            <div className="stat-value">{stats?.totalAdmins || 0}</div>
            <div className="stat-label">{t('totalAdmins') || 'Администраторов'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon banned"><span className="material-icons">block</span></div>
          <div className="stat-info">
            <div className="stat-value">{stats?.totalBanned || 0}</div>
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
            placeholder={t('searchPlaceholder') || 'Поиск по email или никнейму...'}
            className="search-input"
            disabled={loading}
          />
          <button onClick={handleSearchClick} className="search-button" disabled={loading}>
            <span className="material-icons">search</span>
          </button>
        </div>

        <div className="filter-buttons">
          <div className="admin-filter-dropdown">
            <div className={`admin-dropdown-trigger ${roleDropdownOpen ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setRoleDropdownOpen(!roleDropdownOpen); setStatusDropdownOpen(false); }}>
              <span>{getRoleLabel()}</span>
              <svg className={`admin-dropdown-arrow ${roleDropdownOpen ? 'rotated' : ''}`} width="12" height="12" viewBox="0 0 8 5" fill="none"><path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" fill="currentColor"/></svg>
            </div>
            {roleDropdownOpen && (
              <div className="admin-dropdown-options">
                {roleOptions.map((option) => (
                  <div key={option.id} className={`admin-dropdown-option ${filters.is_admin === option.value ? 'selected' : ''}`} onClick={(e) => { e.stopPropagation(); handleFilterChange('is_admin', option.value); setRoleDropdownOpen(false); }}>
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-filter-dropdown">
            <div className={`admin-dropdown-trigger ${statusDropdownOpen ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setStatusDropdownOpen(!statusDropdownOpen); setRoleDropdownOpen(false); }}>
              <span>{getStatusLabel(filters.is_banned)}</span>
              <svg className={`admin-dropdown-arrow ${statusDropdownOpen ? 'rotated' : ''}`} width="12" height="12" viewBox="0 0 8 5" fill="none"><path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" fill="currentColor"/></svg>
            </div>
            {statusDropdownOpen && (
              <div className="admin-dropdown-options">
                {statusOptions.map((option) => (
                  <div key={option.id} className={`admin-dropdown-option ${filters.is_banned === option.value ? 'selected' : ''}`} onClick={(e) => { e.stopPropagation(); handleFilterChange('is_banned', option.value); setStatusDropdownOpen(false); }}>
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleClearFilters} className="admin-clear-filters-button" disabled={loading || (!filters.search && filters.is_admin === null && filters.is_banned === null)}>
            <span className="material-icons">clear_all</span>
            {t('clearFilters') || 'Сбросить'}
          </button>
        </div>
      </div>

      {loading && users.length === 0 ? (
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
          <p>{filters.search || filters.is_admin !== null || filters.is_banned !== null ? t('changeSearchParams') || 'Измените параметры поиска.' : t('noUsersInSystem') || 'В системе пока нет пользователей.'}</p>
          {(filters.search || filters.is_admin !== null || filters.is_banned !== null) && (
            <button onClick={handleClearFilters} className="retry-button">{t('showAllUsers') || 'Показать всех пользователей'}</button>
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
                  <tr key={user.id} className={`${user.is_admin ? 'admin-row' : ''} ${user.is_banned ? 'banned-row' : ''} ${currentUser?.id === user.id ? 'current-user-row' : ''}`}>
                    <td className="user-id">#{user.id}</td>
                    <td className="user-email"><div className="email-cell"><span className="email-text">{user.email}</span></div></td>
                    <td className="user-nickname">
                      <div className="nickname-cell">
                        <span className="avatar-emoji">{getUserAvatar(user)}</span>
                        <span className="nickname-text">{user.nickname || t('noNickname') || 'Без никнейма'}</span>
                      </div>
                    </td>
                    <td className="registration-date">{formatDate(user.created_at)}</td>
                    <td className="eco-level">
                      <span className={`level-badge ${getEcoLevelClass(user.carbon_saved || 0)}`}>{getTranslatedEcoLevel(user.carbon_saved || 0)}</span>
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
                            <span className="material-icons ban-info-icon" title={getBanTooltipText(user)}>
                              {(() => { const d = banDetails[user.id]; if (!d) return 'hourglass_empty'; if (d.is_permanent || d.expires_at === null) return 'warning'; return 'info'; })()}
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
                        <span className={`ban-count ${(user.ban_count || 0) >= 3 ? 'ban-count-danger' : ''}`}>{user.ban_count || 0}</span>
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
                          <button onClick={() => handleAdminToggle(user)} className={`action-button ${user.is_admin ? 'remove-admin' : 'make-admin'}`} title={user.is_admin ? t('removeAdminRights') || 'Убрать права администратора' : t('makeAdmin') || 'Назначить администратором'} disabled={currentUser?.id === user.id}>
                            <span className="material-icons">{user.is_admin ? 'person_remove' : 'admin_panel_settings'}</span>
                          </button>
                        )}
                        <button onClick={() => user.is_banned ? handleUnban(user) : openBanModal(user)} className={`action-button ${user.is_banned ? 'unban' : 'ban'}`} title={user.is_banned ? t('unbanUser') || 'Разбанить' : t('banUser') || 'Забанить'} disabled={currentUser?.id === user.id || user.is_admin}>
                          <span className="material-icons">{user.is_banned ? 'lock_open' : 'block'}</span>
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

      {/* Ban Modal */}
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
                        <span className="material-icons" style={{ color: banInfo.color }}>{banInfo.icon}</span>
                        <div className="ban-info-title">
                          <div className="ban-info-main-title">{banInfo.title}</div>
                          <div className="ban-info-subtitle">{banInfo.subtitle}</div>
                        </div>
                      </div>
                      {banInfo.description && (
                        <div className="ban-info-description">{banInfo.description}</div>
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
                  placeholder={t('banReasonPlaceholder') || 'Опишите причину блокировки...'}
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
                    onClick={(e) => { e.stopPropagation(); setDurationDropdownOpen(!durationDropdownOpen); }}
                  >
                    <span>{banDurations.find(d => d.value === banModal.duration)?.label || banDurations[1].label}</span>
                    <svg className={`modal-dropdown-arrow ${durationDropdownOpen ? 'rotated' : ''}`} width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" fill="currentColor"/>
                    </svg>
                  </div>
                  {durationDropdownOpen && (
                    <div className="modal-dropdown-options">
                      {banDurations.map(duration => (
                        <div
                          key={duration.value}
                          className={`modal-dropdown-option ${banModal.duration === duration.value ? 'selected' : ''}`}
                          onClick={(e) => { e.stopPropagation(); setBanModal(prev => ({ ...prev, duration: duration.value, durationType: duration.type })); setDurationDropdownOpen(false); }}
                        >
                          {duration.label}
                          {duration.type === 'permanent' && (
                            <span className="permanent-badge">{t('permanent') || 'Навсегда'}</span>
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
              <button className="btn btn-secondary" onClick={closeBanModal}>{t('cancel') || 'Отмена'}</button>
              <button className="btn btn-danger" onClick={confirmBan}>{t('ban') || 'Заблокировать'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersTab;
