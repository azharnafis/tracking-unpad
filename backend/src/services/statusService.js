const { pool } = require('../config/db');
const { sendStatusNotification } = require('./notificationService');

async function updateOrderStatus(orderId, newStatus, keterangan, source = 'ADMIN_MANUAL') {
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