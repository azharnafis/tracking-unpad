const { pool } = require('../config/db');
const { updateOrderStatus } = require('../services/statusService');
const { addBusinessDays, startOfDaySafe, toIsoDate } = require('../utils/businessDays');

async function findOrder(kodeTracking) {
  const [rows] = await pool.query(
    'SELECT order_id, current_status FROM orders WHERE kode_tracking = ?',
    [kodeTracking]
  );
  return rows[0] || null;
}

async function findCertificate(orderId) {
  const [rows] = await pool.query(
    'SELECT certificate_id, link_sertifikat, tanggal_terbit FROM certificates WHERE order_id = ?',
    [orderId]
  );
  return rows[0] || null;
}

// ADMIN: upload link sertifikat pertama kali (AR-010) atau overwrite hasil
// revisi tanpa syarat tambahan dan tanpa notifikasi baru (AR-014).
async function upsertCertificate(req, res) {
  const { kode_tracking } = req.params;
  const { link_sertifikat, tanggal_terbit } = req.body;

  if (!link_sertifikat) {
    return res.status(400).json({ message: 'link_sertifikat wajib diisi.' });
  }
  try {
    new URL(link_sertifikat);
  } catch {
    return res.status(400).json({ message: 'link_sertifikat harus berupa URL valid.' });
  }

  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const existing = await findCertificate(order.order_id);
    const tanggal = tanggal_terbit || toIsoDate(new Date());

    if (existing) {
      await pool.query(
        'UPDATE certificates SET link_sertifikat = ?, tanggal_terbit = ? WHERE certificate_id = ?',
        [link_sertifikat, tanggal, existing.certificate_id]
      );
      return res.json({
        message: 'Link sertifikat diperbarui (revisi).',
        tanggal_terbit: tanggal,
      });
    }

    await pool.query(
      'INSERT INTO certificates (order_id, link_sertifikat, tanggal_terbit) VALUES (?, ?, ?)',
      [order.order_id, link_sertifikat, tanggal]
    );

    await updateOrderStatus(
      order.order_id,
      'DOWNLOAD_SERTIFIKAT',
      'Sertifikat tersedia',
      'ADMIN_MANUAL'
    );

    return res.status(201).json({
      message: 'Sertifikat tersedia, order masuk tahap Download Sertifikat.',
      tanggal_terbit: tanggal,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// ADMIN: lihat sertifikat saat ini.
async function getCertificate(req, res) {
  const { kode_tracking } = req.params;
  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const cert = await findCertificate(order.order_id);
    return res.json({ certificate: cert || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// CUSTOMER: info sertifikat + gate survey. Link hanya dikirim bila survey
// selesai. Flag periode revisi murni informational, tidak memblokir apa pun.
async function getCustomerCertificate(req, res) {
  const { kode_tracking } = req.params;
  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const cert = await findCertificate(order.order_id);
    if (!cert) {
      return res.status(400).json({ message: 'Sertifikat belum tersedia.' });
    }

    const [surveyRows] = await pool.query(
      'SELECT questionnaire_id FROM questionnaires WHERE order_id = ?',
      [order.order_id]
    );
    const surveyCompleted = surveyRows.length > 0;

    const batas = addBusinessDays(cert.tanggal_terbit, 14);

    return res.json({
      link_sertifikat: surveyCompleted ? cert.link_sertifikat : null,
      tanggal_terbit: cert.tanggal_terbit,
      download_diizinkan: surveyCompleted,
      tanggal_batas_revisi: toIsoDate(batas),
      masih_dalam_periode_revisi: startOfDaySafe(new Date()) <= batas,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

module.exports = {
  upsertCertificate,
  getCertificate,
  getCustomerCertificate,
};
