@echo off
echo 🌱 Запуск EcoSteps проекта...

REM Проверяем наличие Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker не установлен. Установите Docker Desktop.
    pause
    exit /b 1
)

REM Проверяем наличие Docker Compose
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose не установлен.
    pause
    exit /b 1
)

REM Создаем .env файл если его нет
if not exist .env (
    echo 📝 Создаем .env файл из примера...
    copy .env.example .env
    echo ✅ .env файл создан. Можете отредактировать его при необходимости.
)

REM Останавливаем существующие контейнеры
echo 🛑 Останавливаем существующие контейнеры...
docker-compose down

REM Собираем и запускаем все сервисы
echo 🚀 Запускаем все сервисы...
docker-compose up --build -d

REM Ждем запуска сервисов
echo ⏳ Ждем запуска сервисов...
timeout /t 10 /nobreak >nul

REM Проверяем статус
echo 📊 Проверяем статус сервисов...
docker-compose ps

echo.
echo 🎉 EcoSteps запущен!
echo.
echo 📱 Доступные сервисы:
echo    • Клиент (React):     http://localhost:5173
echo    • API Сервер:         http://localhost:3001
echo    • PostgreSQL:         localhost:5432
echo    • Redis:              localhost:6379
echo.
echo 📝 Полезные команды:
echo    • Просмотр логов:     docker-compose logs -f
echo    • Остановка:          docker-compose down
echo    • Перезапуск:         docker-compose restart
echo.
echo 🔍 Для отладки откройте: http://localhost:5173
pause