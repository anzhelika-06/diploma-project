import '../styles/pages/CommonPage.css'

const AchievementsPage = () => {
  return (
    <div className="common-page">
      <div className="common-container">
        <h1 className="common-title">🏆 Достижения</h1>
        <div className="common-tabs">
          <button className="tab-btn active">Мои достижения</button>
          <button className="tab-btn">Все достижения</button>
        </div>
        <div className="common-empty">
          <span className="empty-icon">🏆</span>
          <p>Пока нет достижений</p>
          <p className="empty-hint">Выполняйте эко-задачи и получайте награды!</p>
        </div>
      </div>
    </div>
  )
}

export default AchievementsPage
