-- ============================================
-- БАЗА ДАННЫХ ДЛЯ ПРОЕКТА EcoSteps
-- ============================================

-- ============ ТАБЛИЦЫ ============

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

-- ============ ВОПРОСЫ В ПОДДЕРЖКУ ============
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'closed')),
    admin_response TEXT,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ АКТИВНОСТЬ ПОЛЬЗОВАТЕЛЕЙ ============
CREATE TABLE IF NOT EXISTS user_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    related_id INTEGER,
    carbon_saved INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ ЕЖЕДНЕВНЫЕ ЭКО-СОВЕТЫ ============
CREATE TABLE IF NOT EXISTS eco_tips (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    co2_impact INTEGER DEFAULT 0,
    day_of_year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ ПРОСМОТРЕННЫЕ ЭКО-СОВЕТЫ ============
CREATE TABLE IF NOT EXISTS user_eco_tips (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tip_id INTEGER REFERENCES eco_tips(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    liked BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, tip_id)
);

-- ============ ИНДЕКСЫ ============

-- Индексы для пользователей
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender_id);
CREATE INDEX IF NOT EXISTS idx_users_birthdate ON users(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_users_carbon_saved ON users(carbon_saved);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_carbon_saved_desc ON users(carbon_saved DESC);

-- Индексы для настроек
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_theme ON user_settings(theme);
CREATE INDEX IF NOT EXISTS idx_user_settings_language ON user_settings(language);

-- Индексы для команд
CREATE INDEX IF NOT EXISTS idx_teams_carbon_saved ON teams(carbon_saved);
CREATE INDEX IF NOT EXISTS idx_teams_carbon_saved_desc ON teams(carbon_saved DESC);

-- Индексы для участников команд
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Индексы для историй успеха
CREATE INDEX IF NOT EXISTS idx_stories_user ON success_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created ON success_stories(created_at);
CREATE INDEX IF NOT EXISTS idx_stories_category_date ON success_stories(category, created_at);
CREATE INDEX IF NOT EXISTS idx_stories_likes_desc ON success_stories(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_stories_carbon_saved ON success_stories(carbon_saved DESC);
CREATE INDEX IF NOT EXISTS idx_stories_carbon_saved_desc ON success_stories(carbon_saved DESC);

-- Индексы для лайков историй
CREATE INDEX IF NOT EXISTS idx_story_likes_story ON story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user ON story_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_composite ON story_likes(story_id, user_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_story_id ON story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user_id ON story_likes(user_id);

-- Индексы для достижений
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(completed);

-- Индексы для поддержки
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON support_tickets(ticket_number);

-- Индексы для активности
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

-- Индексы для эко-советов
CREATE INDEX IF NOT EXISTS idx_eco_tips_day_of_year ON eco_tips(day_of_year);
CREATE INDEX IF NOT EXISTS idx_eco_tips_category ON eco_tips(category);
CREATE INDEX IF NOT EXISTS idx_eco_tips_difficulty ON eco_tips(difficulty);
CREATE INDEX IF NOT EXISTS idx_user_eco_tips_user_id ON user_eco_tips(user_id);
CREATE INDEX IF NOT EXISTS idx_user_eco_tips_viewed_at ON user_eco_tips(viewed_at);

-- ============ ПРЕДСТАВЛЕНИЯ ============

-- Пользователи с полом
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

-- Рейтинг пользователей
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

-- Рейтинг команд
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

-- Истории с пользователями
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

-- Вопросы в поддержку с пользователями
CREATE OR REPLACE VIEW support_tickets_view AS
SELECT 
    st.*,
    u.nickname,
    u.avatar_emoji,
    u.email,
    CASE 
        WHEN st.status = 'pending' THEN 'Ожидает ответа'
        WHEN st.status = 'answered' THEN 'Отвечено'
        WHEN st.status = 'closed' THEN 'Закрыто'
        ELSE st.status
    END as status_display
FROM support_tickets st
JOIN users u ON st.user_id = u.id;

-- ============ ФУНКЦИИ И ПРОЦЕДУРЫ ============

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Функция для генерации номера заявки
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    date_part VARCHAR(8);
    seq_part VARCHAR(4);
    today_count INTEGER;
BEGIN
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    SELECT COALESCE(COUNT(*), 0) + 1 INTO today_count 
    FROM support_tickets 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    seq_part := LPAD(today_count::VARCHAR, 4, '0');
    
    RETURN 'TICKET-' || date_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql;

-- Функция для создания настроек пользователя
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Функция для логирования активности пользователя
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id INTEGER,
    p_activity_type VARCHAR(50),
    p_description TEXT,
    p_related_id INTEGER DEFAULT NULL,
    p_carbon_saved INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    INSERT INTO user_activities (user_id, activity_type, description, related_id, carbon_saved)
    VALUES (p_user_id, p_activity_type, p_description, p_related_id, p_carbon_saved);
END;
$$ LANGUAGE plpgsql;

-- Функция для получения статистики пользователя
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id INTEGER)
RETURNS TABLE(
    carbon_saved INTEGER,
    eco_level VARCHAR,
    achievements_count INTEGER,
    achievements_completed INTEGER,
    team_count INTEGER,
    stories_count INTEGER,
    total_likes INTEGER,
    support_tickets_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(u.carbon_saved, 0)::INTEGER,
        COALESCE(u.eco_level, 'Эко-новичок'),
        COUNT(DISTINCT ua.id)::INTEGER,
        COUNT(DISTINCT CASE WHEN ua.completed = true THEN ua.id END)::INTEGER,
        COUNT(DISTINCT tm.team_id)::INTEGER,
        COUNT(DISTINCT ss.id)::INTEGER,
        COALESCE(SUM(ss.likes_count), 0)::INTEGER,
        COUNT(DISTINCT st.id)::INTEGER
    FROM users u
    LEFT JOIN user_achievements ua ON u.id = ua.user_id
    LEFT JOIN team_members tm ON u.id = tm.user_id
    LEFT JOIN success_stories ss ON u.id = ss.user_id
    LEFT JOIN support_tickets st ON u.id = st.user_id
    WHERE u.id = p_user_id
    GROUP BY u.id, u.carbon_saved, u.eco_level;
END;
$$ LANGUAGE plpgsql;

-- Функция для получения активности пользователя
CREATE OR REPLACE FUNCTION get_user_activity(
    p_user_id INTEGER,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE(
    id INTEGER,
    activity_type VARCHAR,
    description TEXT,
    created_at TIMESTAMP,
    carbon_saved INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua.id,
        ua.activity_type,
        ua.description,
        ua.created_at,
        ua.carbon_saved
    FROM user_activities ua
    WHERE ua.user_id = p_user_id
    ORDER BY ua.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Функция для получения вопросов пользователя
CREATE OR REPLACE FUNCTION get_user_support_tickets(
    p_user_id INTEGER,
    p_status VARCHAR DEFAULT NULL
) RETURNS TABLE(
    id INTEGER,
    ticket_number VARCHAR,
    subject VARCHAR,
    message TEXT,
    status VARCHAR,
    admin_response TEXT,
    responded_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        st.id,
        st.ticket_number,
        st.subject,
        st.message,
        st.status,
        st.admin_response,
        st.responded_at,
        st.created_at,
        st.updated_at
    FROM support_tickets st
    WHERE st.user_id = p_user_id
    AND (p_status IS NULL OR st.status = p_status)
    ORDER BY st.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============ ТРИГГЕРЫ ============

-- Триггер для обновления updated_at в users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для обновления updated_at в user_settings
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для обновления updated_at в teams
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для обновления updated_at в success_stories
DROP TRIGGER IF EXISTS update_success_stories_updated_at ON success_stories;
CREATE TRIGGER update_success_stories_updated_at 
    BEFORE UPDATE ON success_stories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для обновления updated_at в support_tickets
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для создания настроек при регистрации нового пользователя
DROP TRIGGER IF EXISTS trigger_create_user_settings ON users;
CREATE TRIGGER trigger_create_user_settings
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_settings();

-- Триггер для обновления количества участников команд
DROP TRIGGER IF EXISTS trigger_update_team_member_count_insert ON team_members;
CREATE TRIGGER trigger_update_team_member_count_insert
    AFTER INSERT ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_team_member_count();

DROP TRIGGER IF EXISTS trigger_update_team_member_count_delete ON team_members;
CREATE TRIGGER trigger_update_team_member_count_delete
    AFTER DELETE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_team_member_count();

-- Триггер для установки номера заявки
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_ticket_number ON support_tickets;
CREATE TRIGGER trigger_set_ticket_number
    BEFORE INSERT ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();

-- Триггер для логирования создания истории
CREATE OR REPLACE FUNCTION log_story_creation()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_user_activity(
        NEW.user_id,
        'story_created',
        'Создана новая история: ' || NEW.title,
        NEW.id,
        NEW.carbon_saved
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_story_creation ON success_stories;
CREATE TRIGGER trigger_log_story_creation
    AFTER INSERT ON success_stories
    FOR EACH ROW
    EXECUTE FUNCTION log_story_creation();

-- Триггер для логирования получения достижения
CREATE OR REPLACE FUNCTION log_achievement_completion()
RETURNS TRIGGER AS $$
DECLARE
    achievement_name VARCHAR;
BEGIN
    IF NEW.completed = TRUE AND (OLD.completed IS NULL OR OLD.completed = FALSE) THEN
        SELECT name INTO achievement_name 
        FROM achievements 
        WHERE id = NEW.achievement_id;
        
        PERFORM log_user_activity(
            NEW.user_id,
            'achievement_completed',
            'Получено достижение: ' || achievement_name,
            NEW.achievement_id,
            0
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_achievement_completion ON user_achievements;
CREATE TRIGGER trigger_log_achievement_completion
    AFTER UPDATE ON user_achievements
    FOR EACH ROW
    EXECUTE FUNCTION log_achievement_completion();

-- Триггер для логирования вступления в команду
CREATE OR REPLACE FUNCTION log_team_join()
RETURNS TRIGGER AS $$
DECLARE
    team_name VARCHAR;
BEGIN
    SELECT name INTO team_name 
    FROM teams 
    WHERE id = NEW.team_id;
    
    PERFORM log_user_activity(
        NEW.user_id,
        'team_joined',
        'Вступил в команду: ' || team_name,
        NEW.team_id,
        0
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_team_join ON team_members;
CREATE TRIGGER trigger_log_team_join
    AFTER INSERT ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION log_team_join();

-- Триггер для логирования отправки вопроса в поддержку
CREATE OR REPLACE FUNCTION log_support_ticket()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_user_activity(
        NEW.user_id,
        'support_ticket',
        'Отправлен вопрос в поддержку: ' || NEW.subject,
        NEW.id,
        0
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_support_ticket ON support_tickets;
CREATE TRIGGER trigger_log_support_ticket
    AFTER INSERT ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION log_support_ticket();

-- ============ ЗАПОЛНЕНИЕ ДАННЫМИ ============

-- Заполняем справочник полов
INSERT INTO genders (code) VALUES
    ('male'),
    ('female')
ON CONFLICT (code) DO NOTHING;

-- Удаляем старых пользователей
DELETE FROM users;
ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- Создаем пользователей
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

-- Дополнительные пользователи (32 человека)
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

-- Создаем команды
DELETE FROM teams;
ALTER SEQUENCE teams_id_seq RESTART WITH 1;

INSERT INTO teams (name, description, avatar_emoji, goal_description, goal_target, goal_current, carbon_saved, member_count) VALUES 
('Зеленые Минска', 'Экологическое сообщество столицы', '🌱', 'Сэкономить 30 тонн CO₂ за год', 30000, 23400, 23400, 8),
('Эко-студенты МГКЦТ', 'Студенты за экологию', '🎓', 'Перейти на велосипеды и общественный транспорт', 25000, 18900, 18900, 6),
('Велосипедисты Гомеля', 'Велосипед вместо автомобиля', '🚴', 'Проехать 5000 км на велосипедах', 20000, 15600, 15600, 4),
('Солнечная энергия', 'Возобновляемые источники энергии', '☀️', 'Установить солнечные панели в 10 домах', 15000, 12300, 12300, 3),
('Ноль отходов', 'Минимизация отходов', '♻️', 'Сортировать мусор 100% времени', 15000, 11800, 11800, 4)
ON CONFLICT (name) DO NOTHING;

-- Создаем достижения
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

    ('solar_install', 'Солнечная энергия', 'Установить солнечные панели', 'energy', '☀️', 'count', 1, 100, 'epic'),
    ('led_bulbs_10', 'LED освещение', 'Заменить 10 ламп на LED', 'energy', '💡', 'count', 10, 20, 'common'),
    ('energy_save_100', 'Энергосбережение', 'Сэкономить 100 кВт⋅ч', 'energy', '⚡', 'count', 100, 30, 'rare'),
    ('energy_save_500', 'Энергомастер', 'Сэкономить 500 кВт⋅ч', 'energy', '⚡', 'count', 500, 75, 'epic'),
    ('renewable_30days', 'Месяц на возобновляемой энергии', 'Использовать только возобновляемую энергию 30 дней', 'energy', '🔋', 'days', 30, 100, 'epic'),

    ('recycle_first', 'Первая сортировка', 'Начать раздельный сбор мусора', 'waste', '♻️', 'count', 1, 10, 'common'),
    ('recycle_30days', 'Месяц сортировки', 'Сортировать мусор 30 дней подряд', 'waste', '♻️', 'days', 30, 30, 'common'),
    ('recycle_100days', '100 дней сортировки', 'Сортировать мусор 100 дней подряд', 'waste', '♻️', 'days', 100, 75, 'rare'),
    ('zero_waste_7', 'Неделя без отходов', 'Не производить отходы 7 дней', 'waste', '🗑️', 'days', 7, 50, 'rare'),
    ('zero_waste_30', 'Месяц без отходов', 'Не производить отходы 30 дней', 'waste', '🗑️', 'days', 30, 150, 'legendary'),
    ('compost_start', 'Компостирование', 'Начать компостировать органические отходы', 'waste', '🌱', 'count', 1, 20, 'common'),
    ('plastic_free_7', 'Неделя без пластика', 'Не использовать пластик 7 дней', 'waste', '🚫', 'days', 7, 30, 'common'),
    ('plastic_free_30', 'Месяц без пластика', 'Не использовать пластик 30 дней', 'waste', '🚫', 'days', 30, 100, 'epic'),
    ('reusable_bags_30', 'Многоразовые сумки', 'Использовать многоразовые сумки 30 раз', 'waste', '👜', 'count', 30, 20, 'common'),

    ('vegan_7', 'Неделя веганства', 'Питаться веганской пищей 7 дней', 'food', '🥗', 'days', 7, 25, 'common'),
    ('vegan_30', 'Месяц веганства', 'Питаться веганской пищей 30 дней', 'food', '🥗', 'days', 30, 75, 'rare'),
    ('vegetarian_30', 'Месяц вегетарианства', 'Питаться вегетарианской пищей 30 дней', 'food', '🥕', 'days', 30, 50, 'common'),
    ('local_food_30', 'Локальные продукты', 'Покупать только местные продукты 30 дней', 'food', '🌾', 'days', 30, 40, 'rare'),
    ('organic_30', 'Органическое питание', 'Покупать только органические продукты 30 дней', 'food', '🌿', 'days', 30, 50, 'rare'),
    ('no_meat_7', 'Неделя без мяса', 'Не есть мясо 7 дней', 'food', '🥦', 'days', 7, 15, 'common'),
    ('grow_food', 'Свой огород', 'Вырастить свои овощи', 'food', '🌱', 'count', 1, 30, 'common'),

    ('water_save_100', 'Экономия воды', 'Сэкономить 100 литров воды', 'water', '💧', 'count', 100, 20, 'common'),
    ('water_save_1000', 'Водосбережение', 'Сэкономить 1000 литров воды', 'water', '💧', 'count', 1000, 50, 'rare'),
    ('shower_5min_30', 'Быстрый душ', 'Принимать душ не более 5 минут 30 дней подряд', 'water', '🚿', 'days', 30, 40, 'common'),
    ('rainwater_collect', 'Сбор дождевой воды', 'Начать собирать дождевую воду', 'water', '🌧️', 'count', 1, 30, 'common'),

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

-- Создаем истории успеха
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

-- Создаем участников команд
DELETE FROM team_members;

INSERT INTO team_members (team_id, user_id, role) VALUES 
(1, 1, 'admin'),
(1, 2, 'member'),
(1, 3, 'member'),
(1, 4, 'member'),
(1, 5, 'member'),
(1, 6, 'member'),
(1, 7, 'member'),
(1, 8, 'member'),

(2, 9, 'admin'),
(2, 10, 'member'),
(2, 11, 'member'),
(2, 12, 'member'),
(2, 13, 'member'),
(2, 14, 'member'),

(3, 15, 'admin'),
(3, 16, 'member'),
(3, 17, 'member'),
(3, 18, 'member'),

(4, 8, 'admin'),
(4, 16, 'member'),
(4, 19, 'member'),

(5, 7, 'admin'),
(5, 14, 'member'),
(5, 19, 'member'),
(5, 20, 'member')
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Обновляем счетчики участников команд
UPDATE teams SET member_count = (
    SELECT COUNT(*) FROM team_members WHERE team_id = teams.id
);

-- Создаем настройки для всех пользователей
DO $$
BEGIN
    INSERT INTO user_settings (user_id)
    SELECT id FROM users 
    WHERE id NOT IN (SELECT user_id FROM user_settings WHERE user_id IS NOT NULL)
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Создано настроек пользователей: %', (SELECT COUNT(*) FROM user_settings);
END $$;

-- Выводим информацию о созданных данных
DO $$
BEGIN
    RAISE NOTICE 'База данных EcoSteps успешно инициализирована!';
    RAISE NOTICE 'Создано пользователей: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Создано команд: %', (SELECT COUNT(*) FROM teams);
    RAISE NOTICE 'Создано историй: %', (SELECT COUNT(*) FROM success_stories);
    RAISE NOTICE 'Администратор: admin@test.com / admin (пароль: admin123)';
END $$;