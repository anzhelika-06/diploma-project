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
    carbon_saved INTEGER DEFAULT 0,
    eco_level VARCHAR(50) DEFAULT 'Эко-новичок',
    avatar_emoji VARCHAR(10) DEFAULT '🌱',
    email_verified BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE, 
    ban_reason TEXT,
    ban_expires_at TIMESTAMP DEFAULT NULL,
    ban_count INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT FALSE,
    eco_coins INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL
);

-- ============ ИСТОРИЯ БАНОВ ПОЛЬЗОВАТЕЛЕЙ ============
CREATE TABLE IF NOT EXISTS ban_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    duration_hours INTEGER,
    is_permanent BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unbanned_at TIMESTAMP DEFAULT NULL,
    unban_reason TEXT,
    unbanned_by INTEGER REFERENCES users(id)
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
    privacy_level INTEGER DEFAULT 1 CHECK (privacy_level BETWEEN 1 AND 3),
    timezone VARCHAR(50) DEFAULT 'Europe/Minsk',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ КОДЫ ПОДТВЕРЖДЕНИЯ EMAIL ============
CREATE TABLE IF NOT EXISTS email_verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
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
    goal_description TEXT,
    goal_target INTEGER,
    goal_current INTEGER DEFAULT 0,
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

-- Проверьте структуру таблицы success_stories
CREATE TABLE IF NOT EXISTS success_stories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'other',
  carbon_saved DECIMAL(10, 2) DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'published')),
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
    category VARCHAR(50) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'first_login', 'daily_login', 'story_created', 'comment_added' и т.д.
    requirement_type VARCHAR(50) NOT NULL CHECK (requirement_type IN ('count', 'streak', 'value', 'boolean')),
    requirement_value INTEGER NOT NULL,
    points INTEGER DEFAULT 10,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    -- Дополнительные параметры
    is_active BOOLEAN DEFAULT TRUE, -- Можно отключать достижения
    is_hidden BOOLEAN DEFAULT FALSE, -- Скрытые достижения
    sort_order INTEGER DEFAULT 0, -- Порядок отображения
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ ДОСТИЖЕНИЯ ПОЛЬЗОВАТЕЛЕЙ ============
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    current_value INTEGER DEFAULT 0, 
    completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    claimed_at TIMESTAMP,
    metadata JSONB DEFAULT '{}', -- Хранение дополнительной информации
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- ============ ИСТОРИЯ ЭКОИНОВ ============
CREATE TABLE IF NOT EXISTS eco_coins_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ ИСТОРИЯ СОБЫТИЙ ============
CREATE TABLE IF NOT EXISTS achievement_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
CREATE INDEX IF NOT EXISTS idx_users_carbon_saved ON users(carbon_saved);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_eco_coins_history_user_id ON eco_coins_history(user_id);
CREATE INDEX IF NOT EXISTS idx_eco_coins_history_achievement_id ON eco_coins_history(achievement_id);
-- Индексы для истории банов
CREATE INDEX IF NOT EXISTS idx_ban_history_user_id ON ban_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ban_history_created_by ON ban_history(created_by);
CREATE INDEX IF NOT EXISTS idx_ban_history_unbanned_at ON ban_history(unbanned_at);
CREATE INDEX IF NOT EXISTS idx_ban_history_created_at ON ban_history(created_at);
-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_achievements_event_type ON achievements(event_type);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(completed);
CREATE INDEX IF NOT EXISTS idx_achievement_events_user_id ON achievement_events(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_events_event_type ON achievement_events(event_type);
CREATE INDEX IF NOT EXISTS idx_eco_coins_history_user_id ON eco_coins_history(user_id);
CREATE INDEX IF NOT EXISTS idx_eco_coins_history_achievement_id ON eco_coins_history(achievement_id);

-- Индексы для настроек
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

-- Индексы для команд
CREATE INDEX IF NOT EXISTS idx_teams_carbon_saved ON teams(carbon_saved);

-- Индексы для участников команд
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- Индексы для историй успеха
CREATE INDEX IF NOT EXISTS idx_stories_user ON success_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created ON success_stories(created_at);

-- Индексы для лайков историй
CREATE INDEX IF NOT EXISTS idx_story_likes_story ON story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user ON story_likes(user_id);

-- Индексы для достижений
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(completed);

-- Индексы для поддержки
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);

-- Индексы для активности
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

-- Индексы для эко-советов
CREATE INDEX IF NOT EXISTS idx_eco_tips_day_of_year ON eco_tips(day_of_year);
CREATE INDEX IF NOT EXISTS idx_user_eco_tips_user_id ON user_eco_tips(user_id);
-- Создайте индекс для ускорения запросов историй
CREATE INDEX IF NOT EXISTS idx_success_stories_user_id ON success_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_success_stories_status ON success_stories(status);
CREATE INDEX IF NOT EXISTS idx_success_stories_category ON success_stories(category);
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
    u.is_banned,
    u.ban_expires_at,
    u.ban_count,
    u.is_admin,
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
WHERE u.deleted_at IS NULL
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
WHERE u.deleted_at IS NULL
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
JOIN users u ON st.user_id = u.id
WHERE u.deleted_at IS NULL;

-- Детали банов пользователей
CREATE OR REPLACE VIEW ban_details_view AS
SELECT 
    u.id as user_id,
    u.email,
    u.nickname,
    u.is_banned,
    bh.id as ban_history_id,
    bh.reason,
    bh.duration_hours,
    bh.is_permanent,
    bh.created_at as ban_created_at,
    bh.created_by as banned_by_admin_id,
    admin_user.nickname as banned_by_admin_nickname,
    CASE 
        WHEN bh.is_permanent THEN NULL
        WHEN bh.duration_hours IS NOT NULL THEN 
            bh.created_at + (bh.duration_hours || ' hours')::INTERVAL
        ELSE u.ban_expires_at
    END as calculated_expires_at,
    bh.unbanned_at,
    bh.unban_reason,
    u.ban_count
FROM users u
LEFT JOIN ban_history bh ON u.id = bh.user_id AND bh.unbanned_at IS NULL
LEFT JOIN users admin_user ON bh.created_by = admin_user.id
WHERE u.is_banned = TRUE;

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
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.team_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE teams 
        SET member_count = (
            SELECT COUNT(*) 
            FROM team_members 
            WHERE team_id = OLD.team_id
        ),
        updated_at = CURRENT_TIMESTAMP
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
    support_tickets_count INTEGER,
    ban_count INTEGER
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
        COUNT(DISTINCT st.id)::INTEGER,
        COALESCE(u.ban_count, 0)::INTEGER
    FROM users u
    LEFT JOIN user_achievements ua ON u.id = ua.user_id
    LEFT JOIN team_members tm ON u.id = tm.user_id
    LEFT JOIN success_stories ss ON u.id = ss.user_id
    LEFT JOIN support_tickets st ON u.id = st.user_id
    WHERE u.id = p_user_id AND u.deleted_at IS NULL
    GROUP BY u.id, u.carbon_saved, u.eco_level, u.ban_count;
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

-- Функция для получения деталей бана пользователя
CREATE OR REPLACE FUNCTION get_user_ban_details(p_user_id INTEGER)
RETURNS TABLE(
    ban_id INTEGER,
    reason TEXT,
    duration_hours INTEGER,
    is_permanent BOOLEAN,
    created_at TIMESTAMP,
    created_by INTEGER,
    admin_email VARCHAR,
    admin_nickname VARCHAR,
    expires_at TIMESTAMP,
    unbanned_at TIMESTAMP,
    unban_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bh.id as ban_id,
        COALESCE(bh.reason, u.ban_reason) as reason,
        bh.duration_hours,
        COALESCE(bh.is_permanent, FALSE) as is_permanent,
        COALESCE(bh.created_at, u.created_at) as created_at,
        bh.created_by,
        admin_user.email as admin_email,
        admin_user.nickname as admin_nickname,
        CASE 
            WHEN bh.is_permanent THEN NULL
            WHEN bh.duration_hours IS NOT NULL THEN 
                bh.created_at + (bh.duration_hours || ' hours')::INTERVAL
            ELSE u.ban_expires_at
        END as expires_at,
        bh.unbanned_at,
        bh.unban_reason
    FROM users u
    LEFT JOIN ban_history bh ON u.id = bh.user_id AND bh.unbanned_at IS NULL
    LEFT JOIN users admin_user ON bh.created_by = admin_user.id
    WHERE u.id = p_user_id AND u.is_banned = TRUE
    ORDER BY bh.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Функция для логирования создания истории успеха
CREATE OR REPLACE FUNCTION log_story_creation()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_user_activity(
        NEW.user_id,
        'story_created',
        'Создана новая история: ' || NEW.title,
        NEW.id,
        NEW.carbon_saved::INTEGER  -- Преобразуем DECIMAL в INTEGER
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Функция для логирования получения достижения
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

-- Функция для логирования вступления в команду
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

-- Функция для логирования отправки вопроса в поддержку
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

-- Процедура для бана пользователя
CREATE OR REPLACE PROCEDURE ban_user(
    p_user_id INTEGER,
    p_admin_id INTEGER,
    p_reason TEXT,
    p_duration_hours INTEGER DEFAULT NULL,
    p_is_permanent BOOLEAN DEFAULT FALSE
) AS $$
DECLARE
    v_expires_at TIMESTAMP;
BEGIN
    -- Рассчитываем дату окончания бана
    IF p_is_permanent THEN
        v_expires_at := NULL;
    ELSIF p_duration_hours IS NOT NULL THEN
        v_expires_at := CURRENT_TIMESTAMP + (p_duration_hours || ' hours')::INTERVAL;
    ELSE
        v_expires_at := NULL;
    END IF;
    
    -- Обновляем данные пользователя
    UPDATE users 
    SET 
        is_banned = TRUE,
        ban_reason = p_reason,
        ban_expires_at = v_expires_at,
        ban_count = COALESCE(ban_count, 0) + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    -- Добавляем запись в историю банов
    INSERT INTO ban_history (user_id, reason, duration_hours, is_permanent, created_by)
    VALUES (p_user_id, p_reason, p_duration_hours, p_is_permanent, p_admin_id);
    
    -- Логируем активность
    PERFORM log_user_activity(
        p_user_id,
        'user_banned',
        'Пользователь забанен: ' || p_reason,
        p_user_id,
        0
    );
END;
$$ LANGUAGE plpgsql;

-- Процедура для разбана пользователя
CREATE OR REPLACE PROCEDURE unban_user(
    p_user_id INTEGER,
    p_admin_id INTEGER,
    p_reason TEXT DEFAULT NULL
) AS $$
BEGIN
    -- Обновляем данные пользователя
    UPDATE users 
    SET 
        is_banned = FALSE,
        ban_reason = NULL,
        ban_expires_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    -- Обновляем запись в истории банов
    UPDATE ban_history 
    SET 
        unbanned_at = CURRENT_TIMESTAMP,
        unban_reason = p_reason,
        unbanned_by = p_admin_id
    WHERE user_id = p_user_id AND unbanned_at IS NULL;
    
    -- Логируем активность
    PERFORM log_user_activity(
        p_user_id,
        'user_unbanned',
        'Пользователь разбанен: ' || COALESCE(p_reason, 'Без указания причины'),
        p_user_id,
        0
    );
END;
$$ LANGUAGE plpgsql;

-- Процедура для добавления пользователя в команду
CREATE OR REPLACE PROCEDURE add_user_to_team(
    p_user_id INTEGER,
    p_team_id INTEGER,
    p_role VARCHAR DEFAULT 'member'
) AS $$
BEGIN
    -- Проверяем, существует ли уже связь
    IF EXISTS (SELECT 1 FROM team_members WHERE user_id = p_user_id AND team_id = p_team_id) THEN
        RAISE EXCEPTION 'Пользователь уже состоит в этой команде';
    END IF;
    
    -- Добавляем пользователя в команду
    INSERT INTO team_members (user_id, team_id, role)
    VALUES (p_user_id, p_team_id, p_role);
    
    -- Логируем активность
    PERFORM log_user_activity(
        p_user_id,
        'team_joined',
        'Присоединился к команде с ролью: ' || p_role,
        p_team_id,
        0
    );
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
-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_achievements_updated_at 
    BEFORE UPDATE ON achievements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_achievements_updated_at 
    BEFORE UPDATE ON user_achievements 
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
DROP TRIGGER IF EXISTS trigger_set_ticket_number ON support_tickets;
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
    BEFORE INSERT ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();

-- Триггер для логирования создания истории
DROP TRIGGER IF EXISTS trigger_log_story_creation ON success_stories;
CREATE TRIGGER trigger_log_story_creation
    AFTER INSERT ON success_stories
    FOR EACH ROW
    EXECUTE FUNCTION log_story_creation();

-- Триггер для логирования получения достижения
DROP TRIGGER IF EXISTS trigger_log_achievement_completion ON user_achievements;
CREATE TRIGGER trigger_log_achievement_completion
    AFTER UPDATE ON user_achievements
    FOR EACH ROW
    EXECUTE FUNCTION log_achievement_completion();

-- Триггер для логирования вступления в команду
DROP TRIGGER IF EXISTS trigger_log_team_join ON team_members;
CREATE TRIGGER trigger_log_team_join
    AFTER INSERT ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION log_team_join();

-- Триггер для логирования отправки вопроса в поддержку
DROP TRIGGER IF EXISTS trigger_log_support_ticket ON support_tickets;
CREATE TRIGGER trigger_log_support_ticket
    AFTER INSERT ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION log_support_ticket();

-- Функция для автоматического разбана пользователей при истечении срока
CREATE OR REPLACE FUNCTION auto_unban_users()
RETURNS TRIGGER AS $$
BEGIN
    -- Разбаниваем пользователей, у которых истек срок бана
    UPDATE users u
    SET 
        is_banned = FALSE,
        ban_reason = NULL,
        ban_expires_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE u.is_banned = TRUE 
        AND u.ban_expires_at IS NOT NULL 
        AND u.ban_expires_at <= CURRENT_TIMESTAMP
        AND NOT EXISTS (
            SELECT 1 FROM ban_history bh 
            WHERE bh.user_id = u.id 
            AND bh.unbanned_at IS NULL 
            AND bh.is_permanent = TRUE
        );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Обновляем триггер для updated_at если он есть
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
-- Этот триггер можно запускать периодически через cron
-- Для примера создадим функцию, которую можно вызывать по расписанию
CREATE OR REPLACE FUNCTION check_and_unban_expired()
RETURNS INTEGER AS $$
DECLARE
    v_unbanned_count INTEGER;
BEGIN
    WITH unbanned AS (
        UPDATE users u
        SET 
            is_banned = FALSE,
            ban_reason = NULL,
            ban_expires_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE u.is_banned = TRUE 
            AND u.ban_expires_at IS NOT NULL 
            AND u.ban_expires_at <= CURRENT_TIMESTAMP
            AND NOT EXISTS (
                SELECT 1 FROM ban_history bh 
                WHERE bh.user_id = u.id 
                AND bh.unbanned_at IS NULL 
                AND bh.is_permanent = TRUE
            )
        RETURNING id
    )
    SELECT COUNT(*) INTO v_unbanned_count FROM unbanned;
    
    RETURN v_unbanned_count;
END;
$$ LANGUAGE plpgsql;

-- ============ ЗАПОЛНЕНИЕ ДАННЫМИ ============

-- Заполняем справочник полов
INSERT INTO genders (code) VALUES
    ('male'),
    ('female')
ON CONFLICT (code) DO NOTHING;

-- Добавляем пользователей, если их еще нет
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
ON CONFLICT (email) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    updated_at = CURRENT_TIMESTAMP;

-- Основные тестовые пользователи (3 пользователя)
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
ON CONFLICT (email) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    carbon_saved = EXCLUDED.carbon_saved,
    updated_at = CURRENT_TIMESTAMP;

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
ON CONFLICT (email) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    carbon_saved = EXCLUDED.carbon_saved,
    updated_at = CURRENT_TIMESTAMP;

-- Дополнительные пользователи (32 человека) - ИТОГО 35 пользователей
INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level, avatar_emoji, email_verified) VALUES 
('alex.green@test.com', 'alex_green', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1988-03-15', 1, 2300, 'Эко-активист', '🌱', TRUE),
('sarah.eco@test.com', 'sarah_eco', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1995-07-22', 2, 1950, 'Эко-энтузиаст', '🍀', TRUE),
('mike.nature@test.com', 'mike_nature', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1987-11-08', 1, 2650, 'Эко-мастер', '🌱', TRUE),
('emma.clean@test.com', 'emma_clean', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1993-04-12', 2, 1750, 'Эко-энтузиаст', '🍀', TRUE),
('david.solar@test.com', 'david_solar', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1989-09-25', 1, 2850, 'Эко-мастер', '🌱', TRUE),
('lisa.bike@test.com', 'lisa_bike', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1991-12-03', 2, 2200, 'Эко-активист', '🌱', TRUE),
('john.water@test.com', 'john_water', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1986-06-18', 1, 1650, 'Эко-энтузиаст', '🍀', TRUE),
('anna.forest@test.com', 'anna_forest', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1994-02-28', 2, 1850, 'Эко-энтузиаст', '🍀', TRUE),
('tom.ocean@test.com', 'tom_ocean', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1990-10-14', 1, 2400, 'Эко-активист', '🌱', TRUE),
('kate.wind@test.com', 'kate_wind', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1988-05-07', 2, 1950, 'Эко-энтузиаст', '🍀', TRUE),
('peter.recycle@test.com', 'peter_recycle', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1992-08-19', 1, 1750, 'Эко-энтузиаст', '🍀', TRUE),
('maria.garden@test.com', 'maria_garden', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1987-01-11', 2, 1600, 'Эко-энтузиаст', '🍀', TRUE),
('james.energy@test.com', 'james_energy', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1985-07-04', 1, 2750, 'Эко-мастер', '🌱', TRUE),
('nina.earth@test.com', 'nina_earth', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1996-11-26', 2, 1450, 'Эко-стартер', '🌾', TRUE),
('ryan.transport@test.com', 'ryan_transport', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1989-04-16', 1, 2100, 'Эко-активист', '🌱', TRUE),
('sophie.waste@test.com', 'sophie_waste', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1993-09-02', 2, 1800, 'Эко-энтузиаст', '🍀', TRUE),
('lucas.food@test.com', 'lucas_food', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1991-12-21', 1, 1900, 'Эко-энтузиаст', '🍀', TRUE),
('olivia.home@test.com', 'olivia_home', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1988-06-13', 2, 2050, 'Эко-активист', '🌱', TRUE),
('daniel.tech@test.com', 'daniel_tech', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1986-03-29', 1, 1700, 'Эко-энтузиаст', '🍀', TRUE),
('chloe.plant@test.com', 'chloe_plant', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1995-10-05', 2, 1550, 'Эко-стартер', '🌾', TRUE),
('ethan.save@test.com', 'ethan_save', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1990-01-17', 1, 2250, 'Эко-активист', '🌱', TRUE),
('grace.pure@test.com', 'grace_pure', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1992-05-23', 2, 1650, 'Эко-энтузиаст', '🍀', TRUE),
('noah.green@test.com', 'noah_green', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1987-08-09', 1, 2350, 'Эко-активист', '🌱', TRUE),
('zoe.life@test.com', 'zoe_life', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1994-12-15', 2, 1750, 'Эко-энтузиаст', '🍀', TRUE),
('mason.air@test.com', 'mason_air', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1989-07-01', 1, 1950, 'Эко-энтузиаст', '🍀', TRUE),
('lily.hope@test.com', 'lily_hope', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1991-03-27', 2, 1850, 'Эко-энтузиаст', '🍀', TRUE),
('owen.future@test.com', 'owen_future', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1988-11-12', 1, 2150, 'Эко-активист', '🌱', TRUE),
('mia.change@test.com', 'mia_change', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1993-06-08', 2, 1650, 'Эко-энтузиаст', '🍀', TRUE),
('liam.planet@test.com', 'liam_planet', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1986-02-24', 1, 2450, 'Эко-активист', '🌱', TRUE),
('ava.bright@test.com', 'ava_bright', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1995-09-30', 2, 1550, 'Эко-стартер', '🌾', TRUE),
('jack.smart@test.com', 'jack_smart', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1990-04-06', 1, 1900, 'Эко-энтузиаст', '🍀', TRUE),
('ella.kind@test.com', 'ella_kind', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1992-10-18', 2, 1750, 'Эко-энтузиаст', '🍀', TRUE)
ON CONFLICT (email) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    carbon_saved = EXCLUDED.carbon_saved,
    updated_at = CURRENT_TIMESTAMP;

-- Добавляем несколько забаненных пользователей для тестирования
INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id, carbon_saved, eco_level, avatar_emoji, is_banned, ban_reason, ban_expires_at, ban_count, email_verified) 
VALUES 
('banned1@test.com', 'banned_user1', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1990-01-01', 1, 500, 'Эко-новичок', '🚫', TRUE, 'Нарушение правил сообщества', CURRENT_TIMESTAMP + INTERVAL '7 days', 1, TRUE),
('banned2@test.com', 'banned_user2', '$2b$10$W1Lj9DfGUuv9VKgs6twu1.BLmNRW.fXAGupsaRICroTbH4cHFta/i', '1992-02-02', 2, 300, 'Эко-новичок', '🚫', TRUE, 'Спам', NULL, 2, TRUE)
ON CONFLICT (email) DO UPDATE SET
    is_banned = EXCLUDED.is_banned,
    ban_reason = EXCLUDED.ban_reason,
    ban_expires_at = EXCLUDED.ban_expires_at,
    updated_at = CURRENT_TIMESTAMP;

-- Добавляем записи в историю банов
INSERT INTO ban_history (user_id, reason, duration_hours, is_permanent, created_by) 
SELECT u.id, 'Нарушение правил сообщества', 168, FALSE, 1 
FROM users u WHERE u.email = 'banned1@test.com'
ON CONFLICT DO NOTHING;

INSERT INTO ban_history (user_id, reason, duration_hours, is_permanent, created_by) 
SELECT u.id, 'Спам', NULL, TRUE, 1 
FROM users u WHERE u.email = 'banned2@test.com'
ON CONFLICT DO NOTHING;

-- Создаем команды
INSERT INTO teams (name, description, avatar_emoji, goal_description, goal_target, goal_current, carbon_saved, member_count) VALUES 
('Зеленые Минска', 'Экологическое сообщество столицы', '🌱', 'Сэкономить 30 тонн CO₂ за год', 30000, 23400, 23400, 8),
('Эко-студенты МГКЦТ', 'Студенты за экологию', '🎓', 'Перейти на велосипеды и общественный транспорт', 25000, 18900, 18900, 6),
('Велосипедисты Гомеля', 'Велосипед вместо автомобиля', '🚴', 'Проехать 5000 км на велосипедах', 20000, 15600, 15600, 4),
('Солнечная энергия', 'Возобновляемые источники энергии', '☀️', 'Установить солнечные панели в 10 домах', 15000, 12300, 12300, 3),
('Ноль отходов', 'Минимизация отходов', '♻️', 'Сортировать мусор 100% времени', 15000, 11800, 11800, 4)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    goal_current = EXCLUDED.goal_current,
    carbon_saved = EXCLUDED.carbon_saved,
    updated_at = CURRENT_TIMESTAMP;

-- Создаем участников команд (используем существующих пользователей)
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

(4, 19, 'admin'),
(4, 20, 'member'),
(4, 21, 'member'),

(5, 22, 'admin'),
(5, 23, 'member'),
(5, 24, 'member'),
(5, 25, 'member')
ON CONFLICT (team_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    joined_at = CASE WHEN EXCLUDED.role != team_members.role THEN CURRENT_TIMESTAMP ELSE team_members.joined_at END;

-- Обновляем счетчики участников команд
UPDATE teams SET member_count = (
    SELECT COUNT(*) FROM team_members WHERE team_id = teams.id
);

-- Создаем достижения для EcoSteps (исправленный)
INSERT INTO achievements (
    code, 
    name, 
    description, 
    category, 
    icon, 
    event_type,
    requirement_type, 
    requirement_value, 
    points, 
    rarity,
    is_hidden,
    sort_order
) VALUES
    -- Достижения для регистрации 
    ('first_login', 'Добро пожаловать!', 'Зарегистрируйтесь в системе', 'registration', '🎉', 'first_login', 'boolean', 1, 50, 'common', false, 1),
    -- Достижения для историй (создание)
    ('first_story', 'Первый рассказ', 'Напишите свою первую историю', 'stories', '✍️', 'story_created', 'count', 1, 100, 'rare', false, 10),
    ('story_5', 'Рассказчик', 'Напишите 5 историй', 'stories', '📚', 'story_created', 'count', 5, 250, 'epic', false, 11),
    ('story_10', 'Опытный писатель', 'Напишите 10 историй', 'stories', '📖', 'story_created', 'count', 10, 400, 'epic', false, 12),
    ('story_20', 'Мастер слов', 'Напишите 20 историй', 'stories', '🏰', 'story_created', 'count', 20, 500, 'legendary', false, 13),
    
    -- Достижения для лайков историй
    ('first_like', 'Первая оценка', 'Поставьте первый лайк истории', 'likes', '❤️', 'story_liked', 'count', 1, 15, 'common', false, 20),
    ('like_10', 'Активный читатель', 'Поставьте 10 лайков историям', 'likes', '👍', 'story_liked', 'count', 10, 50, 'common', false, 21),
    ('like_50', 'Щедрый ценитель', 'Поставьте 50 лайков', 'likes', '👏', 'story_liked', 'count', 50, 150, 'epic', false, 22),
    ('like_100', 'Эксперт оценок', 'Поставьте 100 лайков историям', 'likes', '🏆', 'story_liked', 'count', 100, 300, 'legendary', false, 23),
    
    -- Достижения для получения лайков на свои истории
    ('story_popular_5', 'Популярность', 'Ваша история получила 5 лайков', 'popularity', '⭐', 'story_received_like', 'value', 5, 100, 'rare', false, 30),
    ('story_popular_10', 'Звезда', 'Ваша история получила 10 лайков', 'popularity', '🌟', 'story_received_like', 'value', 10, 200, 'epic', false, 31),
    ('story_popular_25', 'Вирусная история', 'Ваша история получила 25 лайков', 'popularity', '🔥', 'story_received_like', 'value', 25, 400, 'legendary', false, 32),
    
    -- Достижения для экономии CO₂
    ('carbon_100', 'Первые 100 кг', 'Сэкономить 100 кг CO₂', 'carbon', '🌍', 'carbon_saved', 'value', 100, 25, 'common', false, 40),
    ('carbon_500', '500 кг CO₂', 'Сэкономить 500 кг CO₂', 'carbon', '🌍', 'carbon_saved', 'value', 500, 75, 'rare', false, 41),
    ('carbon_1000', '1 тонна CO₂', 'Сэкономить 1000 кг CO₂', 'carbon', '🌍', 'carbon_saved', 'value', 1000, 150, 'epic', false, 42),
    
    -- Достижения для просмотра страниц
    ('page_achievements', 'Любознательный', 'Посетите страницу достижений', 'exploration', '🏆', 'achievements_page_viewed', 'boolean', 1, 20, 'common', false, 50),
    ('page_stories', 'Читатель', 'Посетите страницу историй', 'exploration', '📚', 'stories_page_viewed', 'boolean', 1, 15, 'common', false, 51),
    ('page_profile', 'Знакомство', 'Посетите страницу профиля', 'exploration', '👤', 'profile_page_viewed', 'boolean', 1, 10, 'common', false, 52),
    
    -- Скрытые достижения (сюрпризы)
    ('story_deleted', 'Переосмысление', 'Удалите свою историю', 'special', '🗑️', 'story_deleted', 'count', 1, 25, 'rare', true, 100),
    ('like_own_story', 'Самолюбование', 'Поставьте лайк своей истории', 'special', '😊', 'like_own_story', 'boolean', 1, 10, 'common', true, 101),
    ('story_published', 'Одобрено', 'Ваша история опубликована модератором', 'special', '✅', 'story_published', 'boolean', 1, 50, 'rare', true, 102)
    
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    event_type = EXCLUDED.event_type,
    requirement_type = EXCLUDED.requirement_type,
    requirement_value = EXCLUDED.requirement_value,
    points = EXCLUDED.points,
    rarity = EXCLUDED.rarity,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    is_hidden = EXCLUDED.is_hidden,
    sort_order = EXCLUDED.sort_order,
    updated_at = CURRENT_TIMESTAMP;

-- Обновляем сортировку для старых достижений
UPDATE achievements 
SET sort_order = CASE 
    WHEN category = 'registration' THEN 1
    WHEN category = 'login' THEN 2
    WHEN category = 'stories' THEN 3
    WHEN category = 'likes' THEN 4
    WHEN category = 'popularity' THEN 5
    WHEN category = 'carbon' THEN 6
    WHEN category = 'exploration' THEN 7
    WHEN category = 'special' THEN 8
    ELSE 9
END * 10 + sort_order
WHERE sort_order < 10;

-- Проверяем созданные достижения
SELECT 
    code, 
    name, 
    category,
    event_type, 
    requirement_type, 
    requirement_value,
    points,
    rarity,
    is_hidden
FROM achievements 
ORDER BY category, sort_order, points;

-- Тестовые данные для пользовательских достижений (если нужно)
-- Удаляем старые тестовые данные если они есть
DELETE FROM user_achievements WHERE user_id IN (1, 2, 3);

-- Создаем тестовые достижения для пользователей
INSERT INTO user_achievements (
    user_id, 
    achievement_id, 
    progress, 
    current_value,
    completed, 
    completed_at,
    started_at
) 
SELECT 
    u.id as user_id,
    a.id as achievement_id,
    CASE 
        WHEN a.code = 'first_login' THEN 1
        WHEN a.code = 'daily_login_1' THEN 1
        WHEN a.code = 'first_story' THEN RANDOM()::int % 2  -- 0 или 1
        ELSE 0
    END as progress,
    CASE 
        WHEN a.code = 'first_login' THEN 1
        WHEN a.code = 'daily_login_1' THEN 1
        WHEN a.code = 'first_story' THEN RANDOM()::int % 2
        ELSE 0
    END as current_value,
    CASE 
        WHEN a.code = 'first_login' THEN true
        WHEN a.code = 'daily_login_1' THEN true
        WHEN a.code = 'first_story' THEN (RANDOM()::int % 2)::boolean
        ELSE false
    END as completed,
    CASE 
        WHEN a.code = 'first_login' THEN CURRENT_TIMESTAMP - INTERVAL '60 days'
        WHEN a.code = 'daily_login_1' THEN CURRENT_TIMESTAMP - INTERVAL '5 days'
        WHEN a.code = 'first_story' AND (RANDOM()::int % 2) = 1 THEN CURRENT_TIMESTAMP - INTERVAL '15 days'
        ELSE NULL
    END as completed_at,
    CURRENT_TIMESTAMP - INTERVAL '60 days' as started_at
FROM users u
CROSS JOIN achievements a
WHERE u.id IN (1, 2, 3)  -- Тестовые пользователи
  AND a.code IN ('first_login', 'daily_login_1', 'first_story')
ON CONFLICT (user_id, achievement_id) DO UPDATE SET
    progress = EXCLUDED.progress,
    current_value = EXCLUDED.current_value,
    completed = EXCLUDED.completed,
    completed_at = CASE 
        WHEN EXCLUDED.completed = true AND user_achievements.completed = false 
        THEN EXCLUDED.completed_at 
        ELSE user_achievements.completed_at 
    END,
    updated_at = CURRENT_TIMESTAMP;

-- Обновляем историю экоинов для тестовых пользователей
INSERT INTO eco_coins_history (
    user_id,
    amount,
    type,
    achievement_id,
    description,
    created_at
)
SELECT 
    ua.user_id,
    a.points,
    'achievement_unlocked',
    ua.achievement_id,
    'Достижение: ' || a.name,
    ua.completed_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.completed = true 
  AND ua.user_id IN (1, 2, 3)
  AND NOT EXISTS (
    SELECT 1 FROM eco_coins_history ech 
    WHERE ech.user_id = ua.user_id 
      AND ech.achievement_id = ua.achievement_id
  )
ON CONFLICT DO NOTHING;

-- Обновляем общее количество экоинов у пользователей
UPDATE users u
SET eco_coins = COALESCE((
    SELECT SUM(amount) 
    FROM eco_coins_history ech 
    WHERE ech.user_id = u.id
), 0)
WHERE u.id IN (1, 2, 3);
-- Создаем истории успеха для всех пользователей (все опубликованные)
INSERT INTO success_stories (user_id, title, content, category, carbon_saved, likes_count, status) VALUES
    (1, 'Администрирование экологии', 'Как администратор EcoSteps, я помогаю тысячам людей начать свой путь к экологичной жизни. Вместе мы уже сэкономили тонны CO₂!', 'Общее', 2500, 45, 'published'),
    (2, 'Мой первый год в экологии', 'Начала с малого - отказалась от пластиковых пакетов. Теперь веду полностью экологичный образ жизни и экономлю 1800 кг CO₂ в год!', 'Общее', 1800, 32, 'published'),
    (3, 'Тестирование зеленых решений', 'Тестирую различные экологичные решения и делюсь опытом с сообществом. Каждое решение приносит пользу планете!', 'Общее', 2100, 28, 'published'),
    (4, 'Зеленый дом alex_green', 'Превратил свой дом в экологичное пространство: солнечные панели, дождевая вода, органический сад. Экономлю 2300 кг CO₂ в год!', 'Энергия', 2300, 56, 'published'),
    (5, 'Эко-блогер sarah_eco', 'Веду блог об экологии и вдохновляю людей на изменения. Мои подписчики уже сэкономили более 10 тонн CO₂!', 'Общее', 1950, 78, 'published'),
    (6, 'mike_nature и дикая природа', 'Участвую в программах защиты дикой природы и восстановления лесов. Посадил 100 деревьев в этом году!', 'Природа', 2650, 43, 'published'),
    (7, 'emma_clean за чистоту', 'Организовала программу раздельного сбора мусора в нашем районе. Теперь 90% отходов идет на переработку!', 'Отходы', 1750, 39, 'published'),
    (8, 'Солнечная энергия david_solar', 'Установил солнечные панели и перешел на электромобиль. Мой дом производит больше энергии, чем потребляет!', 'Энергия', 2850, 67, 'published'),
    (9, 'lisa_bike на велосипеде', 'Продала машину и перешла на велосипед. Проезжаю 50 км в день и чувствую себя здоровее чем когда-либо!', 'Транспорт', 2200, 51, 'published'),
    (10, 'john_water экономит воду', 'Установил систему сбора дождевой воды и экономные смесители. Сократил потребление воды на 60%!', 'Вода', 1650, 34, 'published'),
    (11, 'anna_forest и городской лес', 'Создала инициативу по озеленению города. Мы посадили 500 деревьев и создали 10 парков!', 'Природа', 1850, 62, 'published'),
    (12, 'tom_ocean защищает океаны', 'Участвую в очистке береговой линии и защите морской жизни. Очистили 5 км пляжей от пластика!', 'Отходы', 2400, 48, 'published'),
    (13, 'kate_wind и ветровая энергия', 'Установила небольшую ветровую турбину дома. Генерирую чистую энергию даже в безветренные дни!', 'Энергия', 1950, 35, 'published'),
    (14, 'peter_recycle перерабатывает все', 'Довел переработку отходов до 95%. Создал систему компостирования и обмена вещами в районе.', 'Отходы', 1750, 41, 'published'),
    (15, 'maria_garden выращивает еду', 'Создала органический сад на крыше. Выращиваю 80% овощей для семьи без химикатов!', 'Питание', 1600, 37, 'published'),
    (16, 'james_energy и умный дом', 'Создал энергоэффективный умный дом с автоматическим управлением освещением и отоплением.', 'Энергия', 2750, 59, 'published'),
    (17, 'nina_earth начинает с малого', 'Только начала свой эко-путь, но уже вижу результаты! Отказалась от пластика и начала компостировать.', 'Общее', 1450, 23, 'pending'),
    (18, 'ryan_transport и общественный транспорт', 'Отказался от личного авто в пользу общественного транспорта и велосипеда. Экономлю 2100 кг CO₂ в год!', 'Транспорт', 2100, 44, 'published'),
    (19, 'sophie_waste против отходов', 'Перешла на философию "ноль отходов". За год сократила мусор на 90% и вдохновила 50 семей!', 'Отходы', 1800, 53, 'pending'),
    (20, 'lucas_food и растительное питание', 'Перешел на растительное питание и начал выращивать микрозелень дома. Здоровье улучшилось, планета благодарна!', 'Питание', 1900, 46, 'published')
ON CONFLICT DO NOTHING;

-- Создаем лайки историй
INSERT INTO story_likes (story_id, user_id) VALUES
(1, 2), (1, 3), (1, 4), (1, 5), (1, 6),
(2, 1), (2, 3), (2, 4), (2, 7),
(3, 1), (3, 2), (3, 5), (3, 8),
(4, 1), (4, 2), (4, 6),
(5, 1), (5, 3), (5, 4), (5, 7),
(6, 2), (6, 4), (6, 8),
(7, 1), (7, 3), (7, 5),
(8, 2), (8, 4), (8, 6),
(9, 1), (9, 3), (9, 7),
(10, 2), (10, 4), (10, 8)
ON CONFLICT (story_id, user_id) DO NOTHING;

-- Создаем обращения в поддержку
INSERT INTO support_tickets (user_id, ticket_number, subject, message, status, admin_response, responded_at) VALUES
(2, 'TICKET-20240115-0001', 'Проблема с регистрацией', 'Не могу подтвердить email, не приходит письмо', 'answered', 'Проблема решена, проверьте почту', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(3, 'TICKET-20240116-0001', 'Вопрос по достижениям', 'Как получить достижение "Велосипедист"?', 'answered', 'Нужно проехать 50 км на велосипеде и отметить в приложении', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(4, 'TICKET-20240117-0001', 'Баг в приложении', 'Приложение вылетает при открытии раздела "Команды"', 'pending', NULL, NULL),
(5, 'TICKET-20240118-0001', 'Предложение по улучшению', 'Хочу предложить новую функцию - калькулятор углеродного следа', 'closed', 'Спасибо за предложение! Добавили в план разработки', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 'TICKET-20240119-0001', 'Восстановление пароля', 'Забыл пароль, не могу войти в аккаунт', 'answered', 'Отправили ссылку для восстановления пароля на email', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(6, 'TICKET-20240120-0001', 'Вопрос по командам', 'Как создать свою команду?', 'answered', 'Перейдите в раздел "Команды" и нажмите "Создать команду"', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(7, 'TICKET-20240121-0001', 'Жалоба на пользователя', 'Пользователь spammer нарушает правила', 'closed', 'Пользователь забанен за спам', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(8, 'TICKET-20240122-0001', 'Техническая проблема', 'Не отображаются мои достижения', 'pending', NULL, NULL)
ON CONFLICT (ticket_number) DO UPDATE SET
    status = EXCLUDED.status,
    admin_response = EXCLUDED.admin_response,
    responded_at = EXCLUDED.responded_at,
    updated_at = CURRENT_TIMESTAMP;

-- Создаем активность пользователей
INSERT INTO user_activities (user_id, activity_type, description, related_id, carbon_saved) VALUES
(1, 'carbon_saved', 'Сэкономил CO₂ с помощью солнечных панелей', NULL, 50),
(1, 'story_created', 'Создал историю успеха', 1, 0),
(1, 'achievement_completed', 'Получил достижение "1 тонна CO₂"', 3, 0),
(2, 'carbon_saved', 'Проехал на велосипеде вместо машины', NULL, 25),
(2, 'story_created', 'Создал историю успеха', 2, 0),
(2, 'support_ticket', 'Отправил вопрос в поддержку', 1, 0),
(3, 'carbon_saved', 'Установил LED лампы', NULL, 10),
(3, 'story_created', 'Создал историю успеха', 3, 0),
(4, 'carbon_saved', 'Начал сортировать мусор', NULL, 15),
(4, 'story_created', 'Создал историю успеха', 4, 0),
(5, 'carbon_saved', 'Сократил потребление мяса', NULL, 30),
(5, 'story_created', 'Создал историю успеха', 5, 0),
(6, 'carbon_saved', 'Посадил дерево', NULL, 40),
(7, 'carbon_saved', 'Установил систему сбора дождевой воды', NULL, 20),
(8, 'carbon_saved', 'Перешел на электромобиль', NULL, 100),
(9, 'carbon_saved', 'Продал автомобиль', NULL, 60),
(10, 'carbon_saved', 'Установил водосберегающие смесители', NULL, 15)
ON CONFLICT DO NOTHING;

-- Создаем эко-советы
INSERT INTO eco_tips (title, content, category, difficulty, co2_impact, day_of_year) VALUES
('Используйте многоразовые сумки', 'Откажитесь от пластиковых пакетов в магазинах. Носите с собой тканевую сумку.', 'waste', 'easy', 5, 1),
('Выключайте свет', 'Выключайте свет, когда выходите из комнаты. Это экономит энергию и деньги.', 'energy', 'easy', 3, 2),
('Пейте водопроводную воду', 'Используйте фильтр для воды вместо покупки бутилированной.', 'water', 'easy', 8, 3),
('Ездите на велосипеде', 'Поездка на велосипеде вместо машины сокращает выбросы CO₂.', 'transport', 'medium', 15, 4),
('Компостируйте отходы', 'Превращайте пищевые отходы в ценное удобрение для растений.', 'waste', 'medium', 10, 5),
('Установите LED лампы', 'LED лампы потребляют на 80% меньше энергии и служат дольше.', 'energy', 'easy', 6, 6),
('Сократите потребление мяса', 'Один день без мяса в неделю значительно снижает углеродный след.', 'food', 'medium', 12, 7),
('Используйте общественный транспорт', 'Автобус или метро вместо личного автомобиля.', 'transport', 'easy', 20, 8),
('Сортируйте мусор', 'Разделяйте отходы для переработки.', 'waste', 'medium', 7, 9),
('Покупайте местные продукты', 'Продукты, выращенные nearby, не требуют длительной транспортировки.', 'food', 'easy', 4, 10)
ON CONFLICT DO NOTHING;

-- Создаем просмотренные эко-советы
INSERT INTO user_eco_tips (user_id, tip_id, liked) VALUES
(1, 1, TRUE), (1, 2, TRUE), (1, 3, FALSE),
(2, 1, TRUE), (2, 4, TRUE),
(3, 2, TRUE), (3, 6, TRUE),
(4, 5, TRUE), (4, 9, TRUE),
(5, 7, TRUE), (5, 10, FALSE),
(6, 1, TRUE), (6, 3, TRUE),
(7, 2, FALSE), (7, 8, TRUE),
(8, 4, TRUE), (8, 6, TRUE),
(9, 5, TRUE), (9, 7, FALSE),
(10, 3, TRUE), (10, 9, TRUE)
ON CONFLICT (user_id, tip_id) DO UPDATE SET
    liked = EXCLUDED.liked,
    viewed_at = CURRENT_TIMESTAMP;

-- Создаем настройки для всех пользователей
INSERT INTO user_settings (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM user_settings WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Обновляем настройки для некоторых пользователей
UPDATE user_settings SET 
    theme = 'dark',
    language = 'EN',
    privacy_level = 2
WHERE user_id = 1;

UPDATE user_settings SET 
    theme = 'auto',
    email_notifications = FALSE
WHERE user_id = 2;

UPDATE user_settings SET 
    language = 'BY',
    notifications_enabled = FALSE
WHERE user_id = 3;

UPDATE user_settings SET 
    theme = 'dark',
    push_notifications = TRUE
WHERE user_id = 4;

-- Выводим информацию о созданных данных
DO $$
DECLARE
    user_count INTEGER;
    team_count INTEGER;
    story_count INTEGER;
    ticket_count INTEGER;
    achievement_count INTEGER;
    ban_history_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users WHERE deleted_at IS NULL;
    SELECT COUNT(*) INTO team_count FROM teams;
    SELECT COUNT(*) INTO story_count FROM success_stories;
    SELECT COUNT(*) INTO ticket_count FROM support_tickets;
    SELECT COUNT(*) INTO achievement_count FROM achievements;
    SELECT COUNT(*) INTO ban_history_count FROM ban_history;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'БАЗА ДАННЫХ EcoSteps УСПЕШНО ОБНОВЛЕНА!';
    RAISE NOTICE '=========================================';

END $$;