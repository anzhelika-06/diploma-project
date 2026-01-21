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
      kgCO2PerTreeYear: "кг CO₂ на дерево в год",
      tons: "т"
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
    loginPlaceholder: "Введите логин или никнейм",
    registerLoginPlaceholder: "Введите логин",
    passwordPlaceholder: "Введите пароль",
    loginRequired: "Пожалуйста, заполните поле логина или никнейма",
    registerLoginRequired: "Пожалуйста, заполните поле логина",
    passwordRequired: "Пожалуйста, заполните поле пароля",
    // Тексты для ссылок между авторизацией и регистрацией
    noAccountText: "Нет аккаунта?",
    hasAccountText: "Уже есть аккаунт?",
    loginLink: "Войти",
    nextButton: "Далее",
    registerButton: "Зарегистрироваться",
    backButton: "Назад",
    // Ошибки авторизации
    invalidCredentials: "Неверный логин/никнейм или пароль",
    userNotFound: "Пользователь не найден",
    serverError: "Ошибка сервера. Попробуйте позже",
    networkError: "Ошибка сети. Проверьте подключение",
    // Переводы для регистрации
    passwordPlaceholder: "Введите пароль",
    confirmPasswordPlaceholder: "Подтвердите пароль",
    nicknamePlaceholder: "Введите никнейм",
    userExists: "Пользователь с таким email уже существует",
    invalidEmail: "Неверный формат email",
    passwordTooShort: "Пароль слишком короткий",
    passwordTooWeak: "Пароль слишком слабый",
    ageRestriction: "Возрастное ограничение",
    errorModalOk: "Понятно",
    registrationSuccess: "Регистрация успешна!",
    registrationSuccessMessage: "Ваш аккаунт создан. Теперь вы можете войти в систему.",
    goToLogin: "Перейти к входу",
    stepOf: "Шаг {current} из {total}",
    // Переводы для полей регистрации
    genderPlaceholder: "Выберите пол",
    genderMale: "Мужской",
    genderFemale: "Женский",
    // Сообщения валидации
    nicknameRequired: "Пожалуйста, введите никнейм",
    confirmPasswordRequired: "Пожалуйста, подтвердите пароль",
    passwordMismatch: "Пароли не совпадают",
    birthdateRequired: "Пожалуйста, выберите дату рождения",
    genderRequired: "Пожалуйста, выберите пол",
    // Тексты для условий использования
    termsText: "Нажимая «Зарегистрироваться», вы соглашаетесь с",
    termsOfService: "Условиями использования",
    privacyPolicy: "Политикой конфиденциальности",
    registrationErrorTitle: "Ошибка регистрации",
    // Кнопка звука и статичная фраза листика
    enableLeafSound: "Включить звук листика",
    leafStaticPhrase: "Привет! Каждый твой выбор теперь — это вклад. Следим за следом вместе?",
    // Сообщения калькулятора
    calculatorError: "Ошибка",
    calculatorErrorMessage: "Пожалуйста, выберите все параметры",
    calculatorErrorButton: "Понятно",
    calculatorTranslating: "Переводим рекомендации...",
    storiesTranslating: "Загрузка историй...",
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
    aboutFeatureEducation: "Экологические вызовы",
    aboutFeatureEducationDesc: "Участвуйте в челленджах и достигайте новых экологических целей",
    aboutFeatureProgress: "Отслеживание прогресса",
    aboutFeatureProgressDesc: "Визуализируйте свои достижения и следите за динамикой изменений",
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
    ecoLevelEcoMaster: "Эко-мастер",
    // Страницы условий и конфиденциальности
    backToRegistration: "Назад к регистрации",
    termsPageTitle: "Условия использования",
    privacyPageTitle: "Политика конфиденциальности",
    // Настройки
    settingsTitle: "Настройки",
    settingsAppearance: "Внешний вид",
    settingsNotifications: "Уведомления", 
    settingsPrivacy: "Конфиденциальность",
    settingsAccount: "Аккаунт",
    settingsSupport: "Поддержка",
    languageRussian: "Русский",
    languageBelarusian: "Беларуская",
    languageEnglish: "English",
    themeLight: "Светлая тема",
    themeDark: "Темная тема",
    appearanceTitle: "Внешний вид и интерфейс",
    themeSelectionTitle: "Тема оформления",
    themeSelectionDescription: "Выберите светлую или темную тему интерфейса",
    lightThemeDescription: "Классический светлый интерфейс",
    darkThemeDescription: "Темный режим для комфорта глаз",
    languageSelectionTitle: "Язык интерфейса",
    languageSelectionDescription: "Выберите предпочитаемый язык приложения",
    // Меню сайдбара
    menuPet: "Питомец",
    menuTeams: "Команды", 
    menuMessages: "Сообщения",
    menuFriends: "Друзья",
    menuNotifications: "Уведомления",
    menuAchievements: "Достижения",
    menuStatistics: "Статистика",
    menuLeaderboard: "Рейтинг",
    menuContribution: "Вклад",
    menuReviews: "Истории",
    menuProfile: "Профиль",
    menuSettings: "Настройки",
    menuEcoVacation: "Эко-отпуск",
    // Настройки - уведомления
    notificationsTitle: "Уведомления и рассылки",
    generalNotifications: "Общие уведомления",
    generalNotificationsDesc: "Получать уведомления о новых функциях, обновлениях и важных событиях",
    dailyEcoTips: "Ежедневные эко-советы",
    dailyEcoTipsDesc: "Получать полезные советы по экологии каждый день. Более 365 уникальных советов!",
    emailNotifications: "Email уведомления",
    emailNotificationsDesc: "Получать важные уведомления на электронную почту",
    pushNotifications: "Push уведомления",
    pushNotificationsDesc: "Получать мгновенные уведомления в браузере",
    // Настройки - конфиденциальность
    privacyTitle: "Конфиденциальность и безопасность",
    resetPassword: "Сброс пароля",
    resetPasswordDesc: "Изменить пароль для входа в систему. Ссылка будет отправлена на ваш email.",
    privacyPolicyTitle: "Политика конфиденциальности",
    privacyPolicyDesc: "Ознакомьтесь с тем, как мы собираем, используем и защищаем ваши данные",
    termsOfUseTitle: "Условия использования",
    termsOfUseDesc: "Правила и условия использования приложения EcoSteps",
    dataSecurity: "Безопасность данных",
    dataSecurityDesc: "Ваши данные защищены современными методами шифрования и не передаются третьим лицам",
    sslEncryption: "SSL шифрование",
    gdprCompliance: "GDPR совместимость",
    // Настройки - аккаунт
    accountManagement: "Управление аккаунтом",
    clearCache: "Очистка кэша",
    clearCacheDesc: "Очистить временные файлы, данные приложения и кэш браузера для улучшения производительности",
    exportData: "Экспорт данных",
    exportDataDesc: "Скачать все ваши данные в формате JSON",
    logout: "Выход из системы",
    logoutDesc: "Завершить текущую сессию и выйти из аккаунта",
    deleteAccount: "Удаление аккаунта",
    deleteAccountDesc: "Безвозвратно удалить аккаунт и все связанные данные. Это действие нельзя отменить!",
    // Настройки - поддержка
    supportTitle: "Поддержка и помощь",
    faqTitle: "FAQ / Часто задаваемые вопросы",
    faqDesc: "Ответы на популярные вопросы пользователей о работе с приложением",
    contactSupport: "Связаться с поддержкой",
    contactSupportDesc: "Отправить сообщение команде поддержки или сообщить о проблеме",
    aboutApp: "О приложении",
    aboutAppDesc: "Информация о версии, разработчиках и миссии EcoSteps",
    shareStory: "Поделиться историей",
    shareStoryDesc: "Расскажите свою эко-историю и поделитесь ей в разделе \"Истории\"",
    // Модальные окна
    logoutModalTitle: "Выход из системы",
    logoutConfirm: "Вы уверены, что хотите выйти из системы?",
    logoutWarning: "Все несохраненные данные будут потеряны.",
    deleteAccountModalTitle: "Удаление аккаунта",
    deleteWarning: "Внимание! Это действие нельзя отменить.",
    deleteWillRemove: "Будут безвозвратно удалены:",
    deleteProfile: "Ваш профиль и все личные данные",
    deleteHistory: "История активности и статистика",
    deleteTeams: "Участие в командах",
    deleteStories: "Все ваши истории успеха",
    deleteAchievements: "Достижения и прогресс",
    deleteConfirm: "Вы действительно хотите удалить аккаунт навсегда?",
    resetPasswordModalTitle: "Сброс пароля",
    resetPasswordInfo: "Мы отправим ссылку для сброса пароля на ваш email:",
    resetPasswordSpam: "Проверьте папку \"Спам\", если письмо не придет в течение нескольких минут.",
    // Кнопки
    cancel: "Отмена",
    confirm: "Подтвердить",
    close: "Закрыть",
    save: "Сохранить",
    delete: "Удалить",
    reset: "Сбросить",
    export: "Экспортировать",
    send: "Отправить",
    // Формы
    storyCategory: "Категория:",
    storyTitle: "Заголовок истории:",
    storyTitlePlaceholder: "Придумайте интересный заголовок для вашей истории",
    co2Saved: "Сэкономлено CO₂ (кг):",
    co2SavedPlaceholder: "Сколько CO₂ вы сэкономили? (например: 15.5)",
    storyContent: "Ваша история:",
    storyContentPlaceholder: "Расскажите свою эко-историю подробно. Что вы делаете для экологии? Какие результаты получили?",
    addToStories: "Добавить в истории",
    addStoryTitle: "Добавить историю",
    // Категории историй
    categoryEnergy: "Энергия",
    categoryWater: "Вода", 
    categoryWaste: "Отходы",
    categoryTransport: "Транспорт",
    categoryFood: "Питание",
    categoryNature: "Природа",
    categoryHousehold: "Быт",
    categoryConsumption: "Потребление",
    categoryPlanning: "Планирование",
    // Кнопки действий
    readPolicy: "Читать политику",
    readTerms: "Читать условия", 
    writeToSupport: "Написать в поддержку",
    openFAQ: "Открыть FAQ",
    tellStory: "Рассказать историю",
    sendLink: "Отправить ссылку",
    clearCacheBtn: "Очистить кэш",
    exportDataBtn: "Экспортировать данные",
    logoutBtn: "Выйти из системы",
    deleteAccountBtn: "Удалить аккаунт",
    deleteForever: "Удалить навсегда"
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
      kgCO2PerTreeYear: "kg CO₂ per tree per year",
      tons: "t"
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
    loginPlaceholder: "Enter login or nickname",
    registerLoginPlaceholder: "Enter login",
    passwordPlaceholder: "Enter password",
    loginRequired: "Please fill in the login or nickname field",
    registerLoginRequired: "Please fill in the login field",
    passwordRequired: "Please fill in the password field",
    // Тексты для ссылок между авторизацией и регистрацией
    noAccountText: "Don't have an account?",
    hasAccountText: "Already have an account?",
    loginLink: "Login",
    nextButton: "Next",
    registerButton: "Register",
    backButton: "Back",
    // Ошибки авторизации
    invalidCredentials: "Invalid login/nickname or password",
    userNotFound: "User not found",
    serverError: "Server error. Please try again later",
    networkError: "Network error. Check your connection",
    // Переводы для регистрации
    passwordPlaceholder: "Enter password",
    confirmPasswordPlaceholder: "Confirm password",
    nicknamePlaceholder: "Enter nickname",
    userExists: "User with this email already exists",
    invalidEmail: "Invalid email format",
    passwordTooShort: "Password is too short",
    passwordTooWeak: "Password is too weak",
    ageRestriction: "Age restriction",
    errorModalOk: "OK",
    registrationSuccess: "Registration successful!",
    registrationSuccessMessage: "Your account has been created. You can now log in.",
    goToLogin: "Go to login",
    stepOf: "Step {current} of {total}",
    // Переводы для полей регистрации
    genderPlaceholder: "Select gender",
    genderMale: "Male",
    genderFemale: "Female",
    // Сообщения валидации
    nicknameRequired: "Please enter a nickname",
    confirmPasswordRequired: "Please confirm your password",
    passwordMismatch: "Passwords do not match",
    birthdateRequired: "Please select your birth date",
    genderRequired: "Please select your gender",
    // Тексты для условий использования
    termsText: "By clicking «Register», you agree to the",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    registrationErrorTitle: "Registration Error",
    // Кнопка звука и статичная фраза листика
    enableLeafSound: "Enable leaf sound",
    leafStaticPhrase: "Hello! Every choice you make now is a contribution. Let's track our footprint together?",
    // Сообщения калькулятора
    calculatorError: "Error",
    calculatorErrorMessage: "Please select all parameters",
    calculatorErrorButton: "Understood",
    calculatorTranslating: "Translating recommendations...",
    storiesTranslating: "Loading stories...",
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
    aboutFeatureEducation: "Eco challenges",
    aboutFeatureEducationDesc: "Participate in challenges and achieve new environmental goals",
    aboutFeatureProgress: "Progress tracking",
    aboutFeatureProgressDesc: "Visualize your achievements and monitor changes over time",
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
    ecoLevelEcoMaster: "Eco Master",
    // Страницы условий и конфиденциальности
    backToRegistration: "Back to Registration",
    termsPageTitle: "Terms of Service",
    privacyPageTitle: "Privacy Policy",
    // Настройки
    settingsTitle: "Настройки",
    settingsAppearance: "Внешний вид",
    settingsNotifications: "Уведомления", 
    settingsPrivacy: "Конфиденциальность",
    settingsAccount: "Аккаунт", 
    settingsSupport: "Поддержка",
    languageRussian: "Russian",
    languageBelarusian: "Belarusian",
    languageEnglish: "English",
    themeLight: "Светлая тема",
    themeDark: "Темная тема",
    appearanceTitle: "Внешний вид и интерфейс",
    themeSelectionTitle: "Тема оформления",
    themeSelectionDescription: "Выберите светлую или темную тему интерфейса",
    lightThemeDescription: "Классический светлый интерфейс",
    darkThemeDescription: "Темный режим для комфорта глаз",
    languageSelectionTitle: "Язык интерфейса",
    languageSelectionDescription: "Выберите предпочитаемый язык приложения",
    // Меню сайдбара
    menuPet: "Pet",
    menuTeams: "Teams",
    menuMessages: "Messages", 
    menuFriends: "Friends",
    menuNotifications: "Notifications",
    menuAchievements: "Achievements",
    menuStatistics: "Statistics",
    menuLeaderboard: "Leaderboard",
    menuContribution: "Contribution",
    menuReviews: "Stories",
    menuProfile: "Profile",
    menuSettings: "Settings",
    menuEcoVacation: "Eco Vacation",
    // Настройки - уведомления
    notificationsTitle: "Уведомления и рассылки",
    generalNotifications: "Общие уведомления",
    generalNotificationsDesc: "Получать уведомления о новых функциях, обновлениях и важных событиях",
    dailyEcoTips: "Ежедневные эко-советы",
    dailyEcoTipsDesc: "Получать полезные советы по экологии каждый день. Более 365 уникальных советов!",
    emailNotifications: "Email уведомления",
    emailNotificationsDesc: "Получать важные уведомления на электронную почту",
    pushNotifications: "Push уведомления",
    pushNotificationsDesc: "Получать мгновенные уведомления в браузере",
    // Настройки - конфиденциальность
    privacyTitle: "Конфиденциальность и безопасность",
    resetPassword: "Сброс пароля",
    resetPasswordDesc: "Изменить пароль для входа в систему. Ссылка будет отправлена на ваш email.",
    privacyPolicyTitle: "Политика конфиденциальности",
    privacyPolicyDesc: "Ознакомьтесь с тем, как мы собираем, используем и защищаем ваши данные",
    termsOfUseTitle: "Условия использования",
    termsOfUseDesc: "Правила и условия использования приложения EcoSteps",
    dataSecurity: "Безопасность данных",
    dataSecurityDesc: "Ваши данные защищены современными методами шифрования и не передаются третьим лицам",
    sslEncryption: "SSL шифрование",
    gdprCompliance: "GDPR совместимость",
    // Настройки - аккаунт
    accountManagement: "Управление аккаунтом",
    clearCache: "Очистка кэша",
    clearCacheDesc: "Очистить временные файлы, данные приложения и кэш браузера для улучшения производительности",
    exportData: "Экспорт данных",
    exportDataDesc: "Скачать все ваши данные в формате JSON",
    logout: "Выход из системы",
    logoutDesc: "Завершить текущую сессию и выйти из аккаунта",
    deleteAccount: "Удаление аккаунта",
    deleteAccountDesc: "Безвозвратно удалить аккаунт и все связанные данные. Это действие нельзя отменить!",
    // Настройки - поддержка
    supportTitle: "Поддержка и помощь",
    faqTitle: "FAQ / Часто задаваемые вопросы",
    faqDesc: "Ответы на популярные вопросы пользователей о работе с приложением",
    contactSupport: "Связаться с поддержкой",
    contactSupportDesc: "Отправить сообщение команде поддержки или сообщить о проблеме",
    aboutApp: "О приложении",
    aboutAppDesc: "Информация о версии, разработчиках и миссии EcoSteps",
    shareStory: "Поделиться историей",
    shareStoryDesc: "Расскажите свою эко-историю и поделитесь ей в разделе \"Истории\"",
    // Модальные окна
    logoutModalTitle: "Выход из системы",
    logoutConfirm: "Вы уверены, что хотите выйти из системы?",
    logoutWarning: "Все несохраненные данные будут потеряны.",
    deleteAccountModalTitle: "Удаление аккаунта",
    deleteWarning: "Внимание! Это действие нельзя отменить.",
    deleteWillRemove: "Будут безвозвратно удалены:",
    deleteProfile: "Ваш профиль и все личные данные",
    deleteHistory: "История активности и статистика",
    deleteTeams: "Участие в командах",
    deleteStories: "Все ваши истории успеха",
    deleteAchievements: "Достижения и прогресс",
    deleteConfirm: "Вы действительно хотите удалить аккаунт навсегда?",
    resetPasswordModalTitle: "Сброс пароля",
    resetPasswordInfo: "Мы отправим ссылку для сброса пароля на ваш email:",
    resetPasswordSpam: "Проверьте папку \"Спам\", если письмо не придет в течение нескольких минут.",
    // Кнопки
    cancel: "Cancel",
    confirm: "Confirm",
    close: "Close",
    save: "Save",
    delete: "Delete",
    reset: "Reset",
    export: "Export",
    send: "Send",
    // Формы
    storyCategory: "Category:",
    storyTitle: "Story Title:",
    storyTitlePlaceholder: "Come up with an interesting title for your story",
    co2Saved: "CO₂ Saved (kg):",
    co2SavedPlaceholder: "How much CO₂ did you save? (e.g.: 15.5)",
    storyContent: "Your Story:",
    storyContentPlaceholder: "Tell your eco-story in detail. What do you do for ecology? What results did you get?",
    addToStories: "Add to Stories",
    addStoryTitle: "Add Story",
    // Категории историй
    categoryEnergy: "Energy",
    categoryWater: "Water",
    categoryWaste: "Waste",
    categoryTransport: "Transport",
    categoryFood: "Food",
    categoryNature: "Nature",
    categoryHousehold: "Household",
    categoryConsumption: "Consumption",
    categoryPlanning: "Planning",
    // Кнопки действий
    readPolicy: "Читать политику",
    readTerms: "Читать условия",
    writeToSupport: "Написать в поддержку",
    openFAQ: "Открыть FAQ",
    tellStory: "Рассказать историю",
    sendLink: "Отправить ссылку",
    clearCacheBtn: "Очистить кэш",
    exportDataBtn: "Экспортировать данные",
    logoutBtn: "Выйти из системы",
    deleteAccountBtn: "Удалить аккаунт",
    deleteForever: "Удалить навсегда"
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
      kgCO2PerTreeYear: "кг CO₂ на дрэва ў год",
      tons: "т"
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
    loginPlaceholder: "Увядзіце логін або нік",
    registerLoginPlaceholder: "Увядзіце логін",
    passwordPlaceholder: "Увядзіце пароль",
    loginRequired: "Калі ласка, запоўніце поле логіна або ніка",
    registerLoginRequired: "Калі ласка, запоўніце поле логіна",
    passwordRequired: "Калі ласка, запоўніце поле пароля",
    // Тексты для ссылок между авторизацией и регистрацией
    noAccountText: "Няма акаўнта?",
    hasAccountText: "Ужо ёсць акаўнт?",
    loginLink: "Увайсці",
    nextButton: "Далей",
    registerButton: "Зарэгістравацца",
    backButton: "Назад",
    // Ошибки авторизации
    invalidCredentials: "Няправільны логін/нік або пароль",
    userNotFound: "Карыстальнік не знойдзены",
    serverError: "Памылка сервера. Паспрабуйце пазней",
    networkError: "Памылка сеткі. Праверце злучэнне",
    // Переводы для регистрации
    passwordPlaceholder: "Увядзіце пароль",
    confirmPasswordPlaceholder: "Пацвердзіце пароль",
    nicknamePlaceholder: "Увядзіце нік",
    userExists: "Карыстальнік з такім email ужо існуе",
    invalidEmail: "Няправільны фармат email",
    passwordTooShort: "Пароль занадта кароткі",
    passwordTooWeak: "Пароль занадта слабы",
    ageRestriction: "Узроставае абмежаванне",
    errorModalOk: "Зразумела",
    registrationSuccess: "Рэгістрацыя паспяховая!",
    registrationSuccessMessage: "Ваш акаўнт створаны. Цяпер вы можаце ўвайсці ў сістэму.",
    goToLogin: "Перайсці да ўваходу",
    stepOf: "Крок {current} з {total}",
    // Переводы для полей регистрации
    genderPlaceholder: "Выберыце пол",
    genderMale: "Мужчынскі",
    genderFemale: "Жаночы",
    // Сообщения валидации
    nicknameRequired: "Калі ласка, увядзіце нік",
    confirmPasswordRequired: "Калі ласка, пацвердзіце пароль",
    passwordMismatch: "Паролі не супадаюць",
    birthdateRequired: "Калі ласка, выберыце дату нараджэння",
    genderRequired: "Калі ласка, выберыце пол",
    // Кнопка звука и статичная фраза листика
    enableLeafSound: "Уключыць гук лісціка",
    leafStaticPhrase: "Прывітанне! Кожны твой выбар цяпер — гэта ўклад. Сочым за следам разам?",
    // Сообщения калькулятора
    calculatorError: "Памылка",
    calculatorErrorMessage: "Калі ласка, выберыце ўсе параметры",
    calculatorErrorButton: "Зразумела",
    calculatorTranslating: "Перакладаем рэкамендацыі...",
    storiesTranslating: "Загрузка гісторый...",
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
    aboutFeatureEducation: "Экалагічныя выклікі",
    aboutFeatureEducationDesc: "Удзельнічайце ў выкліках і дасягайце новых экалагічных мэт",
    aboutFeatureProgress: "Адсочванне прагрэсу",
    aboutFeatureProgressDesc: "Візуалізуйце свае дасягненні і сачыце за дынамікай змен",
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
    ecoLevelEcoMaster: "Эка-майстар",
    // Тексты для условий использования
    termsText: "Рэгіструючыся, вы згаджаецеся з",
    termsOfService: "Умовамі выкарыстання",
    privacyPolicy: "Палітыкай канфідэнцыяльнасці",
    registrationErrorTitle: "Памылка рэгістрацыі",
    // Страницы условий и конфиденциальности
    backToRegistration: "Назад да рэгістрацыі",
    termsPageTitle: "Умовы выкарыстання",
    privacyPageTitle: "Палітыка канфідэнцыяльнасці",
    // Настройки
    settingsTitle: "Налады",
    settingsAppearance: "Знешні выгляд",
    settingsNotifications: "Паведамленні",
    settingsPrivacy: "Канфідэнцыяльнасць",
    settingsAccount: "Акаўнт",
    settingsSupport: "Падтрымка",
    languageRussian: "Руская",
    languageBelarusian: "Беларуская",
    languageEnglish: "Англійская",
    themeLight: "Светлая тэма",
    themeDark: "Цёмная тэма",
    appearanceTitle: "Знешні выгляд і інтэрфейс",
    themeSelectionTitle: "Выбар тэмы",
    themeSelectionDescription: "Выберыце светлую або цёмную тэму інтэрфейсу",
    lightThemeDescription: "Класічны светлы інтэрфейс",
    darkThemeDescription: "Цёмны рэжым для камфорту вачэй",
    languageSelectionTitle: "Мова інтэрфейсу",
    languageSelectionDescription: "Выберыце пераважную мову прыкладання",
    // Меню сайдбара
    menuPet: "Хатні жывёлы",
    menuTeams: "Каманды",
    menuMessages: "Паведамленні",
    menuFriends: "Сябры",
    menuNotifications: "Паведамленні",
    menuAchievements: "Дасягненні",
    menuStatistics: "Статыстыка",
    menuLeaderboard: "Рэйтынг",
    menuContribution: "Уклад",
    menuReviews: "Гісторыі",
    menuProfile: "Профіль",
    menuSettings: "Налады",
    menuEcoVacation: "Эка-адпачынак",
    // Настройки - уведомления
    notificationsTitle: "Паведамленні і рассылкі",
    generalNotifications: "Агульныя паведамленні",
    generalNotificationsDesc: "Атрымліваць паведамленні пра новыя функцыі, абнаўленні і важныя падзеі",
    dailyEcoTips: "Штодзённыя эка-парады",
    dailyEcoTipsDesc: "Атрымліваць карысныя парады па экалогіі кожны дзень. Больш за 365 унікальных парад!",
    emailNotifications: "Email паведамленні",
    emailNotificationsDesc: "Атрымліваць важныя паведамленні на электронную пошту",
    pushNotifications: "Push паведамленні",
    pushNotificationsDesc: "Атрымліваць імгненныя паведамленні ў браўзеры",
    // Настройки - конфиденциальность
    privacyTitle: "Канфідэнцыяльнасць і бяспека",
    resetPassword: "Скід пароля",
    resetPasswordDesc: "Змяніць пароль для ўваходу ў сістэму. Спасылка будзе адпраўлена на ваш email.",
    privacyPolicyTitle: "Палітыка канфідэнцыяльнасці",
    privacyPolicyDesc: "Азнаёмцеся з тым, як мы збіраем, выкарыстоўваем і абараняем вашы дадзеныя",
    termsOfUseTitle: "Умовы выкарыстання",
    termsOfUseDesc: "Правілы і ўмовы выкарыстання прыкладання EcoSteps",
    dataSecurity: "Бяспека дадзеных",
    dataSecurityDesc: "Вашы дадзеныя абаронены сучаснымі метадамі шыфравання і не перадаюцца трэцім асобам",
    sslEncryption: "SSL шыфраванне",
    gdprCompliance: "GDPR сумяшчальнасць",
    // Настройки - аккаунт
    accountManagement: "Кіраванне акаўнтам",
    clearCache: "Ачыстка кэшу",
    clearCacheDesc: "Ачысціць часовыя файлы, дадзеныя прыкладання і кэш браўзера для паляпшэння прадукцыйнасці",
    exportData: "Экспарт дадзеных",
    exportDataDesc: "Спампаваць усе вашы дадзеныя ў фармаце JSON",
    logout: "Выхад з сістэмы",
    logoutDesc: "Завяршыць бягучую сесію і выйсці з акаўнта",
    deleteAccount: "Выдаленне акаўнта",
    deleteAccountDesc: "Бесвяротна выдаліць акаўнт і ўсе звязаныя дадзеныя. Гэтае дзеянне нельга адмяніць!",
    // Настройки - поддержка
    supportTitle: "Падтрымка і дапамога",
    faqTitle: "FAQ / Часта задаваемыя пытанні",
    faqDesc: "Адказы на папулярныя пытанні карыстальнікаў пра працу з прыкладаннем",
    contactSupport: "Звязацца з падтрымкай",
    contactSupportDesc: "Адправіць паведамленне камандзе падтрымкі або паведаміць пра праблему",
    aboutApp: "Пра прыкладанне",
    aboutAppDesc: "Інфармацыя пра версію, распрацоўшчыкаў і місію EcoSteps",
    shareStory: "Падзяліцца гісторыяй",
    shareStoryDesc: "Раскажыце сваю эка-гісторыю і падзяліцеся ёй у раздзеле \"Гісторыі\"",
    // Модальные окна
    logoutModalTitle: "Выхад з сістэмы",
    logoutConfirm: "Вы ўпэўнены, што хочаце выйсці з сістэмы?",
    logoutWarning: "Усе незахаваныя дадзеныя будуць страчаны.",
    deleteAccountModalTitle: "Выдаленне акаўнта",
    deleteWarning: "Увага! Гэтае дзеянне нельга адмяніць.",
    deleteWillRemove: "Будуць бесвяротна выдалены:",
    deleteProfile: "Ваш профіль і ўсе асабістыя дадзеныя",
    deleteHistory: "Гісторыя актыўнасці і статыстыка",
    deleteTeams: "Удзел у камандах",
    deleteStories: "Усе вашы гісторыі поспеху",
    deleteAchievements: "Дасягненні і прагрэс",
    deleteConfirm: "Вы сапраўды хочаце выдаліць акаўнт назаўсёды?",
    resetPasswordModalTitle: "Скід пароля",
    resetPasswordInfo: "Мы адправім спасылку для скіду пароля на ваш email:",
    resetPasswordSpam: "Праверце папку \"Спам\", калі ліст не прыйдзе на працягу некалькіх хвілін.",
    // Кнопки
    cancel: "Адмена",
    confirm: "Пацвердзіць",
    close: "Зачыніць",
    save: "Захаваць",
    delete: "Выдаліць",
    reset: "Скінуць",
    export: "Экспартаваць",
    send: "Адправіць",
    // Формы
    storyCategory: "Катэгорыя:",
    storyTitle: "Загаловак гісторыі:",
    storyTitlePlaceholder: "Прыдумайце цікавы загаловак для вашай гісторыі",
    co2Saved: "Зэканомлена CO₂ (кг):",
    co2SavedPlaceholder: "Колькі CO₂ вы зэканомілі? (напрыклад: 15.5)",
    storyContent: "Ваша гісторыя:",
    storyContentPlaceholder: "Раскажыце сваю эка-гісторыю падрабязна. Што вы робіце для экалогіі? Якія вынікі атрымалі?",
    addToStories: "Дадаць у гісторыі",
    addStoryTitle: "Дадаць гісторыю",
    // Категории историй
    categoryEnergy: "Энергія",
    categoryWater: "Вада",
    categoryWaste: "Адходы",
    categoryTransport: "Транспарт",
    categoryFood: "Харчаванне",
    categoryNature: "Прырода",
    categoryHousehold: "Быт",
    categoryConsumption: "Спажыванне",
    categoryPlanning: "Планаванне",
    // Кнопки действий
    readPolicy: "Чытаць палітыку",
    readTerms: "Чытаць умовы",
    writeToSupport: "Напісаць у падтрымку",
    openFAQ: "Адкрыць FAQ", 
    tellStory: "Расказаць гісторыю",
    sendLink: "Адправіць спасылку",
    clearCacheBtn: "Ачысціць кэш",
    exportDataBtn: "Экспартаваць дадзеныя",
    logoutBtn: "Выйсці з сістэмы",
    deleteAccountBtn: "Выдаліць акаўнт",
    deleteForever: "Выдаліць назаўсёды"
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

// Функция для сохранения языка в базу данных
export const saveLanguageToDatabase = async (language) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('Пользователь не авторизован, язык не сохранен в БД')
      return false
    }

    const response = await fetch('/api/user-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        language: language
      })
    })

    if (response.ok) {
      console.log('Язык сохранен в базу данных:', language)
      return true
    } else {
      console.warn('Не удалось сохранить язык в БД:', response.statusText)
      return false
    }
  } catch (error) {
    console.warn('Ошибка при сохранении языка в БД:', error)
    return false
  }
}

// Функция для загрузки языка из базы данных
export const loadLanguageFromDatabase = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      return null
    }

    const response = await fetch('/api/user-settings', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.settings && data.settings.language) {
        console.log('Язык загружен из базы данных:', data.settings.language)
        return data.settings.language
      }
    }
    return null
  } catch (error) {
    console.warn('Ошибка при загрузке языка из БД:', error)
    return null
  }
}

// Функция для сохранения языка и в localStorage и в БД
export const saveLanguageEverywhere = async (language) => {
  // Сохраняем в localStorage
  saveLanguage(language)
  
  // Сохраняем в БД (асинхронно, не блокируем UI)
  try {
    await saveLanguageToDatabase(language)
  } catch (error) {
    console.warn('Не удалось сохранить язык в БД:', error)
  }
}

// Функция для перевода категорий с автоопределением языка
export const translateCategory = (category, targetLanguage) => {
  if (!category) return category
  
  // Определяем исходный язык категории
  const sourceLanguage = detectTextLanguage(category)
  const normalizedTarget = targetLanguage.toLowerCase()
  
  // Если языки совпадают, возвращаем оригинал
  if (sourceLanguage === normalizedTarget) {
    return category
  }
  
  // Статические переводы категорий (все возможные варианты)
  const categoryMap = {
    // Русские варианты
    'Транспорт': {
      en: 'Transport',
      by: 'Транспарт'
    },
    'Питание': {
      en: 'Food',
      by: 'Харчаванне'
    },
    'Энергия': {
      en: 'Energy', 
      by: 'Энергія'
    },
    'Отходы': {
      en: 'Waste',
      by: 'Адходы'
    },
    'Вода': {
      en: 'Water',
      by: 'Вада'
    },
    'Общее': {
      en: 'General',
      by: 'Агульнае'
    },
    'Потребление': {
      en: 'Consumption',
      by: 'Спажыванне'
    },
    'Быт': {
      en: 'Household',
      by: 'Быт'
    },
    'Природа': {
      en: 'Nature',
      by: 'Прырода'
    },
    // Английские варианты
    'Transport': {
      ru: 'Транспорт',
      by: 'Транспарт'
    },
    'Food': {
      ru: 'Питание',
      by: 'Харчаванне'
    },
    'Energy': {
      ru: 'Энергия',
      by: 'Энергія'
    },
    'Waste': {
      ru: 'Отходы',
      by: 'Адходы'
    },
    'Water': {
      ru: 'Вода',
      by: 'Вада'
    },
    'General': {
      ru: 'Общее',
      by: 'Агульнае'
    },
    'Consumption': {
      ru: 'Потребление',
      by: 'Спажыванне'
    },
    'Household': {
      ru: 'Быт',
      by: 'Быт'
    },
    'Nature': {
      ru: 'Природа',
      by: 'Прырода'
    },
    // Белорусские варианты
    'Транспарт': {
      ru: 'Транспорт',
      en: 'Transport'
    },
    'Харчаванне': {
      ru: 'Питание',
      en: 'Food'
    },
    'Энергія': {
      ru: 'Энергия',
      en: 'Energy'
    },
    'Адходы': {
      ru: 'Отходы',
      en: 'Waste'
    },
    'Вада': {
      ru: 'Вода',
      en: 'Water'
    },
    'Агульнае': {
      ru: 'Общее',
      en: 'General'
    },
    'Спажыванне': {
      ru: 'Потребление',
      en: 'Consumption'
    },
    'Быт': {
      ru: 'Быт',
      en: 'Household'
    },
    'Прырода': {
      ru: 'Природа',
      en: 'Nature'
    }
  }
  
  // Ищем перевод в статической таблице
  if (categoryMap[category] && categoryMap[category][normalizedTarget]) {
    return categoryMap[category][normalizedTarget]
  }
  
  // Если статический перевод не найден, возвращаем оригинал
  return category
}

// Функция для перевода эко-уровней с автоопределением языка
export const translateEcoLevel = (level, targetLanguage) => {
  if (!level) return level

  const sourceLanguage = detectTextLanguage(level)
  const normalizedTarget = targetLanguage.toLowerCase()
  
  // Если языки совпадают, возвращаем оригинал
  if (sourceLanguage === normalizedTarget) {
    return level
  }

  // Статические переводы эко-уровней (все возможные варианты)
  const levelMap = {
    // Русские варианты
    'Эко-герой': {
      en: 'Eco Hero',
      by: 'Эка-герой'
    },
    'Эко-новичок': {
      en: 'Eco Novice',
      by: 'Эка-навічок'
    },
    'Эко-стартер': {
      en: 'Eco Starter',
      by: 'Эка-стартар'
    },
    'Эко-энтузиаст': {
      en: 'Eco Enthusiast',
      by: 'Эка-энтузіяст'
    },
    'Эко-активист': {
      en: 'Eco Activist',
      by: 'Эка-актывіст'
    },
    'Эко-мастер': {
      en: 'Eco Master',
      by: 'Эка-майстар'
    },
    'Новичок': {
      en: 'Beginner',
      by: 'Пачаткоўец'
    },
    'Продвинутый': {
      en: 'Advanced',
      by: 'Прасунуты'
    },
    'Эксперт': {
      en: 'Expert',
      by: 'Эксперт'
    },
    'Мастер': {
      en: 'Master',
      by: 'Майстар'
    },
    'Чемпион': {
      en: 'Champion',
      by: 'Чэмпіён'
    },
    // Английские варианты
    'Eco Hero': {
      ru: 'Эко-герой',
      by: 'Эка-герой'
    },
    'Eco Novice': {
      ru: 'Эко-новичок',
      by: 'Эка-навічок'
    },
    'Eco Starter': {
      ru: 'Эко-стартер',
      by: 'Эка-стартар'
    },
    'Eco Enthusiast': {
      ru: 'Эко-энтузиаст',
      by: 'Эка-энтузіяст'
    },
    'Eco Activist': {
      ru: 'Эко-активист',
      by: 'Эка-актывіст'
    },
    'Eco Master': {
      ru: 'Эко-мастер',
      by: 'Эка-майстар'
    },
    'Beginner': {
      ru: 'Новичок',
      by: 'Пачаткоўец'
    },
    'Advanced': {
      ru: 'Продвинутый',
      by: 'Прасунуты'
    },
    'Expert': {
      ru: 'Эксперт',
      by: 'Эксперт'
    },
    'Master': {
      ru: 'Мастер',
      by: 'Майстар'
    },
    'Champion': {
      ru: 'Чемпион',
      by: 'Чэмпіён'
    },
    // Белорусские варианты
    'Эка-герой': {
      ru: 'Эко-герой',
      en: 'Eco Hero'
    },
    'Эка-навічок': {
      ru: 'Эко-новичок',
      en: 'Eco Novice'
    },
    'Эка-стартар': {
      ru: 'Эко-стартер',
      en: 'Eco Starter'
    },
    'Эка-энтузіяст': {
      ru: 'Эко-энтузиаст',
      en: 'Eco Enthusiast'
    },
    'Эка-актывіст': {
      ru: 'Эко-активист',
      en: 'Eco Activist'
    },
    'Эка-майстар': {
      ru: 'Эко-мастер',
      en: 'Eco Master'
    },
    'Пачаткоўец': {
      ru: 'Новичок',
      en: 'Beginner'
    },
    'Прасунуты': {
      ru: 'Продвинутый',
      en: 'Advanced'
    },
    'Майстар': {
      ru: 'Мастер',
      en: 'Master'
    },
    'Чэмпіён': {
      ru: 'Чемпион',
      en: 'Champion'
    }
  }
  
  // Ищем перевод в статической таблице
  if (levelMap[level] && levelMap[level][normalizedTarget]) {
    return levelMap[level][normalizedTarget]
  }
  
  // Если статический перевод не найден, возвращаем оригинал
  return level
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

// Универсальная функция для перевода любого контента (статичные переводы + Chrome Translator API)
export const translateContent = async (content, targetLanguage, contentType = 'text') => {
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
  
  // Для пользовательского контента используем Chrome Translator API
  if (contentType === 'userContent' || contentType === 'story') {
    try {
      return await translateWithChromeAPI(content, 'ru', targetLanguage.toLowerCase())
    } catch (error) {
      console.warn('Chrome Translator API недоступна:', error)
      return content // Возвращаем оригинал если API недоступна
    }
  }
  
  return content
}

// Функция для перевода с помощью Chrome Translator API
export const translateWithChromeAPI = async (text, sourceLanguage, targetLanguage) => {
  // Проверяем поддержку API
  if (!('Translator' in self)) {
    throw new Error('Chrome Translator API не поддерживается')
  }
  
  // Конвертируем коды языков в формат BCP 47
  const langMap = {
    'ru': 'ru',
    'en': 'en', 
    'by': 'uk' // Используем украинский как ближайший к белорусскому
  }
  
  let sourceLang = langMap[sourceLanguage] || sourceLanguage
  let targetLang = langMap[targetLanguage] || targetLanguage
  
  // Специальная обработка для белорусского языка
  if (sourceLanguage === 'by' || targetLanguage === 'by') {
    // Пробуем разные варианты для белорусского
    const belarusianOptions = ['be', 'bel', 'uk', 'pl', 'ru']
    
    for (const option of belarusianOptions) {
      try {
        const testSourceLang = sourceLanguage === 'by' ? option : sourceLang
        const testTargetLang = targetLanguage === 'by' ? option : targetLang
        
        const availability = await self.Translator.availability({
          sourceLanguage: testSourceLang,
          targetLanguage: testTargetLang
        })
        
        if (availability === 'available' || availability === 'downloadable') {
          if (sourceLanguage === 'by') sourceLang = option
          if (targetLanguage === 'by') targetLang = option
          break
        }
      } catch (error) {
        continue
      }
    }
  }
  
  // Если языки одинаковые, возвращаем оригинал
  if (sourceLang === targetLang) {
    return text
  }
  
  try {
    // Проверяем доступность языковой пары
    const availability = await self.Translator.availability({
      sourceLanguage: sourceLang,
      targetLanguage: targetLang
    })
    
    if (availability !== 'available' && availability !== 'downloadable') {
      throw new Error(`Языковая пара ${sourceLang}->${targetLang} недоступна`)
    }
    
    // Создаем переводчик
    const translator = await self.Translator.create({
      sourceLanguage: sourceLang,
      targetLanguage: targetLang
    })
    
    // Переводим текст
    const translatedText = await translator.translate(text)
    
    // Очищаем ресурсы
    translator.destroy()
    
    return translatedText
    
  } catch (error) {
    throw error
  }
}

// Функция для перевода историй успеха с автоопределением языка
export const translateStoryContent = async (content, targetLanguage, sourceLanguage = 'auto') => {
  if (!content) return content
  
  // Нормализуем коды языков
  const normalizedTarget = targetLanguage.toLowerCase()
  let normalizedSource = sourceLanguage.toLowerCase()
  
  // Если исходный язык не указан, пытаемся определить автоматически
  if (normalizedSource === 'auto') {
    normalizedSource = detectTextLanguage(content)
  }
  
  // Если целевой язык совпадает с исходным, возвращаем оригинал
  if (normalizedTarget === normalizedSource) {
    return content
  }
  
  try {
    const result = await translateWithChromeAPI(content, normalizedSource, normalizedTarget)
    return result
  } catch (error) {
    console.warn(`Ошибка перевода с ${sourceLanguage} на ${targetLanguage}:`, error)
    return content // Возвращаем оригинал при ошибке
  }
}

// Функция для определения языка текста
export const detectTextLanguage = (text) => {
  if (!text) return 'ru'
  
  // Подсчитываем символы разных алфавитов
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length
  const cyrillicChars = (text.match(/[а-яёА-ЯЁ]/g) || []).length
  const belarusianChars = (text.match(/[ўЎіІ]/g) || []).length
  
  // Общее количество букв
  const totalLetters = latinChars + cyrillicChars + belarusianChars
  
  let detectedLang = 'ru'
  
  // Если есть белорусские символы - белорусский
  if (belarusianChars > 0) {
    detectedLang = 'by'
  }
  // Если латинских символов больше 50% от всех букв - английский
  else if (totalLetters > 0 && (latinChars / totalLetters) > 0.5) {
    detectedLang = 'en'
  }
  // Если кириллических символов больше 50% - русский
  else if (totalLetters > 0 && (cyrillicChars / totalLetters) > 0.5) {
    detectedLang = 'ru'
  }
  // Если только латинские символы и нет кириллицы - английский
  else if (latinChars > 0 && cyrillicChars === 0) {
    detectedLang = 'en'
  }
  
  return detectedLang
}

// Функция для форматирования углеродного следа (кг -> тонны при необходимости)
export const formatCarbonFootprint = (carbonKg, language = 'RU') => {
  const t = translations[language] || translations.RU
  
  if (carbonKg >= 1000) {
    const tons = Math.round(carbonKg / 1000 * 10) / 10 // Округляем до 1 знака после запятой
    return `${tons}${t.units?.tons || 'т'} CO₂`
  } else {
    return `${carbonKg} ${t.kgCO2 || 'кг CO₂'}`
  }
}