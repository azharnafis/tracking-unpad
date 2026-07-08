const { pool } = require('../config/db');

async function getTrackingStatus(req, res) {
  const { kode_tracking } = req.params;

  try {
    const [orders] = await pool.query(
      `SELECT o.order_id, o.kode_tracking, o.jenis_analisis_sampel, o.tanggal_masuk,
              o.estimasi_hari, o.harga_total, o.current_status,
              c.nama_perusahaan, c.no_hp, c.email
       FROM orders o
       JOIN customers c ON c.customer_id = o.customer_id
       WHERE o.kode_tracking = ?`,
      [kode_tracking]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });
    }

    const order = orders[0];

    const [history] = await pool.query(
      `SELECT status, keterangan_status, created_at
       FROM tracking_log WHERE order_id = ? ORDER BY created_at ASC`,
      [order.order_id]
    );

    return res.json({ order, history });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

module.exports = { getTrackingStatus };