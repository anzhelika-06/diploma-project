// Файл с переводами для всех языков приложения

export const translations = {
  RU: {
    mainTitle: "Уменьшите свой углеродный след",
    mainSubtitle: "Отслеживайте, соревнуйтесь\nи меняйте ситуацию к лучшему",
    demoButton: "Демо-калькулятор",
    loginButton: "Войти",
    aboutLink: "Подробнее о нас",
    registerLink: "Зарегистрироваться",
    // Переводы для калькулятора
    calculatorTitle: "Демо-калькулятор",
    calculatorSubtitle: "Предварительный расчет углеродного следа",
    nutritionTitle: "Питание",
    nutritionOptions: {
      balanced: "Сбалансированное",
      vegetarian: "Вегетарианское",
      vegan: "Веганское",
      meat: "Мясное"
    },
    transportTitle: "Транспорт",
    transportOptions: {
      public: "Общественный",
      car: "Личный автомобиль",
      bike: "Велосипед/пешком",
      mixed: "Смешанный"
    },
    calculateButton: "Посчитать",
    // Переводы для результатов
    resultTitle: "Результат расчета",
    totalFootprint: "Общий углеродный след",
    nutrition: "Питание",
    transport: "Транспорт",
    recommendations: "Рекомендации",
    comparison: "Сравнение со средними показателями",
    worldAverage: "Мировой средний",
    okButton: "Отлично",
    // Единицы измерения
    units: {
      kgCO2Year: "кг CO₂/год",
      kgCO2PerTreeYear: "кг CO₂ на дерево в год"
    },
    kgCO2: "кг CO₂",
    // Переводы уровней экологичности
    ecoLevels: {
      excellent: "Отличный результат! Очень низкий углеродный след",
      good: "Хороший результат! Низкий углеродный след", 
      medium: "Средний углеродный след",
      high: "Высокий углеродный след",
      critical: "Критически высокий углеродный след"
    },
    // Переводы для страницы авторизации
    loginTitle: "Авторизация",
    registerTitle: "Регистрация",
    homeText: "Главная",
    homeAlt: "Домой",
    loginPlaceholder: "Введите логин",
    passwordPlaceholder: "Введите пароль",
    loginRequired: "Пожалуйста, заполните поле логина",
    passwordRequired: "Пожалуйста, заполните поле пароля",
    // Тексты для ссылок между авторизацией и регистрацией
    noAccountText: "Нет аккаунта?",
    hasAccountText: "Уже есть аккаунт?",
    loginLink: "Войти",
    nextButton: "Далее",
    registerButton: "Зарегистрироваться",
    // Ошибки авторизации
    invalidCredentials: "Неверный логин или пароль",
    userNotFound: "Пользователь не найден",
    serverError: "Ошибка сервера. Попробуйте позже",
    networkError: "Ошибка сети. Проверьте подключение",
    // Кнопка звука и статичная фраза листика
    enableLeafSound: "Включить звук листика",
    leafStaticPhrase: "Привет! Каждый твой выбор теперь — это вклад. Следим за следом вместе?",
    // Сообщения калькулятора
    calculatorError: "Ошибка",
    calculatorErrorMessage: "Пожалуйста, выберите все параметры",
    calculatorErrorButton: "Понятно",
    calculatorTranslating: "Переводим рекомендации...",
    // Страница "О нас"
    aboutPageTitle: "О проекте EcoSteps",
    aboutPageSubtitle: "Вместе к экологичному будущему",
    aboutTabAbout: "О нас",
    aboutTabStories: "Истории успеха",
    aboutTabRatings: "Рейтинги",
    aboutMissionTitle: "Наша миссия",
    aboutMissionText: "EcoSteps — это платформа для тех, кто хочет внести свой вклад в защиту окружающей среды. Мы помогаем людям понять их углеродный след и предлагаем конкретные шаги для его уменьшения.",
    aboutWhatWeOfferTitle: "Что мы предлагаем",
    aboutFeatureCalculator: "Калькулятор углеродного следа",
    aboutFeatureCalculatorDesc: "Рассчитайте свой углеродный след и получите персональные рекомендации",
    aboutFeatureCommunity: "Сообщество",
    aboutFeatureCommunityDesc: "Присоединяйтесь к командам единомышленников и делитесь опытом",
    aboutFeatureRatings: "Рейтинги и достижения",
    aboutFeatureRatingsDesc: "Отслеживайте свой прогресс и соревнуйтесь с другими пользователями",
    aboutFeatureStories: "Истории успеха",
    aboutFeatureStoriesDesc: "Делитесь своими достижениями и вдохновляйтесь опытом других",
    aboutAchievementsTitle: "Наши достижения",
    aboutActiveUsers: "Активных пользователей",
    aboutCO2Saved: "CO₂ сэкономлено",
    aboutEcoTeams: "Эко-команд",
    aboutSuccessStories: "Историй успеха",
    aboutStoriesAll: "Все истории",
    aboutStoriesBest: "Лучшие",
    aboutStoriesRecent: "Недавние",
    aboutCategoriesLabel: "Категории:",
    aboutCategoriesAll: "Все",
    aboutStoriesLoading: "Загрузка историй...",
    aboutCarbonSaved: "Сэкономлено:",
    aboutTopUsers: "Топ-5 пользователей по экономии CO₂",
    aboutTopTeams: "Топ-5 команд по экономии CO₂",
    aboutRatingsUsers: "Топ пользователей",
    aboutRatingsTeams: "Топ команд",
    aboutMembersCount: "участников",
    // Переводы категорий историй
    categoryTransport: "Транспорт",
    categoryFood: "Питание", 
    categoryEnergy: "Энергия",
    categoryWaste: "Отходы",
    categoryWater: "Вода",
    categoryGeneral: "Общее",
    categoryConsumption: "Потребление",
    // Эко-уровни пользователей (только реально используемые)
    ecoLevelBeginner: "Новичок",
    ecoLevelAdvanced: "Продвинутый",
    ecoLevelExpert: "Эксперт",
    ecoLevelMaster: "Мастер",
    ecoLevelChampion: "Чемпион",
    ecoLevelEcoHero: "Эко-герой",
    // Дополнительные уровни из БД
    ecoLevelEcoNovice: "Эко-новичок",
    ecoLevelEcoStarter: "Эко-стартер",
    ecoLevelEcoEnthusiast: "Эко-энтузиаст",
    ecoLevelEcoActivist: "Эко-активист",
    ecoLevelEcoMaster: "Эко-мастер"
  },
  EN: {
    mainTitle: "Reduce your carbon footprint",
    mainSubtitle: "Track, compete\nand make a difference",
    demoButton: "Demo Calculator",
    loginButton: "Login",
    aboutLink: "About us",
    registerLink: "Sign up",
    // Переводы для калькулятора
    calculatorTitle: "Demo Calculator",
    calculatorSubtitle: "Preliminary carbon footprint calculation",
    nutritionTitle: "Nutrition",
    nutritionOptions: {
      balanced: "Balanced",
      vegetarian: "Vegetarian",
      vegan: "Vegan",
      meat: "Meat-based"
    },
    transportTitle: "Transport",
    transportOptions: {
      public: "Public transport",
      car: "Personal car",
      bike: "Bike/walking",
      mixed: "Mixed"
    },
    calculateButton: "Calculate",
    // Переводы для результатов
    resultTitle: "Calculation Result",
    totalFootprint: "Total carbon footprint",
    nutrition: "Nutrition",
    transport: "Transport",
    recommendations: "Recommendations",
    comparison: "Comparison with averages",
    worldAverage: "World average",
    okButton: "Great",
    // Единицы измерения
    units: {
      kgCO2Year: "kg CO₂/year",
      kgCO2PerTreeYear: "kg CO₂ per tree per year"
    },
    kgCO2: "kg CO₂",
    // Переводы уровней экологичности
    ecoLevels: {
      excellent: "Excellent result! Very low carbon footprint",
      good: "Good result! Low carbon footprint",
      medium: "Medium carbon footprint", 
      high: "High carbon footprint",
      critical: "Critically high carbon footprint"
    },
    // Переводы для страницы авторизации
    loginTitle: "Authorization",
    registerTitle: "Registration",
    homeText: "Home",
    homeAlt: "Home",
    loginPlaceholder: "Enter login",
    passwordPlaceholder: "Enter password",
    loginRequired: "Please fill in the login field",
    passwordRequired: "Please fill in the password field",
    // Тексты для ссылок между авторизацией и регистрацией
    noAccountText: "Don't have an account?",
    hasAccountText: "Already have an account?",
    loginLink: "Login",
    nextButton: "Next",
    registerButton: "Register",
    // Ошибки авторизации
    invalidCredentials: "Invalid login or password",
    userNotFound: "User not found",
    serverError: "Server error. Please try again later",
    networkError: "Network error. Check your connection",
    // Кнопка звука и статичная фраза листика
    enableLeafSound: "Enable leaf sound",
    leafStaticPhrase: "Hello! Every choice you make now is a contribution. Let's track our footprint together?",
    // Сообщения калькулятора
    calculatorError: "Error",
    calculatorErrorMessage: "Please select all parameters",
    calculatorErrorButton: "Understood",
    calculatorTranslating: "Translating recommendations...",
    // Страница "О нас"
    aboutPageTitle: "About EcoSteps Project",
    aboutPageSubtitle: "Together towards an ecological future",
    aboutTabAbout: "About us",
    aboutTabStories: "Success stories",
    aboutTabRatings: "Rankings",
    aboutMissionTitle: "Our mission",
    aboutMissionText: "EcoSteps is a platform for those who want to contribute to environmental protection. We help people understand their carbon footprint and offer concrete steps to reduce it.",
    aboutWhatWeOfferTitle: "What we offer",
    aboutFeatureCalculator: "Carbon footprint calculator",
    aboutFeatureCalculatorDesc: "Calculate your carbon footprint and get personalized recommendations",
    aboutFeatureCommunity: "Community",
    aboutFeatureCommunityDesc: "Join teams of like-minded people and share experiences",
    aboutFeatureRatings: "Rankings and achievements",
    aboutFeatureRatingsDesc: "Track your progress and compete with other users",
    aboutFeatureStories: "Success stories",
    aboutFeatureStoriesDesc: "Share your achievements and get inspired by others' experiences",
    aboutAchievementsTitle: "Our achievements",
    aboutActiveUsers: "Active users",
    aboutCO2Saved: "CO₂ saved",
    aboutEcoTeams: "Eco-teams",
    aboutSuccessStories: "Success stories",
    aboutStoriesAll: "All stories",
    aboutStoriesBest: "Best",
    aboutStoriesRecent: "Recent",
    aboutCategoriesLabel: "Categories:",
    aboutCategoriesAll: "All",
    aboutStoriesLoading: "Loading stories...",
    aboutCarbonSaved: "Saved:",
    aboutTopUsers: "Top-5 users by CO₂ savings",
    aboutTopTeams: "Top-5 teams by CO₂ savings",
    aboutRatingsUsers: "Top users",
    aboutRatingsTeams: "Top teams",
    aboutMembersCount: "members",
    // Переводы категорий историй
    categoryTransport: "Transport",
    categoryFood: "Food", 
    categoryEnergy: "Energy",
    categoryWaste: "Waste",
    categoryWater: "Water",
    categoryGeneral: "General",
    categoryConsumption: "Consumption",
    // Эко-уровни пользователей
    ecoLevelBeginner: "Beginner",
    ecoLevelAdvanced: "Advanced",
    ecoLevelExpert: "Expert",
    ecoLevelMaster: "Master",
    ecoLevelChampion: "Champion",
    ecoLevelEcoHero: "Eco Hero",
    // Дополнительные уровни из БД
    ecoLevelEcoNovice: "Eco Novice",
    ecoLevelEcoStarter: "Eco Starter",
    ecoLevelEcoEnthusiast: "Eco Enthusiast",
    ecoLevelEcoActivist: "Eco Activist",
    ecoLevelEcoMaster: "Eco Master"
  },
  BY: {
    mainTitle: "Паменшыце свой вугляродны след",
    mainSubtitle: "Сачыце, спаборнічайце\nі змяняйце сітуацыю да лепшага",
    demoButton: "Дэма-калькулятар",
    loginButton: "Увайсці",
    aboutLink: "Падрабязней пра нас",
    registerLink: "Зарэгістравацца",
    // Переводы для калькулятора
    calculatorTitle: "Дэма-калькулятар",
    calculatorSubtitle: "Папярэдні разлік вугляроднага следу",
    nutritionTitle: "Харчаванне",
    nutritionOptions: {
      balanced: "Збалансаванае",
      vegetarian: "Вегетарыянскае",
      vegan: "Веганскае",
      meat: "Мясное"
    },
    transportTitle: "Транспарт",
    transportOptions: {
      public: "Грамадскі",
      car: "Асабісты аўтамабіль",
      bike: "Ровар/пешшу",
      mixed: "Змешаны"
    },
    calculateButton: "Палічыць",
    // Переводы для результатов
    resultTitle: "Вынік разліку",
    totalFootprint: "Агульны вугляродны след",
    nutrition: "Харчаванне",
    transport: "Транспарт",
    recommendations: "Рэкамендацыі",
    comparison: "Параўнанне з сярэднімі паказчыкамі",
    worldAverage: "Сусветны сярэдні",
    okButton: "Выдатна",
    // Единицы измерения
    units: {
      kgCO2Year: "кг CO₂/год",
      kgCO2PerTreeYear: "кг CO₂ на дрэва ў год"
    },
    kgCO2: "кг CO₂",
    // Переводы уровней экологичности
    ecoLevels: {
      excellent: "Выдатны вынік! Вельмі нізкі вугляродны след",
      good: "Добры вынік! Нізкі вугляродны след",
      medium: "Сярэдні вугляродны след",
      high: "Высокі вугляродны след", 
      critical: "Крытычна высокі вугляродны след"
    },
    // Переводы для страницы авторизации
    loginTitle: "Аўтарызацыя",
    registerTitle: "Рэгістрацыя",
    homeText: "Галоўная",
    homeAlt: "Дадому",
    loginPlaceholder: "Увядзіце логін",
    passwordPlaceholder: "Увядзіце пароль",
    loginRequired: "Калі ласка, запоўніце поле логіна",
    passwordRequired: "Калі ласка, запоўніце поле пароля",
    // Тексты для ссылок между авторизацией и регистрацией
    noAccountText: "Няма акаўнта?",
    hasAccountText: "Ужо ёсць акаўнт?",
    loginLink: "Увайсці",
    nextButton: "Далей",
    registerButton: "Зарэгістравацца",
    // Ошибки авторизации
    invalidCredentials: "Няправільны логін або пароль",
    userNotFound: "Карыстальнік не знойдзены",
    serverError: "Памылка сервера. Паспрабуйце пазней",
    networkError: "Памылка сеткі. Праверце злучэнне",
    // Кнопка звука и статичная фраза листика
    enableLeafSound: "Уключыць гук лісціка",
    leafStaticPhrase: "Прывітанне! Кожны твой выбар цяпер — гэта ўклад. Сочым за следам разам?",
    // Сообщения калькулятора
    calculatorError: "Памылка",
    calculatorErrorMessage: "Калі ласка, выберыце ўсе параметры",
    calculatorErrorButton: "Зразумела",
    calculatorTranslating: "Перакладаем рэкамендацыі...",
    // Страница "О нас"
    aboutPageTitle: "Пра праект EcoSteps",
    aboutPageSubtitle: "Разам да экалагічнай будучыні",
    aboutTabAbout: "Пра нас",
    aboutTabStories: "Гісторыі поспеху",
    aboutTabRatings: "Рэйтынгі",
    aboutMissionTitle: "Наша місія",
    aboutMissionText: "EcoSteps — гэта платформа для тых, хто хоче ўнесці свой уклад у абарону навакольнага асяроддзя. Мы дапамагаем людзям зразумець іх вугляродны след і прапануем канкрэтныя крокі для яго памяншэння.",
    aboutWhatWeOfferTitle: "Што мы прапануем",
    aboutFeatureCalculator: "Калькулятар вугляроднага следу",
    aboutFeatureCalculatorDesc: "Разлічыце свой вугляродны след і атрымайце персанальныя рэкамендацыі",
    aboutFeatureCommunity: "Супольнасць",
    aboutFeatureCommunityDesc: "Далучайцеся да каманд аднадумцаў і дзяліцеся досведам",
    aboutFeatureRatings: "Рэйтынгі і дасягненні",
    aboutFeatureRatingsDesc: "Сачыце за сваім прагрэсам і спаборнічайце з іншымі карыстальнікамі",
    aboutFeatureStories: "Гісторыі поспеху",
    aboutFeatureStoriesDesc: "Дзяліцеся сваімі дасягненнямі і натхняйцеся досведам іншых",
    aboutAchievementsTitle: "Нашы дасягненні",
    aboutActiveUsers: "Актыўных карыстальнікаў",
    aboutCO2Saved: "CO₂ зэканомлена",
    aboutEcoTeams: "Эка-каманд",
    aboutSuccessStories: "Гісторый поспеху",
    aboutStoriesAll: "Усе гісторыі",
    aboutStoriesBest: "Лепшыя",
    aboutStoriesRecent: "Нядаўнія",
    aboutCategoriesLabel: "Катэгорыі:",
    aboutCategoriesAll: "Усе",
    aboutStoriesLoading: "Загрузка гісторый...",
    aboutCarbonSaved: "Зэканомлена:",
    aboutTopUsers: "Топ-5 карыстальнікаў па эканоміі CO₂",
    aboutTopTeams: "Топ-5 каманд па эканоміі CO₂",
    aboutRatingsUsers: "Топ карыстальнікаў",
    aboutRatingsTeams: "Топ каманд",
    aboutMembersCount: "удзельнікаў",
    // Переводы категорий историй
    categoryTransport: "Транспарт",
    categoryFood: "Харчаванне", 
    categoryEnergy: "Энергія",
    categoryWaste: "Адходы",
    categoryWater: "Вада",
    categoryGeneral: "Агульнае",
    categoryConsumption: "Спажыванне",
    // Эко-уровни пользователей
    ecoLevelBeginner: "Пачаткоўец",
    ecoLevelAdvanced: "Прасунуты",
    ecoLevelExpert: "Эксперт",
    ecoLevelMaster: "Майстар",
    ecoLevelChampion: "Чэмпіён",
    ecoLevelEcoHero: "Эка-герой",
    // Дополнительные уровни из БД
    ecoLevelEcoNovice: "Эка-навічок",
    ecoLevelEcoStarter: "Эка-стартар",
    ecoLevelEcoEnthusiast: "Эка-энтузіяст",
    ecoLevelEcoActivist: "Эка-актывіст",
    ecoLevelEcoMaster: "Эка-майстар"
  }
}

// Доступные языки
export const availableLanguages = ['RU', 'EN', 'BY']

// Язык по умолчанию
export const defaultLanguage = 'RU'

// Функция для получения сохраненного языка из localStorage
export const getSavedLanguage = () => {
  try {
    const savedLanguage = localStorage.getItem('selectedLanguage')
    return availableLanguages.includes(savedLanguage) ? savedLanguage : defaultLanguage
  } catch (error) {
    console.warn('Не удалось получить сохраненный язык:', error)
    return defaultLanguage
  }
}

// Функция для сохранения языка в localStorage
export const saveLanguage = (language) => {
  try {
    if (availableLanguages.includes(language)) {
      localStorage.setItem('selectedLanguage', language)
    }
  } catch (error) {
    console.warn('Не удалось сохранить язык:', error)
  }
}

// Функция для перевода категорий
export const translateCategory = (category, language) => {
  if (!category || language === 'RU') {
    return category
  }

  const t = translations[language]
  
  // Статические переводы категорий
  const categoryMap = {
    'Транспорт': t.categoryTransport,
    'Питание': t.categoryFood,
    'Энергия': t.categoryEnergy,
    'Отходы': t.categoryWaste,
    'Вода': t.categoryWater,
    'Общее': t.categoryGeneral,
    'Потребление': t.categoryConsumption,
    // Английские варианты
    'Transport': t.categoryTransport,
    'Food': t.categoryFood,
    'Energy': t.categoryEnergy,
    'Waste': t.categoryWaste,
    'Water': t.categoryWater,
    'General': t.categoryGeneral,
    'Consumption': t.categoryConsumption
  }
  
  return categoryMap[category] || category
}

// Функция для перевода эко-уровней
export const translateEcoLevel = (level, language) => {
  if (!level || language === 'RU') {
    return level
  }

  const t = translations[language]
  
  // Сначала проверяем статические переводы
  const levelMap = {
    // Основные уровни
    'Новичок': t.ecoLevelBeginner,
    'Продвинутый': t.ecoLevelAdvanced,
    'Эксперт': t.ecoLevelExpert,
    'Мастер': t.ecoLevelMaster,
    'Чемпион': t.ecoLevelChampion,
    'Эко-герой': t.ecoLevelEcoHero,
    // Уровни из БД
    'Эко-новичок': t.ecoLevelEcoNovice,
    'Эко-стартер': t.ecoLevelEcoStarter,
    'Эко-энтузиаст': t.ecoLevelEcoEnthusiast,
    'Эко-активист': t.ecoLevelEcoActivist,
    'Эко-мастер': t.ecoLevelEcoMaster,
    // Английские варианты
    'Beginner': t.ecoLevelBeginner,
    'Advanced': t.ecoLevelAdvanced,
    'Expert': t.ecoLevelExpert,
    'Master': t.ecoLevelMaster,
    'Champion': t.ecoLevelChampion,
    'Eco Hero': t.ecoLevelEcoHero,
    'Eco Novice': t.ecoLevelEcoNovice,
    'Eco Starter': t.ecoLevelEcoStarter,
    'Eco Enthusiast': t.ecoLevelEcoEnthusiast,
    'Eco Activist': t.ecoLevelEcoActivist,
    'Eco Master': t.ecoLevelEcoMaster,
    // Дополнительные синонимы
    'Эколог': t.ecoLevelExpert
  }
  
  return levelMap[level] || level
}

// Функция для перевода сообщений с сервера
export const translateServerMessage = (message, language) => {
  const t = translations[language]
  
  // Статичные переводы сообщений сервера
  const serverMessages = {
    RU: {
      'Новые персонализированные рекомендации работают!': 'Новые персонализированные рекомендации работают!',
      'Критически высокий углеродный след': 'Критически высокий углеродный след',
      'Высокий углеродный след': 'Высокий углеродный след',
      'Средний углеродный след': 'Средний углеродный след',
      'Низкий углеродный след': 'Низкий углеродный след',
      'Очень низкий углеродный след': 'Очень низкий углеродный след'
    },
    EN: {
      'Новые персонализированные рекомендации работают!': 'New personalized recommendations are working!',
      'Критически высокий углеродный след': 'Critically high carbon footprint',
      'Высокий углеродный след': 'High carbon footprint',
      'Средний углеродный след': 'Medium carbon footprint',
      'Низкий углеродный след': 'Low carbon footprint',
      'Очень низкий углеродный след': 'Very low carbon footprint'
    },
    BY: {
      'Новые персонализированные рекомендации работают!': 'Новыя персаналізаваныя рэкамендацыі працуюць!',
      'Критически высокий углеродный след': 'Крытычна высокі вугляродны след',
      'Высокий углеродный след': 'Высокі вугляродны след',
      'Средний углеродный след': 'Сярэдні вугляродны след',
      'Низкий углеродный след': 'Нізкі вугляродны след',
      'Очень низкий углеродный след': 'Вельмі нізкі вугляродны след'
    }
  }
  
  const langMessages = serverMessages[language] || serverMessages.RU
  
  // Проверяем статичные переводы сообщений
  if (langMessages[message]) {
    return langMessages[message]
  }
  
  // Переводим уровни экологичности
  for (const [level, translation] of Object.entries(t.ecoLevels)) {
    if (message.includes(translation) || message.includes(translations.RU.ecoLevels[level])) {
      return t.ecoLevels[level]
    }
  }
  
  return message // Если перевод не найден, возвращаем оригинал
}

// Функция для перевода рекомендаций (статичные переводы)
export const translateRecommendation = (recommendation, language) => {
  const t = translations[language]
  
  // Статичные переводы рекомендаций
  const recommendationTranslations = {
    RU: {
      'Питание': 'Питание',
      'Транспорт': 'Транспорт', 
      'Общее': 'Общее',
      'Сократите потребление красного мяса до 2-3 раз в неделю': 'Сократите потребление красного мяса до 2-3 раз в неделю',
      'Попробуйте один день в неделю без мяса (Meatless Monday)': 'Попробуйте один день в неделю без мяса (Meatless Monday)',
      'Используйте общественный транспорт для поездок на работу': 'Используйте общественный транспорт для поездок на работу',
      'Рассмотрите покупку гибридного или электрического автомобиля': 'Рассмотрите покупку гибридного или электрического автомобиля',
      'Планируйте поездки и объединяйте несколько дел в одну': 'Планируйте поездки и объединяйте несколько дел в одну',
      'Рассмотрите компенсацию выбросов через посадку деревьев': 'Рассмотрите компенсацию выбросов через посадку деревьев',
      'Снижение на 500-800 кг CO₂/год': 'Снижение на 500-800 кг CO₂/год',
      'Снижение на 200-300 кг CO₂/год': 'Снижение на 200-300 кг CO₂/год',
      'Снижение на 1500-2500 кг CO₂/год': 'Снижение на 1500-2500 кг CO₂/год',
      'Снижение на 2000-3000 кг CO₂/год': 'Снижение на 2000-3000 кг CO₂/год',
      'Снижение на 300-500 кг CO₂/год': 'Снижение на 300-500 кг CO₂/год',
      'Компенсация 20-50 кг CO₂ на дерево в год': 'Компенсация 20-50 кг CO₂ на дерево в год'
    },
    EN: {
      'Питание': 'Nutrition',
      'Транспорт': 'Transport',
      'Общее': 'General',
      'Сократите потребление красного мяса до 2-3 раз в неделю': 'Reduce red meat consumption to 2-3 times per week',
      'Попробуйте один день в неделю без мяса (Meatless Monday)': 'Try one day a week without meat (Meatless Monday)',
      'Используйте общественный транспорт для поездок на работу': 'Use public transport for commuting to work',
      'Рассмотрите покупку гибридного или электрического автомобиля': 'Consider buying a hybrid or electric car',
      'Планируйте поездки и объединяйте несколько дел в одну': 'Plan trips and combine multiple errands into one',
      'Рассмотрите компенсацию выбросов через посадку деревьев': 'Consider offsetting emissions through tree planting',
      'Снижение на 500-800 кг CO₂/год': 'Reduction of 500-800 kg CO₂/year',
      'Снижение на 200-300 кг CO₂/год': 'Reduction of 200-300 kg CO₂/year',
      'Снижение на 1500-2500 кг CO₂/год': 'Reduction of 1500-2500 kg CO₂/year',
      'Снижение на 2000-3000 кг CO₂/год': 'Reduction of 2000-3000 kg CO₂/year',
      'Снижение на 300-500 кг CO₂/год': 'Reduction of 300-500 kg CO₂/year',
      'Компенсация 20-50 кг CO₂ на дерево в год': 'Offset 20-50 kg CO₂ per tree per year'
    },
    BY: {
      'Питание': 'Харчаванне',
      'Транспорт': 'Транспарт',
      'Общее': 'Агульнае',
      'Сократите потребление красного мяса до 2-3 раз в неделю': 'Скараціце спажыванне чырвонага мяса да 2-3 разоў на тыдзень',
      'Попробуйте один день в неделю без мяса (Meatless Monday)': 'Паспрабуйце адзін дзень у тыдзень без мяса (Meatless Monday)',
      'Используйте общественный транспорт для поездок на работу': 'Выкарыстоўвайце грамадскі транспарт для паездак на працу',
      'Рассмотрите покупку гибридного или электрического автомобиля': 'Разгледзьце пакупку гібрыднага або электрычнага аўтамабіля',
      'Планируйте поездки и объединяйте несколько дел в одну': 'Планавайце паездкі і аб\'ядноўвайце некалькі спраў у адну',
      'Рассмотрите компенсацию выбросов через посадку деревьев': 'Разгледзьце кампенсацыю выкідаў праз пасадку дрэў',
      'Снижение на 500-800 кг CO₂/год': 'Зніжэнне на 500-800 кг CO₂/год',
      'Снижение на 200-300 кг CO₂/год': 'Зніжэнне на 200-300 кг CO₂/год',
      'Снижение на 1500-2500 кг CO₂/год': 'Зніжэнне на 1500-2500 кг CO₂/год',
      'Снижение на 2000-3000 кг CO₂/год': 'Зніжэнне на 2000-3000 кг CO₂/год',
      'Снижение на 300-500 кг CO₂/год': 'Зніжэнне на 300-500 кг CO₂/год',
      'Компенсация 20-50 кг CO₂ на дерево в год': 'Кампенсацыя 20-50 кг CO₂ на дрэва ў год'
    }
  }
  
  const langTranslations = recommendationTranslations[language] || recommendationTranslations.RU
  
  return {
    category: langTranslations[recommendation.category] || recommendation.category,
    suggestion: langTranslations[recommendation.suggestion] || recommendation.suggestion,
    impact: langTranslations[recommendation.impact] || recommendation.impact
  }
}

// Универсальная функция для перевода любого контента (только статичные переводы)
export const translateContent = (content, targetLanguage, contentType = 'text') => {
  if (!content || targetLanguage === 'RU') return content
  
  // Сначала пытаемся найти готовый перевод
  let translatedContent = content
  
  switch (contentType) {
    case 'category':
      translatedContent = translateCategory(content, targetLanguage)
      break
    case 'ecoLevel':
      translatedContent = translateEcoLevel(content, targetLanguage)
      break
  }
  
  // Если готовый перевод найден и отличается от оригинала, возвращаем его
  if (translatedContent !== content) {
    return translatedContent
  }
  
  // Для пользовательского контента (отзывы) возвращаем оригинал
  // так как внешний API не работает
  return content
}

// Простая функция для перевода отзывов (заглушка)
export const translateStoryContent = (content, targetLanguage) => {
  // Возвращаем оригинальный контент, так как API не работает
  // В будущем здесь можно добавить другой сервис перевода
  return content
}