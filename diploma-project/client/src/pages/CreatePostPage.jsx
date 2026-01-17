import '../styles/pages/CommonPage.css'

const CreatePostPage = () => {
  return (
    <div className="common-page">
      <div className="common-container">
        <h1 className="common-title">➕ Создать пост</h1>
        <div className="create-form">
          <textarea 
            placeholder="Расскажите о своих эко-достижениях..."
            rows="6"
          />
          <div className="form-actions">
            <button className="btn-secondary">Отмена</button>
            <button className="btn-primary">Опубликовать</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePostPage
