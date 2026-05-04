const { allAsync, runAsync } = require('../db/db');
const { sendThreatEmail } = require('./mailer');

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function shouldSendReminder(threat) {
  if (!threat) return false;
  if (threat.status_reminder_sent) return false;
  if (String(threat.status).trim() !== 'Новый') return false;
  if (!threat.detected_at) return false;
  if (!threat.notification_email) return false;

  const detectedTs = new Date(threat.detected_at).getTime();
  if (Number.isNaN(detectedTs)) return false;

  return Date.now() - detectedTs >= TWO_HOURS_MS;
}

async function processRemindersOnce() {
  const rows = await allAsync('SELECT * FROM threats');

  for (const threat of rows) {
    if (!shouldSendReminder(threat)) {
      continue;
    }

    try {
      await sendThreatEmail(threat, 'reminder');
      await runAsync('UPDATE threats SET status_reminder_sent = 1, updated_at = datetime(\'now\') WHERE id = ?', [threat.id]);
      console.log(`[MAIL] Напоминание отправлено: incident=${threat.id}, to=${threat.notification_email}`);
    } catch (err) {
      console.error(`[MAIL] Не удалось отправить напоминание по incident=${threat.id}:`, err.message);
    }
  }
}

function startReminderWorker() {
  const enabled = String(process.env.ENABLE_REMINDER_WORKER || 'true') === 'true';
  const intervalMs = Number(process.env.REMINDER_INTERVAL_MS || 60000);

  if (!enabled) {
    console.log('[MAIL] Reminder worker disabled');
    return;
  }

  processRemindersOnce().catch((err) => {
    console.error('[MAIL] Initial reminder run failed:', err.message);
  });

  setInterval(() => {
    processRemindersOnce().catch((err) => {
      console.error('[MAIL] Reminder run failed:', err.message);
    });
  }, intervalMs);

  console.log(`[MAIL] Reminder worker started, interval=${intervalMs}ms`);
}

module.exports = {
  startReminderWorker
};
