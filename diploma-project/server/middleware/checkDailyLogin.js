// middleware/checkDailyLogin.js - ИСПРАВЛЕННЫЙ ВАРИАНТ
const { pool } = require('../config/database');

const checkDailyLogin = async (req, res, next) => {
  console.log('🔍 checkDailyLogin вызван для:', req.method, req.url);
  
  try {
    // Если нет пользователя - просто пропускаем
    if (!req.user) {
      console.log('⚠️ Нет req.user, пропускаем');
      return next();
    }
    
    const userId = req.user.id || req.user.userId;
    if (!userId) {
      console.log('⚠️ Нет userId, пропускаем');
      return next();
    }
    
    console.log(`🎯 Проверяем daily login для пользователя ${userId}`);
    
    const client = await pool.connect();
    
    try {
      const now = new Date();
      const mskOffset = 3;
      const nowMSK = new Date(now.getTime() + (mskOffset * 60 * 60 * 1000));
      const startOfDayMSK = new Date(nowMSK);
      startOfDayMSK.setHours(0, 0, 0, 0);
      const startOfDayUTC = new Date(startOfDayMSK.getTime() - (mskOffset * 60 * 60 * 1000));

      // Получаем данные пользователя
      const userQuery = `
        SELECT id, last_daily_login, login_streak
        FROM users WHERE id = $1
      `;
      
      const userResult = await client.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        console.log(`⚠️ Пользователь ${userId} не найден`);
        return next();
      }
      
      const user = userResult.rows[0];
      const lastDailyLogin = user.last_daily_login ? new Date(user.last_daily_login) : null;
      
      // Проверяем, нужно ли засчитать daily login
      if (!lastDailyLogin || lastDailyLogin < startOfDayUTC) {
        console.log(`✅ Нужно засчитать daily login для ${userId}`);
        
        let newStreak = 1;
        
        if (lastDailyLogin) {
          const yesterdayMSK = new Date(startOfDayMSK);
          yesterdayMSK.setDate(yesterdayMSK.getDate() - 1);
          const yesterdayUTC = new Date(yesterdayMSK.getTime() - (mskOffset * 60 * 60 * 1000));
          
          const timeDiff = yesterdayUTC.getTime() - lastDailyLogin.getTime();
          const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          
          if (Math.abs(daysDiff) === 1) {
            newStreak = (user.login_streak || 0) + 1;
          } else if (Math.abs(daysDiff) > 1) {
            newStreak = 1;
          }
        }
        
        // Обновляем запись
        await client.query(
          `UPDATE users SET last_daily_login = $1, login_streak = $2 WHERE id = $3`,
          [now, newStreak, userId]
        );
        
        console.log(`💾 Обновлен daily login для ${userId}, стрик: ${newStreak}`);
      } else {
        console.log(`⏭️ Daily login уже засчитан для ${userId}`);
      }
      
    } catch (error) {
      console.error('❌ Ошибка в checkDailyLogin (БД):', error.message);
      // Продолжаем выполнение
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Ошибка в checkDailyLogin:', error.message);
    // Продолжаем выполнение
  }
  
  // ВАЖНОЕ ИСПРАВЛЕНИЕ: ВСЕГДА вызываем next()
  next();
};

module.exports = { checkDailyLogin };