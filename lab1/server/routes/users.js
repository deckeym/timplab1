const express = require('express');
const { allAsync, getAsync, runAsync } = require('../db/db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.use(authRequired, requireRole(['admin']));

router.get('/', async (req, res, next) => {
  try {
    const users = await allAsync(
      `SELECT u.id, u.username, u.email, u.role, u.created_at,
              (SELECT COUNT(*) FROM threats t WHERE t.owner_id = u.id) AS threatsCount
       FROM users u
       ORDER BY u.id ASC`
    );

    return res.status(200).json({ data: users });
  } catch (err) {
    return next(err);
  }
});

router.put('/:id/role', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const role = String(req.body.role || '').trim();
    const allowedRoles = ['admin', 'user', 'guest'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Недопустимая роль. Разрешено: admin, user, guest' });
    }

    if (userId === Number(req.user.id)) {
      return res.status(400).json({ message: 'Нельзя менять роль самому себе' });
    }

    const targetUser = await getAsync('SELECT id FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    await runAsync('UPDATE users SET role = ? WHERE id = ?', [role, userId]);

    const updated = await getAsync(
      `SELECT u.id, u.username, u.email, u.role, u.created_at,
              (SELECT COUNT(*) FROM threats t WHERE t.owner_id = u.id) AS threatsCount
       FROM users u
       WHERE u.id = ?`,
      [userId]
    );

    return res.status(200).json({ message: 'Роль обновлена', user: updated });
  } catch (err) {
    return next(err);
  }
});

router.put('/:id/email', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Некорректный email' });
    }

    const targetUser = await getAsync('SELECT id FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const conflict = await getAsync('SELECT id FROM users WHERE email = ? AND id <> ?', [email, userId]);
    if (conflict) {
      return res.status(409).json({ message: 'Этот email уже используется другим пользователем' });
    }

    await runAsync('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
    await runAsync('UPDATE threats SET notification_email = ? WHERE owner_id = ?', [email, userId]);

    const updated = await getAsync(
      `SELECT u.id, u.username, u.email, u.role, u.created_at,
              (SELECT COUNT(*) FROM threats t WHERE t.owner_id = u.id) AS threatsCount
       FROM users u
       WHERE u.id = ?`,
      [userId]
    );

    return res.status(200).json({ message: 'Email обновлен', user: updated });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (userId === Number(req.user.id)) {
      return res.status(400).json({ message: 'Нельзя удалить самого себя' });
    }

    const targetUser = await getAsync('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (targetUser.role === 'admin') {
      const adminsCount = await getAsync("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'");
      if (Number(adminsCount.count) <= 1) {
        return res.status(400).json({ message: 'Нельзя удалить последнего администратора' });
      }
    }

    await runAsync('DELETE FROM threats WHERE owner_id = ?', [userId]);
    await runAsync('DELETE FROM users WHERE id = ?', [userId]);

    return res.status(200).json({ message: 'Пользователь удален' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
