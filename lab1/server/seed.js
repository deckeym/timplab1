const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getAsync, runAsync } = require('./db/db');

const defaultUsers = [
  { username: 'admin', email: 'botandimon@gmail.com', password: 'root', role: 'admin' },
  { username: 'guest', email: 'guest@example.com', password: 'root', role: 'guest' },
  { username: 'user', email: 'user@example.com', password: 'root', role: 'user' },
  { username: 'user2', email: 'user2@example.com', password: 'root', role: 'user' },
  { username: 'user3', email: 'user3@example.com', password: 'root', role: 'user' },
  { username: 'operator1', email: 'operator1@example.com', password: 'root', role: 'user' }
];

const statuses = ['Новый', 'В работе', 'Локализован', 'Закрыт'];
const categories = ['Фишинг', 'Вредоносное ПО', 'Несанкционированный доступ', 'DDoS', 'Утечка данных'];
const severities = ['Низкий', 'Средний', 'Высокий', 'Критический'];

function buildThreat(owner, index) {
  const status = statuses[index % statuses.length];
  const category = categories[index % categories.length];
  const severity = severities[index % severities.length];
  const day = String((index % 9) + 1).padStart(2, '0');
  const hour = String(8 + (index % 10)).padStart(2, '0');

  return [
    `[TEST] Инцидент ${index + 1} для ${owner.username}`,
    status,
    category,
    severity,
    'Система мониторинга',
    'SIEM',
    `Сервер ${100 + index}`,
    'Дежурный специалист ИБ',
    `Тестовое описание инцидента ${index + 1} для пользователя ${owner.username}.`,
    'Потенциальное влияние на доступность и целостность сервисов.',
    'Зарегистрирован инцидент, назначен ответственный, начат анализ.',
    `2026-04-${day}T${hour}:00`,
    status === 'Закрыт' ? `2026-04-${day}` : null,
    `Сотрудник ${index + 1}`,
    'Автосгенерированная тестовая запись.',
    owner.id,
    owner.username,
    owner.email,
    0
  ];
}

function dnsChecksum(item) {
  return crypto
    .createHash('sha256')
    .update([item.host, item.type, item.value, item.ttl, item.comment || ''].join('|'))
    .digest('hex');
}

async function seedUsers() {
  for (const item of defaultUsers) {
    const exists = await getAsync(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [item.username, item.email]
    );

    if (exists) {
      continue;
    }

    const hash = await bcrypt.hash(item.password, 12);
    await runAsync(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [item.username, item.email, hash, item.role]
    );
  }
}

async function seedThreatsForOwner(owner, targetCount) {
  if (!owner) {
    return 0;
  }

  const countRow = await getAsync(
    'SELECT COUNT(*) AS count FROM threats WHERE owner_id = ?',
    [owner.id]
  );

  const currentCount = Number(countRow?.count || 0);
  if (currentCount >= targetCount) {
    return 0;
  }

  let created = 0;
  for (let i = currentCount; i < targetCount; i += 1) {
    await runAsync(
      `INSERT INTO threats (
        title, status, category, severity, source, detected_by, affected_asset, responsible,
        description, impact, response, detected_at, resolved_at, reporter, comment,
        owner_id, owner_username, notification_email, status_reminder_sent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      buildThreat(owner, i)
    );
    created += 1;
  }

  return created;
}

async function seedAll() {
  await seedUsers();

  const admin = await getAsync(
    'SELECT id, username, email, role FROM users WHERE username = ?',
    ['admin']
  );
  await seedThreatsForOwner(admin, 10);

  const firstUser = await getAsync(
    'SELECT id, username, email, role FROM users WHERE role = ? AND username <> ? ORDER BY id ASC LIMIT 1',
    ['user', 'guest']
  );
  await seedThreatsForOwner(firstUser, 10);

  const dnsCount = await getAsync('SELECT COUNT(*) AS count FROM dns_records');
  if (Number(dnsCount?.count || 0) === 0) {
    const admin = await getAsync('SELECT id FROM users WHERE username = ?', ['admin']);
    if (admin) {
      const defaults = [
        { host: 'corp.local', type: 'A', value: '10.0.0.10', ttl: 3600, comment: 'Главный DNS узел' },
        { host: 'mail.corp.local', type: 'A', value: '10.0.0.25', ttl: 3600, comment: 'Почтовый сервер' },
        { host: 'vpn.corp.local', type: 'A', value: '10.0.0.50', ttl: 1800, comment: 'VPN шлюз' }
      ];

      for (const item of defaults) {
        await runAsync(
          `INSERT INTO dns_records (host, type, value, ttl, comment, checksum, updated_by, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [item.host, item.type, item.value, item.ttl, item.comment, dnsChecksum(item), admin.id]
        );
      }
    }
  }
}

module.exports = seedAll;
