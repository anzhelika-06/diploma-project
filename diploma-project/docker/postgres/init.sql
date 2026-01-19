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
    is_admin BOOLEAN DEFAULT FALSE, -- Администратор системы
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

-- ============================================
-- ЗАПОЛНЕНИЕ ДАННЫМИ
-- ============================================

-- ============ ПОЛЫ ============
INSERT INTO genders (code) VALUES 
('male'), 
('female')
ON CONFLICT (code) DO NOTHING;

-- ============ ПОЛЬЗОВАТЕЛИ ============
-- Пароли: admin123, user123, test123 (все содержат буквы и цифры)

-- Администратор системы
INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level, avatar_emoji, is_admin, email_verified) VALUES 
('admin@ecosteps.com', 'admin_eco', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1990-01-15', 2, 2500, 'Эко-эксперт', '👑', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Обычные пользователи
INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level, avatar_emoji, email_verified) VALUES 
('anna.green@gmail.com', 'anna_green', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1995-03-22', 2, 1850, 'Эко-активист', '🌸', TRUE),
('mike.eco@outlook.com', 'mike_eco', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1988-07-10', 1, 2100, 'Эко-активист', '🌲', TRUE),
('sarah.nature@yahoo.com', 'sarah_nature', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1992-11-05', 2, 1650, 'Эко-энтузиаст', '🦋', TRUE),
('alex.planet@mail.ru', 'alex_planet', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1985-09-18', 1, 2300, 'Эко-активист', '🌍', TRUE),
('elena.earth@gmail.com', 'elena_earth', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1993-04-12', 2, 1420, 'Эко-энтузиаст', '🌺', TRUE),
('david.clean@hotmail.com', 'david_clean', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1987-12-03', 1, 1980, 'Эко-активист', '♻️', TRUE),
('maria.solar@yandex.ru', 'maria_solar', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1991-06-28', 2, 1750, 'Эко-энтузиаст', '☀️', TRUE),
('john.recycle@gmail.com', 'john_recycle', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1989-02-14', 1, 1600, 'Эко-энтузиаст', '🔄', TRUE),
('lisa.wind@outlook.com', 'lisa_wind', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1994-08-07', 2, 1380, 'Эко-энтузиаст', '💨', TRUE),
('tom.forest@yahoo.com', 'tom_forest', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1986-10-25', 1, 2050, 'Эко-активист', '🌳', TRUE),
('kate.ocean@mail.ru', 'kate_ocean', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1990-05-16', 2, 1720, 'Эко-энтузиаст', '🌊', TRUE),
('peter.bike@gmail.com', 'peter_bike', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1988-01-09', 1, 1890, 'Эко-энтузиаст', '🚴', TRUE),
('nina.garden@hotmail.com', 'nina_garden', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1992-09-21', 2, 1540, 'Эко-энтузиаст', '🌻', TRUE),
('mark.solar@yandex.ru', 'mark_solar', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1987-03-30', 1, 1670, 'Эко-энтузиаст', '🔆', TRUE),
('olga.water@gmail.com', 'olga_water', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1993-11-11', 2, 1450, 'Эко-энтузиаст', '💧', TRUE),
('ivan.green@outlook.com', 'ivan_green', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1985-07-04', 1, 1920, 'Эко-активист', '🍃', TRUE),
('vera.eco@yahoo.com', 'vera_eco', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1991-12-19', 2, 1610, 'Эко-энтузиаст', '🌿', TRUE),
('roman.clean@mail.ru', 'roman_clean', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1989-04-26', 1, 1780, 'Эко-энтузиаст', '🧹', TRUE),
('anya.nature@gmail.com', 'anya_nature', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1994-02-08', 2, 1320, 'Эко-новичок', '🌱', TRUE),
('sergey.planet@hotmail.com', 'sergey_planet', '$2b$10$rQJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8LfWJQYnM.HuKJ8YnM.Hf8L', '1986-08-13', 1, 2150, 'Эко-активист', '🌎', TRUE)
ON CONFLICT (email) DO NOTHING;

-- ============ КОМАНДЫ ============
INSERT INTO teams (name, description, avatar_emoji, goal_description, goal_target, goal_current, carbon_saved, member_count) VALUES 
('Зеленые Герои', 'Команда активистов за чистую планету', '🌿', 'Сэкономить 5000 кг CO₂ за год', 5000, 3200, 3200, 8),
('Эко Воины', 'Борцы за экологию в городе', '⚔️', 'Посадить 100 деревьев и сэкономить 3000 кг CO₂', 3000, 2100, 2100, 6),
('Солнечная Энергия', 'Поклонники возобновляемых источников энергии', '☀️', 'Перевести 50 домов на солнечную энергию', 4000, 1800, 1800, 5),
('Чистый Воздух', 'За качество воздуха в нашем городе', '💨', 'Сократить выбросы CO₂ на 2500 кг', 2500, 1650, 1650, 7),
('Океанские Защитники', 'Защитники морей и океанов', '🌊', 'Очистить 10 км береговой линии', 3500, 2300, 2300, 9),
('Лесные Хранители', 'Защитники лесов и дикой природы', '🌲', 'Восстановить 20 гектаров леса', 6000, 4100, 4100, 12),
('Велосипедисты', 'Популяризация экологичного транспорта', '🚴', 'Проехать 10000 км на велосипедах', 2000, 1200, 1200, 4),
('Садоводы', 'Городское озеленение и органическое земледелие', '🌻', 'Создать 30 городских садов', 2800, 1900, 1900, 8)
ON CONFLICT (name) DO NOTHING;

-- ============ УЧАСТНИКИ КОМАНД ============
INSERT INTO team_members (team_id, user_id, role) VALUES 
-- Зеленые Герои (команда 1)
(1, 2, 'admin'), (1, 3, 'member'), (1, 4, 'member'), (1, 5, 'member'), 
(1, 6, 'member'), (1, 7, 'member'), (1, 8, 'member'), (1, 9, 'member'),
-- Эко Воины (команда 2)
(2, 10, 'admin'), (2, 11, 'member'), (2, 12, 'member'), (2, 13, 'member'), 
(2, 14, 'member'), (2, 15, 'member'),
-- Солнечная Энергия (команда 3)
(3, 16, 'admin'), (3, 17, 'member'), (3, 18, 'member'), (3, 19, 'member'), (3, 20, 'member'),
-- Чистый Воздух (команда 4)
(4, 21, 'admin'), (4, 2, 'member'), (4, 4, 'member'), (4, 6, 'member'), 
(4, 8, 'member'), (4, 10, 'member'), (4, 12, 'member'),
-- Океанские Защитники (команда 5)
(5, 3, 'admin'), (5, 5, 'member'), (5, 7, 'member'), (5, 9, 'member'), 
(5, 11, 'member'), (5, 13, 'member'), (5, 15, 'member'), (5, 17, 'member'), (5, 19, 'member'),
-- Лесные Хранители (команда 6)
(6, 4, 'admin'), (6, 6, 'member'), (6, 8, 'member'), (6, 10, 'member'), 
(6, 12, 'member'), (6, 14, 'member'), (6, 16, 'member'), (6, 18, 'member'), 
(6, 20, 'member'), (6, 21, 'member'), (6, 2, 'member'), (6, 3, 'member'),
-- Велосипедисты (команда 7)
(7, 5, 'admin'), (7, 9, 'member'), (7, 13, 'member'), (7, 17, 'member'),
-- Садоводы (команда 8)
(8, 7, 'admin'), (8, 11, 'member'), (8, 15, 'member'), (8, 19, 'member'), 
(8, 21, 'member'), (8, 2, 'member'), (8, 4, 'member'), (8, 6, 'member')
ON CONFLICT (team_id, user_id) DO NOTHING;

-- ============ ИСТОРИИ УСПЕХА ============
INSERT INTO success_stories (user_id, title, content, category, carbon_saved, likes_count) VALUES 
(2, 'Переход на солнечные батареи', 'Установил солнечные панели на крыше дома. За год сэкономил 800 кг CO₂ и значительно снизил счета за электричество!', 'Энергия', 800, 15),
(3, 'Отказ от автомобиля', 'Продал машину и перешел на велосипед и общественный транспорт. Экономлю 1200 кг CO₂ в год и чувствую себя здоровее!', 'Транспорт', 1200, 23),
(4, 'Органический сад', 'Создала органический сад на заднем дворе. Выращиваю овощи без химикатов и компостирую отходы.', 'Питание', 300, 18),
(5, 'Раздельный сбор мусора', 'Организовал раздельный сбор в нашем доме. Теперь 80% отходов идет на переработку!', 'Отходы', 450, 12),
(6, 'Энергосберегающий дом', 'Утеплил дом и заменил все лампы на LED. Потребление энергии снизилось на 40%!', 'Энергия', 600, 20),
(7, 'Вегетарианство', 'Перешла на растительное питание год назад. Это не только полезно для здоровья, но и для планеты!', 'Питание', 900, 25),
(8, 'Дождевая вода', 'Установил систему сбора дождевой воды для полива сада. Экономлю 200 литров воды в день!', 'Вода', 200, 14),
(9, 'Экологичная косметика', 'Перешла на натуральную косметику без химии. Делаю маски и кремы сама из природных ингредиентов.', 'Быт', 150, 16),
(10, 'Велосипедные поездки', 'Езжу на работу на велосипеде каждый день. 20 км в день - это 2400 кг CO₂ экономии в год!', 'Транспорт', 2400, 30),
(11, 'Минимализм в гардеробе', 'Отказалась от быстрой моды. Покупаю качественную одежду и ношу ее годами.', 'Потребление', 350, 19),
(12, 'Компостирование', 'Начал компостировать органические отходы. Получаю отличное удобрение и сокращаю мусор!', 'Отходы', 280, 13),
(13, 'Электромобиль', 'Купила электромобиль. Никаких выбросов и очень экономично в эксплуатации!', 'Транспорт', 1800, 28),
(14, 'Экодом', 'Построил дом из экологичных материалов с системой рекуперации тепла.', 'Жилье', 1500, 22),
(15, 'Пчеловодство', 'Завела пчел на даче. Помогаю опылению растений и получаю натуральный мед!', 'Природа', 100, 17),
(16, 'Ремонт вместо покупки', 'Научился ремонтировать технику вместо покупки новой. Экономлю деньги и ресурсы планеты.', 'Потребление', 400, 15)
ON CONFLICT DO NOTHING;

-- ============ ЛАЙКИ ИСТОРИЙ ============
INSERT INTO story_likes (story_id, user_id) VALUES 
-- Лайки для первой истории
(1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15), (1, 16), (1, 17),
-- Лайки для второй истории  
(2, 2), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9), (2, 10), (2, 11), (2, 12), (2, 13), (2, 14), (2, 15), (2, 16), (2, 17), (2, 18), (2, 19), (2, 20), (2, 21), (2, 1), (2, 1), (2, 1), (2, 1)
ON CONFLICT (story_id, user_id) DO NOTHING;

-- Обновляем счетчики участников команд
UPDATE teams SET member_count = (
    SELECT COUNT(*) FROM team_members WHERE team_id = teams.id
);

-- Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_success_stories_user_id ON success_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_story_id ON story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user_id ON story_likes(user_id);

-- Выводим информацию о созданных данных
DO $$
BEGIN
    RAISE NOTICE 'База данных EcoSteps успешно инициализирована!';
    RAISE NOTICE 'Создано пользователей: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Создано команд: %', (SELECT COUNT(*) FROM teams);
    RAISE NOTICE 'Создано историй: %', (SELECT COUNT(*) FROM success_stories);
    RAISE NOTICE 'Администратор: admin@ecosteps.com / admin_eco (пароль: admin123)';
END $$;

-- ============ ЕЖЕДНЕВНЫЕ ЭКО-СОВЕТЫ ============
CREATE TABLE IF NOT EXISTS eco_tips (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    co2_impact INTEGER DEFAULT 0, -- Потенциальная экономия CO₂ в граммах
    day_of_year INTEGER, -- День года (1-365), NULL для случайных советов
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Заполняем советы на весь год (365+ советов)
INSERT INTO eco_tips (title, content, category, difficulty, co2_impact, day_of_year) VALUES 
-- Январь (31 день)
('Начните год с эко-целей', 'Поставьте себе цель на год: сократить потребление пластика, экономить воду или использовать общественный транспорт. Запишите свои цели и отслеживайте прогресс.', 'Планирование', 'easy', 0, 1),
('Замените лампочки на LED', 'LED-лампы потребляют на 80% меньше энергии и служат в 25 раз дольше обычных. Одна замена экономит до 40 кг CO₂ в год.', 'Энергия', 'easy', 40000, 2),
('Отключайте приборы от сети', 'Электроприборы в режиме ожидания потребляют до 10% электроэнергии дома. Используйте удлинители с выключателями.', 'Энергия', 'easy', 15000, 3),
('Сократите время душа', 'Сокращение времени душа на 2 минуты экономит до 37 литров воды и 2 кг CO₂ ежедневно.', 'Вода', 'easy', 2000, 4),
('Используйте многоразовые пакеты', 'Один многоразовый пакет заменяет до 1000 пластиковых за свою жизнь. Всегда носите складной пакет с собой.', 'Отходы', 'easy', 5000, 5),
('Покупайте местные продукты', 'Местные продукты не требуют длительной транспортировки, что сокращает выбросы CO₂ на 50-90%.', 'Питание', 'medium', 8000, 6),
('Настройте термостат правильно', 'Снижение температуры на 1°C экономит до 7% энергии на отопление. Оптимально: 20°C днем, 16°C ночью.', 'Энергия', 'easy', 25000, 7),
('Ремонтируйте вместо выбрасывания', 'Ремонт одежды, обуви и техники продлевает их жизнь и сокращает отходы. Изучите базовые навыки ремонта.', 'Отходы', 'medium', 12000, 8),
('Используйте холодную воду для стирки', 'Стирка в холодной воде экономит до 90% энергии и лучше сохраняет ткани. Современные порошки эффективны и в холодной воде.', 'Энергия', 'easy', 18000, 9),
('Планируйте маршруты эффективно', 'Объединяйте поездки и планируйте оптимальные маршруты. Это экономит топливо и время.', 'Транспорт', 'easy', 10000, 10),

-- Февраль (28 дней)
('Попробуйте безмясный понедельник', 'Один день без мяса в неделю экономит 15 кг CO₂ и 1800 литров воды еженедельно.', 'Питание', 'easy', 15000, 32),
('Утеплите окна', 'Утепление окон пленкой или уплотнителями сокращает потери тепла на 30% и экономит энергию.', 'Энергия', 'medium', 35000, 33),
('Собирайте дождевую воду', 'Дождевая вода отлично подходит для полива растений. Установите простую систему сбора.', 'Вода', 'medium', 5000, 34),
('Покупайте б/у вещи', 'Покупка подержанных вещей сокращает производство новых товаров и экономит ресурсы.', 'Потребление', 'easy', 20000, 35),
('Компостируйте органические отходы', 'Компостирование сокращает объем мусора на 30% и создает полезное удобрение.', 'Отходы', 'medium', 8000, 36),

-- Март (31 день) 
('Выращивайте зелень дома', 'Домашняя зелень сокращает упаковку и транспортировку. Начните с петрушки, укропа или базилика.', 'Питание', 'easy', 3000, 60),
('Используйте велосипед', 'Поездка на велосипеде вместо автомобиля экономит 2.6 кг CO₂ на каждые 10 км.', 'Транспорт', 'medium', 26000, 61),
('Сушите белье на воздухе', 'Сушка белья на воздухе вместо сушильной машины экономит 2.3 кг CO₂ за загрузку.', 'Энергия', 'easy', 23000, 62),

-- Апрель (30 дней)
('Посадите дерево', 'Одно дерево поглощает 22 кг CO₂ в год и производит кислород для двух человек.', 'Природа', 'medium', 22000, 91),
('Используйте экологичную косметику', 'Натуральная косметика без химии безопаснее для вас и окружающей среды.', 'Быт', 'easy', 2000, 92),

-- Май (31 день)
('Создайте сад на балконе', 'Даже небольшой балконный сад улучшает воздух и дает свежие овощи и травы.', 'Природа', 'medium', 5000, 121),
('Переходите на цифровые чеки', 'Цифровые чеки сокращают использование бумаги и химических веществ для печати.', 'Отходы', 'easy', 1000, 122),

-- Июнь (30 дней)
('Используйте солнечную энергию', 'Солнечные зарядки для телефонов и небольших устройств - простой способ использовать возобновляемую энергию.', 'Энергия', 'medium', 15000, 152),
('Покупайте сезонные продукты', 'Сезонные продукты вкуснее, дешевле и требуют меньше энергии для выращивания.', 'Питание', 'easy', 6000, 153),

-- Июль (31 день)
('Экономьте воду в саду', 'Поливайте растения рано утром или вечером, используйте мульчу для сохранения влаги.', 'Вода', 'easy', 8000, 182),
('Организуйте обмен вещами', 'Обменивайтесь одеждой, книгами и вещами с друзьями вместо покупки новых.', 'Потребление', 'easy', 15000, 183),

-- Август (31 день)
('Сохраняйте урожай', 'Консервирование, заморозка и сушка продуктов сокращают пищевые отходы и экономят деньги.', 'Питание', 'medium', 10000, 213),
('Используйте натуральные освежители', 'Эфирные масла и растения освежают воздух без химических аэрозолей.', 'Быт', 'easy', 2000, 214),

-- Сентябрь (30 дней)
('Утеплитесь к зиме', 'Проверьте утепление дома, замените уплотнители, подготовьте теплую одежду.', 'Энергия', 'medium', 40000, 244),
('Собирайте семена', 'Собирайте семена цветов и овощей для посадки в следующем году.', 'Природа', 'easy', 3000, 245),

-- Октябрь (31 день)
('Используйте листья как мульчу', 'Опавшие листья - отличная мульча для сада и компоста.', 'Природа', 'easy', 4000, 274),
('Готовьте дома чаще', 'Домашняя еда здоровее и экологичнее готовой пищи из магазина.', 'Питание', 'easy', 8000, 275),

-- Ноябрь (30 дней)
('Сократите отопление', 'Носите теплую одежду дома и снизьте температуру на 2-3 градуса.', 'Энергия', 'easy', 30000, 305),
('Покупайте подарки осознанно', 'Выбирайте качественные, полезные подарки или дарите впечатления вместо вещей.', 'Потребление', 'medium', 20000, 306),

-- Декабрь (31 день)
('Украшайте дом экологично', 'Используйте натуральные материалы для украшений: шишки, ветки, самодельные игрушки.', 'Быт', 'easy', 5000, 335),
('Планируйте экологичный Новый год', 'Минимум упаковки, местные продукты, многоразовая посуда для празднования.', 'Планирование', 'medium', 15000, 365),

-- Дополнительные советы для разнообразия (случайные)
('Выключайте свет', 'Выключение света в пустых комнатах - простая привычка, которая экономит энергию.', 'Энергия', 'easy', 5000, NULL),
('Пейте воду из-под крана', 'Фильтрованная вода из-под крана экологичнее бутилированной и экономит деньги.', 'Вода', 'easy', 3000, NULL),
('Читайте электронные книги', 'Электронные книги сокращают использование бумаги и место для хранения.', 'Потребление', 'easy', 2000, NULL),
('Делитесь инструментами', 'Делитесь редко используемыми инструментами с соседями вместо покупки собственных.', 'Потребление', 'medium', 10000, NULL),
('Используйте общественный транспорт', 'Общественный транспорт сокращает выбросы CO₂ в 4-5 раз по сравнению с личным автомобилем.', 'Транспорт', 'easy', 20000, NULL),
('Покупайте качественные вещи', 'Качественные вещи служат дольше и в итоге экономят деньги и ресурсы.', 'Потребление', 'medium', 25000, NULL),
('Изучайте этикетки', 'Выбирайте продукты с экологичной упаковкой и сертификатами устойчивого производства.', 'Потребление', 'easy', 5000, NULL),
('Ходите пешком больше', 'Пешие прогулки полезны для здоровья и не производят выбросов.', 'Транспорт', 'easy', 8000, NULL),
('Используйте меньше бумаги', 'Печатайте с двух сторон, используйте электронные документы, сдавайте бумагу на переработку.', 'Отходы', 'easy', 4000, NULL),
('Выбирайте экологичные материалы', 'При ремонте выбирайте натуральные и переработанные материалы.', 'Быт', 'hard', 50000, NULL)
ON CONFLICT DO NOTHING;

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_eco_tips_day_of_year ON eco_tips(day_of_year);
CREATE INDEX IF NOT EXISTS idx_eco_tips_category ON eco_tips(category);
CREATE INDEX IF NOT EXISTS idx_eco_tips_difficulty ON eco_tips(difficulty);

-- Таблица для отслеживания просмотренных советов пользователями
CREATE TABLE IF NOT EXISTS user_eco_tips (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tip_id INTEGER REFERENCES eco_tips(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    liked BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, tip_id)
);

CREATE INDEX IF NOT EXISTS idx_user_eco_tips_user_id ON user_eco_tips(user_id);
CREATE INDEX IF NOT EXISTS idx_user_eco_tips_viewed_at ON user_eco_tips(viewed_at);

-- Выводим информацию о созданных советах
DO $$
BEGIN
    RAISE NOTICE 'Создано эко-советов: %', (SELECT COUNT(*) FROM eco_tips);
    RAISE NOTICE 'Советы на каждый день года готовы!';
END $$;