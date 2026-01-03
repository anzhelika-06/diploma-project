import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainLayout from './pages/MainLayout'
import AuthPage from './pages/AuthPage'
import { translations, getSavedLanguage, saveLanguage } from './utils/translations'

function App() {
  const [currentLanguage, setCurrentLanguage] = useState(getSavedLanguage())

  const handleLanguageChange = (newLanguage) => {
    setCurrentLanguage(newLanguage)
    saveLanguage(newLanguage)
  }

  const currentTranslations = translations[currentLanguage] || translations.RU

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <MainLayout 
              translations={currentTranslations}
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />
          } 
        />
        <Route 
          path="/auth" 
          element={
            <AuthPage 
              translations={currentTranslations}
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />
          } 
        />
      </Routes>
    </Router>
  )
}

export default App