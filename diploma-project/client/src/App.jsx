import { useState, useEffect, useCallback } from 'react';
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
import AdminPage from './pages/AdminPage';
import NotificationSystem from './components/NotificationSystem';
import { LanguageProvider } from './contexts/LanguageContext';
import { getSavedTheme, applyTheme, syncTheme } from './utils/themeManager';
import { isUserAdmin } from './utils/authUtils';
import './styles/variables.css';
import loadingGif from './assets/videos/loading-tree.gif';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Функция для показа уведомлений
  const showAppNotification = useCallback((title, body, type = 'success') => {
    if (window.showNotification) {
      window.showNotification({
        title,
        body,
        type
      });
    } else {
      const notification = {
        id: `app-notif-${Date.now()}`,
        type,
        title,
        body,
        timestamp: new Date().toISOString(),
        autoHide: true
      };
      
      const pendingNotifications = JSON.parse(localStorage.getItem('pendingNotifications') || '[]');
      pendingNotifications.push(notification);
      localStorage.setItem('pendingNotifications', JSON.stringify(pendingNotifications));
      
      alert(`${title}: ${body}`);
    }
  }, []);

  useEffect(() => {
    window.showAppNotification = showAppNotification;
    
    const initApp = async () => {
      try {
        // Инициализируем тему
        const savedTheme = getSavedTheme();
        applyTheme(savedTheme, { skipSave: true });
        
        // Проверяем авторизацию
        const token = localStorage.getItem('token');
        
        if (token) {
          try {
            // Простая проверка токена
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
              
              if (payload.userId) {
                setIsAuthenticated(true);
                
                // Синхронизируем тему
                syncTheme().catch(error => {
                  console.warn('Ошибка синхронизации темы:', error);
                });
              }
            }
          } catch (error) {
            console.error('Ошибка проверки токена:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initApp();
    
    return () => {
      delete window.showAppNotification;
    };
  }, [showAppNotification]);

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
            {/* Главная страница */}
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
            
            {/* Публичные страницы */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/about" element={<AboutPage />} />

            {/* Защищенные страницы */}
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
              <Route path="/profile/:userId" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/search" element={<SearchPage />} />
              
              {/* Админ-панель - проверка внутри компонента AdminPage */}
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Routes>
          
          {/* Система уведомлений */}
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