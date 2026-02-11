import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentUser } from '../utils/authUtils';
import { translateStoryContent, detectTextLanguage } from '../utils/translations';
import io from 'socket.io-client';
import '../styles/pages/FeedPage.css';

const FeedPage = () => {
  const { t, currentLanguage } = useLanguage();
  const currentUser = getCurrentUser();
  const navigate = useNavigate();
  
  // Проверка авторизации
  useEffect(() => {
    if (!currentUser) {
      navigate('/auth');
    }
  }, [currentUser, navigate]);
  
  const [posts, setPosts] = useState([]);
  const [translatedPosts, setTranslatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Состояние для создания поста
  const [newPost, setNewPost] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Состояние для комментариев
  const [expandedPost, setExpandedPost] = useState(null);
  const [comments, setComments] = useState({});
  const [translatedComments, setTranslatedComments] = useState({});
  const [newComment, setNewComment] = useState({});
  
  // Состояние для меню и модалок
  const [openMenu, setOpenMenu] = useState(null);
  const [openCommentMenu, setOpenCommentMenu] = useState(null);
  const [commentMenuPosition, setCommentMenuPosition] = useState({ top: 0, left: 0 });
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingUserId, setReportingUserId] = useState(null);
  const [reportForm, setReportForm] = useState({ reason: '', description: '', screenshots: [] });
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({ title: '', message: '', onConfirm: null });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Состояние для перехода к профилю
  const [targetUserId, setTargetUserId] = useState(null);

  // Загрузка постов
  const loadPosts = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/posts/feed?page=${pageNum}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (pageNum === 1) {
          setPosts(data.posts);
        } else {
          setPosts(prev => [...prev, ...data.posts]);
        }
        setHasMore(data.pagination.page < data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
      setError(t('errorLoadingPosts') || 'Ошибка загрузки постов');
    } finally {
      setLoading(false);
    }
  }, [t]);

  // WebSocket для real-time обновлений
  useEffect(() => {
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    socket.on('connect', () => {
      console.log('✅ FeedPage: WebSocket подключен, ID:', socket.id);
      // Аутентификация
      socket.emit('authenticate', {
        userId: currentUser?.id,
        nickname: currentUser?.nickname
      });
    });
    
    socket.on('authenticated', (data) => {
      console.log('✅ FeedPage: Аутентификация успешна:', data);
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ FeedPage: Ошибка подключения WebSocket:', error);
    });
    
    // Обработчики событий постов
    socket.on('post:created', (data) => {
      console.log('📝 FeedPage: Новый пост создан:', data);
      const post = data.post || data;
      setPosts(prev => {
        // Проверяем, не добавлен ли уже этот пост
        if (prev.some(p => p.id === post.id)) {
          console.log('   ⚠️ Пост уже существует, пропускаем');
          return prev;
        }
        console.log('   ✅ Добавляем новый пост в начало ленты');
        return [post, ...prev];
      });
    });
    
    socket.on('post:deleted', (data) => {
      console.log('🗑️ FeedPage: Пост удален:', data);
      console.log('   postId:', data.postId, 'type:', typeof data.postId);
      setPosts(prev => {
        const filtered = prev.filter(p => Number(p.id) !== Number(data.postId));
        console.log('   Постов до удаления:', prev.length, 'после:', filtered.length);
        return filtered;
      });
    });
    
    socket.on('post:like:update', (data) => {
      console.log('❤️ FeedPage: Лайк обновлен:', data);
      console.log('   Обновляем пост с ID:', data.postId, 'новый счетчик:', data.likesCount);
      setPosts(prev => {
        const updated = prev.map(p => {
          if (Number(p.id) === Number(data.postId)) {
            console.log('   ✅ Найден пост, обновляем:', p.id);
            return { 
              ...p, 
              likes_count: data.likesCount,
              user_liked: Number(data.likerId) === Number(currentUser?.id) ? data.isLiked : p.user_liked
            };
          }
          return p;
        });
        return updated;
      });
    });
    
    socket.on('post:comment:added', (data) => {
      console.log('💬 FeedPage: Комментарий добавлен:', data);
      console.log('   К посту ID:', data.postId, 'комментарий:', data.comment?.content);
      
      // Обновляем список комментариев, если пост раскрыт
      if (data.comment) {
        setComments(prev => {
          const updated = {
            ...prev,
            [data.postId]: [...(prev[data.postId] || []), data.comment]
          };
          console.log('   Обновленные комментарии для поста', data.postId, ':', updated[data.postId].length);
          return updated;
        });
      }
      
      // Обновляем счетчик комментариев
      setPosts(prev => {
        const updated = prev.map(p => {
          if (Number(p.id) === Number(data.postId)) {
            console.log('   ✅ Увеличиваем счетчик комментариев для поста', p.id);
            return { ...p, comments_count: (p.comments_count || 0) + 1 };
          }
          return p;
        });
        return updated;
      });
    });
    
    socket.on('post:comment:deleted', (data) => {
      console.log('🗑️ FeedPage: Комментарий удален:', data);
      console.log('   Из поста ID:', data.postId, 'комментарий ID:', data.commentId);
      
      // Удаляем комментарий из списка
      setComments(prev => {
        const updated = {
          ...prev,
          [data.postId]: (prev[data.postId] || []).filter(c => Number(c.id) !== Number(data.commentId))
        };
        console.log('   Осталось комментариев для поста', data.postId, ':', updated[data.postId]?.length || 0);
        return updated;
      });
      
      // Уменьшаем счетчик комментариев
      setPosts(prev => {
        const updated = prev.map(p => {
          if (Number(p.id) === Number(data.postId)) {
            console.log('   ✅ Уменьшаем счетчик комментариев для поста', p.id);
            return { ...p, comments_count: Math.max(0, Number(p.comments_count || 0) - 1) };
          }
          return p;
        });
        return updated;
      });
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 FeedPage: WebSocket отключен:', reason);
    });
    
    return () => {
      console.log('🔌 FeedPage: закрытие WebSocket');
      socket.disconnect();
    };
  }, [currentUser]);

  // Закрытие меню при клике вне его или при скролле
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenu !== null && !event.target.closest('.post-menu')) {
        setOpenMenu(null);
      }
      if (openCommentMenu !== null && !event.target.closest('.comment-menu')) {
        setOpenCommentMenu(null);
      }
    };

    const handleScroll = () => {
      if (openMenu !== null) {
        setOpenMenu(null);
      }
      if (openCommentMenu !== null) {
        setOpenCommentMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true); // true для capture phase
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openMenu, openCommentMenu]);

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  // Перевод постов при изменении языка или постов
  useEffect(() => {
    const translatePosts = async () => {
      if (posts.length === 0) {
        setTranslatedPosts([]);
        return;
      }

      try {
        const translated = await Promise.all(
          posts.map(async (post) => {
            try {
              const contentLanguage = detectTextLanguage(post.content);
              const targetLang = currentLanguage.toLowerCase();
              
              let translatedContent = post.content;
              
              if (contentLanguage !== targetLang) {
                try {
                  translatedContent = await translateStoryContent(post.content, currentLanguage, contentLanguage);
                } catch (error) {
                  console.warn('⚠️ Ошибка перевода поста:', error);
                  translatedContent = post.content;
                }
              }

              return {
                ...post,
                content: translatedContent
              };
            } catch (error) {
              console.error('❌ Ошибка при переводе поста:', error);
              return post;
            }
          })
        );
        
        setTranslatedPosts(translated);
      } catch (error) {
        console.error('❌ Ошибка при переводе постов:', error);
        setTranslatedPosts(posts);
      }
    };

    translatePosts();
  }, [posts, currentLanguage]);

  // Перевод комментариев при изменении языка или комментариев
  useEffect(() => {
    const translateAllComments = async () => {
      if (Object.keys(comments).length === 0) {
        setTranslatedComments({});
        return;
      }

      try {
        const translatedCommentsObj = {};
        
        for (const postId in comments) {
          const postComments = comments[postId];
          
          const translated = await Promise.all(
            postComments.map(async (comment) => {
              try {
                const contentLanguage = detectTextLanguage(comment.content);
                const targetLang = currentLanguage.toLowerCase();
                
                let translatedContent = comment.content;
                
                if (contentLanguage !== targetLang) {
                  try {
                    translatedContent = await translateStoryContent(comment.content, currentLanguage, contentLanguage);
                  } catch (error) {
                    console.warn('⚠️ Ошибка перевода комментария:', error);
                    translatedContent = comment.content;
                  }
                }

                return {
                  ...comment,
                  content: translatedContent
                };
              } catch (error) {
                console.error('❌ Ошибка при переводе комментария:', error);
                return comment;
              }
            })
          );
          
          translatedCommentsObj[postId] = translated;
        }
        
        setTranslatedComments(translatedCommentsObj);
      } catch (error) {
        console.error('❌ Ошибка при переводе комментариев:', error);
        setTranslatedComments(comments);
      }
    };

    translateAllComments();
  }, [comments, currentLanguage]);

  // Создание поста
  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    
    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newPost })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNewPost('');
        // Не добавляем пост вручную, WebSocket сделает это автоматически
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setErrorMessage(t('error') || 'Ошибка при создании поста');
      setShowErrorModal(true);
    } finally {
      setCreating(false);
    }
  };

  // Лайк поста
  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, user_liked: data.liked, likes_count: data.likesCount }
            : p
        ));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  // Загрузка комментариев
  const loadComments = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      const data = await response.json();
      
      if (data.success) {
        setComments(prev => ({ ...prev, [postId]: data.comments }));
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  // Добавление комментария
  const handleAddComment = async (postId) => {
    if (!newComment[postId]?.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment[postId] })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment]
        }));
        setNewComment(prev => ({ ...prev, [postId]: '' }));
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        ));
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  // Открыть модалку удаления поста
  const handleDeletePostClick = (postId) => {
    setConfirmModalData({
      title: t('confirmDeletePost') || 'Удалить пост?',
      message: t('confirmDeletePostMessage') || 'Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить.',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          
          const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          
          if (data.success) {
            setPosts(prev => prev.filter(p => p.id !== postId));
          } else {
            setErrorMessage(data.message || t('error') || 'Ошибка при удалении поста');
            setShowErrorModal(true);
          }
        } catch (err) {
          console.error('Error deleting post:', err);
          setErrorMessage(t('error') || 'Ошибка при удалении поста');
          setShowErrorModal(true);
        }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
    setOpenMenu(null);
  };

  // Переход к профилю
  const goToProfile = (userId) => {
    console.log('🔄 FeedPage: переход к профилю пользователя', userId);
    setTargetUserId(userId);
    setOpenMenu(null);
  };

  // Эффект для перехода к профилю
  useEffect(() => {
    if (targetUserId !== null) {
      console.log('   Переход на /profile с userId:', targetUserId);
      navigate('/profile', { state: { viewUserId: targetUserId } });
      setTargetUserId(null);
    }
  }, [targetUserId, navigate]);

  // Открыть модалку жалобы
  const handleReport = (userId) => {
    setReportingUserId(userId);
    setShowReportModal(true);
    setOpenMenu(null);
  };

  // Загрузка скриншотов
  const handleScreenshotUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length + reportForm.screenshots.length > 4) {
      setErrorMessage(t('maxScreenshots') || 'Максимум 4 скриншота');
      setShowErrorModal(true);
      return;
    }
    
    setReportForm({
      ...reportForm,
      screenshots: [...reportForm.screenshots, ...validFiles]
    });
  };

  // Удалить скриншот
  const handleRemoveScreenshot = (index) => {
    setReportForm({
      ...reportForm,
      screenshots: reportForm.screenshots.filter((_, i) => i !== index)
    });
  };

  // Просмотр скриншота
  const handleViewScreenshot = (file) => {
    setSelectedScreenshot({
      url: URL.createObjectURL(file),
      name: file.name
    });
    setShowScreenshotModal(true);
  };

  // Отправить жалобу
  const handleSubmitReport = async () => {
    if (!reportForm.reason || !reportForm.description) {
      setErrorMessage(t('fillAllFields') || 'Заполните все поля');
      setShowErrorModal(true);
      return;
    }
    
    try {
      // Конвертируем скриншоты в base64
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
      
      const response = await fetch(`/api/users/${reportingUserId}/report`, {
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
        setSuccessMessage(t('reportSent') || 'Жалоба отправлена');
        setShowSuccessModal(true);
        setShowReportModal(false);
        setReportForm({ reason: '', description: '', screenshots: [] });
        setReportingUserId(null);
      } else {
        setErrorMessage(data.message || t('error') || 'Ошибка при отправке жалобы');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setErrorMessage(t('error') || 'Ошибка при отправке жалобы');
      setShowErrorModal(true);
    }
  };

  // Открыть меню комментария с правильным позиционированием
  const handleCommentMenuClick = (commentId, event) => {
    event.stopPropagation();
    
    if (openCommentMenu === commentId) {
      setOpenCommentMenu(null);
      return;
    }
    
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Позиционируем меню под кнопкой, справа
    const top = rect.bottom + 4;
    const left = rect.right - 160; // 160px - ширина меню
    
    setCommentMenuPosition({
      top: top,
      left: Math.max(10, left) // Минимум 10px от левого края
    });
    
    setOpenCommentMenu(commentId);
  };

  // Открыть модалку удаления комментария
  const handleDeleteCommentClick = (postId, commentId) => {
    setConfirmModalData({
      title: t('confirmDeleteComment') || 'Удалить комментарий?',
      message: t('confirmDeleteCommentMessage') || 'Вы уверены, что хотите удалить этот комментарий? Это действие нельзя отменить.',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          
          const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          
          if (data.success) {
            setComments(prev => ({
              ...prev,
              [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
            }));
            setPosts(prev => prev.map(p => 
              p.id === postId ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p
            ));
          } else {
            setErrorMessage(data.message || t('error') || 'Ошибка при удалении комментария');
            setShowErrorModal(true);
          }
        } catch (err) {
          console.error('Error deleting comment:', err);
          setErrorMessage(t('error') || 'Ошибка при удалении комментария');
          setShowErrorModal(true);
        }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
    setOpenCommentMenu(null);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return t('justNow') || 'Только что';
    if (minutes < 60) return `${minutes} ${t('minutesAgo') || 'мин назад'}`;
    if (hours < 24) return `${hours} ${t('hoursAgo') || 'ч назад'}`;
    if (days < 7) return `${days} ${t('daysAgo') || 'д назад'}`;
    
    return date.toLocaleDateString();
  };

  if (loading && posts.length === 0) {
    return (
      <div className="feed-page">
        <div className="feed-loading">
          <div className="spinner"></div>
          <p>{t('loading') || 'Загрузка...'}</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="feed-page">
      <div className="feed-container">
        <div className="feed-header">
          <h1>{t('feed') || 'Лента новостей'}</h1>
        </div>

        {/* Форма создания поста */}
        <div className="create-post">
          <textarea
            className="post-textarea"
            placeholder={t('whatsOnYourMind') || 'Что у вас нового?'}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows={3}
          />
          <button
            className="btn-post"
            onClick={handleCreatePost}
            disabled={creating || !newPost.trim()}
          >
            <span className="material-icons">send</span>
            {creating ? (t('posting') || 'Публикация...') : (t('publish') || 'Опубликовать')}
          </button>
        </div>

        {/* Лента постов */}
        <div className="posts-list">
          {translatedPosts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-author">
                  <span 
                    className="author-avatar"
                    onClick={() => goToProfile(post.user_id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {post.avatar_emoji || '👤'}
                  </span>
                  <div onClick={() => goToProfile(post.user_id)} style={{ cursor: 'pointer' }}>
                    <span className="author-name">{post.nickname}</span>
                    <span className="post-date">{formatDate(post.created_at)}</span>
                  </div>
                </div>
                
                <div className="post-menu">
                  <button
                    className="menu-btn"
                    onClick={() => setOpenMenu(openMenu === post.id ? null : post.id)}
                  >
                    <span className="material-icons">more_vert</span>
                  </button>
                  
                  {openMenu === post.id && (
                    <div className="post-menu-dropdown">
                      <button onClick={() => goToProfile(post.user_id)}>
                        <span className="material-icons">person</span>
                        {t('viewProfile') || 'Профиль'}
                      </button>
                      {post.user_id !== currentUser?.id && (
                        <button onClick={() => handleReport(post.user_id)}>
                          <span className="material-icons">report</span>
                          {t('report') || 'Пожаловаться'}
                        </button>
                      )}
                      {post.user_id === currentUser?.id && (
                        <button onClick={() => handleDeletePostClick(post.id)} className="delete-btn">
                          <span className="material-icons">delete</span>
                          {t('delete') || 'Удалить'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="post-content">
                <p>{post.content}</p>
              </div>

              <div className="post-actions">
                <button
                  className={`btn-like ${post.user_liked ? 'liked' : ''}`}
                  onClick={() => handleLike(post.id)}
                >
                  <span className="material-icons">
                    {post.user_liked ? 'favorite' : 'favorite_border'}
                  </span>
                  <span>{post.likes_count || 0}</span>
                </button>
                
                <button
                  className="btn-comment"
                  onClick={() => {
                    if (expandedPost === post.id) {
                      setExpandedPost(null);
                    } else {
                      setExpandedPost(post.id);
                      if (!comments[post.id]) {
                        loadComments(post.id);
                      }
                    }
                  }}
                >
                  <span className="material-icons">comment</span>
                  <span>{post.comments_count || 0}</span>
                </button>
              </div>

              {/* Комментарии */}
              {expandedPost === post.id && (
                <div className="comments-section">
                  <div className="comments-list">
                    {(translatedComments[post.id] || comments[post.id] || []).map(comment => (
                      <div key={comment.id} className="comment">
                        <span 
                          className="comment-avatar"
                          onClick={() => goToProfile(comment.user_id)}
                          style={{ cursor: 'pointer' }}
                        >
                          {comment.avatar_emoji || '👤'}
                        </span>
                        <div className="comment-content">
                          <span 
                            className="comment-author"
                            onClick={() => goToProfile(comment.user_id)}
                            style={{ cursor: 'pointer' }}
                          >
                            {comment.nickname}
                          </span>
                          <p>{comment.content}</p>
                        </div>
                        
                        {/* Меню комментария */}
                        <div className="comment-menu">
                          <button
                            className="comment-menu-btn"
                            onClick={(e) => handleCommentMenuClick(comment.id, e)}
                          >
                            <span className="material-icons">more_vert</span>
                          </button>
                          
                          {openCommentMenu === comment.id && (
                            <div 
                              className="comment-menu-dropdown"
                              style={{
                                top: `${commentMenuPosition.top}px`,
                                left: `${commentMenuPosition.left}px`
                              }}
                            >
                              <button onClick={() => {
                                goToProfile(comment.user_id);
                                setOpenCommentMenu(null);
                              }}>
                                <span className="material-icons">person</span>
                                {t('viewProfile') || 'Профиль'}
                              </button>
                              {comment.user_id !== currentUser?.id && (
                                <button onClick={() => {
                                  handleReport(comment.user_id);
                                  setOpenCommentMenu(null);
                                }}>
                                  <span className="material-icons">report</span>
                                  {t('report') || 'Пожаловаться'}
                                </button>
                              )}
                              {comment.user_id === currentUser?.id && (
                                <button 
                                  onClick={() => handleDeleteCommentClick(post.id, comment.id)} 
                                  className="delete-btn"
                                >
                                  <span className="material-icons">delete</span>
                                  {t('delete') || 'Удалить'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="add-comment">
                    <input
                      type="text"
                      className="comment-input"
                      placeholder={t('writeComment') || 'Написать комментарий...'}
                      value={newComment[post.id] || ''}
                      onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddComment(post.id);
                        }
                      }}
                    />
                    <button
                      className="btn-send-comment"
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComment[post.id]?.trim()}
                    >
                      <span className="material-icons">send</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {hasMore && !loading && (
          <button
            className="load-more-btn"
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              loadPosts(nextPage);
            }}
          >
            {t('loadMore') || 'Загрузить еще'}
          </button>
        )}

        {error && <div className="feed-error">{error}</div>}
      </div>

      {/* Модальное окно жалобы */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('reportModalTitle') || 'Пожаловаться на пользователя'}</h2>
              <button className="modal-close" onClick={() => setShowReportModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>{t('reportReason') || 'Причина жалобы'}</label>
                <input
                  type="text"
                  value={reportForm.reason}
                  onChange={(e) => setReportForm({...reportForm, reason: e.target.value})}
                  placeholder={t('reportReasonPlaceholder') || 'Укажите причину'}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>{t('reportDescription') || 'Описание'}</label>
                <textarea
                  value={reportForm.description}
                  onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                  className="form-textarea"
                  rows="4"
                  placeholder={t('reportDescriptionPlaceholder') || 'Опишите проблему подробнее'}
                />
              </div>
              <div className="form-group">
                <label>{t('screenshots') || 'Скриншоты'} ({reportForm.screenshots.length}/4)</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleScreenshotUpload}
                    className="file-input"
                    id="report-screenshots"
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
              <button className="btn-cancel" onClick={() => setShowReportModal(false)}>
                {t('cancel') || 'Отмена'}
              </button>
              <button className="btn-submit" onClick={handleSubmitReport}>
                {t('submitReport') || 'Отправить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно просмотра скриншота */}
      {showScreenshotModal && selectedScreenshot && (
        <div className="modal-overlay" onClick={() => setShowScreenshotModal(false)}>
          <div className="screenshot-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowScreenshotModal(false)}>
              <span className="material-icons">close</span>
            </button>
            <img src={selectedScreenshot.url} alt={selectedScreenshot.name} />
          </div>
        </div>
      )}

      {/* Модальное окно ошибки */}
      {showErrorModal && (
        <div className="modal-overlay" onClick={() => setShowErrorModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('error') || 'Ошибка'}</h2>
              <button className="modal-close" onClick={() => setShowErrorModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p>{errorMessage}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-submit" onClick={() => setShowErrorModal(false)}>
                {t('ok') || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно успеха */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('success') || 'Успешно'}</h2>
              <button className="modal-close" onClick={() => setShowSuccessModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p>{successMessage}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-submit" onClick={() => setShowSuccessModal(false)}>
                {t('ok') || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{confirmModalData.title}</h2>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p>{confirmModalData.message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowConfirmModal(false)}>
                {t('cancel') || 'Отмена'}
              </button>
              <button className="btn-submit btn-danger" onClick={confirmModalData.onConfirm}>
                {t('confirm') || 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FeedPage;
