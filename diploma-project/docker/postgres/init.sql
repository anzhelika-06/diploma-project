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

-- ============ НАСТРОЙКИ ПОЛЬЗОВАТЕЛЕЙ ============
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(5) DEFAULT 'RU' CHECK (language IN ('RU', 'EN', 'BY')),
    notifications_enabled BOOLEAN DEFAULT TRUE,
    eco_tips_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT FALSE,
    privacy_level INTEGER DEFAULT 1 CHECK (privacy_level BETWEEN 1 AND 3), -- 1-публичный, 2-друзья, 3-приватный
    timezone VARCHAR(50) DEFAULT 'Europe/Minsk',
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
CREATE INDEX idx_user_settings_user ON user_settings(user_id);
CREATE INDEX idx_user_settings_theme ON user_settings(theme);
CREATE INDEX idx_user_settings_language ON user_settings(language);
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

-- ============ УДАЛЯЕМ СТАРЫХ ПОЛЬЗОВАТЕЛЕЙ ============
DELETE FROM users;
ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- ============ СОЗДАЕМ 35 ПОЛЬЗОВАТЕЛЕЙ С АНГЛИЙСКИМИ НИКНЕЙМАМИ ============
-- Пароли: admin123, user123, test123 (все содержат буквы и цифры, минимум 6 символов)

-- Администратор
INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level, avatar_emoji, is_admin, email_verified) 
SELECT 
    'admin@test.com',
    'admin',
    '$2b$10$k0JXEfGibK4fDU3mCM/adeZ4kYpilG8OgHf9YyMwb/E40i8UxFCi6',
    '1985-01-15',
    g.id,
    2500,
    'Эко-эксперт',
    '👑',
    TRUE,
    TRUE
FROM genders g WHERE g.code = 'male'
ON CONFLICT (email) DO NOTHING;

-- Основные тестовые пользователи
INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level, avatar_emoji, email_verified) 
SELECT 
    'user@test.com',
    'user',
    '$2b$10$RVRUmEU7PcnJ..sWwJq9ButuYMyWRwgSowvT98lnmgPj4NhCBYyKm',
    '1990-05-20',
    g.id,
    1800,
    'Эко-активист',
    '🌱',
    TRUE
FROM genders g WHERE g.code = 'female'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level, avatar_emoji, email_verified) 
SELECT 
    'test@test.com',
    'test',
    '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i',
    '1992-08-10',
    g.id,
    2100,
    'Эко-активист',
    '🌿',
    TRUE
FROM genders g WHERE g.code = 'male'
ON CONFLICT (email) DO NOTHING;

-- Дополнительные пользователи (32 человека) - все с паролем test123
INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level, avatar_emoji, email_verified) VALUES 
('alex.green@test.com', 'alex_green', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1988-03-15', 1, 2300, 'Эко-активист', '🌲', TRUE),
('sarah.eco@test.com', 'sarah_eco', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1995-07-22', 2, 1950, 'Эко-энтузиаст', '🌸', TRUE),
('mike.nature@test.com', 'mike_nature', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1987-11-08', 1, 2650, 'Эко-мастер', '🦋', TRUE),
('emma.clean@test.com', 'emma_clean', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1993-04-12', 2, 1750, 'Эко-энтузиаст', '♻️', TRUE),
('david.solar@test.com', 'david_solar', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1989-09-25', 1, 2850, 'Эко-мастер', '☀️', TRUE),
('lisa.bike@test.com', 'lisa_bike', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1991-12-03', 2, 2200, 'Эко-активист', '🚴', TRUE),
('john.water@test.com', 'john_water', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1986-06-18', 1, 1650, 'Эко-энтузиаст', '💧', TRUE),
('anna.forest@test.com', 'anna_forest', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1994-02-28', 2, 1850, 'Эко-энтузиаст', '🌳', TRUE),
('tom.ocean@test.com', 'tom_ocean', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1990-10-14', 1, 2400, 'Эко-активист', '🌊', TRUE),
('kate.wind@test.com', 'kate_wind', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1988-05-07', 2, 1950, 'Эко-энтузиаст', '💨', TRUE),
('peter.recycle@test.com', 'peter_recycle', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1992-08-19', 1, 1750, 'Эко-энтузиаст', '🔄', TRUE),
('maria.garden@test.com', 'maria_garden', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1987-01-11', 2, 1600, 'Эко-энтузиаст', '🌺', TRUE),
('james.energy@test.com', 'james_energy', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1985-07-04', 1, 2750, 'Эко-мастер', '⚡', TRUE),
('nina.earth@test.com', 'nina_earth', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1996-11-26', 2, 1450, 'Эко-стартер', '🌍', TRUE),
('ryan.transport@test.com', 'ryan_transport', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1989-04-16', 1, 2100, 'Эко-активист', '🚌', TRUE),
('sophie.waste@test.com', 'sophie_waste', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1993-09-02', 2, 1800, 'Эко-энтузиаст', '🗑️', TRUE),
('lucas.food@test.com', 'lucas_food', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1991-12-21', 1, 1900, 'Эко-энтузиаст', '🥗', TRUE),
('olivia.home@test.com', 'olivia_home', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1988-06-13', 2, 2050, 'Эко-активист', '🏠', TRUE),
('daniel.tech@test.com', 'daniel_tech', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1986-03-29', 1, 1700, 'Эко-энтузиаст', '💻', TRUE),
('chloe.plant@test.com', 'chloe_plant', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1995-10-05', 2, 1550, 'Эко-стартер', '🌿', TRUE),
('ethan.save@test.com', 'ethan_save', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1990-01-17', 1, 2250, 'Эко-активист', '💚', TRUE),
('grace.pure@test.com', 'grace_pure', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1992-05-23', 2, 1650, 'Эко-энтузиаст', '✨', TRUE),
('noah.green@test.com', 'noah_green', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1987-08-09', 1, 2350, 'Эко-активист', '🌱', TRUE),
('zoe.life@test.com', 'zoe_life', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1994-12-15', 2, 1750, 'Эко-энтузиаст', '🌟', TRUE),
('mason.air@test.com', 'mason_air', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1989-07-01', 1, 1950, 'Эко-энтузиаст', '🌬️', TRUE),
('lily.hope@test.com', 'lily_hope', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1991-03-27', 2, 1850, 'Эко-энтузиаст', '🌷', TRUE),
('owen.future@test.com', 'owen_future', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1988-11-12', 1, 2150, 'Эко-активист', '🔮', TRUE),
('mia.change@test.com', 'mia_change', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1993-06-08', 2, 1650, 'Эко-энтузиаст', '🔄', TRUE),
('liam.planet@test.com', 'liam_planet', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1986-02-24', 1, 2450, 'Эко-активист', '🪐', TRUE),
('ava.bright@test.com', 'ava_bright', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1995-09-30', 2, 1550, 'Эко-стартер', '💡', TRUE),
('jack.smart@test.com', 'jack_smart', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1990-04-06', 1, 1900, 'Эко-энтузиаст', '🧠', TRUE),
('ella.kind@test.com', 'ella_kind', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1992-10-18', 2, 1750, 'Эко-энтузиаст', '💝', TRUE)
ON CONFLICT (email) DO NOTHING;

-- ============ КОМАНДЫ ============
DELETE FROM teams;
ALTER SEQUENCE teams_id_seq RESTART WITH 1;

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

-- ============ ИСТОРИИ УСПЕХА ============
DELETE FROM success_stories;
ALTER SEQUENCE success_stories_id_seq RESTART WITH 1;

INSERT INTO success_stories (user_id, title, content, category, carbon_saved, likes_count) VALUES
    (1, 'Администрирование экологии', 'Как администратор EcoSteps, я помогаю тысячам людей начать свой путь к экологичной жизни. Вместе мы уже сэкономили тонны CO₂!', 'Общее', 2500, 45),
    (2, 'Мой первый год в экологии', 'Начала с малого - отказалась от пластиковых пакетов. Теперь веду полностью экологичный образ жизни и экономлю 1800 кг CO₂ в год!', 'Общее', 1800, 32),
    (3, 'Тестирование зеленых решений', 'Тестирую различные экологичные решения и делюсь опытом с сообществом. Каждое решение приносит пользу планете!', 'Общее', 2100, 28),
    (4, 'Зеленый дом alex_green', 'Превратил свой дом в экологичное пространство: солнечные панели, дождевая вода, органический сад. Экономлю 2300 кг CO₂ в год!', 'Энергия', 2300, 56),
    (5, 'Эко-блогер sarah_eco', 'Веду блог об экологии и вдохновляю людей на изменения. Мои подписчики уже сэкономили более 10 тонн CO₂!', 'Общее', 1950, 78),
    (6, 'mike_nature и дикая природа', 'Участвую в программах защиты дикой природы и восстановления лесов. Посадил 100 деревьев в этом году!', 'Природа', 2650, 43),
    (7, 'emma_clean за чистоту', 'Организовала программу раздельного сбора мусора в нашем районе. Теперь 90% отходов идет на переработку!', 'Отходы', 1750, 39),
    (8, 'Солнечная энергия david_solar', 'Установил солнечные панели и перешел на электромобиль. Мой дом производит больше энергии, чем потребляет!', 'Энергия', 2850, 67),
    (9, 'lisa_bike на велосипеде', 'Продала машину и перешла на велосипед. Проезжаю 50 км в день и чувствую себя здоровее чем когда-либо!', 'Транспорт', 2200, 51),
    (10, 'john_water экономит воду', 'Установил систему сбора дождевой воды и экономные смесители. Сократил потребление воды на 60%!', 'Вода', 1650, 34),
    (11, 'anna_forest и городской лес', 'Создала инициативу по озеленению города. Мы посадили 500 деревьев и создали 10 парков!', 'Природа', 1850, 62),
    (12, 'tom_ocean защищает океаны', 'Участвую в очистке береговой линии и защите морской жизни. Очистили 5 км пляжей от пластика!', 'Отходы', 2400, 48),
    (13, 'kate_wind и ветровая энергия', 'Установила небольшую ветровую турбину дома. Генерирую чистую энергию даже в безветренные дни!', 'Энергия', 1950, 35),
    (14, 'peter_recycle перерабатывает все', 'Довел переработку отходов до 95%. Создал систему компостирования и обмена вещами в районе.', 'Отходы', 1750, 41),
    (15, 'maria_garden выращивает еду', 'Создала органический сад на крыше. Выращиваю 80% овощей для семьи без химикатов!', 'Питание', 1600, 37),
    (16, 'james_energy и умный дом', 'Создал энергоэффективный умный дом с автоматическим управлением освещением и отоплением.', 'Энергия', 2750, 59),
    (17, 'nina_earth начинает с малого', 'Только начала свой эко-путь, но уже вижу результаты! Отказалась от пластика и начала компостировать.', 'Общее', 1450, 23),
    (18, 'ryan_transport и общественный транспорт', 'Отказался от личного авто в пользу общественного транспорта и велосипеда. Экономлю 2100 кг CO₂ в год!', 'Транспорт', 2100, 44),
    (19, 'sophie_waste против отходов', 'Перешла на философию "ноль отходов". За год сократила мусор на 90% и вдохновила 50 семей!', 'Отходы', 1800, 53),
    (20, 'lucas_food и растительное питание', 'Перешел на растительное питание и начал выращивать микрозелень дома. Здоровье улучшилось, планета благодарна!', 'Питание', 1900, 46),
    (21, 'olivia_home и экодом', 'Построила дом из экологичных материалов с системой рекуперации тепла и дождевой воды.', 'Быт', 2050, 58),
    (22, 'daniel_tech и зеленые технологии', 'Разрабатываю приложения для экологии и создаю IoT-решения для умного дома.', 'Общее', 1700, 31),
    (23, 'chloe_plant сажает растения', 'Превратила балкон в мини-джунгли и создала сеть обмена растениями в городе.', 'Природа', 1550, 29),
    (24, 'ethan_save экономит энергию', 'Провел энергоаудит дома и сократил потребление на 40% простыми изменениями.', 'Энергия', 2250, 42),
    (25, 'grace_pure за чистоту', 'Создала линейку натуральной косметики и моющих средств из растительных компонентов.', 'Быт', 1650, 36)
ON CONFLICT DO NOTHING;

-- ============ УЧАСТНИКИ КОМАНД ============
DELETE FROM team_members;

INSERT INTO team_members (team_id, user_id, role) VALUES 
-- Зеленые Минска (команда 1) - 8 участников
(1, 1, 'admin'),   -- admin
(1, 2, 'member'),  -- user
(1, 3, 'member'),  -- test
(1, 4, 'member'),  -- alex_green
(1, 5, 'member'),  -- sarah_eco
(1, 6, 'member'),  -- mike_nature
(1, 7, 'member'),  -- emma_clean
(1, 8, 'member'),  -- david_solar

-- Эко-студенты МГКЦТ (команда 2) - 6 участников
(2, 9, 'admin'),   -- lisa_bike
(2, 10, 'member'), -- john_water
(2, 11, 'member'), -- anna_forest
(2, 12, 'member'), -- tom_ocean
(2, 13, 'member'), -- kate_wind
(2, 14, 'member'), -- peter_recycle

-- Велосипедисты Гомеля (команда 3) - 4 участника
(3, 15, 'admin'),  -- maria_garden
(3, 16, 'member'), -- james_energy
(3, 17, 'member'), -- nina_earth
(3, 18, 'member'), -- ryan_transport

-- Солнечная энергия (команда 4) - 3 участника
(4, 8, 'admin'),   -- david_solar
(4, 16, 'member'), -- james_energy
(4, 19, 'member'), -- sophie_waste

-- Ноль отходов (команда 5) - 4 участника
(5, 7, 'admin'),   -- emma_clean
(5, 14, 'member'), -- peter_recycle
(5, 19, 'member'), -- sophie_waste
(5, 20, 'member')  -- lucas_food
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

-- Функция для автоматического создания настроек пользователя
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления количества участников
DROP TRIGGER IF EXISTS trigger_update_team_member_count_insert ON team_members;
CREATE TRIGGER trigger_update_team_member_count_insert
    AFTER INSERT ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_team_member_count();

DROP TRIGGER IF EXISTS trigger_update_team_member_count_delete ON team_members;
CREATE TRIGGER trigger_update_team_member_count_delete
    AFTER DELETE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_team_member_count();

-- Триггер для создания настроек при регистрации нового пользователя
DROP TRIGGER IF EXISTS trigger_create_user_settings ON users;
CREATE TRIGGER trigger_create_user_settings
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_settings();

-- Триггер для обновления updated_at в user_settings
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ЗАПОЛНЕНИЕ ДАННЫМИ
-- ============================================

-- ============ ПОЛЫ ============
INSERT INTO genders (code) VALUES 
('male'), 
('female')
ON CONFLICT (code) DO NOTHING;

-- ============ ПОЛЬЗОВАТЕЛИ УЖЕ СОЗДАНЫ ============
-- Все пользователи созданы выше с правильными английскими никнеймами

-- ============ КОМАНДЫ ОБНОВЛЕНЫ ============
-- Команды уже созданы выше с правильными данными

-- ============ УЧАСТНИКИ КОМАНД ОБНОВЛЕНЫ ============
-- Участники команд уже созданы выше с правильными ID пользователей

-- ============ ИСТОРИИ УСПЕХА ОБНОВЛЕНЫ ============
-- Истории успеха уже созданы выше с правильными ID пользователей

-- ============ ЛАЙКИ ИСТОРИЙ ============
DELETE FROM story_likes;

-- Создаем лайки для историй (распределяем лайки между пользователями)
INSERT INTO story_likes (story_id, user_id) VALUES 
-- Лайки для истории администратора (story_id=1, 45 лайков)
(1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15), (1, 16), (1, 17), (1, 18), (1, 19), (1, 20), (1, 21), (1, 22), (1, 23), (1, 24), (1, 25), (1, 26), (1, 27), (1, 28), (1, 29), (1, 30), (1, 31), (1, 32), (1, 33), (1, 34), (1, 35), (1, 4), (1, 6), (1, 8), (1, 10), (1, 12), (1, 14), (1, 16), (1, 18), (1, 20), (1, 22), (1, 24),

-- Лайки для популярной истории Сары (story_id=5, 78 лайков)
(5, 1), (5, 3), (5, 4), (5, 6), (5, 7), (5, 8), (5, 9), (5, 10), (5, 11), (5, 12), (5, 13), (5, 14), (5, 15), (5, 16), (5, 17), (5, 18), (5, 19), (5, 20), (5, 21), (5, 22), (5, 23), (5, 24), (5, 25), (5, 26), (5, 27), (5, 28), (5, 29), (5, 30), (5, 31), (5, 32), (5, 33), (5, 34), (5, 35), (5, 2), (5, 4), (5, 6), (5, 8), (5, 10), (5, 12), (5, 14), (5, 16), (5, 18), (5, 20), (5, 22), (5, 24), (5, 26), (5, 28), (5, 30), (5, 32), (5, 34), (5, 1), (5, 3), (5, 7), (5, 9), (5, 11), (5, 13), (5, 15), (5, 17), (5, 19), (5, 21), (5, 23), (5, 25), (5, 27), (5, 29), (5, 31), (5, 33), (5, 35), (5, 2), (5, 4), (5, 6), (5, 8), (5, 10), (5, 12), (5, 14), (5, 16), (5, 18), (5, 20), (5, 22),

-- Лайки для истории Дэвида (story_id=8, 67 лайков)
(8, 1), (8, 2), (8, 3), (8, 4), (8, 5), (8, 6), (8, 7), (8, 9), (8, 10), (8, 11), (8, 12), (8, 13), (8, 14), (8, 15), (8, 16), (8, 17), (8, 18), (8, 19), (8, 20), (8, 21), (8, 22), (8, 23), (8, 24), (8, 25), (8, 26), (8, 27), (8, 28), (8, 29), (8, 30), (8, 31), (8, 32), (8, 33), (8, 34), (8, 35), (8, 1), (8, 3), (8, 5), (8, 7), (8, 9), (8, 11), (8, 13), (8, 15), (8, 17), (8, 19), (8, 21), (8, 23), (8, 25), (8, 27), (8, 29), (8, 31), (8, 33), (8, 35), (8, 2), (8, 4), (8, 6), (8, 10), (8, 12), (8, 14), (8, 16), (8, 18), (8, 20), (8, 22), (8, 24), (8, 26), (8, 28)

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
    RAISE NOTICE 'Администратор: admin@test.com / admin (пароль: admin123)';
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

-- ============ СОЗДАНИЕ НАСТРОЕК ДЛЯ СУЩЕСТВУЮЩИХ ПОЛЬЗОВАТЕЛЕЙ ============
DO $$
BEGIN
    -- Создаем настройки для всех существующих пользователей
    INSERT INTO user_settings (user_id)
    SELECT id FROM users 
    WHERE id NOT IN (SELECT user_id FROM user_settings WHERE user_id IS NOT NULL)
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE '=== НАСТРОЙКИ ПОЛЬЗОВАТЕЛЕЙ ===';
    RAISE NOTICE 'Создано настроек пользователей: %', (SELECT COUNT(*) FROM user_settings);
    RAISE NOTICE 'Настройки будут автоматически создаваться для новых пользователей';
END $$;