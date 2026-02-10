import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import MobileNav from '../components/MobileNav'
import Footer from '../components/Footer'
import NotificationBell from '../components/NotificationBell'
import '../styles/layouts/DashboardLayout.css'

const DashboardLayout = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('light')

  useEffect(() => {
    // Получаем текущую тему из localStorage
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setCurrentTheme(settings.theme || 'light')
    }
  }, [])

  // Отдельный эффект для применения темы
  useEffect(() => {
    const sidebar = document.querySelector('.sidebar')
    if (sidebar) {
      sidebar.setAttribute('data-theme', currentTheme)
    }
  }, [currentTheme])

  // Отдельный эффект для слушания изменений темы
  useEffect(() => {
    const handleStorageChange = () => {
      const savedSettings = localStorage.getItem('appSettings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        const newTheme = settings.theme || 'light'
        if (newTheme !== currentTheme) {
          setCurrentTheme(newTheme)
        }
      }
    }

    // Слушаем изменения storage
    window.addEventListener('storage', handleStorageChange)
    
    // Проверяем изменения каждую секунду
    const interval = setInterval(handleStorageChange, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="dashboard-layout" data-theme={currentTheme}>
      <Sidebar 
        isExpanded={isSidebarExpanded} 
        setIsExpanded={setIsSidebarExpanded} 
      />
      
      <NotificationBell />
      
      <main className={`dashboard-main ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        <Outlet />
        <Footer />
      </main>

      <MobileNav />
    </div>
  )
}

export default DashboardLayout
