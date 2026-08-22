const { pool } = require('../config/db');
const { sendStatusNotification } = require('./notificationService');
const { VALID_STATUSES } = require('../constants');

// Satu-satunya jalur perubahan status. Tidak boleh dipanggil dengan nilai
// dari input bebas manapun — hanya sebagai efek business event tervalidasi
// (validasi pembayaran, draft v1, proceed-to-pengesahan, sertifikat tersedia).
async function updateOrderStatus(orderId, newStatus, keterangan, source = 'AUTO_SCRIPT') {
  if (!VALID_STATUSES.includes(newStatus)) {
    throw new Error(`Nilai status tidak valid: ${newStatus}`);
  }

  await pool.query(
    'UPDATE orders SET current_status = ? WHERE order_id = ?',
    [newStatus, orderId]
  );

  await pool.query(
    `INSERT INTO tracking_log (order_id, status, keterangan_status, source)
     VALUES (?, ?, ?, ?)`,
    [orderId, newStatus, keterangan, source]
  );

  await sendStatusNotification(orderId, newStatus);
}

module.exports = { updateOrderStatus };
