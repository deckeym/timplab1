const jwt = require('jsonwebtoken');

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Требуется Bearer токен' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Неверный или просроченный токен' });
  }
}

function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }

    return next();
  };
}

module.exports = {
  authRequired,
  requireRole
};
