const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getAsync, runAsync } = require('../db/db');
const { signAccessToken, signRefreshToken } = require('../utils/token');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email и password обязательны' });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    if (!USERNAME_RE.test(cleanUsername)) {
      return res.status(400).json({
        message: 'Логин: 3-30 символов, только буквы, цифры, _, -, .'
      });
    }

    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ message: 'Некорректный email' });
    }

    if (cleanPassword.trim().length < 6) {
      return res.status(400).json({ message: 'Пароль должен быть не короче 6 символов' });
    }

    if (/\s/.test(cleanPassword)) {
      return res.status(400).json({ message: 'Пароль не должен содержать пробелы' });
    }

    const userExists = await getAsync(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [cleanUsername, cleanEmail]
    );

    if (userExists) {
      return res.status(409).json({ message: 'Пользователь с таким логином или email уже существует' });
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 12);

    const result = await runAsync(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [cleanUsername, cleanEmail, passwordHash, 'user']
    );

    const user = await getAsync('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [result.lastID]);

    return res.status(201).json(user);
  } catch (err) {
    return next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'username и password обязательны' });
    }

    const cleanUsername = String(username).trim();
    const cleanPassword = String(password);

    if (!cleanUsername || !cleanPassword.trim()) {
      return res.status(400).json({ message: 'Логин и пароль не должны быть пустыми' });
    }

    const user = await getAsync(
      'SELECT id, username, email, role, password_hash FROM users WHERE username = ?',
      [cleanUsername]
    );

    if (!user) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    const passwordOk = await bcrypt.compare(cleanPassword, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'Refresh token отсутствует' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Недействительный refresh token' });
    }

    const user = await getAsync('SELECT id, username, email, role FROM users WHERE id = ?', [payload.id]);
    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    const accessToken = signAccessToken(user);
    const nextRefreshToken = signRefreshToken(user);

    res.cookie('refreshToken', nextRefreshToken, cookieOptions);

    return res.status(200).json({ accessToken });
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', cookieOptions);
  return res.status(200).json({ message: 'Выход выполнен' });
});

router.get('/validate', authRequired, (req, res) => {
  getAsync(
    'SELECT id, username, email, role FROM users WHERE id = ?',
    [req.user.id]
  )
    .then((freshUser) => {
      if (!freshUser) {
        return res.status(401).json({ message: 'Пользователь не найден' });
      }

      return res.status(200).json({
        valid: true,
        user: freshUser
      });
    })
    .catch((err) => {
      console.error('[AUTH_VALIDATE_ERROR]', err);
      return res.status(500).json({ message: 'Не удалось проверить токен' });
    });
});

module.exports = router;
