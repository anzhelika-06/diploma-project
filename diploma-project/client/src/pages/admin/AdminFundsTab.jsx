import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../../contexts/LanguageContext';
import ecoinsImage from '../../assets/images/ecoins.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const treeIcon = new L.DivIcon({
  html: `<svg viewBox="0 0 40 48" width="36" height="44" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="18" rx="16" ry="16" fill="#2e7d32"/>
    <ellipse cx="20" cy="14" rx="13" ry="13" fill="#388e3c"/>
    <ellipse cx="20" cy="10" rx="10" ry="10" fill="#43a047"/>
    <rect x="17" y="30" width="6" height="14" rx="2" fill="#5d4037"/>
  </svg>`,
  className: '',
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  popupAnchor: [0, -44],
});

const pendingIcon = new L.DivIcon({
  html: `<svg viewBox="0 0 40 48" width="28" height="34" xmlns="http://www.w3.org/2000/svg" style="opacity:0.65">
    <ellipse cx="20" cy="18" rx="16" ry="16" fill="#81c784"/>
    <ellipse cx="20" cy="14" rx="13" ry="13" fill="#a5d6a7"/>
    <rect x="17" y="30" width="6" height="14" rx="2" fill="#8d6e63"/>
  </svg>`,
  className: '',
  iconSize: [28, 34],
  iconAnchor: [14, 34],
  popupAnchor: [0, -34],
});

function MapClickHandler({ onPick }) {
  useMapEvents({ click: e => onPick(e.latlng) });
  return null;
}

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const AdminFundsTab = () => {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [requests, setRequests] = useState([]);
  const [allMarkers, setAllMarkers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [pickedLatLng, setPickedLatLng] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [note, setNote] = useState('');
  const [planting, setPlanting] = useState(false);
  const [mapView, setMapView] = useState('requests');
  const [msg, setMsg] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, planted: 0 });
  const [zoomedPhoto, setZoomedPhoto] = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trees/admin/requests?status=${statusFilter}`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setRequests(data.requests);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [statusFilter]);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setPhotoPreview(ev.target.result); setPhotoBase64(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handlePlant = async () => {
    if (!selectedRequest || !pickedLatLng) return;
    setPlanting(true);
    try {
      const res = await fetch('/api/trees/admin/plant', {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          lat: pickedLatLng.lat,
          lng: pickedLatLng.lng,
          photo_url: photoBase64 || null,
          note: note || null,
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: t('fundsPlantSuccess') || 'Дерево посажено!', type: 'success' });
        setSelectedRequest(null); setPickedLatLng(null);
        setPhotoPreview(null); setPhotoBase64(null); setNote('');
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
    <div className="admin-section funds-section">

      {/* Stats — same structure as AdminUsersTab */}
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

      {/* View toggle */}
      <div className="funds-header">
        <h2>{t('adminFundsTitle') || 'Посадка деревьев'}</h2>
        <div className="funds-view-tabs">
          <button className={`funds-view-btn${mapView === 'requests' ? ' active' : ''}`} onClick={() => { setMapView('requests'); setSelectedRequest(null); }}>
            {t('fundsRequests') || 'Запросы'}
          </button>
          <button className={`funds-view-btn${mapView === 'all' ? ' active' : ''}`} onClick={() => setMapView('all')}>
            {t('fundsAllMarkers') || 'Все метки'}
          </button>
        </div>
      </div>

      {msg && <div className={`funds-msg ${msg.type}`}>{msg.text}</div>}

      {/* Requests view */}
      {mapView === 'requests' && (
        <>
          {/* Filter */}
          <div className="funds-filter-row">
            {[
              { key: 'pending', label: t('fundsPending') || 'Ожидают' },
              { key: 'planted', label: t('fundsPlanted') || 'Посажены' },
              { key: 'all', label: t('fundsAll') || 'Все' },
            ].map(s => (
              <button key={s.key} className={`funds-filter-btn${statusFilter === s.key ? ' active' : ''}`}
                onClick={() => { setStatusFilter(s.key); setSelectedRequest(null); }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Requests list */}
          {loading ? <p className="funds-loading">{t('loading') || 'Загрузка...'}</p>
          : requests.length === 0 ? <p className="funds-empty">{t('noRequests') || 'Нет запросов'}</p>
          : (
            <div className="funds-requests-grid">
              {requests.map(req => (
                <div key={req.id}
                  className={`funds-request-card${selectedRequest?.id === req.id ? ' selected' : ''}`}
                  onClick={() => { setSelectedRequest(req); setPickedLatLng(null); setPhotoPreview(null); setPhotoBase64(null); setNote(''); }}>
                  <div className="funds-req-top">
                    <span className="funds-req-user">{req.avatar_emoji} {req.nickname}</span>
                    <span className={`funds-req-badge ${req.status}`}>
                      {req.status === 'pending' ? t('statusPendingTree') || 'Ожидает' : t('statusPlanted') || 'Посажено'}
                    </span>
                  </div>
                  <div className="funds-req-info">
                    <span>{req.trees_count} {t('treesPlanted') || 'дерев(а)'}</span>
                    <span className="funds-req-coins">
                      {req.coins_spent}
                      <img src={ecoinsImage} alt="" className="funds-leaf-icon" />
                    </span>
                    <span className="funds-req-date">{formatDate(req.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Map panel — shown only when request selected */}
          {selectedRequest && (
            <div className="funds-map-block">
              <div className="funds-map-block-header">
                <div>
                  <h3>{selectedRequest.avatar_emoji} {selectedRequest.nickname}</h3>
                  <p>{selectedRequest.trees_count} {t('treesPlanted') || 'дерев(а)'} · {formatDate(selectedRequest.created_at)}</p>
                </div>
                <button className="funds-close-map" onClick={() => setSelectedRequest(null)}>
                  <span className="material-icons">close</span>
                </button>
              </div>

              <p className="funds-map-hint">
                {selectedRequest.status === 'pending'
                  ? t('fundsClickMap') || 'Кликните на карте, чтобы поставить метку'
                  : t('fundsRequests') || 'Метки этого запроса'}
              </p>

              <MapContainer center={[53.9, 27.5]} zoom={5}
                style={{ height: 380, borderRadius: 10, marginBottom: 12 }} attributionControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {selectedRequest.status === 'pending' && <MapClickHandler onPick={setPickedLatLng} />}
                {pickedLatLng && (
                  <Marker position={pickedLatLng} icon={pendingIcon}>
                    <Popup>{pickedLatLng.lat.toFixed(5)}, {pickedLatLng.lng.toFixed(5)}</Popup>
                  </Marker>
                )}
                {(selectedRequest.markers || []).map(m => (
                  <Marker key={m.id} position={[parseFloat(m.lat), parseFloat(m.lng)]} icon={treeIcon}>
                    <Popup>
                      {m.note && <p style={{margin:'0 0 6px'}}>{m.note}</p>}
                      {m.photo_url && (
                        <img src={m.photo_url} alt="tree"
                          style={{width:'100%',borderRadius:6,cursor:'pointer'}}
                          onClick={() => setZoomedPhoto(m.photo_url)} />
                      )}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {selectedRequest.status === 'pending' && pickedLatLng && (
                <div className="funds-plant-form">
                  <p className="funds-coords">
                    <span className="material-icons" style={{fontSize:14,verticalAlign:'middle'}}>place</span>
                    {' '}{pickedLatLng.lat.toFixed(5)}, {pickedLatLng.lng.toFixed(5)}
                  </p>
                  <input type="file" accept="image/*" ref={fileInputRef}
                    style={{ display: 'none' }} onChange={handleFileChange} />
                  <div className="funds-file-row">
                    <button className="funds-file-btn" onClick={() => fileInputRef.current?.click()}>
                      <span className="material-icons">photo_camera</span>
                      {photoPreview ? t('fundsChangePhoto') || 'Изменить фото' : t('fundsPhotoUrl') || 'Прикрепить фото'}
                    </button>
                    {photoPreview && (
                      <img src={photoPreview} alt="preview" className="funds-photo-preview"
                        style={{cursor:'pointer'}} onClick={() => setZoomedPhoto(photoPreview)} />
                    )}
                  </div>
                  <input className="funds-input" placeholder={t('fundsNote') || 'Заметка'}
                    value={note} onChange={e => setNote(e.target.value)} />
                  <button className="funds-plant-btn" onClick={handlePlant} disabled={planting}>
                    {planting ? '...' : t('fundsConfirmPlant') || 'Подтвердить посадку'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* All markers view */}
      {mapView === 'all' && (
        <div className="funds-all-map">
          <MapContainer center={[53.9, 27.5]} zoom={4}
            style={{ height: 520, borderRadius: 10 }} attributionControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {allMarkers.map(m => (
              <Marker key={m.id} position={[parseFloat(m.lat), parseFloat(m.lng)]} icon={treeIcon}>
                <Popup>
                  <b>{m.avatar_emoji} {m.nickname}</b>
                  {m.note && <p style={{margin:'4px 0 0'}}>{m.note}</p>}
                  {m.photo_url && (
                    <img src={m.photo_url} alt="tree"
                      style={{width:'100%',borderRadius:6,marginTop:6,cursor:'pointer'}}
                      onClick={() => setZoomedPhoto(m.photo_url)} />
                  )}
                  <p style={{margin:'4px 0 0',fontSize:11,color:'#888'}}>{new Date(m.planted_at).toLocaleDateString('ru-RU')}</p>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
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
