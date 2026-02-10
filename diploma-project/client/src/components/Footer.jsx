import { useEffect, useState } from 'react'
import '../styles/components/Footer.css'

const Footer = () => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Инициализируем сразу из localStorage
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      return settings.theme || 'light'
    }
    return 'light'
  })

  useEffect(() => {
    // Слушаем изменения темы
    const handleStorageChange = () => {
      const savedSettings = localStorage.getItem('appSettings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        setCurrentTheme(prevTheme => {
          const newTheme = settings.theme || 'light'
          return newTheme !== prevTheme ? newTheme : prevTheme
        })
      }
    }

    // Слушаем события storage
    window.addEventListener('storage', handleStorageChange)
    
    // Создаем кастомное событие для изменений в той же вкладке
    const handleThemeChange = (e) => {
      if (e.detail && e.detail.theme) {
        setCurrentTheme(e.detail.theme)
      }
    }
    window.addEventListener('themeChanged', handleThemeChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('themeChanged', handleThemeChange)
    }
  }, [])

  return (
    <footer className="dashboard-footer" data-theme={currentTheme}>
      <div className="footer-content">
        <span className="footer-copyright">© 2026 EcoSteps</span>
      </div>
    </footer>
  )
}

export default Footer
