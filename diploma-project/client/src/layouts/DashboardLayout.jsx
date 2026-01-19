import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import MobileNav from '../components/MobileNav'
import Footer from '../components/Footer'
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

    // Применяем тему к sidebar
    const sidebar = document.querySelector('.sidebar')
    if (sidebar) {
      sidebar.setAttribute('data-theme', currentTheme)
    }

    // Слушаем изменения темы
    const handleStorageChange = () => {
      const savedSettings = localStorage.getItem('appSettings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        const newTheme = settings.theme || 'light'
        setCurrentTheme(newTheme)
        
        const sidebar = document.querySelector('.sidebar')
        if (sidebar) {
          sidebar.setAttribute('data-theme', newTheme)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Проверяем изменения каждую секунду (для случаев когда storage event не срабатывает)
    const interval = setInterval(handleStorageChange, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [currentTheme])

  return (
    <div className="dashboard-layout" data-theme={currentTheme}>
      <Sidebar 
        isExpanded={isSidebarExpanded} 
        setIsExpanded={setIsSidebarExpanded} 
      />
      
      <main className={`dashboard-main ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        <Outlet />
        <Footer />
      </main>

      <MobileNav />
    </div>
  )
}

export default DashboardLayout
