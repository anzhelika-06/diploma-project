import { useState, useEffect } from 'react';
import '../styles/components/BannedModal.css';

const BannedModal = ({ ban, onClose, forcedLogout = false }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [showSupport, setShowSupport] = useState(false);
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [supportSent, setSupportSent] = useState(false);
  const [supportError, setSupportError] = useState('');

  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') ||
      localStorage.getItem('theme') || 'light'
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme') ||
        localStorage.getItem('theme') || 'light';
      setTheme(t);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const expiresAt = ban?.expiresAt || ban?.expires_at || ban?.ban_expires_at || null;
  const reason = ban?.reason || ban?.ban_reason || 'Нарушение правил сообщества';
  const isPermanent = !expiresAt;
  const userId = ban?.userId || null;

  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) { setTimeLeft('Срок истёк'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${d > 0 ? d + ' д ' : ''}${h > 0 ? h + ' ч ' : ''}${m > 0 ? m + ' мин ' : ''}${s} сек`
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleSendSupport = async () => {
    setSupportError('');
    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      setSupportError('Заполните тему и сообщение');
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const resolvedUserId = user.id || userId;
      if (!resolvedUserId) {
        setSupportError('Не удалось определить пользователя');
        return;
      }
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(resolvedUserId)
        },
        body: JSON.stringify({
          subject: supportForm.subject.trim(),
          message: supportForm.message.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSupportSent(true);
      } else {
        setSupportError(data.message || 'Ошибка отправки');
      }
    } catch {
      setSupportError('Не удалось отправить обращение');
    }
  };

  return (
    <div className="banned-overlay" onClick={forcedLogout ? undefined : onClose}>
      <div className="banned-modal" data-theme={theme} onClick={e => e.stopPropagation()}>
        <div className="banned-header">
          <div className="banned-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h2 className="banned-title">Аккаунт заблокирован</h2>
        </div>

        {!showSupport ? (
          <>
            <div className="banned-field">
              <span className="banned-label">Причина</span>
              <span className="banned-value">{reason}</span>
            </div>

            <div className="banned-field">
              <span className="banned-label">Срок блокировки</span>
              {isPermanent ? (
                <span className="banned-value banned-permanent">Постоянная блокировка</span>
              ) : (
                <>
                  <span className="banned-value">
                    до {new Date(expiresAt).toLocaleString('ru-RU')}
                  </span>
                  <div className="banned-countdown">{timeLeft}</div>
                </>
              )}
            </div>

            <div className="banned-actions">
              <button className="banned-btn banned-btn-secondary" onClick={() => setShowSupport(true)}>
                Написать в поддержку
              </button>
              <button className="banned-btn banned-btn-ghost" onClick={onClose}>
                {forcedLogout ? 'Выйти из аккаунта' : 'Закрыть'}
              </button>
            </div>
          </>
        ) : (
          <>
            {supportSent ? (
              <div className="banned-support-success">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#4caf50" strokeWidth="2"/>
                  <path d="M7 12l3 3 7-7" stroke="#4caf50" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p>Обращение отправлено. Мы рассмотрим его в ближайшее время.</p>
              </div>
            ) : (
              <>
                <input
                  className="banned-input"
                  placeholder="Тема обращения"
                  value={supportForm.subject}
                  onChange={e => setSupportForm(f => ({ ...f, subject: e.target.value }))}
                />
                <textarea
                  className="banned-textarea"
                  placeholder="Опишите ситуацию..."
                  rows={4}
                  value={supportForm.message}
                  onChange={e => setSupportForm(f => ({ ...f, message: e.target.value }))}
                />
                {supportError && <p className="banned-error">{supportError}</p>}
              </>
            )}

            <div className="banned-actions">
              {!supportSent && (
                <button className="banned-btn banned-btn-secondary" onClick={handleSendSupport}>
                  Отправить
                </button>
              )}
              {supportSent ? (
                <button className="banned-btn banned-btn-ghost" onClick={onClose}>
                  {forcedLogout ? 'Выйти из аккаунта' : 'Закрыть'}
                </button>
              ) : (
                <button className="banned-btn banned-btn-ghost" onClick={() => setShowSupport(false)}>
                  Назад
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BannedModal;
