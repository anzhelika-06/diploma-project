import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './pages/MainLayout'
import AuthPage from './pages/AuthPage'
import RegisterPage from './pages/RegisterPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import AboutPage from './pages/AboutPage'
import DashboardLayout from './layouts/DashboardLayout'
import FeedPage from './pages/FeedPage'
import PetPage from './pages/PetPage'
import TeamsPage from './pages/TeamsPage'
import MessagesPage from './pages/MessagesPage'
import FriendsPage from './pages/FriendsPage'
import NotificationsPage from './pages/NotificationsPage'
import CreatePostPage from './pages/CreatePostPage'
import AchievementsPage from './pages/AchievementsPage'
import StatisticsPage from './pages/StatisticsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ContributionPage from './pages/ContributionPage'
import ReviewsPage from './pages/ReviewsPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import SearchPage from './pages/SearchPage'
import TestSettingsPage from './pages/TestSettingsPage'
import { LanguageProvider } from './contexts/LanguageContext'
import { initializeTheme, syncTheme } from './utils/themeManager'
import './styles/variables.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Инициализируем тему при загрузке приложения
    const initApp = async () => {
      try {
        // Сначала инициализируем тему
        await initializeTheme()
        
        // Проверяем авторизацию
        const user = localStorage.getItem('user')
        if (user) {
          try {
            const userData = JSON.parse(user)
            if (userData && userData.id) {
              setIsAuthenticated(true)
              // Если пользователь авторизован, синхронизируем тему с БД
              await syncTheme()
            }
          } catch (error) {
            console.error('Ошибка парсинга данных пользователя:', error)
            localStorage.removeItem('user')
          }
        }
      } catch (error) {
        console.error('Ошибка инициализации приложения:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    initApp()
  }, [])

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '24px'
      }}>
        🌱 Загрузка...
      </div>
    )
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
      </Router>
    </div>
    </LanguageProvider>
  )
}

export default App