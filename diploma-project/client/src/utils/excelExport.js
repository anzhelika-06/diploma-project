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

// Экспорт пользователей
export const exportUsers = (users, t) => {
  const headers = ['ID', 'Никнейм', 'Email', 'Роль', 'Статус', 'CO2 сэкономлено', 'Эко-уровень', 'Дата регистрации'];
  const data = users.map(user => ({
    'ID': user.id,
    'Никнейм': user.nickname,
    'Email': user.email,
    'Роль': user.is_admin ? 'Администратор' : 'Пользователь',
    'Статус': user.is_banned ? 'Заблокирован' : 'Активен',
    'CO2 сэкономлено': user.carbon_saved || 0,
    'Эко-уровень': user.eco_level || 'Эко-новичок',
    'Дата регистрации': new Date(user.created_at).toLocaleDateString()
  }));
  
  exportToExcel(data, 'users', headers);
};

// Экспорт обращений в поддержку
export const exportSupportTickets = (tickets, t) => {
  const headers = ['Номер', 'Пользователь', 'Email', 'Тема', 'Статус', 'Дата создания', 'Дата обновления'];
  const data = tickets.map(ticket => ({
    'Номер': ticket.ticket_number,
    'Пользователь': ticket.username,
    'Email': ticket.user_email,
    'Тема': ticket.subject,
    'Статус': ticket.status === 'open' ? 'Открыто' : ticket.status === 'in_progress' ? 'В работе' : 'Закрыто',
    'Дата создания': new Date(ticket.created_at).toLocaleDateString(),
    'Дата обновления': new Date(ticket.updated_at).toLocaleDateString()
  }));
  
  exportToExcel(data, 'support_tickets', headers);
};

// Экспорт жалоб
export const exportReports = (reports, t) => {
  const headers = ['ID', 'Отправитель', 'Email отправителя', 'На пользователя', 'Email пользователя', 'Причина', 'Статус', 'Дата создания'];
  const data = reports.map(report => ({
    'ID': report.id,
    'Отправитель': report.reporter_nickname,
    'Email отправителя': report.reporter_email,
    'На пользователя': report.reported_nickname,
    'Email пользователя': report.reported_email,
    'Причина': report.reason,
    'Статус': report.status === 'pending' ? 'Ожидает' : 
              report.status === 'reviewing' ? 'На рассмотрении' : 
              report.status === 'resolved' ? 'Решено' : 'Отклонено',
    'Дата создания': new Date(report.created_at).toLocaleDateString()
  }));
  
  exportToExcel(data, 'reports', headers);
};
