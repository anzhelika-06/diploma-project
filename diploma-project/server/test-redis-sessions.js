/**
 * Тестовый скрипт для проверки Redis сессий
 * Запуск: node test-redis-sessions.js
 */

const sessionManager = require('./utils/sessionManager');

async function testRedisSessions() {
  console.log('🧪 Тестирование Redis сессий...\n');

  try {
    // Тест 1: Сохранение сессии
    console.log('1️⃣ Сохранение тестовой сессии...');
    await sessionManager.saveSession('test-socket-1', {
      userId: 123,
      nickname: 'TestUser',
      connectedAt: new Date().toISOString()
    });
    console.log('✅ Сессия сохранена\n');

    // Тест 2: Получение сессии
    console.log('2️⃣ Получение сессии...');
    const session = await sessionManager.getSession('test-socket-1');
    console.log('✅ Сессия получена:', session, '\n');

    // Тест 3: Проверка онлайн статуса
    console.log('3️⃣ Проверка онлайн статуса...');
    const isOnline = await sessionManager.isUserOnline(123);
    console.log('✅ Пользователь онлайн:', isOnline, '\n');

    // Тест 4: Получение списка онлайн пользователей
    console.log('4️⃣ Получение списка онлайн пользователей...');
    const onlineUsers = await sessionManager.getOnlineUsers();
    console.log('✅ Онлайн пользователи:', onlineUsers, '\n');

    // Тест 5: Добавление второго сокета для того же пользователя
    console.log('5️⃣ Добавление второго сокета...');
    await sessionManager.saveSession('test-socket-2', {
      userId: 123,
      nickname: 'TestUser',
      connectedAt: new Date().toISOString()
    });
    const userSockets = await sessionManager.getUserSockets(123);
    console.log('✅ Сокеты пользователя:', userSockets, '\n');

    // Тест 6: Удаление одного сокета
    console.log('6️⃣ Удаление первого сокета...');
    const result1 = await sessionManager.deleteSession('test-socket-1');
    console.log('✅ Результат удаления:', result1, '\n');

    // Тест 7: Удаление последнего сокета
    console.log('7️⃣ Удаление последнего сокета...');
    const result2 = await sessionManager.deleteSession('test-socket-2');
    console.log('✅ Результат удаления:', result2, '\n');

    // Тест 8: Проверка что пользователь офлайн
    console.log('8️⃣ Проверка офлайн статуса...');
    const isStillOnline = await sessionManager.isUserOnline(123);
    console.log('✅ Пользователь онлайн:', isStillOnline, '\n');

    console.log('🎉 Все тесты пройдены успешно!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка тестирования:', err);
    process.exit(1);
  }
}

testRedisSessions();
