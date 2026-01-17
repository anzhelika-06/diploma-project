import '../styles/pages/CommonPage.css'

const NotificationsPage = () => {
  return (
    <div className="common-page">
      <div className="common-container">
        <h1 className="common-title">🔔 Уведомления</h1>
        <div className="common-empty">
          <span className="empty-icon">🔔</span>
          <p>Нет новых уведомлений</p>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
