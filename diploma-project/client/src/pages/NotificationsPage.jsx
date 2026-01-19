import '../styles/pages/CommonPage.css'

const NotificationsPage = () => {
  return (
    <div className="common-page">
      <div className="common-container">
        <h1 className="common-title">Уведомления</h1>
        <div className="common-empty">
          <span className="empty-icon">
            <span className="material-icons" style={{ fontSize: '4rem', opacity: 0.3 }}>notifications</span>
          </span>
          <p>Нет новых уведомлений</p>
          <p className="empty-description">Здесь будут отображаться важные уведомления системы</p>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
