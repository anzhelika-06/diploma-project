import { useState } from 'react'
import '../styles/pages/CommonPage.css'

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="common-page">
      <div className="common-container">
        <h1>🔍 Поиск</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Поиск пользователей, команд..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <p className="coming-soon">Функция поиска в разработке</p>
      </div>
    </div>
  )
}

export default SearchPage
