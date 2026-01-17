const nodemailer = require('nodemailer');

// Генерация 6-значного кода
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Создание транспорта для отправки email
function createEmailTransporter() {
  // Для разработки используем ethereal.email (тестовый SMTP)
  // В продакшене замените на реальный SMTP (Gmail, SendGrid, etc.)
  
  if (process.env.NODE_ENV === 'production') {
    // Продакшен конфигурация (например, Gmail)
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Для разработки используем Ethereal (тестовый SMTP)
    // Или можно использовать Mailtrap
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'test@ethereal.email',
        pass: process.env.SMTP_PASS || 'test'
      }
    });
  }
}

// Отправка кода подтверждения
async function sendVerificationEmail(email, code, language = 'ru') {
  const transporter = createEmailTransporter();
  
  const translations = {
    ru: {
      subject: 'Подтверждение регистрации в EcoSteps',
      title: 'Подтверждение email',
      greeting: 'Здравствуйте!',
      message: 'Спасибо за регистрацию в EcoSteps. Ваш код подтверждения:',
      codeLabel: 'Код подтверждения',
      validity: 'Код действителен в течение 10 минут.',
      warning: 'Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.',
      footer: 'С уважением, команда EcoSteps'
    },
    en: {
      subject: 'Email Verification for EcoSteps',
      title: 'Email Verification',
      greeting: 'Hello!',
      message: 'Thank you for registering with EcoSteps. Your verification code is:',
      codeLabel: 'Verification Code',
      validity: 'This code is valid for 10 minutes.',
      warning: 'If you did not register on our website, please ignore this email.',
      footer: 'Best regards, EcoSteps Team'
    },
    by: {
      subject: 'Пацверджанне рэгістрацыі ў EcoSteps',
      title: 'Пацверджанне email',
      greeting: 'Добры дзень!',
      message: 'Дзякуй за рэгістрацыю ў EcoSteps. Ваш код пацверджання:',
      codeLabel: 'Код пацверджання',
      validity: 'Код дзейсны на працягу 10 хвілін.',
      warning: 'Калі вы не рэгістраваліся на нашым сайце, проста ігнаруйце гэты ліст.',
      footer: 'З павагай, каманда EcoSteps'
    }
  };
  
  const t = translations[language] || translations.ru;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"EcoSteps" <noreply@ecosteps.com>',
    to: email,
    subject: t.subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            border: 2px solid #7cb342;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #7cb342;
            margin: 0;
          }
          .code-box {
            background: white;
            border: 3px dashed #7cb342;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 36px;
            font-weight: bold;
            color: #7cb342;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 ${t.title}</h1>
          </div>
          
          <p>${t.greeting}</p>
          <p>${t.message}</p>
          
          <div class="code-box">
            <div style="color: #666; font-size: 14px; margin-bottom: 10px;">${t.codeLabel}</div>
            <div class="code">${code}</div>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 14px;">
            ⏱️ ${t.validity}
          </p>
          
          <div class="warning">
            ⚠️ ${t.warning}
          </div>
          
          <div class="footer">
            <p>${t.footer}</p>
            <p>🌍 EcoSteps - Вместе к устойчивому будущему</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email отправлен:', info.messageId);
    
    // Для разработки с Ethereal показываем ссылку для просмотра письма
    if (process.env.NODE_ENV !== 'production') {
      console.log('📬 Просмотр письма:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error);
    return { success: false, error: error.message };
  }
}

// Проверка валидности email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  isValidEmail
};
