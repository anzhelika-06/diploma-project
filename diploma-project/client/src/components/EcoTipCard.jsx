import { useState } from 'react'
import '../styles/components/EcoTipCard.css'

const EcoTipCard = ({ tip, showActions = false, isPreview = false }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#4caf50'
      case 'medium': return '#ff9800'
      case 'hard': return '#f44336'
      default: return '#4caf50'
    }
  }

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Легко'
      case 'medium': return 'Средне'
      case 'hard': return 'Сложно'
      default: return 'Легко'
    }
  }

  const getCategoryIcon = (category) => {
    const icons = {
      'Энергия': 'flash_on',
      'Вода': 'water_drop',
      'Отходы': 'recycling',
      'Транспорт': 'directions_bike',
      'Питание': 'restaurant',
      'Природа': 'eco',
      'Быт': 'home',
      'Потребление': 'shopping_cart',
      'Планирование': 'assignment',
      'Жилье': 'house'
    }
    return icons[category] || 'public'
  }

  const formatCO2Impact = (impact) => {
    if (!impact) return null
    return `${impact.toFixed(0)} кг CO₂`
  }

  return (
    <div className={`eco-tip-card ${isExpanded ? 'expanded' : ''} ${isPreview ? 'preview' : ''}`}>
      <div className="tip-header">
        <div className="tip-category">
          <span className="material-icons category-icon">{getCategoryIcon(tip.category)}</span>
          <span className="category-name">{tip.category}</span>
        </div>
        <div className="tip-difficulty" style={{ color: getDifficultyColor(tip.difficulty) }}>
          {getDifficultyText(tip.difficulty)}
        </div>
      </div>

      <div className="tip-content">
        <h3 className="tip-title">
          {tip.title}
        </h3>
        
        <div className={`tip-description ${isExpanded ? 'expanded' : ''}`}>
          <p>{tip.content}</p>
        </div>

        {tip.co2_impact > 0 && (
          <div className="tip-impact">
            <span className="material-icons impact-icon">public</span>
            <span className="impact-text">
              Экономия: {formatCO2Impact(tip.co2_impact)}
            </span>
          </div>
        )}
      </div>

      {showActions && (
        <div className="tip-actions">
          <button 
            className="action-btn expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="material-icons action-icon">{isExpanded ? 'menu_book' : 'visibility'}</span>
            <span className="action-text">{isExpanded ? 'Свернуть' : 'Подробнее'}</span>
          </button>
        </div>
      )}

      {tip.day_of_year && (
        <div className="tip-day">
          <span className="material-icons day-icon">event</span>
          <span className="day-text">День {tip.day_of_year}</span>
        </div>
      )}
    </div>
  )
}

export default EcoTipCard