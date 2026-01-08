// Утилита для преобразования кодов эмодзи в настоящие эмодзи
export const getEmojiByCode = (code) => {
  const emojiMap = {
    // Основные эмодзи для пользователей (автоматические по уровню)
    'star': '🌟',
    'leaf': '🌿', 
    'tree': '🌳',
    'sprout': '🌱',
    'seedling': '🍀',
    'plant': '🌾',
    // Для команд (выбираемые)
    'city': '🏙️',
    'graduation': '🎓',
    'bike': '🚴',
    'sun': '☀️',
    'recycle': '♻️',
    'mountain': '🏔️',
    'forest': '🌲',
    'ocean': '🌊',
    'earth': '🌍',
    'lightning': '⚡'
  }
  
  return emojiMap[code] || '🌱' // По умолчанию возвращаем росток
}

// Функция для получения эмодзи по уровню экономии CO2 (для пользователей)
export const getEmojiByCarbon = (carbonSaved) => {
  if (carbonSaved >= 5000) return '🌟'  // Эко-герой
  if (carbonSaved >= 4000) return '🌿'  // Эко-мастер
  if (carbonSaved >= 3000) return '🌳'  // Эко-активист
  if (carbonSaved >= 2000) return '🌱'  // Эко-энтузиаст
  if (carbonSaved >= 1000) return '🍀'  // Эко-стартер
  return '🌾'                           // Эко-новичок
}

// Функция для получения всех доступных эмодзи для команд
export const getAvailableTeamAvatars = () => {
  return [
    { code: 'city', emoji: '🏙️', name: 'Город' },
    { code: 'graduation', emoji: '🎓', name: 'Образование' },
    { code: 'bike', emoji: '🚴', name: 'Велосипед' },
    { code: 'sun', emoji: '☀️', name: 'Солнце' },
    { code: 'recycle', emoji: '♻️', name: 'Переработка' },
    { code: 'mountain', emoji: '🏔️', name: 'Горы' },
    { code: 'forest', emoji: '🌲', name: 'Лес' },
    { code: 'ocean', emoji: '🌊', name: 'Океан' },
    { code: 'earth', emoji: '🌍', name: 'Земля' },
    { code: 'lightning', emoji: '⚡', name: 'Энергия' }
  ]
}