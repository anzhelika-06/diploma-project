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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nickname ON users(nickname);
CREATE INDEX idx_users_gender ON users(gender_id);
CREATE INDEX idx_users_birthdate ON users(date_of_birth);

-- ============ ЗАПОЛНЯЕМ СПРАВОЧНИК ПОЛОВ ============
INSERT INTO genders (code) VALUES
    ('male'),
    ('female')
ON CONFLICT (code) DO NOTHING;

-- ============ ТЕСТОВЫЕ ПОЛЬЗОВАТЕЛИ ============
INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id) 
SELECT 
    'alex.eco@example.com',
    'АлексЭко',
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK3egJY5.7YlJc6ZRcJN5HpQoFq1a',
    '1995-05-15',
    g.id
FROM genders g WHERE g.code = 'male'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id) 
SELECT 
    'maria.green@example.com',
    'МарияЗеленая',
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK3egJY5.7YlJc6ZRcJN5HpQoFq1a',
    '1998-08-22',
    g.id
FROM genders g WHERE g.code = 'female'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id) 
SELECT 
    'test.user@example.com',
    'ЭкоТестер',
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK3egJY5.7YlJc6ZRcJN5HpQoFq1a',
    '1990-12-31',
    g.id
FROM genders g WHERE g.code = 'male'
ON CONFLICT (email) DO NOTHING;

-- ============ ПРЕДСТАВЛЕНИЕ ДЛЯ УДОБСТВА ============
CREATE OR REPLACE VIEW users_view AS
SELECT 
    u.id,
    u.email,
    u.nickname as display_name,
    u.date_of_birth,
    g.code as gender_code,
    u.gender_id,
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN genders g ON u.gender_id = g.id;