import { useState, useRef, useEffect } from 'react'
import '../styles/components/DemoCalculator.css'
import { translateServerMessage, translateRecommendation, formatCarbonFootprint } from '../utils/translations'
import { getSavedTheme } from '../utils/themeManager'
import { useLanguage } from '../contexts/LanguageContext'

const DemoCalculator = ({ isOpen, onClose, shake, onShake }) => {
  const { currentLanguage, t } = useLanguage()
  const [selectedNutrition, setSelectedNutrition] = useState('')
  const [selectedTransport, setSelectedTransport] = useState('')
  const [nutritionDropdownOpen, setNutritionDropdownOpen] = useState(false)
  const [transportDropdownOpen, setTransportDropdownOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showError, setShowError] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [calculationResult, setCalculationResult] = useState(null)
  const [currentTheme, setCurrentTheme] = useState('light')
  const [isTranslatingRecommendations, setIsTranslatingRecommendations] = useState(false)
  const [translatedRecommendations, setTranslatedRecommendations] = useState([])
  const modalRef = useRef(null)

  // Функция для перевода рекомендаций
  const translateRecommendationsAsync = async (recommendations) => {
    if (!recommendations || recommendations.length === 0) {
      return []
    }
    
    setIsTranslatingRecommendations(true)
    
    try {
      const translated = await Promise.all(
        recommendations.map(rec => translateRecommendation(rec, currentLanguage))
      )
      setTranslatedRecommendations(translated)
      return translated
    } catch (error) {
      console.error('Error translating recommendations:', error)
      setTranslatedRecommendations(recommendations) // Fallback to original
      return recommendations
    } finally {
      setIsTranslatingRecommendations(false)
    }
  }

  // Сброс позиции при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 })
      setSelectedNutrition('')
      setSelectedTransport('')
      setNutritionDropdownOpen(false)
      setTransportDropdownOpen(false)
      setShowError(false)
      setShowSuccess(false)
      
      // Получаем текущую тему
      const savedTheme = getSavedTheme()
      setCurrentTheme(savedTheme)
    }
  }, [isOpen])

  // Сброс выбранных значений при смене языка
  useEffect(() => {
    setSelectedNutrition('')
    setSelectedTransport('')
  }, [currentLanguage])

  // Обработка перетаскивания
  const handleMouseDown = (e) => {
    if (e.target.closest('.modal-header')) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  // Закрытие выпадающих списков при клике вне их
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-dropdown')) {
        setNutritionDropdownOpen(false)
        setTransportDropdownOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleCalculate = async () => {
    // Получаем текущие значения (выбранные или по умолчанию)
    const nutritionOptions = t('nutritionOptions')
    const transportOptions = t('transportOptions')
    
    const currentNutrition = selectedNutrition || Object.values(nutritionOptions)[0];
    const currentTransport = selectedTransport || Object.values(transportOptions)[0];
    
    if (currentNutrition && currentTransport) {
      try {
        // Определяем ключи для отправки на сервер
        const nutritionKey = Object.keys(nutritionOptions).find(
          key => nutritionOptions[key] === currentNutrition
        );
        const transportKey = Object.keys(transportOptions).find(
          key => transportOptions[key] === currentTransport
        );

        if (!nutritionKey || !transportKey) {
          console.error('Не удалось найти ключи для отправки');
          setShowError(true);
          return;
        }

        // Отправляем запрос на сервер
        const response = await fetch('http://localhost:3001/api/calculator/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nutrition: nutritionKey,
            transport: transportKey
          })
        });

        const result = await response.json();

        if (result.success) {
          setCalculationResult(result.data)
          setShowSuccess(true)
          // Убрал автоматическое закрытие - пользователь сам решает когда закрыть
        } else {
          console.error('Сервер вернул ошибку:', result);
          setShowError(true)
        }
      } catch (error) {
        console.error('Ошибка при расчете:', error);
        setShowError(true)
      }
    } else {
      setShowError(true)
    }
  }

  const handleNutritionSelect = (value) => {
    setSelectedNutrition(value)
    setNutritionDropdownOpen(false)
  }

  const handleTransportSelect = (value) => {
    setSelectedTransport(value)
    setTransportDropdownOpen(false)
  }

  if (!isOpen) return null

  return (
    <>
      <div 
        className="modal-overlay"
        data-theme={currentTheme}
        onClick={(e) => {
          // Если кликнули по overlay (не по калькулятору), дергаем калькулятор
          if (e.target === e.currentTarget) {
            if (shake) return;
            if (onShake) onShake();
          }
        }}
      >
        <div 
          className={`modal-content ${shake ? 'shake' : ''}`}
          ref={modalRef}
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`, // возвращаем обычное позиционирование
            pointerEvents: (showError || showSuccess) ? 'none' : 'all' // блокируем взаимодействие при показе уведомлений
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="modal-header">
            <h2 className="modal-title">{t('calculatorTitle')}</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          
          <div className="modal-body">
            <p className="modal-subtitle">{t('calculatorSubtitle')}</p>
            
            <div className="form-section">
              <h3 className="section-title">{t('nutritionTitle')}</h3>
              <div className="custom-dropdown">
                <div 
                  className={`dropdown-trigger ${nutritionDropdownOpen ? 'active' : ''}`}
                  onClick={() => {
                    if (!showError && !showSuccess) { // блокируем если показано уведомление
                      setNutritionDropdownOpen(!nutritionDropdownOpen)
                      setTransportDropdownOpen(false)
                    }
                  }}
                >
                  <span>{selectedNutrition || Object.values(t('nutritionOptions'))[0]}</span>
                  <svg 
                    className={`dropdown-arrow-calc ${nutritionDropdownOpen ? 'rotated' : ''}`}
                    width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" fill="#666"/>
                  </svg>
                </div>
                {nutritionDropdownOpen && !showError && !showSuccess && (
                  <div className="dropdown-options-calc">
                    {Object.entries(t('nutritionOptions')).map(([key, value]) => (
                      <div
                        key={key}
                        className="dropdown-option-calc"
                        onClick={() => handleNutritionSelect(value)}
                      >
                        {value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">{t('transportTitle')}</h3>
              <div className="custom-dropdown">
                <div 
                  className={`dropdown-trigger ${transportDropdownOpen ? 'active' : ''}`}
                  onClick={() => {
                    if (!showError && !showSuccess) { // блокируем если показано уведомление
                      setTransportDropdownOpen(!transportDropdownOpen)
                      setNutritionDropdownOpen(false)
                    }
                  }}
                >
                  <span>{selectedTransport || Object.values(t('transportOptions'))[0]}</span>
                  <svg 
                    className={`dropdown-arrow-calc ${transportDropdownOpen ? 'rotated' : ''}`}
                    width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" fill="#666"/>
                  </svg>
                </div>
                {transportDropdownOpen && !showError && !showSuccess && (
                  <div className="dropdown-options-calc">
                    {Object.entries(t('transportOptions')).map(([key, value]) => (
                      <div
                        key={key}
                        className="dropdown-option-calc"
                        onClick={() => handleTransportSelect(value)}
                      >
                        {value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button 
              className="calculate-button" 
              onClick={handleCalculate}
              disabled={showError || showSuccess} // блокируем кнопку при показе уведомлений
            >
              {t('calculateButton')}
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно ошибки - вынесено наружу */}
      {showError && (
        <div 
          className="notification-overlay" 
          onClick={(e) => {
            setShowError(false)
          }}
        >
          <div 
            className="notification-modal error" 
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div className="notification-header">
              <h3>{t('calculatorError')}</h3>
              <button 
                className="notification-close" 
                onClick={(e) => {
                  e.stopPropagation()
                  setShowError(false)
                }}
              >
                ×
              </button>
            </div>
            <p>{t('calculatorErrorMessage')}</p>
            <button 
              className="notification-button" 
              onClick={(e) => {
                e.stopPropagation()
                setShowError(false)
              }}
            >
              {t('calculatorErrorButton')}
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно успеха - вынесено наружу */}
      {showSuccess && (
        <div 
          className="notification-overlay" 
          onClick={(e) => {
            setShowSuccess(false)
          }}
        >
          <div 
            className="notification-modal success" 
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div className="notification-header">
              <h3>{t('resultTitle')}</h3>
              <button 
                className="notification-close" 
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSuccess(false)
                }}
              >
                ×
              </button>
            </div>
            {calculationResult ? (
              <div className="calculation-result">
                <p className="result-main-message">
                  {translateServerMessage(calculationResult.total.message, currentLanguage)}
                </p>
                <p className="result-total-footprint">
                  {t('totalFootprint')}: <strong>{formatCarbonFootprint(calculationResult.total.carbon, currentLanguage)}/год</strong>
                </p>
                <div className="result-breakdown">
                  <div>{t('nutrition')}: {formatCarbonFootprint(calculationResult.nutrition.carbon, currentLanguage)}/год</div>
                  <div>{t('transport')}: {formatCarbonFootprint(calculationResult.transport.carbon, currentLanguage)}/год</div>
                </div>
                {calculationResult.recommendations && calculationResult.recommendations.length > 0 && (
                  <div className="result-recommendations">
                    <strong>{t('recommendations')}:</strong>
                    <ul>
                      {calculationResult.recommendations.map((rec, index) => {
                        const translatedRec = translateRecommendation(rec, currentLanguage);
                        return (
                          <li key={index}>
                            <strong>{translatedRec.category}:</strong> {translatedRec.suggestion}
                            {translatedRec.impact && <div style={{ fontSize: '11px', color: '#999' }}>({translatedRec.impact})</div>}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {calculationResult.comparison && (
                  <div className="result-comparison">
                    <div><strong>{t('comparison')}:</strong></div>
                    <div>{t('worldAverage')}: {calculationResult.comparison.worldAverage.value} {t('units.kgCO2Year')} 
                      ({calculationResult.comparison.worldAverage.percentage > 0 ? '+' : ''}{calculationResult.comparison.worldAverage.percentage}%)
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p>{t('calculateButton')} выполнен успешно!</p>
            )}
            <button 
              className="notification-button" 
              onClick={(e) => {
                e.stopPropagation()
                setShowSuccess(false)
              }}
            >
              {t('okButton')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default DemoCalculator