import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentUser } from '../utils/authUtils';
import { translateStoryContent, detectTextLanguage } from '../utils/translations';
import '../styles/pages/MessagesPage.css';

const formatTime = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

const badge = (n) => n > 99 ? '99+' : String(n);

const Avatar = ({ emoji, size = 40, online = false, isTeam = false }) => (
  <div className={`msg-avatar${isTeam ? ' msg-avatar--team' : ''}`}
    style={{ width: size, height: size, fontSize: size * 0.5 }}>
    {emoji || '🌱'}
    {online && <span className="msg-online-dot" />}
  </div>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
    <line x1="12" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="11" x2="12" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CrownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M3 18h18M5 18L3 8l5.5 4L12 4l3.5 8L21 8l-2 10H5z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Confirm Modal ──
const ConfirmModal = ({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel, danger = false }) => (
  <div className="msg-confirm-overlay" onClick={onCancel}>
    <div className="msg-confirm" onClick={e => e.stopPropagation()}>
      <p className="msg-confirm-title">{title}</p>
      <p className="msg-confirm-message">{message}</p>
      <div className="msg-confirm-actions">
        <button className="msg-confirm-cancel" onClick={onCancel}>{cancelLabel}</button>
        <button className={`msg-confirm-btn${danger ? ' msg-confirm-btn--danger' : ''}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ── Info panel for direct chat ──
const DirectInfoPanel = ({ chat, online, onClose, t }) => {
  const navigate = useNavigate();
  return (
    <div className="msg-info-panel">
      <div className="msg-info-header">
        <span className="msg-info-title">{t('infoTitle')}</span>
        <button className="msg-info-close" onClick={onClose}><CloseIcon /></button>
      </div>
      <div className="msg-info-body">
        <button className="msg-info-avatar-btn" onClick={() => navigate(`/profile/${chat.id}`)}>
          <Avatar emoji={chat.avatar} size={64} online={online} />
        </button>
        <button className="msg-info-name-btn" onClick={() => navigate(`/profile/${chat.id}`)}>
          {chat.name}
        </button>
        <p className="msg-info-status">{online ? t('online') : t('offline')}</p>
      </div>
    </div>
  );
};

// ── Info panel for team chat ──
const TeamInfoPanel = ({ chat, teamDetail, currentUserId, onClose, onLeave, onKick, t }) => {
  const navigate = useNavigate();

  if (!teamDetail) return (
    <div className="msg-info-panel">
      <div className="msg-info-header">
        <span className="msg-info-title">{t('aboutTeam')}</span>
        <button className="msg-info-close" onClick={onClose}><CloseIcon /></button>
      </div>
      <div className="msg-info-body"><p className="msg-info-status">{t('loadingMessages')}</p></div>
    </div>
  );

  const { team, members } = teamDetail;
  const progress = team.goal_target > 0 ? Math.min(100, Math.round((Math.max(0, team.goal_current) / team.goal_target) * 100)) : 0;
  const isAdmin = members.find(m => Number(m.user_id) === Number(currentUserId))?.role === 'admin';

  return (
    <div className="msg-info-panel">
      <div className="msg-info-header">
        <span className="msg-info-title">{t('aboutTeam')}</span>
        <button className="msg-info-close" onClick={onClose}><CloseIcon /></button>
      </div>
      <div className="msg-info-body">
        <Avatar emoji={team.avatar_emoji} size={56} isTeam />
        <p className="msg-info-name">{team.name}</p>
        {team.description && <p className="msg-info-desc">{team.description}</p>}

        {team.goal_description && (
          <div className="msg-info-goal">
            <p className="msg-info-goal-label">{t('teamGoalLabel')} {team.goal_description}</p>
            <div className="msg-info-progress-bar">
              <div className="msg-info-progress-fill" style={{ width: progress + '%' }} />
            </div>
            <p className="msg-info-goal-stat">{Math.max(0, team.goal_current || 0)} / {team.goal_target} {t('kgCO2')} · {progress}%</p>
          </div>
        )}

        <p className="msg-info-members-title">{members.length} {t('teamMembersCount')}</p>
        <div className="msg-info-members-list">
          {members.map(m => (
            <div key={m.user_id} className="msg-member-row">
              <button className="msg-member-avatar-btn" onClick={() => navigate(`/profile/${m.user_id}`)}>
                <Avatar emoji={m.avatar_emoji} size={32} />
              </button>
              <div className="msg-member-info">
                <button className="msg-member-name-btn" onClick={() => navigate(`/profile/${m.user_id}`)}>
                  {m.nickname}
                </button>
                {m.role === 'admin' && (
                  <span className="msg-member-crown" title={t('administrator')}>
                    <CrownIcon />
                  </span>
                )}
              </div>
              {isAdmin && Number(m.user_id) !== Number(currentUserId) && m.role !== 'admin' && (
                <button
                  className="msg-member-kick-btn"
                  onClick={() => onKick(m.user_id, m.nickname)}
                  title={t('kickFromChat')}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          ))}
        </div>

        {!isAdmin && (
          <button className="msg-info-leave-btn" onClick={onLeave}>{t('leaveTeam')}</button>
        )}
      </div>
    </div>
  );
};

const MessagesPage = () => {
  const currentUser = getCurrentUser();
  const { socket } = useSocket();
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState(() => searchParams.get('tab') || 'friends');
  const [conversations, setConversations] = useState([]);
  const [teamChats, setTeamChats] = useState([]);
  const [activeChat, setActiveChat] = useState(() => {
    // Инициализируем activeChat из URL если есть
    const chatId = searchParams.get('chatId');
    const chatType = searchParams.get('chatType');
    if (chatId && chatType) {
      return { type: chatType, id: Number(chatId), name: '', avatar: '' };
    }
    return null;
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showInfo, setShowInfo] = useState(false);
  const [teamDetail, setTeamDetail] = useState(null);
  const [translatedTeamDetail, setTranslatedTeamDetail] = useState(null);
  const [mobileView, setMobileView] = useState('list');
  const [confirmModal, setConfirmModal] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const activeChatRef = useRef(null);
  const pendingOpenRef = useRef(location.state?.openChat || null);
  activeChatRef.current = activeChat;

  // Sync tab and activeChat to URL
  useEffect(() => {
    const params = {};
    if (tab !== 'friends') params.tab = tab;
    if (activeChat) {
      params.chatId = activeChat.id.toString();
      params.chatType = activeChat.type;
    }
    setSearchParams(params, { replace: true });
  }, [tab, activeChat, setSearchParams]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/conversations', { headers: authHeader() });
      const data = await res.json();
      if (data.success) setConversations(data.conversations);
    } catch (e) { console.error(e); }
  }, []);

  const loadTeamChats = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/team-chats', { headers: authHeader() });
      const data = await res.json();
      if (data.success) setTeamChats(data.teams);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadConversations(); loadTeamChats(); }, [loadConversations, loadTeamChats]);

  // Восстановить activeChat из URL после загрузки данных
  useEffect(() => {
    const chatId = searchParams.get('chatId');
    const chatType = searchParams.get('chatType');
    
    if (!chatId || !chatType) return;
    if (activeChat && activeChat.name) return; // Уже восстановлен
    
    const id = Number(chatId);
    
    if (chatType === 'direct' && conversations.length > 0) {
      const found = conversations.find(c => Number(c.id) === id);
      if (found) {
        setActiveChat({
          type: 'direct',
          id: found.id,
          name: found.nickname,
          avatar: found.avatar_emoji
        });
        setMobileView('chat');
      }
    } else if (chatType === 'team' && teamChats.length > 0) {
      const found = teamChats.find(t => Number(t.id) === id);
      if (found) {
        setActiveChat({
          type: 'team',
          id: found.id,
          name: found.name,
          avatar: found.avatar_emoji
        });
        setMobileView('chat');
      }
    }
  }, [searchParams, conversations, teamChats, activeChat]);

  // Открыть чат из навигации после загрузки conversations
  useEffect(() => {
    if (!pendingOpenRef.current || conversations.length === 0) return;
    const target = pendingOpenRef.current;
    pendingOpenRef.current = null;
    window.history.replaceState({}, '');
    const found = conversations.find(c => Number(c.id) === Number(target.userId));
    if (found) {
      openChat({ type: 'direct', id: found.id, name: found.nickname, avatar: found.avatar_emoji });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  // Открыть чат из навигации (FriendsPage / ProfilePage)
  useEffect(() => {
    const openChatState = location.state?.openChat;
    if (!openChatState) return;
    // Чистим state чтобы не открывалось повторно при возврате
    window.history.replaceState({}, '');
    // Ждём загрузки conversations
    const tryOpen = (convs) => {
      const found = convs.find(c => Number(c.id) === Number(openChatState.userId));
      if (found) {
        openChat({ type: 'direct', id: found.id, name: found.nickname, avatar: found.avatar_emoji });
      }
    };
    // Если conversations уже загружены — открываем сразу, иначе ждём
    setConversations(prev => { tryOpen(prev); return prev; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTeamDetail = useCallback(async (teamId) => {
    try {
      const res = await fetch(`/api/teams/${teamId}`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setTeamDetail(data);
    } catch (e) { console.error(e); }
  }, []);

  // Перевод описания и цели команды при смене языка или загрузке данных
  useEffect(() => {
    if (!teamDetail) { setTranslatedTeamDetail(null); return; }
    const translate = async () => {
      const { team } = teamDetail;
      const targetLang = currentLanguage.toLowerCase();
      let desc = team.description || '';
      let goal = team.goal_description || '';
      try {
        if (desc) {
          const cached = sessionStorage.getItem(`msg_team_desc_${team.id}_${currentLanguage}`);
          if (cached) { desc = cached; }
          else {
            const srcLang = detectTextLanguage(desc);
            if (srcLang !== targetLang) desc = await translateStoryContent(desc, currentLanguage, srcLang);
            sessionStorage.setItem(`msg_team_desc_${team.id}_${currentLanguage}`, desc);
          }
        }
        if (goal) {
          const cached = sessionStorage.getItem(`msg_team_goal_${team.id}_${currentLanguage}`);
          if (cached) { goal = cached; }
          else {
            const srcLang = detectTextLanguage(goal);
            if (srcLang !== targetLang) goal = await translateStoryContent(goal, currentLanguage, srcLang);
            sessionStorage.setItem(`msg_team_goal_${team.id}_${currentLanguage}`, goal);
          }
        }
      } catch (e) { console.warn('Translation error:', e); }
      setTranslatedTeamDetail({ ...teamDetail, team: { ...team, description: desc, goal_description: goal } });
    };
    translate();
  }, [teamDetail, currentLanguage]);

  const openChat = useCallback(async (chat) => {
    setActiveChat(chat);
    setMessages([]);
    setShowInfo(false);
    setTeamDetail(null);
    setTranslatedTeamDetail(null);
    setLoading(true);
    setMobileView('chat');
    try {
      const url = chat.type === 'direct'
        ? `/api/messages/direct/${chat.id}`
        : `/api/messages/team/${chat.id}`;
      const res = await fetch(url, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch (e) { console.error(e); }
    setLoading(false);
    inputRef.current?.focus();
    if (chat.type === 'team' && socket) socket.emit('join:team', chat.id);
    if (chat.type === 'direct')
      setConversations(prev => prev.map(c => c.id === chat.id ? { ...c, unread_count: 0 } : c));
    if (chat.type === 'team')
      setTeamChats(prev => prev.map(t => t.id === chat.id ? { ...t, unread_count: 0 } : t));
  }, [socket]);

  const openInfo = () => {
    setShowInfo(true);
    setMobileView('info');
    if (activeChat?.type === 'team') loadTeamDetail(activeChat.id);
  };

  const closeInfo = () => {
    setShowInfo(false);
    setMobileView('chat');
  };

  const goBackToList = () => {
    setMobileView('list');
    setActiveChat(null);
    setShowInfo(false);
  };

  useEffect(() => {
    if (!socket) return;
    socket.emit('get:online:users');
    const handleOnlineList = ({ users }) => {
      if (Array.isArray(users)) setOnlineUsers(new Set(users.map(u => String(u.userId))));
    };
    const handleDirect = (msg) => {
      const chat = activeChatRef.current;
      const isActive = chat?.type === 'direct' && (chat.id === msg.sender_id || chat.id === msg.receiver_id);
      if (isActive) setMessages(prev => [...prev, msg]);
      setConversations(prev => {
        const otherId = msg.sender_id === currentUser?.id ? msg.receiver_id : msg.sender_id;
        return prev.map(c => c.id === otherId ? {
          ...c, last_message: msg.content, last_message_at: msg.created_at, last_sender_id: msg.sender_id,
          unread_count: isActive ? 0 : (c.unread_count || 0) + (msg.sender_id !== currentUser?.id ? 1 : 0)
        } : c).sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0));
      });
    };
    const handleTeam = (msg) => {
      const chat = activeChatRef.current;
      const isActive = chat?.type === 'team' && chat.id === msg.team_id;
      if (isActive) setMessages(prev => [...prev, msg]);
      setTeamChats(prev => prev.map(t => t.id === msg.team_id ? {
        ...t, last_message: msg.content, last_message_at: msg.created_at,
        last_sender_id: msg.sender_id, last_sender_nickname: msg.sender_nickname,
        unread_count: isActive ? 0 : (t.unread_count || 0) + (msg.sender_id !== currentUser?.id ? 1 : 0)
      } : t).sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)));
    };
    const handleOnline = ({ userId }) => setOnlineUsers(prev => new Set([...prev, String(userId)]));
    const handleOffline = ({ userId }) => setOnlineUsers(prev => { const s = new Set(prev); s.delete(String(userId)); return s; });
    socket.on('online:users:list', handleOnlineList);
    socket.on('message:direct', handleDirect);
    socket.on('message:team', handleTeam);
    socket.on('user:online', handleOnline);
    socket.on('user:offline', handleOffline);
    return () => {
      socket.off('online:users:list', handleOnlineList);
      socket.off('message:direct', handleDirect);
      socket.off('message:team', handleTeam);
      socket.off('user:online', handleOnline);
      socket.off('user:offline', handleOffline);
    };
  }, [socket, currentUser?.id]);

  useEffect(() => {
    return () => {
      if (activeChatRef.current?.type === 'team' && socket)
        socket.emit('leave:team', activeChatRef.current.id);
    };
  }, [socket]);

  const sendMessage = () => {
    if (!input.trim() || !activeChat || !socket) return;
    const content = input.trim();
    setInput('');
    if (activeChat.type === 'direct') socket.emit('send:direct', { receiverId: activeChat.id, content });
    else socket.emit('send:team', { teamId: activeChat.id, content });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleLeaveTeam = () => {
    if (!activeChat || activeChat.type !== 'team') return;
    setConfirmModal({
      title: t('leaveTeamConfirmTitle'),
      message: t('leaveTeamConfirmMessage'),
      confirmLabel: t('confirmLeave'),
      cancelLabel: t('cancel'),
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await fetch(`/api/teams/${activeChat.id}/leave`, {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id })
          });
          setTeamChats(prev => prev.filter(t => t.id !== activeChat.id));
          setActiveChat(null);
          setShowInfo(false);
          setMobileView('list');
        } catch (e) { console.error(e); }
      }
    });
  };

  const handleKickMember = (memberId, memberNickname) => {
    if (!activeChat) return;
    setConfirmModal({
      title: t('kickMemberConfirmTitle'),
      message: t('kickMemberConfirmMessage').replace('{name}', memberNickname),
      confirmLabel: t('confirmDelete'),
      cancelLabel: t('cancel'),
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await fetch(`/api/teams/${activeChat.id}/remove-member`, {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, memberId })
          });
          const data = await res.json();
          if (data.success) {
            setTeamDetail(prev => {
              if (!prev) return prev;
              const newMembers = prev.members.filter(m => Number(m.user_id) !== Number(memberId));
              return { ...prev, members: newMembers };
            });
            setActiveChat(prev => prev ? { ...prev, memberCount: (prev.memberCount || 1) - 1 } : prev);
            setTeamChats(prev => prev.map(tm => tm.id === activeChat.id
              ? { ...tm, member_count: Math.max(0, (tm.member_count || 1) - 1) }
              : tm
            ));
          }
        } catch (e) { console.error(e); }
      }
    });
  };

  const totalUnreadFriends = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);
  const totalUnreadTeams = teamChats.reduce((s, t) => s + (t.unread_count || 0), 0);

  return (
    <div className="messages-page">
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          cancelLabel={confirmModal.cancelLabel}
          danger={confirmModal.danger}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      <div className={`messages-layout${showInfo ? ' messages-layout--info' : ''}`}
           data-mobile={mobileView}>
        {/* Sidebar */}
        <aside className="messages-sidebar">
          <div className="messages-sidebar-header">
            <h2 className="messages-sidebar-title">{t('messagesTitle')}</h2>
          </div>
          <div className="messages-tabs">
            <button className={`messages-tab${tab === 'friends' ? ' messages-tab--active' : ''}`} onClick={() => setTab('friends')}>
              {t('friendsTab')}
              {totalUnreadFriends > 0 && <span className="messages-badge">{badge(totalUnreadFriends)}</span>}
            </button>
            <button className={`messages-tab${tab === 'teams' ? ' messages-tab--active' : ''}`} onClick={() => setTab('teams')}>
              {t('teamsTab')}
              {totalUnreadTeams > 0 && <span className="messages-badge">{badge(totalUnreadTeams)}</span>}
            </button>
          </div>
          <div className="messages-list">
            {tab === 'friends' && (conversations.length === 0
              ? <p className="messages-empty">{t('noFriendsChat')}</p>
              : conversations.map(c => (
                <button key={c.id}
                  className={`messages-item${activeChat?.type === 'direct' && activeChat.id === c.id ? ' messages-item--active' : ''}`}
                  onClick={() => openChat({ type: 'direct', id: c.id, name: c.nickname, avatar: c.avatar_emoji })}>
                  <Avatar emoji={c.avatar_emoji} online={onlineUsers.has(c.id)} />
                  <div className="messages-item-info">
                    <div className="messages-item-top">
                      <span className="messages-item-name">{c.nickname}</span>
                      <span className="messages-item-time">{formatTime(c.last_message_at)}</span>
                    </div>
                    <div className="messages-item-bottom">
                      <span className="messages-item-preview">
                        {c.last_message ? (c.last_sender_id === currentUser?.id ? t('youSent') : '') + c.last_message : t('startChat')}
                      </span>
                      {c.unread_count > 0 && <span className="messages-badge">{badge(c.unread_count)}</span>}
                    </div>
                  </div>
                </button>
              ))
            )}
            {tab === 'teams' && (teamChats.length === 0
              ? <p className="messages-empty">{t('noTeams')}</p>
              : teamChats.map(tm => (
                <button key={tm.id}
                  className={`messages-item${activeChat?.type === 'team' && activeChat.id === tm.id ? ' messages-item--active' : ''}`}
                  onClick={() => openChat({ type: 'team', id: tm.id, name: tm.name, avatar: tm.avatar_emoji, memberCount: tm.member_count })}>
                  <Avatar emoji={tm.avatar_emoji} isTeam />
                  <div className="messages-item-info">
                    <div className="messages-item-top">
                      <span className="messages-item-name">{tm.name}</span>
                      <span className="messages-item-time">{formatTime(tm.last_message_at)}</span>
                    </div>
                    <div className="messages-item-bottom">
                      <span className="messages-item-preview">
                        {tm.last_message
                          ? (tm.last_sender_id === currentUser?.id ? t('youSent') : (tm.last_sender_nickname ? tm.last_sender_nickname + ': ' : '')) + tm.last_message
                          : t('noMessages')}
                      </span>
                      {tm.unread_count > 0 && <span className="messages-badge">{badge(tm.unread_count)}</span>}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Chat */}
        <main className="messages-chat">
          {!activeChat ? (
            <div className="messages-empty-state">
              <div className="messages-empty-icon">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p>{t('selectChat')}</p>
            </div>
          ) : (
            <>
              <div className="messages-chat-header">
                <button className="messages-back-btn" onClick={goBackToList} aria-label="Back">
                  <BackIcon />
                </button>
                <Avatar emoji={activeChat.avatar} size={36} isTeam={activeChat.type === 'team'}
                  online={activeChat.type === 'direct' && onlineUsers.has(activeChat.id)} />
                <div className="messages-chat-header-info">
                  <button className="messages-chat-header-name-btn" onClick={
                    activeChat.type === 'direct' ? () => navigate(`/profile/${activeChat.id}`) : openInfo
                  }>
                    {activeChat.name}
                  </button>
                  <span className="messages-chat-header-sub">
                    {activeChat.type === 'team'
                      ? `${activeChat.memberCount || ''} ${t('membersCount')}`
                      : onlineUsers.has(activeChat.id) ? t('online') : t('offline')}
                  </span>
                </div>
                {activeChat.type === 'team' && (
                  <button
                    className={`messages-info-btn${showInfo ? ' messages-info-btn--active' : ''}`}
                    onClick={showInfo ? closeInfo : openInfo}
                    title={showInfo ? t('closeInfo') : t('infoTitle')}
                  >
                    {showInfo ? <CloseIcon /> : <InfoIcon />}
                  </button>
                )}
              </div>

              <div className="messages-body">
                {loading && <div className="messages-loading">{t('loadingMessages')}</div>}
                {!loading && messages.length === 0 && <div className="messages-no-messages">{t('noMessages')}</div>}
                {messages.map((msg, i) => {
                  const isOwn = msg.sender_id === currentUser?.id;
                  const prevMsg = messages[i - 1];
                  const showAvatar = !isOwn && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
                  return (
                    <div key={msg.id || i} className={`messages-msg${isOwn ? ' messages-msg--own' : ''}`}>
                      {!isOwn && (
                        <div className="messages-msg-avatar-wrap">
                          {showAvatar ? <Avatar emoji={msg.sender_avatar} size={32} /> : <div style={{ width: 32 }} />}
                        </div>
                      )}
                      <div className="messages-msg-body">
                        {!isOwn && showAvatar && activeChat.type === 'team' && (
                          <span className="messages-msg-author">{msg.sender_nickname}</span>
                        )}
                        <div className="messages-msg-bubble">
                          <span className="messages-msg-text">{msg.content}</span>
                          <span className="messages-msg-time">{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="messages-input-row">
                <input ref={inputRef} className="messages-input" placeholder={t('writeMessage')}
                  value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} maxLength={2000} />
                <button className="messages-send-btn" onClick={sendMessage} disabled={!input.trim()} aria-label="Send">
                  <SendIcon />
                </button>
              </div>
            </>
          )}
        </main>

        {/* Info panel */}
        {showInfo && activeChat && (
          activeChat.type === 'direct'
            ? <DirectInfoPanel chat={activeChat} online={onlineUsers.has(activeChat.id)} onClose={closeInfo} t={t} />
            : <TeamInfoPanel chat={activeChat} teamDetail={translatedTeamDetail} currentUserId={currentUser?.id}
                onClose={closeInfo} onLeave={handleLeaveTeam} onKick={handleKickMember} t={t} />
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
