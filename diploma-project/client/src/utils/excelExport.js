// Утилита для экспорта данных в Excel (CSV формат)

export const exportToExcel = (data, filename, headers) => {
  if (!data || data.length === 0) {
    return { success: false, error: 'Нет данных для экспорта' };
  }

  try {
    // Создаем CSV контент с точкой с запятой как разделителем (стандарт для Excel)
    let csvContent = '';
    
    // Добавляем заголовки
    if (headers && headers.length > 0) {
      csvContent += headers.join(';') + '\n';
    } else {
      // Если заголовки не указаны, используем ключи первого объекта
      const keys = Object.keys(data[0]);
      csvContent += keys.join(';') + '\n';
    }
    
    // Добавляем данные
    data.forEach(row => {
      const values = headers 
        ? headers.map(header => {
            const value = row[header] || '';
            const stringValue = String(value);
            // Экранируем точку с запятой, кавычки и переносы строк
            if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
        : Object.values(row).map(value => {
            const stringValue = String(value);
            if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          });
      csvContent += values.join(';') + '\n';
    });
    
    // Создаем Blob с BOM для корректного отображения кириллицы в Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Создаем ссылку для скачивания
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: 'Ошибка при экспорте данных' };
  }
};

// Функция для перевода эко-уровня на основе carbon_saved
const getEcoLevelFromCarbon = (carbonSaved, t) => {
  const carbon = carbonSaved || 0;
  
  if (carbon >= 10000) return t('ecoLegend') || 'Эко-легенда';
  if (carbon >= 5000) return t('ecoHero') || 'Эко-герой';
  if (carbon >= 4000) return t('ecoMaster') || 'Эко-мастер';
  if (carbon >= 3000) return t('ecoActivist') || 'Эко-активист';
  if (carbon >= 2000) return t('ecoEnthusiast') || 'Эко-энтузиаст';
  if (carbon >= 1000) return t('ecoStarter') || 'Эко-стартер';
  return t('ecoNovice') || 'Эко-новичок';
};

// Экспорт пользователей (принимает уже загруженные данные)
export const exportUsers = (users, t) => {
  // Функция для перевода эко-уровня
  const translateEcoLevel = (level) => {
    const levels = {
      'Эко-новичок': t('ecoNovice') || 'Эко-новичок',
      'Эко-стартер': t('ecoStarter') || 'Эко-стартер',
      'Эко-энтузиаст': t('ecoEnthusiast') || 'Эко-энтузиаст',
      'Эко-активист': t('ecoActivist') || 'Эко-активист',
      'Эко-мастер': t('ecoMaster') || 'Эко-мастер',
      'Эко-герой': t('ecoHero') || 'Эко-герой',
      'Эко-легенда': t('ecoLegend') || 'Эко-легенда',
      // English versions
      'Eco Novice': t('ecoNovice') || 'Эко-новичок',
      'Eco Starter': t('ecoStarter') || 'Эко-стартер',
      'Eco Enthusiast': t('ecoEnthusiast') || 'Эко-энтузиаст',
      'Eco Activist': t('ecoActivist') || 'Эко-активист',
      'Eco Master': t('ecoMaster') || 'Эко-мастер',
      'Eco Hero': t('ecoHero') || 'Эко-герой',
      'Eco Legend': t('ecoLegend') || 'Эко-легенда'
    };
    return levels[level] || level;
  };

  const headers = [
    t('userId') || 'ID',
    t('nickname') || 'Никнейм',
    t('email') || 'Email',
    t('role') || 'Роль',
    t('status') || 'Статус',
    t('carbonSaved') || 'CO2 сэкономлено',
    t('ecoLevel') || 'Эко-уровень',
    t('registrationDate') || 'Дата регистрации'
  ];
  
  const data = users.map(user => {
    // Определяем эко-уровень на основе carbon_saved если eco_level не задан
    const ecoLevel = user.eco_level || getEcoLevelFromCarbon(user.carbon_saved, t);
    
    return {
      [t('userId') || 'ID']: user.id,
      [t('nickname') || 'Никнейм']: user.nickname,
      [t('email') || 'Email']: user.email,
      [t('role') || 'Роль']: user.is_admin ? (t('administrator') || 'Администратор') : (t('user') || 'Пользователь'),
      [t('status') || 'Статус']: user.is_banned ? (t('blocked') || 'Заблокирован') : (t('active') || 'Активен'),
      [t('carbonSaved') || 'CO2 сэкономлено']: user.carbon_saved || 0,
      [t('ecoLevel') || 'Эко-уровень']: translateEcoLevel(ecoLevel),
      [t('registrationDate') || 'Дата регистрации']: new Date(user.created_at).toLocaleDateString()
    };
  });
  
  return exportToExcel(data, 'users', headers);
};

// Экспорт ВСЕХ пользователей (загружает данные с сервера)
export const exportAllUsers = async (t) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'Токен не найден' };
    }
    
    // Загружаем ВСЕ пользователей через специальный роут
    const response = await fetch('/api/admin/all-users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Export error:', response.status, response.statusText, errorData);
      return { success: false, error: `Ошибка ${response.status}: ${errorData.message || response.statusText}` };
    }
    
    const data = await response.json();
    
    if (data.success && data.users && data.users.length > 0) {
      console.log('Exporting', data.users.length, 'users');
      return exportUsers(data.users, t);
    } else {
      return { success: false, error: 'Нет пользователей для экспорта' };
    }
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
};

// Экспорт обращений в поддержку с переводом
export const exportSupportTickets = async (tickets, t, currentLanguage) => {
  // Импортируем функции перевода
  const { translateStoryContent, detectTextLanguage } = await import('./translations.js');
  
  const headers = [
    t('ticketNumber') || 'Номер',
    t('user') || 'Пользователь',
    t('email') || 'Email',
    t('subject') || 'Тема',
    t('message') || 'Сообщение',
    t('status') || 'Статус',
    t('createdDate') || 'Дата создания',
    t('updatedDate') || 'Дата обновления'
  ];
  
  // Переводим темы и сообщения если доступен Chrome Translation API
  let translatedTickets = tickets;
  
  if ('Translator' in self && currentLanguage) {
    try {
      const targetLang = currentLanguage.toLowerCase();
      
      translatedTickets = await Promise.all(
        tickets.map(async (ticket) => {
          try {
            const subjectLang = detectTextLanguage(ticket.subject);
            const messageLang = detectTextLanguage(ticket.message);
            
            let translatedSubject = ticket.subject;
            let translatedMessage = ticket.message;
            
            if (subjectLang !== targetLang) {
              translatedSubject = await translateStoryContent(ticket.subject, currentLanguage, subjectLang);
            }
            
            if (messageLang !== targetLang) {
              translatedMessage = await translateStoryContent(ticket.message, currentLanguage, messageLang);
            }
            
            return {
              ...ticket,
              subject: translatedSubject,
              message: translatedMessage
            };
          } catch (error) {
            console.error('Translation error:', error);
            return ticket;
          }
        })
      );
    } catch (error) {
      console.error('Translation API error:', error);
    }
  }
  
  const data = translatedTickets.map(ticket => ({
    [t('ticketNumber') || 'Номер']: ticket.ticket_number,
    [t('user') || 'Пользователь']: ticket.username,
    [t('email') || 'Email']: ticket.user_email,
    [t('subject') || 'Тема']: ticket.subject,
    [t('message') || 'Сообщение']: ticket.message,
    [t('status') || 'Статус']: 
      ticket.status === 'open' ? (t('open') || 'Открыто') : 
      ticket.status === 'in_progress' ? (t('inProgress') || 'В работе') : 
      (t('closed') || 'Закрыто'),
    [t('createdDate') || 'Дата создания']: new Date(ticket.created_at).toLocaleDateString(),
    [t('updatedDate') || 'Дата обновления']: new Date(ticket.updated_at).toLocaleDateString()
  }));
  
  return exportToExcel(data, 'support_tickets', headers);
};

// Экспорт ВСЕХ тикетов поддержки (загружает данные с сервера)
export const exportAllSupportTickets = async (t, currentLanguage) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'Токен не найден' };
    }
    
    // Загружаем ВСЕ тикеты через специальный роут
    const response = await fetch('/api/admin/support/all-tickets', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Export error:', response.status, response.statusText, errorData);
      return { success: false, error: `Ошибка ${response.status}: ${errorData.message || response.statusText}` };
    }
    
    const data = await response.json();
    
    if (data.success && data.tickets && data.tickets.length > 0) {
      console.log('Exporting', data.tickets.length, 'support tickets');
      return await exportSupportTickets(data.tickets, t, currentLanguage);
    } else {
      return { success: false, error: 'Нет тикетов для экспорта' };
    }
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
};

// Экспорт жалоб
export const exportReports = (reports, t) => {
  const headers = [
    t('reportId') || 'ID',
    t('reporter') || 'Отправитель',
    t('reporterEmail') || 'Email отправителя',
    t('reportedUser') || 'На пользователя',
    t('reportedEmail') || 'Email пользователя',
    t('reason') || 'Причина',
    t('status') || 'Статус',
    t('createdDate') || 'Дата создания'
  ];
  
  const data = reports.map(report => ({
    [t('reportId') || 'ID']: report.id,
    [t('reporter') || 'Отправитель']: report.reporter_nickname,
    [t('reporterEmail') || 'Email отправителя']: report.reporter_email,
    [t('reportedUser') || 'На пользователя']: report.reported_nickname,
    [t('reportedEmail') || 'Email пользователя']: report.reported_email,
    [t('reason') || 'Причина']: report.reason,
    [t('status') || 'Статус']: 
      report.status === 'pending' ? (t('pending') || 'Ожидает') : 
      report.status === 'reviewing' ? (t('reviewing') || 'На рассмотрении') : 
      report.status === 'resolved' ? (t('resolved') || 'Решено') : 
      (t('rejected') || 'Отклонено'),
    [t('createdDate') || 'Дата создания']: new Date(report.created_at).toLocaleDateString()
  }));
  
  return exportToExcel(data, 'reports', headers);
};

// Экспорт ВСЕХ жалоб (загружает данные с сервера)
export const exportAllReports = async (t) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'Токен не найден' };
    }
    
    // Загружаем ВСЕ жалобы через специальный роут
    const response = await fetch('/api/reports/admin/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Export error:', response.status, response.statusText, errorData);
      return { success: false, error: `Ошибка ${response.status}: ${errorData.message || response.statusText}` };
    }
    
    const data = await response.json();
    
    if (data.success && data.reports && data.reports.length > 0) {
      console.log('Exporting', data.reports.length, 'reports');
      return exportReports(data.reports, t);
    } else {
      return { success: false, error: 'Нет жалоб для экспорта' };
    }
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
};
