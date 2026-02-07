# Дипломный проект EcoSteps

### Требования
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (включает Docker Compose)
- Git

### Запуск проекта
```bash
# Клонируем репозиторий
git clone https://github.com/anzhelika-06/diploma-project.git
cd diploma-project/diploma-project

# Запускаем все сервисы одной командой
# Для Linux/Mac:
./start.sh

# Для Windows:
start.bat

# Или напрямую через Docker Compose:
docker-compose up --build -d
```

Все сервисы запущены и доступны:
- **Клиент (React)**: http://localhost:5173
- **API Server**: http://localhost:3001  
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Остановка проекта
```bash
docker-compose down
```
## Redis

Redis используется для:
- **WebSocket сессий** - хранение активных подключений
- **Кэширование** - быстрый доступ к данным
- **Pub/Sub** - синхронизация между серверами (Socket.IO adapter)


## WebSocket

Реализована система real-time обновлений через Socket.IO:
- Аутентификация пользователей
- Персональные комнаты
- Уведомления о лайках
- Онлайн статусы

## Технологии

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Socket.IO** - WebSocket для real-time
- **PostgreSQL** - Основная база данных
- **Redis** - Сессии и кэширование
- **bcrypt** - Хеширование паролей
- **JWT** - Аутентификация 

### Frontend
- **React** - UI библиотека
- **Vite** - Build tool
- **Socket.IO Client** - WebSocket клиент
- **React Router** - Маршрутизация

### DevOps
- **Docker** - Контейнеризация
- **Docker Compose** - Оркестрация
- **Nginx** - Reverse proxy (продакшен)
- **Nodemon** - Hot reload (разработка)

## 📝 Разработка

### Установка зависимостей локально
```bash
# Сервер
cd diploma-project/server
npm install

# Клиент
cd diploma-project/client
npm install
```

### Запуск без Docker
```bash
# Убедитесь, что PostgreSQL и Redis запущены
cd diploma-project/server
npm run dev

# В другом терминале
cd diploma-project/client
npm run dev
```

### Тестирование Redis
```bash
# Запустить тесты сессий
docker exec ecosteps_server node test-redis-sessions.js

# Подключиться к Redis CLI
docker exec -it ecosteps_redis redis-cli -a ecosteps_redis_password
```

### Просмотр логов
```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker logs ecosteps_server -f
docker logs ecosteps_postgres -f
docker logs ecosteps_redis -f
```
### Проверка Redis
```bash
# Проверить онлайн пользователей
curl http://localhost:3001/api/online-users

# Проверить статистику
curl http://localhost:3001/api/stats
```

##  Деплой

Проект готов к деплою с использованием Docker Compose в продакшн режиме:

```bash
# Сборка и запуск
docker-compose -f docker-compose.prod.yml up -d --build

# Проверка статуса
docker-compose -f docker-compose.prod.yml ps

# Остановка
docker-compose -f docker-compose.prod.yml down
```

## Лицензия

MIT License - см. файл LICENSE для деталей.
