import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentUser } from '../utils/authUtils';
import ecoinsImage from '../assets/images/ecoins.png';
import '../styles/pages/PetPage.css';

const API = '/api/pet';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

// ── Realistic SVG Animals ──
function CatSVG({ className = '' }) {
  return (
    <svg className={`pet-svg ${className}`} viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="80" cy="150" rx="38" ry="7" fill="rgba(0,0,0,0.08)"/>
      {/* Body */}
      <ellipse cx="80" cy="118" rx="38" ry="32" fill="#7a5230"/>
      {/* Belly */}
      <ellipse cx="80" cy="122" rx="22" ry="19" fill="#c8956a"/>
      {/* Legs */}
      <ellipse cx="56" cy="140" rx="13" ry="9" fill="#6a4220"/>
      <ellipse cx="104" cy="140" rx="13" ry="9" fill="#6a4220"/>
      <ellipse cx="56" cy="138" rx="11" ry="7" fill="#7a5230"/>
      <ellipse cx="104" cy="138" rx="11" ry="7" fill="#7a5230"/>
      {/* Arms */}
      <ellipse cx="42" cy="118" rx="12" ry="9" fill="#7a5230" transform="rotate(-20,42,118)"/>
      <ellipse cx="118" cy="118" rx="12" ry="9" fill="#7a5230" transform="rotate(20,118,118)"/>
      {/* Head */}
      <ellipse cx="80" cy="82" rx="32" ry="30" fill="#7a5230"/>
      {/* Ears */}
      <circle cx="52" cy="62" r="9" fill="#7a5230"/>
      <circle cx="108" cy="62" r="9" fill="#7a5230"/>
      <circle cx="52" cy="62" r="5.5" fill="#c8956a"/>
      <circle cx="108" cy="62" r="5.5" fill="#c8956a"/>
      {/* Face */}
      <ellipse cx="80" cy="90" rx="20" ry="16" fill="#c8956a"/>
      {/* Eyes */}
      <g className="eye-blink" style={{transformOrigin:'66px 80px'}}>
        <ellipse cx="66" cy="80" rx="5.5" ry="6" fill="#1a1008"/>
        <ellipse cx="64.5" cy="77.5" rx="2.2" ry="2.2" fill="#fff"/>
        <ellipse cx="66" cy="81" rx="1.6" ry="3.5" fill="#0a0804"/>
        <circle cx="65" cy="78" r="1" fill="#fff" opacity="0.9"/>
      </g>
      <g className="eye-blink" style={{transformOrigin:'94px 80px'}}>
        <ellipse cx="94" cy="80" rx="5.5" ry="6" fill="#1a1008"/>
        <ellipse cx="92.5" cy="77.5" rx="2.2" ry="2.2" fill="#fff"/>
        <ellipse cx="94" cy="81" rx="1.6" ry="3.5" fill="#0a0804"/>
        <circle cx="93" cy="78" r="1" fill="#fff" opacity="0.9"/>
      </g>
      {/* Snout */}
      <ellipse cx="80" cy="92" rx="11" ry="8" fill="#b07848"/>
      {/* Nose */}
      <ellipse cx="80" cy="88" rx="5.5" ry="4" fill="#1a1008"/>
      <ellipse cx="79" cy="87" rx="2" ry="1.5" fill="#444"/>
      {/* Mouth */}
      <path d="M74 94 Q80 100 86 94" stroke="#6a3818" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <line x1="80" y1="92" x2="80" y2="95" stroke="#6a3818" strokeWidth="2"/>
    </svg>
  );
}

function FoxSVG({ className = '' }) {
  return (
    <svg className={`pet-svg ${className}`} viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="78" cy="148" rx="34" ry="8" fill="rgba(0,0,0,0.08)"/>
      {/* Tail — solid, no white stroke */}
      <path d="M112 132 Q148 114 142 84 Q136 60 122 72" stroke="#c84010" strokeWidth="16" fill="none" strokeLinecap="round"/>
      <path d="M112 132 Q148 114 142 84 Q136 60 122 72" stroke="#e06030" strokeWidth="11" fill="none" strokeLinecap="round"/>
      <path d="M112 132 Q148 114 142 84 Q136 60 122 72" stroke="#e8722a" strokeWidth="7" fill="none" strokeLinecap="round"/>
      {/* Tail tip */}
      <ellipse cx="122" cy="72" rx="10" ry="10" fill="#fff" opacity="0.9"/>
      <ellipse cx="122" cy="72" rx="7" ry="7" fill="#f5f0e8"/>
      {/* Body */}
      <ellipse cx="78" cy="118" rx="34" ry="28" fill="#e06030"/>
      {/* Belly */}
      <ellipse cx="78" cy="122" rx="19" ry="16" fill="#f5c8a0"/>
      {/* Legs */}
      <ellipse cx="58" cy="138" rx="10" ry="7" fill="#c84010"/>
      <ellipse cx="98" cy="138" rx="10" ry="7" fill="#c84010"/>
      <ellipse cx="58" cy="136" rx="8" ry="5" fill="#e06030"/>
      <ellipse cx="98" cy="136" rx="8" ry="5" fill="#e06030"/>
      {/* Head */}
      <ellipse cx="78" cy="80" rx="30" ry="28" fill="#e06030"/>
      {/* Ears — symmetric pointed fox ears */}
      <polygon points="54,66 46,32 68,58" fill="#e06030"/>
      <polygon points="102,66 110,32 88,58" fill="#e06030"/>
      <polygon points="55,64 49,36 66,58" fill="#1a1a1a"/>
      <polygon points="101,64 107,36 90,58" fill="#1a1a1a"/>
      <polygon points="56,63 51,40 65,58" fill="#e06030" opacity="0.3"/>
      <polygon points="100,63 105,40 91,58" fill="#e06030" opacity="0.3"/>
      {/* Eyes */}
      <g className="eye-blink" style={{transformOrigin:'66px 76px'}}>
        <ellipse cx="66" cy="76" rx="7" ry="7.5" fill="#2a1a0a"/>
        <ellipse cx="64" cy="73" rx="3" ry="3" fill="#fff"/>
        <ellipse cx="66" cy="77" rx="2" ry="4" fill="#1a1a1a"/>
        <circle cx="65" cy="74" r="1.2" fill="#fff" opacity="0.9"/>
      </g>
      <g className="eye-blink" style={{transformOrigin:'90px 76px'}}>
        <ellipse cx="90" cy="76" rx="7" ry="7.5" fill="#2a1a0a"/>
        <ellipse cx="88" cy="73" rx="3" ry="3" fill="#fff"/>
        <ellipse cx="90" cy="77" rx="2" ry="4" fill="#1a1a1a"/>
        <circle cx="89" cy="74" r="1.2" fill="#fff" opacity="0.9"/>
      </g>
      {/* Muzzle */}
      <ellipse cx="78" cy="88" rx="12" ry="9" fill="#f5c8a0"/>
      {/* Nose */}
      <ellipse cx="78" cy="84" rx="4" ry="3" fill="#1a1a1a"/>
      <ellipse cx="77" cy="83" rx="1.5" ry="1" fill="#444"/>
      {/* Mouth */}
      <path d="M73 89 Q78 94 83 89" stroke="#c84010" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <line x1="78" y1="87" x2="78" y2="90" stroke="#c84010" strokeWidth="1.5"/>
      {/* Whiskers */}
      <line x1="44" y1="86" x2="66" y2="88" stroke="#bbb" strokeWidth="1.2" opacity="0.7"/>
      <line x1="44" y1="91" x2="66" y2="91" stroke="#bbb" strokeWidth="1.2" opacity="0.7"/>
      <line x1="112" y1="86" x2="90" y2="88" stroke="#bbb" strokeWidth="1.2" opacity="0.7"/>
      <line x1="112" y1="91" x2="90" y2="91" stroke="#bbb" strokeWidth="1.2" opacity="0.7"/>
    </svg>
  );
}

function TurtleSVG({ className = '' }) {
  return (
    <svg className={`pet-svg ${className}`} viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="80" cy="152" rx="34" ry="6" fill="rgba(0,0,0,0.08)"/>

      {/* Tail — fluffy white puff */}
      <circle cx="112" cy="128" r="10" fill="#e8e0f0"/>
      <circle cx="112" cy="128" r="7" fill="#f5f0ff"/>

      {/* Body */}
      <ellipse cx="78" cy="118" rx="36" ry="28" fill="#d8cce8"/>
      {/* Belly */}
      <ellipse cx="76" cy="122" rx="22" ry="18" fill="#f0eaf8"/>

      {/* Legs */}
      <ellipse cx="56" cy="140" rx="14" ry="9" fill="#c8b8dc"/>
      <ellipse cx="96" cy="140" rx="14" ry="9" fill="#c8b8dc"/>
      <ellipse cx="56" cy="138" rx="11" ry="7" fill="#d8cce8"/>
      <ellipse cx="96" cy="138" rx="11" ry="7" fill="#d8cce8"/>
      {/* Paws */}
      <ellipse cx="50" cy="143" rx="8" ry="5" fill="#c0aed4"/>
      <ellipse cx="90" cy="143" rx="8" ry="5" fill="#c0aed4"/>

      {/* Arms */}
      <ellipse cx="44" cy="116" rx="11" ry="8" fill="#d8cce8" transform="rotate(-20,44,116)"/>
      <ellipse cx="112" cy="112" rx="11" ry="8" fill="#d8cce8" transform="rotate(20,112,112)"/>

      {/* Neck */}
      <ellipse cx="78" cy="90" rx="14" ry="10" fill="#d8cce8"/>

      {/* Head */}
      <ellipse cx="78" cy="76" rx="26" ry="24" fill="#d8cce8"/>
      {/* Head highlight */}
      <ellipse cx="72" cy="68" rx="12" ry="8" fill="#e8e0f4" opacity="0.5"/>

      {/* Ears — long rabbit ears */}
      <ellipse cx="62" cy="42" rx="9" ry="28" fill="#d8cce8"/>
      <ellipse cx="94" cy="42" rx="9" ry="28" fill="#d8cce8"/>
      {/* Ear inner */}
      <ellipse cx="62" cy="42" rx="5" ry="22" fill="#f0a0b8"/>
      <ellipse cx="94" cy="42" rx="5" ry="22" fill="#f0a0b8"/>

      {/* Eyes */}
      <g className="eye-blink" style={{transformOrigin:'66px 74px'}}>
        <ellipse cx="66" cy="74" rx="6" ry="6.5" fill="#3a1a2a"/>
        <ellipse cx="64.5" cy="71.5" rx="2.5" ry="2.5" fill="#fff"/>
        <ellipse cx="66" cy="75" rx="1.8" ry="3.5" fill="#1a0a1a"/>
        <circle cx="65" cy="72" r="1.1" fill="#fff" opacity="0.9"/>
      </g>
      <g className="eye-blink" style={{transformOrigin:'90px 74px'}}>
        <ellipse cx="90" cy="74" rx="6" ry="6.5" fill="#3a1a2a"/>
        <ellipse cx="88.5" cy="71.5" rx="2.5" ry="2.5" fill="#fff"/>
        <ellipse cx="90" cy="75" rx="1.8" ry="3.5" fill="#1a0a1a"/>
        <circle cx="89" cy="72" r="1.1" fill="#fff" opacity="0.9"/>
      </g>

      {/* Nose */}
      <ellipse cx="78" cy="82" rx="4" ry="3" fill="#f08090"/>
      {/* Mouth */}
      <path d="M74 85 Q78 89 82 85" stroke="#d06070" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <line x1="78" y1="85" x2="78" y2="82" stroke="#d06070" strokeWidth="1.5"/>

      {/* Whiskers */}
      <line x1="46" y1="80" x2="68" y2="83" stroke="#bbb" strokeWidth="1" opacity="0.7"/>
      <line x1="46" y1="84" x2="68" y2="85" stroke="#bbb" strokeWidth="1" opacity="0.7"/>
      <line x1="110" y1="80" x2="88" y2="83" stroke="#bbb" strokeWidth="1" opacity="0.7"/>
      <line x1="110" y1="84" x2="88" y2="85" stroke="#bbb" strokeWidth="1" opacity="0.7"/>
    </svg>
  );
}

const PET_COMPONENTS = { cat: CatSVG, fox: FoxSVG, turtle: TurtleSVG };

const PET_TYPES = [
  { id: 'cat',    name: { RU: 'Медвежонок', EN: 'Bear Cub', BY: 'Мядзведзяня' }, desc: { RU: 'Пушистый эко-медведь, хранитель лесов',        EN: 'A fluffy eco-bear, guardian of forests',     BY: 'Пухнаты эка-мядзведзь, ахоўнік лясоў'       } },
  { id: 'fox',    name: { RU: 'Лисёнок',   EN: 'Fox Cub',  BY: 'Лісяня'    }, desc: { RU: 'Хитрый и умный эко-лис, любит природу',         EN: 'A clever eco-fox who loves nature',          BY: 'Хітры эка-ліс, які любіць прыроду'          } },
  { id: 'turtle', name: { RU: 'Кролик',    EN: 'Bunny',    BY: 'Трус'      }, desc: { RU: 'Пушистый эко-кролик, любит зелёные луга',      EN: 'A fluffy eco-bunny who loves green meadows', BY: 'Пухнаты эка-трус, любіць зялёныя лугі'      } },
];

const STAGE_LABELS = {
  RU: ['Малыш', 'Подросток', 'Взрослый', 'Мудрец', 'Легенда'],
  EN: ['Baby', 'Teen', 'Adult', 'Sage', 'Legend'],
  BY: ['Малы', 'Падлетак', 'Дарослы', 'Мудрэц', 'Легенда'],
};

// Stage index: 0=Baby(1-5), 1=Teen(6-10), 2=Adult(11-15), 3=Sage(16-20), 4=Legend(21+)
function getStageIndex(level) {
  return Math.min(Math.floor((level - 1) / 5), 4);
}

function getStageLabel(level, lang) {
  const labels = STAGE_LABELS[lang] || STAGE_LABELS.RU;
  return labels[getStageIndex(level)];
}

// Scene theme per stage
const STAGE_SCENES = [
  // 0 Baby — sunny meadow
  { light: 'linear-gradient(160deg,#b3e5fc 0%,#e8f5e9 50%,#c8e6c9 100%)', dark: 'linear-gradient(160deg,#1a2a3a 0%,#1a2e1a 50%,#162416 100%)' },
  // 1 Teen — forest
  { light: 'linear-gradient(160deg,#a5d6a7 0%,#c8e6c9 40%,#81c784 100%)', dark: 'linear-gradient(160deg,#0d2b0d 0%,#1b3a1b 50%,#0a1f0a 100%)' },
  // 2 Adult — mountains
  { light: 'linear-gradient(160deg,#b0bec5 0%,#e3f2fd 45%,#90caf9 100%)', dark: 'linear-gradient(160deg,#1a2030 0%,#263040 50%,#1a2535 100%)' },
  // 3 Sage — sunset
  { light: 'linear-gradient(160deg,#ffe0b2 0%,#ffccbc 45%,#ffab91 100%)', dark: 'linear-gradient(160deg,#2d1a0a 0%,#3d2010 50%,#2a1508 100%)' },
  // 4 Legend — night sky
  { light: 'linear-gradient(160deg,#7986cb 0%,#9575cd 45%,#ce93d8 100%)', dark: 'linear-gradient(160deg,#0d0d2b 0%,#1a1040 50%,#0d0820 100%)' },
];

function canFeedToday(lastFedAt) {
  if (!lastFedAt) return true;
  return new Date(lastFedAt).toDateString() !== new Date().toDateString();
}

// ── Mood effects ──
function HappySparkles() {
  const items = [
    { emoji: '✨', x: '18%', y: '12%', dur: '2.4s', delay: '0s' },
    { emoji: '🌿', x: '78%', y: '8%',  dur: '3.1s', delay: '0.5s' },
    { emoji: '💚', x: '88%', y: '38%', dur: '2.7s', delay: '1.1s' },
    { emoji: '🍃', x: '10%', y: '42%', dur: '3.4s', delay: '0.3s' },
    { emoji: '✨', x: '55%', y: '5%',  dur: '2.9s', delay: '0.8s' },
    { emoji: '💫', x: '30%', y: '18%', dur: '3.2s', delay: '1.4s' },
  ];
  return (
    <div className="pet-sparkles">
      {items.map((s, i) => (
        <span key={i} className="pet-sparkle-item" style={{
          '--dur': s.dur,
          '--delay': s.delay,
          left: s.x,
          top: s.y,
        }}>{s.emoji}</span>
      ))}
    </div>
  );
}

function NeutralThought({ t }) {
  return (
    <div className="pet-thought">
      <span className="pet-thought-icon">🍽️</span>
      <span>{t('petThoughtHungry') || 'Хочу кушать...'}</span>
    </div>
  );
}

function SadTears() {
  const tears = [
    { left: '38%', dur: '1.8s', delay: '0s' },
    { left: '62%', dur: '2.2s', delay: '0.6s' },
    { left: '45%', dur: '2s',   delay: '1.1s' },
  ];
  return (
    <div className="pet-tears">
      {tears.map((t, i) => (
        <span key={i} className="pet-tear" style={{ '--dur': t.dur, '--delay': t.delay, '--left': t.left }}>💧</span>
      ))}
    </div>
  );
}

const PARTICLE_POSITIONS = Array.from({ length: 8 }).map((_, i) => {
  const angle = (i / 8) * 360;
  const rad = (angle * Math.PI) / 180;
  const dist = 55 + (i % 3) * 15;
  return { tx: `${Math.cos(rad) * dist}px`, ty: `${Math.sin(rad) * dist - 30}px` };
});
const PARTICLE_EMOJIS = ['✨', '🌿', '💚', '⭐', '🍃', '💫', '🌱', '✨'];

function Particles({ active }) {
  if (!active) return null;
  return (
    <div className="pet-particles">
      {PARTICLE_POSITIONS.map((pos, i) => (
        <span key={i} className="pet-particle"
          style={{ '--tx': pos.tx, '--ty': pos.ty, animationDelay: `${i * 0.06}s` }}>
          {PARTICLE_EMOJIS[i]}
        </span>
      ))}
    </div>
  );
}

function ChooseScreen({ onChoose, lang, t }) {
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/choose`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ pet_type: selected, name: name.trim() || null }),
      });
      const data = await res.json();
      if (data.success) onChoose(data.pet);
      else setError(data.error || 'Ошибка');
    } catch { setError('Ошибка соединения'); }
    setLoading(false);
  };

  return (
    <div className="pet-choose">
      <h1>{t('petChooseTitle') || '🐾 Выбери питомца'}</h1>
      <p>{t('petChooseSubtitle') || 'Твой эко-компаньон будет расти вместе с тобой'}</p>
      <div className="pet-choose-grid">
        {PET_TYPES.map(p => {
          const Comp = PET_COMPONENTS[p.id];
          return (
            <div key={p.id} className={`pet-choose-card${selected === p.id ? ' selected' : ''}`} onClick={() => setSelected(p.id)}>
              <div className="pet-choose-preview"><Comp /></div>
              <h3>{p.name[lang] || p.name.RU}</h3>
              <p>{p.desc[lang] || p.desc.RU}</p>
            </div>
          );
        })}
      </div>
      <div className="pet-choose-name-row">
        <input placeholder={t('petNamePlaceholder') || 'Имя питомца (необязательно)'} value={name} onChange={e => setName(e.target.value)} maxLength={20} />
      </div>
      <button className="pet-btn-primary" onClick={handleConfirm} disabled={!selected || loading}>
        {loading ? '...' : (t('petChooseBtn') || 'Завести питомца')}
      </button>
      {error && <p style={{ color: '#f44336', marginTop: 12, fontSize: 13 }}>{error}</p>}
    </div>
  );
}

export default function PetPage() {
  const { t, currentLanguage } = useLanguage();
  const lang = currentLanguage || 'RU';
  const currentUser = getCurrentUser();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ecoCoins, setEcoCoins] = useState(0);
  const [feeding, setFeeding] = useState(false);
  const [reviving, setReviving] = useState(false);
  const [eatAnim, setEatAnim] = useState(false);
  const [particles, setParticles] = useState(false);
  const [levelUpMsg, setLevelUpMsg] = useState(null);
  const [levelFlash, setLevelFlash] = useState(false);
  const [feedMsg, setFeedMsg] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  const [showRename, setShowRename] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const lvlTimer = useRef(null);
  const msgTimer = useRef(null);

  const loadPet = useCallback(async () => {
    try {
      const res = await fetch(API, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setPet(data.pet);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const loadCoins = useCallback(async () => {
    try {
      const userId = currentUser?.id;
      if (!userId) return;
      const res = await fetch(`/api/users/${userId}/profile`, { headers: authHeader() });
      const data = await res.json();
      setEcoCoins(data.user?.eco_coins ?? data.eco_coins ?? 0);
    } catch (e) { console.error(e); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => { loadPet(); loadCoins(); }, [loadPet, loadCoins]);

  const handleFeed = async () => {
    if (feeding) return;
    setFeeding(true); setFeedMsg(null);
    try {
      const res = await fetch(`${API}/feed`, { method: 'POST', headers: { ...authHeader(), 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (data.success) {
        setPet(data.pet); setEcoCoins(data.eco_coins);
        setEatAnim(true); setParticles(true);
        setTimeout(() => { setEatAnim(false); setParticles(false); }, 900);
        if (data.leveled_up) {
          clearTimeout(lvlTimer.current);
          setLevelUpMsg(`🎉 ${t('petLevel') || 'Уровень'} ${data.new_level}!`);
          setLevelFlash(true);
          setTimeout(() => setLevelFlash(false), 700);
          lvlTimer.current = setTimeout(() => setLevelUpMsg(null), 2600);
        }
      } else {
        const msgs = { already_fed: t('petAlreadyFed') || 'Уже покормлен сегодня!', not_enough_coins: t('petNotEnoughCoins') || 'Недостаточно экоинов' };
        clearTimeout(msgTimer.current);
        setFeedMsg({ text: msgs[data.error] || data.error, type: 'error' });
        msgTimer.current = setTimeout(() => setFeedMsg(null), 3000);
      }
    } catch { setFeedMsg({ text: 'Ошибка', type: 'error' }); }
    setFeeding(false);
  };

  const handleRevive = async () => {
    if (reviving) return;
    setReviving(true); setFeedMsg(null);
    try {
      const res = await fetch(`${API}/revive`, { method: 'POST', headers: { ...authHeader(), 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (data.success) {
        setPet(data.pet); setEcoCoins(data.eco_coins);
        setParticles(true);
        setTimeout(() => setParticles(false), 900);
      } else {
        const msgs = { not_enough_coins: t('petNotEnoughCoins') || 'Недостаточно экоинов', pet_not_dead: 'Питомец ещё жив!' };
        clearTimeout(msgTimer.current);
        setFeedMsg({ text: msgs[data.error] || data.error, type: 'error' });
        msgTimer.current = setTimeout(() => setFeedMsg(null), 3000);
      }
    } catch { setFeedMsg({ text: 'Ошибка', type: 'error' }); }
    setReviving(false);
  };

  const handleRename = async () => {
    if (!renameVal.trim()) return;
    try {
      await fetch(`${API}/name`, { method: 'PATCH', headers: { ...authHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify({ name: renameVal.trim() }) });
      setPet(p => ({ ...p, name: renameVal.trim() }));
      setRenameVal(''); setShowRename(false);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    try {
      await fetch(API, { method: 'DELETE', headers: authHeader() });
      setPet(null); setShowDeleteConfirm(false);
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="pet-page"><div className="pet-loading"><span style={{ fontSize: 40 }}>🐾</span><span>{t('loading') || 'Загрузка...'}</span></div></div>;
  if (!pet) return <div className="pet-page"><ChooseScreen onChoose={p => setPet(p)} lang={lang} t={t} /></div>;

  const PetComp = PET_COMPONENTS[pet.pet_type] || CatSVG;
  const petDef = PET_TYPES.find(p => p.id === pet.pet_type);
  const displayName = pet.name || petDef?.name[lang] || 'Питомец';
  const stageLabel = getStageLabel(pet.level, lang);
  const stageIndex = getStageIndex(pet.level);
  const xpPct = Math.min(100, Math.round((pet.xp / pet.xp_to_next_level) * 100));
  const canFeed = canFeedToday(pet.last_fed_at);
  const minStat = Math.min(pet.hunger, pet.happiness);
  const isDead = pet.hunger === 0 && pet.happiness === 0;
  const mood = isDead ? 'dead' : minStat < 30 ? 'sad' : minStat < 70 ? 'neutral' : 'happy';
  const figClass = isDead ? 'anim-dead' : eatAnim ? 'anim-eat' :
    mood === 'sad' ? 'anim-sad' :
    mood === 'neutral' ? 'anim-neutral' :
    // happy — stage-based animation
    stageIndex === 0 ? 'anim-baby' :
    stageIndex === 1 ? 'anim-teen' :
    stageIndex === 2 ? 'anim-float' :
    stageIndex === 3 ? 'anim-sage' :
    'anim-legend';

  const daysWithPet = pet.created_at
    ? Math.max(1, Math.floor((Date.now() - new Date(pet.created_at)) / 86400000))
    : 1;

  const moodMsg = {
    happy:   t('petMoodHappy')   || '😊 Питомец счастлив!',
    neutral: t('petMoodNeutral') || '😐 Питомец немного голоден',
    sad:     t('petMoodSad')     || '😢 Питомец грустит, покорми его!',
    dead:    t('petMoodDead')    || '💀 Питомец без сознания...',
  };

  const TIPS = [
    { icon: '🍃', text: t('petTip1') || 'Корми питомца раз в день, чтобы поддерживать сытость и счастье.' },
    { icon: '📉', text: t('petTip2') || 'Если пропустить день — сытость падает на 20%, счастье на 15%.' },
    { icon: '⭐', text: t('petTip3') || 'Каждое кормление даёт +30 XP и приближает к новому уровню.' },
    { icon: '💀', text: t('petTip4') || 'Если оба показателя упадут до 0 — питомца нужно восстановить за 50 монет.' },
  ];

  return (
    <div className="pet-page">
      <div className="pet-main">

        {/* ── LEFT ── */}
        <div className="pet-left">

          {/* Stats */}
          <div className="pet-stats-card">
            <p className="pet-stats-title">{t('petStatsTitle') || '📊 Статистика'}</p>
            <div className="pet-stats-grid">
              <div className="pet-stat-item">
                <span className="pet-stat-val">{pet.level}</span>
                <span className="pet-stat-label">{t('petLevel') || 'Уровень'}</span>
              </div>
              <div className="pet-stat-item">
                <span className="pet-stat-val">{daysWithPet}</span>
                <span className="pet-stat-label">{t('petDays') || 'Дней вместе'}</span>
              </div>
              <div className="pet-stat-item">
                <span className="pet-stat-val">{stageLabel}</span>
                <span className="pet-stat-label">{t('petStage') || 'Стадия'}</span>
              </div>
              <div className="pet-stat-item">
                <span className="pet-stat-val">{xpPct}%</span>
                <span className="pet-stat-label">{t('petXpProgress') || 'До уровня'}</span>
              </div>
            </div>
          </div>

          {/* Scene */}
          <div
            className={`pet-scene mood-${mood}${levelFlash ? ' level-flash' : ''}`}
            style={mood === 'happy' || mood === 'neutral' ? {
              '--scene-bg-light': STAGE_SCENES[stageIndex].light,
              '--scene-bg-dark': STAGE_SCENES[stageIndex].dark,
            } : {}}
          >
            <span className="pet-cloud">☁️</span>
            <span className="pet-cloud">☁️</span>
            {levelUpMsg && <div className="pet-levelup">{levelUpMsg}</div>}
            {mood === 'happy'   && <HappySparkles />}
            {mood === 'neutral' && <NeutralThought t={t} />}
            {mood === 'sad'     && <SadTears />}
            <div className="pet-character-wrap">
              <div className={`pet-stage-${stageIndex}`}>
                <PetComp className={figClass} />
                <Particles active={particles} />
              </div>
            </div>
            <div className="pet-name-tag">{displayName}</div>
            <div className={`pet-status-msg ${mood}`}>{moodMsg[mood]}</div>
            <div className="pet-bars">
              <div className="pet-bar-row">
                <span className="pet-bar-label-text">{t('petHunger') || 'Сытость'}</span>
                <div className="pet-bar-track"><div className="pet-bar-fill hunger" style={{ width: `${pet.hunger}%` }} /></div>
                <span className="pet-bar-val">{pet.hunger}%</span>
              </div>
              <div className="pet-bar-row">
                <span className="pet-bar-label-text">{t('petHappiness') || 'Счастье'}</span>
                <div className="pet-bar-track"><div className="pet-bar-fill happiness" style={{ width: `${pet.happiness}%` }} /></div>
                <span className="pet-bar-val">{pet.happiness}%</span>
              </div>
            </div>
          </div>

          {/* Rename */}
          <div className="pet-card">
            <h4>✏️ {t('petRename') || 'Переименовать'}</h4>
            {showRename ? (
              <div className="pet-rename-row">
                <input placeholder={t('petNewName') || 'Новое имя'} value={renameVal}
                  onChange={e => setRenameVal(e.target.value)} maxLength={20}
                  onKeyDown={e => e.key === 'Enter' && handleRename()} autoFocus />
                <button className="pet-btn-sm" onClick={handleRename}>{t('save') || 'Сохранить'}</button>
                <button className="pet-btn-sm cancel" onClick={() => setShowRename(false)}>✕</button>
              </div>
            ) : (
              <button className="pet-btn-sm full" onClick={() => setShowRename(true)}>{t('petRename') || 'Переименовать'}</button>
            )}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="pet-right">

          {/* Info + XP */}
          <div className="pet-card">
            <div className="pet-info-top">
              <div>
                <p className="pet-info-name">{displayName}</p>
                <p className="pet-info-stage">{stageLabel} · {petDef?.name[lang]}</p>
              </div>
              <div className="pet-coins-badge">
                <img src={ecoinsImage} alt="eco coins" className="pet-coin-icon" />
                {ecoCoins}
              </div>
            </div>
            <div className="pet-xp-row">
              <span className="pet-level-num">{t('petLevel') || 'Уровень'} {pet.level}</span>
              <span className="pet-xp-text">{pet.xp} / {pet.xp_to_next_level} XP</span>
            </div>
            <div className="pet-xp-track"><div className="pet-xp-fill" style={{ width: `${xpPct}%` }} /></div>
          </div>

          {/* Feed / Revive */}
          <div className="pet-card">
            <h4>🍃 {t('petFeedTitle') || 'Кормление'}</h4>
            {isDead ? (
              <div className="pet-revive-block">
                <div className="pet-revive-warning">
                  <span className="pet-revive-icon">💀</span>
                  <p>{t('petDeadMsg') || 'Питомец без сознания. Восстановите его!'}</p>
                </div>
                <button
                  className="pet-revive-btn"
                  onClick={handleRevive}
                  disabled={reviving || ecoCoins < 50}
                  data-tooltip={ecoCoins < 50 ? (t('petNotEnoughCoins') || 'Недостаточно экоинов') : undefined}
                >
                  {reviving ? '...' : (t('petReviveBtn') || 'Восстановить')}
                </button>
                {feedMsg && <span className={`pet-hint ${feedMsg.type}`}>{feedMsg.text}</span>}
              </div>
            ) : (
              <>
                <button
                  className="pet-feed-btn"
                  onClick={handleFeed}
                  disabled={!canFeed || feeding || ecoCoins < 10 || (pet.hunger >= 100 && pet.happiness >= 100)}
                  data-tooltip={
                    ecoCoins < 10 ? (t('petNotEnoughCoins') || 'Недостаточно экоинов') :
                    (pet.hunger >= 100 && pet.happiness >= 100) ? (t('petAlreadyFull') || 'Питомец сыт и счастлив!') :
                    undefined
                  }
                >
                  {canFeed
                    ? (feeding ? '...' : (t('petFeedBtn') || 'Покормить'))
                    : (t('petFedToday') || 'Покормлен сегодня ✓')}
                </button>
                {feedMsg && <span className={`pet-hint ${feedMsg.type}`}>{feedMsg.text}</span>}
                {!feedMsg && canFeed && <span className="pet-hint">{t('petFeedHint') || '+30 XP за кормление'}</span>}
                {!canFeed && <span className="pet-hint">{t('petNextFeed') || 'Следующее кормление завтра'}</span>}
              </>
            )}
          </div>

          {/* Tips — right column */}
          <div className="pet-tips">
            <p className="pet-tips-title">{t('petTipsTitle') || '💡 Советы'}</p>
            <div className="pet-tips-list">
              {TIPS.map((tip, i) => (
                <div key={i} className="pet-tip-item">
                  <span className="pet-tip-icon">{tip.icon}</span>
                  <span className="pet-tip-text">{tip.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delete */}
          <div className="pet-card">
            <h4>🗑️ {t('petDelete') || 'Удалить питомца'}</h4>
            {showDeleteConfirm ? (
              <div className="pet-delete-confirm">
                <p>{t('petDeleteConfirm') || 'Вы уверены? Питомец будет удалён навсегда.'}</p>
                <div className="pet-delete-actions">
                  <button className="pet-btn-sm danger" onClick={handleDelete}>{t('confirmDelete') || 'Удалить'}</button>
                  <button className="pet-btn-sm cancel" onClick={() => setShowDeleteConfirm(false)}>{t('cancel') || 'Отмена'}</button>
                </div>
              </div>
            ) : (
              <button className="pet-btn-sm danger full" onClick={() => setShowDeleteConfirm(true)}>{t('petDelete') || 'Удалить питомца'}</button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
