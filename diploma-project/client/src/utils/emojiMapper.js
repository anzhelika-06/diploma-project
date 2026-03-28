// Утилита для преобразования кодов эмодзи в настоящие эмодзи
export const getEmojiByCode = (code) => {
  const emojiMap = {
    // Основные эмодзи для пользователей (автоматические по уровню) - соответствуют серверной логике
    'star': '🌟',      // >= 5000 кг CO₂
    'leaf': '🌿',      // >= 4000 кг CO₂  
    'tree': '🌳',      // >= 3000 кг CO₂
    'sprout': '🌱',    // >= 2000 кг CO₂
    'seedling': '🍀',  // >= 1000 кг CO₂
    'plant': '🌾',     // < 1000 кг CO₂
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

// Функция для получения эмодзи по уровню экономии CO2 (для пользователей) - точно соответствует серверной логике
export const getEmojiByCarbon = (carbonSaved) => {
  if (carbonSaved >= 5000) return '🌟'  // star - Эко-герой
  if (carbonSaved >= 4000) return '🌿'  // leaf - Эко-мастер
  if (carbonSaved >= 3000) return '🌳'  // tree - Эко-активист
  if (carbonSaved >= 2000) return '🌱'  // sprout - Эко-энтузиаст
  if (carbonSaved >= 1000) return '🍀'  // seedling - Эко-стартер
  return '🌾'                           // plant - Эко-новичок
}

// Функция для получения текстового уровня по количеству сэкономленного CO2
export const getEcoLevelText = (carbonSaved) => {
  if (carbonSaved >= 5000) return 'Эко-герой'
  if (carbonSaved >= 4000) return 'Эко-мастер'
  if (carbonSaved >= 3000) return 'Эко-активист'
  if (carbonSaved >= 2000) return 'Эко-энтузиаст'
  if (carbonSaved >= 1000) return 'Эко-стартер'
  return 'Эко-новичок'
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
    { code: 'lightning', emoji: '⚡', name: 'Энергия' },
    { code: 'seedling', emoji: '🌱', name: 'Росток' },
    { code: 'leaf', emoji: '🍃', name: 'Листья' },
    { code: 'flower', emoji: '🌸', name: 'Цветок' },
    { code: 'tree', emoji: '🌳', name: 'Дерево' },
    { code: 'snowflake', emoji: '❄️', name: 'Снежинка' },
    { code: 'wind', emoji: '🌬️', name: 'Ветер' },
    { code: 'water', emoji: '💧', name: 'Вода' },
    { code: 'fire', emoji: '🔥', name: 'Огонь' },
    { code: 'rainbow', emoji: '🌈', name: 'Радуга' },
    { code: 'park', emoji: '🏞️', name: 'Парк' },
    { code: 'tent', emoji: '⛺', name: 'Поход' },
    { code: 'running', emoji: '🏃', name: 'Бег' },
    { code: 'handshake', emoji: '🤝', name: 'Сотрудничество' },
    { code: 'bulb', emoji: '💡', name: 'Идея' },
    { code: 'rocket', emoji: '🚀', name: 'Прогресс' },
    { code: 'star', emoji: '⭐', name: 'Звезда' },
    { code: 'heart', emoji: '💚', name: 'Забота' },
    { code: 'globe', emoji: '🌐', name: 'Глобус' },
    { code: 'bee', emoji: '🐝', name: 'Пчела' },
    { code: 'butterfly', emoji: '🦋', name: 'Бабочка' },
    { code: 'fish', emoji: '🐟', name: 'Рыба' },
    { code: 'wolf', emoji: '🐺', name: 'Волк' },
    { code: 'bear', emoji: '🐻', name: 'Медведь' },
    { code: 'fox', emoji: '🦊', name: 'Лиса' },
    { code: 'owl', emoji: '🦉', name: 'Сова' },
  ]
}