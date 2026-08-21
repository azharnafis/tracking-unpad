const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { testConnection } = require('./src/config/db');
const trackingRoutes = require('./src/routes/trackingRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const draftRoutes = require('./src/routes/draftRoutes');
const questionnaireRoutes = require('./src/routes/questionnaireRoutes');
const cron = require('node-cron');
const { runSync } = require('./src/services/cronSyncService');
const { generalLimiter, trackingLimiter } = require('./src/middleware/rateLimiter');

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGIN || '').split(',').map((o) => o.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

app.use(express.json());
app.use(generalLimiter);
app.use('/api/draft', draftRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend Lab Tracking jalan!' });
});

app.use('/api/tracking', trackingLimiter, trackingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/questionnaire', questionnaireRoutes);

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'Ukuran file melebihi batas maksimal 5MB.' });
  }
  return res.status(500).json({ message: 'Terjadi kesalahan server.' });
});

const PORT = process.env.PORT || 3000;

(async () => {
  await testConnection();
  cron.schedule('*/30 * * * * *', runSync);
  app.listen(PORT, () => {
    console.log(`Server jalan di http://localhost:${PORT}`);
  });
})();