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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ КОМАНДЫ ============
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    avatar_emoji VARCHAR(10) DEFAULT '🌿',
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
INSERT INTO teams (name, description, avatar_emoji, carbon_saved, member_count) VALUES
    ('Зеленые Минска', 'Экологическое сообщество столицы', 'city', 23400, 8),
    ('Эко-студенты МГКЦТ', 'Студенты за экологию', 'graduation', 18900, 6),
    ('Велосипедисты Гомеля', 'Велосипед вместо автомобиля', 'bike', 15600, 4),
    ('Солнечная энергия', 'Возобновляемые источники энергии', 'sun', 12300, 3),
    ('Ноль отходов', 'Минимизация отходов', 'recycle', 11800, 4)
ON CONFLICT (name) DO NOTHING;

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
    (12, 'Экологичная косметика', 'Перешла на натуральную косметику без химии. Кожа стала лучше, а природа чище!', 'Потребление', 200, 5)
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