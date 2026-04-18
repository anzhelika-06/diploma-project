import { useState, useEffect, useCallback, useRef } from 'react';
import { Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../../contexts/LanguageContext';
import ecoinsImage from '../../assets/images/ecoins.png';
import LocalizedMap from '../../components/LocalizedMap';
import MarkerCluster from '../../components/MarkerCluster';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const treeIcon = new L.DivIcon({
  html: `<div class="tree-marker-pin">
    <svg viewBox="0 0 32 40" width="32" height="40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="tg1" cx="38%" cy="32%"><stop offset="0%" stop-color="#b9f6ca"/><stop offset="100%" stop-color="#1b5e20"/></radialGradient>
        <radialGradient id="tg2" cx="38%" cy="32%"><stop offset="0%" stop-color="#69f0ae"/><stop offset="100%" stop-color="#2e7d32"/></radialGradient>
        <radialGradient id="tg3" cx="38%" cy="32%"><stop offset="0%" stop-color="#ccff90"/><stop offset="100%" stop-color="#558b2f"/></radialGradient>
        <linearGradient id="tk" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#795548"/><stop offset="100%" stop-color="#3e2723"/></linearGradient>
        <filter id="ts"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#1b5e20" flood-opacity="0.4"/></filter>
      </defs>
      <g filter="url(#ts)">
        <ellipse cx="16" cy="15" rx="13" ry="13" fill="url(#tg1)"/>
        <ellipse cx="16" cy="11" rx="10" ry="10" fill="url(#tg2)"/>
        <ellipse cx="16" cy="7"  rx="7"  ry="7"  fill="url(#tg3)"/>
        <ellipse cx="11" cy="6"  rx="3"  ry="3"  fill="#f1f8e9" opacity="0.45"/>
        <rect x="13" y="24" width="6" height="12" rx="2" fill="url(#tk)"/>
        <ellipse cx="16" cy="36" rx="5" ry="2" fill="#3e2723" opacity="0.2"/>
      </g>
    </svg>
  </div>`,
  className: 'tree-marker-wrap',
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
});

const pendingIcon = new L.DivIcon({
  html: `<div class="tree-marker-pin pending">
    <svg viewBox="0 0 32 40" width="28" height="34" xmlns="http://www.w3.org/2000/svg" style="opacity:0.75">
      <defs>
        <radialGradient id="pg1" cx="38%" cy="32%"><stop offset="0%" stop-color="#f0f4c3"/><stop offset="100%" stop-color="#9e9d24"/></radialGradient>
        <radialGradient id="pg2" cx="38%" cy="32%"><stop offset="0%" stop-color="#f9fbe7"/><stop offset="100%" stop-color="#c6ca53"/></radialGradient>
        <linearGradient id="pk" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#bcaaa4"/><stop offset="100%" stop-color="#8d6e63"/></linearGradient>
      </defs>
      <ellipse cx="16" cy="15" rx="12" ry="12" fill="url(#pg1)"/>
      <ellipse cx="16" cy="11" rx="9"  ry="9"  fill="url(#pg2)"/>
      <rect x="13" y="24" width="6" height="10" rx="2" fill="url(#pk)"/>
    </svg>
  </div>`,
  className: 'tree-marker-wrap',
  iconSize: [28, 34],
  iconAnchor: [14, 34],
  popupAnchor: [0, -34],
});

// Компонент для программного приближения к точке
function FlyToMarker({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 14, { duration: 1.2 });
  }, [map, position]);
  return null;
}

function MapClickHandler({ onPick }) {
  useMapEvents({ click: e => onPick(e.latlng) });
  return null;

}

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const AdminFundsTab = ({ showSuccessModal, setConfirmModal }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [requests, setRequests] = useState([]);
  const [allMarkers, setAllMarkers] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: 'pending' });
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  // Multiple markers: [{ lat, lng, photo_url, photoPreview, note }]
  const [pendingMarkers, setPendingMarkers] = useState([]);
  const [activeMarkerIdx, setActiveMarkerIdx] = useState(0); // which marker is being edited
  const [planting, setPlanting] = useState(false);
  const [mapView, setMapView] = useState('requests');
  const [msg, setMsg] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, planted: 0 });
  const [zoomedPhoto, setZoomedPhoto] = useState(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [flyTo, setFlyTo] = useState(null);

  const statusOptions = [
    { id: 'pending', value: 'pending', label: t('fundsPending') || 'Ожидают' },
    { id: 'planted', value: 'planted', label: t('fundsPlanted') || 'Посажены' },
    { id: 'all', value: 'all', label: t('fundsAll') || 'Все' },
  ];

  const viewOptions = [
    { id: 'requests', label: t('fundsRequests') || 'Запросы' },
    { id: 'all', label: t('fundsAllMarkers') || 'Все метки' },
  ];

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trees/admin/requests?status=${filters.status}`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setRequests(data.requests);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filters.status]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/trees/admin/requests?status=all', { headers: authHeader() });
      const data = await res.json();
      if (data.success) {
        const all = data.requests;
        setStats({
          total: all.reduce((s, r) => s + r.trees_count, 0),
          pending: all.filter(r => r.status === 'pending').length,
          planted: all.filter(r => r.status === 'planted').reduce((s, r) => s + r.trees_count, 0),
        });
      }
    } catch (e) { console.error(e); }
  }, []);

  const loadAllMarkers = useCallback(async () => {
    try {
      const res = await fetch('/api/trees/markers', { headers: authHeader() });
      const data = await res.json();
      if (data.success) setAllMarkers(data.markers);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadRequests(); loadStats(); }, [loadRequests, loadStats]);
  useEffect(() => { if (mapView === 'all') loadAllMarkers(); }, [mapView, loadAllMarkers]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownOpen && !e.target.closest('.admin-filter-dropdown')) setStatusDropdownOpen(false);
      if (viewDropdownOpen && !e.target.closest('.funds-view-dropdown')) setViewDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [statusDropdownOpen, viewDropdownOpen]);

  const getStatusLabel = () => {
    const option = statusOptions.find(opt => opt.value === filters.status);
    return option ? option.label : statusOptions[0].label;
  };

  const getViewLabel = () => {
    const option = viewOptions.find(opt => opt.id === mapView);
    return option ? option.label : viewOptions[0].label;
  };

  // Filter requests by search
  const filteredRequests = requests.filter(req => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      req.nickname?.toLowerCase().includes(searchLower) ||
      req.email?.toLowerCase().includes(searchLower) ||
      req.id?.toString().includes(searchLower)
    );
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setPendingMarkers(prev => prev.map((m, i) =>
        i === activeMarkerIdx ? { ...m, photo_url: ev.target.result, photoPreview: ev.target.result } : m
      ));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleMapClick = (latlng) => {
    if (!selectedRequest || selectedRequest.status !== 'pending') return;
    if (pendingMarkers.length >= 5) return;
    setPendingMarkers(prev => [...prev, { lat: latlng.lat, lng: latlng.lng, photo_url: null, photoPreview: null, note: '' }]);
    setActiveMarkerIdx(pendingMarkers.length);
  };

  const removeMarker = (idx) => {
    setPendingMarkers(prev => prev.filter((_, i) => i !== idx));
    setActiveMarkerIdx(prev => Math.max(0, prev > idx ? prev - 1 : prev));
  };

  const handlePlant = async () => {
    if (!selectedRequest || pendingMarkers.length === 0) return;
    // Validate all have photos
    const missing = pendingMarkers.findIndex(m => !m.photo_url);
    if (missing !== -1) {
      setMsg({ text: t('fundsPhotoRequired') || 'Прикрепите фото для каждой метки', type: 'error' });
      setActiveMarkerIdx(missing);
      setTimeout(() => setMsg(null), 4000);
      return;
    }
    setPlanting(true);
    try {
      const res = await fetch('/api/trees/admin/plant', {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          markers: pendingMarkers.map(m => ({ lat: m.lat, lng: m.lng, photo_url: m.photo_url, note: m.note || null })),
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: t('fundsPlantSuccess') || 'Деревья посажены!', type: 'success' });
        setSelectedRequest(null);
        setPendingMarkers([]);
        setActiveMarkerIdx(0);
        loadRequests(); loadStats();
      } else {
        setMsg({ text: data.message, type: 'error' });
      }
    } catch { setMsg({ text: 'Ошибка', type: 'error' }); }
    setPlanting(false);
    setTimeout(() => setMsg(null), 4000);
  };

  const formatDate = d => d ? new Date(d).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '—';

  return (
    <div className="admin-section">
      
      {/* Header */}
      <div className="section-header">
        <h2>{t('adminFundsTitle') || 'Управление фондами'}</h2>
        <div className="section-actions">
          <button className="refresh-button" onClick={() => { loadRequests(); loadStats(); }} disabled={loading}>
            <span className="material-icons">refresh</span>
            {t('refresh') || 'Обновить'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(76,175,80,0.1)',color:'#2e7d32'}}>
            <span className="material-icons">park</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.planted}</div>
            <div className="stat-label">{t('fundsPlanted') || 'Посажено'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(255,152,0,0.1)',color:'#e65100'}}>
            <span className="material-icons">hourglass_empty</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">{t('fundsPending') || 'Ожидают'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(33,150,243,0.1)',color:'#1565c0'}}>
            <span className="material-icons">forest</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">{t('fundsTotalTrees') || 'Всего деревьев'}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-panel">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('searchUsersPlaceholder') || 'Поиск по никнейму...'}
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="search-input"
          />
          <button className="search-button"><span className="material-icons">search</span></button>
        </div>

        <div className="filter-buttons">
          {/* View dropdown */}
          <div className="admin-filter-dropdown funds-view-dropdown">
            <div
              className={`admin-dropdown-trigger${viewDropdownOpen ? ' active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setViewDropdownOpen(!viewDropdownOpen); }}
            >
              <span>{getViewLabel()}</span>
              <svg className={`admin-dropdown-arrow${viewDropdownOpen ? ' rotated' : ''}`} width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" fill="currentColor"/>
              </svg>
            </div>
            {viewDropdownOpen && (
              <div className="admin-dropdown-options">
                {viewOptions.map(opt => (
                  <div key={opt.id}
                    className={`admin-dropdown-option${mapView === opt.id ? ' selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setMapView(opt.id); setViewDropdownOpen(false); setSelectedRequest(null); }}
                  >{opt.label}</div>
                ))}
              </div>
            )}
          </div>

          {/* Status dropdown */}
          {mapView === 'requests' && (
            <div className="admin-filter-dropdown">
              <div
                className={`admin-dropdown-trigger${statusDropdownOpen ? ' active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setStatusDropdownOpen(!statusDropdownOpen); }}
              >
                <span>{getStatusLabel()}</span>
                <svg className={`admin-dropdown-arrow${statusDropdownOpen ? ' rotated' : ''}`} width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" fill="currentColor"/>
                </svg>
              </div>
              {statusDropdownOpen && (
                <div className="admin-dropdown-options">
                  {statusOptions.map(opt => (
                    <div key={opt.id}
                      className={`admin-dropdown-option${filters.status === opt.value ? ' selected' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setFilters(prev => ({ ...prev, status: opt.value })); setStatusDropdownOpen(false); setSelectedRequest(null); }}
                    >{opt.label}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button className="admin-clear-filters-button"
            onClick={() => { setFilters({ search: '', status: 'pending' }); setSelectedRequest(null); }}
            disabled={filters.search === '' && filters.status === 'pending'}>
            <span className="material-icons">clear_all</span>
            {t('clearFilters') || 'Сбросить'}
          </button>
        </div>
      </div>

      {msg && <div className={`admin-message ${msg.type}`}>{msg.text}</div>}

      {/* Requests view */}
      {mapView === 'requests' && (
        <>
          {/* Requests list */}
          {loading ? (
            <div className="loading-state">
              <span className="material-icons spinning">refresh</span>
              <p>{t('loading') || 'Загрузка...'}</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="empty-state">
              <span className="material-icons">inbox</span>
              <p>{t('noRequests') || 'Нет запросов'}</p>
            </div>
          ) : (
            <div className="funds-table-container">
              <table className="funds-table">
                <thead>
                  <tr>
                    <th style={{width:'60px'}}>ID</th>
                    <th>{t('user') || 'Пользователь'}</th>
                    <th style={{width:'90px'}}>{t('treesPlanted') || 'Деревья'}</th>
                    <th style={{width:'90px'}}>{t('ecoCoinsShort') || 'Экоины'}</th>
                    <th style={{width:'130px'}}>{t('date') || 'Дата'}</th>
                    <th style={{width:'110px'}}>{t('status') || 'Статус'}</th>
                    <th style={{width:'70px'}}>{t('actions') || 'Действия'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(req => (
                    <tr key={req.id}>
                      <td style={{fontFamily:'monospace',color:'#6c757d',fontSize:'13px'}}>#{req.id}</td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:'18px'}}>{req.avatar_emoji}</span>
                          <span style={{fontWeight:500}}>{req.nickname}</span>
                        </div>
                      </td>
                      <td>{req.trees_count}</td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:4}}>
                          {req.coins_spent}
                          <img src={ecoinsImage} alt="" style={{width:14,height:14}} />
                        </div>
                      </td>
                      <td style={{fontSize:'13px',whiteSpace:'nowrap'}}>{formatDate(req.created_at)}</td>
                      <td>
                        <span className={`report-status-badge status-${req.status === 'planted' ? 'resolved' : 'pending'}`}>
                          {req.status === 'pending' ? t('statusPendingTree') || 'Ожидает' : t('statusPlanted') || 'Посажено'}
                        </span>
                      </td>
                      <td>
                        <button className="report-action-btn view"
                          title={t('viewDetails') || 'Просмотр'}
                          onClick={() => { setSelectedRequest(req); setPendingMarkers([]); setActiveMarkerIdx(0); }}>
                          <span className="material-icons">visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Map modal */}
          {selectedRequest && (
            <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
              <div className="modal large-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <h3>{selectedRequest.avatar_emoji} {selectedRequest.nickname}</h3>
                    <p style={{margin:'4px 0 0',fontSize:'13px',color:'#888'}}>
                      {selectedRequest.trees_count} дерев(а) · {formatDate(selectedRequest.created_at)}
                    </p>
                  </div>
                  <button className="modal-close" onClick={() => setSelectedRequest(null)}>
                    <span className="material-icons">close</span>
                  </button>
                </div>

                <div className="modal-body">
                  {selectedRequest.status === 'pending' && (
                    <p className="modal-hint">
                      {pendingMarkers.length < 5
                        ? (t('fundsClickMap') || 'Кликните на карте, чтобы добавить метку') + ` (${pendingMarkers.length}/5)`
                        : t('fundsMaxMarkers') || 'Максимум 5 меток'}
                    </p>
                  )}

                  <LocalizedMap center={[53.9, 27.5]} zoom={5}
                    style={{ height: 360, borderRadius: 10, marginBottom: 12 }}>
                    {selectedRequest.status === 'pending' && (
                      <MapClickHandler onPick={handleMapClick} />
                    )}
                    {/* Existing planted markers */}
                    {(selectedRequest.markers || []).map(m => (
                      <Marker key={m.id} position={[parseFloat(m.lat), parseFloat(m.lng)]} icon={treeIcon}>
                        <Popup>
                          {m.note && <p style={{margin:'0 0 6px'}}>{m.note}</p>}
                          {m.photo_url && <img src={m.photo_url} alt="tree" style={{width:'100%',borderRadius:6,cursor:'pointer'}} onClick={() => setZoomedPhoto(m.photo_url)} />}
                        </Popup>
                      </Marker>
                    ))}
                    {/* New pending markers */}
                    {pendingMarkers.map((m, i) => (
                      <Marker key={`new-${i}`} position={[m.lat, m.lng]} icon={i === activeMarkerIdx ? treeIcon : pendingIcon}>
                        <Popup>{m.lat.toFixed(5)}, {m.lng.toFixed(5)}</Popup>
                      </Marker>
                    ))}
                  </LocalizedMap>

                  {/* Markers list with photo upload */}
                  {selectedRequest.status === 'pending' && pendingMarkers.length > 0 && (
                    <div className="markers-list">
                      {pendingMarkers.map((m, i) => (
                        <div key={i} className={`marker-item${i === activeMarkerIdx ? ' active' : ''}`} onClick={() => setActiveMarkerIdx(i)}>
                          <div className="marker-item-header">
                            <span className="marker-num">🌳 Метка {i + 1}</span>
                            <span className="marker-coords">{m.lat.toFixed(4)}, {m.lng.toFixed(4)}</span>
                            <button className="marker-remove" onClick={(e) => { e.stopPropagation(); removeMarker(i); }}>
                              <span className="material-icons">close</span>
                            </button>
                          </div>
                          {i === activeMarkerIdx && (
                            <div className="marker-item-body">
                              <input type="file" accept="image/*" ref={fileInputRef} style={{display:'none'}} onChange={handleFileChange} />
                              <div className="photo-upload-row">
                                <button className={`upload-button${!m.photo_url ? ' required' : ''}`} onClick={() => fileInputRef.current?.click()}>
                                  <span className="material-icons">photo_camera</span>
                                  {m.photoPreview ? t('fundsChangePhoto') || 'Изменить фото' : t('fundsPhotoUrl') || 'Фото (обязательно)'}
                                </button>
                                {m.photoPreview && (
                                  <img src={m.photoPreview} alt="preview" className="photo-preview" onClick={() => setZoomedPhoto(m.photoPreview)} />
                                )}
                              </div>
                              <input className="form-input" placeholder={t('fundsNote') || 'Заметка (необязательно)'}
                                value={m.note}
                                onChange={e => setPendingMarkers(prev => prev.map((pm, pi) => pi === i ? { ...pm, note: e.target.value } : pm))}
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      <button className="submit-button primary" onClick={handlePlant} disabled={planting || pendingMarkers.some(m => !m.photo_url)}>
                        {planting ? '...' : `${t('fundsConfirmPlant') || 'Подтвердить посадку'} (${pendingMarkers.length})`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* All markers view */}
      {mapView === 'all' && (
        <div className="map-container">
          <LocalizedMap center={[53.9, 27.5]} zoom={4}
            style={{ height: 520, borderRadius: 10 }}>
            {flyTo && <FlyToMarker position={flyTo} />}
            <MarkerCluster
              markers={allMarkers.map(m => ({
                ...m,
                icon: treeIcon,
                popupHtml: `<div class="tree-popup">
                  <div class="popup-header"><b>${m.avatar_emoji || ''} ${m.nickname || ''}</b></div>
                  ${m.note ? `<p class="popup-note">${m.note}</p>` : ''}
                  ${m.photo_url ? `<img src="${m.photo_url}" class="popup-photo" style="width:100%;border-radius:6px;margin-top:6px;cursor:pointer"/>` : ''}
                  <p class="popup-date" style="margin:6px 0 0;font-size:11px;color:#888">${new Date(m.planted_at).toLocaleDateString('ru-RU')}</p>
                </div>`,
              }))}
            />
          </LocalizedMap>
        </div>
      )}

      {/* Photo zoom modal */}
      {zoomedPhoto && (
        <>
          <div className="funds-zoom-overlay" onClick={() => setZoomedPhoto(null)} />
          <div className="funds-zoom-modal" onClick={() => setZoomedPhoto(null)}>
            <img src={zoomedPhoto} alt="tree full" className="funds-zoom-img" />
            <button className="funds-zoom-close">
              <span className="material-icons">close</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminFundsTab;
