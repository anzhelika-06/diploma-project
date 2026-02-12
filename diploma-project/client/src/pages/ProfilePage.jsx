import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import '../styles/pages/ProfilePage.css';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentUser } from '../utils/authUtils';
import { useEventTracker } from '../hooks/useEventTracker';
import { translateStoryContent, detectTextLanguage, translateEcoLevel } from '../utils/translations';

const ProfilePage = () => {
  const { t, currentLanguage } = useLanguage();
  const { trackEvent } = useEventTracker();
  const { userId: urlUserId } = useParams();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  const { socket, isConnected } = useSocket(); // Используем глобальный socket
  
  console.log('🔄 ProfilePage рендер');
  console.log('   urlUserId из URL:', urlUserId, 'type:', typeof urlUserId);
  console.log('   currentUserId:', currentUserId, 'type:', typeof currentUserId);
  console.log('   location.state:', location.state);
  
  // Флаг для отслеживания программного изменения viewingUserId (не через URL)
  const isInternalNavigation = useRef(false);
  
  // ID профиля, который сейчас просматриваем (всегда число)
  const [viewingUserId, setViewingUserId] = useState(() => {
    // Приоритет: state из навигации > URL параметр > текущий пользователь
    const id = location.state?.viewUserId || urlUserId || currentUserId;
    console.log('   Инициализация viewingUserId:', id ? Number(id) : null);
    return id ? Number(id) : null;
  });
  
  const [profileData, setProfileData] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Посты
  const [posts, setPosts] = useState([]);
  const [translatedPosts, setTranslatedPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});
  const [translatedComments, setTranslatedComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [postsPage, setPostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  
  // Дружба
  const [friendshipStatus, setFriendshipStatus] = useState('none');
  const [friendshipId, setFriendshipId] = useState(null);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [friendsListOwnerId, setFriendsListOwnerId] = useState(null); // ID пользователя, чей список друзей мы смотрим
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  
  // Модальные окна
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingUserId, setReportingUserId] = useState(null); // ID пользователя, на которого жалуемся
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [confirmModalData, setConfirmModalData] = useState({ title: '', message: '', onConfirm: null });
  const [errorModalData, setErrorModalData] = useState({ title: '', message: '' });
  const [successModalData, setSuccessModalData] = useState({ title: '', message: '' });
  const [reportForm, setReportForm] = useState({ reason: '', description: '', screenshots: [] });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [editForm, setEditForm] = useState({
    nickname: '',
    bio: '',
    goal: '',
    date_of_birth: '',
    gender_id: null
  });
  
  const [dateError, setDateError] = useState('');

  // WebSocket обработчики
  useEffect(() => {
    if (!socket || !currentUserId) return;

    console.log('📡 ProfilePage: Подключение обработчиков к глобальному socket');
    
    // Обработчики событий постов
    socket.on('post:created', (data) => {
      console.log('📝 Новый пост создан:', data);
      // Обновляем посты
      setPosts(prev => {
        // Проверяем, не добавлен ли уже этот пост
        if (prev.some(p => p.id === data.post.id)) {
          return prev;
        }
        return [data.post, ...prev];
      });
    });
    
    socket.on('post:deleted', (data) => {
      console.log('🗑️ Пост удален:', data);
      console.log('   postId:', data.postId, 'type:', typeof data.postId);
      setPosts(prev => {
        const filtered = prev.filter(p => Number(p.id) !== Number(data.postId));
        console.log('   Постов до удаления:', prev.length, 'после:', filtered.length);
        return filtered;
      });
    });
    
    socket.on('post:like:update', (data) => {
      console.log('❤️ Лайк обновлен:', data);
      console.log('   Обновляем пост с ID:', data.postId, 'новый счетчик:', data.likesCount);
      setPosts(prev => {
        const updated = prev.map(p => {
          if (Number(p.id) === Number(data.postId)) {
            console.log('   ✅ Найден пост, обновляем:', p.id);
            return { 
              ...p, 
              likes_count: data.likesCount, 
              is_liked: Number(data.likerId) === Number(currentUserId) ? data.isLiked : p.is_liked 
            };
          }
          return p;
        });
        console.log('   Обновленные посты:', updated.map(p => ({ id: p.id, likes: p.likes_count })));
        return updated;
      });
    });
    
    socket.on('post:comment:added', (data) => {
      console.log('💬 Комментарий добавлен:', data);
      console.log('   К посту ID:', data.postId, 'комментарий:', data.comment.content);
      setComments(prev => {
        const updated = {
          ...prev,
          [data.postId]: [...(prev[data.postId] || []), data.comment]
        };
        console.log('   Обновленные комментарии для поста', data.postId, ':', updated[data.postId].length);
        return updated;
      });
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
      console.log('🗑️ Комментарий удален:', data);
      console.log('   Из поста ID:', data.postId, 'комментарий ID:', data.commentId);
      setComments(prev => {
        const updated = {
          ...prev,
          [data.postId]: (prev[data.postId] || []).filter(c => Number(c.id) !== Number(data.commentId))
        };
        console.log('   Осталось комментариев для поста', data.postId, ':', updated[data.postId].length);
        return updated;
      });
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
    
    // Обработчики событий дружбы
    socket.on('friendship:request', (data) => {
      console.log('👥 Запрос в друзья:', data);
      if (data.toUserId === currentUserId) {
        setFriendshipStatus('pending_received');
        // Увеличиваем счетчик запросов и перезагружаем список
        setFriendRequestsCount(prev => prev + 1);
        loadFriendRequests();
      }
    });
    
    socket.on('friendship:accepted', (data) => {
      console.log('✅ Дружба принята:', data);
      setFriendshipStatus('accepted');
      // Обновляем счетчик друзей
      setProfileData(prev => prev ? ({
        ...prev,
        friends_count: (prev.friends_count || 0) + 1
      }) : prev);
      // Уменьшаем счетчик запросов если это мы приняли
      if (data.userId === currentUserId || data.friendId === currentUserId) {
        setFriendRequestsCount(prev => Math.max(0, prev - 1));
      }
    });
    
    socket.on('friendship:rejected', (data) => {
      console.log('❌ Запрос в друзья отклонен:', data);
      // Если нам отклонили запрос, возвращаем кнопку "Добавить в друзья"
      if (data.fromUserId === currentUserId) {
        setFriendshipStatus('none');
        setFriendshipId(null);
      }
      // Если мы отклонили, уменьшаем счетчик запросов
      if (data.toUserId === currentUserId) {
        setFriendRequestsCount(prev => Math.max(0, prev - 1));
      }
    });
    
    socket.on('friendship:removed', (data) => {
      console.log('❌ Дружба удалена:', data);
      if (data.userId === currentUserId || data.friendId === currentUserId) {
        setFriendshipStatus('none');
        // Обновляем счетчик друзей
        setProfileData(prev => prev ? ({
          ...prev,
          friends_count: Math.max(0, (prev.friends_count || 0) - 1)
        }) : prev);
      }
    });
    
    return () => {
      console.log('🔌 ProfilePage: отключение обработчиков');
      socket.off('post:created');
      socket.off('post:deleted');
      socket.off('post:like:update');
      socket.off('post:comment:added');
      socket.off('post:comment:deleted');
      socket.off('friendship:request');
      socket.off('friendship:accepted');
      socket.off('friendship:rejected');
      socket.off('friendship:removed');
    };
  }, [socket, currentUserId]); // Переподключаем обработчики при смене socket

  // Функция для загрузки всех данных профиля
  const loadProfileData = useCallback(async (targetUserId) => {
    if (!targetUserId) return;
    
    console.log('📥 Загрузка профиля для userId:', targetUserId, 'currentUserId:', currentUserId);
    
    const isOwn = Number(targetUserId) === Number(currentUserId);
    setIsOwnProfile(isOwn);
    
    try {
      setLoading(true);
      
      // Загрузка профиля с передачей currentUserId для подсчета общих друзей
      const profileUrl = currentUserId 
        ? `/api/users/${targetUserId}/profile?currentUserId=${currentUserId}`
        : `/api/users/${targetUserId}/profile`;
      const profileResponse = await fetch(profileUrl);
      const profileData = await profileResponse.json();
      
      if (profileData.success) {
        console.log('✅ Профиль загружен:', profileData.user.nickname);
        // Преобразуем счетчики в числа
        setProfileData({
          ...profileData.user,
          friends_count: Number(profileData.user.friends_count) || 0,
          teams_count: Number(profileData.user.teams_count) || 0,
          posts_count: Number(profileData.user.posts_count) || 0,
          mutual_friends_count: Number(profileData.user.mutual_friends_count) || 0
        });
        
        // Форматируем дату в ДД/ММ/ГГГГ (только дата, без времени)
        const dob = profileData.user.date_of_birth || '';
        let formattedDate = '';
        if (dob) {
          // Берем только первые 10 символов (YYYY-MM-DD), игнорируя время
          const dateOnly = dob.split('T')[0];
          const [year, month, day] = dateOnly.split('-');
          formattedDate = `${day}/${month}/${year}`;
        }
        
        setEditForm({
          nickname: profileData.user.nickname || '',
          bio: profileData.user.bio || '',
          goal: profileData.user.goal || '',
          date_of_birth: formattedDate,
          gender_id: profileData.user.gender_id || null
        });
      }
      
      // Загрузка постов
      const postsResponse = await fetch(`/api/users/${targetUserId}/posts?page=1&limit=10`);
      const postsData = await postsResponse.json();
      
      if (postsData.success) {
        console.log('✅ Посты загружены:', postsData.posts.length);
        setPosts(postsData.posts);
        setPostsPage(1);
        setHasMorePosts(postsData.pagination && postsData.pagination.page < postsData.pagination.totalPages);
      }
      
      // Загрузка статуса дружбы
      if (!isOwn && currentUserId) {
        console.log('🔍 Загружаем статус дружбы для:', { currentUserId, targetUserId });
        const friendshipResponse = await fetch(`/api/users/${currentUserId}/friends/status/${targetUserId}`);
        const friendshipData = await friendshipResponse.json();
        
        console.log('📊 Ответ API статуса дружбы:', friendshipData);
        
        if (friendshipData.success) {
          console.log('✅ Статус дружбы:', friendshipData.status);
          setFriendshipStatus(friendshipData.status);
          setFriendshipId(friendshipData.friendshipId);
        } else {
          console.log('⚠️ API вернул success: false, устанавливаем статус none');
          setFriendshipStatus('none');
          setFriendshipId(null);
        }
      } else {
        console.log('ℹ️ Свой профиль или нет currentUserId, статус: none');
        setFriendshipStatus('none');
        setFriendshipId(null);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных профиля:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]); // Убрали trackEvent из зависимостей

  // Загрузка данных профиля при изменении viewingUserId
  useEffect(() => {
    console.log('🔄 useEffect [viewingUserId] сработал. viewingUserId:', viewingUserId);
    if (viewingUserId) {
      console.log('   ✅ Вызываем loadProfileData для userId:', viewingUserId);
      loadProfileData(viewingUserId);
    } else {
      console.log('   ⚠️ viewingUserId пустой, пропускаем загрузку');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingUserId]); // Убрали loadProfileData из зависимостей
  
  // Обновляем viewingUserId при изменении URL или state
  useEffect(() => {
    // Если это внутренняя навигация (клик по кнопке), пропускаем
    if (isInternalNavigation.current) {
      console.log('⏭️ Пропускаем useEffect - это внутренняя навигация');
      isInternalNavigation.current = false;
      return;
    }
    
    // Приоритет: state из навигации > URL параметр > текущий пользователь
    const newUserId = Number(location.state?.viewUserId || urlUserId || currentUserId);
    console.log('🔄 useEffect [location.state, urlUserId, currentUserId] сработал');
    console.log('   location.state?.viewUserId:', location.state?.viewUserId);
    console.log('   urlUserId:', urlUserId);
    console.log('   currentUserId:', currentUserId);
    console.log('   newUserId:', newUserId);
    console.log('   Текущий viewingUserId:', viewingUserId);
    
    // Обновляем только если изменился
    if (newUserId && newUserId !== viewingUserId) {
      console.log('✅ Меняем viewingUserId на:', newUserId);
      setViewingUserId(newUserId);
    }
  }, [location.state, urlUserId, currentUserId, viewingUserId]);

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

  const loadFriendsList = useCallback(async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}/friends`);
      const data = await response.json();
      
      if (data.success) {
        setFriendsList(data.friends);
        setFriendsListOwnerId(userId);
        setShowFriendsList(true);
      }
    } catch (error) {
      console.error('Ошибка загрузки списка друзей:', error);
    }
  }, []);

  const loadFriendRequests = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      const response = await fetch(`/api/users/${currentUserId}/friends/requests/incoming`);
      const data = await response.json();
      
      if (data.success) {
        setFriendRequests(data.requests);
        setFriendRequestsCount(data.requests.length);
      }
    } catch (error) {
      console.error('Ошибка загрузки запросов в друзья:', error);
    }
  }, [currentUserId]);

  // Загружаем запросы в друзья при монтировании
  useEffect(() => {
    if (currentUserId) {
      loadFriendRequests();
    }
  }, [currentUserId, loadFriendRequests]);

  const handleSendFriendRequest = async () => {
    try {
      const response = await fetch(`/api/users/${currentUser.id}/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: profileData.id })
      });
      
      const data = await response.json();
      if (data.success) {
        setFriendshipStatus('pending_sent');
        setFriendshipId(data.friendship.id);
        trackEvent('friend_request_sent', {
          userId: currentUser.id,
          friendId: profileData.id
        });
      }
    } catch (error) {
      console.error('Ошибка отправки запроса:', error);
    }
  };

  const handleAcceptFriendRequest = async () => {
    try {
      const response = await fetch(`/api/users/${currentUser.id}/friends/${friendshipId}/accept`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      if (data.success) {
        setFriendshipStatus('accepted');
        // Счетчик друзей обновится через WebSocket событие 'friendship:accepted'
        trackEvent('friend_request_accepted', {
          userId: currentUser.id,
          friendId: profileData.id
        });
      }
    } catch (error) {
      console.error('Ошибка принятия запроса:', error);
    }
  };

  const handleRejectFriendRequest = async () => {
    try {
      const response = await fetch(`/api/users/${currentUser.id}/friends/${friendshipId}/reject`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      if (data.success) {
        setFriendshipStatus('none');
        setFriendshipId(null);
      }
    } catch (error) {
      console.error('Ошибка отклонения запроса:', error);
    }
  };

  const handleRemoveFriend = async () => {
    setConfirmModalData({
      title: t('removeFriend') || 'Удаление друга',
      message: `${t('confirmRemoveFriendMessage') || 'Вы уверены, что хотите удалить'} ${profileData.nickname} ${t('fromFriends') || 'из друзей'}?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/users/${currentUser.id}/friends/${profileData.id}`, {
            method: 'DELETE'
          });
          
          const data = await response.json();
          if (data.success) {
            setFriendshipStatus('none');
            setFriendshipId(null);
            // Обновляем счетчик друзей
            setProfileData(prev => prev ? ({
              ...prev,
              friends_count: Math.max(0, (prev.friends_count || 0) - 1)
            }) : prev);
            trackEvent('friend_removed', {
              userId: currentUser.id,
              friendId: profileData.id
            });
          }
        } catch (error) {
          console.error('Ошибка удаления из друзей:', error);
        }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  // Удаление друга из списка друзей
  const handleRemoveFriendFromList = async (friendId, friendNickname) => {
    setConfirmModalData({
      title: t('removeFriend') || 'Удаление друга',
      message: `${t('confirmRemoveFriendMessage') || 'Вы уверены, что хотите удалить'} ${friendNickname} ${t('fromFriends') || 'из друзей'}?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/users/${currentUserId}/friends/${friendId}`, {
            method: 'DELETE'
          });
          
          const data = await response.json();
          if (data.success) {
            // Обновляем список друзей
            setFriendsList(prev => prev.filter(f => f.id !== friendId));
            // Обновляем счетчик друзей
            setProfileData(prev => prev ? ({
              ...prev,
              friends_count: Math.max(0, (prev.friends_count || 0) - 1)
            }) : prev);
            trackEvent('friend_removed', {
              userId: currentUserId,
              friendId: friendId
            });
          }
        } catch (error) {
          console.error('Ошибка удаления друга:', error);
        }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  // Добавление друга из списка друзей
  const handleAddFriendFromList = async (friendId) => {
    try {
      const response = await fetch(`/api/users/${currentUserId}/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: friendId })
      });
      
      const data = await response.json();
      if (data.success) {
        // Обновляем список, добавляя информацию о статусе дружбы
        setFriendsList(prev => prev.map(f => 
          f.id === friendId ? { ...f, friendshipStatus: 'pending_sent' } : f
        ));
        trackEvent('friend_request_sent', {
          userId: currentUserId,
          friendId: friendId
        });
      }
    } catch (error) {
      console.error('Ошибка отправки запроса в друзья:', error);
    }
  };

  // Принять запрос в друзья из модального окна
  const handleAcceptRequestFromModal = async (requestId, friendId) => {
    try {
      const response = await fetch(`/api/users/${currentUserId}/friends/${requestId}/accept`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      if (data.success) {
        // Удаляем запрос из списка
        setFriendRequests(prev => prev.filter(r => r.friendship_id !== requestId));
        setFriendRequestsCount(prev => Math.max(0, prev - 1));
        
        trackEvent('friend_request_accepted', {
          userId: currentUserId,
          friendId: friendId
        });
        
        setSuccessModalData({
          title: t('success') || 'Успешно',
          message: t('friendRequestAccepted') || 'Запрос в друзья принят'
        });
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Ошибка принятия запроса:', error);
    }
  };

  // Отклонить запрос в друзья из модального окна
  const handleRejectRequestFromModal = async (requestId) => {
    try {
      const response = await fetch(`/api/users/${currentUserId}/friends/${requestId}/reject`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      if (data.success) {
        // Удаляем запрос из списка
        setFriendRequests(prev => prev.filter(r => r.friendship_id !== requestId));
        setFriendRequestsCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Ошибка отклонения запроса:', error);
    }
  };

  // Пожаловаться на пользователя из запроса
  const handleReportFromRequest = (userId) => {
    setShowFriendRequests(false);
    setReportingUserId(userId);
    setShowReportModal(true);
  };

  // Перейти к профилю из запроса
  const handleViewProfileFromRequest = (userId) => {
    console.log('👤 Клик на просмотр профиля из запроса в друзья');
    console.log('   userId:', userId, 'type:', typeof userId);
    setShowFriendRequests(false);
    isInternalNavigation.current = true;
    const friendId = Number(userId);
    console.log('   Устанавливаем viewingUserId =', friendId);
    setViewingUserId(friendId);
  };

  const handleSubmitReport = async () => {
    if (!reportForm.reason || !reportForm.description) {
      setErrorModalData({
        title: t('error') || 'Ошибка',
        message: t('fillAllFields') || 'Заполните все поля'
      });
      setShowErrorModal(true);
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
      
      const response = await fetch(`/api/users/${reportingUserId || profileData.id}/report`, {
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
        setSuccessModalData({
          title: t('reportSent') || 'Жалоба отправлена',
          message: t('reportSentMessage') || 'Ваша жалоба была отправлена администраторам. Мы рассмотрим её в ближайшее время.'
        });
        setShowSuccessModal(true);
        setShowReportModal(false);
        setReportForm({ reason: '', description: '', screenshots: [] });
        setReportingUserId(null); // Сбрасываем ID
        trackEvent('user_reported', {
          reporterId: currentUser.id,
          reportedUserId: reportingUserId || profileData.id
        });
      }
    } catch (error) {
      console.error('Ошибка отправки жалобы:', error);
    }
  };

  const handleScreenshotUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length + reportForm.screenshots.length > 4) {
      setErrorModalData({
        title: t('error') || 'Ошибка',
        message: t('maxScreenshots') || 'Максимум 4 скриншота'
      });
      setShowErrorModal(true);
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

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setErrorModalData({
        title: t('error') || 'Ошибка',
        message: t('fillAllFields') || 'Заполните все поля'
      });
      setShowErrorModal(true);
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorModalData({
        title: t('error') || 'Ошибка',
        message: t('passwordsDoNotMatch') || 'Пароли не совпадают'
      });
      setShowErrorModal(true);
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${currentUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSuccessModalData({
          title: t('success') || 'Успешно',
          message: t('passwordChanged') || 'Пароль изменен'
        });
        setShowSuccessModal(true);
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        trackEvent('password_changed', {
          userId: currentUser.id
        });
      } else {
        setErrorModalData({
          title: t('error') || 'Ошибка',
          message: data.message || t('error')
        });
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Ошибка смены пароля:', error);
      setErrorModalData({
        title: t('error') || 'Ошибка',
        message: t('networkError') || 'Ошибка сети'
      });
      setShowErrorModal(true);
    }
  };

  const handleDateChange = (value) => {
    setEditForm({...editForm, date_of_birth: value});
    
    // Валидация при вводе
    if (!value) {
      setDateError('');
      return;
    }
    
    const parts = value.split('/');
    if (parts.length !== 3) {
      setDateError(t('invalidDateFormat') || 'Неверный формат. Используйте ДД/ММ/ГГГГ');
      return;
    }
    
    const [day, month, year] = parts;
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
      setDateError(t('invalidDateFormat') || 'Неверный формат. Используйте ДД/ММ/ГГГГ');
      return;
    }
    
    if (monthNum < 1 || monthNum > 12) {
      setDateError(t('invalidMonth') || 'Месяц должен быть от 1 до 12');
      return;
    }
    
    if (dayNum < 1 || dayNum > 31) {
      setDateError(t('invalidDay') || 'День должен быть от 1 до 31');
      return;
    }
    
    if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
      setDateError(t('invalidYear') || `Год должен быть от 1900 до ${new Date().getFullYear()}`);
      return;
    }
    
    // Проверка валидности даты
    const dateStr = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime()) || 
        dateObj.getDate() !== dayNum || 
        dateObj.getMonth() + 1 !== monthNum || 
        dateObj.getFullYear() !== yearNum) {
      setDateError(t('invalidDate') || 'Такой даты не существует');
      return;
    }
    
    // Проверка возраста (18+)
    const today = new Date();
    let age = today.getFullYear() - dateObj.getFullYear();
    const monthDiff = today.getMonth() - dateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
      age--;
    }
    
    if (age < 18) {
      setDateError(t('ageRestriction') || 'Вам должно быть не менее 18 лет');
      return;
    }
    
    setDateError('');
  };

  const handleSaveProfile = async () => {
    try {
      // Проверяем наличие ошибки даты
      if (dateError) {
        setErrorModalData({
          title: t('error') || 'Ошибка',
          message: dateError
        });
        setShowErrorModal(true);
        return;
      }
      
      // Парсим дату из формата ДД/ММ/ГГГГ в ГГГГ-ММ-ДД
      let date_of_birth = '';
      if (editForm.date_of_birth) {
        const parts = editForm.date_of_birth.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          date_of_birth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          
          // Валидация даты
          const dateObj = new Date(date_of_birth);
          if (isNaN(dateObj.getTime())) {
            setErrorModalData({
              title: t('error') || 'Ошибка',
              message: t('invalidDateFormat') || 'Неверный формат даты. Используйте ДД/ММ/ГГГГ'
            });
            setShowErrorModal(true);
            return;
          }
        } else if (editForm.date_of_birth.trim() !== '') {
          setErrorModalData({
            title: t('error') || 'Ошибка',
            message: t('invalidDateFormat') || 'Неверный формат даты. Используйте ДД/ММ/ГГГГ'
          });
          setShowErrorModal(true);
          return;
        }
      }
      
      const response = await fetch(`/api/users/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: editForm.nickname,
          bio: editForm.bio,
          goal: editForm.goal,
          date_of_birth: date_of_birth,
          gender_id: editForm.gender_id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setProfileData({ ...profileData, ...editForm, date_of_birth });
        setIsEditing(false);
        setDateError('');
        
        trackEvent('profile_updated', {
          userId: currentUser.id,
          fields: Object.keys(editForm)
        });
      } else {
        // Показываем ошибку от сервера (например, никнейм занят)
        setErrorModalData({
          title: t('error') || 'Ошибка',
          message: data.message || t('errorSavingProfile') || 'Ошибка сохранения профиля'
        });
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      setErrorModalData({
        title: t('error') || 'Ошибка',
        message: t('errorSavingProfile') || 'Ошибка сохранения профиля'
      });
      setShowErrorModal(true);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    try {
      const response = await fetch(`/api/users/${currentUser.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPostContent })
      });
      
      const data = await response.json();
      if (data.success) {
        setNewPostContent('');
        // Добавляем пост сразу (оптимистичное обновление)
        setPosts(prev => {
          // Проверяем, нет ли уже этого поста
          if (prev.some(p => p.id === data.post.id)) {
            return prev;
          }
          return [data.post, ...prev];
        });
        // Обновляем счетчик постов
        setProfileData(prev => prev ? ({
          ...prev,
          posts_count: (prev.posts_count || 0) + 1
        }) : prev);
        
        trackEvent('post_created', {
          userId: currentUser.id,
          postId: data.post.id
        });
      }
    } catch (error) {
      console.error('Ошибка создания поста:', error);
    }
  };

  const loadMorePosts = async () => {
    if (!profileData || loadingMorePosts || !hasMorePosts) return;
    
    try {
      setLoadingMorePosts(true);
      const nextPage = postsPage + 1;
      const response = await fetch(`/api/users/${profileData.id}/posts?page=${nextPage}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setPosts(prev => [...prev, ...data.posts]);
        setPostsPage(nextPage);
        setHasMorePosts(data.pagination && data.pagination.page < data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Ошибка загрузки постов:', error);
    } finally {
      setLoadingMorePosts(false);
    }
  };

  const handleDeletePost = async (postId) => {
    setConfirmModalData({
      title: t('confirmDeletePost'),
      message: t('confirmDeletePostMessage'),
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/users/${currentUser.id}/posts/${postId}`, {
            method: 'DELETE'
          });
          
          const data = await response.json();
          if (data.success) {
            // Оптимистичное обновление - удаляем пост из списка
            setPosts(prev => prev.filter(p => p.id !== postId));
            // Обновляем счетчик постов
            setProfileData(prev => prev ? ({
              ...prev,
              posts_count: Math.max(0, (prev.posts_count || 0) - 1)
            }) : prev);
            
            trackEvent('post_deleted', {
              userId: currentUser.id,
              postId: postId
            });
          }
        } catch (error) {
          console.error('Ошибка удаления поста:', error);
        }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await fetch(`/api/users/${profileData.id}/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likerId: currentUser.id })
      });
      
      const data = await response.json();
      if (data.success) {
        trackEvent('post_liked', {
          userId: currentUser.id,
          postId: postId,
          isLiked: data.isLiked
        });
      } else if (data.error === 'TOO_MANY_LIKES') {
        setErrorModalData({
          title: t('error') || 'Ошибка',
          message: data.message || t('tooManyLikes') || 'Слишком много лайков. Подождите немного.'
        });
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Ошибка лайка поста:', error);
    }
  };

  const toggleComments = async (postId) => {
    if (!showComments[postId]) {
      // Загружаем комментарии
      try {
        const response = await fetch(`/api/users/${profileData.id}/posts/${postId}/comments`);
        const data = await response.json();
        
        if (data.success) {
          setComments(prev => ({ ...prev, [postId]: data.comments }));
        }
      } catch (error) {
        console.error('Ошибка загрузки комментариев:', error);
      }
    }
    
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleAddComment = async (postId) => {
    const content = newComment[postId];
    if (!content || !content.trim()) return;
    
    try {
      const response = await fetch(`/api/users/${profileData.id}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, content })
      });
      
      const data = await response.json();
      if (data.success) {
        setNewComment(prev => ({ ...prev, [postId]: '' }));
        trackEvent('comment_added', {
          userId: currentUser.id,
          postId: postId
        });
      }
    } catch (error) {
      console.error('Ошибка добавления комментария:', error);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    setConfirmModalData({
      title: t('confirmDeleteComment'),
      message: t('confirmDeleteCommentMessage'),
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/users/${profileData.id}/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
          });
          
          const data = await response.json();
          if (data.success) {
            trackEvent('comment_deleted', {
              userId: currentUser.id,
              commentId: commentId
            });
          }
        } catch (error) {
          console.error('Ошибка удаления комментария:', error);
        }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <span className="material-icons">person_off</span>
          <p>{t('profileNotFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Шапка профиля */}
        <div className="profile-header">
          {!isOwnProfile && (
            <button 
              className="btn-back-to-own-profile"
              onClick={() => {
                console.log('⬅️ Возврат к своему профилю:', currentUserId);
                isInternalNavigation.current = true;
                setViewingUserId(Number(currentUserId));
              }}
              style={{ marginBottom: '1rem' }}
            >
              <span className="material-icons">arrow_back</span>
              {t('backToMyProfile') || 'Вернуться к моему профилю'}
            </button>
          )}
          <div className="profile-avatar">
            <span className="avatar-emoji">{profileData.avatar_emoji || '🌱'}</span>
          </div>
          <div className="profile-info">
            <h1 className="profile-nickname">
              {profileData.nickname}
              {!isOwnProfile && profileData.mutual_friends_count > 0 && (
                <span className="mutual-friends-badge">
                  ({profileData.mutual_friends_count} {t('mutualFriends') || 'общих друзей'})
                </span>
              )}
            </h1>
            <p className="profile-email">{profileData.email}</p>
          </div>
          
          {/* Кнопки действий */}
          <div className="profile-actions">
            {isOwnProfile ? (
              <>
                <button 
                  className="profile-edit-btn"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <span className="material-icons">{isEditing ? 'close' : 'edit'}</span>
                  {isEditing ? t('cancel') : t('edit')}
                </button>
              </>
            ) : (
              <>
                {console.log('🔘 Рендер кнопок дружбы. friendshipStatus:', friendshipStatus, 'isOwnProfile:', isOwnProfile)}
                {(friendshipStatus === 'none' || friendshipStatus === 'rejected') && (
                  <button 
                    className="profile-action-btn btn-add-friend"
                    onClick={handleSendFriendRequest}
                  >
                    <span className="material-icons">person_add</span>
                    {t('addFriend')}
                  </button>
                )}
                
                {friendshipStatus === 'pending_sent' && (
                  <button className="profile-action-btn btn-pending" disabled>
                    <span className="material-icons">schedule</span>
                    {t('friendRequestSent')}
                  </button>
                )}
                
                {friendshipStatus === 'pending_received' && (
                  <div className="friend-request-actions">
                    <button 
                      className="profile-action-btn btn-accept"
                      onClick={handleAcceptFriendRequest}
                    >
                      <span className="material-icons">check</span>
                      {t('acceptFriendRequest')}
                    </button>
                    <button 
                      className="profile-action-btn btn-reject"
                      onClick={handleRejectFriendRequest}
                    >
                      <span className="material-icons">close</span>
                      {t('rejectFriendRequest')}
                    </button>
                  </div>
                )}
                
                {friendshipStatus === 'accepted' && (
                  <button 
                    className="profile-action-btn btn-remove-friend"
                    onClick={handleRemoveFriend}
                  >
                    <span className="material-icons">person_remove</span>
                    {t('removeFriend')}
                  </button>
                )}
                
                <button 
                  className="profile-action-btn btn-report"
                  onClick={() => setShowReportModal(true)}
                >
                  <span className="material-icons">flag</span>
                  {t('reportUser')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Статистика */}
        <div className="profile-stats">
          <div 
            className="stat-item stat-clickable" 
            onClick={() => loadFriendsList(profileData.id)}
            title={t('viewFriends')}
            style={{ position: 'relative' }}
          >
            <span className="stat-value">{profileData.friends_count || 0}</span>
            <span className="stat-label">{t('friends')}</span>
            {isOwnProfile && friendRequestsCount > 0 && (
              <span className="friend-requests-badge" onClick={(e) => {
                e.stopPropagation();
                setShowFriendRequests(true);
              }}>
                {friendRequestsCount}
              </span>
            )}
          </div>
          <div className="stat-item">
            <span className="stat-value">{profileData.posts_count || 0}</span>
            <span className="stat-label">{t('posts')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profileData.teams_count || 0}</span>
            <span className="stat-label">{t('teams')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profileData.trees_planted || 0}</span>
            <span className="stat-label">{t('treesPlanted')}</span>
          </div>
        </div>

        {/* Форма редактирования или просмотр */}
        {isEditing ? (
          <div className="profile-edit-form">
            <div className="form-group">
              <label htmlFor="profile-nickname">{t('nickname')}</label>
              <input
                id="profile-nickname"
                name="nickname"
                type="text"
                value={editForm.nickname}
                onChange={(e) => setEditForm({...editForm, nickname: e.target.value})}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="profile-bio">{t('bio')}</label>
              <textarea
                id="profile-bio"
                name="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                className="form-textarea"
                rows="4"
                placeholder={t('bioPlaceholder')}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="profile-goal">{t('goal')}</label>
              <textarea
                id="profile-goal"
                name="goal"
                value={editForm.goal}
                onChange={(e) => setEditForm({...editForm, goal: e.target.value})}
                className="form-textarea"
                rows="3"
                placeholder={t('goalPlaceholder')}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="profile-dob">{t('dateOfBirth')}</label>
              <input
                id="profile-dob"
                name="date_of_birth"
                type="text"
                value={editForm.date_of_birth}
                onChange={(e) => handleDateChange(e.target.value)}
                placeholder="ДД/ММ/ГГГГ"
                className={`form-input ${dateError ? 'input-error' : ''}`}
              />
              {dateError && <div className="error-message">{dateError}</div>}
            </div>
            
            <div className="form-actions">
              <button className="btn-save" onClick={handleSaveProfile}>
                {t('save')}
              </button>
              <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                {t('cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-details">
            {profileData.bio && (
              <div className="detail-section">
                <h3>{t('bio')}</h3>
                <p>{profileData.bio}</p>
              </div>
            )}
            {profileData.goal && (
              <div className="detail-section">
                <h3>{t('goal')}</h3>
                <p>{profileData.goal}</p>
              </div>
            )}
          </div>
        )}

        {/* Посты */}
        <div className="profile-posts">
          <h2>{t('posts')}</h2>
          
          {/* Форма создания поста */}
          {isOwnProfile && (
            <div className="create-post">
              <textarea
                id="new-post-content"
                name="post_content"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder={t('whatsOnYourMind') || 'Что у вас нового?'}
                className="post-textarea"
                rows="3"
              />
              <button 
                className="btn-post"
                onClick={handleCreatePost}
                disabled={!newPostContent.trim()}
              >
                <span className="material-icons">send</span>
                {t('publish')}
              </button>
            </div>
          )}

          {/* Список постов */}
          <div className="posts-list">
            {translatedPosts.length === 0 ? (
              <p className="no-posts">{t('noPosts') || 'Пока нет постов'}</p>
            ) : (
              translatedPosts.map(post => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-author">
                      <span className="author-avatar">{post.avatar_emoji}</span>
                      <div>
                        <span className="author-name">{post.nickname}</span>
                        <span className="post-date">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {isOwnProfile && (
                      <button 
                        className="btn-delete-post"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <span className="material-icons">delete</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="post-content">
                    <p>{post.content}</p>
                  </div>
                  
                  <div className="post-actions">
                    <button 
                      className={`btn-like ${post.is_liked ? 'liked' : ''}`}
                      onClick={() => handleLikePost(post.id)}
                    >
                      <span className="material-icons">
                        {post.is_liked ? 'favorite' : 'favorite_border'}
                      </span>
                      {Number(post.likes_count) || 0}
                    </button>
                    <button 
                      className="btn-comment"
                      onClick={() => toggleComments(post.id)}
                    >
                      <span className="material-icons">comment</span>
                      {Number(post.comments_count) || 0}
                    </button>
                  </div>
                  
                  {/* Комментарии */}
                  {showComments[post.id] && (
                    <div className="comments-section">
                      <div className="comments-list">
                        {(translatedComments[post.id] || comments[post.id] || []).map(comment => (
                          <div key={comment.id} className="comment">
                            <span className="comment-avatar">{comment.avatar_emoji}</span>
                            <div className="comment-content">
                              <span className="comment-author">{comment.nickname}</span>
                              <p>{comment.content}</p>
                            </div>
                            {comment.user_id === currentUser.id && (
                              <button
                                className="btn-delete-comment"
                                onClick={() => handleDeleteComment(post.id, comment.id)}
                              >
                                <span className="material-icons">close</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="add-comment">
                        <input
                          type="text"
                          value={newComment[post.id] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder={t('addComment') || 'Добавить комментарий...'}
                          className="comment-input"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
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
              ))
            )}
          </div>
          
          {/* Кнопка загрузки дополнительных постов */}
          {hasMorePosts && translatedPosts.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button 
                className="btn-load-more"
                onClick={loadMorePosts}
                disabled={loadingMorePosts}
              >
                {loadingMorePosts ? (t('loading') || 'Загрузка...') : (t('loadMore') || 'Загрузить еще')}
              </button>
            </div>
          )}
        </div>
        {/* Модальное окно списка друзей */}
        {showFriendsList && (
          <div className="modal-overlay" onClick={() => setShowFriendsList(false)}>
            <div className="modal-content friends-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{t('friendsList')}</h2>
                <button className="modal-close" onClick={() => setShowFriendsList(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">
                {friendsList.length === 0 ? (
                  <p className="no-friends">{t('noFriends')}</p>
                ) : (
                  <div className="friends-list">
                    {friendsList.map(friend => {
                      const isOwnFriendsList = friendsListOwnerId === currentUserId;
                      const isFriendOfCurrentUser = friend.friendshipStatus === 'accepted' || isOwnFriendsList;
                      const isCurrentUser = friend.id === currentUserId;
                      
                      return (
                        <div key={friend.id} className="friend-item">
                          <span className="friend-avatar">{friend.avatar_emoji || '🌱'}</span>
                          <div className="friend-info">
                            <span className="friend-name">{friend.nickname}</span>
                            <span className="friend-level">{translateEcoLevel(friend.eco_level, currentLanguage)}</span>
                          </div>
                          <div className="friend-actions">
                            <button 
                              className="btn-view-profile-icon"
                              onClick={() => {
                                const friendId = Number(friend.id);
                                console.log('👤 Клик на просмотр профиля друга');
                                console.log('   friend.id:', friend.id, 'type:', typeof friend.id);
                                console.log('   friendId (Number):', friendId);
                                console.log('   friend.nickname:', friend.nickname);
                                console.log('   Текущий viewingUserId:', viewingUserId);
                                setShowFriendsList(false);
                                console.log('   Устанавливаем viewingUserId =', friendId);
                                isInternalNavigation.current = true;
                                setViewingUserId(friendId);
                              }}
                              title={t('viewProfile')}
                            >
                              <span className="material-icons">visibility</span>
                            </button>
                            {!isCurrentUser && (
                              isOwnFriendsList ? (
                                <button 
                                  className="btn-remove-friend-list"
                                  onClick={() => handleRemoveFriendFromList(friend.id, friend.nickname)}
                                  title={t('removeFriend')}
                                >
                                  <span className="material-icons">person_remove</span>
                                </button>
                              ) : !isFriendOfCurrentUser && (
                                <button 
                                  className="btn-add-friend-list"
                                  onClick={() => handleAddFriendFromList(friend.id)}
                                  title={t('addFriend')}
                                >
                                  <span className="material-icons">person_add</span>
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Модальное окно запросов в друзья */}
        {showFriendRequests && (
          <div className="modal-overlay" onClick={() => setShowFriendRequests(false)}>
            <div className="modal-content friends-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{t('friendRequests') || 'Запросы в друзья'}</h2>
                <button className="modal-close" onClick={() => setShowFriendRequests(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">
                {friendRequests.length === 0 ? (
                  <p className="no-friends">{t('noFriendRequests') || 'Нет входящих запросов'}</p>
                ) : (
                  <div className="friends-list">
                    {friendRequests.map(request => (
                      <div key={request.friendship_id} className="friend-item">
                        <span className="friend-avatar">{request.avatar_emoji || '🌱'}</span>
                        <div className="friend-info">
                          <span className="friend-name">{request.nickname}</span>
                          <span className="friend-level">{translateEcoLevel(request.eco_level, currentLanguage)}</span>
                        </div>
                        <div className="friend-actions">
                          <button 
                            className="btn-view-profile-icon"
                            onClick={() => handleViewProfileFromRequest(request.user_id)}
                            title={t('viewProfile')}
                          >
                            <span className="material-icons">visibility</span>
                          </button>
                          <button 
                            className="btn-accept-request"
                            onClick={() => handleAcceptRequestFromModal(request.friendship_id, request.user_id)}
                            title={t('acceptRequest') || 'Принять'}
                          >
                            <span className="material-icons">check</span>
                          </button>
                          <button 
                            className="btn-reject-request"
                            onClick={() => handleRejectRequestFromModal(request.friendship_id)}
                            title={t('rejectRequest') || 'Отклонить'}
                          >
                            <span className="material-icons">close</span>
                          </button>
                          <button 
                            className="btn-report-request"
                            onClick={() => handleReportFromRequest(request.user_id)}
                            title={t('report') || 'Пожаловаться'}
                          >
                            <span className="material-icons">report</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Модальное окно жалобы */}
        {showReportModal && (
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
                <button className="btn-cancel" onClick={() => setShowReportModal(false)}>
                  {t('cancel')}
                </button>
                <button className="btn-submit" onClick={handleSubmitReport}>
                  {t('submitReport')}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Модальное окно смены пароля */}
        {showPasswordModal && (
          <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{t('changePasswordModalTitle')}</h2>
                <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="current-password">{t('currentPassword')}</label>
                  <input
                    id="current-password"
                    name="current_password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="form-input"
                    autoComplete="current-password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="new-password">{t('newPassword')}</label>
                  <input
                    id="new-password"
                    name="new_password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="form-input"
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirm-password">{t('confirmPassword')}</label>
                  <input
                    id="confirm-password"
                    name="confirm_password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="form-input"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowPasswordModal(false)}>
                  {t('cancel')}
                </button>
                <button className="btn-submit" onClick={handleChangePassword}>
                  {t('save')}
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
                  {t('cancel')}
                </button>
                <button className="btn-submit btn-danger" onClick={confirmModalData.onConfirm}>
                  {t('confirm')}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Модальное окно ошибки */}
        {showErrorModal && (
          <div className="modal-overlay" onClick={() => setShowErrorModal(false)}>
            <div className="modal-content error-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{errorModalData.title}</h2>
                <button className="modal-close" onClick={() => setShowErrorModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">
                <p>{errorModalData.message}</p>
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
            <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{successModalData.title}</h2>
                <button className="modal-close" onClick={() => setShowSuccessModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">
                <p>{successModalData.message}</p>
              </div>
              <div className="modal-footer">
                <button className="btn-submit" onClick={() => setShowSuccessModal(false)}>
                  {t('ok') || 'OK'}
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
              <div className="modal-body screenshot-modal-body">
                <img 
                  src={selectedScreenshot.url} 
                  alt={selectedScreenshot.name} 
                  className="screenshot-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
