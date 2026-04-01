import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { exportAllReports } from '../../utils/excelExport';

const AdminReportsTab = ({
  showSuccessModal,
  setConfirmModal,
}) => {
  const { t } = useLanguage();

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState(null);
  const [reportsFilters, setReportsFilters] = useState({ search: '', status: 'all' });
  const [reportsPagination, setReportsPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [reportsSortConfig, setReportsSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [reportsStatusDropdownOpen, setReportsStatusDropdownOpen] = useState(false);
  const [reportDetailsModal, setReportDetailsModal] = useState({ isOpen: false, report: null, adminResponse: '', responseError: false });
  const [screenshotPreviewModal, setScreenshotPreviewModal] = useState({ isOpen: false, imageUrl: '', imageName: '' });

  const filtersRef = useRef(reportsFilters);
  filtersRef.current = reportsFilters;

  const reportsLoadingRef = useRef(reportsLoading);
  reportsLoadingRef.current = reportsLoading;

  const statusOptions = [
    { id: 'all', value: 'all', label: t('allStatuses') || 'Все статусы' },
    { id: 'pending', value: 'pending', label: t('pending') || 'Ожидает' },
    { id: 'reviewing', value: 'reviewing', label: t('reviewing') || 'На рассмотрении' },
    { id: 'resolved', value: 'resolved', label: t('resolved') || 'Решено' },
    { id: 'rejected', value: 'rejected', label: t('rejected') || 'Отклонено' },
  ];

  const getStatusLabel = () => {
    const option = statusOptions.find(opt => opt.value === reportsFilters.status);
    return option ? option.label : t('allStatuses') || 'Все статусы';
  };

  const handleSort = (key) => {
    setReportsSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const sortedReports = [...reports].sort((a, b) => {
    if (reportsSortConfig.key === 'id') return reportsSortConfig.direction === 'asc' ? a.id - b.id : b.id - a.id;
    return 0;
  });

  const loadReports = useCallback(async (filters = reportsFilters, page = 1, force = false) => {
    if (!force && reportsLoadingRef.current) return;
    setReportsLoading(true);
    setReportsError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { setReportsError('Токен не найден'); setReportsLoading(false); return; }
      const params = new URLSearchParams({ page: page.toString(), limit: reportsPagination.limit.toString(), status: filters.status, search: filters.search });
      const response = await fetch(`/api/reports/admin?${params}`, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      if (data.success) {
        setReports(data.reports);
        setReportsPagination(data.pagination);
      } else {
        setReportsError(data.error || 'Ошибка загрузки жалоб');
      }
    } catch (error) {
      setReportsError('Ошибка загрузки жалоб');
    } finally {
      setReportsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportsPagination.limit]);

  const handleReportStatusChange = async (reportId, newStatus, adminResponse = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, admin_response: adminResponse })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) {
        loadReports();
        showSuccessModal(t('success') || 'Успешно', t('reportStatusUpdated') || 'Статус жалобы обновлён');
      }
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  // Load on mount
  useEffect(() => {
    loadReports({ search: '', status: 'all' }, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadReports(reportsFilters, 1);
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportsFilters.search, reportsFilters.status]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (reportsStatusDropdownOpen && !e.target.closest('.admin-filter-dropdown')) setReportsStatusDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [reportsStatusDropdownOpen]);

  const totalReports = reports.length;
  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const reviewingReports = reports.filter(r => r.status === 'reviewing').length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>{t('manageReports') || 'Жалобы пользователей'}</h2>
        <div className="section-actions">
          <button className="refresh-button" onClick={() => loadReports(reportsFilters, 1)} disabled={reportsLoading}>
            <span className="material-icons">refresh</span>
            {t('refresh') || 'Обновить'}
          </button>
          <button
            onClick={async () => {
              try { const result = await exportAllReports(t); if (!result.success) console.error('Export error:', result.error); }
              catch (error) { console.error('Export error:', error.message); }
            }}
            className="export-button" disabled={reportsLoading} title={t('exportToExcel') || 'Экспорт в Excel (все жалобы)'}
          >
            <span className="material-icons">download</span>
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon reports-all"><span className="material-icons">report</span></div><div className="stat-info"><div className="stat-value">{totalReports}</div><div className="stat-label">{t('allReports') || 'Все жалобы'}</div></div></div>
        <div className="stat-card"><div className="stat-icon pending"><span className="material-icons">pending</span></div><div className="stat-info"><div className="stat-value">{pendingReports}</div><div className="stat-label">{t('pending') || 'Ожидает'}</div></div></div>
        <div className="stat-card"><div className="stat-icon reviewing"><span className="material-icons">rate_review</span></div><div className="stat-info"><div className="stat-value">{reviewingReports}</div><div className="stat-label">{t('reviewing') || 'На рассмотрении'}</div></div></div>
        <div className="stat-card"><div className="stat-icon resolved"><span className="material-icons">check_circle</span></div><div className="stat-info"><div className="stat-value">{resolvedReports}</div><div className="stat-label">{t('resolved') || 'Решено'}</div></div></div>
      </div>

      <div className="filters-panel">
        <div className="search-box">
          <input type="text" value={reportsFilters.search} onChange={(e) => setReportsFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder={t('searchReports') || 'Поиск по жалобам...'} className="search-input" disabled={reportsLoading} />
          <button className="search-button" disabled={reportsLoading}><span className="material-icons">search</span></button>
        </div>
        <div className="filter-buttons">
          <div className="admin-filter-dropdown">
            <div className={`admin-dropdown-trigger ${reportsStatusDropdownOpen ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setReportsStatusDropdownOpen(!reportsStatusDropdownOpen); }}>
              <span>{getStatusLabel()}</span>
              <svg className={`admin-dropdown-arrow ${reportsStatusDropdownOpen ? 'rotated' : ''}`} width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" fill="currentColor" />
              </svg>
            </div>
            {reportsStatusDropdownOpen && (
              <div className="admin-dropdown-options">
                {statusOptions.map((option) => (
                  <div key={option.id} className={`admin-dropdown-option ${reportsFilters.status === option.value ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setReportsFilters(prev => ({ ...prev, status: option.value })); setReportsStatusDropdownOpen(false); }}>
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="admin-clear-filters-button"
            onClick={() => { setReportsFilters({ search: '', status: 'all' }); setReportsSortConfig({ key: 'id', direction: 'asc' }); }}
            disabled={reportsFilters.search === '' && reportsFilters.status === 'all'}>
            <span className="material-icons">clear_all</span>
            {t('clearFilters') || 'Сбросить фильтры'}
          </button>
        </div>
      </div>

      {reportsLoading && reports.length === 0 ? (
        <div className="loading-state"><div className="loading-spinner"></div><p>{t('loading') || 'Загрузка...'}</p></div>
      ) : reportsError ? (
        <div className="error-state">
          <span className="material-icons">error</span><p>{reportsError}</p>
          <button onClick={() => loadReports(reportsFilters, 1)} className="retry-button"><span className="material-icons">refresh</span>{t('retry') || 'Повторить'}</button>
        </div>
      ) : reports.length === 0 ? (
        <div className="empty-state"><span className="material-icons">report</span><p>{t('noReports') || 'Жалоб нет'}</p></div>
      ) : (
        <>
          <div className="reports-table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th style={{ width: '60px', cursor: 'pointer' }} onClick={() => handleSort('id')} className="sortable">
                    ID {reportsSortConfig.key === 'id' && <span className="sort-icon">{reportsSortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
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
                    <td><div className="report-user-cell"><div className="report-user-name">{report.reporter_nickname}</div><div className="report-user-email">{report.reporter_email}</div></div></td>
                    <td><div className="report-user-cell"><div className="report-user-name">{report.reported_nickname}</div><div className="report-user-email">{report.reported_email}</div></div></td>
                    <td><div className="report-reason-cell">{report.reason}</div></td>
                    <td>
                      <span className={`report-status-badge status-${report.status}`}>
                        {report.status === 'pending' ? t('pending') || 'Ожидает' : report.status === 'reviewing' ? t('reviewing') || 'На рассмотрении' : report.status === 'resolved' ? t('resolved') || 'Решено' : t('rejected') || 'Отклонено'}
                      </span>
                    </td>
                    <td className="report-date">{new Date(report.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="report-actions">
                        <button className="report-action-btn view" title={t('viewDetails') || 'Просмотр'}
                          onClick={() => setReportDetailsModal({ isOpen: true, report: report, adminResponse: report.admin_response || '', responseError: false })}>
                          <span className="material-icons">visibility</span>
                        </button>
                        {report.status === 'pending' && (
                          <button className="report-action-btn start-review" title={t('startReview') || 'Начать рассмотрение'}
                            onClick={() => handleReportStatusChange(report.id, 'reviewing')}>
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
              <button onClick={() => loadReports(reportsFilters, reportsPagination.page - 1)} disabled={reportsPagination.page === 1} className="pagination-button"><span className="material-icons">chevron_left</span></button>
              <span className="pagination-info">{t('page') || 'Страница'} {reportsPagination.page} {t('of') || 'из'} {reportsPagination.totalPages}</span>
              <button onClick={() => loadReports(reportsFilters, reportsPagination.page + 1)} disabled={reportsPagination.page === reportsPagination.totalPages} className="pagination-button"><span className="material-icons">chevron_right</span></button>
            </div>
          )}
        </>
      )}

      {/* Report details modal */}
      {reportDetailsModal.isOpen && reportDetailsModal.report && (
        <div className="modal-overlay" onClick={() => setReportDetailsModal({ isOpen: false, report: null, adminResponse: '', responseError: false })}>
          <div className="modal report-details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><span className="material-icons">report</span>{t('reportDetails') || 'Детали жалобы'} #{reportDetailsModal.report.id}</h3>
              <button className="modal-close" onClick={() => setReportDetailsModal({ isOpen: false, report: null, adminResponse: '', responseError: false })}><span className="material-icons">close</span></button>
            </div>
            <div className="modal-body">
              <div className="report-detail-section"><h4>{t('reporter') || 'Отправитель'}</h4><div className="report-user-info"><div className="report-user-name">{reportDetailsModal.report.reporter_nickname}</div><div className="report-user-email">{reportDetailsModal.report.reporter_email}</div></div></div>
              <div className="report-detail-section"><h4>{t('reportedUser') || 'На пользователя'}</h4><div className="report-user-info"><div className="report-user-name">{reportDetailsModal.report.reported_nickname}</div><div className="report-user-email">{reportDetailsModal.report.reported_email}</div></div></div>
              <div className="report-detail-section"><h4>{t('reason') || 'Причина'}</h4><p className="report-detail-text">{reportDetailsModal.report.reason}</p></div>
              {reportDetailsModal.report.description && (<div className="report-detail-section"><h4>{t('description') || 'Описание'}</h4><p className="report-detail-text">{reportDetailsModal.report.description}</p></div>)}
              {reportDetailsModal.report.screenshots && reportDetailsModal.report.screenshots.length > 0 && (
                <div className="report-detail-section">
                  <h4>{t('screenshots') || 'Скриншоты'} ({reportDetailsModal.report.screenshots.length})</h4>
                  <div className="report-screenshots-grid">
                    {reportDetailsModal.report.screenshots.map((screenshot, index) => (
                      <div key={index} className="report-screenshot-item" onClick={() => setScreenshotPreviewModal({ isOpen: true, imageUrl: screenshot, imageName: `${t('screenshot') || 'Скриншот'} ${index + 1}` })}>
                        <img src={screenshot} alt={`Screenshot ${index + 1}`} className="report-screenshot-thumb" />
                        <div className="report-screenshot-overlay"><span className="material-icons">zoom_in</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="report-detail-section">
                <h4>{t('currentStatus') || 'Текущий статус'}</h4>
                <span className={`report-status-badge status-${reportDetailsModal.report.status}`}>
                  {reportDetailsModal.report.status === 'pending' ? t('pending') || 'Ожидает' : reportDetailsModal.report.status === 'reviewing' ? t('reviewing') || 'На рассмотрении' : reportDetailsModal.report.status === 'resolved' ? t('resolved') || 'Решено' : t('rejected') || 'Отклонено'}
                </span>
              </div>
              <div className="report-detail-section"><h4>{t('date') || 'Дата'}</h4><p className="report-detail-text">{new Date(reportDetailsModal.report.created_at).toLocaleString()}</p></div>
              {(reportDetailsModal.report.status === 'reviewing' || reportDetailsModal.report.status === 'resolved' || reportDetailsModal.report.status === 'rejected') && (
                <div className="report-detail-section">
                  <h4>{t('adminResponse') || 'Ответ администратора'}</h4>
                  {reportDetailsModal.report.admin_response ? (
                    <div className="admin-response-display"><p className="report-detail-text admin-response-text">{reportDetailsModal.report.admin_response}</p></div>
                  ) : (
                    <>
                      <textarea className={`admin-response-input ${reportDetailsModal.responseError ? 'error' : ''}`}
                        placeholder={t('adminResponsePlaceholder') || 'Введите ответ пользователю...'}
                        value={reportDetailsModal.adminResponse}
                        onChange={(e) => setReportDetailsModal(prev => ({ ...prev, adminResponse: e.target.value, responseError: false }))}
                        rows={5} />
                      {reportDetailsModal.responseError && (<p className="validation-error">{t('adminResponseRequired') || 'Пожалуйста, введите ответ пользователю'}</p>)}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              {reportDetailsModal.report.status === 'reviewing' && !reportDetailsModal.report.admin_response && (<>
                <button className="btn btn-success" onClick={() => {
                  if (!reportDetailsModal.adminResponse.trim()) { setReportDetailsModal(prev => ({ ...prev, responseError: true })); return; }
                  handleReportStatusChange(reportDetailsModal.report.id, 'resolved', reportDetailsModal.adminResponse);
                  setReportDetailsModal({ isOpen: false, report: null, adminResponse: '', responseError: false });
                }}><span className="material-icons">check_circle</span>{t('resolve') || 'Решить'}</button>
                <button className="btn btn-danger" onClick={() => {
                  if (!reportDetailsModal.adminResponse.trim()) { setReportDetailsModal(prev => ({ ...prev, responseError: true })); return; }
                  handleReportStatusChange(reportDetailsModal.report.id, 'rejected', reportDetailsModal.adminResponse);
                  setReportDetailsModal({ isOpen: false, report: null, adminResponse: '', responseError: false });
                }}><span className="material-icons">close</span>{t('reject') || 'Отклонить'}</button>
              </>)}
              <button className="btn btn-secondary" onClick={() => setReportDetailsModal({ isOpen: false, report: null, adminResponse: '', responseError: false })}>{t('close') || 'Закрыть'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot preview modal */}
      {screenshotPreviewModal.isOpen && (
        <div className="modal-overlay" onClick={() => setScreenshotPreviewModal({ isOpen: false, imageUrl: '', imageName: '' })}>
          <div className="screenshot-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="screenshot-preview-header">
              <h3>{screenshotPreviewModal.imageName}</h3>
              <button className="modal-close" onClick={() => setScreenshotPreviewModal({ isOpen: false, imageUrl: '', imageName: '' })}><span className="material-icons">close</span></button>
            </div>
            <div className="screenshot-preview-body">
              <img src={screenshotPreviewModal.imageUrl} alt={screenshotPreviewModal.imageName} className="screenshot-preview-image" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsTab;
