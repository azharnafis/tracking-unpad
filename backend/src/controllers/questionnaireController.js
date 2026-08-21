const { pool } = require('../config/db');

async function submitQuestionnaire(req, res) {
  const { kode_tracking } = req.params;
  const { q1, q2, q3, q4, q5, q6, saran } = req.body;

  if (q1 == null || q2 == null || q3 == null || q4 == null || q5 == null || q6 == null) {
    return res.status(400).json({ message: 'Field q1 sampai q6 wajib diisi.' });
  }

  const ratings = [q1, q2, q3, q4, q5, q6];
  for (const r of ratings) {
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ message: 'Rating harus bernilai antara 1 hingga 5.' });
    }
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
      `INSERT INTO questionnaires
         (order_id, q1_kecepatan_proses, q2_keramahan_admin,
          q3_kejelasan_informasi, q4_kemudahan_website,
          q5_kualitas_laporan, q6_kepuasan_keseluruhan,
          saran, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [orderId, q1, q2, q3, q4, q5, q6, saran || null]
    );

    return res.status(201).json({ message: 'Survei berhasil dikirim.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

module.exports = { submitQuestionnaire };
