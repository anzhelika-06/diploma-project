import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentUser } from '../utils/authUtils';
import { translateStoryContent, detectTextLanguage } from '../utils/translations';
import { getAvailableTeamAvatars } from '../utils/emojiMapper';
import '../styles/pages/TeamsPage.css';

const TeamsPage = () => {
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [activeTab, setActiveTab] = useState('my'); // 'my' или 'all'
  const [myTeams, setMyTeams] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [translatedTeams, setTranslatedTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [reportForm, setReportForm] = useState({ reason: '', description: '', screenshots: [] });
  
  // Форма создания команды
  const teamAvatars = getAvailableTeamAvatars();
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    avatar_emoji: teamAvatars[0].emoji,
    goal_description: '',
    goal_target: 1000
  });
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadMyTeams();
    }
    loadAllTeams();
  }, []); // Убираем currentUser из зависимостей, проверяем его внутри

  // Перевод команд при изменении языка
  useEffect(() => {
    const translateTeams = async () => {
      const teamsToTranslate = activeTab === 'my' ? myTeams : allTeams;
      
      if (teamsToTranslate.length === 0) {
        setTranslatedTeams([]);
        return;
      }

      try {
        const translated = await Promise.all(
          teamsToTranslate.map(async (team) => {
            try {
              // Определяем язык описания
              const descLanguage = team.description ? detectTextLanguage(team.description) : 'ru';
              const goalLanguage = team.goal_description ? detectTextLanguage(team.goal_description) : 'ru';
              const targetLang = currentLanguage.toLowerCase();
              
              let translatedDescription = team.description || '';
              let translatedGoal = team.goal_description || '';
              
              // Переводим описание если нужно
              if (team.description && descLanguage !== targetLang) {
                try {
                  translatedDescription = await translateStoryContent(team.description, currentLanguage, descLanguage);
                } catch (error) {
                  console.warn('⚠️ Ошибка перевода описания команды:', error);
                  translatedDescription = team.description;
                }
              }
              
              // Переводим цель если нужно
              if (team.goal_description && goalLanguage !== targetLang) {
                try {
                  translatedGoal = await translateStoryContent(team.goal_description, currentLanguage, goalLanguage);
                } catch (error) {
                  console.warn('⚠️ Ошибка перевода цели команды:', error);
                  translatedGoal = team.goal_description;
                }
              }
              
              return {
                ...team,
                description: translatedDescription,
                goal_description: translatedGoal
              };
            } catch (error) {
              console.error('❌ Ошибка при переводе команды:', error);
              return team;
            }
          })
        );
        
        setTranslatedTeams(translated);
      } catch (error) {
        console.error('❌ Ошибка при переводе команд:', error);
        setTranslatedTeams(teamsToTranslate);
      }
    };

    translateTeams();
  }, [myTeams, allTeams, currentLanguage, activeTab]);

  const loadMyTeams = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/teams/user/${currentUser.id}`);
      const data = await response.json();
      if (data.success) {
        setMyTeams(data.teams);
      }
    } catch (error) {
      console.error('Ошибка загрузки моих команд:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllTeams = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();
      if (data.success) {
        setAllTeams(data.teams);
      }
    } catch (error) {
      console.error('Ошибка загрузки всех команд:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.name.trim()) {
      setCreateError('Введите название команды');
      return;
    }

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          creator_id: currentUser.id
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setCreateForm({ 
          name: '', 
          description: '', 
          avatar_emoji: teamAvatars[0].emoji,
          goal_description: '',
          goal_target: 1000
        });
        loadMyTeams();
        loadAllTeams();
        setSuccessMessage(t('teamCreatedSuccess'));
        setShowSuccessModal(true);
      } else {
        setCreateError(data.message || 'Ошибка создания команды');
      }
    } catch (error) {
      console.error('Ошибка создания команды:', error);
      setCreateError('Ошибка сервера');
    }
  };

  const handleViewMembers = async (team, e) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    setSelectedTeam(team);
    setShowMembersModal(true);
    
    try {
      const response = await fetch(`/api/teams/${team.id}/members`);
      const data = await response.json();
      if (data.success) {
        setTeamMembers(data.members);
      }
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
    }
  };

  const handleJoinTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id })
      });

      const data = await response.json();
      if (data.success) {
        loadMyTeams();
        loadAllTeams();
        setShowJoinModal(false);
        setSuccessMessage(`${t('teamJoinedSuccess')} "${selectedTeam.name}"!`);
        setShowSuccessModal(true);
        setSelectedTeam(null);
      }
    } catch (error) {
      console.error('Ошибка вступления в команду:', error);
    }
  };

  const handleLeaveTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id })
      });

      const data = await response.json();
      if (data.success) {
        loadMyTeams();
        loadAllTeams();
        setShowLeaveModal(false);
        setSuccessMessage(`${t('teamLeftSuccess')} "${selectedTeam.name}"`);
        setShowSuccessModal(true);
        setSelectedTeam(null);
      }
    } catch (error) {
      console.error('Ошибка выхода из команды:', error);
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    if (!confirm('Удалить участника из команды?')) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setTeamMembers(prev => prev.filter(m => m.user_id !== userId));
        loadMyTeams();
        loadAllTeams();
      }
    } catch (error) {
      console.error('Ошибка удаления участника:', error);
    }
  };

  const handleDeleteTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });

      const data = await response.json();
      if (data.success) {
        loadMyTeams();
        loadAllTeams();
        setShowDeleteModal(false);
        setSuccessMessage(`${t('teamDeletedSuccess')} "${selectedTeam.name}"`);
        setShowSuccessModal(true);
        setSelectedTeam(null);
      }
    } catch (error) {
      console.error('Ошибка удаления команды:', error);
    }
  };

  const handleReportMember = (member) => {
    setSelectedMember(member);
    setShowMembersModal(false);
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!selectedMember || !reportForm.reason || !reportForm.description) {
      return;
    }

    try {
      // Конвертируем скриншоты в base64 если они есть
      const screenshotsBase64 = await Promise.all(
        reportForm.screenshots.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      const response = await fetch(`/api/users/${selectedMember.user_id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: currentUser.id,
          reason: reportForm.reason,
          description: reportForm.description,
          screenshots: screenshotsBase64
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowReportModal(false);
        setSuccessMessage(t('reportSentSuccess'));
        setShowSuccessModal(true);
        setSelectedMember(null);
        setReportForm({ reason: '', description: '', screenshots: [] });
      }
    } catch (error) {
      console.error('Ошибка отправки жалобы:', error);
    }
  };

  const handleScreenshotUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length + reportForm.screenshots.length > 4) {
      return;
    }
    
    setReportForm({
      ...reportForm,
      screenshots: [...reportForm.screenshots, ...validFiles]
    });
  };

  const handleRemoveScreenshot = (index) => {
    setReportForm({
      ...reportForm,
      screenshots: reportForm.screenshots.filter((_, i) => i !== index)
    });
  };

  const handleViewScreenshot = (file) => {
    setSelectedScreenshot({
      url: URL.createObjectURL(file),
      name: file.name
    });
    setShowScreenshotModal(true);
  };

  const handleLeaveTeamFromModal = () => {
    setShowMembersModal(false);
    setShowLeaveModal(true);
  };

  const isTeamMember = (teamId) => {
    return myTeams.some(t => t.id === teamId);
  };

  const isTeamAdmin = (teamId) => {
    const team = myTeams.find(t => t.id === teamId);
    return team && team.role === 'admin';
  };

  if (!currentUser) {
    return (
      <div className="teams-page">
        <div className="teams-empty-state">
          <span className="material-icons">login</span>
          <h3>Требуется авторизация</h3>
          <p>Войдите в систему, чтобы просматривать команды</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teams-page">
      <div className="teams-page-header">
        <h1>{t('teamsPageTitle')}</h1>
        <p>{t('teamsPageSubtitle')}</p>
        <button className="teams-btn-create-team" onClick={() => setShowCreateModal(true)}>
          <span className="material-icons">add</span>
          {t('createTeamButton')}
        </button>
      </div>

      <div className="teams-tabs">
        <button 
          className={`tab ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          <span className="material-icons">groups</span>
          {t('myTeamsTab')} ({myTeams.length})
        </button>
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span className="material-icons">public</span>
          {t('allTeamsTab')} ({allTeams.length})
        </button>
      </div>

      <div className="teams-content">
        {loading ? (
          <div className="teams-loading-state">
            <span className="material-icons spinning">refresh</span>
            <p>Загрузка...</p>
          </div>
        ) : (
          <>
            {activeTab === 'my' && (
              <div className="teams-grid">
                {myTeams.length === 0 ? (
                  <div className="teams-empty-state">
                    <span className="material-icons">group_off</span>
                    <h3>{t('noTeamsYet')}</h3>
                    <p>{t('noTeamsYetDesc')}</p>
                  </div>
                ) : (
                  (translatedTeams.length > 0 ? translatedTeams : myTeams).map(team => (
                    <TeamCard 
                      key={team.id}
                      team={team}
                      isMember={true}
                      isAdmin={team.role === 'admin'}
                      onViewMembers={handleViewMembers}
                      onLeave={(teamId) => {
                        setSelectedTeam(team);
                        setShowLeaveModal(true);
                      }}
                      onDelete={(teamId) => {
                        setSelectedTeam(team);
                        setShowDeleteModal(true);
                      }}
                      onViewProfile={() => navigate(`/profile/${team.id}`)}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'all' && (
              <div className="teams-grid">
                {allTeams.length === 0 ? (
                  <div className="teams-empty-state">
                    <span className="material-icons">search_off</span>
                    <h3>{t('noTeamsExist')}</h3>
                    <p>{t('noTeamsExistDesc')}</p>
                  </div>
                ) : (
                  (translatedTeams.length > 0 ? translatedTeams : allTeams).map(team => (
                    <TeamCard 
                      key={team.id}
                      team={team}
                      isMember={isTeamMember(team.id)}
                      isAdmin={isTeamAdmin(team.id)}
                      onViewMembers={handleViewMembers}
                      onJoin={(teamId) => {
                        setSelectedTeam(team);
                        setShowJoinModal(true);
                      }}
                      onLeave={(teamId) => {
                        setSelectedTeam(team);
                        setShowLeaveModal(true);
                      }}
                      onDelete={(teamId) => {
                        setSelectedTeam(team);
                        setShowDeleteModal(true);
                      }}
                      onViewProfile={() => navigate(`/profile/${team.id}`)}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальное окно создания команды */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-team-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('createTeamTitle')}</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateTeam} className="modal-body">
              <div className="teams-form-group">
                <label>{t('teamNameLabel')}</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  placeholder={t('teamNamePlaceholder')}
                  maxLength={50}
                />
              </div>
              
              <div className="teams-form-group">
                <label>{t('teamDescriptionLabel')}</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  placeholder={t('teamDescriptionPlaceholder')}
                  rows={4}
                  maxLength={500}
                />
              </div>
              
              <div className="teams-form-group">
                <label>{t('teamGoalLabel')}</label>
                <input
                  type="text"
                  value={createForm.goal_description}
                  onChange={(e) => setCreateForm({...createForm, goal_description: e.target.value})}
                  placeholder={t('teamGoalPlaceholder')}
                  maxLength={100}
                />
              </div>
              
              <div className="teams-form-group">
                <label>{t('teamTargetLabel')}</label>
                <input
                  type="number"
                  value={createForm.goal_target}
                  onChange={(e) => setCreateForm({...createForm, goal_target: parseInt(e.target.value) || 0})}
                  placeholder={t('teamTargetPlaceholder')}
                  min="1"
                  max="1000000"
                />
              </div>
              
              <div className="teams-form-group">
                <label>{t('teamIconLabel')}</label>
                <div className="teams-emoji-picker">
                  {teamAvatars.map(({ emoji, name }) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`teams-emoji-option ${createForm.avatar_emoji === emoji ? 'selected' : ''}`}
                      onClick={() => setCreateForm({...createForm, avatar_emoji: emoji})}
                      title={name}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              {createError && <div className="teams-error-message">{createError}</div>}
              
              <div className="modal-footer">
                <button type="button" className="teams-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="teams-btn-primary">
                  {t('createButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно участников */}
      {showMembersModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowMembersModal(false)}>
          <div className="modal-content teams-members-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('teamMembersTitle')} "{selectedTeam.name}"</h2>
              <button className="modal-close" onClick={() => setShowMembersModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="teams-members-list">
                {teamMembers.map(member => (
                  <div key={member.user_id} className="teams-member-card">
                    <div className="teams-member-info" onClick={() => navigate(`/profile/${member.user_id}`)}>
                      <div className="teams-member-avatar">{member.avatar_emoji || '🌱'}</div>
                      <div className="teams-member-details">
                        <span className="teams-member-name">{member.nickname}</span>
                        {member.role === 'admin' ? (
                          <span className="team-admin-badge">{t('adminBadge')}</span>
                        ) : (
                          <span className="team-member-badge">{t('memberBadge')}</span>
                        )}
                      </div>
                    </div>
                    {isTeamAdmin(selectedTeam.id) && member.role !== 'admin' && (
                      <button 
                        className="teams-btn-remove-member"
                        onClick={() => handleRemoveMember(selectedTeam.id, member.user_id)}
                      >
                        <span className="material-icons">person_remove</span>
                      </button>
                    )}
                    {member.user_id !== currentUser.id && (
                      <button 
                        className="teams-btn-report-member"
                        onClick={() => handleReportMember(member)}
                        title={t('reportMember')}
                      >
                        <span className="material-icons">flag</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {isTeamMember(selectedTeam.id) && !isTeamAdmin(selectedTeam.id) && (
                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <button className="teams-btn-danger teams-btn-leave-small" onClick={handleLeaveTeamFromModal}>
                    <span className="material-icons">exit_to_app</span>
                    {t('leaveTeamFromModal')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения вступления */}
      {showJoinModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('joinTeamTitle')}</h2>
              <button className="modal-close" onClick={() => setShowJoinModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p>{t('joinTeamMessage')} <strong>"{selectedTeam.name}"</strong>?</p>
            </div>
            <div className="modal-footer">
              <button className="teams-btn-secondary" onClick={() => setShowJoinModal(false)}>
                {t('cancel')}
              </button>
              <button className="teams-btn-primary" onClick={handleJoinTeam}>
                {t('joinTeamButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения выхода */}
      {showLeaveModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('leaveTeamTitle')}</h2>
              <button className="modal-close" onClick={() => setShowLeaveModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p>{t('leaveTeamMessage')} <strong>"{selectedTeam.name}"</strong>?</p>
            </div>
            <div className="modal-footer">
              <button className="teams-btn-secondary" onClick={() => setShowLeaveModal(false)}>
                {t('cancel')}
              </button>
              <button className="teams-btn-danger" onClick={handleLeaveTeam}>
                {t('leaveTeamButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления команды */}
      {showDeleteModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('deleteTeamTitle')}</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p>{t('deleteTeamMessage')} <strong>"{selectedTeam.name}"</strong>?</p>
              <p style={{ color: '#f44336', marginTop: '10px', fontSize: '14px' }}>
                {t('deleteTeamWarning')}
              </p>
            </div>
            <div className="modal-footer">
              <button className="teams-btn-secondary" onClick={() => setShowDeleteModal(false)}>
                {t('cancel')}
              </button>
              <button className="teams-btn-danger" onClick={handleDeleteTeam}>
                {t('deleteTeamButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно жалобы */}
      {showReportModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('reportModalTitle')}</h2>
              <button className="modal-close" onClick={() => setShowReportModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="report-reason">{t('reportReason')}</label>
                <input
                  id="report-reason"
                  name="report_reason"
                  type="text"
                  value={reportForm.reason}
                  onChange={(e) => setReportForm({...reportForm, reason: e.target.value})}
                  placeholder={t('reportReasonPlaceholder') || 'Укажите причину жалобы'}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="report-description">{t('reportDescription')}</label>
                <textarea
                  id="report-description"
                  name="report_description"
                  value={reportForm.description}
                  onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                  className="form-textarea"
                  rows="4"
                  placeholder={t('reportDescriptionPlaceholder')}
                />
              </div>
              <div className="form-group">
                <label>{t('screenshots')} ({reportForm.screenshots.length}/4)</label>
                <div className="file-input-wrapper">
                  <input
                    id="report-screenshots"
                    name="screenshots"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleScreenshotUpload}
                    className="file-input"
                    disabled={reportForm.screenshots.length >= 4}
                  />
                  <label 
                    htmlFor="report-screenshots" 
                    className={`file-input-label ${reportForm.screenshots.length >= 4 ? 'disabled' : ''}`}
                  >
                    <span className="material-icons">add_photo_alternate</span>
                    <span>{t('addScreenshots') || 'Добавить скриншоты'}</span>
                  </label>
                </div>
                {reportForm.screenshots.length > 0 && (
                  <div className="screenshots-preview">
                    {reportForm.screenshots.map((file, index) => (
                      <div key={index} className="screenshot-item">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Screenshot ${index + 1}`}
                          className="screenshot-preview"
                          onClick={() => handleViewScreenshot(file)}
                          style={{ cursor: 'pointer' }}
                        />
                        <button
                          className="btn-remove-screenshot"
                          onClick={() => handleRemoveScreenshot(index)}
                        >
                          <span className="material-icons">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => {
                setShowReportModal(false);
                setReportForm({ reason: '', description: '', screenshots: [] });
              }}>
                {t('cancel')}
              </button>
              <button className="btn-submit" onClick={handleSubmitReport}>
                {t('submitReport')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно просмотра скриншота */}
      {showScreenshotModal && selectedScreenshot && (
        <div className="modal-overlay" onClick={() => setShowScreenshotModal(false)}>
          <div className="modal-content screenshot-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedScreenshot.name}</h2>
              <button className="modal-close" onClick={() => setShowScreenshotModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="screenshot-modal-body">
              <img 
                src={selectedScreenshot.url} 
                alt="Screenshot" 
                className="screenshot-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно успеха */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content teams-success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="teams-success-header-content">
                <span className="material-icons teams-success-icon">check_circle</span>
                <h2>{t('successTitle')}</h2>
              </div>
              <button className="modal-close" onClick={() => setShowSuccessModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p>{successMessage}</p>
            </div>
            <div className="modal-footer">
              <button className="teams-btn-primary" onClick={() => setShowSuccessModal(false)}>
                {t('closeButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент карточки команды
const TeamCard = ({ team, isMember, isAdmin, onViewMembers, onJoin, onLeave, onDelete, onViewProfile }) => {
  const { t } = useLanguage();
  const progress = team.goal_target > 0 ? Math.min((team.goal_current / team.goal_target) * 100, 100) : 0;
  
  return (
    <div className="team-card">
      <div className="team-header">
        <div className="team-avatar">{team.avatar_emoji}</div>
        <div className="team-info">
          <h3>{team.name}</h3>
          {isAdmin ? (
            <span className="team-admin-badge">{t('adminBadge')}</span>
          ) : isMember ? (
            <span className="team-member-badge">{t('memberBadge')}</span>
          ) : null}
        </div>
        {isAdmin && (
          <button 
            className="teams-btn-delete-team"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(team.id);
            }}
            title={t('deleteTeamButton')}
          >
            <span className="material-icons">delete</span>
          </button>
        )}
      </div>
      
      <p className="team-description">{team.description || t('noTeamsExistDesc')}</p>
      
      {team.goal_description && (
        <div className="team-goal">
          <div className="teams-goal-header">
            <span className="teams-goal-label">{team.goal_description}</span>
            <span className="teams-goal-progress-text">{team.goal_current || 0} / {team.goal_target} {t('kgCO2')}</span>
          </div>
          <div className="teams-progress-bar">
            <div className="teams-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="teams-goal-percentage">{Math.round(progress)}% {t('completed')}</span>
        </div>
      )}
      
      <div className="team-stats">
        <div className="stat">
          <span className="material-icons">people</span>
          <span>{team.member_count} {t('membersCount')}</span>
        </div>
        <div className="stat">
          <span className="material-icons">eco</span>
          <span>{team.carbon_saved} {t('kgCO2')}</span>
        </div>
      </div>
      
      <div className="team-actions">
        <button className="teams-btn-view-members" onClick={(e) => {
          e.stopPropagation();
          onViewMembers(team, e);
        }}>
          <span className="material-icons">group</span>
          {t('membersButton')}
        </button>
        {isMember && !isAdmin ? (
          <button className="teams-btn-leave" onClick={(e) => {
            e.stopPropagation();
            onLeave(team.id);
          }}>
            <span className="material-icons">exit_to_app</span>
            {t('leaveButton')}
          </button>
        ) : !isMember ? (
          <button className="teams-btn-join" onClick={(e) => {
            e.stopPropagation();
            onJoin(team.id);
          }}>
            <span className="material-icons">group_add</span>
            {t('joinButton')}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default TeamsPage;
