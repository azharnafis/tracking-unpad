const { pool } = require('../config/db');

// Fungsi ini melakukan 2 hal SEKALIGUS setiap status order berubah:
// 1. Update kolom current_status di tabel orders
// 2. Insert baris baru ke tracking_log (supaya ada jejak riwayatnya)
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
}

module.exports = { updateOrderStatus };