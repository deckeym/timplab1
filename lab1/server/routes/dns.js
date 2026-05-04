const express = require('express');
const crypto = require('crypto');
const { allAsync, getAsync, runAsync } = require('../db/db');
const { authRequired } = require('../middleware/auth');
const { sendCustomEmail } = require('../services/mailer');

const router = express.Router();
const allowedDnsTypes = new Set(['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SRV', 'PTR']);

function checksumRecord(record) {
  const raw = [record.host, record.type, record.value, record.ttl, record.comment || ''].join('|');
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function mapRow(row) {
  return {
    id: row.id,
    host: row.host,
    type: row.type,
    value: row.value,
    ttl: row.ttl,
    comment: row.comment || '',
    checksum: row.checksum,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function notifyAdmins(subject, text) {
  const admins = await allAsync("SELECT email FROM users WHERE role = 'admin' AND email IS NOT NULL AND email <> ''");
  if (!admins.length) {
    return { sent: 0 };
  }

  const uniqueEmails = [...new Set(admins.map((item) => item.email))];
  await sendCustomEmail(uniqueEmails.join(','), subject, text);
  return { sent: uniqueEmails.length };
}

router.get('/', authRequired, async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim();
    const params = [];
    let where = '';

    if (search) {
      where = `WHERE LOWER(host) LIKE LOWER(?) OR LOWER(value) LIKE LOWER(?) OR LOWER(type) LIKE LOWER(?)`;
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    const rows = await allAsync(
      `SELECT * FROM dns_records ${where} ORDER BY host ASC`,
      params
    );

    return res.status(200).json({ data: rows.map(mapRow) });
  } catch (err) {
    return next(err);
  }
});

router.get('/deleted-recent', authRequired, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ только для администраторов' });
    }

    const rows = await allAsync(
      `SELECT b.id, b.dns_record_id, b.action, b.previous_snapshot, b.previous_checksum, b.changed_by, b.created_at,
              u.username AS changedByUsername
       FROM dns_backups b
       LEFT JOIN users u ON u.id = b.changed_by
       WHERE b.action = 'delete'
       ORDER BY b.id DESC
       LIMIT 50`
    );

    const data = rows.map((item) => {
      let snapshot = {};
      try {
        snapshot = JSON.parse(item.previous_snapshot);
      } catch (err) {
        snapshot = {};
      }

      return {
        id: item.id,
        dnsRecordId: item.dns_record_id,
        action: item.action,
        previousChecksum: item.previous_checksum,
        changedBy: item.changed_by,
        changedByUsername: item.changedByUsername,
        createdAt: item.created_at,
        snapshot: {
          host: snapshot.host,
          type: snapshot.type,
          value: snapshot.value,
          ttl: snapshot.ttl,
          comment: snapshot.comment || ''
        }
      };
    });

    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
});

router.get('/updated-recent', authRequired, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ только для администраторов' });
    }

    const rows = await allAsync(
      `SELECT b.id, b.dns_record_id, b.action, b.previous_snapshot, b.previous_checksum, b.changed_by, b.created_at,
              u.username AS changedByUsername
       FROM dns_backups b
       LEFT JOIN users u ON u.id = b.changed_by
       WHERE b.action = 'update'
       ORDER BY b.id DESC
       LIMIT 50`
    );

    const data = rows.map((item) => {
      let snapshot = {};
      try {
        snapshot = JSON.parse(item.previous_snapshot);
      } catch (err) {
        snapshot = {};
      }

      return {
        id: item.id,
        dnsRecordId: item.dns_record_id,
        action: item.action,
        previousChecksum: item.previous_checksum,
        changedBy: item.changed_by,
        changedByUsername: item.changedByUsername,
        createdAt: item.created_at,
        snapshot: {
          host: snapshot.host,
          type: snapshot.type,
          value: snapshot.value,
          ttl: snapshot.ttl,
          comment: snapshot.comment || ''
        }
      };
    });

    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
});

router.post('/', authRequired, async (req, res, next) => {
  try {
    if (req.user.role === 'guest') {
      return res.status(403).json({ message: 'Гостевой пользователь не может изменять DNS-записи' });
    }

    const host = String(req.body.host || '').trim().toLowerCase();
    const type = String(req.body.type || '').trim().toUpperCase();
    const value = String(req.body.value || '').trim();
    const ttl = Number(req.body.ttl || 0);
    const comment = String(req.body.comment || '').trim();

    if (!host || !type || !value || !ttl) {
      return res.status(400).json({ message: 'host, type, value, ttl обязательны' });
    }
    if (!allowedDnsTypes.has(type)) {
      return res.status(400).json({ message: 'Недопустимый тип DNS-записи' });
    }

    const checksum = checksumRecord({ host, type, value, ttl, comment });

    const result = await runAsync(
      `INSERT INTO dns_records (host, type, value, ttl, comment, checksum, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [host, type, value, ttl, comment, checksum, req.user.id]
    );

    const row = await getAsync('SELECT * FROM dns_records WHERE id = ?', [result.lastID]);

    await notifyAdmins(
      `DNS: создана запись ${host}`,
      `Пользователь ${req.user.username} создал DNS-запись\nHost: ${host}\nType: ${type}\nValue: ${value}\nTTL: ${ttl}`
    ).catch(() => null);

    return res.status(201).json(mapRow(row));
  } catch (err) {
    if (String(err.message || '').includes('UNIQUE constraint failed: dns_records.host')) {
      return res.status(409).json({ message: 'DNS-запись с таким host уже существует' });
    }
    return next(err);
  }
});

router.put('/:id', authRequired, async (req, res, next) => {
  try {
    if (req.user.role === 'guest') {
      return res.status(403).json({ message: 'Гостевой пользователь не может изменять DNS-записи' });
    }

    const existing = await getAsync('SELECT * FROM dns_records WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: 'DNS-запись не найдена' });
    }

    await runAsync(
      `INSERT INTO dns_backups (dns_record_id, action, previous_snapshot, previous_checksum, changed_by)
       VALUES (?, 'update', ?, ?, ?)`,
      [existing.id, JSON.stringify(existing), existing.checksum, req.user.id]
    );

    const host = String(req.body.host || '').trim().toLowerCase();
    const type = String(req.body.type || '').trim().toUpperCase();
    const value = String(req.body.value || '').trim();
    const ttl = Number(req.body.ttl || 0);
    const comment = String(req.body.comment || '').trim();

    if (!host || !type || !value || !ttl) {
      return res.status(400).json({ message: 'host, type, value, ttl обязательны' });
    }
    if (!allowedDnsTypes.has(type)) {
      return res.status(400).json({ message: 'Недопустимый тип DNS-записи' });
    }

    const checksum = checksumRecord({ host, type, value, ttl, comment });

    await runAsync(
      `UPDATE dns_records SET host=?, type=?, value=?, ttl=?, comment=?, checksum=?, updated_by=?, updated_at=datetime('now')
       WHERE id=?`,
      [host, type, value, ttl, comment, checksum, req.user.id, req.params.id]
    );

    const updated = await getAsync('SELECT * FROM dns_records WHERE id = ?', [req.params.id]);

    await notifyAdmins(
      `DNS: изменена запись ${host}`,
      `Пользователь ${req.user.username} изменил DNS-запись\nID: ${updated.id}\nHost: ${host}\nType: ${type}\nValue: ${value}\nTTL: ${ttl}`
    ).catch(() => null);

    return res.status(200).json(mapRow(updated));
  } catch (err) {
    if (String(err.message || '').includes('UNIQUE constraint failed: dns_records.host')) {
      return res.status(409).json({ message: 'DNS-запись с таким host уже существует' });
    }
    return next(err);
  }
});

router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    if (req.user.role === 'guest') {
      return res.status(403).json({ message: 'Гостевой пользователь не может изменять DNS-записи' });
    }

    const existing = await getAsync('SELECT * FROM dns_records WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: 'DNS-запись не найдена' });
    }

    await runAsync(
      `INSERT INTO dns_backups (dns_record_id, action, previous_snapshot, previous_checksum, changed_by)
       VALUES (?, 'delete', ?, ?, ?)`,
      [existing.id, JSON.stringify(existing), existing.checksum, req.user.id]
    );

    await runAsync('DELETE FROM dns_records WHERE id = ?', [req.params.id]);

    await notifyAdmins(
      `DNS: удалена запись ${existing.host}`,
      `Пользователь ${req.user.username} удалил DNS-запись\nID: ${existing.id}\nHost: ${existing.host}\nType: ${existing.type}`
    ).catch(() => null);

    return res.status(200).json({ message: 'DNS-запись удалена' });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/integrity', authRequired, async (req, res, next) => {
  try {
    const row = await getAsync('SELECT * FROM dns_records WHERE id = ?', [req.params.id]);
    if (!row) {
      return res.status(404).json({ message: 'DNS-запись не найдена' });
    }

    const actual = checksumRecord(row);
    const valid = actual === row.checksum;

    return res.status(200).json({
      id: row.id,
      valid,
      storedChecksum: row.checksum,
      actualChecksum: actual
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/backups', authRequired, async (req, res, next) => {
  try {
    const rows = await allAsync(
      `SELECT b.id, b.dns_record_id, b.action, b.previous_checksum, b.changed_by, b.created_at, u.username AS changedByUsername
       FROM dns_backups b
       LEFT JOIN users u ON u.id = b.changed_by
       WHERE b.dns_record_id = ?
       ORDER BY b.id DESC`,
      [req.params.id]
    );

    return res.status(200).json({ data: rows });
  } catch (err) {
    return next(err);
  }
});

router.post('/deleted-recent/:backupId/restore', authRequired, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Восстанавливать удаленные записи может только администратор' });
    }

    const backup = await getAsync(
      `SELECT * FROM dns_backups WHERE id = ? AND action = 'delete'`,
      [req.params.backupId]
    );

    if (!backup) {
      return res.status(404).json({ message: 'Бэкап удаленной записи не найден' });
    }

    let snapshot;
    try {
      snapshot = JSON.parse(backup.previous_snapshot);
    } catch (err) {
      return res.status(400).json({ message: 'Снимок бэкапа поврежден' });
    }

    const checksum = checksumRecord(snapshot);

    const exists = await getAsync('SELECT id FROM dns_records WHERE host = ?', [snapshot.host]);
    if (exists) {
      return res.status(409).json({ message: 'Нельзя восстановить: запись с таким host уже существует' });
    }

    const result = await runAsync(
      `INSERT INTO dns_records (host, type, value, ttl, comment, checksum, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [snapshot.host, snapshot.type, snapshot.value, snapshot.ttl, snapshot.comment || '', checksum, req.user.id]
    );

    const restored = await getAsync('SELECT * FROM dns_records WHERE id = ?', [result.lastID]);

    await notifyAdmins(
      `DNS: восстановлена удаленная запись ${snapshot.host}`,
      `Пользователь ${req.user.username} восстановил удаленную DNS-запись из бэкапа #${backup.id}\nHost: ${snapshot.host}\nType: ${snapshot.type}\nValue: ${snapshot.value}\nTTL: ${snapshot.ttl}`
    ).catch(() => null);

    return res.status(200).json({ message: 'Удаленная запись восстановлена', record: mapRow(restored) });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/backups/:backupId/restore', authRequired, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Восстанавливать бэкапы может только администратор' });
    }

    const current = await getAsync('SELECT * FROM dns_records WHERE id = ?', [req.params.id]);
    if (!current) {
      return res.status(404).json({ message: 'Текущая DNS-запись не найдена' });
    }

    const backup = await getAsync(
      `SELECT * FROM dns_backups WHERE id = ? AND dns_record_id = ? AND action = 'update'`,
      [req.params.backupId, req.params.id]
    );

    if (!backup) {
      return res.status(404).json({ message: 'Бэкап редактирования не найден' });
    }

    let snapshot;
    try {
      snapshot = JSON.parse(backup.previous_snapshot);
    } catch (err) {
      return res.status(400).json({ message: 'Снимок бэкапа поврежден' });
    }

    const conflict = await getAsync(
      'SELECT id FROM dns_records WHERE host = ? AND id <> ?',
      [snapshot.host, req.params.id]
    );
    if (conflict) {
      return res.status(409).json({ message: 'Нельзя восстановить: host уже используется другой записью' });
    }

    const checksum = checksumRecord(snapshot);

    await runAsync(
      `UPDATE dns_records SET host=?, type=?, value=?, ttl=?, comment=?, checksum=?, updated_by=?, updated_at=datetime('now')
       WHERE id=?`,
      [snapshot.host, snapshot.type, snapshot.value, snapshot.ttl, snapshot.comment || '', checksum, req.user.id, req.params.id]
    );

    const restored = await getAsync('SELECT * FROM dns_records WHERE id = ?', [req.params.id]);

    await notifyAdmins(
      `DNS: восстановлен бэкап записи ${snapshot.host}`,
      `Пользователь ${req.user.username} восстановил DNS-запись #${req.params.id} из бэкапа #${backup.id}\nHost: ${snapshot.host}\nType: ${snapshot.type}\nValue: ${snapshot.value}\nTTL: ${snapshot.ttl}`
    ).catch(() => null);

    return res.status(200).json({ message: 'Бэкап успешно восстановлен', record: mapRow(restored) });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
