const express = require('express');
const { allAsync, getAsync, runAsync } = require('../db/db');
const { authRequired, requireRole } = require('../middleware/auth');
const { sendThreatEmail } = require('../services/mailer');

const router = express.Router();

const isAdminOrGuest = (user) => user.role === 'admin' || user.role === 'guest';

const mapThreatOut = (row) => ({
  id: row.id,
  title: row.title,
  status: row.status,
  category: row.category,
  severity: row.severity,
  source: row.source,
  detectedBy: row.detected_by,
  affectedAsset: row.affected_asset,
  responsible: row.responsible,
  description: row.description,
  impact: row.impact,
  response: row.response,
  detectedAt: row.detected_at,
  resolvedAt: row.resolved_at,
  reporter: row.reporter,
  comment: row.comment,
  ownerId: row.owner_id,
  ownerUsername: row.owner_username,
  notificationEmail: row.notification_email,
  statusReminderSent: Boolean(row.status_reminder_sent)
});

const validateThreatPayload = (body) => {
  const required = [
    'title', 'status', 'category', 'severity', 'source', 'detectedBy',
    'affectedAsset', 'responsible', 'description', 'impact', 'response', 'detectedAt', 'reporter'
  ];

  for (const key of required) {
    if (!String(body[key] || '').trim()) {
      return `Поле ${key} обязательно`;
    }
  }

  return null;
};

router.get('/', authRequired, async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
    const offset = (page - 1) * limit;

    const filters = [];
    const params = [];

    if (!isAdminOrGuest(req.user)) {
      filters.push('owner_id = ?');
      params.push(req.user.id);
    }

    if (req.query.status) {
      filters.push('LOWER(status) LIKE LOWER(?)');
      params.push(`%${String(req.query.status).trim()}%`);
    }

    if (req.query.category) {
      filters.push('LOWER(category) LIKE LOWER(?)');
      params.push(`%${String(req.query.category).trim()}%`);
    }

    if (req.query.search) {
      filters.push(`(
        LOWER(title) LIKE LOWER(?)
        OR LOWER(description) LIKE LOWER(?)
        OR LOWER(category) LIKE LOWER(?)
        OR LOWER(status) LIKE LOWER(?)
        OR LOWER(severity) LIKE LOWER(?)
        OR LOWER(source) LIKE LOWER(?)
        OR LOWER(owner_username) LIKE LOWER(?)
        OR LOWER(affected_asset) LIKE LOWER(?)
        OR LOWER(responsible) LIKE LOWER(?)
      )`);
      const pattern = `%${String(req.query.search).trim()}%`;
      params.push(
        pattern,
        pattern,
        pattern,
        pattern,
        pattern,
        pattern,
        pattern,
        pattern,
        pattern
      );
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const totalRow = await getAsync(`SELECT COUNT(*) as total FROM threats ${where}`, params);
    const rows = await allAsync(
      `SELECT * FROM threats ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      data: rows.map(mapThreatOut),
      pagination: {
        page,
        limit,
        total: totalRow.total,
        totalPages: Math.ceil(totalRow.total / limit) || 1
      }
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', authRequired, async (req, res, next) => {
  try {
    const row = await getAsync('SELECT * FROM threats WHERE id = ?', [req.params.id]);
    if (!row) {
      return res.status(404).json({ message: 'Инцидент не найден' });
    }

    if (!isAdminOrGuest(req.user) && Number(row.owner_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Недостаточно прав для просмотра' });
    }

    return res.status(200).json(mapThreatOut(row));
  } catch (err) {
    return next(err);
  }
});

router.post('/', authRequired, async (req, res, next) => {
  try {
    if (req.user.role === 'guest') {
      return res.status(403).json({ message: 'Гость не может создавать инциденты' });
    }

    const validationError = validateThreatPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const payload = req.body;

    const result = await runAsync(
      `INSERT INTO threats (
        title, status, category, severity, source, detected_by, affected_asset, responsible,
        description, impact, response, detected_at, resolved_at, reporter, comment,
        owner_id, owner_username, notification_email, status_reminder_sent, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        payload.title, payload.status, payload.category, payload.severity, payload.source,
        payload.detectedBy, payload.affectedAsset, payload.responsible, payload.description,
        payload.impact, payload.response, payload.detectedAt, payload.resolvedAt || null,
        payload.reporter, payload.comment || '', req.user.id, req.user.username,
        req.user.email || null, 0
      ]
    );

    const row = await getAsync('SELECT * FROM threats WHERE id = ?', [result.lastID]);
    return res.status(201).json(mapThreatOut(row));
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', authRequired, async (req, res, next) => {
  try {
    const row = await getAsync('SELECT * FROM threats WHERE id = ?', [req.params.id]);
    if (!row) {
      return res.status(404).json({ message: 'Инцидент не найден' });
    }

    const isOwner = Number(row.owner_id) === Number(req.user.id);
    if (!(req.user.role === 'admin' || isOwner)) {
      return res.status(403).json({ message: 'Недостаточно прав для редактирования' });
    }

    const validationError = validateThreatPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const payload = req.body;
    const statusChanged = String(row.status) !== String(payload.status);

    await runAsync(
      `UPDATE threats SET
        title=?, status=?, category=?, severity=?, source=?, detected_by=?, affected_asset=?, responsible=?,
        description=?, impact=?, response=?, detected_at=?, resolved_at=?, reporter=?, comment=?,
        status_reminder_sent=?, updated_at=datetime('now')
      WHERE id=?`,
      [
        payload.title, payload.status, payload.category, payload.severity, payload.source,
        payload.detectedBy, payload.affectedAsset, payload.responsible, payload.description,
        payload.impact, payload.response, payload.detectedAt, payload.resolvedAt || null,
        payload.reporter, payload.comment || '', statusChanged ? 1 : row.status_reminder_sent, req.params.id
      ]
    );

    const updated = await getAsync('SELECT * FROM threats WHERE id = ?', [req.params.id]);
    return res.status(200).json(mapThreatOut(updated));
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/notify', authRequired, async (req, res, next) => {
  try {
    const row = await getAsync('SELECT * FROM threats WHERE id = ?', [req.params.id]);
    if (!row) {
      return res.status(404).json({ message: 'Инцидент не найден' });
    }

    const isOwner = Number(row.owner_id) === Number(req.user.id);
    if (!(req.user.role === 'admin' || isOwner)) {
      return res.status(403).json({ message: 'Недостаточно прав для отправки уведомления' });
    }

    const mailInfo = await sendThreatEmail(row, 'manual');
    await runAsync(
      'UPDATE threats SET status_reminder_sent = 1, updated_at = datetime(\'now\') WHERE id = ?',
      [req.params.id]
    );

    return res.status(200).json({ message: 'Письмо отправлено', delivery: mailInfo });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', authRequired, requireRole(['admin']), async (req, res, next) => {
  try {
    const row = await getAsync('SELECT id FROM threats WHERE id = ?', [req.params.id]);
    if (!row) {
      return res.status(404).json({ message: 'Инцидент не найден' });
    }

    await runAsync('DELETE FROM threats WHERE id = ?', [req.params.id]);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
