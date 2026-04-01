import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { translateStoryContent, detectTextLanguage } from '../../utils/translations';
import { exportAllSupportTickets } from '../../utils/excelExport';

const AdminSupportTab = ({
  stats,
  showSuccessModal,
  setConfirmModal,
  formatDate,
  getStatusColor,
}) => {
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();

  const [supportTickets, setSupportTickets] = useState([]);
  const [translatedSupportTickets, setTranslatedSupportTickets] = useState([]);
  const [translationCache, setTranslationCache] = useState({});
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState(null);

  const [supportFilters, setSupportFilters] = useState({ search: '', status: 'all' });
  const [supportStatusDropdownOpen, setSupportStatusDropdownOpen] = useState(false);
  const [supportPagination, setSupportPagination] = useState({
    page: 1, limit: 20, total: 0, totalPages: 1,
  });

  const [responseModal, setResponseModal] = useState({
    isOpen: false, ticketId: null, ticketNumber: '', userId: null,
    username: '', userEmail: '', subject: '', message: '',
    translatedSubject: '', translatedMessage: '', translatedAdminResponse: '',
    response: '', error: '',
  });

  const supportSearchDebounceTimer = useRef(null);
  const supportLoadingRef = useRef(supportLoading);
  supportLoadingRef.current = supportLoading;

  const supportStatusOptions = useMemo(() => [
    { id: 'all', label: t('allStatuses') || 'Все статусы', value: 'all' },
    { id: 'pending', label: t('pending') || 'Ожидают', value: 'pending' },
    { id: 'answered', label: t('answered') || 'Отвеченные', value: 'answered' },
    { id: 'closed', label: t('closed') || 'Закрытые', value: 'closed' },
  ], [t]);

  const getSupportStatusLabel = () => {
    const option = supportStatusOptions.find(opt => opt.value === supportFilters.status);
    return option ? option.label : supportStatusOptions[0].label;
  };

  const getSupportStatusBadgeLabel = (status) => {
    switch (status) {
      case 'pending': return t('statusPending') || 'Ожидает';
      case 'answered': return t('answered') || 'Отвечено';
      case 'closed': return t('closed') || 'Закрыто';
      default: return status;
    }
  };

  const loadSupportTickets = useCallback(async (filtersToUse = supportFilters, page = supportPagination.page) => {
    if (supportLoadingRef.current) return;
    setSupportLoading(true);
    setSupportError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { setSupportError(t('authRequired') || 'Требуется авторизация'); setSupportLoading(false); return; }
      const params = new URLSearchParams({ page: page.toString(), limit: supportPagination.limit.toString() });
      if (filtersToUse.status) params.append('status', filtersToUse.status);
      if (filtersToUse.search) params.append('search', filtersToUse.search);
      const response = await fetch(`/api/admin/support/tickets?${params}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); return; }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setSupportTickets(data.tickets || []);
        setSupportPagination(prev => ({ ...prev, page, total: data.pagination?.total || 0, totalPages: data.pagination?.totalPages || 1 }));
      } else {
        setSupportError(data.message || t('errorLoadingTickets') || 'Ошибка загрузки обращений');
      }
    } catch (err) {
      setSupportError(t('networkError') || 'Ошибка сети');
    } finally {
      setSupportLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, navigate, supportPagination.limit]);

  const handleSupportFilterChange = useCallback((type, value) => {
    const newFilters = { ...supportFilters, [type]: value };
    setSupportFilters(newFilters);
    if (supportSearchDebounceTimer.current) clearTimeout(supportSearchDebounceTimer.current);
    supportSearchDebounceTimer.current = setTimeout(() => {
      loadSupportTickets(newFilters, 1);
    }, type === 'status' ? 100 : 300);
  }, [supportFilters, loadSupportTickets]);

  const handleSupportPageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > supportPagination.totalPages || newPage === supportPagination.page) return;
    loadSupportTickets(supportFilters, newPage);
  }, [supportFilters, supportPagination.totalPages, supportPagination.page, loadSupportTickets]);

  const handleCloseTicket = async (ticket) => {
    setConfirmModal({
      isOpen: true,
      title: t('confirmCloseTicket') || 'Закрыть обращение?',
      message: t('confirmCloseTicketMessage', { ticketNumber: ticket.ticket_number, subject: ticket.subject }) ||
        `Вы уверены, что хотите закрыть обращение ${ticket.ticket_number}?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/admin/support/tickets/${ticket.id}/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          if (data.success) {
            loadSupportTickets();
            showSuccessModal(t('ticketClosed') || 'Обращение закрыто',
              t('ticketClosedSuccess', { ticketNumber: ticket.ticket_number }) || `Обращение ${ticket.ticket_number} закрыто`);
          } else {
            showSuccessModal(t('error') || 'Ошибка', data.message || t('operationFailed') || 'Операция не выполнена');
          }
        } catch (err) {
          showSuccessModal(t('networkErrorTitle') || 'Ошибка сети', t('networkError') || 'Ошибка сети');
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  const handleResponseSubmit = async () => {
    if (!responseModal.response.trim()) {
      setResponseModal(prev => ({ ...prev, error: t('responseRequired') || 'Введите ответ' }));
      return;
    }
    if (responseModal.response.length > 2000) {
      setResponseModal(prev => ({ ...prev, error: t('responseTooLong') || 'Ответ слишком длинный (макс. 2000 символов)' }));
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/support/tickets/${responseModal.ticketId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ response: responseModal.response.trim(), status: 'answered' })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) {
        loadSupportTickets();
        showSuccessModal(t('responseSent') || 'Ответ отправлен',
          t('responseSentToUser', { username: responseModal.username }) || `Ответ отправлен пользователю ${responseModal.username}`);
        setResponseModal(prev => ({ ...prev, isOpen: false }));
      } else {
        setResponseModal(prev => ({ ...prev, error: data.message }));
      }
    } catch (err) {
      setResponseModal(prev => ({ ...prev, error: t('networkError') || 'Ошибка сети' }));
    }
  };

  // Load on mount
  useEffect(() => {
    loadSupportTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Translate tickets when language changes
  useEffect(() => {
    const translateTickets = async () => {
      if (supportTickets.length === 0) { setTranslatedSupportTickets([]); return; }
      if (!('Translator' in self)) { setTranslatedSupportTickets(supportTickets); return; }
      try {
        const translated = await Promise.all(supportTickets.map(async (ticket) => {
          try {
            const targetLang = currentLanguage.toLowerCase();
            const subjectLang = detectTextLanguage(ticket.subject);
            let translatedSubject = ticket.subject;
            if (subjectLang !== targetLang) translatedSubject = await translateStoryContent(ticket.subject, currentLanguage, subjectLang);
            const messageLang = detectTextLanguage(ticket.message);
            let translatedMessage = ticket.message;
            if (messageLang !== targetLang) translatedMessage = await translateStoryContent(ticket.message, currentLanguage, messageLang);
            let translatedAdminResponse = ticket.admin_response;
            if (ticket.admin_response) {
              const responseLang = detectTextLanguage(ticket.admin_response);
              if (responseLang !== targetLang) translatedAdminResponse = await translateStoryContent(ticket.admin_response, currentLanguage, responseLang);
            }
            return { ...ticket, subject: translatedSubject, message: translatedMessage, admin_response: translatedAdminResponse };
          } catch { return ticket; }
        }));
        setTranslatedSupportTickets(translated);
      } catch { setTranslatedSupportTickets(supportTickets); }
    };
    translateTickets();
  }, [supportTickets, currentLanguage]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (supportStatusDropdownOpen && !e.target.closest('.support-filter-dropdown')) setSupportStatusDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [supportStatusDropdownOpen]);

  // Cleanup timers
  useEffect(() => {
    return () => { if (supportSearchDebounceTimer.current) clearTimeout(supportSearchDebounceTimer.current); };
  }, []);

  const renderSupportPagination = () => {
    if (supportPagination.totalPages <= 1) return null;
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, supportPagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(supportPagination.totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) startPage = Math.max(1, endPage - maxVisiblePages + 1);
    pages.push(<button key="prev" onClick={() => handleSupportPageChange(supportPagination.page - 1)} disabled={supportPagination.page === 1 || supportLoading} className="pagination-button"><span className="material-icons">chevron_left</span></button>);
    if (startPage > 1) { pages.push(<button key={1} onClick={() => handleSupportPageChange(1)} className={`pagination-button ${1 === supportPagination.page ? 'active' : ''}`} disabled={supportLoading}>1</button>); if (startPage > 2) pages.push(<span key="e1" className="pagination-ellipsis">...</span>); }
    for (let i = startPage; i <= endPage; i++) pages.push(<button key={i} onClick={() => handleSupportPageChange(i)} className={`pagination-button ${i === supportPagination.page ? 'active' : ''}`} disabled={supportLoading}>{i}</button>);
    if (endPage < supportPagination.totalPages) { if (endPage < supportPagination.totalPages - 1) pages.push(<span key="e2" className="pagination-ellipsis">...</span>); pages.push(<button key={supportPagination.totalPages} onClick={() => handleSupportPageChange(supportPagination.totalPages)} className={`pagination-button ${supportPagination.totalPages === supportPagination.page ? 'active' : ''}`} disabled={supportLoading}>{supportPagination.totalPages}</button>); }
    pages.push(<button key="next" onClick={() => handleSupportPageChange(supportPagination.page + 1)} disabled={supportPagination.page === supportPagination.totalPages || supportLoading} className="pagination-button"><span className="material-icons">chevron_right</span></button>);
    return (
      <div className="pagination-container">
        <div className="pagination-info">{t('showing') || 'Показано'}: <strong>{(supportPagination.page - 1) * supportPagination.limit + 1}-{Math.min(supportPagination.page * supportPagination.limit, supportPagination.total)}</strong> {t('of') || 'из'} <strong>{supportPagination.total}</strong></div>
        <div className="pagination-buttons">{pages}</div>
      </div>
    );
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>{t('manageSupportTickets') || 'Управление обращениями'}</h2>
        <div className="section-actions">
          <button onClick={() => loadSupportTickets()} className="refresh-button" disabled={supportLoading}>
            <span className="material-icons">refresh</span>
            {t('refresh') || 'Обновить'}
          </button>
          <button
            onClick={async () => {
              try { const result = await exportAllSupportTickets(t, currentLanguage); if (!result.success) console.error('Export error:', result.error); }
              catch (error) { console.error('Export error:', error.message); }
            }}
            className="export-button" disabled={supportLoading} title={t('exportToExcel') || 'Экспорт в Excel (все тикеты)'}
          >
            <span className="material-icons">download</span>
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon support"><span className="material-icons">help_outline</span></div>
          <div className="stat-info"><div className="stat-value">{stats.totalTickets || 0}</div><div className="stat-label">{t('totalTickets') || 'Всего обращений'}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending"><span className="material-icons">schedule</span></div>
          <div className="stat-info"><div className="stat-value">{stats.pendingTickets || 0}</div><div className="stat-label">{t('pendingTickets') || 'Ожидают ответа'}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon answered"><span className="material-icons">check_circle</span></div>
          <div className="stat-info"><div className="stat-value">{stats.answeredTickets || 0}</div><div className="stat-label">{t('answeredTickets') || 'Отвечено'}</div></div>
        </div>
      </div>

      <div className="filters-panel">
        <div className="search-box">
          <input type="text" value={supportFilters.search} onChange={(e) => handleSupportFilterChange('search', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadSupportTickets()}
            placeholder={t('searchSupportPlaceholder') || 'Поиск по теме или email...'} className="search-input" disabled={supportLoading} />
          <button onClick={() => loadSupportTickets()} className="search-button" disabled={supportLoading}><span className="material-icons">search</span></button>
        </div>
        <div className="filter-buttons">
          <div className="support-filter-dropdown admin-filter-dropdown">
            <div className={`admin-dropdown-trigger ${supportStatusDropdownOpen ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setSupportStatusDropdownOpen(!supportStatusDropdownOpen); }}>
              <span>{getSupportStatusLabel()}</span>
              <svg className={`admin-dropdown-arrow ${supportStatusDropdownOpen ? 'rotated' : ''}`} width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" fill="currentColor" />
              </svg>
            </div>
            {supportStatusDropdownOpen && (
              <div className="admin-dropdown-options">
                {supportStatusOptions.map((option) => (
                  <div key={option.id} className={`admin-dropdown-option ${supportFilters.status === option.value ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleSupportFilterChange('status', option.value); setSupportStatusDropdownOpen(false); }}>
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => { setSupportFilters({ search: '', status: 'all' }); setSupportStatusDropdownOpen(false); loadSupportTickets({ search: '', status: 'all' }, 1); }}
            className="admin-clear-filters-button" disabled={supportLoading || (!supportFilters.search && supportFilters.status === 'all')}>
            <span className="material-icons">clear_all</span>
            {t('clearFilters') || 'Сбросить'}
          </button>
        </div>
      </div>

      {supportLoading && supportTickets.length === 0 ? (
        <div className="loading-container"><div className="loading-spinner"></div><p>{t('loadingTickets') || 'Загрузка обращений...'}</p></div>
      ) : supportError ? (
        <div className="error-state">
          <span className="material-icons">error_outline</span><h3>{t('error') || 'Ошибка'}</h3><p>{supportError}</p>
          <button onClick={() => loadSupportTickets()} className="retry-button"><span className="material-icons">refresh</span>{t('tryAgain') || 'Попробовать снова'}</button>
        </div>
      ) : supportTickets.length === 0 ? (
        <div className="empty-state">
          <span className="material-icons">support</span>
          <h3>{t('noTicketsFound') || 'Обращения не найдены'}</h3>
          <p>{supportFilters.search || supportFilters.status !== 'all' ? t('changeSearchParams') || 'Измените параметры поиска.' : t('noTicketsInSystem') || 'Нет обращений в системе.'}</p>
          {(supportFilters.search || supportFilters.status !== 'all') && (
            <button onClick={() => { setSupportFilters({ search: '', status: 'all' }); loadSupportTickets({ search: '', status: 'all' }, 1); }} className="retry-button">{t('showAllTickets') || 'Показать все обращения'}</button>
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
                {(translatedSupportTickets.length > 0 ? translatedSupportTickets : supportTickets).map(ticket => (
                  <tr key={ticket.id} className={`ticket-row ${ticket.status}`}>
                    <td className="ticket-number"><strong>{ticket.ticket_number}</strong></td>
                    <td className="ticket-user">
                      <div className="user-info">
                        <div className="user-email">{ticket.user_email}</div>
                        {ticket.user_nickname && <div className="user-nickname">{ticket.user_nickname}</div>}
                      </div>
                    </td>
                    <td className="ticket-subject" title={ticket.subject}>{ticket.subject}</td>
                    <td className="ticket-status">
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(ticket.status) }}>{getSupportStatusBadgeLabel(ticket.status)}</span>
                    </td>
                    <td className="ticket-date">{formatDate(ticket.created_at)}</td>
                    <td className="ticket-actions">
                      <div className="action-buttons">
                        <button
                          onClick={async () => {
                            const cacheKey = `${ticket.id}_${currentLanguage}`;
                            let translatedSubject = ticket.subject;
                            let translatedMessage = ticket.message;
                            let translatedAdminResponse = ticket.admin_response;
                            if (translationCache[cacheKey]) {
                              translatedSubject = translationCache[cacheKey].subject;
                              translatedMessage = translationCache[cacheKey].message;
                              translatedAdminResponse = translationCache[cacheKey].adminResponse;
                            } else if ('Translator' in self) {
                              try {
                                const targetLang = currentLanguage.toLowerCase();
                                const subjectLang = detectTextLanguage(ticket.subject);
                                if (subjectLang !== targetLang) translatedSubject = await translateStoryContent(ticket.subject, currentLanguage, subjectLang);
                                const messageLang = detectTextLanguage(ticket.message);
                                if (messageLang !== targetLang) translatedMessage = await translateStoryContent(ticket.message, currentLanguage, messageLang);
                                if (ticket.admin_response) {
                                  const responseLang = detectTextLanguage(ticket.admin_response);
                                  if (responseLang !== targetLang) translatedAdminResponse = await translateStoryContent(ticket.admin_response, currentLanguage, responseLang);
                                }
                                setTranslationCache(prev => ({ ...prev, [cacheKey]: { subject: translatedSubject, message: translatedMessage, adminResponse: translatedAdminResponse } }));
                              } catch (error) { console.warn('Ошибка перевода тикета:', error); }
                            }
                            setResponseModal({ isOpen: true, ticketId: ticket.id, ticketNumber: ticket.ticket_number, userId: ticket.user_id, username: ticket.user_nickname || ticket.user_email, userEmail: ticket.user_email, subject: ticket.subject, message: ticket.message, translatedSubject, translatedMessage, translatedAdminResponse, response: ticket.admin_response || '', error: '' });
                          }}
                          className="action-button view-response"
                          title={ticket.admin_response ? t('viewResponse') || 'Просмотреть' : t('respondToTicket') || 'Ответить'}
                        >
                          <span className="material-icons">{ticket.admin_response ? 'visibility' : 'reply'}</span>
                        </button>
                        {ticket.status === 'pending' && (
                          <button onClick={() => handleCloseTicket(ticket)} className="action-button close-ticket" title={t('closeTicket') || 'Закрыть обращение'}>
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

      {/* Response modal */}
      {responseModal.isOpen && (
        <div className="modal-overlay" onClick={() => setResponseModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal response-modal large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><span className="material-icons">reply</span>{responseModal.response ? t('editResponse') || 'Редактировать ответ' : t('respondToTicket') || 'Ответить на обращение'}</h3>
              <button className="modal-close" onClick={() => setResponseModal(prev => ({ ...prev, isOpen: false }))}><span className="material-icons">close</span></button>
            </div>
            <div className="modal-body">
              <div className="ticket-info-section">
                <div className="ticket-header">
                  <div className="ticket-number-display"><strong>{t('ticketNumber') || '№ обращения'}:</strong> {responseModal.ticketNumber}</div>
                  <div className="ticket-user-info"><strong>{t('user') || 'Пользователь'}:</strong> {responseModal.username} ({responseModal.userEmail})</div>
                </div>
                <div className="form-group">
                  <label>{t('subject') || 'Тема'}:</label>
                  <div className="readonly-field">{responseModal.translatedSubject || responseModal.subject}</div>
                </div>
                <div className="form-group">
                  <label>{t('userMessage') || 'Сообщение пользователя'}:</label>
                  <div className="readonly-field message-field">{responseModal.translatedMessage || responseModal.message}</div>
                </div>
                {responseModal.translatedAdminResponse && (
                  <div className="form-group">
                    <label>{t('previousResponse') || 'Предыдущий ответ'}:</label>
                    <div className="readonly-field message-field readonly-field-highlight">{responseModal.translatedAdminResponse}</div>
                  </div>
                )}
                <div className="form-group">
                  <label>{t('yourResponse') || 'Ваш ответ'}:<span className="required-star">*</span></label>
                  <textarea value={responseModal.response} onChange={(e) => setResponseModal(prev => ({ ...prev, response: e.target.value }))}
                    placeholder={t('responsePlaceholder') || 'Введите ваш ответ пользователю...'} className="response-input" rows="6" maxLength="2000" />
                  <div className="character-counter">{responseModal.response.length}/2000 {t('characters') || 'символов'}</div>
                </div>
                {responseModal.error && <div className="form-error"><span className="material-icons">error</span>{responseModal.error}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setResponseModal(prev => ({ ...prev, isOpen: false }))}>{t('cancel') || 'Отмена'}</button>
              <button className="btn btn-primary" onClick={handleResponseSubmit}><span className="material-icons">send</span>{responseModal.response ? t('updateResponse') || 'Обновить' : t('sendResponse') || 'Отправить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportTab;
