const { pool } = require('../config/db');
const {
  SURVEY_QUESTIONS,
  SURVEY_TEXT_TO_SCORE,
  surveyScoreToText,
} = require('../constants');

async function findOrder(kodeTracking) {
  const [rows] = await pool.query(
    `SELECT o.order_id, o.kode_tracking, o.jenis_analisis_sampel, o.current_status,
            c.nama_perusahaan
     FROM orders o
     JOIN customers c ON c.customer_id = o.customer_id
     WHERE o.kode_tracking = ?`,
    [kodeTracking]
  );
  return rows[0] || null;
}

async function findSubmitted(orderId) {
  const [rows] = await pool.query(
    'SELECT questionnaire_id FROM questionnaires WHERE order_id = ?',
    [orderId]
  );
  return rows[0] || null;
}

function buildQuestionList() {
  return SURVEY_QUESTIONS.map((q) => ({
    key: q.key,
    bagian: q.bagian,
    opsi_skala: [5, 4, 3, 2, 1].map((score) => ({
      nilai: score,
      teks: q.skala[score],
    })),
  }));
}

// CUSTOMER: struktur pertanyaan + konteks read-only + flag sudah diisi.
async function getSurveyContext(req, res) {
  const { kode_tracking } = req.params;
  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    if (order.current_status !== 'DOWNLOAD_SERTIFIKAT') {
      return res.status(400).json({ message: 'Survei hanya tersedia setelah status Download Sertifikat.' });
    }

    const submitted = await findSubmitted(order.order_id);

    return res.json({
      konteks: {
        kode_tracking: order.kode_tracking,
        nama_perusahaan: order.nama_perusahaan,
        jenis_analisis_sampel: order.jenis_analisis_sampel,
      },
      pertanyaan: buildQuestionList(),
      sudah_diisi: Boolean(submitted),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// CUSTOMER: submit survey. Ditolak bila sudah pernah submit (anti pengisian ulang).
// Nilai diterima sebagai angka 1-5 atau teks resmi; tersimpan sebagai angka.
async function submitSurvey(req, res) {
  const { kode_tracking } = req.params;
  const body = req.body || {};

  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    if (order.current_status !== 'DOWNLOAD_SERTIFIKAT') {
      return res.status(400).json({ message: 'Survei hanya tersedia setelah status Download Sertifikat.' });
    }

    if (await findSubmitted(order.order_id)) {
      return res.status(409).json({ message: 'Survei untuk order ini sudah pernah dikirim.' });
    }

    const values = {};
    for (const q of SURVEY_QUESTIONS) {
      const raw = body[q.key];
      let score = null;

      if (typeof raw === 'number' && Number.isInteger(raw)) {
        score = raw;
      } else if (typeof raw === 'string' && SURVEY_TEXT_TO_SCORE[raw.trim()] !== undefined) {
        score = SURVEY_TEXT_TO_SCORE[raw.trim()];
      }

      if (score === null || score < 1 || score > 5) {
        return res.status(400).json({
          message: `Jawaban ${q.key} wajib diisi dengan nilai skala yang valid (1 hingga 5 atau teks resmi).`,
        });
      }
      values[q.key] = score;
    }

    const saran = typeof body.saran === 'string' && body.saran.trim() ? body.saran.trim() : null;

    await pool.query(
      `INSERT INTO questionnaires
         (order_id, q01, q02, q03, q04, q05, q06, q07, q08, q09, q10, q11, q12, q13, q14, saran, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        order.order_id,
        values.q01, values.q02, values.q03, values.q04,
        values.q05, values.q06, values.q07,
        values.q08, values.q09, values.q10, values.q11, values.q12, values.q13,
        values.q14,
        saran,
      ]
    );

    return res.status(201).json({
      message: 'Survei berhasil dikirim.',
      download_diizinkan: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// CUSTOMER: gate check untuk tombol download sertifikat.
async function getSurveyCompletion(req, res) {
  const { kode_tracking } = req.params;
  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const submitted = await findSubmitted(order.order_id);
    return res.json({ selesai: Boolean(submitted) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// ADMIN: hasil survey untuk pelaporan Lab — angka dipetakan balik ke teks resmi.
async function getSurveyResults(req, res) {
  const { kode_tracking } = req.params;
  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const [rows] = await pool.query(
      `SELECT q01, q02, q03, q04, q05, q06, q07, q08, q09, q10, q11, q12, q13, q14, saran, submitted_at
       FROM questionnaires WHERE order_id = ?`,
      [order.order_id]
    );

    if (rows.length === 0) {
      return res.json({ submitted: false, jawaban: null });
    }

    const row = rows[0];
    const jawaban = SURVEY_QUESTIONS.map((q) => ({
      key: q.key,
      bagian: q.bagian,
      nilai: row[q.key],
      teks: surveyScoreToText(q.key, row[q.key]),
    }));

    return res.json({
      submitted: true,
      konteks: {
        kode_tracking: order.kode_tracking,
        nama_perusahaan: order.nama_perusahaan,
        jenis_analisis_sampel: order.jenis_analisis_sampel,
      },
      jawaban,
      saran: row.saran,
      submitted_at: row.submitted_at,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

module.exports = {
  getSurveyContext,
  submitSurvey,
  getSurveyCompletion,
  getSurveyResults,
};
