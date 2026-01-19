import { useState, useEffect } from 'react'
import EcoTipCard from '../components/EcoTipCard'

const TestSettingsPage = () => {
  const [currentTip, setCurrentTip] = useState(null)
  const [loadingTip, setLoadingTip] = useState(false)

  useEffect(() => {
    loadDailyTip()
  }, [])

  const loadDailyTip = async () => {
    try {
      console.log('Загружаем совет дня...')
      const response = await fetch('/api/eco-tips/daily')
      console.log('Ответ сервера:', response.status)
      
      if (response.ok) {
        const tip = await response.json()
        console.log('Получен совет:', tip)
        setCurrentTip(tip)
      } else {
        console.error('Ошибка ответа сервера:', response.status)
        // Устанавливаем тестовый совет если API не работает
        setCurrentTip({
          id: 1,
          title: 'Тестовый совет',
          content: 'Это тестовый совет для проверки работы компонента.',
          category: 'Тест',
          difficulty: 'easy',
          co2_impact: 1000,
          day_of_year: 1
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки совета дня:', error)
      // Устанавливаем тестовый совет при ошибке
      setCurrentTip({
        id: 1,
        title: 'Тестовый совет',
        content: 'Это тестовый совет для проверки работы компонента.',
        category: 'Тест',
        difficulty: 'easy',
        co2_impact: 1000,
        day_of_year: 1
      })
    }
  }

  const loadRandomTip = async () => {
    try {
      setLoadingTip(true)
      console.log('Загружаем случайный совет...')
      const response = await fetch('/api/eco-tips/random')
      
      if (response.ok) {
        const tip = await response.json()
        console.log('Получен случайный совет:', tip)
        setCurrentTip(tip)
      } else {
        console.error('Ошибка загрузки случайного совета:', response.status)
      }
    } catch (error) {
      console.error('Ошибка загрузки случайного совета:', error)
    } finally {
      setLoadingTip(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Тест настроек и эко-советов</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>API Status</h2>
        <p>Статус загрузки: {currentTip ? '✅ Загружен' : '⏳ Загружается...'}</p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>💡 Эко-совет</h2>
          <button 
            onClick={loadRandomTip}
            disabled={loadingTip}
            style={{
              background: '#4caf50',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              cursor: 'pointer'
            }}
          >
            {loadingTip ? '⏳' : '🔄'} Другой совет
          </button>
        </div>
        
        {currentTip ? (
          <EcoTipCard tip={currentTip} showActions={true} isPreview={true} />
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#f5f5f5', borderRadius: '12px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🌱</div>
            <p>Загружаем совет дня...</p>
            <button onClick={loadDailyTip} style={{
              background: '#4caf50',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}>
              Попробовать снова
            </button>
          </div>
        )}
      </div>

      <div>
        <h2>🔧 Debug Info</h2>
        <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem' }}>
          {JSON.stringify({ currentTip, loadingTip }, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default TestSettingsPage