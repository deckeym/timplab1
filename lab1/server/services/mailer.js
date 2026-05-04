const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

function normalizeSecret(value) {
  if (!value) return '';
  return String(value).replace(/"/g, '').replace(/\s+/g, '').trim();
}

function createTransport() {
  const mode = String(process.env.MAIL_MODE || 'smtp').toLowerCase();
  if (mode === 'file') {
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }

  const provider = String(process.env.MAIL_PROVIDER || '').toLowerCase();
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = normalizeSecret(process.env.SMTP_PASS);
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';

  if (!user || !pass) {
    return null;
  }

  if (provider === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass
      }
    });
  }

  if (!host) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
}

async function sendThreatEmail(threat, mode = 'manual') {
  const mailMode = String(process.env.MAIL_MODE || 'smtp').toLowerCase();
  const transporter = createTransport();
  if (!transporter) {
    throw new Error('SMTP не настроен: укажите SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
  }

  if (!threat.notification_email) {
    throw new Error('У инцидента не указан notificationEmail');
  }

  const subjectPrefix = mode === 'reminder' ? 'Напоминание' : 'Обновление';
  const subject = `${subjectPrefix}: инцидент ИБ "${threat.title}"`;

  const text = [
    'Здравствуйте!',
    '',
    'Информация по инциденту информационной безопасности:',
    `ID: ${threat.id}`,
    `Название: ${threat.title}`,
    `Статус: ${threat.status}`,
    `Категория: ${threat.category}`,
    `Критичность: ${threat.severity}`,
    `Источник: ${threat.source}`,
    `Обнаружен: ${threat.detected_by}`,
    `Затронутый актив: ${threat.affected_asset}`,
    `Ответственный: ${threat.responsible}`,
    `Владелец: ${threat.owner_username}`,
    `Описание: ${threat.description}`,
    `Последствия: ${threat.impact}`,
    `Меры: ${threat.response}`,
    `Дата обнаружения: ${threat.detected_at}`,
    `Дата устранения: ${threat.resolved_at || 'Не устранен'}`,
    `Кто сообщил: ${threat.reporter}`,
    `Комментарий: ${threat.comment || '-'}`,
    '',
    'Письмо сформировано автоматически.'
  ].join('\n');

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: threat.notification_email,
    subject,
    text
  });

  if (mailMode === 'file') {
    const outDir = path.join(__dirname, '..', 'mail_outbox');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const filename = `${Date.now()}_incident-${threat.id}.eml`;
    fs.writeFileSync(path.join(outDir, filename), info.message);
    return { mode: 'file', file: filename };
  }

  return { mode: 'smtp', messageId: info.messageId };
}

async function sendCustomEmail(to, subject, text) {
  const mailMode = String(process.env.MAIL_MODE || 'smtp').toLowerCase();
  const transporter = createTransport();
  if (!transporter) {
    throw new Error('SMTP не настроен: укажите SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text
  });

  if (mailMode === 'file') {
    const outDir = path.join(__dirname, '..', 'mail_outbox');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const filename = `${Date.now()}_custom.eml`;
    fs.writeFileSync(path.join(outDir, filename), info.message);
    return { mode: 'file', file: filename };
  }

  return { mode: 'smtp', messageId: info.messageId };
}

module.exports = {
  sendThreatEmail,
  sendCustomEmail
};
