const { pool } = require('../config/db');
const { findRowByKodeTracking, updateCell } = require('../services/sheetsSyncService');

async function uploadPaymentProof(req, res) {
  const { kode_tracking } = req.params;
  const { bukti_pembayaran_url } = req.body;

  if (!bukti_pembayaran_url) {
    return res.status(400).json({ message: 'bukti_pembayaran_url wajib diisi.' });
  }

  try {
    const [orders] = await pool.query(
      'SELECT order_id FROM orders WHERE kode_tracking = ?',
      [kode_tracking]
    );
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });
    }
    const orderId = orders[0].order_id;

    await pool.query(
      `INSERT INTO payments (order_id, bukti_pembayaran_url, tanggal_upload_bukti, status_validasi)
       VALUES (?, ?, NOW(), 'PENDING')`,
      [orderId, bukti_pembayaran_url]
    );

    // Tulis balik tanggal & link bukti pembayaran ke sheet Pembayaran
    const found = await findRowByKodeTracking('Pembayaran', kode_tracking);
    if (found) {
      const tanggalSekarang = new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      await updateCell('Pembayaran', found.rowNumber, 'B', tanggalSekarang);
      await updateCell('Pembayaran', found.rowNumber, 'C', bukti_pembayaran_url);
    }

    return res.status(201).json({ message: 'Bukti pembayaran berhasil diupload, menunggu validasi admin.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

const { updateOrderStatus } = require('../services/statusService');

async function validatePayment(req, res) {
  const { kode_tracking } = req.params;
  const { status_validasi } = req.body; // 'VALID' atau 'INVALID'

  if (!['VALID', 'INVALID'].includes(status_validasi)) {
    return res.status(400).json({ message: 'status_validasi harus VALID atau INVALID.' });
  }

  try {
    const [orders] = await pool.query('SELECT order_id FROM orders WHERE kode_tracking = ?', [kode_tracking]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });
    }
    const orderId = orders[0].order_id;

    await pool.query(
      `UPDATE payments SET status_validasi = ?, tanggal_validasi = NOW()
       WHERE order_id = ? ORDER BY payment_id DESC LIMIT 1`,
      [status_validasi, orderId]
    );

    if (status_validasi === 'VALID') {
      await updateOrderStatus(orderId, 'PROSES_ANALISIS', 'Pembayaran divalidasi admin', 'ADMIN_MANUAL');
    }

    return res.json({ message: `Pembayaran ditandai ${status_validasi}.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

module.exports = { uploadPaymentProof, validatePayment };