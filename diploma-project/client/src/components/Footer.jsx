import { useEffect, useState } from 'react'
import '../styles/components/Footer.css'

const Footer = () => {
  const [currentTheme, setCurrentTheme] = useState('light')

  useEffect(() => {
    // Получаем текущую тему из localStorage
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setCurrentTheme(settings.theme || 'light')
    }

    // Слушаем изменения темы
    const handleStorageChange = () => {
      const savedSettings = localStorage.getItem('appSettings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        setCurrentTheme(settings.theme || 'light')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Проверяем изменения каждую секунду
    const interval = setInterval(handleStorageChange, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
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
