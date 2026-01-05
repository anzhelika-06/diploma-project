import { Link } from 'react-router-dom'
import { translations, getSavedLanguage } from '../utils/translations'
import '../styles/pages/TermsPage.css'

const TermsPage = () => {
  const currentLanguage = getSavedLanguage()
  const t = translations[currentLanguage]

  const getTermsContent = () => {
    switch (currentLanguage) {
      case 'EN':
        return (
          <div className="terms-content">
            <h2>1. General Provisions</h2>
            <p>These Terms of Service govern the use of the EcoSteps platform, designed for tracking and reducing carbon footprint.</p>
            
            <h2>2. Registration and Account</h2>
            <p>To use the service, you must create an account. The user undertakes to provide accurate information and keep it up to date.</p>
            
            <h2>3. Age Restrictions</h2>
            <p>The service is intended for persons who have reached the age of 18. Registration of minors is prohibited.</p>
            
            <h2>4. User Obligations</h2>
            <p>The user undertakes to:</p>
            <ul>
              <li>Use the service in accordance with its intended purpose</li>
              <li>Not violate the rights of other users</li>
              <li>Provide accurate carbon footprint data</li>
              <li>Comply with the legislation of the Republic of Belarus</li>
            </ul>
            
            <h2>5. Liability</h2>
            <p>The service administration is not responsible for the accuracy of carbon footprint calculations and their use for commercial purposes.</p>
            
            <h2>6. Changes to Terms</h2>
            <p>The administration reserves the right to change these terms with notification to users.</p>
            
            <h2>7. Contact Information</h2>
            <p>For questions about using the service, contact: support@ecosteps.by</p>
          </div>
        )
      
      case 'BY':
        return (
          <div className="terms-content">
            <h2>1. Агульныя палажэнні</h2>
            <p>Гэтыя Умовы Карыстання рэгулююць выкарыстанне платформы EcoSteps, прызначанай для адсочвання і памяншэння вугляроднага следу.</p>
            
            <h2>2. Рэгістрацыя і акаўнт</h2>
            <p>Для выкарыстання сэрвісу неабходна стварыць акаўнт. Карыстальнік абавязуецца прадаставіць дакладную інфармацыю і падтрымліваць яе актуальнасць.</p>
            
            <h2>3. Узроставыя абмежаванні</h2>
            <p>Сэрвіс прызначаны для асоб, якія дасягнулі 18-гадовага ўзросту. Рэгістрацыя непаўналетніх забаронена.</p>
            
            <h2>4. Абавязкі карыстальніка</h2>
            <p>Карыстальнік абавязуецца:</p>
            <ul>
              <li>Выкарыстоўваць сэрвіс у адпаведнасці з яго прызначэннем</li>
              <li>Не парушаць правы іншых карыстальнікаў</li>
              <li>Прадастаўляць дакладныя дадзеныя аб вугляродным следзе</li>
              <li>Выконваць заканадаўства Рэспублікі Беларусь</li>
            </ul>
            
            <h2>5. Адказнасць</h2>
            <p>Адміністрацыя сэрвісу не нясе адказнасці за дакладнасць разлікаў вугляроднага следу і іх выкарыстанне ў камерцыйных мэтах.</p>
            
            <h2>6. Змены ўмоў</h2>
            <p>Адміністрацыя пакідае за сабой права змяняць гэтыя ўмовы з апавяшчэннем карыстальнікаў.</p>
            
            <h2>7. Кантактная інфармацыя</h2>
            <p>Па пытаннях выкарыстання сэрвісу звяртайцеся: support@ecosteps.by</p>
          </div>
        )
      
      default: // RU
        return (
          <div className="terms-content">
            <h2>1. Общие положения</h2>
            <p>Настоящие Условия Пользования регулируют использование платформы EcoSteps, предназначенной для отслеживания и уменьшения углеродного следа.</p>
            
            <h2>2. Регистрация и аккаунт</h2>
            <p>Для использования сервиса необходимо создать аккаунт. Пользователь обязуется предоставить достоверную информацию и поддерживать её актуальность.</p>
            
            <h2>3. Возрастные ограничения</h2>
            <p>Сервис предназначен для лиц, достигших 18-летнего возраста. Регистрация несовершеннолетних запрещена.</p>
            
            <h2>4. Обязательства пользователя</h2>
            <p>Пользователь обязуется:</p>
            <ul>
              <li>Использовать сервис в соответствии с его назначением</li>
              <li>Не нарушать права других пользователей</li>
              <li>Предоставлять достоверные данные об углеродном следе</li>
              <li>Соблюдать законодательство Республики Беларусь</li>
            </ul>
            
            <h2>5. Ответственность</h2>
            <p>Администрация сервиса не несет ответственности за точность расчетов углеродного следа и их использование в коммерческих целях.</p>
            
            <h2>6. Изменения условий</h2>
            <p>Администрация оставляет за собой право изменять настоящие условия с уведомлением пользователей.</p>
            
            <h2>7. Контактная информация</h2>
            <p>По вопросам использования сервиса обращайтесь: support@ecosteps.by</p>
          </div>
        )
    }
  }

  return (
    <div className="terms-page">
      <div className="terms-container">
        <Link to="/register" className="back-link">{t.backToRegistration}</Link>
        
        <h1>{t.termsPageTitle}</h1>
        
        {getTermsContent()}
      </div>
    </div>
  )
}

export default TermsPage