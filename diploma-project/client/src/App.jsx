import { useState, useEffect, useCallback } from 'react'; // useCallback теперь добавлен
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './pages/MainLayout';
import AuthPage from './pages/AuthPage';
import RegisterPage from './pages/RegisterPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import AboutPage from './pages/AboutPage';
import DashboardLayout from './layouts/DashboardLayout';
import FeedPage from './pages/FeedPage';
import PetPage from './pages/PetPage';
import TeamsPage from './pages/TeamsPage';
import MessagesPage from './pages/MessagesPage';
import FriendsPage from './pages/FriendsPage';
import NotificationsPage from './pages/NotificationsPage';
import CreatePostPage from './pages/CreatePostPage';
import AchievementsPage from './pages/AchievementsPage';
import StatisticsPage from './pages/StatisticsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ContributionPage from './pages/ContributionPage';
import ReviewsPage from './pages/ReviewsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import SearchPage from './pages/SearchPage';
import TestSettingsPage from './pages/TestSettingsPage';
import NotificationSystem from './components/NotificationSystem';
import { LanguageProvider } from './contexts/LanguageContext';
import { getSavedTheme, applyTheme, syncTheme } from './utils/themeManager';
import './styles/variables.css';
import loadingGif from './assets/videos/loading-tree.gif';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Функция для показа уведомлений - теперь с useCallback
  const showAppNotification = useCallback((title, body, type = 'success') => {
    if (window.showNotification) {
      window.showNotification({
        title,
        body,
        type
      });
    } else {
      // Если NotificationSystem еще не загружен, сохраняем в localStorage
      const notification = {
        id: `app-notif-${Date.now()}`,
        type,
        title,
        body,
        timestamp: new Date().toISOString(),
        autoHide: true
      };
      
      // Сохраняем во временное хранилище
      const pendingNotifications = JSON.parse(localStorage.getItem('pendingNotifications') || '[]');
      pendingNotifications.push(notification);
      localStorage.setItem('pendingNotifications', JSON.stringify(pendingNotifications));
      
      // Показываем alert как fallback
      alert(`${title}: ${body}`);
    }
  }, []); // Пустой массив зависимостей, так как функция не зависит от состояния компонента

  useEffect(() => {
    // Делаем функцию доступной глобально для других компонентов
    window.showAppNotification = showAppNotification;
    
    // Инициализируем тему при загрузке приложения
    const initApp = async () => {
      try {
        // Сначала инициализируем тему синхронно с skipSave: true
        const savedTheme = getSavedTheme();
        applyTheme(savedTheme, { skipSave: true });
        
        // Проверяем авторизацию
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token'); // Проверяем токен
        
        if (user && token) {
          try {
            const userData = JSON.parse(user);
            if (userData && userData.id) {
              setIsAuthenticated(true);
              // Если пользователь авторизован, синхронизируем тему с БД асинхронно
              syncTheme().catch(error => {
                console.warn('Ошибка синхронизации темы:', error);
              });
            }
          } catch (error) {
            console.error('Ошибка парсинга данных пользователя:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initApp();
    
    // Очистка при размонтировании
    return () => {
      delete window.showAppNotification;
    };
  }, [showAppNotification]); // Добавляем showAppNotification в зависимости

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <img 
          src={loadingGif} 
          alt="Загрузка..." 
          style={{ width: '150px', height: '150px' }}
        />
        <div style={{ fontSize: '24px' }}>Загрузка...</div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <div className="page-container">
        <Router>
          <Routes>
            {/* Главная страница - редирект в зависимости от авторизации */}
            <Route 
              path="/" 
              element={
                isAuthenticated ? (
                  <Navigate to="/feed" replace />
                ) : (
                  <MainLayout />
                )
              } 
            />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/test-settings" element={<TestSettingsPage />} />
            <Route path="/about" element={<AboutPage />} />

            {/* Защищенные страницы с Dashboard Layout */}
            <Route element={<DashboardLayout />}>
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/pet" element={<PetPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/create" element={<CreatePostPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/contribution" element={<ContributionPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/search" element={<SearchPage />} />
            </Route>
          </Routes>
          
          {/* Система уведомлений (всегда висит внизу иерархии) */}
          <NotificationSystem 
            isVisible={showNotifications} 
            onClose={() => setShowNotifications(false)}
          />
        </Router>
      </div>
    </LanguageProvider>
  );
}

export default App;