import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAdminCheck } from '../hooks/useAdminCheck';
import AdminUsersTab from './admin/AdminUsersTab';
import AdminSupportTab from './admin/AdminSupportTab';
import AdminReviewsTab from './admin/AdminReviewsTab';
import AdminReportsTab from './admin/AdminReportsTab';
import AdminFundsTab from './admin/AdminFundsTab';
import '../styles/pages/AdminPage.css';

const AdminPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading, user: currentUser } = useAdminCheck();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'users');

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });

  const [stats, setStats] = useState({
    totalUsers: 0, totalAdmins: 0, totalBanned: 0,
    totalTickets: 0, pendingTickets: 0, answeredTickets: 0, closedTickets: 0,
  });

  const tabs = [
    { id: 'users', label: t('adminTabUsers') || 'Пользователи', icon: 'people' },
    { id: 'funds', label: t('adminTabFunds') || 'Фонды', icon: 'account_balance' },
    { id: 'reports', label: t('adminTabReports') || 'Жалобы', icon: 'report' },
    { id: 'reviews', label: t('adminTabReviews') || 'Отзывы', icon: 'rate_review' },
    { id: 'support', label: t('adminTabSupport') || 'Вопросы', icon: 'help_outline' },
  ];

  const showSuccessModal = useCallback((title, message) => {
    setSuccessModal({ isOpen: true, title, message });
    setTimeout(() => setSuccessModal(prev => ({ ...prev, isOpen: false })), 3000);
  }, []);

  const formatDate = (dateInput) => {
    if (!dateInput || dateInput === 'null' || dateInput === null) return '—';
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

  const formatCarbonSaved = (carbonSaved) => {
    const value = carbonSaved || 0;
    return `${value.toLocaleString()} ${t('carbonUnit') || 'кг'}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'answered': return '#4caf50';
      case 'closed': return '#9e9e9e';
      case 'published': return '#4caf50';
      case 'draft': return '#757575';
      default: return '#666';
    }
  };

  const loadStats = useCallback(async () => {
    if (!isAdmin || adminLoading) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const [usersRes, supportRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/simple-stats', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        if (data.success) setStats(prev => ({ ...prev, totalUsers: parseInt(data.totalUsers) || 0, totalAdmins: parseInt(data.totalAdmins) || 0, totalBanned: parseInt(data.totalBanned) || 0 }));
      }
      if (supportRes.ok) {
        const data = await supportRes.json();
        if (data.success) setStats(prev => ({ ...prev, totalTickets: parseInt(data.totalTickets) || 0, pendingTickets: parseInt(data.pendingTickets) || 0, answeredTickets: parseInt(data.answeredTickets) || 0, closedTickets: parseInt(data.closedTickets) || 0 }));
      }
    } catch (error) { console.error('Error loading stats:', error); }
  }, [isAdmin, adminLoading]);

  useEffect(() => {
    if (isAdmin && !adminLoading) loadStats();
  }, [isAdmin, adminLoading, loadStats]);

  // Sync active tab to URL
  useEffect(() => {
    const params = activeTab !== 'users' ? { tab: activeTab } : {};
    setSearchParams(params, { replace: true });
  }, [activeTab, setSearchParams]);

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'support':
        return <AdminSupportTab stats={stats} showSuccessModal={showSuccessModal} setConfirmModal={setConfirmModal} formatDate={formatDate} getStatusColor={getStatusColor} />;
      case 'reviews':
        return <AdminReviewsTab showSuccessModal={showSuccessModal} setConfirmModal={setConfirmModal} formatDate={formatDate} formatCarbonSaved={formatCarbonSaved} getStatusColor={getStatusColor} />;
      case 'funds':
        return <AdminFundsTab />;
      case 'reports':
        return <AdminReportsTab showSuccessModal={showSuccessModal} setConfirmModal={setConfirmModal} />;
      default:
        return <AdminUsersTab isAdmin={isAdmin} adminLoading={adminLoading} currentUser={currentUser} stats={stats} showSuccessModal={showSuccessModal} setConfirmModal={setConfirmModal} />;
    }
  };

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
            <button key={tab.id} className={`admin-tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <span className="material-icons tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="admin-content">
          {renderTabContent()}
        </div>
      </div>

      {/* Confirm modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{confirmModal.title}</h3>
              <button className="modal-close" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}><span className="material-icons">close</span></button>
            </div>
            <div className="modal-body"><p>{confirmModal.message}</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>{t('cancel') || 'Отмена'}</button>
              <button className="btn btn-primary" onClick={() => { confirmModal.onConfirm?.(); setConfirmModal(prev => ({ ...prev, isOpen: false })); }}>{t('confirm') || 'Подтвердить'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Success modal */}
      {successModal.isOpen && (
        <div className="modal-overlay" onClick={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal success-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><span className="material-icons">check_circle</span>{successModal.title}</h3>
              <button className="modal-close" onClick={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}><span className="material-icons">close</span></button>
            </div>
            <div className="modal-body"><p>{successModal.message}</p></div>
            <div className="modal-footer">
              <button className="btn btn-success" onClick={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}>{t('ok') || 'OK'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
