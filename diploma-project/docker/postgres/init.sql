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
    email VARCHAR(70) UNIQUE NOT NULL,
    nickname VARCHAR(30) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender_id INTEGER REFERENCES genders(id),
    bio TEXT,
    goal TEXT,
    trees_planted INTEGER DEFAULT 0,
    carbon_saved INTEGER DEFAULT 0,
    eco_level VARCHAR(50) DEFAULT 'Эко-новичок',
    avatar_emoji VARCHAR(10) DEFAULT '🌱',
    email_verified BOOLEAN DEFAULT FALSE,
    is_profile_public BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE, 
    ban_reason TEXT,
    ban_expires_at TIMESTAMP DEFAULT NULL,
    ban_count INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT FALSE,
    eco_coins INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    deleted_at TIMESTAMP
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
    privacy_level INTEGER DEFAULT 1 CHECK (privacy_level BETWEEN 1 AND 3),
    timezone VARCHAR(50) DEFAULT 'Europe/Minsk',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    goal_category VARCHAR(50) DEFAULT NULL,
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

-- ============ СООБЩЕНИЯ ============
CREATE TABLE IF NOT EXISTS direct_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_messages (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_message_reads (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, team_id)
);

-- ============ ИСТОРИИ УСПЕХА ============
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

-- ============ ПОСТЫ ПОЛЬЗОВАТЕЛЕЙ ============
CREATE TABLE IF NOT EXISTS user_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL
);

-- ============ ЛАЙКИ ПОСТОВ ============
CREATE TABLE IF NOT EXISTS post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES user_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- ============ КОММЕНТАРИИ К ПОСТАМ ============
CREATE TABLE IF NOT EXISTS post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES user_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL
);

-- ============ ДРУЖБА МЕЖДУ ПОЛЬЗОВАТЕЛЯМИ ============
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- ============ ЖАЛОБЫ НА ПОЛЬЗОВАТЕЛЕЙ ============
CREATE TABLE IF NOT EXISTS user_reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    screenshots TEXT[], -- Массив URL скриншотов
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'rejected')),
    admin_notes TEXT,
    admin_response TEXT, -- Ответ администратора пользователю
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ УВЕДОМЛЕНИЯ ============
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('report_response', 'new_report', 'friend_request', 'achievement', 'story_approved', 'story_rejected', 'eco_tip', 'system', 'team_member_joined', 'achievement_unlocked', 'support_ticket', 'support_response')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255), -- Ссылка для перехода при клике
    is_read BOOLEAN DEFAULT FALSE,
    related_id INTEGER, -- ID связанной сущности (жалобы, достижения и т.д.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска непрочитанных уведомлений пользователя
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- ============ ДОСТИЖЕНИЯ ============
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    requirement_type VARCHAR(50) NOT NULL CHECK (requirement_type IN ('count', 'streak', 'value', 'boolean')),
    requirement_value INTEGER NOT NULL,
    points INTEGER DEFAULT 10,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    is_active BOOLEAN DEFAULT TRUE,
    is_hidden BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
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
    metadata JSONB DEFAULT '{}',
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

-- ============ НАСТРОЙКИ КАЛЬКУЛЯТОРА ============
CREATE TABLE IF NOT EXISTS user_calculator_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    baseline_footprint DECIMAL(10, 2) DEFAULT 12000,
    carbon_goal_percent INTEGER DEFAULT 20,
    target_deadline DATE DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    notify_on_goal_progress BOOLEAN DEFAULT TRUE,
    notify_monthly_report BOOLEAN DEFAULT TRUE,
    auto_calculate BOOLEAN DEFAULT FALSE,
    preferred_units VARCHAR(20) DEFAULT 'metric' CHECK (preferred_units IN ('metric', 'imperial')),
    default_period VARCHAR(10) DEFAULT 'year' CHECK (default_period IN ('day', 'week', 'month', 'year')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ КАТЕГОРИИ КАЛЬКУЛЯТОРА УГЛЕРОДНОГО СЛЕДА ============
CREATE TABLE IF NOT EXISTS calculator_categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    unit VARCHAR(20) NOT NULL,
    baseline_value DECIMAL(10, 2) NOT NULL,
    min_value DECIMAL(10, 2) DEFAULT 0,
    max_value DECIMAL(10, 2),
    weight DECIMAL(5, 2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ ПРОГРЕСС ЦЕЛЕЙ ============
CREATE TABLE IF NOT EXISTS user_carbon_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('footprint_reduction', 'category_improvement', 'habit_adoption')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_value DECIMAL(10, 2) NOT NULL,
    current_value DECIMAL(10, 2) DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    category_code VARCHAR(50) REFERENCES calculator_categories(code),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'paused')),
    progress_percent INTEGER DEFAULT 0,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ АНАЛИТИКА УГЛЕРОДНОГО СЛЕДА ============
CREATE TABLE IF NOT EXISTS user_carbon_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('week', 'month', 'quarter', 'year')),
    calculations_count INTEGER NOT NULL DEFAULT 0,
    avg_footprint DECIMAL(10, 2) NOT NULL,
    total_savings DECIMAL(10, 2) NOT NULL,
    monthly_savings DECIMAL(10, 2) NOT NULL,
    category_analysis JSONB NOT NULL,
    best_category VARCHAR(50),
    worst_category VARCHAR(50),
    footprint_trend VARCHAR(20) DEFAULT 'stable' CHECK (footprint_trend IN ('improving', 'stable', 'worsening')),
    savings_trend VARCHAR(20) DEFAULT 'stable' CHECK (savings_trend IN ('improving', 'stable', 'worsening')),
    generated_recommendations JSONB,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, period_start, period_end, period_type)
);

-- ============ ИСТОРИЯ РАСЧЕТОВ УГЛЕРОДНОГО СЛЕДА ============
CREATE TABLE IF NOT EXISTS carbon_calculations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_footprint DECIMAL(10, 2) NOT NULL,
    co2_saved DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_baseline BOOLEAN DEFAULT FALSE,
    categories JSONB NOT NULL DEFAULT '{}',
    input_data JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    calculation_method VARCHAR(50) DEFAULT 'standard',
    data_source VARCHAR(50) DEFAULT 'manual',
    session_id UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, calculation_date, is_baseline)
);
-- ============ ВИРТУАЛЬНЫЙ ПИТОМЕЦ ============
CREATE TABLE IF NOT EXISTS user_pets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    pet_type VARCHAR(20) NOT NULL CHECK (pet_type IN ('cat', 'fox', 'turtle')),
    name VARCHAR(30) DEFAULT NULL,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    xp_to_next_level INTEGER DEFAULT 100,
    last_fed_at TIMESTAMP DEFAULT NULL,
    hunger INTEGER DEFAULT 100 CHECK (hunger BETWEEN 0 AND 100),
    happiness INTEGER DEFAULT 100 CHECK (happiness BETWEEN 0 AND 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- ============ ИНДЕКСЫ ============

-- Индекс для быстрого поиска расчетов по пользователю и дате
CREATE INDEX IF NOT EXISTS idx_carbon_calculations_user_date 
ON carbon_calculations(user_id, calculation_date DESC);

-- Индекс для поиска базовых расчетов
CREATE INDEX IF NOT EXISTS idx_carbon_calculations_baseline 
ON carbon_calculations(user_id) 
WHERE is_baseline = TRUE;

-- Индекс для активных целей пользователя
CREATE INDEX IF NOT EXISTS idx_user_carbon_goals_active 
ON user_carbon_goals(user_id, status) 
WHERE status = 'active';

-- Индекс для аналитики пользователя
CREATE INDEX IF NOT EXISTS idx_user_carbon_analytics_user_period 
ON user_carbon_analytics(user_id, period_end DESC);

-- Остальные индексы
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender_id);
CREATE INDEX IF NOT EXISTS idx_users_carbon_saved ON users(carbon_saved);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);
-- CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at); -- Удалено вместе с полем
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_eco_coins_history_user_id ON eco_coins_history(user_id);
CREATE INDEX IF NOT EXISTS idx_eco_coins_history_achievement_id ON eco_coins_history(achievement_id);
CREATE INDEX IF NOT EXISTS idx_ban_history_user_id ON ban_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ban_history_created_by ON ban_history(created_by);
CREATE INDEX IF NOT EXISTS idx_ban_history_unbanned_at ON ban_history(unbanned_at);
CREATE INDEX IF NOT EXISTS idx_ban_history_created_at ON ban_history(created_at);
CREATE INDEX IF NOT EXISTS idx_achievements_event_type ON achievements(event_type);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(completed);
CREATE INDEX IF NOT EXISTS idx_achievement_events_user_id ON achievement_events(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_events_event_type ON achievement_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_carbon_saved ON teams(carbon_saved);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calculator_settings_user ON user_calculator_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_carbon_goals_user ON user_carbon_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_carbon_goals_status ON user_carbon_goals(status);
CREATE INDEX IF NOT EXISTS idx_user_carbon_analytics_user ON user_carbon_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_user ON success_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created ON success_stories(created_at);
CREATE INDEX IF NOT EXISTS idx_story_likes_story ON story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user ON story_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_eco_tips_day_of_year ON eco_tips(day_of_year);
CREATE INDEX IF NOT EXISTS idx_user_eco_tips_user_id ON user_eco_tips(user_id);
CREATE INDEX IF NOT EXISTS idx_success_stories_user_id ON success_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_success_stories_status ON success_stories(status);
CREATE INDEX IF NOT EXISTS idx_success_stories_category ON success_stories(category);

-- ============ ПРЕДСТАВЛЕНИЯ (ИСПРАВЛЕННЫЕ) ============

-- Представление с текущей статистикой пользователя (упрощенное)
CREATE OR REPLACE VIEW user_current_stats AS
SELECT 
    u.id as user_id,
    u.nickname,
    u.carbon_saved,
    u.eco_level,
    u.avatar_emoji,
    COALESCE(cc.total_footprint, 0) as current_footprint,
    cc.calculation_date as last_calculation_date,
    COALESCE(a.calculations_count, 0) as recent_calculations,
    COALESCE(a.avg_footprint, 0) as recent_avg_footprint,
    COALESCE(a.monthly_savings, 0) as monthly_savings_avg,
    COALESCE(a.footprint_trend, 'stable') as footprint_trend,
    COUNT(g.id) as active_goals_count,
    COALESCE(ucs.baseline_footprint, 12000) as baseline_footprint,
    COALESCE(ucs.carbon_goal_percent, 20) as goal_percent
FROM users u
LEFT JOIN LATERAL (
    SELECT * FROM carbon_calculations 
    WHERE user_id = u.id 
    ORDER BY calculation_date DESC 
    LIMIT 1
) cc ON true
LEFT JOIN user_calculator_settings ucs ON u.id = ucs.user_id
LEFT JOIN LATERAL (
    SELECT * FROM user_carbon_analytics 
    WHERE user_id = u.id 
        AND period_type = 'month'
        AND period_end >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY period_end DESC 
    LIMIT 1
) a ON true
LEFT JOIN user_carbon_goals g ON u.id = g.user_id AND g.status = 'active'
GROUP BY 
    u.id, u.nickname, u.carbon_saved, u.eco_level, u.avatar_emoji,
    cc.total_footprint, cc.calculation_date,
    ucs.baseline_footprint, ucs.carbon_goal_percent,
    a.calculations_count, a.avg_footprint, a.monthly_savings, a.footprint_trend;

-- Представление для детальной статистики по категориям (упрощенное)
CREATE OR REPLACE VIEW user_category_stats AS
SELECT 
    u.id as user_id,
    c.code as category_code,
    c.name as category_name,
    c.icon as category_icon,
    COUNT(cc.id) as calculations_count,
    AVG((cc.categories->c.code->>'value')::DECIMAL) as avg_footprint,
    MIN((cc.categories->c.code->>'value')::DECIMAL) as min_footprint,
    MAX((cc.categories->c.code->>'value')::DECIMAL) as max_footprint
FROM users u
CROSS JOIN calculator_categories c
LEFT JOIN carbon_calculations cc ON u.id = cc.user_id AND cc.categories ? c.code
WHERE c.is_active = true
GROUP BY u.id, c.code, c.name, c.icon;

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
    INSERT INTO user_settings (user_id, notifications_enabled, eco_tips_enabled) 
    VALUES (NEW.id, TRUE, TRUE);
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

-- Вспомогательная функция для генерации рекомендаций
CREATE OR REPLACE FUNCTION generate_period_recommendations(
    p_category_analysis JSONB,
    p_avg_footprint DECIMAL
) RETURNS JSONB AS $$
DECLARE
    v_recommendations JSONB := '[]';
BEGIN
    -- Простые рекомендации
    IF p_avg_footprint > 10000 THEN
        v_recommendations := v_recommendations || jsonb_build_object(
            'category', 'general',
            'action', 'Ваш углеродный след выше среднего. Рассмотрите меры по его снижению.',
            'priority', 'medium'
        );
    ELSIF p_avg_footprint < 5000 THEN
        v_recommendations := v_recommendations || jsonb_build_object(
            'category', 'general',
            'action', 'Отличные результаты! Продолжайте в том же духе.',
            'priority', 'low'
        );
    END IF;

    RETURN v_recommendations;
END;
$$ LANGUAGE plpgsql;

-- Процедура для обновления аналитики пользователя (упрощенная)
CREATE OR REPLACE PROCEDURE update_user_analytics(
    p_user_id INTEGER,
    p_period_type VARCHAR DEFAULT 'month'
) AS $$
DECLARE
    v_period_start DATE;
    v_period_end DATE := CURRENT_DATE;
    v_calculations_count INTEGER;
    v_avg_footprint DECIMAL;
    v_total_savings DECIMAL;
    v_monthly_savings DECIMAL;
    v_category_analysis JSONB := '{}';
    v_recommendations JSONB;
BEGIN
    -- Определяем период
    CASE p_period_type
        WHEN 'week' THEN v_period_start := CURRENT_DATE - INTERVAL '7 days';
        WHEN 'month' THEN v_period_start := CURRENT_DATE - INTERVAL '30 days';
        WHEN 'quarter' THEN v_period_start := CURRENT_DATE - INTERVAL '90 days';
        WHEN 'year' THEN v_period_start := CURRENT_DATE - INTERVAL '365 days';
        ELSE v_period_start := CURRENT_DATE - INTERVAL '30 days';
    END CASE;
    
    -- Получаем статистику за период
    SELECT 
        COUNT(*) as calc_count,
        COALESCE(AVG(total_footprint), 0) as avg_foot,
        COALESCE(SUM(co2_saved), 0) as total_save
    INTO v_calculations_count, v_avg_footprint, v_total_savings
    FROM carbon_calculations 
    WHERE user_id = p_user_id 
        AND calculation_date BETWEEN v_period_start AND v_period_end;
    
    -- Рассчитываем среднемесячную экономию
    v_monthly_savings := v_total_savings / 
        CASE p_period_type
            WHEN 'week' THEN 0.23
            WHEN 'month' THEN 1
            WHEN 'quarter' THEN 3
            WHEN 'year' THEN 12
            ELSE 1
        END;
    
    -- Генерируем рекомендации
    v_recommendations := generate_period_recommendations(v_category_analysis, v_avg_footprint);
    
    -- Сохраняем аналитику
    INSERT INTO user_carbon_analytics (
        user_id,
        period_start,
        period_end,
        period_type,
        calculations_count,
        avg_footprint,
        total_savings,
        monthly_savings,
        category_analysis,
        best_category,
        worst_category,
        footprint_trend,
        savings_trend,
        generated_recommendations
    ) VALUES (
        p_user_id,
        v_period_start,
        v_period_end,
        p_period_type,
        v_calculations_count,
        v_avg_footprint,
        v_total_savings,
        v_monthly_savings,
        v_category_analysis,
        NULL,
        NULL,
        'stable',
        'stable',
        v_recommendations
    )
    ON CONFLICT (user_id, period_start, period_end, period_type) 
    DO UPDATE SET
        calculations_count = EXCLUDED.calculations_count,
        avg_footprint = EXCLUDED.avg_footprint,
        total_savings = EXCLUDED.total_savings,
        monthly_savings = EXCLUDED.monthly_savings,
        category_analysis = EXCLUDED.category_analysis,
        best_category = EXCLUDED.best_category,
        worst_category = EXCLUDED.worst_category,
        footprint_trend = EXCLUDED.footprint_trend,
        savings_trend = EXCLUDED.savings_trend,
        generated_recommendations = EXCLUDED.generated_recommendations,
        calculated_at = CURRENT_TIMESTAMP;
    
    RAISE NOTICE 'Аналитика обновлена для пользователя %, период: %', p_user_id, p_period_type;
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
END;
$$ LANGUAGE plpgsql;

-- ============ ТРИГГЕРЫ ============

-- Триггеры для обновления updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_success_stories_updated_at ON success_stories;
CREATE TRIGGER update_success_stories_updated_at 
    BEFORE UPDATE ON success_stories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calculator_categories_updated_at ON calculator_categories;
CREATE TRIGGER update_calculator_categories_updated_at
    BEFORE UPDATE ON calculator_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_carbon_calculations_updated_at ON carbon_calculations;
CREATE TRIGGER update_carbon_calculations_updated_at
    BEFORE UPDATE ON carbon_calculations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_carbon_goals_updated_at ON user_carbon_goals;
CREATE TRIGGER update_user_carbon_goals_updated_at
    BEFORE UPDATE ON user_carbon_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_achievements_updated_at ON achievements;
CREATE TRIGGER update_achievements_updated_at 
    BEFORE UPDATE ON achievements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_achievements_updated_at ON user_achievements;
CREATE TRIGGER update_user_achievements_updated_at 
    BEFORE UPDATE ON user_achievements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для создания настроек при регистрации
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

-- Функция для обновления carbon_saved команды при обновлении пользователя
CREATE OR REPLACE FUNCTION update_team_carbon_saved()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE teams t
    SET
        carbon_saved = GREATEST(0, (
            SELECT COALESCE(SUM(GREATEST(0, u.carbon_saved)), 0)
            FROM team_members tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.team_id = t.id
        )),
        goal_current = GREATEST(0, (
            CASE
                WHEN t.goal_category IS NOT NULL THEN (
                    SELECT COALESCE(SUM(
                        cc.co2_saved *
                        CASE WHEN cc.total_footprint > 0 THEN
                            CASE t.goal_category
                                WHEN 'transport' THEN COALESCE((cc.categories->>'transport')::DECIMAL, 0)
                                WHEN 'food'      THEN COALESCE((cc.categories->>'food')::DECIMAL, 0)
                                WHEN 'energy'    THEN COALESCE((cc.categories->>'housing')::DECIMAL, 0)
                                WHEN 'waste'     THEN COALESCE((cc.categories->>'waste')::DECIMAL, 0)
                                ELSE 0
                            END / cc.total_footprint
                        ELSE 0 END
                    ), 0)
                    FROM team_members tm
                    JOIN carbon_calculations cc ON cc.user_id = tm.user_id AND cc.is_baseline = FALSE
                    WHERE tm.team_id = t.id
                )
                ELSE (
                    SELECT COALESCE(SUM(GREATEST(0, u.carbon_saved)), 0)
                    FROM team_members tm
                    JOIN users u ON tm.user_id = u.id
                    WHERE tm.team_id = t.id
                )
            END
        ))
    WHERE t.id IN (
        SELECT team_id FROM team_members WHERE user_id = NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления carbon_saved команды при обновлении пользователя
DROP TRIGGER IF EXISTS trigger_update_team_carbon_on_user_update ON users;
CREATE TRIGGER trigger_update_team_carbon_on_user_update
    AFTER UPDATE OF carbon_saved ON users
    FOR EACH ROW
    WHEN (OLD.carbon_saved IS DISTINCT FROM NEW.carbon_saved)
    EXECUTE FUNCTION update_team_carbon_saved();

-- Триггер для автоматического обновления аналитики
CREATE OR REPLACE FUNCTION trigger_update_analytics()
RETURNS TRIGGER AS $$
BEGIN
    CALL update_user_analytics(NEW.user_id, 'month');
    CALL update_user_analytics(NEW.user_id, 'year');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analytics_after_calculation
    AFTER INSERT ON carbon_calculations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_analytics();

-- Функция для автоматического обновления avatar_emoji на основе carbon_saved
CREATE OR REPLACE FUNCTION update_avatar_emoji()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем emoji на основе сэкономленного CO2
    IF NEW.carbon_saved >= 5000 THEN
        NEW.avatar_emoji := '🌟';  -- star - Эко-герой
        NEW.eco_level := 'Эко-герой';
    ELSIF NEW.carbon_saved >= 4000 THEN
        NEW.avatar_emoji := '🌿';  -- leaf - Эко-мастер
        NEW.eco_level := 'Эко-мастер';
    ELSIF NEW.carbon_saved >= 3000 THEN
        NEW.avatar_emoji := '🌳';  -- tree - Эко-активист
        NEW.eco_level := 'Эко-активист';
    ELSIF NEW.carbon_saved >= 2000 THEN
        NEW.avatar_emoji := '🌱';  -- sprout - Эко-энтузиаст
        NEW.eco_level := 'Эко-энтузиаст';
    ELSIF NEW.carbon_saved >= 1000 THEN
        NEW.avatar_emoji := '🍀';  -- seedling - Эко-стартер
        NEW.eco_level := 'Эко-стартер';
    ELSE
        NEW.avatar_emoji := '🌾';  -- plant - Эко-новичок
        NEW.eco_level := 'Эко-новичок';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления avatar_emoji при изменении carbon_saved
DROP TRIGGER IF EXISTS update_avatar_emoji_on_carbon_change ON users;
CREATE TRIGGER update_avatar_emoji_on_carbon_change
    BEFORE INSERT OR UPDATE OF carbon_saved ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_avatar_emoji();

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
    '🌳',
    TRUE,
    TRUE
FROM genders g WHERE g.code = 'male'
ON CONFLICT (email) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    avatar_emoji = '🌳',
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

-- Создаем дружбу для админа (для тестирования функционала)
-- Админ (id=1) дружит с несколькими пользователями
INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at)
SELECT 
    1, -- admin
    u.id,
    'accepted',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP - INTERVAL '30 days'
FROM users u 
WHERE u.email IN ('user@test.com', 'test@test.com', 'alex.green@test.com', 'sarah.eco@test.com', 'mike.nature@test.com')
ON CONFLICT DO NOTHING;

-- Добавляем входящие запросы в друзья для админа
INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at)
SELECT 
    u.id,
    1, -- admin
    'pending',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP - INTERVAL '5 days'
FROM users u 
WHERE u.email IN ('emma.earth@test.com', 'david.solar@test.com')
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

-- Создаем участников команд
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

-- Создаем тестовые посты для админа и друзей
INSERT INTO user_posts (user_id, content, likes_count, comments_count, created_at)
SELECT 
    1, -- admin
    'Привет всем! Рад видеть такое активное эко-сообщество! 🌱',
    0,
    0,
    CURRENT_TIMESTAMP - INTERVAL '10 days'
WHERE NOT EXISTS (SELECT 1 FROM user_posts WHERE user_id = 1 LIMIT 1);

INSERT INTO user_posts (user_id, content, likes_count, comments_count, created_at)
SELECT 
    1, -- admin
    'Сегодня посадил 5 деревьев в парке! Каждое дерево - это вклад в будущее 🌳',
    0,
    0,
    CURRENT_TIMESTAMP - INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM user_posts WHERE user_id = 1 AND content LIKE '%посадил%');

INSERT INTO user_posts (user_id, content, likes_count, comments_count, created_at)
SELECT 
    u.id,
    'Перешел на велосипед для поездок на работу! Экономлю CO₂ и здоровье улучшаю 🚴',
    0,
    0,
    CURRENT_TIMESTAMP - INTERVAL '7 days'
FROM users u 
WHERE u.email = 'user@test.com'
AND NOT EXISTS (SELECT 1 FROM user_posts WHERE user_id = u.id LIMIT 1);

INSERT INTO user_posts (user_id, content, likes_count, comments_count, created_at)
SELECT 
    u.id,
    'Начал сортировать мусор дома. Это проще, чем я думал! ♻️',
    0,
    0,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
FROM users u 
WHERE u.email = 'test@test.com'
AND NOT EXISTS (SELECT 1 FROM user_posts WHERE user_id = u.id LIMIT 1);

INSERT INTO user_posts (user_id, content, likes_count, comments_count, created_at)
SELECT 
    u.id,
    'Установил солнечные панели на крыше! Теперь электричество от солнца ☀️',
    0,
    0,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM users u 
WHERE u.email = 'alex.green@test.com'
AND NOT EXISTS (SELECT 1 FROM user_posts WHERE user_id = u.id LIMIT 1);

-- Создаем достижения для EcoSteps
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
    ('first_login', 'Добро пожаловать!', 'Зарегистрируйтесь в системе', 'registration', '🎉', 'first_login', 'boolean', 1, 50, 'common', false, 1),
    ('first_post', 'Первый пост', 'Создайте свой первый пост', 'posts', '📝', 'post_created', 'count', 1, 50, 'common', false, 5),
    ('post_5', 'Активный блогер', 'Создайте 5 постов', 'posts', '✍️', 'post_created', 'count', 5, 150, 'rare', false, 6),
    ('post_10', 'Опытный блогер', 'Создайте 10 постов', 'posts', '📚', 'post_created', 'count', 10, 300, 'epic', false, 7),
    ('post_25', 'Мастер постов', 'Создайте 25 постов', 'posts', '🏆', 'post_created', 'count', 25, 500, 'legendary', false, 8),
    ('first_comment', 'Первый комментарий', 'Оставьте свой первый комментарий', 'comments', '💬', 'comment_added', 'count', 1, 30, 'common', true, 9),
    ('comment_10', 'Активный комментатор', 'Оставьте 10 комментариев', 'comments', '💭', 'comment_added', 'count', 10, 100, 'rare', true, 10),
    ('comment_25', 'Мастер дискуссий', 'Оставьте 25 комментариев', 'comments', '🗨️', 'comment_added', 'count', 25, 200, 'epic', true, 11),
    ('comment_50', 'Король комментариев', 'Оставьте 50 комментариев', 'comments', '👑', 'comment_added', 'count', 50, 400, 'legendary', true, 12),
    ('first_story', 'Первый рассказ', 'Напишите свою первую историю', 'stories', '✍️', 'story_created', 'count', 1, 100, 'rare', false, 15),
    ('story_5', 'Рассказчик', 'Напишите 5 историй', 'stories', '📚', 'story_created', 'count', 5, 250, 'epic', false, 16),
    ('story_10', 'Опытный писатель', 'Напишите 10 историй', 'stories', '📖', 'story_created', 'count', 10, 400, 'epic', false, 17),
    ('story_20', 'Мастер слов', 'Напишите 20 историй', 'stories', '🏰', 'story_created', 'count', 20, 500, 'legendary', false, 18),
    ('first_like', 'Первая оценка', 'Поставьте первый лайк истории', 'likes', '❤️', 'story_liked', 'count', 1, 15, 'common', false, 20),
    ('like_10', 'Активный читатель', 'Поставьте 10 лайков историям', 'likes', '👍', 'story_liked', 'count', 10, 50, 'common', false, 21),
    ('like_50', 'Щедрый ценитель', 'Поставьте 50 лайков', 'likes', '👏', 'story_liked', 'count', 50, 150, 'epic', false, 22),
    ('like_100', 'Эксперт оценок', 'Поставьте 100 лайков историям', 'likes', '🏆', 'story_liked', 'count', 100, 300, 'legendary', false, 23),
    ('story_popular_5', 'Популярность', 'Ваша история получила 5 лайков', 'popularity', '⭐', 'story_received_like', 'value', 5, 100, 'rare', false, 30),
    ('story_popular_10', 'Звезда', 'Ваша история получила 10 лайков', 'popularity', '🌟', 'story_received_like', 'value', 10, 200, 'epic', false, 31),
    ('story_popular_25', 'Вирусная история', 'Ваша история получила 25 лайков', 'popularity', '🔥', 'story_received_like', 'value', 25, 400, 'legendary', false, 32),
    ('carbon_100', 'Первые 100 кг', 'Сэкономить 100 кг CO₂', 'carbon', '🌍', 'carbon_saved', 'value', 100, 25, 'common', false, 40),
    ('carbon_500', '500 кг CO₂', 'Сэкономить 500 кг CO₂', 'carbon', '🌍', 'carbon_saved', 'value', 500, 75, 'rare', false, 41),
    ('carbon_1000', '1 тонна CO₂', 'Сэкономить 1000 кг CO₂', 'carbon', '🌍', 'carbon_saved', 'value', 1000, 150, 'epic', false, 42),
    ('first_friend', 'Первый друг', 'Добавьте своего первого друга', 'social', '👥', 'friend_added', 'count', 1, 50, 'common', false, 50),
    ('friend_5', 'Дружелюбный', 'Добавьте 5 друзей', 'social', '🤝', 'friend_added', 'count', 5, 100, 'rare', false, 51),
    ('friend_10', 'Социальная бабочка', 'Добавьте 10 друзей', 'social', '🦋', 'friend_added', 'count', 10, 200, 'epic', false, 52),
    ('friend_25', 'Душа компании', 'Добавьте 25 друзей', 'social', '🎉', 'friend_added', 'count', 25, 400, 'legendary', false, 53),
    ('first_calculation', 'Первый шаг', 'Выполните первый расчет углеродного следа', 'calculations', '🧮', 'calculation_completed', 'count', 1, 50, 'common', false, 60),
    ('calculation_5', 'Регулярный пользователь', 'Выполните 5 расчетов', 'calculations', '📈', 'calculation_completed', 'count', 5, 100, 'rare', false, 61),
    ('calculation_10', 'Эко-аналитик', 'Выполните 10 расчетов', 'calculations', '📊', 'calculation_completed', 'count', 10, 200, 'epic', false, 62),
    ('calculation_20', 'Мастер расчетов', 'Выполните 20 расчетов', 'calculations', '🎯', 'calculation_completed', 'count', 20, 350, 'legendary', false, 63),
    ('first_team', 'Командный игрок', 'Вступите в свою первую команду', 'teams', '👥', 'team_joined', 'count', 1, 50, 'common', false, 70),
    ('team_creator', 'Основатель', 'Создайте свою первую команду', 'teams', '🏗️', 'team_created', 'count', 1, 100, 'rare', false, 71),
    ('team_5', 'Коллективист', 'Вступите в 5 команд', 'teams', '🤝', 'team_joined', 'count', 5, 200, 'epic', false, 72),
    ('team_admin', 'Лидер сообщества', 'Управляйте командой из 10+ участников', 'teams', '👑', 'team_members', 'value', 10, 300, 'epic', false, 73),
    ('team_goal_100', 'Командная цель', 'Команда достигла цели в 100 кг CO₂', 'teams', '🎯', 'team_goal_reached', 'value', 100, 150, 'rare', false, 74),
    ('team_goal_500', 'Большая цель', 'Команда достигла цели в 500 кг CO₂', 'teams', '🏆', 'team_goal_reached', 'value', 500, 250, 'epic', false, 75),
    ('team_goal_1000', 'Командный триумф', 'Команда достигла цели в 1000 кг CO₂', 'teams', '🌟', 'team_goal_reached', 'value', 1000, 400, 'legendary', false, 76),
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

-- Тестовые данные для пользовательских достижений
-- Создаем истории успеха для всех пользователей
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

-- Заполняем категории калькулятора
INSERT INTO calculator_categories (code, name, description, icon, unit, baseline_value, weight, sort_order) VALUES
    ('transport', 'Транспорт', 'Личный и общественный транспорт, авиаперелеты', '🚗', 'kg CO₂/year', 2500.00, 0.25, 10),
    ('housing', 'Жилье', 'Энергопотребление дома, отопление, электричество', '🏠', 'kg CO₂/year', 2000.00, 0.20, 20),
    ('food', 'Питание', 'Пищевые привычки, потребление мяса, продуктов', '🍎', 'kg CO₂/year', 1800.00, 0.18, 30),
    ('goods', 'Товары и услуги', 'Покупки, электроника, одежда, развлечения', '🛒', 'kg CO₂/year', 1500.00, 0.15, 40),
    ('waste', 'Отходы', 'Мусор, переработка, компостирование', '🗑️', 'kg CO₂/year', 800.00, 0.08, 50),
    ('water', 'Водопотребление', 'Использование воды, водные процедуры', '💧', 'kg CO₂/year', 600.00, 0.06, 60),
    ('other', 'Прочее', 'Прочие источники выбросов', '📊', 'kg CO₂/year', 500.00, 0.05, 70)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    baseline_value = EXCLUDED.baseline_value,
    weight = EXCLUDED.weight,
    sort_order = EXCLUDED.sort_order,
    updated_at = CURRENT_TIMESTAMP;

-- Тестовые расчеты углеродного следа для проверки диаграмм
INSERT INTO carbon_calculations (user_id, calculation_date, total_footprint, co2_saved, is_baseline, categories) VALUES
    -- За последние 7 дней (неделя)
    (1, CURRENT_DATE - INTERVAL '6 days', 15.5, 11.5, FALSE, 
     '{"transport": 5.2, "housing": 4.3, "food": 4.8, "waste": 1.2}'),
    (1, CURRENT_DATE - INTERVAL '5 days', 18.2, 8.8, FALSE,
     '{"transport": 6.5, "housing": 5.1, "food": 5.3, "waste": 1.3}'),
    (1, CURRENT_DATE - INTERVAL '4 days', 14.8, 12.2, FALSE,
     '{"transport": 4.8, "housing": 4.0, "food": 4.5, "waste": 1.5}'),
    (1, CURRENT_DATE - INTERVAL '3 days', 16.3, 10.7, FALSE,
     '{"transport": 5.5, "housing": 4.8, "food": 4.7, "waste": 1.3}'),
    (1, CURRENT_DATE - INTERVAL '2 days', 17.1, 9.9, FALSE,
     '{"transport": 6.0, "housing": 5.2, "food": 4.6, "waste": 1.3}'),
    (1, CURRENT_DATE - INTERVAL '1 day', 15.9, 11.1, FALSE,
     '{"transport": 5.3, "housing": 4.5, "food": 4.8, "waste": 1.3}'),
    
    -- За последние 30 дней (месяц) - добавим еще несколько
    (1, CURRENT_DATE - INTERVAL '15 days', 19.5, 7.5, FALSE,
     '{"transport": 7.2, "housing": 5.8, "food": 5.0, "waste": 1.5}'),
    (1, CURRENT_DATE - INTERVAL '20 days', 16.8, 10.2, FALSE,
     '{"transport": 5.8, "housing": 4.9, "food": 4.8, "waste": 1.3}'),
    (1, CURRENT_DATE - INTERVAL '25 days', 17.5, 9.5, FALSE,
     '{"transport": 6.2, "housing": 5.1, "food": 4.9, "waste": 1.3}'),
    
    -- За год - добавим несколько старых записей
    (1, CURRENT_DATE - INTERVAL '60 days', 20.3, 6.7, FALSE,
     '{"transport": 8.0, "housing": 6.2, "food": 4.8, "waste": 1.3}'),
    (1, CURRENT_DATE - INTERVAL '90 days', 18.9, 8.1, FALSE,
     '{"transport": 7.1, "housing": 5.5, "food": 5.0, "waste": 1.3}'),
    (1, CURRENT_DATE - INTERVAL '120 days', 19.8, 7.2, FALSE,
     '{"transport": 7.8, "housing": 5.9, "food": 4.8, "waste": 1.3}')
ON CONFLICT DO NOTHING;

-- Тестовые цели пользователей
INSERT INTO user_carbon_goals (user_id, goal_type, title, description, target_value, current_value, unit, category_code, start_date, end_date, status, progress_percent) VALUES
    (1, 'footprint_reduction', 'Снизить углеродный след на 20%', 'Цель - сократить общий углеродный след на 20% за год', 20.00, 20.8, '%', NULL, CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '305 days', 'active', 100),
    (1, 'category_improvement', 'Снизить транспортные выбросы', 'Сократить использование личного автомобиля', 1500.00, 1000.00, 'kg CO₂/year', 'transport', CURRENT_DATE, CURRENT_DATE + INTERVAL '180 days', 'active', 67),
    (2, 'footprint_reduction', 'Достичь 8000 кг CO₂ в год', 'Цель - снизить углеродный след до 8000 кг CO₂ в год', 8000.00, 9200.00, 'kg CO₂/year', NULL, CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '320 days', 'active', 0),
    (2, 'habit_adoption', 'Велосипед вместо машины', 'Использовать велосипед для поездок на работу 3 раза в неделю', 3.00, 2.00, 'раз/неделю', 'transport', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '60 days', 'active', 67),
    (3, 'category_improvement', 'Сократить пищевые отходы', 'Уменьшить количество выбрасываемой еды на 50%', 50.00, 30.00, '%', 'food', CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', 'active', 60)
ON CONFLICT DO NOTHING;

-- Вставляем настройки для существующих пользователей
INSERT INTO user_calculator_settings (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM user_calculator_settings WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Создаем настройки для всех пользователей с включенными уведомлениями
INSERT INTO user_settings (user_id, notifications_enabled, eco_tips_enabled)
SELECT id, TRUE, TRUE FROM users 
WHERE id NOT IN (SELECT user_id FROM user_settings WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO UPDATE SET 
    notifications_enabled = TRUE,
    eco_tips_enabled = TRUE;

-- Обновляем настройки для некоторых пользователей
UPDATE user_settings SET 
    theme = 'dark',
    language = 'EN',
    privacy_level = 2
WHERE user_id = 1;

UPDATE user_settings SET 
    theme = 'auto'
WHERE user_id = 2;

UPDATE user_settings SET 
    language = 'BY',
    notifications_enabled = FALSE
WHERE user_id = 3;

UPDATE user_settings SET 
    theme = 'dark'
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
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO team_count FROM teams;
    SELECT COUNT(*) INTO story_count FROM success_stories;
    SELECT COUNT(*) INTO ticket_count FROM support_tickets;
    SELECT COUNT(*) INTO achievement_count FROM achievements;
    SELECT COUNT(*) INTO ban_history_count FROM ban_history;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'БАЗА ДАННЫХ EcoSteps УСПЕШНО ОБНОВЛЕНА!';
    RAISE NOTICE '=========================================';

END $$;

-- ============ ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ ДАННЫХ ============

-- Применяем функцию обновления avatar_emoji ко всем существующим пользователям
UPDATE users
SET carbon_saved = carbon_saved  -- Триггер сработает и обновит avatar_emoji и eco_level
WHERE id > 0;

-- Выводим информацию об обновлении
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM users;
    RAISE NOTICE '✅ Обновлены avatar_emoji и eco_level для % пользователей', v_count;
END $$;


-- ============ МИГРАЦИИ ============
-- Таблица виртуальных питомцев
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS user_pets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    pet_type VARCHAR(20) NOT NULL CHECK (pet_type IN ('cat', 'fox', 'turtle')),
    name VARCHAR(30) DEFAULT NULL,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    xp_to_next_level INTEGER DEFAULT 100,
    last_fed_at TIMESTAMP DEFAULT NULL,
    hunger INTEGER DEFAULT 100 CHECK (hunger BETWEEN 0 AND 100),
    happiness INTEGER DEFAULT 100 CHECK (happiness BETWEEN 0 AND 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'user_pets already exists or error: %', SQLERRM;
END $$;

-- ============ МИГРАЦИИ ============
-- Обновление ограничения типов уведомлений
DO $$ 
BEGIN
    -- Удаляем старое ограничение
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
    
    -- Добавляем новое ограничение с дополнительными типами
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
        CHECK (type IN ('report_response', 'new_report', 'friend_request', 'achievement', 'story_approved', 'story_rejected', 'eco_tip', 'system', 'team_member_joined', 'achievement_unlocked', 'support_ticket', 'support_response'));
    
    RAISE NOTICE 'Ограничение notifications_type_check обновлено';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Ошибка обновления ограничения: %', SQLERRM;
END $$;



