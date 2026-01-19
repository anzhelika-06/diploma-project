# Dockerfile для React клиента
FROM node:20-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости (включая dev)
RUN npm ci

# Копируем исходный код
COPY . .

# Открываем порт
EXPOSE 5173

# Запускаем dev сервер
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]