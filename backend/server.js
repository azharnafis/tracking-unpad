const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { testConnection } = require('./src/config/db');
const trackingRoutes = require('./src/routes/trackingRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');  
const draftRoutes = require('./src/routes/draftRoutes');
const cron = require('node-cron');
const { runSync } = require('./src/services/cronSyncService');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/draft', draftRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend Lab Tracking jalan!' });
});

app.use('/api/tracking', trackingRoutes);
app.use('/api/payment', paymentRoutes);

const PORT = process.env.PORT || 3000;

(async () => {
  await testConnection();
  // Jalankan sinkronisasi tiap 2 menit
  cron.schedule('*/2 * * * *', runSync);
  app.listen(PORT, () => {
    console.log(`Server jalan di http://localhost:${PORT}`);
  });
})();