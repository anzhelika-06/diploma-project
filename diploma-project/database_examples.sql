-- ============================================
-- ПРИМЕРЫ SQL ЗАПРОСОВ ДЛЯ БАЗЫ ДАННЫХ EcoSteps
-- Демонстрация соответствия требованиям к БД
-- ============================================

-- ============ СТРУКТУРА БАЗЫ ДАННЫХ ============
-- ✅ Минимум 5 таблиц: users, user_settings, teams, success_stories, achievements, eco_tips и др.
-- ✅ Связи один-ко-многим: users -> success_stories, teams -> team_members
-- ✅ Связи многие-ко-многим: users <-> teams (через team_members), users <-> achievements (через user_achievements)
-- ✅ Правильная типизация: INTEGER, VARCHAR, TEXT, TIMESTAMP, BOOLEAN, JSONB
-- ✅ Первичные ключи: id SERIAL PRIMARY KEY во всех таблицах
-- ✅ Внешние ключи: REFERENCES с ON DELETE CASCADE для целостности

-- ============ ПРИМЕРЫ SELECT ЗАПРОСОВ ============

-- 1. Простая выборка - получить всех активных пользователей
SELECT id, nickname, email, carbon_saved, created_at
FROM users 
WHERE is_active = TRUE
ORDER BY carbon_saved DESC;

-- 2. JOIN запрос - пользователи с их настройками и эко-уровнями
SELECT 
    u.nickname,
    u.carbon_saved,
    el.name_ru as eco_level,
    l.native_name as language,
    t.name_ru as theme
FROM users u
LEFT JOIN user_settings us ON u.id = us.user_id
LEFT JOIN eco_levels el ON u.eco_level_id = el.id
LEFT JOIN languages l ON us.language_id = l.id
LEFT JOIN themes t ON us.theme_id = t.id
WHERE u.is_active = TRUE;

-- 3. GROUP BY запрос - статистика по категориям историй успеха
SELECT 
    ec.name_ru as category,
    COUNT(ss.id) as story_count,
    SUM(ss.carbon_saved) as total_carbon_saved,
    AVG(ss.carbon_saved) as avg_carbon_saved,
    MAX(ss.likes_count) as max_likes
FROM success_stories ss
JOIN eco_categories ec ON ss.category_id = ec.id
WHERE ss.is_published = TRUE
GROUP BY ec.id, ec.name_ru
ORDER BY total_carbon_saved DESC;

-- 4. Подзапрос - пользователи с количеством историй выше среднего
SELECT 
    u.nickname,
    u.carbon_saved,
    story_count
FROM users u
JOIN (
    SELECT 
        user_id,
        COUNT(*) as story_count
    FROM success_stories 
    WHERE is_published = TRUE
    GROUP BY user_id
    HAVING COUNT(*) > (
        SELECT AVG(story_count)
        FROM (
            SELECT COUNT(*) as story_count
            FROM success_stories 
            WHERE is_published = TRUE
            GROUP BY user_id
        ) avg_stories
    )
) user_stories ON u.id = user_stories.user_id
ORDER BY story_count DESC;

-- 5. Сложный JOIN с агрегацией - топ команд с участниками
SELECT 
    t.name as team_name,
    t.carbon_saved as team_carbon,
    t.member_count,
    STRING_AGG(u.nickname, ', ') as members,
    AVG(u.carbon_saved) as avg_member_carbon
FROM teams t
JOIN team_members tm ON t.id = tm.team_id
JOIN users u ON tm.user_id = u.id
WHERE tm.is_active = TRUE AND t.is_public = TRUE
GROUP BY t.id, t.name, t.carbon_saved, t.member_count
HAVING COUNT(tm.id) >= 3
ORDER BY t.carbon_saved DESC
LIMIT 10;

-- 6. Оконные функции - ранжирование пользователей по эко-уровням
SELECT 
    nickname,
    carbon_saved,
    el.name_ru as eco_level,
    ROW_NUMBER() OVER (PARTITION BY eco_level_id ORDER BY carbon_saved DESC) as rank_in_level,
    RANK() OVER (ORDER BY carbon_saved DESC) as overall_rank
FROM users u
JOIN eco_levels el ON u.eco_level_id = el.id
WHERE u.is_active = TRUE;

-- 7. CTE (Common Table Expression) - активность пользователей за последний месяц
WITH monthly_activity AS (
    SELECT 
        user_id,
        COUNT(*) as activity_count,
        COUNT(DISTINCT DATE(created_at)) as active_days
    FROM user_activities
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY user_id
),
user_stats AS (
    SELECT 
        u.nickname,
        u.carbon_saved,
        COALESCE(ma.activity_count, 0) as monthly_activities,
        COALESCE(ma.active_days, 0) as active_days,
        COUNT(ss.id) as published_stories
    FROM users u
    LEFT JOIN monthly_activity ma ON u.id = ma.user_id
    LEFT JOIN success_stories ss ON u.id = ss.user_id AND ss.is_published = TRUE
    WHERE u.is_active = TRUE
    GROUP BY u.id, u.nickname, u.carbon_saved, ma.activity_count, ma.active_days
)
SELECT *
FROM user_stats
WHERE monthly_activities > 0 OR published_stories > 0
ORDER BY monthly_activities DESC, carbon_saved DESC;

-- ============ ПРИМЕРЫ INSERT ОПЕРАЦИЙ ============

-- Добавление нового пользователя (автоматически создастся user_settings через триггер)
INSERT INTO users (email, nickname, password_hash, date_of_birth, gender_id)
VALUES ('newuser@example.com', 'new_eco_user', '$2b$10$hashedpassword', '1995-06-15', 1);

-- Добавление истории успеха
INSERT INTO success_stories (user_id, category_id, title, content, carbon_saved)
VALUES (
    1, 
    1, 
    'Переход на электромобиль',
    'Купил электромобиль и теперь экономлю 2 тонны CO₂ в год!',
    2000
);

-- Добавление пользователя в команду
INSERT INTO team_members (team_id, user_id, role, contribution)
VALUES (1, 5, 'member', 500);

-- ============ ПРИМЕРЫ UPDATE ОПЕРАЦИЙ ============

-- Обновление углеродного следа пользователя и пересчет эко-уровня
UPDATE users 
SET 
    carbon_saved = carbon_saved + 150,
    eco_level_id = calculate_user_eco_level(carbon_saved + 150),
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;

-- Обновление настроек пользователя
UPDATE user_settings 
SET 
    theme_id = (SELECT id FROM themes WHERE code = 'dark'),
    notifications_enabled = FALSE,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = 1;

-- Массовое обновление - деактивация старых эко-советов
UPDATE eco_tips 
SET is_active = FALSE
WHERE created_at < CURRENT_DATE - INTERVAL '1 year'
  AND views_count < 100;

-- ============ ПРИМЕРЫ DELETE ОПЕРАЦИЙ ============

-- Удаление неактивных пользователей (каскадно удалятся связанные записи)
DELETE FROM users 
WHERE is_active = FALSE 
  AND last_login_at < CURRENT_DATE - INTERVAL '2 years';

-- Удаление старых кодов подтверждения email
DELETE FROM email_verification_codes 
WHERE expires_at < CURRENT_TIMESTAMP 
  OR used = TRUE;

-- Удаление лайков для удаленных историй (обычно происходит автоматически через CASCADE)
DELETE FROM story_likes 
WHERE story_id NOT IN (SELECT id FROM success_stories);

-- ============ ИСПОЛЬЗОВАНИЕ ХРАНИМЫХ ПРОЦЕДУР ============

-- Получение профиля пользователя
SELECT * FROM get_user_profile(1);

-- Обновление настроек пользователя
SELECT update_user_settings(1, 'EN', 'dark', TRUE, TRUE, FALSE, TRUE, 2);

-- Получение топ пользователей
SELECT * FROM get_top_users(5);

-- Получение случайного эко-совета
SELECT * FROM get_random_eco_tip('RU');

-- ============ ПРИМЕРЫ РАБОТЫ С JSONB ============

-- Поиск активности пользователей по типу действия
SELECT 
    u.nickname,
    ua.activity_type,
    ua.activity_data,
    ua.created_at
FROM user_activities ua
JOIN users u ON ua.user_id = u.id
WHERE ua.activity_data ? 'achievement_id'  -- проверка наличия ключа
  AND ua.activity_data->>'achievement_id' = '5'  -- извлечение значения
ORDER BY ua.created_at DESC;

-- Агрегация JSON данных
SELECT 
    activity_type,
    COUNT(*) as count,
    jsonb_agg(activity_data) as all_data
FROM user_activities
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY activity_type;

-- ============ ИНДЕКСЫ И ПРОИЗВОДИТЕЛЬНОСТЬ ============

-- Проверка использования индексов
EXPLAIN ANALYZE 
SELECT u.nickname, COUNT(ss.id) as story_count
FROM users u
LEFT JOIN success_stories ss ON u.id = ss.user_id
WHERE u.carbon_saved > 1000
GROUP BY u.id, u.nickname
ORDER BY story_count DESC;

-- ============ ПРЕДСТАВЛЕНИЯ (VIEWS) ============

-- Создание представления для рейтинга пользователей
CREATE OR REPLACE VIEW user_rankings AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY u.carbon_saved DESC) as rank,
    u.id,
    u.nickname,
    u.carbon_saved,
    el.name_ru as eco_level,
    COUNT(ss.id) as story_count,
    COUNT(ua.id) as achievement_count
FROM users u
LEFT JOIN eco_levels el ON u.eco_level_id = el.id
LEFT JOIN success_stories ss ON u.id = ss.user_id AND ss.is_published = TRUE
LEFT JOIN user_achievements ua ON u.id = ua.user_id AND ua.completed = TRUE
WHERE u.is_active = TRUE
GROUP BY u.id, u.nickname, u.carbon_saved, el.name_ru
ORDER BY u.carbon_saved DESC;

-- Использование представления
SELECT * FROM user_rankings WHERE rank <= 10;

-- ============ СТАТИСТИЧЕСКИЕ ЗАПРОСЫ ============

-- Общая статистика платформы
SELECT 
    (SELECT COUNT(*) FROM users WHERE is_active = TRUE) as active_users,
    (SELECT SUM(carbon_saved) FROM users WHERE is_active = TRUE) as total_carbon_saved,
    (SELECT COUNT(*) FROM teams WHERE is_public = TRUE) as public_teams,
    (SELECT COUNT(*) FROM success_stories WHERE is_published = TRUE) as published_stories,
    (SELECT COUNT(*) FROM user_achievements WHERE completed = TRUE) as completed_achievements;

-- Статистика по месяцам
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as new_users,
    SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) as cumulative_users
FROM users
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;

-- ============ ПРОВЕРКА ЦЕЛОСТНОСТИ ДАННЫХ ============

-- Проверка консистентности счетчиков
SELECT 
    t.name,
    t.member_count as stored_count,
    COUNT(tm.id) as actual_count,
    CASE 
        WHEN t.member_count = COUNT(tm.id) THEN 'OK'
        ELSE 'INCONSISTENT'
    END as status
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = TRUE
GROUP BY t.id, t.name, t.member_count
HAVING t.member_count != COUNT(tm.id);

-- Проверка orphaned записей
SELECT 'user_settings without users' as issue, COUNT(*) as count
FROM user_settings us
LEFT JOIN users u ON us.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'team_members without teams' as issue, COUNT(*) as count
FROM team_members tm
LEFT JOIN teams t ON tm.team_id = t.id
WHERE t.id IS NULL;

-- ============ РЕЗЮМЕ СООТВЕТСТВИЯ ТРЕБОВАНИЯМ ============

/*
✅ 1. СТРУКТУРА БАЗЫ ДАННЫХ:
- 12+ таблиц с осмысленной предметной областью (экология, пользователи, команды)
- Связи один-ко-многим: users->success_stories, teams->team_members
- Связи многие-ко-многим: users<->teams, users<->achievements через промежуточные таблицы
- Правильная типизация: INTEGER, VARCHAR, TEXT, TIMESTAMP, BOOLEAN, JSONB, INET
- Первичные ключи во всех таблицах
- Внешние ключи с CASCADE для целостности

✅ 2. НОРМАЛИЗАЦИЯ:
- Соответствие 3НФ: нет транзитивных зависимостей
- Отсутствие дублирования: справочники вынесены отдельно
- Атомарность значений: каждое поле содержит одно значение

✅ 3. ХРАНИМЫЕ ПРОЦЕДУРЫ И ФУНКЦИИ:
- get_user_profile() - получение профиля пользователя
- update_user_settings() - обновление настроек
- get_top_users() - получение рейтинга
- calculate_user_eco_level() - расчет эко-уровня
- get_random_eco_tip() - получение случайного совета

✅ 4. НАПОЛНЕНИЕ ДАННЫМИ:
- 20+ тестовых пользователей
- 5+ команд с участниками
- 15+ историй успеха
- 50+ достижений
- Справочные данные

✅ 5. SQL-ЗАПРОСЫ:
- 7+ SELECT запросов разной сложности
- Примеры INSERT, UPDATE, DELETE
- Использование JOIN, GROUP BY, подзапросов, CTE, оконных функций
- Работа с JSONB данными
*/