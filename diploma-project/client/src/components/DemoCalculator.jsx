import { useState, useRef, useEffect } from 'react'
import '../styles/components/DemoCalculator.css'
import { translateServerMessage, translateRecommendation } from '../utils/translations'

const DemoCalculator = ({ isOpen, onClose, translations, shake, currentLanguage, onShake }) => {
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
  const modalRef = useRef(null)

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
    }
  }, [isOpen])

  // Сброс выбранных значений при смене языка
  useEffect(() => {
    setSelectedNutrition('')
    setSelectedTransport('')
  }, [translations])

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
    console.log('Начинаем расчет...');
    
    // Получаем текущие значения (выбранные или по умолчанию)
    const currentNutrition = selectedNutrition || Object.values(translations.nutritionOptions)[0];
    const currentTransport = selectedTransport || Object.values(translations.transportOptions)[0];
    
    console.log('currentNutrition:', currentNutrition);
    console.log('currentTransport:', currentTransport);
    
    if (currentNutrition && currentTransport) {
      try {
        // Определяем ключи для отправки на сервер
        const nutritionKey = Object.keys(translations.nutritionOptions).find(
          key => translations.nutritionOptions[key] === currentNutrition
        );
        const transportKey = Object.keys(translations.transportOptions).find(
          key => translations.transportOptions[key] === currentTransport
        );

        console.log('nutritionKey:', nutritionKey);
        console.log('transportKey:', transportKey);

        if (!nutritionKey || !transportKey) {
          console.error('Не удалось найти ключи для отправки');
          setShowError(true);
          return;
        }

        console.log('Отправляем запрос на сервер...');

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

        console.log('Ответ сервера получен:', response.status);

        const result = await response.json();
        console.log('Результат:', result);

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
      console.log('Не выбраны параметры');
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
            <h2 className="modal-title">{translations.calculatorTitle}</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          
          <div className="modal-body">
            <p className="modal-subtitle">{translations.calculatorSubtitle}</p>
            
            <div className="form-section">
              <h3 className="section-title">{translations.nutritionTitle}</h3>
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
                  <span>{selectedNutrition || Object.values(translations.nutritionOptions)[0]}</span>
                  <svg 
                    className={`dropdown-arrow-calc ${nutritionDropdownOpen ? 'rotated' : ''}`}
                    width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" fill="#666"/>
                  </svg>
                </div>
                {nutritionDropdownOpen && !showError && !showSuccess && (
                  <div className="dropdown-options-calc">
                    {Object.entries(translations.nutritionOptions).map(([key, value]) => (
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
              <h3 className="section-title">{translations.transportTitle}</h3>
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
                  <span>{selectedTransport || Object.values(translations.transportOptions)[0]}</span>
                  <svg 
                    className={`dropdown-arrow-calc ${transportDropdownOpen ? 'rotated' : ''}`}
                    width="12" height="12" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M0.168642 0.052783C-0.0130542 0.174845 -0.0534312 0.41567 0.0744293 0.600412C0.182101 0.758763 3.66462 4.84949 3.75883 4.93196C3.85304 5.01443 4.12559 5.02433 4.21644 4.94845C4.31401 4.87258 7.95131 0.583917 7.97822 0.514639C8.03879 0.362886 7.96813 0.148453 7.82681 0.052783C7.78307 0.0230923 7.68213 0 7.58791 0C7.44323 0 7.41631 0.0131955 7.28509 0.145154C7.2077 0.224329 6.44053 1.12165 5.57916 2.13773C4.71778 3.15711 4.00782 3.98845 3.99773 3.98845C3.98763 3.98845 3.27094 3.14722 2.39947 2.12124C1.528 1.09526 0.760838 0.197938 0.693543 0.128659C0.579142 0.0131955 0.548859 0 0.404175 0C0.313326 0 0.212384 0.0230923 0.168642 0.052783Z" fill="#666"/>
                  </svg>
                </div>
                {transportDropdownOpen && !showError && !showSuccess && (
                  <div className="dropdown-options-calc">
                    {Object.entries(translations.transportOptions).map(([key, value]) => (
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
              {translations.calculateButton}
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно ошибки - вынесено наружу */}
      {showError && (
        <div 
          className="notification-overlay" 
          onClick={(e) => {
            console.log('Clicked on error overlay')
            setShowError(false)
          }}
        >
          <div 
            className="notification-modal error" 
            onClick={(e) => {
              console.log('Clicked on error modal')
              e.stopPropagation()
            }}
          >
            <div className="notification-header">
              <h3>Ошибка</h3>
              <button 
                className="notification-close" 
                onClick={(e) => {
                  console.log('Clicked on error close button')
                  e.stopPropagation()
                  setShowError(false)
                }}
              >
                ×
              </button>
            </div>
            <p>Пожалуйста, выберите все параметры</p>
            <button 
              className="notification-button" 
              onClick={(e) => {
                console.log('Clicked on error understand button')
                e.stopPropagation()
                setShowError(false)
              }}
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно успеха - вынесено наружу */}
      {showSuccess && (
        <div 
          className="notification-overlay" 
          onClick={(e) => {
            console.log('Clicked on success overlay')
            setShowSuccess(false)
          }}
        >
          <div 
            className="notification-modal success" 
            onClick={(e) => {
              console.log('Clicked on success modal')
              e.stopPropagation()
            }}
          >
            <div className="notification-header">
              <h3>{translations.resultTitle}</h3>
              <button 
                className="notification-close" 
                onClick={(e) => {
                  console.log('Clicked on success close button')
                  e.stopPropagation()
                  setShowSuccess(false)
                }}
              >
                ×
              </button>
            </div>
            {calculationResult ? (
              <div style={{ padding: '15px 25px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: '600', color: '#333' }}>
                  {translateServerMessage(calculationResult.total.message, currentLanguage)}
                </p>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
                  {translations.totalFootprint}: <strong>{calculationResult.total.carbon} {translations.units.kgCO2Year}</strong>
                </p>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  <div>{translations.nutrition}: {calculationResult.nutrition.carbon} {translations.units.kgCO2Year}</div>
                  <div>{translations.transport}: {calculationResult.transport.carbon} {translations.units.kgCO2Year}</div>
                </div>
                {calculationResult.recommendations && calculationResult.recommendations.length > 0 && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#7cb342' }}>
                    <strong>{translations.recommendations}:</strong>
                    <ul style={{ margin: '5px 0 0 15px', padding: 0 }}>
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
                  <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
                    <div><strong>{translations.comparison}:</strong></div>
                    <div>{translations.worldAverage}: {calculationResult.comparison.worldAverage.value} {translations.units.kgCO2Year} 
                      ({calculationResult.comparison.worldAverage.percentage > 0 ? '+' : ''}{calculationResult.comparison.worldAverage.percentage}%)
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p>{translations.calculateButton} выполнен успешно!</p>
            )}
            <button 
              className="notification-button" 
              onClick={(e) => {
                console.log('Clicked on success ok button')
                e.stopPropagation()
                setShowSuccess(false)
              }}
            >
              {translations.okButton}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default DemoCalculator