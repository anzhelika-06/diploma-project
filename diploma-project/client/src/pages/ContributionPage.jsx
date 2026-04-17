import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentUser } from '../utils/authUtils';
import ecoinsImage from '../assets/images/ecoins.png';
import '../styles/pages/ContributionPage.css';

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

const TREE_COST = 1;
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const ContributionPage = () => {
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState(() => searchParams.get('tab') || 'redeem');
  const [ecoCoins, setEcoCoins] = useState(0);
  const [requests, setRequests] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [treesCount, setTreesCount] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [zoomedPhoto, setZoomedPhoto] = useState(null);
  const [msg, setMsg] = useState(null);

  // Sync tab to URL
  useEffect(() => {
    const params = tab !== 'redeem' ? { tab } : {};
    setSearchParams(params, { replace: true });
  }, [tab, setSearchParams]);

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [coinsRes, myRes] = await Promise.all([
        fetch(`/api/users/${currentUser.id}/profile`, { headers: authHeader() }),
        fetch('/api/trees/my', { headers: authHeader() }),
      ]);
      const coinsData = await coinsRes.json();
      setEcoCoins(coinsData.user?.eco_coins ?? coinsData.eco_coins ?? 0);
      const myData = await myRes.json();
      if (myData.success) {
        setRequests(myData.requests);
        setMarkers(myData.requests.flatMap(r => r.markers || []));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRedeem = async () => {
    setShowConfirm(false);
    setRedeeming(true);
    try {
      const res = await fetch('/api/trees/redeem', {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ trees_count: treesCount })
      });
      const data = await res.json();
      if (data.success) {
        setEcoCoins(data.eco_coins);
        showMsg(t('redeemSuccess') || 'Запрос отправлен!', 'success');
        loadData();
      } else {
        showMsg(data.message, 'error');
      }
    } catch { showMsg('Ошибка', 'error'); }
    setRedeeming(false);
  };

  const formatDate = d => d ? new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  const plantedCount = requests.filter(r => r.status === 'planted').reduce((s, r) => s + r.trees_count, 0);
  const pendingCount = requests.filter(r => r.status === 'pending').reduce((s, r) => s + r.trees_count, 0);
  const canAfford = ecoCoins >= treesCount * TREE_COST;

  return (
    <div className="contribution-page">

      {/* Page header */}
      <div className="contribution-page-header">
        <div>
          <h1>{t('contributionTitle') || 'Мой вклад'}</h1>
          <p>{t('contributionSubtitle') || 'Обменяйте экоины на посадку деревьев'}</p>
        </div>
        <div className="contribution-balance">
          <img src={ecoinsImage} alt="" className="contribution-leaf" />
          <span className="contribution-balance-val">{ecoCoins}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{gridTemplateColumns:'repeat(2,1fr)'}}>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(76,175,80,0.1)',color:'#2e7d32'}}>
            <span className="material-icons">park</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{plantedCount}</div>
            <div className="stat-label">{t('treesPlanted') || 'Посажено'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(255,152,0,0.1)',color:'#e65100'}}>
            <span className="material-icons">hourglass_empty</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{pendingCount}</div>
            <div className="stat-label">{t('treesPending') || 'Ожидают'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="contribution-tabs">
        {[
          { id: 'redeem', label: t('tabRedeem') || 'Обмен экоинов' },
          { id: 'map', label: t('tabMyTrees') || 'Мои деревья' },
          { id: 'history', label: t('tabHistory') || 'История' },
        ].map(tb => (
          <button key={tb.id}
            className={`contribution-tab${tab === tb.id ? ' active' : ''}`}
            onClick={() => setTab(tb.id)}>
            {tb.label}
          </button>
        ))}
      </div>

      {msg && <div className={`contribution-msg ${msg.type}`}>{msg.text}</div>}

      {/* ── Redeem ── */}
      {tab === 'redeem' && (
        <div className="contribution-redeem-grid">
          <div className="admin-section contribution-card">
            <h2>{t('plantTree') || 'Посадить дерево'}</h2>
            <p className="contribution-card-desc">
              1 {t('plantTree')?.toLowerCase() || 'дерево'} = {TREE_COST}
              <img src={ecoinsImage} alt="" className="contribution-inline-leaf" />
            </p>

            <div className="contribution-count-row">
              <button className="contribution-count-btn" onClick={() => setTreesCount(Math.max(1, treesCount - 1))}>−</button>
              <span className="contribution-count-val">{treesCount}</span>
              <button className="contribution-count-btn" onClick={() => setTreesCount(treesCount + 1)}>+</button>
            </div>

            <div className="contribution-cost-row">
              <div className="contribution-cost-item">
                <span className="contribution-cost-label">{t('redeemCost') || 'Стоимость'}</span>
                <span className="contribution-cost-val">
                  {treesCount * TREE_COST}
                  <img src={ecoinsImage} alt="" className="contribution-inline-leaf" />
                </span>
              </div>
              <div className="contribution-cost-item">
                <span className="contribution-cost-label">{t('redeemBalance') || 'Баланс'}</span>
                <span className={`contribution-cost-val${!canAfford ? ' insufficient' : ''}`}>
                  {ecoCoins}
                  <img src={ecoinsImage} alt="" className="contribution-inline-leaf" />
                </span>
              </div>
            </div>

            <button className="contribution-redeem-btn"
              onClick={() => setShowConfirm(true)}
              disabled={redeeming || !canAfford}>
              {redeeming ? '...' : t('redeemBtn') || 'Обменять'}
            </button>
          </div>

          <div className="admin-section contribution-card">
            <h2>{t('howItWorks') || 'Как это работает'}</h2>
            <ol className="contribution-steps">
              <li>{t('howStep1') || 'Обменяйте экоины на запрос посадки дерева'}</li>
              <li>{t('howStep2') || 'Администратор получит уведомление и посадит дерево'}</li>
              <li>{t('howStep3') || 'Вы получите уведомление с фото и меткой на карте'}</li>
            </ol>
          </div>
        </div>
      )}

      {/* ── Map ── */}
      {tab === 'map' && (
        <div className="admin-section contribution-map-section">
          {markers.length === 0 ? (
            <div className="contribution-empty">
              <p>{t('noTreesYet') || 'У вас пока нет посаженных деревьев'}</p>
              <button className="contribution-empty-btn" onClick={() => setTab('redeem')}>
                {t('plantTree') || 'Посадить дерево'}
              </button>
            </div>
          ) : (
            <MapContainer
              center={[parseFloat(markers[0].lat), parseFloat(markers[0].lng)]}
              zoom={5}
              style={{ height: 460, width: '100%', borderRadius: 8 }}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {markers.map(m => (
                <Marker
                  key={m.id}
                  position={[parseFloat(m.lat), parseFloat(m.lng)]}
                  icon={treeIcon}
                  eventHandlers={{ click: () => setSelectedMarker(m) }}
                />
              ))}
            </MapContainer>
          )}
        </div>
      )}

      {/* ── History ── */}
      {tab === 'history' && (
        <div className="admin-section">
          <h2>{t('tabHistory') || 'История'}</h2>
          {loading ? <p className="contribution-loading">{t('loading') || 'Загрузка...'}</p>
          : requests.length === 0 ? (
            <div className="contribution-empty">
              <p>{t('noRequests') || 'Нет запросов'}</p>
            </div>
          ) : (
            <div className="contribution-history">
              {requests.map(req => (
                <div key={req.id} className={`contribution-history-item ${req.status}`}>
                  <div className="contribution-history-top">
                    <div className="contribution-history-left">
                      <span className="contribution-history-trees">{req.trees_count} {t('treesPlanted') || 'деревьев'}</span>
                      <span className="contribution-history-coins">
                        {req.coins_spent}
                        <img src={ecoinsImage} alt="" className="contribution-inline-leaf" />
                      </span>
                    </div>
                    <span className={`contribution-history-badge ${req.status}`}>
                      {req.status === 'pending' ? t('statusPendingTree') || 'Ожидает'
                        : req.status === 'planted' ? t('statusPlanted') || 'Посажено'
                        : t('statusRejected') || 'Отклонено'}
                    </span>
                  </div>
                  <div className="contribution-history-date">{formatDate(req.created_at)}</div>
                  {req.admin_note && <p className="contribution-history-note">{req.admin_note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <>
          <div className="modal-overlay" onClick={() => setShowConfirm(false)} />
          <div className="modal">
            <div className="modal-header">
              <h3>{t('confirmRedeemTitle') || 'Подтвердите обмен'}</h3>
              <button className="modal-close" onClick={() => setShowConfirm(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p>
                {t('confirmRedeemMsg') || 'Вы уверены, что хотите обменять'}{' '}
                <b>{treesCount * TREE_COST}</b>{' '}
                <img src={ecoinsImage} alt="" className="contribution-inline-leaf" />{' '}
                {t('confirmRedeemFor') || 'на посадку'}{' '}
                <b>{treesCount}</b> {t('treesPlanted') || 'деревьев'}?
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn secondary" onClick={() => setShowConfirm(false)}>{t('cancel') || 'Отмена'}</button>
              <button className="modal-btn primary" onClick={handleRedeem}>{t('confirm') || 'Подтвердить'}</button>
            </div>
          </div>
        </>
      )}

      {/* Tree detail modal */}
      {selectedMarker && (
        <>
          <div className="modal-overlay" onClick={() => setSelectedMarker(null)} />
          <div className="modal contribution-tree-modal">
            <div className="modal-header">
              <h3>{t('myTreeTitle') || 'Моё дерево'}</h3>
              <button className="modal-close" onClick={() => setSelectedMarker(null)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              {selectedMarker.photo_url && (
                <img src={selectedMarker.photo_url} alt="tree"
                  className="contribution-tree-photo"
                  style={{cursor:'pointer'}}
                  onClick={() => setZoomedPhoto(selectedMarker.photo_url)}
                  onError={e => e.target.style.display = 'none'} />
              )}
              <div className="contribution-tree-info">
                <div className="contribution-tree-row">
                  <span className="material-icons">place</span>
                  <span>{parseFloat(selectedMarker.lat).toFixed(5)}, {parseFloat(selectedMarker.lng).toFixed(5)}</span>
                </div>
                <div className="contribution-tree-row">
                  <span className="material-icons">calendar_today</span>
                  <span>{formatDate(selectedMarker.planted_at)}</span>
                </div>
                {selectedMarker.note && (
                  <div className="contribution-tree-row">
                    <span className="material-icons">notes</span>
                    <span>{selectedMarker.note}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      {/* Photo zoom */}
      {zoomedPhoto && (
        <>
          <div className="funds-zoom-overlay" onClick={() => setZoomedPhoto(null)} />
          <div className="funds-zoom-modal" onClick={() => setZoomedPhoto(null)}>
            <img src={zoomedPhoto} alt="tree full" className="funds-zoom-img" />
            <button className="funds-zoom-close"><span className="material-icons">close</span></button>
          </div>
        </>
      )}
    </div>
  );
};

export default ContributionPage;
