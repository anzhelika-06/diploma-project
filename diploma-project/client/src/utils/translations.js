// Файл с переводами для всех языков приложения
// Импортируем функцию getSavedTheme из themeManager.js
import { getSavedTheme } from './themeManager'
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
    //достижения
    allAchievements: 'Все достижения',
    completed: 'Завершено',
    progress: 'Прогресс',
    visibleHint: 'видимых',
    fromAll: 'от всех',
    visibleAchievements: 'достижений',
    days: 'дней',
    showingAchievements: 'Показано',
    ofTotal: 'из',
    // Кнопка звука и статичная фраза листика
    enableLeafSound: "Включить звук листика",
    leafStaticPhrase: "Привет! Каждый твой выбор теперь — это вклад. Следим за следом вместе?",
    // Сообщения калькулятора
    calculatorError: "Ошибка",
    calculatorErrorMessage: "Пожалуйста, выберите все параметры",
    calculatorErrorButton: "Понятно",
    calculatorTranslating: "Переводим рекомендации...",
    storiesTranslating: "Загрузка историй...",
    //ПАНЕЛЬ АДМИНА
    adminPanel: 'Панель администратора',
    adminUsers: 'Пользователи',
    adminFunds: 'Фонды',
    adminAchievements: 'Достижения',
    adminStatistics: 'Статистика',
    adminComplaints: 'Жалобы',
    adminReviews: 'Отзывы',
    adminUsersManagement: 'Управление пользователями',
    adminFundsManagement: 'Управление фондами',
    adminAchievementsManagement: 'Управление достижениями',
    adminPlatformStatistics: 'Статистика платформы',
    adminUserComplaints: 'Жалобы пользователей',
    adminUserReviews: 'Отзывы пользователей',
    adminUsersListPlaceholder: 'Список пользователей будет здесь',
    adminFundsListPlaceholder: 'Управление фондами будет здесь',
    adminAchievementsListPlaceholder: 'Управление достижениями будет здесь',
    adminStatisticsPlaceholder: 'Статистика будет здесь',
    adminComplaintsListPlaceholder: 'Список жалоб будет здесь',
    adminReviewsListPlaceholder: 'Список отзывов будет здесь',
    menuAdmin: "Управление",
    adminPanel: 'Панель администратора',
    adminUsers: 'Пользователи',
    adminFunds: 'Фонды',
    adminAchievements: 'Достижения',
    adminStatistics: 'Статистика',
    adminComplaints: 'Жалобы',
    adminReviews: 'Отзывы',
    adminUsersManagement: 'Управление пользователями',
    adminFundsManagement: 'Управление фондами',
    adminAchievementsManagement: 'Управление достижениями',
    adminPlatformStatistics: 'Статистика платформы',
    adminUserComplaints: 'Жалобы пользователей',
    adminUserReviews: 'Отзывы пользователей',
    adminUsersListPlaceholder: 'Список пользователей будет здесь',
    adminFundsListPlaceholder: 'Управление фондами будет здесь',
    adminAchievementsListPlaceholder: 'Управление достижениями будет здесь',
    adminStatisticsPlaceholder: 'Статистика будет здесь',
    adminComplaintsListPlaceholder: 'Список жалоб будет здесь',
    adminReviewsListPlaceholder: 'Список отзывов будет здесь',
    adminPanel: "Панель администратора",
manageUsers: "Управление пользователями",
manageFunds: "Управление фондами",
manageAchievements: "Управление достижениями",
manageReports: "Управление жалобами",
manageReviews: "Управление отзывами",
adminTabUsers: "Пользователи",
adminTabFunds: "Фонды",
adminTabAchievements: "Достижения",
adminTabReports: "Жалобы",
adminTabReviews: "Отзывы",
checkingPermissions: "Проверка прав доступа...",
accessDenied: "Доступ запрещен",
noAdminRights: "У вас нет прав администратора",
goHome: "На главную",
refresh: "Обновить",
totalUsers: "Всего пользователей",
totalAdmins: "Администраторов",
totalBanned: "Забаненных",
searchPlaceholder: "Поиск по email или никнейму...",
allRoles: "Все роли",
adminsA: "Администраторы",
users: "Пользователи",
allStatuses: "Все статусы",
adminTabSupport: "Поддержка",
pending: "Ожидают",
answered: "Отвеченные",
closed: "Закрытые",
allStatuses: "Все статусы",
noUsersInSystem: "В системе пока нет пользователей.",
banned: "Забаненные",
active: "Активные",
showing: "Показано",
of: "из",
filtered: "отфильтровано",
loadingUsers: "Загрузка пользователей...",
error: "Ошибка",
tryAgain: "Попробовать снова",
noUsersFound: "Пользователи не найдены",
changeSearchParams: "Измените параметры поиска",
allUsersFromDB: "Все пользователи из БД",
allAdminsFromDB: "Все администраторы из БД",
allBannedFromDB: "Все забаненные из БД",
clearFilters: "Сбросить фильтры",
showAllUsers: "Показать всех пользователей",
ID: "ID",
Email: "Email",
nickname: "Никнейм",
registrationDate: "Дата регистрации",
ecoLevel: "Эко-уровень",
CO2: "CO₂",
status: "Статус",
actions: "Действия",
noNickname: "Без никнейма",
banned: "Забанен",
admin: "Админ",
active: "Активен",
removeAdminRights: "Убрать права администратора",
makeAdmin: "Назначить администратором",
unbanUser: "Разбанить пользователя",
banUser: "Забанить пользователя",
cannot: "Невозможно",
cannotBanAdmin: "Нельзя заблокировать администратора",
cannotBanSelf: "Нельзя заблокировать самого себя",
user: "Пользователь",
banReason: "Причина блокировки",
banDuration: "Длительность блокировки",
cancel: "Отмена",
ban: "Заблокировать",
confirmUnban: "Разбанить пользователя?",
confirmUnbanMessage: "Вы уверены, что хотите разбанить пользователя {username}?",
userUnbanned: "Пользователь разбанен",
userUnbannedSuccess: "Пользователь {username} был разбанен",
confirmMakeAdmin: "Назначить администратором?",
confirmMakeAdminMessage: "Назначить пользователя {username} администратором?",
makeAdminSuccess: "Пользователь {username} назначен администратором",
confirmRemoveAdmin: "Убрать права администратора?",
confirmRemoveAdminMessage: "Убрать права администратора у пользователя {username}?",
removeAdminSuccess: "Пользователь {username} лишен прав администратора",
success: "Успешно",
operationFailed: "Операция не выполнена",
networkErrorTitle: "Ошибка сети",
networkError: "Ошибка сети",
confirm: "Подтвердить",
ok: "OK",
specifyReason: "Укажите причину",
userBanned: "Пользователь забанен",
userBannedSuccess: "Пользователь {username} был забанен",
banReasonSpam: "Спам или реклама",
banReasonHarassment: "Оскорбления или травля",
banReasonFakeNews: "Распространение фейковых новостей",
banReasonCheating: "Читерство или накрутка",
banReasonInappropriate: "Неуместный контент",
banReasonMultipleAccounts: "Создание множественных аккаунтов",
banReasonOther: "Другая причина",
banDuration1h: "1 час",
banDuration24h: "24 часа",
banDuration3d: "3 дня",
banDuration7d: "7 дней",
banDuration30d: "30 дней",
banDurationPermanent: "Навсегда",
authRequired: "Требуется авторизация",
errorLoadingUsers: "Ошибка загрузки пользователей",
fundsComingSoon: "Здесь будет управление экологическими фондами и их финансированием",
achievementsComingSoon: "Здесь будет управление достижениями пользователей и наградами",
reportsComingSoon: "Здесь будут жалобы пользователей и модерация контента",
reviewsComingSoon: "Здесь будут отзывы пользователей о платформе",
ecoLevel: "Эко-уровень",
ecoNovice: "Эко-новичок",
ecoEnthusiast: "Эко-любитель",
ecoActivist: "Эко-энтузиаст",
ecoMaster: "Эко-мастер",
ecoLegend: "Эко-легенда",
carbonUnit: "кг",
banPermanent: "Блокировка навсегда",
userAlreadyPermanentlyBannedTitle: "Пользователь уже забанен навсегда",
userAlreadyPermanentlyBannedSubtitle: "(нарушений: {{count}})",
userAlreadyPermanentlyBanned: "Пользователь {{username}} уже забанен навсегда",
userAlreadyBanned: "Пользователь {{username}} уже забанен",
cannotBanAlreadyBanned: "Нельзя забанить уже забаненного пользователя",
    // Управление пользователями
    totalUsers: 'Всего пользователей',
    admins: 'Администраторов',
    bannedUsers: 'Забанено',
    searchUsersPlaceholder: 'Поиск по email или никнейму...',
    email: 'Email',
    nickname: 'Никнейм',
    registrationDate: 'Дата регистрации',
    ecoLevel: 'Эко-уровень',
    carbonSaved: 'Сэкономлено CO₂',
    emailVerified: 'Почта',
    status: 'Статус',
    actions: 'Действия',
    verified: 'Да',
    notVerified: 'Нет',
    admin: 'Админ',
    active: 'Активен',
    banned: 'Забанен',
    banUser2: "Заблокировать пользователя",
    user: "Пользователь",
    banReason: "Причина блокировки",
    banReasonPlaceholder: "Опишите причину блокировки...",
    banDuration: "Длительность блокировки",
    banDuration1h: "1 час",
    banDuration24h: "24 часа",
    banDuration7d: "7 дней",
    banDuration14d: "14 дней",
    banDuration30d: "30 дней",
    banDurationPermanent: "Навсегда",
    specifyReason: "Укажите причину бана",
    reasonTooLong: "Причина слишком длинная (макс. 500 символов)",
    characters: "символов",
    previousBans: "Предыдущие баны",
    banInfoPermanent: "Вечная блокировка (4 и более нарушений)",
    banInfoPermanentDesc: "Пользователь будет заблокирован навсегда",
    banInfoPermanentManual: "Вечная блокировка",
    banInfoPermanentManualDesc: "Пользователь будет заблокирован навсегда",
    banInfoTemporary: "Временная блокировка (нарушение №{count})",
    permanent: "Навсегда",
    nextBanPermanent: "Следующий бан будет вечным",
    cancel: "Отмена",
    ban: "Заблокировать",
    confirm: "Подтвердить",
    ok: "OK",
    userBanned: "Пользователь забанен",
    userPermanentlyBanned: "Пользователь {username} заблокирован навсегда ({count} нарушений)",
    userPermanentlyBannedManual: "Пользователь {username} заблокирован навсегда",
    userBannedSuccess: "Пользователь {username} был забанен на {duration}",
    userUnbanned: "Пользователь разбанен",
    userUnbannedSuccess: "Пользователь {username} был разбанен",
    makeAdminSuccess: "Пользователь {username} назначен администратором",
    removeAdminSuccess: "Пользователь {username} лишен прав администратора",
    cannot: "Невозможно",
    cannotBanAdmin: "Нельзя заблокировать администратора",
    cannotBanSelf: "Нельзя заблокировать самого себя",
    error: "Ошибка",
    networkError: "Ошибка сети",
    networkErrorTitle: "Ошибка сети",
    operationFailed: "Операция не выполнена",
    success: "Успешно",
    checkingPermissions: "Проверка прав доступа...",
    accessDenied: "Доступ запрещен",
    noAdminRights: "У вас нет прав доступа к админ-панели",
    goHome: "На главную",
    tryAgain: "Попробовать снова",
    authRequired: "Требуется авторизация",
    errorLoadingUsers: "Ошибка загрузки пользователей",
    violationNumber: "Нарушение №{number}",
    automaticPermanentBan: "Автоматическая вечная блокировка (4 и более нарушений)",
    totalTickets: "Всего обращений",
pendingTickets: "Ожидают ответа",
answeredTickets: "Отвечено",
manageSupportTickets: "Управление обращениями",
searchSupportPlaceholder: "Поиск по теме или email...",
ticketNumber: "№ обращения",
subject: "Тема",
userMessage: "Сообщение пользователя",
yourResponse: "Ваш ответ",
responsePlaceholder: "Введите ваш ответ пользователю...", 
respondToTicket: "Ответить на обращение",
confirmCloseTicket: "Закрыть обращение?",
confirmCloseTicketMessage: "Вы уверены, что хотите закрыть обращение {ticketNumber}?",
editResponse: "Редактировать ответ",
closeTicket: "Закрыть обращение",
ticketClosed: "Обращение закрыто",
ticketClosedSuccess: "Обращение {ticketNumber} закрыто",
    // Экологические уровни
    ecoBeginner: 'Эко-новичок',
    ecoAmateur: 'Эко-любитель',
    ecoEnthusiast: 'Эко-энтузиаст',
    ecoMaster: 'Эко-мастер',
    ecoLegend: 'Эко-легенда',
    
    // Подсказки
    makeAdminTooltip: 'Назначить администратором',
    removeAdminTooltip: 'Убрать права администратора',
    banTooltip: 'Забанить пользователя',
    unbanTooltip: 'Разбанить пользователя',
    emailVerified: 'Почта подтверждена',
    
    // Подтверждения
    confirmMakeAdmin: 'Назначить пользователя администратором?',
    confirmRemoveAdmin: 'Убрать права администратора у пользователя?',
    confirmBan: 'Забанить пользователя?',
    confirmUnban: 'Разбанить пользователя?',
    
    // Уведомления об успехе
    userMadeAdminSuccess: 'Пользователь назначен администратором',
    userRemovedAdminSuccess: 'Пользователь удален из администраторов',
    userBannedSuccess: 'Пользователь забанен',
    userUnbannedSuccess: 'Пользователь разбанен',
    
    // Ошибки
    errorLoadingUsers: 'Ошибка загрузки пользователей',
    networkError: 'Ошибка сети. Проверьте подключение.',
    operationFailed: 'Операция не выполнена',
    accessDenied: 'Доступ запрещен. У вас нет прав администратора.',
    error: 'Ошибка',
    tryAgain: 'Попробовать снова',
    loading: 'Загрузка...',
    
    // Пустые состояния
    noUsersFound: 'Пользователи не найдены',
    noUsersDescription: 'Измените параметры поиска или попробуйте позже.',
    
    // Пагинация
    page: 'Страница',
    of: 'из',
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
    authModalTitle: 'Требуется регистрация',
    authModalText: 'Чтобы ставить лайки историям, необходимо войти в систему.',
    authModalCancel: 'Остаться здесь',
    authModalLogin: 'Войти в систему',
    bansCount: "Баны",
    // Переводы категорий историй
    categoryTransport: "Транспорт",
    categoryFood: "Питание", 
    categoryEnergy: "Энергия",
    categoryWaste: "Отходы",
    categoryWater: "Вода",
    categoryGeneral: "Общее",
    categoryConsumption: "Потребление",
    categoryNature: "Природа",
    categoryHousehold: "Быт",
    categoryPlanning: "Планирование",
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
    clearCacheTitle: "Очистка кэша",
    clearCacheConfirmation: "Вы уверены, что хотите очистить кэш?",
    clearCacheWillBeDeleted: "Будут удалены:",
    clearCacheTempFiles: "Временные файлы приложения",
    clearCacheCachedData: "Кэшированные данные",
    clearCacheSessionData: "Данные сессии", 
    clearCacheBrowserCache: "Кэш браузера",
    clearCacheNote: "Ваши настройки и данные аккаунта сохранятся.",
    clearCacheButton: "Очистить кэш",
    logout: "Выход из системы",
    logoutDesc: "Завершить текущую сессию и выйти из аккаунта",
    deleteAccount: "Удаление аккаунта",
    deleteAccountDesc: "Безвозвратно удалить аккаунт и все связанные данные. Это действие нельзя отменить!",
    cacheClearedSuccess: "Кэш успешно очищен!",
    cacheClearedDetails: "Временные файлы и кэшированные данные были удалены.",
    cacheClearError: "Ошибка при очистке кэша",
    deleteSupportTickets: "Все обращения в поддержку",
    deleteSettings: "Персональные настройки",
    deleteFinalWarning: "Это действие необратимо!",
    deleteCannotBeUndone: "После удаления восстановить данные будет невозможно.",
    typeEmailToConfirm: "Для подтверждения введите ваш email:",
    emailConfirmationNote: "Убедитесь, что это именно тот email, который вы хотите удалить.",
    accountDeletedSuccess: "Аккаунт удален",
    accountDeletedDetails: "Ваш аккаунт и все связанные данные были успешно удалены.",
    deleteAccountError: "Ошибка при удалении аккаунта",
    deleteWarning: "ВНИМАНИЕ: Удаление аккаунта",
    deleteWillRemove: "Удаление аккаунта приведет к удалению:",
    deleteProfile: "Вашего профиля и личных данных",
    deleteHistory: "Истории вашей экологической активности",
    deleteTeams: "Участия в командах и экосообществах",
    deleteStories: "Историй успеха и публикаций",
    deleteAchievements: "Достижений и наград",
    deleteConfirm: "Вы уверены, что хотите продолжить?",
    deleteForever: "Удалить навсегда",
    deleteAccountModalTitle: "Удаление аккаунта",
    accountDeletedTitle: "Аккаунт удален",
    deleteWarning: "Вы собираетесь удалить свой аккаунт. Это действие необратимо.",
    willBeDeleted: "Будет удалено:",
    deleteProfile: "Профиль пользователя",
    deleteHistory: "История активности",
    deleteTeams: "Участие в командах",
    deleteAchievements: "Достижения и награды",
    deleteSupportTickets: "Обращения в поддержку",
    deleteSettings: "Персональные настройки",
    typeEmailToConfirm: "Для подтверждения введите ваш email:",
    enterEmailPlaceholder: "Введите email для подтверждения",
    accountDeletedSuccess: "Аккаунт успешно удален",
    accountDeletedDetails: "Все ваши данные были удалены из системы",
    redirectingIn: "Перенаправление через",
    seconds: "секунд",
    deleting: "Удаляем...",
    goToHomePage: "Перейти на главную",
    cancel: "Отмена",
    deleteAccount: "Удалить аккаунт",
    emailDoesNotMatch: "Email не совпадает",
    confirmDeleteTitle: "Удалить историю?",
    confirmDeleteMessage: "Вы уверены, что хотите удалить эту историю? Это действие нельзя отменить.",
    cancel: "Отмена",
    delete: "Удалить",
    storyCreatedSuccess: "История успешно создана!",
    storyCreatedDesc: "Она появится после проверки модератором.",
    storyDeletedSuccess: "История успешно удалена",
    storyDeletedDesc: "История была удалена из вашего профиля.",
    // Для уведомлений:
    notificationSuccess: "Успешно",
    notificationError: "Ошибка",
    notificationInfo: "Информация",
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
    mySupportRequests: "Мои обращения",
    mySupportRequestsDesc: "Отслеживание статуса ваших вопросов",
    viewMyRequests: "Посмотреть",
    writeToSupport: "Написать в поддержку",
    contactSupport: "Написать в поддержку",
    contactSupportDesc: "Задать вопрос или сообщить о проблеме",
    supportSubject: "Тема вопроса",
    supportSubjectPlaceholder: "Кратко опишите тему вопроса",
    supportMessage: "Ваше сообщение",
    supportMessagePlaceholder: "Подробно опишите ваш вопрос или проблему...",
    supportMessageHint: "Мы постараемся ответить как можно скорее",
    sendMessage: "Отправить",
    supportRequestSent: "Вопрос отправлен",
    supportWillRespond: "Мы ответим вам в ближайшее время",
    statusPending: "Ожидает ответа",
    statusAnswered: "Отвечено",
    statusClosed: "Закрыто",
    hasResponse: "Есть ответ",
    noQuestionsTitle: "У вас пока нет обращений",
    noQuestionsDescription: "Задайте свой первый вопрос в поддержку",
    createFirstQuestion: "Задать вопрос",
    askNewQuestion: "Задать новый вопрос",
    createdAt: "Создано",
    answeredAt: "Отвечено",
    yourQuestion: "Ваш вопрос",
    adminResponse: "Ответ поддержки",
    errorLoadingQuestions: "Ошибка загрузки вопросов",
    errorSendingRequest: "Ошибка отправки запроса",
    supportTitle: "Поддержка",
    supportApp: "Поддержка приложения",
    contactSupport: "Написать в поддержку",
    contactSupportDesc: "Задать вопрос или сообщить о проблеме",
    writeToSupport: "Написать",
    faqTitle: "Часто задаваемые вопросы",
    faqDesc: "Ответы на популярные вопросы о приложении",
    openFAQ: "Открыть FAQ",
    aboutApp: "О приложении",
    aboutAppDesc: "Узнать больше о приложении EcoSteps",
    mySupportRequests: "Мои обращения",
    mySupportRequestsDesc: "Отслеживание статуса ваших вопросов",
    viewMyRequests: "Посмотреть",

    // Форма поддержки
    supportSubject: "Тема вопроса",
    supportSubjectPlaceholder: "Кратко опишите тему вопроса",
    supportMessage: "Ваше сообщение",
    supportMessagePlaceholder: "Подробно опишите ваш вопрос или проблему...",
    supportMessageHint: "Мы постараемся ответить как можно скорее",
    sendMessage: "Отправить",
    messageSent: "Сообщение отправлено!",
    supportRequestSent: "Вопрос отправлен в поддержку",
    supportWillRespond: "Мы рассмотрим ваш вопрос и ответим в ближайшее время",
    responseTime: "Обычно мы отвечаем в течение 24 часов",
    checkStatusInMyRequests: "Статус ответа можно отслеживать в разделе Мои обращения",
    windowWillClose: "Окно закроется автоматически через 5 секунд...",
    
    // Статусы вопросов
    statusPending: "Ожидает ответа",
    statusAnswered: "Отвечено",
    statusClosed: "Закрыто",
    
    // Уведомления поддержки
    noQuestionsTitle: "У вас пока нет обращений",
    noQuestionsDescription: "Задайте свой первый вопрос в поддержку",
    createFirstQuestion: "Задать вопрос",
    errorLoadingQuestions: "Ошибка загрузки вопросов",
    errorSendingRequest: "Ошибка отправки запроса",
    hasResponse: "Есть ответ",
    askNewQuestion: "Задать новый вопрос",
    noSubject: "Без темы",
  updated: "Обновлено",
  answeredAt: "Ответ",
  refresh: "Обновить",
  close: "Закрыть",
  loading: "Загрузка...",
  errorLoadingData: "Ошибка загрузки данных",
  dataLoadError: "Не удалось загрузить список обращений",
  tryAgain: "Попробовать снова",
  noQuestionsTitle: "У вас пока нет обращений",
  noQuestionsDescription: "Задайте свой первый вопрос в поддержку",
  createFirstQuestion: "Задать вопрос",
  hasResponse: "Есть ответ",
  askNewQuestion: "Задать новый вопрос",
  // FAQ
  faqTitle: "Часто задаваемые вопросы",
  faqDesc: "Ответы на популярные вопросы о приложении",
  openFAQ: "Открыть FAQ",
  askQuestion: "Задать вопрос",
  
  // FAQ вопросы и ответы
  faqQuestion1: "Как рассчитывается экономия CO₂?",
  faqAnswer1: "Расчет основан на научных данных о выбросах различных видов деятельности. Например, поездка на велосипеде вместо автомобиля экономит примерно 2.6 кг CO₂ на 10 км.",

  faqQuestion2: "Как изменить свой эко-уровень?",
  faqAnswer2: "Эко-уровень повышается автоматически при накоплении определенного количества сэкономленного CO₂ и выполнении эко-действий.",
  
  faqQuestion3: "Можно ли удалить историю успеха?",
  faqAnswer3: "Да, вы можете удалить свои истории успеха в разделе 'Мои истории' в личном кабинете.",
  
  faqQuestion4: "Как работают команды?",
  faqAnswer4: "Команды позволяют объединяться с единомышленниками для достижения общих эко-целей. Вы можете создать команду или присоединиться к существующей.",
  
  faqQuestion5: "Безопасны ли мои данные?",
  faqAnswer5: "Мы используем современные методы шифрования и не передаем ваши данные третьим лицам. Подробнее в политике конфиденциальности.",
    // Детали вопроса
    yourQuestion: "Ваш вопрос",
    adminResponse: "Ответ поддержки",
    createdAt: "Создано",
    answeredAt: "Отвечено",
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
    createStoryButton:"Создать историю",
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
    logoutBtn: "Выйти из системы",
    deleteAccountBtn: "Удалить аккаунт",
    deleteForever: "Удалить навсегда",
    //уровни
    ecoHero: "Эко-герой",
    ecoMaster: "Эко-мастер", 
    ecoActivist: "Эко-активист",
    ecoEnthusiast: "Эко-энтузиаст",
    ecoStarter: "Эко-стартер",
    ecoNovice: "Эко-новичок",
    //достижения
    titleAch: "Достижения",
      myAchievements: "Мои достижения",
      allAchievements: "Все достижения",
      ecoCoins: "Эко-коины",
      loading: "Загрузка достижений...",
      userNotFound: "Пользователь не найден. Пожалуйста, войдите в систему.",
      loadError: "Не удалось загрузить достижения",
      youWillReceive:"Вы получите",
      getReward:"Получить награду",
      // Статистика
      completed: "Выполнено",
      points: "Очки",
      progress: "Прогресс",
      
      // Редкости достижений
      rarity: {
        common: "Обычный",
        rare: "Редкий",
        epic: "Эпический",
        legendary: "Легендарный"
      },
      
      // Статусы достижений
      inProgress: "В процессе",
      completed: "Завершено",
      claimed: "Получено",
      claimReward: "Получить награду",
      
      // Модальное окно
      confirmClaim: "Подтверждение награды",
      reward: "Награда",
      confirmClaimText: "Вы уверены, что хотите получить эту награду?",
      
      // Сообщения
      rewardClaimed: "Награда успешно получена!",
      claimError: "Не удалось получить награду",
      
      // Пустые состояния
      noAchievements: "Достижения не найдены",
      noAchievementsHint: "Выполняйте задания, чтобы открыть достижения",
      showingAchievements: "Показано",
ofTotal: "из",
achievements: "достижений",
      // Категории (если будут добавлены позже)
      allCategories: "Все категории",
      daily: "Ежедневные",
      steps: "Шаги",
      eco: "Эко-действия",
      social: "Социальные",
      challenge: "Испытания",
      collection: "Коллекции",
    // Admin panel - Stories/Reviews management
    manageReviews: 'Управление историями',
    totalStories: 'Всего историй',
    published: 'Опубликованные',
    pendingReview: 'На проверке',
    draft: 'Черновик',
    storiesByCategory: 'Истории по категориям',
    searchStoriesPlaceholder: 'Поиск по заголовку или автору...',
    allCategories: 'Все категории',
    pendingReview: 'На проверке',
    draft: 'Черновик',
    title: 'Заголовок',
    author: 'Автор',
    category: 'Категория',
    carbonSaved: 'CO₂ сохранено',
    previewStory: 'Просмотреть историю',
    publishStory: 'Опубликовать',
    rejectStory: 'Отклонить',
    unpublishStory: 'Снять с публикации',
    moveToDraft: 'В черновики',
    storyPreview: 'Предпросмотр истории',
    likes: 'лайков',
    confirmPublish: 'Опубликовать историю?',
    confirmPublishMessage: 'Опубликовать историю "{title}" от {author}?',
    confirmReject: 'Отклонить историю?',
    confirmRejectMessage: 'Отклонить историю "{title}" от {author}?',
    confirmUnpublish: 'Снять с публикации?',
    confirmUnpublishMessage: 'Снять с публикации историю "{title}" от {author}? История будет перемещена в черновики.',
    storyPublished: 'История опубликована',
    storyRejected: 'История отклонена',
    storyUnpublished: 'История снята с публикации',
    noStoriesFound: 'Истории не найдены',
    noStoriesInSystem: 'Нет историй в системе',
    showAllStories: 'Показать все истории',
    loadingStories: 'Загрузка историй...',

    // Admin panel - Support management
    viewResponse: 'Просмотреть',
    respondToTicket: 'Ответить',
    editResponse: 'Редактировать ответ',
    ticketNumber: '№ обращения',
    userMessage: 'Сообщение пользователя',
    yourResponse: 'Ваш ответ',
    responsePlaceholder: 'Введите ваш ответ пользователю...',
    responseRequired: 'Введите ответ',
    responseTooLong: 'Ответ слишком длинный (макс. 2000 символов)',
    sendResponse: 'Отправить',
    updateResponse: 'Обновить',
    responseSent: 'Ответ отправлен',
    responseSentToUser: 'Ответ отправлен пользователю {username}',
    confirmCloseTicket: 'Закрыть обращение?',
    confirmCloseTicketMessage: 'Вы уверены, что хотите закрыть обращение {ticketNumber}?',
    closeTicket: 'Закрыть обращение',
    ticketClosed: 'Обращение закрыто',
    ticketClosedSuccess: 'Обращение {ticketNumber} закрыто',
    //Истории
    reviewsPageTitle: "Истории успеха",
    
    // Статистика страница
    statsTotalSaved: "Сэкономлено CO₂",
    statsKg: "кг",
    statsTons: "т",
    statsKm: "км",
    statsKWh: "кВтч",
    statsM3: "м³",
    statsL: "л",
    statsServings: "порций",
    statsPercent: "%",
    statsAllTime: "Относительно среднего мирового следа",
    statsMonthSaved: "За месяц",
    statsLast30Days: "Последние 30 дней",
    statsLevel: "Уровень",
    statsToNext: "До",
    statsMaxLevel: "Максимальный уровень!",
    statsChartTitle: "Динамика углеродного следа",
    statsPeriodWeek: "Неделя",
    statsPeriodMonth: "Месяц",
    statsPeriodYear: "Год",
    statsBarChartTitle: "Углеродный след по дням",
    statsPieChartTitle: "Распределение по категориям",
    statsNoData: "Нет данных",
    statsCalculatorTitle: "Калькулятор углеродного следа",
    statsCalculatorHint: "💡 Укажите ваше потребление за указанный период (день/неделя/месяц) для каждой категории",
    statsReset: "Сбросить",
    statsCarKm: "Автомобиль (км в день)",
    statsBusKm: "Автобус (км в день)",
    statsPlaneKm: "Самолет (км в месяц)",
    statsTrainKm: "Поезд (км в день)",
    statsHousing: "Жилье",
    statsElectricity: "Электричество (кВтч в месяц)",
    statsHeating: "Отопление (кВтч в месяц)",
    statsWater: "Вода (м³ в месяц)",
    statsGas: "Газ (м³ в месяц)",
    statsMeat: "Мясо и рыба (кг в неделю)",
    statsVegetables: "Овощи и фрукты (кг в неделю)",
    statsProcessedFood: "Обработанные продукты (порций в неделю)",
    statsLocalFood: "Местные продукты (%)",
    statsDairy: "Молочные продукты (л в неделю)",
    statsWaste: "Отходы",
    statsRecycling: "Переработка отходов (%)",
    statsCompost: "Компостирование (%)",
    statsPlastic: "Пластик (кг в месяц)",
    statsCalculating: "Расчет...",
    statsCalculateButton: "Рассчитать углеродный след",
    statsResults: "Результаты расчета",
    statsTotalFootprint: "Ваш углеродный след",
    statsSaved: "Сэкономлено",
    statsPerDay: "в день",
    statsHistory: "История расчетов",
    statsNoHistory: "История расчетов пуста",
    statsFirstCalculation: "Сделать первый расчет",
    statsSubtitle: "Отслеживайте свой углеродный след и прогресс",
    
    // Eco levels
    ecoLevelNovice: "Эко-новичок",
    ecoLevelStarter: "Эко-стартер",
    ecoLevelEnthusiast: "Эко-энтузиаст",
    ecoLevelActivist: "Эко-активист",
    ecoLevelMaster: "Эко-мастер",
    ecoLevelHero: "Эко-герой",
    reviewsPageSubtitle: "Читайте и делитесь своими эко-историями",
    allStoriesTab: "Все истории",
    myStoriesTab: "Мои истории",
    allStories: "Все",
    bestStories: "Лучшие",
    recentStories: "Новые",
    allStatuses: "Все",
    statusPublished: "Опубликовано",
    statusPending: "На проверке",
    categories: "Категории",
    allCategories: "Все",
    createNewStory: "Написать историю",
    createStoryTitle: "Написать историю",
    storyTitle: "Заголовок",
    storyTitlePlaceholder: "Например: Как я начал сортировать мусор",
    storyContent: "Содержание",
    category: "Категория",
    carbonSaved: "Сохранено CO₂",
    carbonSavedHint: "Примерное количество сэкономленного CO₂ в килограммах",
    cancel: "Отмена",
    createStory: "Создать историю",
    creatingStory: "Создание...",
    loadingStories: "Загрузка историй...",
    translatingStories: "Перевод историй...",
    noStoriesTitle: "Пока нет историй",
    noMyStoriesDesc: "У вас еще нет историй. Напишите свою первую историю!",
    noAllStoriesDesc: "Здесь пока нет историй. Будьте первым!",
    createFirstStory: "Написать историю",
    collapseStory: "Свернуть",
    expandStory: "Развернуть",
    storyCreatedSuccess: "История успешно создана! Она появится после проверки модератором.",
    storyDeletedSuccess: "История успешно удалена",
    confirmDeleteStory: "Вы уверены, что хотите удалить эту историю?",
    deleteStory: "Удалить историю",
    showingStories: "Показано",
    ofTotal: "из",
    carbonSavedKg: "кг",
    carbonSaved: "CO₂ сохранено",
    
    // Переводы для рейтинга (Leaderboard)
    leaderboardTitle: "Рейтинг по сэкономленному CO₂",
    yourPosition: "Ваша позиция",
    yourTeamPosition: "Позиция вашей команды",
    usersTab: "Пользователи",
    teamsTab: "Команды",
    rank: "Место",
    user: "Пользователь",
    team: "Команда",
    members: "Участники",
    joinDate: "Дата регистрации",
    createdDate: "Дата создания",
    outOf: "из",
    showing: "Показано",
    of: "из",
    loading: "Загрузка...",
    
    // Переводы для админки историй
    manageReviews: "Управление историями",
    totalStories: "Всего историй",
    published: "Опубликованные",
    pendingReview: "На проверке",
    storiesByCategory: "Истории по категориям",
    searchStoriesPlaceholder: "Поиск по заголовку или автору...",
    allCategories: "Все категории",
    title: "Заголовок",
    author: "Автор",
    category: "Категория",
    carbonSaved: "CO₂ сохранено",
    createdAt: "Дата",
    previewStory: "Просмотреть историю",
    publishStory: "Опубликовать",
    rejectStory: "Отклонить",
    unpublishStory: "Снять с публикации",
    confirmPublish: "Опубликовать историю?",
    confirmPublishMessage: "Опубликовать историю \"{title}\" от {author}?",
    confirmReject: "Отклонить историю?",
    confirmRejectMessage: "Отклонить историю \"{title}\" от {author}?",
    storyPublished: "История опубликована",
    storyRejected: "История отклонена",
    storyPreview: "Предпросмотр истории",
    close: "Закрыть",
    likes: "лайков",
    loadingStories: "Загрузка историй...",
    noStoriesFound: "Истории не найдены",
    noStoriesInSystem: "Нет историй в системе.",
    showAllStories: "Показать все истории",
    
    // Profile Page
    profileNotFound: "Профиль не найден",
    friends: "Друзья",
    posts: "Посты",
    teams: "Команды",
    treesPlanted: "Деревья посажены",
    carbonSaved: "CO₂ сэкономлено",
    bio: "О себе",
    goal: "Цель",
    dateOfBirth: "Дата рождения",
    day: "День",
    month: "Месяц",
    year: "Год",
    invalidDateFormat: "Неверный формат. Используйте ДД/ММ/ГГГГ",
    invalidMonth: "Месяц должен быть от 1 до 12",
    invalidDay: "День должен быть от 1 до 31",
    invalidYear: "Год должен быть от 1900 до текущего",
    invalidDate: "Такой даты не существует",
    ageRestriction: "Вам должно быть не менее 18 лет",
    error: "Ошибка",
    errorSavingProfile: "Ошибка сохранения профиля",
    ok: "OK",
    january: "Январь",
    february: "Февраль",
    march: "Март",
    april: "Апрель",
    may: "Май",
    june: "Июнь",
    july: "Июль",
    august: "Август",
    september: "Сентябрь",
    october: "Октябрь",
    november: "Ноябрь",
    december: "Декабрь",
    edit: "Редактировать",
    save: "Сохранить",
    bioPlaceholder: "Расскажите о себе...",
    goalPlaceholder: "Ваша экологическая цель...",
    whatsOnYourMind: "Что у вас нового?",
    publish: "Опубликовать",
    noPosts: "Пока нет постов",
    confirmDeletePost: "Удалить пост?",
    confirmDeletePostMessage: "Вы уверены, что хотите удалить этот пост?",
    confirmDeleteComment: "Удалить комментарий?",
    confirmDeleteCommentMessage: "Вы уверены, что хотите удалить этот комментарий?",
    addComment: "Добавить комментарий...",
    publicProfile: "Публичный профиль",
    publicProfileHint: "Если включено, ваш профиль смогут видеть все пользователи",
    viewFriends: "Посмотреть друзей",
    friendsList: "Список друзей",
    noFriends: "Пока нет друзей",
    viewProfile: "Посмотреть профиль",
    backToMyProfile: "Вернуться к моему профилю",
    
    // Friendship
    addFriend: "Добавить в друзья",
    friendRequestSent: "Запрос отправлен",
    acceptFriendRequest: "Принять запрос",
    rejectFriendRequest: "Отклонить",
    removeFriend: "Удалить из друзей",
    confirmRemoveFriend: "Вы точно хотите удалить из друзей",
    friends: "Друзья",
    
    // Report user
    reportUser: "Пожаловаться",
    reportModalTitle: "Пожаловаться на пользователя",
    reportReason: "Причина жалобы",
    reportReasonPlaceholder: "Укажите причину жалобы",
    selectReason: "Выберите причину",
    reportReasonSpam: "Спам",
    reportReasonHarassment: "Оскорбления",
    reportReasonInappropriate: "Неуместный контент",
    reportReasonOther: "Другое",
    reportDescription: "Описание",
    reportDescriptionPlaceholder: "Опишите проблему подробнее...",
    screenshots: "Скриншоты",
    maxScreenshots: "Максимум 5 скриншотов",
    addScreenshots: "Добавить скриншоты",
    submitReport: "Отправить жалобу",
    reportSent: "Жалоба отправлена",
    fillAllFields: "Заполните все поля",
    
    // Change password
    changePassword: "Сменить пароль",
    changePasswordModalTitle: "Смена пароля",
    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    confirmPassword: "Подтвердите пароль",
    passwordsDoNotMatch: "Пароли не совпадают",
    passwordChanged: "Пароль изменен",
    resetPasswordTitle: "Сброс пароля",
    resetPasswordDesc: "Мы отправим ссылку для сброса пароля на ваш email:",
    checkSpamFolder: "Проверьте папку \"Спам\", если письмо не придет в течение нескольких минут.",
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
    authModalTitle: 'Login Required',
    authModalText: 'To like stories, you need to log in to the system.',
    authModalCancel: 'Stay Here',
    authModalLogin: 'Login to System',
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
    backButton: "Back",
    // Настройки
    settingsTitle: "Settings", 
    settingsAppearance: "Appearance", 
    settingsNotifications: "Notifications", 
    settingsPrivacy: "Privacy", 
    settingsAccount: "Account", 
    settingsSupport: "Support", 
    
    languageRussian: "Russian",
    languageBelarusian: "Belarusian",
    languageEnglish: "English",
    
    themeLight: "Light theme", 
    themeDark: "Dark theme", 
    
    appearanceTitle: "Appearance and Interface", 
    themeSelectionTitle: "Theme", 
    themeSelectionDescription: "Choose a light or dark theme for the interface", 
    lightThemeDescription: "Classic light interface", 
    darkThemeDescription: "Dark mode for eye comfort", 
    languageSelectionTitle: "Interface Language", 
    languageSelectionDescription: "Choose the preferred language of the application", 

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
     //ПАНЕЛЬ АДМИНА
     adminPanel: 'Admin Panel',
     adminUsers: 'Users',
     adminFunds: 'Funds',
     adminAchievements: 'Achievements',
     adminStatistics: 'Statistics',
     adminComplaints: 'Complaints',
     adminReviews: 'Reviews',
     adminUsersManagement: 'User Management',
     adminFundsManagement: 'Fund Management',
     adminAchievementsManagement: 'Achievements Management',
     adminPlatformStatistics: 'Platform Statistics',
     adminUserComplaints: 'User Complaints',
     adminUserReviews: 'User Reviews',
     adminUsersListPlaceholder: 'User list will be here',
     adminFundsListPlaceholder: 'Fund management will be here',
     adminAchievementsListPlaceholder: 'Achievements management will be here',
     adminStatisticsPlaceholder: 'Statistics will be here',
     adminComplaintsListPlaceholder: 'Complaints list will be here',
     adminReviewsListPlaceholder: 'Reviews list will be here',
     menuAdmin: "Control",
     adminPanel: 'Admin Panel',
     adminUsers: 'Users',
     adminFunds: 'Funds',
     adminAchievements: 'Achievements',
     adminStatistics: 'Statistics',
     adminComplaints: 'Complaints',
     adminReviews: 'Reviews',
     adminUsersManagement: 'User Management',
     adminFundsManagement: 'Fund Management',
     adminAchievementsManagement: 'Achievements Management',
     adminPlatformStatistics: 'Platform Statistics',
     adminUserComplaints: 'User Complaints',
     adminUserReviews: 'User Reviews',
     adminUsersListPlaceholder: 'User list will be here',
     adminFundsListPlaceholder: 'Fund management will be here',
     adminAchievementsListPlaceholder: 'Achievements management will be here',
     adminStatisticsPlaceholder: 'Statistics will be here',
     adminComplaintsListPlaceholder: 'Complaints list will be here',
     adminReviewsListPlaceholder: 'Reviews list will be here',
     ecoLevel: "Eco Level",
     ecoNovice: "Eco Novice",
     ecoEnthusiast: "Eco Enthusiast",
     ecoActivist: "Eco Activist",
     ecoMaster: "Eco Master",
     ecoLegend: "Eco Legend",
     carbonUnit: "kg",
     adminPanel: "Admin Panel",
manageUsers: "User Management",
manageFunds: "Funds Management",
manageAchievements: "Achievements Management",
manageReports: "Reports Management",
manageReviews: "Reviews Management",
adminTabUsers: "Users",
adminTabFunds: "Funds",
adminTabAchievements: "Achievements",
adminTabReports: "Reports",
adminTabReviews: "Reviews",
checkingPermissions: "Checking permissions...",
accessDenied: "Access denied",
noAdminRights: "You don't have admin rights",
goHome: "Go home",
refresh: "Refresh",
totalUsers: "Total users",
totalAdmins: "Administrators",
totalBanned: "Banned users",
searchPlaceholder: "Search by email or nickname...",
allRoles: "All roles",
adminsA: "Administrators",
users: "Users",
allStatuses: "All statuses",
banned: "Banned",
active: "Active",
showing: "Showing",
of: "of",
filtered: "filtered",
loadingUsers: "Loading users...",
error: "Error",
tryAgain: "Try again",
noUsersFound: "No users found",
changeSearchParams: "Change search parameters",
allUsersFromDB: "All users from DB",
allAdminsFromDB: "All admins from DB",
allBannedFromDB: "All banned from DB",
clearFilters: "Clear filters",
showAllUsers: "Show all users",
ID: "ID",
Email: "Email",
nickname: "Nickname",
registrationDate: "Registration date",
ecoLevel: "Eco-level",
CO2: "CO₂",
status: "Status",
actions: "Actions",
noNickname: "No nickname",
banned: "Banned",
admin: "Admin",
active: "Active",
removeAdminRights: "Remove admin rights",
makeAdmin: "Make admin",
unbanUser: "Unban user",
banUser: "Ban user",
cannot: "Cannot",
cannotBanAdmin: "Cannot ban administrator",
cannotBanSelf: "Cannot ban yourself",
user: "User",
banReason: "Ban reason",
banDuration: "Ban duration",
cancel: "Cancel",
ban: "Ban",
confirmUnban: "Unban user?",
confirmUnbanMessage: "Are you sure you want to unban user {username}?",
userUnbanned: "User unbanned",
userUnbannedSuccess: "User {username} has been unbanned",
confirmMakeAdmin: "Make admin?",
confirmMakeAdminMessage: "Make user {username} administrator?",
makeAdminSuccess: "User {username} made administrator",
confirmRemoveAdmin: "Remove admin rights?",
confirmRemoveAdminMessage: "Remove admin rights from user {username}?",
removeAdminSuccess: "User {username} admin rights removed",
success: "Success",
operationFailed: "Operation failed",
networkErrorTitle: "Network error",
networkError: "Network error",
confirm: "Confirm",
ok: "OK",
specifyReason: "Specify reason",
userBanned: "User banned",
userBannedSuccess: "User {username} has been banned",
banReasonSpam: "Spam or advertising",
banReasonHarassment: "Insults or bullying",
banReasonFakeNews: "Fake news distribution",
banReasonCheating: "Cheating or boosting",
banReasonInappropriate: "Inappropriate content",
banReasonMultipleAccounts: "Multiple accounts",
banReasonOther: "Other reason",
banDuration1h: "1 hour",
banDuration24h: "24 hours",
banDuration3d: "3 days",
banDuration7d: "7 days",
banDuration30d: "30 days",
banDurationPermanent: "Permanent",
authRequired: "Authorization required",
errorLoadingUsers: "Error loading users",
fundsComingSoon: "Eco-funds management coming soon",
achievementsComingSoon: "Achievements management coming soon",
reportsComingSoon: "Reports management coming soon",
reviewsComingSoon: "Reviews management coming soon",
banUser2: "Ban User",
user: "User",
banReason: "Ban Reason",
banReasonPlaceholder: "Describe the ban reason...",
banDuration: "Ban Duration",
banDuration1h: "1 hour",
banDuration24h: "24 hours",
banDuration7d: "7 days",
banDuration14d: "14 days",
banDuration30d: "30 days",
banDurationPermanent: "Permanent",
specifyReason: "Specify ban reason",
reasonTooLong: "Reason too long (max 500 characters)",
characters: "characters",
previousBans: "Previous Bans",
banInfoPermanent: "Permanent Ban (4+ violations)",
banInfoPermanentDesc: "User will be banned permanently",
banInfoPermanentManual: "Permanent Ban",
banInfoPermanentManualDesc: "User will be banned permanently",
banInfoTemporary: "Temporary Ban (violation #{count})",
permanent: "Permanent",
nextBanPermanent: "Next ban will be permanent",
cancel: "Cancel",
ban: "Ban",
confirm: "Confirm",
ok: "OK",
userBanned: "User Banned",
userPermanentlyBanned: "User {username} permanently banned ({count} violations)",
userPermanentlyBannedManual: "User {username} permanently banned",
userBannedSuccess: "User {username} was banned for {duration}",
userUnbanned: "User Unbanned",
userUnbannedSuccess: "User {username} was unbanned",
makeAdminSuccess: "User {username} appointed as administrator",
removeAdminSuccess: "User {username} stripped of admin rights",
cannot: "Cannot",
cannotBanAdmin: "Cannot ban administrator",
cannotBanSelf: "Cannot ban yourself",
error: "Error",
networkError: "Network Error",
networkErrorTitle: "Network Error",
operationFailed: "Operation failed",
success: "Success",
checkingPermissions: "Checking permissions...",
accessDenied: "Access Denied",
noAdminRights: "You don't have access to admin panel",
goHome: "Go Home",
tryAgain: "Try Again",
authRequired: "Authorization required",
errorLoadingUsers: "Error loading users",
bansCount: "Bans",
banPermanent: "Permanent ban",
userAlreadyPermanentlyBannedTitle: "User already permanently banned",
userAlreadyPermanentlyBannedSubtitle: "(violations: {{count}})",
userAlreadyPermanentlyBanned: "User {{username}} is already permanently banned",
userAlreadyBanned: "User {{username}} is already banned",
cannotBanAlreadyBanned: "Cannot ban an already banned user",
violationNumber: "Violation #{number}",
automaticPermanentBan: "Automatic permanent ban (4 or more violations)",
totalTickets: "Total tickets",
pendingTickets: "Pending",
answeredTickets: "Answered",
manageSupportTickets: "Manage Support Tickets",
searchSupportPlaceholder: "Search by subject or email...",
ticketNumber: "Ticket number",
subject: "Subject",
userMessage: "User message",
yourResponse: "Your response",
responsePlaceholder: "Enter your response to user...", 
respondToTicket: "Respond to ticket",
confirmCloseTicket: "Close ticket?",
confirmCloseTicketMessage: "Are you sure you want to close ticket {ticketNumber}?",
closeTicket: "Close ticket",
ticketClosed: "Ticket closed",
ticketClosedSuccess: "Ticket {ticketNumber} has been closed",
editResponse: "Edit response",
//достижения
allAchievements: 'All Achievements',
    completed: 'Completed',
    progress: 'Progress',
    visibleHint: 'visible',
    fromAll: 'from all',
    visibleAchievements: 'achievements',
    days: 'days',
    showingAchievements: 'Showing',
    ofTotal: 'of',
     // User Management
     totalUsers: 'Total Users',
     admins: 'Admins',
     bannedUsers: 'Banned',
     searchUsersPlaceholder: 'Search by email or nickname...',
     email: 'Email',
     nickname: 'Nickname',
     registrationDate: 'Registration Date',
     ecoLevel: 'Eco Level',
     carbonSaved: 'CO₂ Saved',
     emailVerified: 'Email',
     status: 'Status',
     actions: 'Actions',
     verified: 'Yes',
     notVerified: 'No',
     admin: 'Admin',
     active: 'Active',
     banned: 'Banned',
     createStoryButton:"Create a story",
     // Eco Levels
     ecoBeginner: 'Eco Beginner',
     ecoAmateur: 'Eco Amateur',
     ecoEnthusiast: 'Eco Enthusiast',
     ecoMaster: 'Eco Master',
     ecoLegend: 'Eco Legend',
     
     // Tooltips
     makeAdminTooltip: 'Make admin',
     removeAdminTooltip: 'Remove admin rights',
     banTooltip: 'Ban user',
     unbanTooltip: 'Unban user',
     emailVerified: 'Email verified',
     
     // Confirmations
     confirmMakeAdmin: 'Make user an administrator?',
     confirmRemoveAdmin: 'Remove administrator rights from user?',
     confirmBan: 'Ban user?',
     confirmUnban: 'Unban user?',
     
     // Success notifications
     userMadeAdminSuccess: 'User appointed as administrator',
     userRemovedAdminSuccess: 'User removed from administrators',
     userBannedSuccess: 'User banned',
     userUnbannedSuccess: 'User unbanned',
     adminTabSupport: "Support",
pending: "Pending",
answered: "Answered",
closed: "Closed",
allStatuses: "All statuses",
noUsersInSystem: "No users in the system yet.",
banned: "Banned",
     // Errors
     errorLoadingUsers: 'Error loading users',
     networkError: 'Network error. Check your connection.',
     operationFailed: 'Operation failed',
     accessDenied: 'Access denied. You do not have administrator rights.',
     error: 'Error',
     tryAgain: 'Try again',
     loading: 'Loading...',
     
     // Empty states
     noUsersFound: 'No users found',
     noUsersDescription: 'Change search parameters or try again later.',
     
     // Pagination
     page: 'Page',
     of: 'of',
     
     // Stories management
     manageReviews: 'Manage Stories',
     totalStories: 'Total Stories',
     published: 'Published',
     pendingReview: 'Pending Review',
     draft: 'Draft',
     storiesByCategory: 'Stories by Category',
     searchStoriesPlaceholder: 'Search by title or author...',
     allCategories: 'All Categories',
     title: 'Title',
     author: 'Author',
     category: 'Category',
     carbonSaved: 'CO₂ Saved',
     createdAt: 'Date',
     previewStory: 'Preview Story',
     publishStory: 'Publish',
     rejectStory: 'Reject',
     unpublishStory: 'Unpublish',
     confirmPublish: 'Publish story?',
     confirmPublishMessage: 'Publish story "{title}" by {author}?',
     confirmReject: 'Reject story?',
     confirmRejectMessage: 'Reject story "{title}" by {author}?',
     confirmUnpublish: 'Unpublish story?',
     confirmUnpublishMessage: 'Unpublish story "{title}" by {author}? Story will be moved to drafts.',
     storyPublished: 'Story published',
     storyRejected: 'Story rejected',
     storyUnpublished: 'Story unpublished',
     storyPreview: 'Story Preview',
     close: 'Close',
     likes: 'likes',
     loadingStories: 'Loading stories...',
     noStoriesFound: 'No stories found',
     noStoriesInSystem: 'No stories in system',
     showAllStories: 'Show all stories',
     
     // Category translations
     categoryTransport: "Transport",
     categoryFood: "Food", 
     categoryEnergy: "Energy",
     categoryWaste: "Waste",
     categoryWater: "Water",
     categoryGeneral: "General",
     categoryConsumption: "Consumption",
     categoryNature: "Nature",
     categoryHousehold: "Household",
     categoryPlanning: "Planning",
     networkError: 'Network error. Check your connection.',
     operationFailed: 'Operation failed',
     accessDenied: 'Access denied. You need administrator rights.',
     error: 'Error',
     tryAgain: 'Try again',
     loading: 'Loading...',
     
     // Empty states
     noUsersFound: 'No users found',
     noUsersDescription: 'Change search parameters or try again later.',
     confirmDeleteTitle: "Delete story?",
     confirmDeleteMessage: "Are you sure you want to delete this story? This action cannot be undone.",
     cancel: "Cancel",
     delete: "Delete",
     storyCreatedSuccess: "Story successfully created!",
     storyCreatedDesc: "It will appear after moderator review.",
     storyDeletedSuccess: "Story successfully deleted",
     storyDeletedDesc: "The story has been removed from your profile.",
     // Pagination
     page: 'Page',
     of: 'of',
    // Настройки - уведомления
  notificationsTitle: "Notifications and mailing lists", 
  generalNotifications: "General notifications", 
  generalNotificationsDesc: "Receive notifications about new features, updates and important events", 
  dailyEcoTips: "Daily eco-tips", 
  dailyEcoTipsDesc: "Receive useful ecology tips every day. Over 365 unique tips!", 
  emailNotifications: "Email notifications", 
  emailNotificationsDesc: "Receive important notifications by email", 
  pushNotifications: "Push notifications", 
  pushNotificationsDesc: "Receive instant notifications in the browser", 

    // Настройки - конфиденциальность
  privacyTitle: "Privacy and Security",
  resetPassword: "Reset password", 
  resetPasswordDesc: "Change password to log in to the system. The link will be sent to your email.", 
  privacyPolicyTitle: "Privacy policy", 
  privacyPolicyDesc: "Learn how we collect, use and protect your data", 
  termsOfUseTitle: "Terms of use", 
  termsOfUseDesc: "Rules and conditions for using the EcoSteps application", 
  dataSecurity: "Data security", 
  dataSecurityDesc: "Your data is protected by modern encryption methods and is not transferred to third parties", 
  sslEncryption: "SSL encryption", 
  gdprCompliance: "GDPR compliance", 
    // Настройки - аккаунт
   accountManagement: "Account management", 
   clearCache: "Clear cache", 
   clearCacheDesc: "Clear temporary files, application data and browser cache to improve performance",
   logout: "Log out of the system", 
   logoutDesc: "Complete the current session and log out of your account", 
   deleteAccount: "Delete account",
   deleteAccountDesc: "Permanently delete your account and all related data. This action cannot be undone!", 
   clearCacheTitle: "Clear Cache",
    clearCacheConfirmation: "Are you sure you want to clear the cache?",
    clearCacheWillBeDeleted: "The following will be deleted:",
    clearCacheTempFiles: "Application temporary files",
    clearCacheCachedData: "Cached data",
    clearCacheSessionData: "Session data",
    clearCacheBrowserCache: "Browser cache",
    clearCacheNote: "Your settings and account data will be preserved.",
    clearCacheButton: "Clear Cache",
    cacheClearedSuccess: "Cache successfully cleared!",
    cacheClearedDetails: "Temporary files and cached data have been removed.",
    cacheClearError: "Error clearing cache",
    notificationSuccess: "Success",
    notificationError: "Error",
    notificationInfo: "Info",
    deleteSupportTickets: "All support tickets",
    deleteSettings: "Personal settings",
    deleteFinalWarning: "This action is irreversible!",
    deleteCannotBeUndone: "After deletion, data recovery will be impossible.",
    typeEmailToConfirm: "To confirm, enter your email:",
    emailConfirmationNote: "Make sure this is exactly the email you want to delete.",
    accountDeletedSuccess: "Account deleted",
    accountDeletedDetails: "Your account and all associated data have been successfully deleted.",
    deleteAccountError: "Error deleting account",
    deleteWarning: "WARNING: Account deletion",
  deleteWillRemove: "Deleting your account will remove:",
  deleteProfile: "Your profile and personal data",
  deleteHistory: "Your eco-activity history",
  deleteTeams: "Participation in teams and eco-communities",
  deleteStories: "Success stories and publications",
  deleteAchievements: "Achievements and awards",
  deleteConfirm: "Are you sure you want to proceed?",
  deleteForever: "Delete forever",
  deleteAccountModalTitle: "Account deletion",
  deleteAccountModalTitle: "Delete Account",
  accountDeletedTitle: "Account Deleted",
  deleteWarning: "You are about to delete your account. This action is irreversible.",
  willBeDeleted: "Will be deleted:",
  deleteProfile: "User profile",
  deleteHistory: "Activity history",
  deleteTeams: "Team participation",
  deleteAchievements: "Achievements and rewards",
  deleteSupportTickets: "Support tickets",
  deleteSettings: "Personal settings",
  typeEmailToConfirm: "To confirm, enter your email:",
  enterEmailPlaceholder: "Enter email to confirm",
  accountDeletedSuccess: "Account successfully deleted",
  accountDeletedDetails: "All your data has been deleted from the system",
  redirectingIn: "Redirecting in",
  seconds: "seconds",
  deleting: "Deleting...",
  goToHomePage: "Go to home page",
  cancel: "Cancel",
  deleteAccount: "Delete Account",
  emailDoesNotMatch: "Email does not match",
     // Настройки - поддержка
  supportTitle: "Support and help", 
  faqTitle: "FAQ / Frequently Asked Questions", 
  faqDesc: "Answers to popular user questions about working with the application", 
  contactSupport: "Contact support", 
  contactSupportDesc: "Send a message to the support team or report a problem", 
  aboutApp: "About the application", 
  aboutAppDesc: "Information about the version, developers and mission of EcoSteps", 
  shareStory: "Share a story", 
  shareStoryDesc: "Tell your eco-story and share it in the \"Stories\" section", 
  mySupportRequests: "My Requests",
  mySupportRequestsDesc: "Tracking the status of your questions",
  viewMyRequests: "View",
  writeToSupport: "Write to Support",
  contactSupport: "Contact Support",
  contactSupportDesc: "Ask a question or report a problem",
  supportSubject: "Subject",
  supportSubjectPlaceholder: "Briefly describe the topic",
  supportMessage: "Your message",
  supportMessagePlaceholder: "Describe your question or problem in detail...",
  supportMessageHint: "We will try to respond as soon as possible",
  sendMessage: "Send",
  supportRequestSent: "Question sent",
  supportWillRespond: "We will respond to you as soon as possible",
  statusPending: "Pending",
  statusAnswered: "Answered",
  statusClosed: "Closed",
  hasResponse: "Has response",
  noQuestionsTitle: "You have no requests yet",
  noQuestionsDescription: "Ask your first question to support",
  createFirstQuestion: "Ask question",
  askNewQuestion: "Ask new question",
  createdAt: "Created",
  answeredAt: "Answered",
  yourQuestion: "Your question",
  adminResponse: "Support response",
  errorLoadingQuestions: "Error loading questions",
  errorSendingRequest: "Error sending request",
  supportTitle: "Support",
  supportApp: "App Support",
  contactSupport: "Contact Support",
  contactSupportDesc: "Ask a question or report a problem",
  writeToSupport: "Write",
  faqTitle: "Frequently Asked Questions",
  faqDesc: "Answers to popular questions about the app",
  openFAQ: "Open FAQ",
  aboutApp: "About App",
  aboutAppDesc: "Learn more about EcoSteps app",
  mySupportRequests: "My Requests",
  mySupportRequestsDesc: "Tracking the status of your questions",
  viewMyRequests: "View",
  noSubject: "No subject",
  updated: "Updated",
  answeredAt: "Answered",
  refresh: "Refresh",
  close: "Close",
  loading: "Loading...",
  errorLoadingData: "Error loading data",
  dataLoadError: "Failed to load requests list",
  tryAgain: "Try again",
  noQuestionsTitle: "You have no requests yet",
  noQuestionsDescription: "Ask your first question to support",
  createFirstQuestion: "Ask a question",
  hasResponse: "Has response",
  askNewQuestion: "Ask new question",
  // FAQ
  faqTitle: "Frequently Asked Questions",
  faqDesc: "Answers to popular questions about the app",
  openFAQ: "Open FAQ",
  askQuestion: "Ask a question",
  
  // FAQ questions and answers
  faqQuestion1: "How is CO₂ savings calculated?",
  faqAnswer1: "The calculation is based on scientific data on emissions from various activities. For example, riding a bicycle instead of a car saves approximately 2.6 kg of CO₂ per 10 km.",
  
  faqQuestion2: "How to change my eco-level?",
  faqAnswer2: "Eco-level increases automatically when a certain amount of saved CO₂ is accumulated and eco-actions are performed.",
  
  faqQuestion3: "Can I delete success stories?",
  faqAnswer3: "Yes, you can delete your success stories in the 'My Stories' section of your personal account.",
  
  faqQuestion4: "How do teams work?",
  faqAnswer4: "Teams allow you to unite with like-minded people to achieve common eco-goals. You can create a team or join an existing one.",
  
  faqQuestion5: "Is my data safe?",
  faqAnswer5: "We use modern encryption methods and do not share your data with third parties. More details in the privacy policy.",
  // Support form
  supportSubject: "Subject",
  supportSubjectPlaceholder: "Briefly describe the topic of your question",
  supportMessage: "Your message",
  supportMessagePlaceholder: "Describe your question or problem in detail...",
  supportMessageHint: "We will try to respond as soon as possible",
  sendMessage: "Send",
  messageSent: "Message sent!",
  supportRequestSent: "Question sent to support",
  supportWillRespond: "We will review your question and respond as soon as possible",
  responseTime: "We usually respond within 24 hours",
  checkStatusInMyRequests: "You can track response status in My Requests section",
  windowWillClose: "Window will close automatically in 5 seconds...",
  //Истории
  reviewsPageTitle: "Success Stories",
  reviewsPageSubtitle: "Read and share your eco-stories",
  allStoriesTab: "All Stories",
  myStoriesTab: "My Stories",
  allStories: "All",
  bestStories: "Best",
  recentStories: "New",
  allStatuses: "All",
  statusPublished: "Published",
  statusPending: "Under review",
  categories: "Categories",
  allCategories: "All",
  createNewStory: "Write a story",
  createStoryTitle: "Write a story",
  storyTitle: "Title",
  storyTitlePlaceholder: "For example: How I started sorting waste",
  storyContent: "Content",
  category: "Category",
  carbonSaved: "CO₂ saved",
  carbonSavedHint: "Approximate amount of saved CO₂ in kilograms",
  cancel: "Cancel",
  createStory: "Create story",
  creatingStory: "Creating...",
  loadingStories: "Loading stories...",
  translatingStories: "Translating stories...",
  noStoriesTitle: "No stories yet",
  noMyStoriesDesc: "You don't have any stories yet. Write your first story!",
  noAllStoriesDesc: "There are no stories here yet. Be the first!",
  createFirstStory: "Write a story",
  collapseStory: "Collapse",
  expandStory: "Expand",
  storyCreatedSuccess: "Story successfully created! It will appear after moderator review.",
  storyDeletedSuccess: "Story successfully deleted",
  confirmDeleteStory: "Are you sure you want to delete this story?",
  deleteStory: "Delete story",
  showingStories: "Showing",
  ofTotal: "of",
  carbonSavedKg: "kg",
  carbonSaved: "CO₂ saved",
  showingAchievements: "Showing",
ofTotal: "of",
achievements: "achievements",
  // Leaderboard translations
  leaderboardTitle: "Leaderboard by CO₂ Saved",
  yourPosition: "Your Position",
  yourTeamPosition: "Your Team Position",
  usersTab: "Users",
  teamsTab: "Teams",
  rank: "Rank",
  user: "User",
  team: "Team",
  members: "Members",
  joinDate: "Join Date",
  createdDate: "Created Date",
  outOf: "of",
  showing: "Showing",
  of: "of",
  loading: "Loading...",
  //достижения
   // Заголовки и основные тексты
   titleAch: "Achievements",
   myAchievements: "My Achievements",
   allAchievements: "All Achievements",
   ecoCoins: "Eco-Coins",
   loading: "Loading achievements...",
   userNotFound: "User not found. Please log in.",
   loadError: "Failed to load achievements",
   
   // Статистика
   completed: "Completed",
   points: "Points",
   progress: "Progress",
   
   // Редкости достижений
   rarity: {
     common: "Common",
     rare: "Rare",
     epic: "Epic",
     legendary: "Legendary"
   },
   
   // Статусы достижений
   inProgress: "In Progress",
   completed: "Completed",
   claimed: "Claimed",
   claimReward: "Claim Reward",
   youWillReceive:"You will receive",
   getReward:"Get reward",
   // Модальное окно
   confirmClaim: "Confirm Reward",
   reward: "Reward",
   confirmClaimText: "Are you sure you want to claim this reward?",
   
   // Сообщения
   rewardClaimed: "Reward successfully claimed!",
   claimError: "Failed to claim reward",
   
   // Пустые состояния
   noAchievements: "No achievements found",
   noAchievementsHint: "Complete tasks to unlock achievements",
   
   // Категории (если будут добавлены позже)
   allCategories: "All Categories",
   daily: "Daily",
   steps: "Steps",
   eco: "Eco Actions",
   social: "Social",
   challenge: "Challenges",
   collection: "Collections",
  // Question statuses
  statusPending: "Pending",
  statusAnswered: "Answered",
  statusClosed: "Closed",
  
  // Support notifications
  noQuestionsTitle: "You have no requests yet",
  noQuestionsDescription: "Ask your first question to support",
  createFirstQuestion: "Ask a question",
  errorLoadingQuestions: "Error loading questions",
  errorSendingRequest: "Error sending request",
  hasResponse: "Has response",
  askNewQuestion: "Ask new question",
  
  // Question details
  yourQuestion: "Your question",
  adminResponse: "Support response",
  createdAt: "Created",
  answeredAt: "Answered",
  // Модальные окна
  logoutModalTitle: "Log out of the system",
  logoutConfirm: "Are you sure you want to log out of the system?", 
  logoutWarning: "All unsaved data will be lost.", 
  deleteAccountModalTitle: "Delete account", 
  deleteWarning: "Attention! This action cannot be undone.", 
  deleteWillRemove: "The following will be permanently deleted:", 
  deleteProfile: "Your profile and all personal data", 
  deleteHistory: "Activity history and statistics", 
  deleteTeams: "Participation in teams", 
  deleteStories: "All your success stories", 
  deleteAchievements: "Achievements and progress", 
  deleteConfirm: "Do you really want to delete your account forever?",
  resetPasswordModalTitle: "Password reset", 
  resetPasswordInfo: "We will send a password reset link to your email:", 
  resetPasswordSpam: "Check the \"Spam\" folder if the email does not arrive within a few minutes.", 

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
    readPolicy: "Read policy", 
    readTerms: "Read terms", 
    writeToSupport: "Write to support", 
    openFAQ: "Open FAQ", 
    tellStory: "Tell a story", 
    sendLink: "Send link", 
    clearCacheBtn: "Clear cache", 
    exportDataBtn: "Export data", 
    logoutBtn: "Log out of the system", 
    deleteAccountBtn: "Delete account", 
    deleteForever: "Delete forever" ,
      // Eco-levels
  ecoHero: "Eco Hero",
  ecoMaster: "Eco Master", 
  ecoActivist: "Eco Activist",
  ecoEnthusiast: "Eco Enthusiast",
  ecoStarter: "Eco Starter",
  ecoNovice: "Eco Novice",
  
  // Admin panel - Stories/Reviews management
  manageReviews: 'Manage Stories',
  totalStories: 'Total Stories',
  storiesByCategory: 'Stories by Category',
  searchStoriesPlaceholder: 'Search by title or author...',
  allCategories: 'All Categories',
  pendingReview: 'Pending Review',
  draft: 'Draft',
  title: 'Title',
  author: 'Author',
  category: 'Category',
  carbonSaved: 'CO₂ Saved',
  previewStory: 'Preview Story',
  publishStory: 'Publish',
  rejectStory: 'Reject',
  unpublishStory: 'Unpublish',
  moveToDraft: 'Move to Draft',
  storyPreview: 'Story Preview',
  likes: 'likes',
  confirmPublish: 'Publish story?',
  confirmPublishMessage: 'Publish story "{title}" by {author}?',
  confirmReject: 'Reject story?',
  confirmRejectMessage: 'Reject story "{title}" by {author}?',
  confirmUnpublish: 'Unpublish story?',
  confirmUnpublishMessage: 'Unpublish story "{title}" by {author}? The story will be moved to drafts.',
  storyPublished: 'Story published',
  storyRejected: 'Story rejected',
  storyUnpublished: 'Story unpublished',
  noStoriesFound: 'No stories found',
  noStoriesInSystem: 'No stories in system',
  showAllStories: 'Show all stories',
  loadingStories: 'Loading stories...',

  // Admin panel - Support management
  viewResponse: 'View',
  respondToTicket: 'Respond',
  editResponse: 'Edit Response',
  ticketNumber: 'Ticket Number',
  userMessage: 'User Message',
  yourResponse: 'Your Response',
  responsePlaceholder: 'Enter your response to the user...',
  responseRequired: 'Enter response',
  responseTooLong: 'Response too long (max 2000 characters)',
  sendResponse: 'Send',
  updateResponse: 'Update',
  responseSent: 'Response sent',
  responseSentToUser: 'Response sent to user {username}',
  confirmCloseTicket: 'Close ticket?',
  confirmCloseTicketMessage: 'Are you sure you want to close ticket {ticketNumber}?',
  closeTicket: 'Close ticket',
  ticketClosed: 'Ticket closed',
  ticketClosedSuccess: 'Ticket {ticketNumber} closed',
  
  // Statistics page
  statsTotalSaved: "CO₂ Saved",
  statsKg: "kg",
  statsTons: "t",
  statsKm: "km",
  statsKWh: "kWh",
  statsM3: "m³",
  statsL: "l",
  statsServings: "servings",
  statsPercent: "%",
  statsAllTime: "Compared to world average",
  statsMonthSaved: "This month",
  statsLast30Days: "Last 30 days",
  statsLevel: "Level",
  statsToNext: "To",
  statsMaxLevel: "Maximum level!",
  statsChartTitle: "Carbon Footprint Dynamics",
  statsPeriodWeek: "Week",
  statsPeriodMonth: "Month",
  statsPeriodYear: "Year",
  statsBarChartTitle: "Carbon Footprint by Days",
  statsPieChartTitle: "Distribution by Categories",
  statsNoData: "No data",
  statsCalculatorTitle: "Carbon Footprint Calculator",
  statsCalculatorHint: "💡 Enter your consumption for the specified period (day/week/month) for each category",
  statsReset: "Reset",
  statsCarKm: "Car (km per day)",
  statsBusKm: "Bus (km per day)",
  statsPlaneKm: "Plane (km per month)",
  statsTrainKm: "Train (km per day)",
  statsHousing: "Housing",
  statsElectricity: "Electricity (kWh per month)",
  statsHeating: "Heating (kWh per month)",
  statsWater: "Water (m³ per month)",
  statsGas: "Gas (m³ per month)",
  statsMeat: "Meat and fish (kg per week)",
  statsVegetables: "Vegetables and fruits (kg per week)",
  statsProcessedFood: "Processed food (servings per week)",
  statsLocalFood: "Local food (%)",
  statsDairy: "Dairy products (l per week)",
  statsWaste: "Waste",
  statsRecycling: "Waste recycling (%)",
  statsCompost: "Composting (%)",
  statsPlastic: "Plastic (kg per month)",
  statsCalculating: "Calculating...",
  statsCalculateButton: "Calculate carbon footprint",
  statsResults: "Calculation results",
  statsTotalFootprint: "Your carbon footprint",
  statsSaved: "Saved",
  statsPerDay: "per day",
  statsHistory: "Calculation history",
  statsNoHistory: "Calculation history is empty",
  statsFirstCalculation: "Make first calculation",
  statsSubtitle: "Track your carbon footprint and progress",
  
  // Eco levels
  ecoLevelNovice: "Eco Novice",
  ecoLevelStarter: "Eco Starter",
  ecoLevelEnthusiast: "Eco Enthusiast",
  ecoLevelActivist: "Eco Activist",
  ecoLevelMaster: "Eco Master",
  ecoLevelHero: "Eco Hero",
  
  // Profile Page
  profileNotFound: "Profile not found",
  friends: "Friends",
  posts: "Posts",
  teams: "Teams",
  treesPlanted: "Trees planted",
  carbonSaved: "CO₂ saved",
  bio: "Bio",
  goal: "Goal",
  dateOfBirth: "Date of birth",
  day: "Day",
  month: "Month",
  year: "Year",
  invalidDateFormat: "Invalid format. Use DD/MM/YYYY",
  invalidMonth: "Month must be between 1 and 12",
  invalidDay: "Day must be between 1 and 31",
  invalidYear: "Year must be between 1900 and current year",
  invalidDate: "This date does not exist",
  ageRestriction: "You must be at least 18 years old",
  error: "Error",
  errorSavingProfile: "Error saving profile",
  ok: "OK",
  january: "January",
  february: "February",
  march: "March",
  april: "April",
  may: "May",
  june: "June",
  july: "July",
  august: "August",
  september: "September",
  october: "October",
  november: "November",
  december: "December",
  edit: "Edit",
  save: "Save",
  bioPlaceholder: "Tell about yourself...",
  goalPlaceholder: "Your ecological goal...",
  whatsOnYourMind: "What's on your mind?",
  publish: "Publish",
  noPosts: "No posts yet",
  confirmDeletePost: "Delete post?",
  confirmDeletePostMessage: "Are you sure you want to delete this post?",
  confirmDeleteComment: "Delete comment?",
  confirmDeleteCommentMessage: "Are you sure you want to delete this comment?",
  addComment: "Add comment...",
  publicProfile: "Public profile",
  publicProfileHint: "If enabled, all users will be able to see your profile",
  viewFriends: "View friends",
  friendsList: "Friends list",
  noFriends: "No friends yet",
  viewProfile: "View profile",
  backToMyProfile: "Back to my profile",
  
  // Friendship
  addFriend: "Add friend",
  friendRequestSent: "Request sent",
  acceptFriendRequest: "Accept request",
  rejectFriendRequest: "Reject",
  removeFriend: "Remove friend",
  confirmRemoveFriend: "Are you sure you want to remove from friends",
  
  // Report user
  reportUser: "Report",
  reportModalTitle: "Report user",
  reportReason: "Reason",
  reportReasonPlaceholder: "Specify the reason for the complaint",
  selectReason: "Select reason",
  reportReasonSpam: "Spam",
  reportReasonHarassment: "Harassment",
  reportReasonInappropriate: "Inappropriate content",
  reportReasonOther: "Other",
  reportDescription: "Description",
  reportDescriptionPlaceholder: "Describe the problem in detail...",
  screenshots: "Screenshots",
  maxScreenshots: "Maximum 5 screenshots",
  addScreenshots: "Add screenshots",
  submitReport: "Submit report",
  reportSent: "Report sent",
  fillAllFields: "Fill all fields",
  
  // Change password
  changePassword: "Change password",
  changePasswordModalTitle: "Change password",
  currentPassword: "Current password",
  newPassword: "New password",
  confirmPassword: "Confirm password",
  passwordsDoNotMatch: "Passwords do not match",
  passwordChanged: "Password changed",
  resetPasswordTitle: "Reset password",
  resetPasswordDesc: "We will send a password reset link to your email:",
  checkSpamFolder: "Check your spam folder if you don't receive the email within a few minutes.",
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
    authModalTitle: 'Патрабуецца рэгістрацыя',
    authModalText: 'Каб ставіць лайкі гісторыям, неабходна ўвайсці ў сістэму.',
    authModalCancel: 'Застацца тут',
    authModalLogin: 'Увайсці ў сістэму',
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
    //Истории
    reviewsPageTitle: "Гісторыі поспеху",
    reviewsPageSubtitle: "Чытайце і дзяліцеся сваімі эка-гісторыямі",
    allStoriesTab: "Усе гісторыі",
    myStoriesTab: "Мае гісторыі",
    allStories: "Усе",
    bestStories: "Лепшыя",
    recentStories: "Новыя",
    allStatuses: "Усе",
    statusPublished: "Апублікавана",
    statusPending: "На праверцы",
    categories: "Катэгорыі",
    allCategories: "Усе",
    createNewStory: "Напісаць гісторыю",
    createStoryTitle: "Напісаць гісторыю",
    storyTitle: "Загаловак",
    storyTitlePlaceholder: "Напрыклад: Як я пачаў сартаваць смецце",
    storyContent: "Змест",
    category: "Катэгорыя",
    carbonSaved: "Захавана CO₂",
    carbonSavedHint: "Прыблізная колькасць захаванага CO₂ у кілаграмах",
    cancel: "Адмена",
    createStory: "Стварыць гісторыю",
    creatingStory: "Стварэнне...",
    loadingStories: "Загрузка гісторый...",
    translatingStories: "Пераклад гісторый...",
    noStoriesTitle: "Пакуль няма гісторый",
    noMyStoriesDesc: "У вас яшчэ няма гісторый. Напішыце сваю першую гісторыю!",
    noAllStoriesDesc: "Тут пакуль няма гісторый. Будзьце першым!",
    createFirstStory: "Напісаць гісторыю",
    collapseStory: "Згарнуць",
    expandStory: "Разгарнуць",
    storyCreatedSuccess: "Гісторыя паспяхова створана! Яна з'явіцца пасля праверкі мадэратарам.",
    storyDeletedSuccess: "Гісторыя паспяхова выдалена",
    confirmDeleteStory: "Вы ўпэўнены, што хочаце выдаліць гэтую гісторыю?",
    deleteStory: "Выдаліць гісторыю",
    showingStories: "Паказана",
    ofTotal: "з",
    carbonSavedKg: "кг",
    carbonSaved: "CO₂ захавана",
    
    // Переводы для рейтинга (Leaderboard)
    leaderboardTitle: "Рэйтынг па зэканомленым CO₂",
    yourPosition: "Ваша пазіцыя",
    yourTeamPosition: "Пазіцыя вашай каманды",
    usersTab: "Карыстальнікі",
    teamsTab: "Каманды",
    rank: "Месца",
    user: "Карыстальнік",
    team: "Каманда",
    members: "Удзельнікі",
    joinDate: "Дата рэгістрацыі",
    createdDate: "Дата стварэння",
    outOf: "з",
    showing: "Паказана",
    of: "з",
    loading: "Загрузка...",
    
    // Admin panel translations
    adminPanel: "Панэль адміністратара",
    adminTabUsers: "Карыстальнікі",
    adminTabFunds: "Фонды",
    adminTabAchievements: "Дасягненні",
    adminTabReports: "Скаргі",
    adminTabReviews: "Гісторыі",
    adminTabSupport: "Падтрымка",
    manageReviews: "Кіраванне гісторыямі",
    totalStories: "Усяго гісторый",
    published: "Апублікаваныя",
    pendingReview: "На праверцы",
    draft: "Чарнавік",
    storiesByCategory: "Гісторыі па катэгорыях",
    searchStoriesPlaceholder: "Пошук па загалоўку або аўтару...",
    allCategories: "Усе катэгорыі",
    title: "Загаловак",
    author: "Аўтар",
    category: "Катэгорыя",
    carbonSaved: "CO₂ захавана",
    createdAt: "Дата",
    previewStory: "Прагледзець гісторыю",
    publishStory: "Апублікаваць",
    rejectStory: "Адхіліць",
    unpublishStory: "Зняць з публікацыі",
    confirmPublish: "Апублікаваць гісторыю?",
    confirmPublishMessage: "Апублікаваць гісторыю \"{title}\" ад {author}?",
    confirmReject: "Адхіліць гісторыю?",
    confirmRejectMessage: "Адхіліць гісторыю \"{title}\" ад {author}?",
    confirmUnpublish: "Зняць з публікацыі?",
    confirmUnpublishMessage: "Зняць з публікацыі гісторыю \"{title}\" ад {author}? Гісторыя будзе перамешчана ў чарнавікі.",
    storyPublished: "Гісторыя апублікавана",
    storyRejected: "Гісторыя адхілена",
    storyUnpublished: "Гісторыя знята з публікацыі",
    storyPreview: "Папярэдні прагляд гісторыі",
    close: "Зачыніць",
    likes: "лайкаў",
    loadingStories: "Загрузка гісторый...",
    noStoriesFound: "Гісторыі не знойдзены",
    noStoriesInSystem: "Няма гісторый у сістэме",
    showAllStories: "Паказаць усе гісторыі",
    
    // Category translations
    categoryNature: "Прырода",
    categoryHousehold: "Быт",
    categoryPlanning: "Планаванне",
    cancel: "Адмяніць",
    createStory: "Стварыць гісторыю",
    creatingStory: "Стварэнне...",
    loadingStories: "Загрузка гісторый...",
    translatingStories: "Пераклад гісторый...",
    noStoriesTitle: "Пакуль няма гісторый",
    noMyStoriesDesc: "У вас яшчэ няма гісторый. Напішыце сваю першую гісторыю!",
    noAllStoriesDesc: "Тут пакуль няма гісторый. Будзьце першымі!",
    createFirstStory: "Напісаць гісторыю",
    collapseStory: "Згарнуць",
    expandStory: "Разгарнуць",
    storyCreatedSuccess: "Гісторыя паспяхова створана! Яна з'явіцца пасля праверкі мадэратарам.",
    storyDeletedSuccess: "Гісторыя паспяхова выдалена",
    confirmDeleteStory: "Вы ўпэўненыя, што хочаце выдаліць гэтую гісторыю?",
    deleteStory: "Выдаліць гісторыю",
    showingStories: "Паказана",
    ofTotal: "з",
    carbonSavedKg: "кг",
    showingAchievements: "Паказана",
    ofTotal: "з",
    achievements: "дасягненняў",
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
       //ПАНЕЛЬ АДМИНА
       adminPanel: 'Панэль адміністратара',
  adminUsers: 'Карыстальнікі',
  adminFunds: 'Фонды',
  adminAchievements: 'Дасягненні',
  adminStatistics: 'Статыстыка',
  adminComplaints: 'Скаргі',
  adminReviews: 'Водгукі',
  adminUsersManagement: 'Кіраванне карыстальнікамі',
  adminFundsManagement: 'Кіраванне фондамі',
  adminAchievementsManagement: 'Кіраванне дасягненнямі',
  adminPlatformStatistics: 'Статыстыка платформы',
  adminUserComplaints: 'Скаргі карыстальнікаў',
  adminUserReviews: 'Водгукі карыстальнікаў',
  adminUsersListPlaceholder: 'Спіс карыстальнікаў будзе тут',
  adminFundsListPlaceholder: 'Кіраванне фондамі будзе тут',
  adminAchievementsListPlaceholder: 'Кіраванне дасягненнямі будзе тут',
  adminStatisticsPlaceholder: 'Статыстыка будзе тут',
  adminComplaintsListPlaceholder: 'Спіс скарг будзе тут',
  adminReviewsListPlaceh2older: 'Спіс водгукаў будзе тут',
  adminPanel: 'Панэль адміністратара',
  adminUsers: 'Карыстальнікі',
  adminFunds: 'Фонды',
  adminAchievements: 'Дасягненні',
  adminStatistics: 'Статыстыка',
  adminComplaints: 'Скаргі',
  adminReviews: 'Водгукі',
  adminUsersManagement: 'Кіраванне карыстальнікамі',
  adminFundsManagement: 'Кіраванне фондамі',
  adminAchievementsManagement: 'Кіраванне дасягненнямі',
  adminPlatformStatistics: 'Статыстыка платформы',
  adminUserComplaints: 'Скаргі карыстальнікаў',
  adminUserReviews: 'Водгукі карыстальнікаў',
  adminUsersListPlaceholder: 'Спіс карыстальнікаў будзе тут',
  adminFundsListPlaceholder: 'Кіраванне фондамі будзе тут',
  adminAchievementsListPlaceholder: 'Кіраванне дасягненнямі будзе тут',
  adminStatisticsPlaceholder: 'Статыстыка будзе тут',
  adminComplaintsListPlaceholder: 'Спіс скарг будзе тут',
  adminReviewsListPlaceholder: 'Спіс водгукаў будзе тут',
  adminPanel: "Панэль адміністратара",
manageUsers: "Кіраванне карыстальнікамі",
manageFunds: "Кіраванне фондамі",
manageAchievements: "Кіраванне дасягненнямі",
manageReports: "Кіраванне скаргамі",
manageReviews: "Кіраванне водзывамі",
adminTabUsers: "Карыстальнікі",
adminTabFunds: "Фонды",
adminTabAchievements: "Дасягненні",
adminTabReports: "Скаргі",
adminTabReviews: "Водзывы",
checkingPermissions: "Праверка правоў доступу...",
accessDenied: "Доступ забаронены",
noAdminRights: "У вас няма правоў адміністратара",
goHome: "На галоўную",
refresh: "Абнавіць",
totalUsers: "Усяго карыстальнікаў",
totalAdmins: "Адміністратараў",
totalBanned: "Забананых",
searchPlaceholder: "Пошук па email або нікнейму...",
allRoles: "Усе ролі",
adminsA: "Адміністратары",
users: "Карыстальнікі",
allStatuses: "Усе статусы",
adminTabSupport: "Падтрымка",
pending: "Чакаюць",
answered: "Адказаныя",
closed: "Зачыненыя",
allStatuses: "Усе статусы",
noUsersInSystem: "У сістэме пакуль няма карыстальнікаў.",
banned: "Забанeныя", 
active: "Актыўныя",
showing: "Паказана",
of: "з",
filtered: "адфільтравана",
loadingUsers: "Загрузка карыстальнікаў...",
error: "Памылка",
tryAgain: "Паспрабаваць зноў",
noUsersFound: "Карыстальнікі не знойдзены",
changeSearchParams: "Змяніце параметры пошуку",
allUsersFromDB: "Усе карыстальнікі з БД",
allAdminsFromDB: "Усе адміністратары з БД",
allBannedFromDB: "Усе забананыя з БД",
clearFilters: "Скінуць фільтры",
showAllUsers: "Паказаць усіх карыстальнікаў",
ID: "ID",
Email: "Email",
nickname: "Нікнейм",
registrationDate: "Дата рэгістрацыі",
ecoLevel: "Эка-ўзровень",
CO2: "CO₂",
status: "Статус",
actions: "Дзеянні",
noNickname: "Без нікнейму",
banned: "Забанены",
admin: "Адмін",
active: "Актыўны",
removeAdminRights: "Пазбавіць правоў адміністратара",
makeAdmin: "Зрабіць адміністратарам",
unbanUser: "Разбаніць карыстальніка",
banUser: "Забаніць карыстальніка",
cannot: "Немагчыма",
cannotBanAdmin: "Нельга заблакіраваць адміністратара",
cannotBanSelf: "Нельга заблакіраваць самога сябе",
user: "Карыстальнік",
banReason: "Прычына блакіроўкі",
banDuration: "Працягласць блакіроўкі",
cancel: "Адмена",
ban: "Заблакіраваць",
confirmUnban: "Разбаніць карыстальніка?",
confirmUnbanMessage: "Вы ўпэўнены, што хочаце разбаніць карыстальніка {username}?",
userUnbanned: "Карыстальнік разбанены",
userUnbannedSuccess: "Карыстальнік {username} быў разбанены",
confirmMakeAdmin: "Зрабіць адміністратарам?",
confirmMakeAdminMessage: "Зрабіць карыстальніка {username} адміністратарам?",
makeAdminSuccess: "Карыстальнік {username} зроблены адміністратарам",
confirmRemoveAdmin: "Пазбавіць правоў адміністратара?",
confirmRemoveAdminMessage: "Пазбавіць правоў адміністратара ў карыстальніка {username}?",
removeAdminSuccess: "Карыстальнік {username} пазбаўлены правоў адміністратара",
success: "Паспяхова",
operationFailed: "Аперацыя не выканана",
networkErrorTitle: "Памылка сеткі",
networkError: "Памылка сеткі",
confirm: "Пацвердзіць",
ok: "OK",
specifyReason: "Пазначце прычыну",
userBanned: "Карыстальнік забанены",
userBannedSuccess: "Карыстальнік {username} быў забанены",
banReasonSpam: "Спам або рэклама",
banReasonHarassment: "Абраза або траўля",
banReasonFakeNews: "Распаўсюджванне фэйкавых навін",
banReasonCheating: "Чыцерства або накрутка",
banReasonInappropriate: "Недарэчны кантэнт",
banReasonMultipleAccounts: "Стварэнне шматлікіх акаунтаў",
banReasonOther: "Іншая прычына",
banDuration1h: "1 гадзіна",
banDuration24h: "24 гадзіны",
banDuration3d: "3 дні",
banDuration7d: "7 дзён",
banDuration30d: "30 дзён",
banDurationPermanent: "Назаўсёды",
authRequired: "Патрабуецца аўтарызацыя",
errorLoadingUsers: "Памылка загрузкі карыстальнікаў",
fundsComingSoon: "Тут будзе кіраванне экалагічнымі фондамі і іх фінансаваннем",
achievementsComingSoon: "Тут будзе кіраванне дасягненнямі карыстальнікаў і ўзнагародамі",
reportsComingSoon: "Тут будуць скаргі карыстальнікаў і мадэрацыя кантэнту",
reviewsComingSoon: "Тут будуць водзывы карыстальнікаў аб платформе",
ecoLevel: "Эка-ўзровень",
ecoNovice: "Эка-навічок",
ecoEnthusiast: "Эка-аматар",
ecoActivist: "Эка-энтузіяст",
ecoMaster: "Эка-майстар",
ecoLegend: "Эка-легенда",
carbonUnit: "кг",
banUser2: "Заблакіраваць карыстальніка",
user: "Карыстальнік",
banReason: "Прычына блакіроўкі",
banReasonPlaceholder: "Апішыце прычыну блакіроўкі...",
banDuration: "Працягласць блакіроўкі",
banDuration1h: "1 гадзіна",
banDuration24h: "24 гадзіны",
banDuration7d: "7 дзён",
banDuration14d: "14 дзён",
banDuration30d: "30 дзён",
banDurationPermanent: "Назаўсёды",
specifyReason: "Пазначце прычыну бана",
reasonTooLong: "Прычына занадта доўгая (макс. 500 знакаў)",
characters: "знакаў",
previousBans: "Папярэднія баны",
banInfoPermanent: "Вечная блакіроўка (4 і больш парушэнняў)",
banInfoPermanentDesc: "Карыстальнік будзе заблакаваны назаўсёды",
banInfoPermanentManual: "Вечная блакіроўка",
banInfoPermanentManualDesc: "Карыстальнік будзе заблакаваны назаўсёды",
banInfoTemporary: "Часовая блакіроўка (парушэнне №{count})",
permanent: "Назаўсёды",
nextBanPermanent: "Наступны бан будзе вечным",
cancel: "Адмена",
ban: "Заблакіраваць",
confirm: "Пацвердзіць",
ok: "OK",
userBanned: "Карыстальнік заблакаваны",
userPermanentlyBanned: "Карыстальнік {username} заблакаваны назаўсёды ({count} парушэнняў)",
userPermanentlyBannedManual: "Карыстальнік {username} заблакаваны назаўсёды",
userBannedSuccess: "Карыстальнік {username} быў заблакаваны на {duration}",
userUnbanned: "Карыстальнік разблакаваны",
userUnbannedSuccess: "Карыстальнік {username} быў разблакаваны",
makeAdminSuccess: "Карыстальнік {username} прызначаны адміністратарам",
removeAdminSuccess: "Карыстальнік {username} пазбаўлены правоў адміністратара",
cannot: "Немагчыма",
cannotBanAdmin: "Нельга заблакіраваць адміністратара",
cannotBanSelf: "Нельга заблакіраваць сябе",
error: "Памылка",
networkError: "Памылка сеткі",
networkErrorTitle: "Памылка сеткі",
operationFailed: "Аперацыя не выканана",
success: "Паспяхова",
checkingPermissions: "Праверка правоў доступу...",
accessDenied: "Доступ забаронены",
noAdminRights: "У вас няма правоў доступу да адмін-панэлі",
goHome: "На галоўную",
tryAgain: "Паспрабаваць зноў",
authRequired: "Патрабуецца аўтарызацыя",
errorLoadingUsers: "Памылка загрузкі карыстальнікаў",
bansCount: "Баны",
banPermanent: "Блакіроўка назаўсёды",
userAlreadyPermanentlyBannedTitle: "Карыстальнік ужо заблакіраваны назаўсёды",
userAlreadyPermanentlyBannedSubtitle: "(парушэнняў: {{count}})",
userAlreadyPermanentlyBanned: "Карыстальнік {{username}} ужо заблакіраваны назаўсёды",
userAlreadyBanned: "Карыстальнік {{username}} ужо заблакіраваны",
cannotBanAlreadyBanned: "Нельга заблакіраваць ужо заблакіраванага карыстальніка",
violationNumber: "Парушэнне № {number}",
automaticPermanentBan: "Аўтаматычная вечная блакіроўка (4 і больш парушэнняў)",
totalTickets: "Усяго зваротаў",
pendingTickets: "Чакаюць адказу",
answeredTickets: "Адказаныя",
manageSupportTickets: "Кіраванне зваротамі",
searchSupportPlaceholder: "Пошук па тэме ці email...",
ticketNumber: "№ звароту",
subject: "Тэма",
userMessage: "Паведамленне карыстальніка",
yourResponse: "Ваш адказ",
responsePlaceholder: "Увядзіце ваш адказ карыстальніку...", 
respondToTicket: "Адказаць на зварот",
confirmCloseTicket: "Зачыніць зварот?",
confirmCloseTicketMessage: "Вы ўпэўнены, што хочаце зачыніць зварот {ticketNumber}?",
closeTicket: "Закрыць зварот",
ticketClosed: "Зварот закрыты",
ticketClosedSuccess: "Зварот {ticketNumber} закрыты",
editResponse: "Рэдагаваць адказ",
  // Кіраванне карыстальнікамі
  totalUsers: 'Усяго карыстальнікаў',
  admins: 'Адміністратараў',
  bannedUsers: 'Забанавана',
  searchUsersPlaceholder: 'Пошук па email або ніку...',
  email: 'Email',
  nickname: 'Нікнейм',
  registrationDate: 'Дата рэгістрацыі',
  ecoLevel: 'Эка-ўзровень',
  carbonSaved: 'Зэканомлена CO₂',
  emailVerified: 'Пошта',
  status: 'Статус',
  actions: 'Дзеянні',
  verified: 'Так',
  notVerified: 'Не',
  admin: 'Адмін',
  active: 'Актыўны',
  banned: 'Забанаваны',
  confirmDeleteTitle: "Выдаліць гісторыю?",
  confirmDeleteMessage: "Вы ўпэўнены, што хочаце выдаліць гэтую гісторыю? Гэта дзеянне нельга адмяніць.",
  cancel: "Адмена",
  delete: "Выдаліць",
  storyCreatedSuccess: "Гісторыя паспяхова створана!",
  storyCreatedDesc: "Яна з'явіцца пасля праверкі мадэратарам.",
  storyDeletedSuccess: "Гісторыя паспяхова выдалена",
  storyDeletedDesc: "Гісторыя была выдалена з вашага профілю.",
  // Экалагічныя ўзроўні
  ecoBeginner: 'Эка-пачатковец',
  ecoAmateur: 'Эка-аматар',
  ecoEnthusiast: 'Эка-энтузіяст',
  ecoMaster: 'Эка-майстар',
  ecoLegend: 'Эка-легенда',
  //достижения
  allAchievements: 'Усе дасягненні',
  completed: 'Завершаны',
  progress: 'Прагрэс',
  visibleHint: 'бачных',
  fromAll: 'ад усіх',
  visibleAchievements: 'дасягненняў',
  days: 'дзён',
  showingAchievements: 'Паказана',
  ofTotal: 'з',
  // Падказкі
  makeAdminTooltip: 'Назначыць адміністратарам',
  removeAdminTooltip: 'Пазбавіць правоў адміністратара',
  banTooltip: 'Забанаваць карыстальніка',
  unbanTooltip: 'Разбанаваць карыстальніка',
  emailVerified: 'Пошта пацверджана',
  //достижения
   // Заголовки и основные тексты
   titleAch: "Дасягненні",
   myAchievements: "Мае дасягненні",
   allAchievements: "Усе дасягненні",
   ecoCoins: "Эка-манеты",
   loading: "Загрузка дасягненняў...",
   userNotFound: "Карыстальнік не знойдзены. Калі ласка, увайдзіце ў сістэму.",
   loadError: "Не атрымалася загрузіць дасягненні",
   
   // Статистика
   completed: "Выканана",
   points: "Ачкі",
   progress: "Прагрэс",
   
   // Редкости достижений
   rarity: {
     common: "Звычайны",
     rare: "Рэдкі",
     epic: "Эпічны",
     legendary: "Легендарны"
   },
   
   // Статусы достижений
   inProgress: "У працэсе",
   completed: "Завершана",
   claimed: "Атрымана",
   claimReward: "Атрымаць узнагароду",
   
   // Модальное окно
   confirmClaim: "Пацвярджэнне узнагароды",
   reward: "Узнагарода",
   confirmClaimText: "Вы ўпэўнены, што хочаце атрымаць гэтую ўзнагароду?",
   
   // Сообщения
   rewardClaimed: "Узнагарода паспяхова атрымана!",
   claimError: "Не атрымалася атрымаць узнагароду",
   
   // Пустые состояния
   noAchievements: "Дасягненні не знойдзены",
   noAchievementsHint: "Выконвайце заданні, каб адкрыць дасягненні",
   
   // Категории (если будут добавлены позже)
   allCategories: "Усе катэгорыі",
   daily: "Штодзённыя",
   steps: "Крокі",
   eco: "Эка-дзеянні",
   social: "Сацыяльныя",
   challenge: "Выпрабаванні",
   collection: "Калекцыі",
  // Пацверджанні
  confirmMakeAdmin: 'Назначыць карыстальніка адміністратарам?',
  confirmRemoveAdmin: 'Пазбавіць правоў адміністратара ў карыстальніка?',
  confirmBan: 'Забанаваць карыстальніка?',
  confirmUnban: 'Разбанаваць карыстальніка?',
  
  // Паведамленні аб поспеху
  userMadeAdminSuccess: 'Карыстальнік назначаны адміністратарам',
  userRemovedAdminSuccess: 'Карыстальнік пазбаўлены правоў адміністратара',
  userBannedSuccess: 'Карыстальнік забанаваны',
  userUnbannedSuccess: 'Карыстальнік разбанаваны',
  youWillReceive:"Вы атрымаеце",
  getReward:"Атрымаць узнагароду",
  // Памылкі
  errorLoadingUsers: 'Памылка загрузкі карыстальнікаў',
  networkError: 'Памылка сеткі. Праверце падключэнне.',
  operationFailed: 'Аперацыя не выканана',
  accessDenied: 'Доступ забаронены. Патрабуюцца правы адміністратара.',
  error: 'Памылка',
  tryAgain: 'Паспрабаваць зноў',
  loading: 'Загрузка...',
  
  // Пустыя станы
  noUsersFound: 'Карыстальнікі не знойдзены',
  noUsersDescription: 'Змяніце параметры пошуку або паспрабуйце пазней.',
  
  // Пагінацыя
  page: 'Старонка',
  of: 'з',
  menuAdmin: "Упраўленне",
    // Настройки - аккаунт
    accountManagement: "Кіраванне акаўнтам",
    clearCache: "Ачыстка кэшу",
    clearCacheDesc: "Ачысціць часовыя файлы, дадзеныя прыкладання і кэш браўзера для паляпшэння прадукцыйнасці",
    logout: "Выхад з сістэмы",
    logoutDesc: "Завяршыць бягучую сесію і выйсці з акаўнта",
    deleteAccount: "Выдаленне акаўнта",
    deleteAccountDesc: "Бесвяротна выдаліць акаўнт і ўсе звязаныя дадзеныя. Гэтае дзеянне нельга адмяніць!",
    clearCacheTitle: "Ачыстка кэша",
    clearCacheConfirmation: "Вы ўпэўнены, што жадаеце ачысціць кэш?",
    clearCacheWillBeDeleted: "Будуць выдалены:",
    clearCacheTempFiles: "Часовыя файлы прыкладання",
    clearCacheCachedData: "Кэшаваныя дадзеныя",
    clearCacheSessionData: "Дадзеныя сесіі",
    clearCacheBrowserCache: "Кэш браўзера",
    clearCacheNote: "Вашы налады і дадзеныя акаўнта захаваюцца.",
    clearCacheButton: "Ачысціць кэш",
    cacheClearedSuccess: "Кэш паспяхова ачышчаны!",
    cacheClearedDetails: "Часовыя файлы і кэшаваныя дадзеныя былі выдалены.",
    cacheClearError: "Памылка пры ачыстцы кэша",
    notificationSuccess: "Паспяхова",
    notificationError: "Памылка",
    notificationInfo: "Інфармацыя",
    deleteSupportTickets: "Усе звароты ў падтрымку",
    deleteSettings: "Асабістыя налады",
    deleteFinalWarning: "Гэта дзеянне незваротнае!",
    deleteCannotBeUndone: "Пасля выдалення аднавіць дадзеныя будзе немагчыма.",
    typeEmailToConfirm: "Для пацверджання ўвядзіце ваш email:",
    emailConfirmationNote: "Пераканайцеся, што гэта менавіта той email, які вы хочаце выдаліць.",
    accountDeletedSuccess: "Акаўнт выдалены",
    accountDeletedDetails: "Ваш акаўнт і ўсе звязаныя дадзеныя былі паспяхова выдалены.",
    deleteAccountError: "Памылка пры выдаленні акаўнта",
    deleteWarning: "УВАГА: Выдаленне акаўнта",
    deleteWillRemove: "Выдаленне акаўнта прывядзе да выдалення:",
    deleteProfile: "Вашага профілю і асабістых дадзеных",
    deleteHistory: "Гісторыі вашай экалагічнай актыўнасці",
    deleteTeams: "Удзелу ў камандах і экасупольнасцях",
    deleteStories: "Гісторый поспеху і публікацый",
    deleteAchievements: "Дасягненняў і ўзнагарод",
    deleteConfirm: "Вы ўпэўнены, што хочаце працягнуць?",
    deleteForever: "Выдаліць назаўжды",
    deleteAccountModalTitle: "Выдаленне акаўнта",
    deleteAccountModalTitle: "Выдаленне акаўнта",
    accountDeletedTitle: "Акаўнт выдалены",
    deleteWarning: "Вы збіраецеся выдаліць свой акаўнт. Гэта дзеянне незваротнае.",
    willBeDeleted: "Будзе выдалена:",
    deleteProfile: "Профіль карыстальніка",
    deleteHistory: "Гісторыя актыўнасці",
    deleteTeams: "Удзел у камандах",
    deleteAchievements: "Дасягненні і ўзнагароды",
    deleteSupportTickets: "Звароты ў падтрымку",
    deleteSettings: "Асабістыя налады",
    typeEmailToConfirm: "Для пацверджання ўвядзіце ваш email:",
    enterEmailPlaceholder: "Увядзіце email для пацверджання",
    accountDeletedSuccess: "Акаўнт паспяхова выдалены",
    accountDeletedDetails: "Усе вашы дадзеныя былі выдалены з сістэмы",
    redirectingIn: "Перанакіраванне праз",
    seconds: "секунд",
    deleting: "Выдаляем...",
    goToHomePage: "Перайсці на галоўную",
    cancel: "Адмена",
    deleteAccount: "Выдаліць акаўнт",
    emailDoesNotMatch: "Email не супадае",
    createStoryButton:"Стварыць гісторыю",
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
    mySupportRequests: "Мае звароты",
    mySupportRequestsDesc: "Адсочванне статусу вашых пытанняў",
    viewMyRequests: "Прагледзець",
    writeToSupport: "Напісаць у падтрымку",
    contactSupport: "Напісаць у падтрымку",
    contactSupportDesc: "Задаць пытанне ці паведаміць пра праблему",
    supportSubject: "Тэма пытання",
    supportSubjectPlaceholder: "Коратка апішыце тэму пытання",
    supportMessage: "Ваша паведамленне",
    supportMessagePlaceholder: "Падрабязна апішыце ваша пытанне ці праблему...",
    supportMessageHint: "Мы паспрабуем адказаць як мага хутчэй",
    sendMessage: "Адправіць",
    supportRequestSent: "Пытанне адпраўлена",
    supportWillRespond: "Мы адкажам вам у бліжэйшы час",
    statusPending: "Чакае адказу",
    statusAnswered: "Адказана",
    statusClosed: "Закрыта",
    hasResponse: "Ёсць адказ",
    noQuestionsTitle: "У вас пакуль няма зваротаў",
    noQuestionsDescription: "Задайце сваё першае пытанне ў падтрымку",
    createFirstQuestion: "Задаць пытанне",
    askNewQuestion: "Задаць новае пытанне",
    createdAt: "Створана",
    answeredAt: "Адказана",
    yourQuestion: "Ваша пытанне",
    adminResponse: "Адказ падтрымкі",
    errorLoadingQuestions: "Памылка загрузкі пытанняў",
    errorSendingRequest: "Памылка адпраўкі запыту",
    supportTitle: "Падтрымка",
    supportApp: "Падтрымка дадатка",
    contactSupport: "Напісаць у падтрымку",
    contactSupportDesc: "Задаць пытанне альбо паведаміць аб праблеме",
    writeToSupport: "Напісаць",
    faqTitle: "Частыя пытанні",
    faqDesc: "Адказы на папулярныя пытанні пра дадатак",
    openFAQ: "Адкрыць FAQ",
    aboutApp: "Пра дадатак",
    aboutAppDesc: "Даведацца больш пра дадатак EcoSteps",
    mySupportRequests: "Мае звароты",
    mySupportRequestsDesc: "Сачэнне за статусам вашых пытанняў",
    viewMyRequests: "Паглядзець",
    noSubject: "Без тэмы",
    updated: "Абноўлена",
    answeredAt: "Атрыманы адказ",
    refresh: "Абнавіць",
    close: "Зачыніць",
    loading: "Загрузка...",
    errorLoadingData: "Памылка загрузкі дадзеных",
    dataLoadError: "Не атрымалася загрузіць спіс зваротаў",
    tryAgain: "Паспрабаваць зноў",
    noQuestionsTitle: "У вас пакуль няма зваротаў",
    noQuestionsDescription: "Задайце першае пытанне ў падтрымку",
    createFirstQuestion: "Задаць пытанне",
    hasResponse: "Ёсць адказ",
    askNewQuestion: "Задаць новае пытанне",
     // FAQ
  faqTitle: "Частыя пытанні",
  faqDesc: "Адказы на папулярныя пытанні пра дадатак",
  openFAQ: "Адкрыць FAQ",
  askQuestion: "Задаць пытанне",
  
  // FAQ пытанні і адказы
  faqQuestion1: "Як разлічваецца эканомія CO₂?",
  faqAnswer1: "Разлік заснаваны на навуковых дадзеных аб выкідах розных відаў дзейнасці. Напрыклад, паездка на ровары замест аўтамабіля эканоміць прыкладна 2.6 кг CO₂ на 10 км.",
  
  faqQuestion2: "Як змяніць свой эка-ўзровень?",
  faqAnswer2: "Эка-ўзровень павышаецца аўтаматычна пры назапашванні пэўнай колькасці зэканомленага CO₂ і выкананні эка-дзеянняў.",
  
  faqQuestion3: "Ці можна выдаліць гісторыю поспеху?",
  faqAnswer3: "Так, вы можаце выдаліць свае гісторыі поспеху ў раздзеле 'Мае гісторыі' ў асабістым кабінеце.",
  
  faqQuestion4: "Як працуюць каманды?",
  faqAnswer4: "Каманды дазваляюць аб'ядноўвацца з адзінадумцамі для дасягнення агульных эка-мэтаў. Вы можаце стварыць каманду альбо далучыцца да існуючай.",
  
  faqQuestion5: "Бяспечныя лі мае дадзеныя?",
  faqAnswer5: "Мы выкарыстоўваем сучасныя метады шыфравання і не перадаем вашыя дадзеныя трэцім асобам. Падрабязней у палітыцы канфідэнцыяльнасці.",
    // Форма падтрымкі
    supportSubject: "Тэма пытання",
    supportSubjectPlaceholder: "Коратка апішыце тэму пытання",
    supportMessage: "Ваша паведамленне",
    supportMessagePlaceholder: "Падрабязна апішыце ваша пытанне альбо праблему...",
    supportMessageHint: "Мы паспрабуем адказаць як мага хутчэй",
    sendMessage: "Адправіць",
    messageSent: "Паведамленне адпраўлена!",
    supportRequestSent: "Пытанне адпраўлена ў падтрымку",
    supportWillRespond: "Мы разгледзім ваша пытанне і адкажам у бліжэйшы час",
    responseTime: "Звычайна мы адказваем на працягу 24 гадзін",
    checkStatusInMyRequests: "Статус адказу можна адсочваць у раздзеле Мае звароты",
    windowWillClose: "Акно зачыніцца аўтаматычна праз 5 секунд...",
    
    // Статусы пытанняў
    statusPending: "Чакае адказу",
    statusAnswered: "Атрыманы адказ",
    statusClosed: "Зачынена",
    
    // Апавяшчэнні падтрымкі
    noQuestionsTitle: "У вас пакуль няма зваротаў",
    noQuestionsDescription: "Задайце першае пытанне ў падтрымку",
    createFirstQuestion: "Задаць пытанне",
    errorLoadingQuestions: "Памылка загрузкі пытанняў",
    errorSendingRequest: "Памылка адпраўкі запыту",
    hasResponse: "Ёсць адказ",
    askNewQuestion: "Задаць новае пытанне",
    
    // Дэталі пытання
    yourQuestion: "Ваша пытанне",
    adminResponse: "Адказ падтрымкі",
    createdAt: "Створана",
    answeredAt: "Атрыманы адказ",
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
    deleteForever: "Выдаліць назаўсёды",
      // Эка-ўзроўні
  ecoHero: "Эка-герой",
  ecoMaster: "Эка-майстар", 
  ecoActivist: "Эка-актывіст",
  ecoEnthusiast: "Эка-энтузіяст",
  ecoStarter: "Эка-стартар",
  ecoNovice: "Эка-навічок",
  
  // Admin panel - Stories/Reviews management
  manageReviews: 'Кіраванне гісторыямі',
  totalStories: 'Усяго гісторый',
  storiesByCategory: 'Гісторыі па катэгорыях',
  searchStoriesPlaceholder: 'Пошук па загалоўку або аўтару...',
  allCategories: 'Усе катэгорыі',
  pendingReview: 'На праверцы',
  draft: 'Чарнавік',
  title: 'Загаловак',
  author: 'Аўтар',
  category: 'Катэгорыя',
  carbonSaved: 'CO₂ захавана',
  previewStory: 'Прагледзець гісторыю',
  publishStory: 'Апублікаваць',
  rejectStory: 'Адхіліць',
  unpublishStory: 'Зняць з публікацыі',
  moveToDraft: 'У чарнавікі',
  storyPreview: 'Папярэдні прагляд гісторыі',
  likes: 'лайкаў',
  confirmPublish: 'Апублікаваць гісторыю?',
  confirmPublishMessage: 'Апублікаваць гісторыю "{title}" ад {author}?',
  confirmReject: 'Адхіліць гісторыю?',
  confirmRejectMessage: 'Адхіліць гісторыю "{title}" ад {author}?',
  confirmUnpublish: 'Зняць з публікацыі?',
  confirmUnpublishMessage: 'Зняць з публікацыі гісторыю "{title}" ад {author}? Гісторыя будзе перамешчана ў чарнавікі.',
  storyPublished: 'Гісторыя апублікавана',
  storyRejected: 'Гісторыя адхілена',
  storyUnpublished: 'Гісторыя знята з публікацыі',
  noStoriesFound: 'Гісторыі не знойдзены',
  noStoriesInSystem: 'Няма гісторый у сістэме',
  showAllStories: 'Паказаць усе гісторыі',
  loadingStories: 'Загрузка гісторый...',

  // Admin panel - Support management
  viewResponse: 'Прагледзець',
  respondToTicket: 'Адказаць',
  editResponse: 'Рэдагаваць адказ',
  ticketNumber: '№ звароту',
  userMessage: 'Паведамленне карыстальніка',
  yourResponse: 'Ваш адказ',
  responsePlaceholder: 'Увядзіце ваш адказ карыстальніку...',
  responseRequired: 'Увядзіце адказ',
  responseTooLong: 'Адказ занадта доўгі (макс. 2000 сімвалаў)',
  sendResponse: 'Адправіць',
  updateResponse: 'Абнавіць',
  responseSent: 'Адказ адпраўлены',
  responseSentToUser: 'Адказ адпраўлены карыстальніку {username}',
  confirmCloseTicket: 'Закрыць зварот?',
  confirmCloseTicketMessage: 'Вы ўпэўнены, што хочаце закрыць зварот {ticketNumber}?',
  closeTicket: 'Закрыць зварот',
  ticketClosed: 'Зварот закрыты',
  ticketClosedSuccess: 'Зварот {ticketNumber} закрыты',
  
  // Statistics page
  statsTotalSaved: "Зэканомлена CO₂",
  statsKg: "кг",
  statsTons: "т",
  statsKm: "км",
  statsKWh: "кВтг",
  statsM3: "м³",
  statsL: "л",
  statsServings: "порцый",
  statsPercent: "%",
  statsAllTime: "У параўнанні са сусветным сярэднім",
  statsMonthSaved: "За месяц",
  statsLast30Days: "Апошнія 30 дзён",
  statsLevel: "Узровень",
  statsToNext: "Да",
  statsMaxLevel: "Максімальны ўзровень!",
  statsChartTitle: "Дынаміка вугляроднага следу",
  statsPeriodWeek: "Тыдзень",
  statsPeriodMonth: "Месяц",
  statsPeriodYear: "Год",
  statsBarChartTitle: "Вугляродны след па днях",
  statsPieChartTitle: "Размеркаванне па катэгорыях",
  statsNoData: "Няма даных",
  statsCalculatorTitle: "Калькулятар вугляроднага следу",
  statsCalculatorHint: "💡 Укажыце ваша спажыванне за пэўны перыяд (дзень/тыдзень/месяц) для кожнай катэгорыі",
  statsReset: "Скінуць",
  statsCarKm: "Аўтамабіль (км у дзень)",
  statsBusKm: "Аўтобус (км у дзень)",
  statsPlaneKm: "Самалёт (км у месяц)",
  statsTrainKm: "Цягнік (км у дзень)",
  statsHousing: "Жыллё",
  statsElectricity: "Электрычнасць (кВтг у месяц)",
  statsHeating: "Ацяпленне (кВтг у месяц)",
  statsWater: "Вада (м³ у месяц)",
  statsGas: "Газ (м³ у месяц)",
  statsMeat: "Мяса і рыба (кг у тыдзень)",
  statsVegetables: "Гародніна і садавіна (кг у тыдзень)",
  statsProcessedFood: "Апрацаваныя прадукты (порцый у тыдзень)",
  statsLocalFood: "Мясцовыя прадукты (%)",
  statsDairy: "Малочныя прадукты (л у тыдзень)",
  statsWaste: "Адходы",
  statsRecycling: "Перапрацоўка адходаў (%)",
  statsCompost: "Кампаставанне (%)",
  statsPlastic: "Пластык (кг у месяц)",
  statsCalculating: "Разлік...",
  statsCalculateButton: "Разлічыць вугляродны след",
  statsResults: "Вынікі разліку",
  statsTotalFootprint: "Ваш вугляродны след",
  statsSaved: "Зэканомлена",
  statsPerDay: "у дзень",
  statsHistory: "Гісторыя разлікаў",
  statsNoHistory: "Гісторыя разлікаў пустая",
  statsFirstCalculation: "Зрабіць першы разлік",
  statsSubtitle: "Адсочвайце свой вугляродны след і прагрэс",
  
  // Eco levels
  ecoLevelNovice: "Эка-пачатковец",
  ecoLevelStarter: "Эка-стартар",
  ecoLevelEnthusiast: "Эка-энтузіяст",
  ecoLevelActivist: "Эка-актывіст",
  ecoLevelMaster: "Эка-майстар",
  ecoLevelHero: "Эка-герой",
  
  // Profile Page
  profileNotFound: "Профіль не знойдзены",
  friends: "Сябры",
  posts: "Пасты",
  teams: "Каманды",
  treesPlanted: "Дрэвы пасаджаны",
  carbonSaved: "CO₂ эканомлена",
  bio: "Пра сябе",
  goal: "Мэта",
  dateOfBirth: "Дата нараджэння",
  day: "Дзень",
  month: "Месяц",
  year: "Год",
  invalidDateFormat: "Няправільны фармат. Выкарыстоўвайце ДД/ММ/ГГГГ",
  invalidMonth: "Месяц павінен быць ад 1 да 12",
  invalidDay: "Дзень павінен быць ад 1 да 31",
  invalidYear: "Год павінен быць ад 1900 да бягучага",
  invalidDate: "Такой даты не існуе",
  ageRestriction: "Вам павінна быць не менш за 18 гадоў",
  error: "Памылка",
  errorSavingProfile: "Памылка захавання профілю",
  ok: "OK",
  january: "Студзень",
  february: "Люты",
  march: "Сакавік",
  april: "Красавік",
  may: "Май",
  june: "Чэрвень",
  july: "Ліпень",
  august: "Жнівень",
  september: "Верасень",
  october: "Кастрычнік",
  november: "Лістапад",
  december: "Снежань",
  edit: "Рэдагаваць",
  save: "Захаваць",
  bioPlaceholder: "Раскажыце пра сябе...",
  goalPlaceholder: "Ваша экалагічная мэта...",
  whatsOnYourMind: "Што новага?",
  publish: "Апублікаваць",
  noPosts: "Пакуль няма пастоў",
  confirmDeletePost: "Выдаліць паст?",
  confirmDeletePostMessage: "Вы ўпэўненыя, што хочаце выдаліць гэты паст?",
  confirmDeleteComment: "Выдаліць каментар?",
  confirmDeleteCommentMessage: "Вы ўпэўненыя, што хочаце выдаліць гэты каментар?",
  addComment: "Дадаць каментар...",
  publicProfile: "Публічны профіль",
  publicProfileHint: "Калі ўключана, ваш профіль змогуць бачыць усе карыстальнікі",
  viewFriends: "Паглядзець сяброў",
  friendsList: "Спіс сяброў",
  noFriends: "Пакуль няма сяброў",
  viewProfile: "Паглядзець профіль",
  backToMyProfile: "Вярнуцца да майго профілю",
  
  // Friendship
  addFriend: "Дадаць у сябры",
  friendRequestSent: "Запыт адпраўлены",
  acceptFriendRequest: "Прыняць запыт",
  rejectFriendRequest: "Адхіліць",
  removeFriend: "Выдаліць з сяброў",
  confirmRemoveFriend: "Вы дакладна хочаце выдаліць з сяброў",
  
  // Report user
  reportUser: "Паскардзіцца",
  reportModalTitle: "Паскардзіцца на карыстальніка",
  reportReason: "Прычына скаргі",
  reportReasonPlaceholder: "Пакажыце прычыну скаргі",
  selectReason: "Выберыце прычыну",
  reportReasonSpam: "Спам",
  reportReasonHarassment: "Абразы",
  reportReasonInappropriate: "Недарэчны кантэнт",
  reportReasonOther: "Іншае",
  reportDescription: "Апісанне",
  reportDescriptionPlaceholder: "Апішыце праблему падрабязней...",
  screenshots: "Скрыншоты",
  maxScreenshots: "Максімум 5 скрыншотаў",
  addScreenshots: "Дадаць скрыншоты",
  submitReport: "Адправіць скаргу",
  reportSent: "Скарга адпраўлена",
  fillAllFields: "Запоўніце ўсе палі",
  
  // Change password
  changePassword: "Змяніць пароль",
  changePasswordModalTitle: "Змена пароля",
  currentPassword: "Бягучы пароль",
  newPassword: "Новы пароль",
  confirmPassword: "Пацвердзіце пароль",
  passwordsDoNotMatch: "Паролі не супадаюць",
  passwordChanged: "Пароль зменены",
  resetPasswordTitle: "Скід пароля",
  resetPasswordDesc: "Мы адправім спасылку для скіду пароля на ваш email:",
  checkSpamFolder: "Праверце папку \"Спам\", калі ліст не прыйдзе на працягу некалькіх хвілін.",
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
    const userData = localStorage.getItem('user')
    if (!userData) {
      console.warn('Пользователь не авторизован, язык не сохранен в БД')
      return false
    }

    const user = JSON.parse(userData)
    
    const response = await fetch('/api/user-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user.id.toString() // ИСПРАВЛЕНО: используем X-User-Id
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
    const userData = localStorage.getItem('user')
    if (!userData) {
      return null
    }

    const user = JSON.parse(userData)
    
    const response = await fetch('/api/user-settings', {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user.id.toString() // ИСПРАВЛЕНО: используем X-User-Id
      }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.settings && data.settings.language) {
        console.log('Язык загружен из базы данных:', data.settings.language)
        return data.settings.language
      }
    } else if (response.status === 404) {
      // Если настроек нет в БД, создаем их с дефолтными значениями
      await createDefaultSettings(user.id)
      return getSavedLanguage() || defaultLanguage
    }
    
    return null
  } catch (error) {
    console.warn('Ошибка при загрузке языка из БД:', error)
    return null
  }
}
// Функция для создания настроек по умолчанию
const createDefaultSettings = async (userId) => {
  try {
    const currentLang = getSavedLanguage() || defaultLanguage
    
    const response = await fetch('/api/user-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString() // ИСПРАВЛЕНО: используем X-User-Id
      },
      body: JSON.stringify({
        language: currentLang,
        theme: typeof getSavedTheme !== 'undefined' ? getSavedTheme() : 'light'
      })
    })
    
    if (!response.ok) {
      console.warn('Ошибка создания настроек по умолчанию:', response.statusText)
    }
  } catch (error) {
    console.warn('Ошибка создания настроек по умолчанию:', error)
  }
}
// Функция для сохранения языка и в localStorage и в БД
export const saveLanguageEverywhere = async (language) => {
  try {
    // Сохраняем в localStorage
    saveLanguage(language)
    
    // Сохраняем в БД (асинхронно)
    const success = await saveLanguageToDatabase(language)
    
    if (!success) {
      console.warn('Язык сохранен в localStorage, но не в БД')
    }
    
    return success
  } catch (error) {
    console.warn('Ошибка при сохранении языка:', error)
    // Язык все равно сохранен в localStorage, это важнее
    return false
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
  
  // Always display in kg, no tons conversion
  const roundedKg = Math.round(carbonKg * 10) / 10 // Round to 1 decimal place
  return `${roundedKg} ${t.kgCO2 || 'кг CO₂'}`
}