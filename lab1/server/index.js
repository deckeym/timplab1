require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { initDatabase } = require('./db/db');
const authRoutes = require('./routes/auth');
const threatsRoutes = require('./routes/threats');
const usersRoutes = require('./routes/users');
const dnsRoutes = require('./routes/dns');
const errorHandler = require('./middleware/errorHandler');
const seedAll = require('./seed');
const { startReminderWorker } = require('./services/reminderService');

const app = express();
const API_PORT = process.env.API_PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const CLIENT_URL_ALT = process.env.CLIENT_URL_ALT || 'http://127.0.0.1:3000';

const allowedOrigins = [CLIENT_URL, CLIENT_URL_ALT];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/threats', threatsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dns-records', dnsRoutes);

app.use(errorHandler);

async function start() {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET и JWT_REFRESH_SECRET обязательны');
  }

  await initDatabase();
  await seedAll();
  startReminderWorker();

  app.listen(API_PORT, () => {
    console.log(`API запущен на http://localhost:${API_PORT}`);
  });
}

start().catch((err) => {
  console.error('Не удалось запустить сервер:', err);
  process.exit(1);
});
