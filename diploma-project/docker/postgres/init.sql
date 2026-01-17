-- ============================================
-- БАЗА ДАННЫХ ДЛЯ ПРОЕКТА EcoSteps
-- ============================================

-- ============ СПРАВОЧНИК ПОЛОВ ============
CREATE TABLE IF NOT EXISTS genders (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL CHECK (code IN ('male', 'female'))
);

-- ============ ОСНОВНАЯ ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ ============
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender_id INTEGER REFERENCES genders(id),
    carbon_saved INTEGER DEFAULT 0, -- Сэкономлено CO₂ в кг
    eco_level VARCHAR(50) DEFAULT 'Эко-новичок',
    avatar_emoji VARCHAR(10) DEFAULT '🌱',
    email_verified BOOLEAN DEFAULT FALSE, -- Подтверждена ли почта
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ КОДЫ ПОДТВЕРЖДЕНИЯ EMAIL ============
CREATE TABLE IF NOT EXISTS email_verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL, -- 6-значный код
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ ВРЕМЕННЫЕ ДАННЫЕ РЕГИСТРАЦИИ ============
CREATE TABLE IF NOT EXISTS pending_registrations (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender_id INTEGER REFERENCES genders(id),
    verification_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ КОМАНДЫ ============
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    avatar_emoji VARCHAR(10) DEFAULT '🌿',
    goal_description TEXT, -- Описание цели команды
    goal_target INTEGER, -- Целевое значение (например, 1000 кг CO₂)
    goal_current INTEGER DEFAULT 0, -- Текущий прогресс
    carbon_saved INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ УЧАСТНИКИ КОМАНД ============
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

-- ============ ИСТОРИИ УСПЕХА ============
CREATE TABLE IF NOT EXISTS success_stories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Общее',
    carbon_saved INTEGER NOT NULL, -- Сэкономлено CO₂ в кг
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ ЛАЙКИ ИСТОРИЙ ============
CREATE TABLE IF NOT EXISTS story_likes (
    id SERIAL PRIMARY KEY,
    story_id INTEGER REFERENCES success_stories(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(story_id, user_id)
);

-- Индексы
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nickname ON users(nickname);
CREATE INDEX idx_users_gender ON users(gender_id);
CREATE INDEX idx_users_birthdate ON users(date_of_birth);
CREATE INDEX idx_users_carbon_saved ON users(carbon_saved);
CREATE INDEX idx_teams_carbon_saved ON teams(carbon_saved);
CREATE INDEX idx_stories_user ON success_stories(user_id);
CREATE INDEX idx_stories_created ON success_stories(created_at);
CREATE INDEX idx_story_likes_story ON story_likes(story_id);
CREATE INDEX idx_story_likes_user ON story_likes(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- ============ ДОСТИЖЕНИЯ ============
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- transport, energy, waste, food, water, social, general
    icon VARCHAR(10) NOT NULL,
    requirement_type VARCHAR(50) NOT NULL, -- carbon_saved, distance, days, count, team_members
    requirement_value INTEGER NOT NULL,
    points INTEGER DEFAULT 10,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ ДОСТИЖЕНИЯ ПОЛЬЗОВАТЕЛЕЙ ============
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Индексы для достижений
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_completed ON user_achievements(completed);

-- Дополнительные индексы для продакшена
CREATE INDEX idx_stories_category_date ON success_stories(category, created_at);
CREATE INDEX idx_stories_likes_desc ON success_stories(likes_count DESC);
CREATE INDEX idx_story_likes_composite ON story_likes(story_id, user_id);
CREATE INDEX idx_stories_carbon_saved ON success_stories(carbon_saved DESC);
CREATE INDEX idx_users_carbon_saved_desc ON users(carbon_saved DESC);
CREATE INDEX idx_teams_carbon_saved_desc ON teams(carbon_saved DESC);

-- ============ ЗАПОЛНЯЕМ СПРАВОЧНИК ПОЛОВ ============
INSERT INTO genders (code) VALUES
    ('male'),
    ('female')
ON CONFLICT (code) DO NOTHING;

-- ============ ТЕСТОВЫЕ ПОЛЬЗОВАТЕЛИ ============
INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level) 
SELECT 
    'alex.eco@example.com',
    'АлексЭко',
    '$2b$10$Op7dI2UdtcvZakYmhKwpWuEEx/BOX1eY48wx9fe9h/TFdrdDeATfm',
    '1995-05-15',
    g.id,
    5200,
    'Эко-герой'
FROM genders g WHERE g.code = 'male'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level) 
SELECT 
    'maria.green@example.com',
    'МарияЗеленая',
    '$2b$10$Op7dI2UdtcvZakYmhKwpWuEEx/BOX1eY48wx9fe9h/TFdrdDeATfm',
    '1998-08-22',
    g.id,
    4800,
    'Эко-мастер'
FROM genders g WHERE g.code = 'female'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level) 
SELECT 
    'test.user@example.com',
    'ЭкоТестер',
    '$2b$10$Op7dI2UdtcvZakYmhKwpWuEEx/BOX1eY48wx9fe9h/TFdrdDeATfm',
    '1990-12-31',
    g.id,
    4200,
    'Эко-активист'
FROM genders g WHERE g.code = 'male'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level) 
SELECT 
    'dmitry.s@example.com',
    'ДмитрийС',
    '$2b$10$Op7dI2UdtcvZakYmhKwpWuEEx/BOX1eY48wx9fe9h/TFdrdDeATfm',
    '1992-03-10',
    g.id,
    3900,
    'Эко-энтузиаст'
FROM genders g WHERE g.code = 'male'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level) 
SELECT 
    'olga.m@example.com',
    'ОльгаМ',
    '$2b$10$Op7dI2UdtcvZakYmhKwpWuEEx/BOX1eY48wx9fe9h/TFdrdDeATfm',
    '1996-07-25',
    g.id,
    3600,
    'Эко-энтузиаст'
FROM genders g WHERE g.code = 'female'
ON CONFLICT (email) DO NOTHING;

-- Добавляем больше пользователей для команд
INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level) 
SELECT 
    'anna.k@example.com',
    'АннаК',
    '$2b$10$Op7dI2UdtcvZakYmhKwpWuEEx/BOX1eY48wx9fe9h/TFdrdDeATfm',
    '1999-01-12',
    g.id,
    3200,
    'Эко-стартер'
FROM genders g WHERE g.code = 'female'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level) 
SELECT 
    'pavel.v@example.com',
    'ПавелВ',
    '$2b$10$Op7dI2UdtcvZakYmhKwpWuEEx/BOX1eY48wx9fe9h/TFdrdDeATfm',
    '1994-09-08',
    g.id,
    2800,
    'Эко-стартер'
FROM genders g WHERE g.code = 'male'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level) 
SELECT 
    'elena.p@example.com',
    'ЕленаП',
    '$2b$10$Op7dI2UdtcvZakYmhKwpWuEEx/BOX1eY48wx9fe9h/TFdrdDeATfm',
    '1997-04-20',
    g.id,
    2500,
    'Эко-новичок'
FROM genders g WHERE g.code = 'female'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level) 
SELECT 
    'sergey.l@example.com',
    'СергейЛ',
    '$2b$10$Op7dI2UdtcvZakYmhKwpWuEEx/BOX1eY48wx9fe9h/TFdrdDeATfm',
    '1993-11-15',
    g.id,
    2200,
    'Эко-новичок'
FROM genders g WHERE g.code = 'male'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level) 
SELECT 
    'natasha.r@example.com',
    'НаташаР',
    '$2b$10$Op7dI2UdtcvZakYmhKwpWuEEx/BOX1eY48wx9fe9h/TFdrdDeATfm',
    '2000-06-03',
    g.id,
    1900,
    'Эко-новичок'
FROM genders g WHERE g.code = 'female'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level) 
SELECT 
    'ivan.t@example.com',
    'ИванТ',
    '$2b$10$Op7dI2UdtcvZakYmhKwpWuEEx/BOX1eY48wx9fe9h/TFdrdDeATfm',
    '1991-12-28',
    g.id,
    1600,
    'Эко-новичок'
FROM genders g WHERE g.code = 'male'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level) 
SELECT 
    'victoria.s@example.com',
    'ВикторияС',
    '$2b$10$Op7dI2UdtcvZakYmhKwpWuEEx/BOX1eY48wx9fe9h/TFdrdDeATfm',
    '1998-02-14',
    g.id,
    1400,
    'Эко-новичок'
FROM genders g WHERE g.code = 'female'
ON CONFLICT (email) DO NOTHING;

-- ============ ТЕСТОВЫЕ КОМАНДЫ ============
INSERT INTO teams (name, description, avatar_emoji, goal_description, goal_target, goal_current, carbon_saved, member_count) VALUES
    ('Зеленые Минска', 'Экологическое сообщество столицы', '🌱', 'Сэкономить 30 тонн CO₂ за год', 30000, 23400, 23400, 8),
    ('Эко-студенты МГКЦТ', 'Студенты за экологию', '🎓', 'Перейти на велосипеды и общественный транспорт', 25000, 18900, 18900, 6),
    ('Велосипедисты Гомеля', 'Велосипед вместо автомобиля', '🚴', 'Проехать 5000 км на велосипедах', 20000, 15600, 15600, 4),
    ('Солнечная энергия', 'Возобновляемые источники энергии', '☀️', 'Установить солнечные панели в 10 домах', 15000, 12300, 12300, 3),
    ('Ноль отходов', 'Минимизация отходов', '♻️', 'Сортировать мусор 100% времени', 15000, 11800, 11800, 4)
ON CONFLICT (name) DO NOTHING;

-- ============ ДОСТИЖЕНИЯ ============
-- Транспорт
INSERT INTO achievements (code, name, description, category, icon, requirement_type, requirement_value, points, rarity) VALUES
    ('bike_10km', 'Первые 10 км', 'Проехать 10 км на велосипеде', 'transport', '🚴', 'distance', 10, 10, 'common'),
    ('bike_50km', 'Велосипедист', 'Проехать 50 км на велосипеде', 'transport', '🚴', 'distance', 50, 25, 'common'),
    ('bike_100km', 'Веломарафон', 'Проехать 100 км на велосипеде', 'transport', '🚴', 'distance', 100, 50, 'rare'),
    ('bike_500km', 'Веломастер', 'Проехать 500 км на велосипеде', 'transport', '🚴', 'distance', 500, 100, 'epic'),
    ('bike_1000km', 'Велогерой', 'Проехать 1000 км на велосипеде', 'transport', '🚴', 'distance', 1000, 200, 'legendary'),
    ('public_transport_7', 'Неделя без авто', 'Использовать общественный транспорт 7 дней подряд', 'transport', '🚌', 'days', 7, 15, 'common'),
    ('public_transport_30', 'Месяц без авто', 'Использовать общественный транспорт 30 дней подряд', 'transport', '🚌', 'days', 30, 50, 'rare'),
    ('walk_5km', 'Пешеход', 'Пройти 5 км пешком', 'transport', '🚶', 'distance', 5, 10, 'common'),
    ('walk_50km', 'Марафонец', 'Пройти 50 км пешком', 'transport', '🚶', 'distance', 50, 50, 'rare'),
    ('carpool_10', 'Попутчик', 'Использовать карпулинг 10 раз', 'transport', '🚗', 'count', 10, 20, 'common'),

-- Энергия
    ('solar_install', 'Солнечная энергия', 'Установить солнечные панели', 'energy', '☀️', 'count', 1, 100, 'epic'),
    ('led_bulbs_10', 'LED освещение', 'Заменить 10 ламп на LED', 'energy', '💡', 'count', 10, 20, 'common'),
    ('energy_save_100', 'Энергосбережение', 'Сэкономить 100 кВт⋅ч', 'energy', '⚡', 'count', 100, 30, 'rare'),
    ('energy_save_500', 'Энергомастер', 'Сэкономить 500 кВт⋅ч', 'energy', '⚡', 'count', 500, 75, 'epic'),
    ('renewable_30days', 'Месяц на возобновляемой энергии', 'Использовать только возобновляемую энергию 30 дней', 'energy', '🔋', 'days', 30, 100, 'epic'),

-- Отходы
    ('recycle_first', 'Первая сортировка', 'Начать раздельный сбор мусора', 'waste', '♻️', 'count', 1, 10, 'common'),
    ('recycle_30days', 'Месяц сортировки', 'Сортировать мусор 30 дней подряд', 'waste', '♻️', 'days', 30, 30, 'common'),
    ('recycle_100days', '100 дней сортировки', 'Сортировать мусор 100 дней подряд', 'waste', '♻️', 'days', 100, 75, 'rare'),
    ('zero_waste_7', 'Неделя без отходов', 'Не производить отходы 7 дней', 'waste', '🗑️', 'days', 7, 50, 'rare'),
    ('zero_waste_30', 'Месяц без отходов', 'Не производить отходы 30 дней', 'waste', '🗑️', 'days', 30, 150, 'legendary'),
    ('compost_start', 'Компостирование', 'Начать компостировать органические отходы', 'waste', '🌱', 'count', 1, 20, 'common'),
    ('plastic_free_7', 'Неделя без пластика', 'Не использовать пластик 7 дней', 'waste', '🚫', 'days', 7, 30, 'common'),
    ('plastic_free_30', 'Месяц без пластика', 'Не использовать пластик 30 дней', 'waste', '🚫', 'days', 30, 100, 'epic'),
    ('reusable_bags_30', 'Многоразовые сумки', 'Использовать многоразовые сумки 30 раз', 'waste', '👜', 'count', 30, 20, 'common'),

-- Питание
    ('vegan_7', 'Неделя веганства', 'Питаться веганской пищей 7 дней', 'food', '🥗', 'days', 7, 25, 'common'),
    ('vegan_30', 'Месяц веганства', 'Питаться веганской пищей 30 дней', 'food', '🥗', 'days', 30, 75, 'rare'),
    ('vegetarian_30', 'Месяц вегетарианства', 'Питаться вегетарианской пищей 30 дней', 'food', '🥕', 'days', 30, 50, 'common'),
    ('local_food_30', 'Локальные продукты', 'Покупать только местные продукты 30 дней', 'food', '🌾', 'days', 30, 40, 'rare'),
    ('organic_30', 'Органическое питание', 'Покупать только органические продукты 30 дней', 'food', '🌿', 'days', 30, 50, 'rare'),
    ('no_meat_7', 'Неделя без мяса', 'Не есть мясо 7 дней', 'food', '🥦', 'days', 7, 15, 'common'),
    ('grow_food', 'Свой огород', 'Вырастить свои овощи', 'food', '🌱', 'count', 1, 30, 'common'),

-- Вода
    ('water_save_100', 'Экономия воды', 'Сэкономить 100 литров воды', 'water', '💧', 'count', 100, 20, 'common'),
    ('water_save_1000', 'Водосбережение', 'Сэкономить 1000 литров воды', 'water', '💧', 'count', 1000, 50, 'rare'),
    ('shower_5min_30', 'Быстрый душ', 'Принимать душ не более 5 минут 30 дней подряд', 'water', '🚿', 'days', 30, 40, 'common'),
    ('rainwater_collect', 'Сбор дождевой воды', 'Начать собирать дождевую воду', 'water', '🌧️', 'count', 1, 30, 'common'),

-- Социальные
    ('invite_friend', 'Пригласи друга', 'Пригласить друга в EcoSteps', 'social', '👥', 'count', 1, 15, 'common'),
    ('invite_5friends', 'Эко-амбассадор', 'Пригласить 5 друзей в EcoSteps', 'social', '👥', 'count', 5, 50, 'rare'),
    ('invite_10friends', 'Эко-евангелист', 'Пригласить 10 друзей в EcoSteps', 'social', '👥', 'count', 10, 100, 'epic'),
    ('join_team', 'Командный игрок', 'Присоединиться к команде', 'social', '🤝', 'count', 1, 20, 'common'),
    ('create_team', 'Лидер команды', 'Создать свою команду', 'social', '👑', 'count', 1, 50, 'rare'),
    ('team_10members', 'Популярная команда', 'Собрать команду из 10 участников', 'social', '👥', 'team_members', 10, 75, 'rare'),
    ('team_50members', 'Большая команда', 'Собрать команду из 50 участников', 'social', '👥', 'team_members', 50, 150, 'epic'),
    ('share_story', 'Рассказчик', 'Поделиться своей эко-историей', 'social', '📝', 'count', 1, 15, 'common'),
    ('share_10stories', 'Блогер', 'Поделиться 10 эко-историями', 'social', '📝', 'count', 10, 50, 'rare'),
    ('like_10stories', 'Поддержка', 'Поставить лайк 10 историям', 'social', '❤️', 'count', 10, 10, 'common'),
    ('like_50stories', 'Вдохновитель', 'Поставить лайк 50 историям', 'social', '❤️', 'count', 50, 30, 'common'),

-- Общие достижения
    ('first_day', 'Первый день', 'Зарегистрироваться в EcoSteps', 'general', '🌱', 'count', 1, 5, 'common'),
    ('week_active', 'Неделя активности', 'Быть активным 7 дней подряд', 'general', '📅', 'days', 7, 20, 'common'),
    ('month_active', 'Месяц активности', 'Быть активным 30 дней подряд', 'general', '📅', 'days', 30, 75, 'rare'),
    ('year_active', 'Год активности', 'Быть активным 365 дней подряд', 'general', '📅', 'days', 365, 300, 'legendary'),
    ('carbon_100', 'Первые 100 кг', 'Сэкономить 100 кг CO₂', 'general', '🌍', 'carbon_saved', 100, 25, 'common'),
    ('carbon_500', '500 кг CO₂', 'Сэкономить 500 кг CO₂', 'general', '🌍', 'carbon_saved', 500, 75, 'rare'),
    ('carbon_1000', '1 тонна CO₂', 'Сэкономить 1000 кг CO₂', 'general', '🌍', 'carbon_saved', 1000, 150, 'epic'),
    ('carbon_5000', '5 тонн CO₂', 'Сэкономить 5000 кг CO₂', 'general', '🌍', 'carbon_saved', 5000, 500, 'legendary'),
    ('carbon_10000', '10 тонн CO₂', 'Сэкономить 10000 кг CO₂', 'general', '🌍', 'carbon_saved', 10000, 1000, 'legendary'),
    ('profile_complete', 'Полный профиль', 'Заполнить профиль полностью', 'general', '✅', 'count', 1, 10, 'common'),
    ('avatar_set', 'Персонализация', 'Установить аватар', 'general', '🎨', 'count', 1, 5, 'common'),
    ('early_bird', 'Ранняя пташка', 'Войти в систему до 7 утра', 'general', '🌅', 'count', 1, 10, 'common'),
    ('night_owl', 'Сова', 'Войти в систему после 23:00', 'general', '🦉', 'count', 1, 10, 'common')
ON CONFLICT (code) DO NOTHING;

-- ============ ТЕСТОВЫЕ ИСТОРИИ УСПЕХА ============
INSERT INTO success_stories (user_id, title, content, category, carbon_saved, likes_count) VALUES
    (1, 'Мой путь к экологичности', 'Начала с отказа от пластиковых пакетов, теперь экономлю 2 тонны CO₂ в год!', 'Общее', 2000, 45),
    (2, 'Переход на велосипед', 'Продала машину и купила велосипед. За год сэкономила 3.5 тонны углерода.', 'Транспорт', 3500, 67),
    (3, 'Солнечные панели дома', 'Установили солнечные панели. Теперь дом полностью на возобновляемой энергии!', 'Энергия', 5200, 89),
    (4, 'Раздельный сбор мусора', 'Организовал раздельный сбор в своем районе. Участвуют уже 50 семей!', 'Отходы', 1800, 34),
    (5, 'Органическое питание', 'Перешла на органические продукты и локальных производителей.', 'Питание', 1200, 28),
    (6, 'Экономия воды дома', 'Установила счетчики воды и экономные смесители. Расход воды снизился на 40%!', 'Вода', 800, 22),
    (7, 'Отказ от одноразовой посуды', 'В нашем офисе полностью отказались от одноразовой посуды. Теперь используем многоразовую!', 'Отходы', 600, 18),
    (8, 'Компостирование дома', 'Начала компостировать органические отходы. Теперь у меня отличное удобрение для сада!', 'Отходы', 400, 15),
    (9, 'Энергосберегающие лампы', 'Заменил все лампы в доме на LED. Счет за электричество уменьшился в 2 раза!', 'Энергия', 350, 12),
    (10, 'Покупки без упаковки', 'Хожу в магазин с многоразовыми контейнерами. Мусора стало в 3 раза меньше!', 'Потребление', 300, 9),
    (11, 'Ремонт вместо покупки', 'Научился ремонтировать технику вместо покупки новой. Экономлю деньги и природу!', 'Потребление', 250, 7),
    (12, 'Экологичная косметика', 'Перешла на натуральную косметику без химии. Кожа стала лучше, а природа чище!', 'Потребление', 200, 5),
    -- Английские истории для тестирования перевода
    (1, 'My Green Journey', 'Started with small steps like using reusable bags. Now I save 2.5 tons of CO₂ annually!', 'Общее', 2500, 52),
    (3, 'Solar Power Success', 'Installed solar panels on my roof. My house is now 100% renewable energy powered!', 'Энергия', 4800, 78),
    (5, 'Eco-Friendly Lifestyle', 'Switched to sustainable products and reduced my environmental impact by 80% this year!', 'Потребление', 1500, 41)
ON CONFLICT DO NOTHING;

-- ============ УЧАСТНИКИ КОМАНД ============
-- Команда 1: Зеленые Минска (id=1) - 8 участников
INSERT INTO team_members (team_id, user_id, role) VALUES
    (1, 1, 'admin'),   -- АлексЭко
    (1, 2, 'member'),  -- МарияЗеленая
    (1, 3, 'member'),  -- ЭкоТестер
    (1, 6, 'member'),  -- АннаК
    (1, 7, 'member'),  -- ПавелВ
    (1, 8, 'member'),  -- ЕленаП
    (1, 9, 'member'),  -- СергейЛ
    (1, 10, 'member'), -- НаташаР

-- Команда 2: Эко-студенты МГКЦТ (id=2) - 6 участников
    (2, 4, 'admin'),   -- ДмитрийС
    (2, 5, 'member'),  -- ОльгаМ
    (2, 11, 'member'), -- ИванТ
    (2, 12, 'member'), -- ВикторияС
    (2, 6, 'member'),  -- АннаК (может быть в нескольких командах)
    (2, 8, 'member'),  -- ЕленаП

-- Команда 3: Велосипедисты Гомеля (id=3) - 4 участника
    (3, 1, 'member'),  -- АлексЭко
    (3, 7, 'admin'),   -- ПавелВ
    (3, 9, 'member'),  -- СергейЛ
    (3, 11, 'member'), -- ИванТ

-- Команда 4: Солнечная энергия (id=4) - 3 участника
    (4, 2, 'admin'),   -- МарияЗеленая
    (4, 3, 'member'),  -- ЭкоТестер
    (4, 12, 'member'), -- ВикторияС

-- Команда 5: Ноль отходов (id=5) - 4 участника
    (5, 5, 'admin'),   -- ОльгаМ
    (5, 10, 'member'), -- НаташаР
    (5, 4, 'member'),  -- ДмитрийС
    (5, 8, 'member')   -- ЕленаП
ON CONFLICT (team_id, user_id) DO NOTHING;

-- ============ ПРЕДСТАВЛЕНИЯ ДЛЯ УДОБСТВА ============
CREATE OR REPLACE VIEW users_view AS
SELECT 
    u.id,
    u.email,
    u.nickname as display_name,
    u.date_of_birth,
    g.code as gender_code,
    u.gender_id,
    u.carbon_saved,
    u.eco_level,
    u.avatar_emoji,
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN genders g ON u.gender_id = g.id;

CREATE OR REPLACE VIEW user_rankings AS
SELECT 
    u.id,
    u.nickname,
    u.carbon_saved,
    u.eco_level,
    u.avatar_emoji,
    ROW_NUMBER() OVER (ORDER BY u.carbon_saved DESC) as rank
FROM users u
ORDER BY u.carbon_saved DESC;

CREATE OR REPLACE VIEW team_rankings AS
SELECT 
    t.id,
    t.name,
    t.carbon_saved,
    t.member_count,
    t.avatar_emoji,
    ROW_NUMBER() OVER (ORDER BY t.carbon_saved DESC) as rank
FROM teams t
ORDER BY t.carbon_saved DESC;

CREATE OR REPLACE VIEW stories_with_user AS
SELECT 
    s.id,
    s.title,
    s.content,
    s.carbon_saved,
    s.likes_count,
    s.created_at,
    u.nickname as user_nickname,
    u.avatar_emoji as user_avatar
FROM success_stories s
JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC;

-- ============ ФУНКЦИИ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ ============
-- Функция для обновления количества участников в команде
CREATE OR REPLACE FUNCTION update_team_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE teams 
        SET member_count = (
            SELECT COUNT(*) 
            FROM team_members 
            WHERE team_id = NEW.team_id
        )
        WHERE id = NEW.team_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE teams 
        SET member_count = (
            SELECT COUNT(*) 
            FROM team_members 
            WHERE team_id = OLD.team_id
        )
        WHERE id = OLD.team_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления количества участников
DROP TRIGGER IF EXISTS trigger_update_team_member_count_insert ON team_members;
CREATE TRIGGER trigger_update_team_member_count_insert
    AFTER INSERT ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_team_member_count();

DROP TRIGGER IF EXISTS trigger_update_team_member_count_delete ON team_members;
CREATE TRIGGER trigger_update_team_member_count_delete
    AFTER DELETE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_team_member_count();