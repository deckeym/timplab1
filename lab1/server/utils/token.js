const jwt = require('jsonwebtoken');

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const signAccessToken = (user) => jwt.sign(
  { id: user.id, username: user.username, role: user.role, email: user.email },
  process.env.JWT_ACCESS_SECRET,
  { expiresIn: ACCESS_EXPIRES_IN }
);

const signRefreshToken = (user) => jwt.sign(
  { id: user.id },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: REFRESH_EXPIRES_IN }
);

module.exports = {
  signAccessToken,
  signRefreshToken
};
