import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translateStoryContent, detectTextLanguage } from '../../utils/translations';

const AdminReviewsTab = ({
  showSuccessModal,
  setConfirmModal,
  formatDate,
  formatCarbonSaved,
  getStatusColor,
}) => {
  const { t, currentLanguage } = useLanguage();

  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [storiesError, setStoriesError] = useState(null);
  const [storyStats, setStoryStats] = useState({ total: 0, published: 0, pending: 0, draft: 0 });
  const [categoryStats, setCategoryStats] = useState([]);
  const [storyFilters, setStoryFilters] = useState({ status: 'all', category: 'all', search: '' });
  const [storiesPagination, setStoriesPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [storyStatusDropdownOpen, setStoryStatusDropdownOpen] = useState(false);
  const [storyCategoryDropdownOpen, setStoryCategoryDropdownOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [translatedContent, setTranslatedContent] = useState({ title: '', content: '', isTranslating: false });
  const [storySortConfig, setStorySortConfig] = useState({ key: 'date', direction: 'desc' });

  const storyStatusOptions = useMemo(() => [
    { id: 'all', label: t('allStatuses') || 'Все статусы', value: 'all' },
    { id: 'draft', label: t('draft') || 'Черновик', value: 'draft' },
    { id: 'pending', label: t('pending') || 'На проверке', value: 'pending' },
    { id: 'published', label: t('published') || 'Опубликованные', value: 'published' },
  ], [t]);

  const getStoryStatusLabel = () => {
    const option = storyStatusOptions.find(opt => opt.value === storyFilters.status);
    return option ? option.label : storyStatusOptions[0].label;
  };

  const getStoryStatusBadgeLabel = (status) => {
    switch (status) {
      case 'published': return t('published') || 'Опубликовано';
      case 'pending': return t('pending') || 'На проверке';
      case 'draft': return t('draft') || 'Черновик';
      default: return status;
    }
  };

  const getTranslatedCategory = useCallback((category) => {
    const map = {
      'Транспорт': t('categoryTransport') || 'Транспорт', 'Transport': t('categoryTransport') || 'Транспорт',
      'Питание': t('categoryFood') || 'Питание', 'Food': t('categoryFood') || 'Питание',
      'Энергия': t('categoryEnergy') || 'Энергия', 'Energy': t('categoryEnergy') || 'Энергия',
      'Отходы': t('categoryWaste') || 'Отходы', 'Waste': t('categoryWaste') || 'Отходы',
      'Вода': t('categoryWater') || 'Вода', 'Water': t('categoryWater') || 'Вода',
      'Общее': t('categoryGeneral') || 'Общее', 'General': t('categoryGeneral') || 'Общее',
      'Потребление': t('categoryConsumption') || 'Потребление', 'Consumption': t('categoryConsumption') || 'Потребление',
      'Природа': t('categoryNature') || 'Природа', 'Nature': t('categoryNature') || 'Природа',
      'Быт': t('categoryHousehold') || 'Быт', 'Household': t('categoryHousehold') || 'Быт',
      'Планирование': t('categoryPlanning') || 'Планирование', 'Planning': t('categoryPlanning') || 'Планирование',
    };
    return map[category] || category;
  }, [t]);

  const getCategoryLabel = () => {
    if (storyFilters.category === 'all') return t('allCategories') || 'Все категории';
    const category = categoryStats.find(c => c.category === storyFilters.category);
    const translatedCategory = getTranslatedCategory(storyFilters.category);
    return category ? `${translatedCategory} (${category.count})` : translatedCategory;
  };

  const loadStoryStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stories/admin/stats', { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.stats) {
            setStoryStats({ total: data.stats.total_stories || 0, published: data.stats.published_stories || 0, pending: data.stats.pending_stories || 0, draft: data.stats.draft_stories || 0 });
          } else if (data.total !== undefined) {
            setStoryStats({ total: data.total || 0, published: data.published || 0, pending: data.pending || 0, draft: data.draft || 0 });
          }
        }
      }
    } catch (error) { console.error('Error loading story stats:', error); }
  }, []);

  const loadCategoryStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stories/admin/category-stats', { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.categories) setCategoryStats(data.categories);
        else setCategoryStats([]);
      } else { setCategoryStats([]); }
    } catch (error) { console.error('Error loading category stats:', error); setCategoryStats([]); }
  }, []);

  const tryAlternativeStoriesRoute = useCallback(async (filters, page) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: page.toString(), limit: storiesPagination.limit.toString() });
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      const response = await fetch(`/api/stories/admin/all?${params}`, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStories(data.stories || []);
          setStoriesPagination(prev => ({ ...prev, page, total: data.pagination?.total || 0, totalPages: data.pagination?.totalPages || 1 }));
        }
      }
    } catch (error) { console.error('Error in alternative stories route:', error); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storiesPagination.limit]);

  const loadStories = useCallback(async (customFilters = null, customPage = null) => {
    try {
      const token = localStorage.getItem('token');
      const filtersToUse = customFilters || storyFilters;
      const pageToUse = customPage || storiesPagination.page;
      const params = new URLSearchParams({ page: pageToUse.toString(), limit: storiesPagination.limit.toString() });
      if (filtersToUse.status !== 'all') params.append('status', filtersToUse.status);
      if (filtersToUse.category !== 'all') params.append('category', filtersToUse.category);
      if (filtersToUse.search) params.append('search', filtersToUse.search);
      const response = await fetch(`/api/stories/admin?${params}`, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStories(data.stories || []);
          setStoriesPagination(prev => ({ ...prev, page: pageToUse, total: data.pagination?.total || 0, totalPages: data.pagination?.totalPages || 1 }));
        } else { await tryAlternativeStoriesRoute(filtersToUse, pageToUse); }
      } else if (response.status === 404) { await tryAlternativeStoriesRoute(filtersToUse, pageToUse); }
    } catch (error) { console.error('Error loading stories:', error); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyFilters, storiesPagination.page, storiesPagination.limit, tryAlternativeStoriesRoute]);

  const loadStoriesData = useCallback(async () => {
    if (storiesLoading) return;
    setStoriesLoading(true);
    setStoriesError(null);
    try {
      await loadStoryStats();
      await loadCategoryStats();
      await loadStories();
    } catch (err) {
      setStoriesError(t('networkError') || 'Ошибка сети');
    } finally {
      setStoriesLoading(false);
    }
  }, [storiesLoading, loadStoryStats, loadCategoryStats, loadStories, t]);

  const handleStoryAction = useCallback(async (storyId, action) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/stories/admin/${storyId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          loadStoryStats();
          loadStories();
          const messages = { publish: t('storyPublished') || 'История опубликована', reject: t('storyRejected') || 'История отклонена', unpublish: t('storyUnpublished') || 'История снята с публикации' };
          showSuccessModal(t('success') || 'Успешно', messages[action] || t('operationCompleted') || 'Операция выполнена');
        }
      }
    } catch (error) { console.error('Error updating story status:', error); }
  }, [loadStoryStats, loadStories, showSuccessModal, t]);

  const handleStoryFilterChange = (type, value) => {
    const newFilters = { ...storyFilters, [type]: value };
    setStoryFilters(newFilters);
    setStoriesPagination(prev => ({ ...prev, page: 1 }));
    if (type === 'search') {
      setTimeout(() => { loadStoryStats(); loadStories(newFilters, 1); }, 300);
    } else {
      loadStoryStats();
      loadStories(newFilters, 1);
    }
  };

  const handleStoryClearFilters = () => {
    const cleared = { search: '', status: 'all', category: 'all' };
    setStoryFilters(cleared);
    setStoriesPagination(prev => ({ ...prev, page: 1 }));
    setStoryStatusDropdownOpen(false);
    setStoryCategoryDropdownOpen(false);
    loadStoryStats();
    loadStories(cleared, 1);
  };

  const handleStoryPageChange = (newPage) => {
    if (newPage < 1 || newPage > storiesPagination.totalPages || newPage === storiesPagination.page) return;
    setStoriesPagination(prev => ({ ...prev, page: newPage }));
    loadStories(null, newPage);
  };

  const handlePublishStory = (story) => {
    setConfirmModal({ isOpen: true, title: t('confirmPublish') || 'Опубликовать историю?',
      message: t('confirmPublishMessage', { title: story.title, author: story.user_nickname }) || `Опубликовать историю "${story.title}" от ${story.user_nickname}?`,
      onConfirm: () => handleStoryAction(story.id, 'publish') });
  };

  const handleRejectStory = (story) => {
    setConfirmModal({ isOpen: true, title: t('confirmReject') || 'Отклонить историю?',
      message: t('confirmRejectMessage', { title: story.title, author: story.user_nickname }) || `Отклонить историю "${story.title}" от ${story.user_nickname}?`,
      onConfirm: () => handleStoryAction(story.id, 'reject') });
  };

  const handleUnpublishStory = (story) => {
    setConfirmModal({ isOpen: true, title: t('confirmUnpublish') || 'Снять с публикации?',
      message: t('confirmUnpublishMessage', { title: story.title, author: story.user_nickname }) || `Снять с публикации историю "${story.title}" от ${story.user_nickname}? История будет перемещена в черновики.`,
      onConfirm: () => handleStoryAction(story.id, 'unpublish') });
  };

  const openStoryPreview = async (story) => {
    setSelectedStory(story);
    setPreviewModalOpen(true);
    setTranslatedContent({ title: '', content: '', isTranslating: false });
    if (currentLanguage !== 'ru' && story.content) {
      setTranslatedContent(prev => ({ ...prev, isTranslating: true }));
      try {
        const cacheKey = `admin_story_preview_${story.id}_${currentLanguage}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            if (cachedData.originalTitle === story.title && cachedData.originalContent === story.content) {
              setTranslatedContent({ title: cachedData.translatedTitle, content: cachedData.translatedContent, isTranslating: false });
              return;
            }
          } catch (e) { console.warn('Cache read error:', e); }
        }
        const titleLanguage = await detectTextLanguage(story.title);
        const contentLanguage = await detectTextLanguage(story.content);
        const targetLang = currentLanguage.toLowerCase();
        let translatedTitle = story.title;
        let translatedContentText = story.content;
        if (titleLanguage !== targetLang) { try { translatedTitle = await translateStoryContent(story.title, currentLanguage, titleLanguage); } catch { translatedTitle = story.title; } }
        if (contentLanguage !== targetLang) { try { translatedContentText = await translateStoryContent(story.content, currentLanguage, contentLanguage); } catch { translatedContentText = story.content; } }
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ originalTitle: story.title, originalContent: story.content, translatedTitle, translatedContent: translatedContentText })); } catch { /* ignore */ }
        setTranslatedContent({ title: translatedTitle, content: translatedContentText, isTranslating: false });
      } catch (error) {
        setTranslatedContent({ title: story.title, content: story.content, isTranslating: false });
      }
    }
  };

  const closeStoryPreview = () => {
    setPreviewModalOpen(false);
    setSelectedStory(null);
    setTranslatedContent({ title: '', content: '', isTranslating: false });
  };

  const handleStorySort = (key) => {
    setStorySortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const sortedStories = [...stories].sort((a, b) => {
    if (storySortConfig.key === 'date') {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return storySortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    }
    if (storySortConfig.key === 'carbon') {
      const carbonA = a.carbon_saved || 0;
      const carbonB = b.carbon_saved || 0;
      return storySortConfig.direction === 'asc' ? carbonA - carbonB : carbonB - carbonA;
    }
    return 0;
  });

  // Load on mount
  useEffect(() => {
    loadStoriesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (storyStatusDropdownOpen && !e.target.closest('.story-filter-dropdown')) setStoryStatusDropdownOpen(false);
      if (storyCategoryDropdownOpen && !e.target.closest('.story-filter-dropdown')) setStoryCategoryDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [storyStatusDropdownOpen, storyCategoryDropdownOpen]);

  const renderStoriesPagination = () => {
    if (storiesPagination.totalPages <= 1) return null;
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, storiesPagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(storiesPagination.totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) startPage = Math.max(1, endPage - maxVisiblePages + 1);
    pages.push(<button key="prev" onClick={() => handleStoryPageChange(storiesPagination.page - 1)} disabled={storiesPagination.page === 1 || storiesLoading} className="pagination-button"><span className="material-icons">chevron_left</span></button>);
    if (startPage > 1) { pages.push(<button key={1} onClick={() => handleStoryPageChange(1)} className={`pagination-button ${1 === storiesPagination.page ? 'active' : ''}`} disabled={storiesLoading}>1</button>); if (startPage > 2) pages.push(<span key="e1" className="pagination-ellipsis">...</span>); }
    for (let i = startPage; i <= endPage; i++) pages.push(<button key={i} onClick={() => handleStoryPageChange(i)} className={`pagination-button ${i === storiesPagination.page ? 'active' : ''}`} disabled={storiesLoading}>{i}</button>);
    if (endPage < storiesPagination.totalPages) { if (endPage < storiesPagination.totalPages - 1) pages.push(<span key="e2" className="pagination-ellipsis">...</span>); pages.push(<button key={storiesPagination.totalPages} onClick={() => handleStoryPageChange(storiesPagination.totalPages)} className={`pagination-button ${storiesPagination.totalPages === storiesPagination.page ? 'active' : ''}`} disabled={storiesLoading}>{storiesPagination.totalPages}</button>); }
    pages.push(<button key="next" onClick={() => handleStoryPageChange(storiesPagination.page + 1)} disabled={storiesPagination.page === storiesPagination.totalPages || storiesLoading} className="pagination-button"><span className="material-icons">chevron_right</span></button>);
    return (
      <div className="pagination-container">
        <div className="pagination-info">{t('showing') || 'Показано'}: <strong>{(storiesPagination.page - 1) * storiesPagination.limit + 1}-{Math.min(storiesPagination.page * storiesPagination.limit, storiesPagination.total)}</strong> {t('of') || 'из'} <strong>{storiesPagination.total}</strong></div>
        <div className="pagination-buttons">{pages}</div>
      </div>
    );
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>{t('manageReviews') || 'Управление историями'}</h2>
        <div className="section-actions">
          <button onClick={loadStoriesData} className="refresh-button" disabled={storiesLoading}>
            <span className="material-icons">refresh</span>
            {t('refresh') || 'Обновить'}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon stories"><span className="material-icons">history</span></div><div className="stat-info"><div className="stat-value">{storyStats.total || 0}</div><div className="stat-label">{t('totalStories') || 'Всего историй'}</div></div></div>
        <div className="stat-card"><div className="stat-icon published"><span className="material-icons">check_circle</span></div><div className="stat-info"><div className="stat-value">{storyStats.published || 0}</div><div className="stat-label">{t('published') || 'Опубликованные'}</div></div></div>
        <div className="stat-card"><div className="stat-icon pending-stories"><span className="material-icons">schedule</span></div><div className="stat-info"><div className="stat-value">{storyStats.pending || 0}</div><div className="stat-label">{t('pendingReview') || 'На проверке'}</div></div></div>
        <div className="stat-card"><div className="stat-icon draft"><span className="material-icons">description</span></div><div className="stat-info"><div className="stat-value">{storyStats.draft || 0}</div><div className="stat-label">{t('draft') || 'Черновики'}</div></div></div>
      </div>

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

      <div className="filters-panel">
        <div className="search-box">
          <input type="text" value={storyFilters.search} onChange={(e) => handleStoryFilterChange('search', e.target.value)}
            placeholder={t('searchStoriesPlaceholder') || 'Поиск по заголовку или автору...'} className="search-input" disabled={storiesLoading} />
          <button onClick={() => loadStories()} className="search-button" disabled={storiesLoading}><span className="material-icons">search</span></button>
        </div>
        <div className="filter-buttons">
          <div className="story-filter-dropdown admin-filter-dropdown">
            <div className={`admin-dropdown-trigger ${storyStatusDropdownOpen ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setStoryStatusDropdownOpen(!storyStatusDropdownOpen); setStoryCategoryDropdownOpen(false); }}>
              <span>{getStoryStatusLabel()}</span>
              <svg className={`admin-dropdown-arrow ${storyStatusDropdownOpen ? 'rotated' : ''}`} width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" fill="currentColor" />
              </svg>
            </div>
            {storyStatusDropdownOpen && (
              <div className="admin-dropdown-options">
                {storyStatusOptions.map((option) => (
                  <div key={option.id} className={`admin-dropdown-option ${storyFilters.status === option.value ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleStoryFilterChange('status', option.value); setStoryStatusDropdownOpen(false); }}>
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="story-filter-dropdown admin-filter-dropdown">
            <div className={`admin-dropdown-trigger ${storyCategoryDropdownOpen ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setStoryCategoryDropdownOpen(!storyCategoryDropdownOpen); setStoryStatusDropdownOpen(false); }}>
              <span>{getCategoryLabel()}</span>
              <svg className={`admin-dropdown-arrow ${storyCategoryDropdownOpen ? 'rotated' : ''}`} width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" fill="currentColor" />
              </svg>
            </div>
            {storyCategoryDropdownOpen && (
              <div className="admin-dropdown-options">
                <div className={`admin-dropdown-option ${storyFilters.category === 'all' ? 'selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleStoryFilterChange('category', 'all'); setStoryCategoryDropdownOpen(false); }}>
                  {t('allCategories') || 'Все категории'}
                </div>
                {categoryStats.map(category => (
                  <div key={category.category} className={`admin-dropdown-option ${storyFilters.category === category.category ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleStoryFilterChange('category', category.category); setStoryCategoryDropdownOpen(false); }}>
                    {getTranslatedCategory(category.category)} ({category.count})
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleStoryClearFilters} className="admin-clear-filters-button"
            disabled={storiesLoading || (!storyFilters.search && storyFilters.status === 'all' && storyFilters.category === 'all')}>
            <span className="material-icons">clear_all</span>
            {t('clearFilters') || 'Сбросить'}
          </button>
        </div>
      </div>

      {storiesLoading && stories.length === 0 ? (
        <div className="loading-container"><div className="loading-spinner"></div><p>{t('loadingStories') || 'Загрузка историй...'}</p></div>
      ) : storiesError ? (
        <div className="error-state">
          <span className="material-icons">error_outline</span><h3>{t('error') || 'Ошибка'}</h3><p>{storiesError}</p>
          <button onClick={loadStoriesData} className="retry-button"><span className="material-icons">refresh</span>{t('tryAgain') || 'Попробовать снова'}</button>
        </div>
      ) : stories.length === 0 ? (
        <div className="empty-state">
          <span className="material-icons">history</span>
          <h3>{t('noStoriesFound') || 'Истории не найдены'}</h3>
          <p>{storyFilters.search || storyFilters.status !== 'all' || storyFilters.category !== 'all' ? t('changeSearchParams') || 'Измените параметры поиска.' : t('noStoriesInSystem') || 'Нет историй в системе.'}</p>
          {(storyFilters.search || storyFilters.status !== 'all' || storyFilters.category !== 'all') && (
            <button onClick={handleStoryClearFilters} className="retry-button">{t('showAllStories') || 'Показать все истории'}</button>
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
                  <th onClick={() => handleStorySort('carbon')} className="sortable">
                    {t('carbonSaved') || 'CO₂ сохранено'} {storySortConfig.key === 'carbon' && <span className="sort-icon">{storySortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                  <th>{t('status') || 'Статус'}</th>
                  <th onClick={() => handleStorySort('date')} className="sortable">
                    {t('createdAt') || 'Дата'} {storySortConfig.key === 'date' && <span className="sort-icon">{storySortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                  <th>{t('actions') || 'Действия'}</th>
                </tr>
              </thead>
              <tbody>
                {sortedStories.map(story => (
                  <tr key={story.id} className={`story-row ${story.status}`}>
                    <td className="story-title" title={story.title}>{story.title}</td>
                    <td className="story-author">
                      <div className="author-info">
                        <div className="author-name">{story.user_nickname}</div>
                        <div className="story-likes"><span className="material-icons">favorite</span>{story.likes_count || 0}</div>
                      </div>
                    </td>
                    <td className="story-category"><span className="category-badge">{getTranslatedCategory(story.category)}</span></td>
                    <td className="story-carbon">{story.carbon_saved ? formatCarbonSaved(story.carbon_saved) : '—'}</td>
                    <td className="story-status"><span className="status-badge" style={{ backgroundColor: getStatusColor(story.status) }}>{getStoryStatusBadgeLabel(story.status)}</span></td>
                    <td className="story-date">{formatDate(story.created_at)}</td>
                    <td className="story-actions">
                      <div className="action-buttons">
                        <button onClick={() => openStoryPreview(story)} className="action-button preview" title={t('previewStory') || 'Просмотреть историю'}><span className="material-icons">visibility</span></button>
                        {story.status === 'pending' && (<>
                          <button onClick={() => handlePublishStory(story)} className="action-button publish" title={t('publishStory') || 'Опубликовать'}><span className="material-icons">check_circle</span></button>
                          <button onClick={() => handleRejectStory(story)} className="action-button reject" title={t('rejectStory') || 'Отклонить'}><span className="material-icons">cancel</span></button>
                        </>)}
                        {story.status === 'draft' && (<button onClick={() => handlePublishStory(story)} className="action-button publish" title={t('publishStory') || 'Опубликовать'}><span className="material-icons">publish</span></button>)}
                        {story.status === 'published' && (<button onClick={() => handleUnpublishStory(story)} className="action-button unpublish" title={t('unpublishStory') || 'Снять с публикации'}><span className="material-icons">unpublished</span></button>)}
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

      {/* Story preview modal */}
      {previewModalOpen && selectedStory && (
        <div className="modal-overlay" onClick={closeStoryPreview}>
          <div className="modal story-preview-modal large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><span className="material-icons">visibility</span>{t('storyPreview') || 'Предпросмотр истории'}</h3>
              <button className="modal-close" onClick={closeStoryPreview}><span className="material-icons">close</span></button>
            </div>
            <div className="modal-body">
              <div className="story-preview-content">
                <div className="story-preview-header">
                  <h2 className="story-preview-title">{currentLanguage !== 'ru' && translatedContent.title ? translatedContent.title : selectedStory.title}</h2>
                  <div className="story-preview-meta">
                    <div className="story-author-preview"><span className="material-icons">person</span>{selectedStory.user_nickname}</div>
                    <div className="story-category-preview"><span className="material-icons">category</span>{getTranslatedCategory(selectedStory.category)}</div>
                    <div className="story-date-preview"><span className="material-icons">calendar_today</span>{formatDate(selectedStory.created_at)}</div>
                    {selectedStory.carbon_saved && (<div className="story-carbon-preview"><span className="material-icons">eco</span>{formatCarbonSaved(selectedStory.carbon_saved)} {t('carbonSaved') || 'CO₂ сохранено'}</div>)}
                  </div>
                </div>
                <div className="story-preview-body">
                  <div className="story-content-preview">
                    {translatedContent.isTranslating ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}><div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>{t('translating') || 'Перевод...'}</div>
                    ) : (currentLanguage !== 'ru' && translatedContent.content ? translatedContent.content : selectedStory.content)}
                  </div>
                </div>
                <div className="story-preview-footer">
                  <div className="story-stats-preview">
                    <div className="story-likes-preview">{selectedStory.likes_count || 0} {t('likes') || 'лайков'}</div>
                    <div className="story-status-preview"><span className="status-badge" style={{ backgroundColor: getStatusColor(selectedStory.status) }}>{getStoryStatusBadgeLabel(selectedStory.status)}</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeStoryPreview}>{t('close') || 'Закрыть'}</button>
              {selectedStory.status === 'pending' && (<>
                <button className="btn btn-danger" onClick={() => { closeStoryPreview(); handleRejectStory(selectedStory); }}><span className="material-icons">cancel</span>{t('rejectStory') || 'Отклонить'}</button>
                <button className="btn btn-success" onClick={() => { closeStoryPreview(); handlePublishStory(selectedStory); }}><span className="material-icons">check_circle</span>{t('publishStory') || 'Опубликовать'}</button>
              </>)}
              {selectedStory.status === 'published' && (<button className="btn btn-warning" onClick={() => { closeStoryPreview(); handleUnpublishStory(selectedStory); }}><span className="material-icons">unpublished</span>{t('unpublishStory') || 'Снять с публикации'}</button>)}
              {selectedStory.status === 'draft' && (<button className="btn btn-success" onClick={() => { closeStoryPreview(); handlePublishStory(selectedStory); }}><span className="material-icons">publish</span>{t('publishStory') || 'Опубликовать'}</button>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsTab;
