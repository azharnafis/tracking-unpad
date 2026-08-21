const { pool } = require('../config/db');

// Hitung SLA & estimasi waktu berdasarkan tanggal_masuk + estimasi_hari
function hitungEstimasi(tanggalMasuk, estimasiHari) {
  const mulai = new Date(tanggalMasuk);
  const targetSelesai = new Date(mulai);
  targetSelesai.setDate(targetSelesai.getDate() + estimasiHari);

  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);
  targetSelesai.setHours(0, 0, 0, 0);

  const selisihMs = targetSelesai.getTime() - hariIni.getTime();
  const sisaHari = Math.ceil(selisihMs / (1000 * 60 * 60 * 24));

  let label;
  if (sisaHari > 0) {
    label = `${sisaHari} Hari Lagi`;
  } else if (sisaHari === 0) {
    label = 'Estimasi Selesai Hari Ini';
  } else {
    label = `Terlambat ${Math.abs(sisaHari)} Hari`;
  }

  return {
    tanggal_estimasi_selesai: targetSelesai.toISOString().split('T')[0],
    sisa_hari: sisaHari,
    label,
  };
}

async function getTrackingStatus(req, res) {
  const { kode_tracking } = req.params;

  try {
    const [orders] = await pool.query(
      `SELECT o.order_id, o.kode_tracking, o.jenis_analisis_sampel, o.tanggal_masuk,
              o.estimasi_hari, o.harga_total, o.current_status,
              o.kode_invoice, o.invoice_file_url,
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
    const estimasi = hitungEstimasi(order.tanggal_masuk, order.estimasi_hari);

    const [history] = await pool.query(
      `SELECT status, keterangan_status, source, created_at
       FROM tracking_log WHERE order_id = ? ORDER BY created_at ASC`,
      [order.order_id]
    );

    const [certRows] = await pool.query(
      `SELECT link_sertifikat, tanggal_terbit FROM certificates WHERE order_id = ?`,
      [order.order_id]
    );

    const [surveyRows] = await pool.query(
      `SELECT submitted_at FROM questionnaires WHERE order_id = ?`,
      [order.order_id]
    );

    const [draftRows] = await pool.query(
      `SELECT versi_draft, link_draft, status_draft, tanggal_upload FROM drafts WHERE order_id = ? ORDER BY versi_draft DESC LIMIT 1`,
      [order.order_id]
    );

    return res.json({
      order: { ...order, estimasi },
      history,
      certificate: certRows[0] || null,
      latest_draft: draftRows[0] || null,
      survey_completed: surveyRows.length > 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

module.exports = { getTrackingStatus };