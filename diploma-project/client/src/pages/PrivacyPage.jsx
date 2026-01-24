import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getSavedLanguage } from '../utils/translations'
import { applyTheme, getSavedTheme } from '../utils/themeManager'
import { useLanguage } from '../contexts/LanguageContext'
import '../styles/pages/TermsPage.css'

const PrivacyPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, currentLanguage } = useLanguage()
  const [returnPath, setReturnPath] = useState('/')
  const [currentTheme, setCurrentTheme] = useState('light')

  useEffect(() => {
    // Применяем сохраненную тему при загрузке страницы
    const savedTheme = getSavedTheme()
    applyTheme(savedTheme, { skipSave: true }) // Стало
    setCurrentTheme(savedTheme)
    
    // Определяем путь возврата на основе referrer или state
    const from = location.state?.from || document.referrer
    
    if (from && (from.includes('/settings') || from.includes('settings'))) {
      setReturnPath('/settings')
    } else if (from && (from.includes('/register') || from.includes('register'))) {
      setReturnPath('/register')
    } else if (from && (from.includes('/auth') || from.includes('auth'))) {
      setReturnPath('/auth')
    } else {
      // Проверяем, залогинен ли пользователь
      const user = localStorage.getItem('user')
      if (user) {
        setReturnPath('/feed')
      } else {
        setReturnPath('/')
      }
    }
  }, [location])

  const getPrivacyContent = () => {
    switch (currentLanguage) {
      case 'EN':
        return (
          <div className="terms-content">
            <h2>1. Information Collection</h2>
            <p>We collect the following information:</p>
            <ul>
              <li>User login and nickname</li>
              <li>Date of birth (for age verification)</li>
              <li>Gender (for personalized recommendations)</li>
              <li>Carbon footprint data</li>
            </ul>
            
            <h2>2. Use of Information</h2>
            <p>Collected information is used for:</p>
            <ul>
              <li>Providing personalized recommendations</li>
              <li>Calculating carbon footprint</li>
              <li>Improving service quality</li>
              <li>Compliance with the legislation of the Republic of Belarus</li>
            </ul>
            
            <h2>3. Data Protection</h2>
            <p>We apply modern methods of personal data protection, including password encryption and secure data transmission.</p>
            
            <h2>4. Data Transfer to Third Parties</h2>
            <p>Personal data is not transferred to third parties without user consent, except in cases provided by law.</p>
            
            <h2>5. Cookies and Analytics</h2>
            <p>The service uses cookies to save language settings and improve user experience.</p>
            
            <h2>6. User Rights</h2>
            <p>The user has the right to:</p>
            <ul>
              <li>Request information about collected data</li>
              <li>Demand correction of inaccurate data</li>
              <li>Delete their account and all related data</li>
            </ul>
            
            <h2>7. Contacts</h2>
            <p>For privacy questions: privacy@ecosteps.by</p>
            
            <h2>8. Policy Changes</h2>
            <p>Changes to the privacy policy take effect after publication on the website.</p>
          </div>
        )
      
      case 'BY':
        return (
          <div className="terms-content">
            <h2>1. Збор інфармацыі</h2>
            <p>Мы збіраем наступную інфармацыю:</p>
            <ul>
              <li>Логін і мянушку карыстальніка</li>
              <li>Дату нараджэння (для праверкі ўзросту)</li>
              <li>Пол (для персаналізацыі рэкамендацый)</li>
              <li>Дадзеныя аб вугляродным следзе</li>
            </ul>
            
            <h2>2. Выкарыстанне інфармацыі</h2>
            <p>Сабраная інфармацыя выкарыстоўваецца для:</p>
            <ul>
              <li>Прадастаўлення персаналізаваных рэкамендацый</li>
              <li>Разліку вугляроднага следу</li>
              <li>Паляпшэння якасці сэрвісу</li>
              <li>Выканання заканадаўства Рэспублікі Беларусь</li>
            </ul>
            
            <h2>3. Абарона дадзеных</h2>
            <p>Мы прымяняем сучасныя метады абароны персанальных дадзеных, уключаючы шыфраванне пароляў і бяспечную перадачу дадзеных.</p>
            
            <h2>4. Перадача дадзеных трэцім асобам</h2>
            <p>Персанальныя дадзеныя не перадаюцца трэцім асобам без згоды карыстальніка, за выключэннем выпадкаў, прадугледжаных заканадаўствам.</p>
            
            <h2>5. Cookies і аналітыка</h2>
            <p>Сэрвіс выкарыстоўвае cookies для захавання налад мовы і паляпшэння карыстальніцкага досведу.</p>
            
            <h2>6. Правы карыстальніка</h2>
            <p>Карыстальнік мае права:</p>
            <ul>
              <li>Запытаць інфармацыю аб сабраных дадзеных</li>
              <li>Патрабаваць выпраўлення недакладных дадзеных</li>
              <li>Выдаліць свой акаўнт і ўсе звязаныя дадзеныя</li>
            </ul>
            
            <h2>7. Кантакты</h2>
            <p>Па пытаннях канфідэнцыяльнасці: privacy@ecosteps.by</p>
            
            <h2>8. Змены палітыкі</h2>
            <p>Змены ў палітыку канфідэнцыяльнасці ўступаюць у сілу пасля публікацыі на сайце.</p>
          </div>
        )
      
      default: // RU
        return (
          <div className="terms-content">
            <h2>1. Сбор информации</h2>
            <p>Мы собираем следующую информацию:</p>
            <ul>
              <li>Логин и никнейм пользователя</li>
              <li>Дату рождения (для проверки возраста)</li>
              <li>Пол (для персонализации рекомендаций)</li>
              <li>Данные об углеродном следе</li>
            </ul>
            
            <h2>2. Использование информации</h2>
            <p>Собранная информация используется для:</p>
            <ul>
              <li>Предоставления персонализированных рекомендаций</li>
              <li>Расчета углеродного следа</li>
              <li>Улучшения качества сервиса</li>
              <li>Соблюдения законодательства Республики Беларусь</li>
            </ul>
            
            <h2>3. Защита данных</h2>
            <p>Мы применяем современные методы защиты персональных данных, включая шифрование паролей и безопасную передачу данных.</p>
            
            <h2>4. Передача данных третьим лицам</h2>
            <p>Персональные данные не передаются третьим лицам без согласия пользователя, за исключением случаев, предусмотренных законодательством.</p>
            
            <h2>5. Cookies и аналитика</h2>
            <p>Сервис использует cookies для сохранения настроек языка и улучшения пользовательского опыта.</p>
            
            <h2>6. Права пользователя</h2>
            <p>Пользователь имеет право:</p>
            <ul>
              <li>Запросить информацию о собранных данных</li>
              <li>Потребовать исправления неточных данных</li>
              <li>Удалить свой аккаунт и все связанные данные</li>
            </ul>
            
            <h2>7. Контакты</h2>
            <p>По вопросам конфиденциальности: privacy@ecosteps.by</p>
            
            <h2>8. Изменения политики</h2>
            <p>Изменения в политику конфиденциальности вступают в силу после публикации на сайте.</p>
          </div>
        )
    }
  }

  return (
    <div className="terms-page" data-theme={currentTheme}>
      <div className="terms-container">
      <button onClick={() => navigate(returnPath)} className="back-link">← {t('backButton')}</button>        
        
        <h1>{t('privacyPageTitle')}</h1>
        
        {getPrivacyContent()}
      </div>
    </div>
  )
}

export default PrivacyPage