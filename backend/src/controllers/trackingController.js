const { pool } = require('../config/db');
const { hitungEstimasi, addBusinessDays, toIsoDate, startOfDaySafe } = require('../utils/businessDays');
const { REKENING_MAP } = require('../constants');

async function findOrderByKode(kodeTracking) {
  const [rows] = await pool.query(
    `SELECT o.order_id, o.kode_tracking, o.jenis_analisis_sampel, o.tanggal_masuk,
            o.estimasi_hari, o.harga_total, o.current_status,
            o.kode_invoice, o.invoice_file_url,
            c.nama_perusahaan, c.no_hp, c.email
     FROM orders o
     JOIN customers c ON c.customer_id = o.customer_id
     WHERE o.kode_tracking = ?`,
    [kodeTracking]
  );
  return rows[0] || null;
}

async function getHistory(orderId) {
  const [rows] = await pool.query(
    `SELECT status, keterangan_status, source, created_at
     FROM tracking_log WHERE order_id = ? ORDER BY created_at ASC`,
    [orderId]
  );
  return rows;
}

async function getLatestDraftRow(orderId) {
  const [rows] = await pool.query(
    `SELECT versi_draft, link_draft, tanggal_upload,
            keputusan_customer, tanggal_keputusan,
            tindak_lanjut_admin, tanggal_tindak_lanjut
     FROM drafts WHERE order_id = ?
     ORDER BY versi_draft DESC LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
}

async function getCertificateRow(orderId) {
  const [rows] = await pool.query(
    'SELECT link_sertifikat, tanggal_terbit FROM certificates WHERE order_id = ?',
    [orderId]
  );
  return rows[0] || null;
}

async function getSurveyCompleted(orderId) {
  const [rows] = await pool.query(
    'SELECT questionnaire_id FROM questionnaires WHERE order_id = ?',
    [orderId]
  );
  return rows.length > 0;
}

async function getLatestPaymentRow(orderId) {
  const [rows] = await pool.query(
    `SELECT bukti_pembayaran_url, status_validasi, tanggal_validasi,
            link_invoice, no_invoice, tanggal_invoice,
            jenis_faktur, npwp, link_kwitansi, keterangan, rekening_pembayaran,
            tanggal_upload_bukti
     FROM payments WHERE order_id = ?
     ORDER BY payment_id DESC LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
}

function buildEstimasi(order, cert = null) {
  return hitungEstimasi(order.tanggal_masuk, order.estimasi_hari, order.current_status, cert);
}

// Periode revisi sertifikat: tanggal terbit + 14 hari kerja (informational saja).
function buildRevisionWindow(tanggalTerbit) {
  const batas = addBusinessDays(tanggalTerbit, 14);
  const hariIni = startOfDaySafe(new Date());
  return {
    tanggal_batas_revisi: toIsoDate(batas),
    masih_dalam_periode_revisi: hariIni <= batas,
  };
}

// CUSTOMER: satu panggilan gabungan untuk seluruh data tracking.
async function getTrackingStatus(req, res) {
  const { kode_tracking } = req.params;

  try {
    const order = await findOrderByKode(kode_tracking);
    if (!order) {
      return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });
    }

    const history = await getHistory(order.order_id);
    const latestDraft = await getLatestDraftRow(order.order_id);
    const cert = await getCertificateRow(order.order_id);
    const surveyCompleted = await getSurveyCompleted(order.order_id);
    const payment = await getLatestPaymentRow(order.order_id);

    let certificate = null;
    if (cert) {
      const revision = buildRevisionWindow(cert.tanggal_terbit);
      certificate = {
        link_sertifikat: surveyCompleted ? cert.link_sertifikat : null,
        tanggal_terbit: cert.tanggal_terbit,
        download_diizinkan: surveyCompleted,
        ...revision,
      };
    }

    const paymentSummary = payment
      ? {
          invoice: payment.link_invoice
            ? {
                link_invoice: payment.link_invoice,
                no_invoice: payment.no_invoice,
                tanggal_invoice: payment.tanggal_invoice
                  ? toIsoDate(new Date(payment.tanggal_invoice))
                  : null,
              }
            : null,
          rekening: payment.rekening_pembayaran ? REKENING_MAP[payment.rekening_pembayaran] : null,
          jenis_faktur: payment.jenis_faktur,
          npwp: payment.npwp,
          link_kwitansi: payment.link_kwitansi || null,
          keterangan: payment.keterangan || null,
          status_validasi: payment.status_validasi,
        }
      : null;

    // Fallback invoice legacy dari orders bila payments belum punya data.
    if (paymentSummary && !paymentSummary.invoice && order.invoice_file_url) {
      paymentSummary.invoice = {
        link_invoice: order.invoice_file_url,
        no_invoice: order.kode_invoice,
        tanggal_invoice: null,
      };
    }

    const { kode_invoice, invoice_file_url, ...orderClean } = order;

    return res.json({
      order: { ...orderClean, estimasi: buildEstimasi(order, cert) },
      history,
      payment: paymentSummary,
      latest_draft: latestDraft,
      certificate,
      survey_completed: surveyCompleted,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// CUSTOMER: status aktif + riwayat saja (versi ringan).
async function getStatus(req, res) {
  const { kode_tracking } = req.params;
  try {
    const order = await findOrderByKode(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const history = await getHistory(order.order_id);
    return res.json({ current_status: order.current_status, history });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// CUSTOMER: timeline — sama dengan history status.
async function getTimeline(req, res) {
  const { kode_tracking } = req.params;
  try {
    const order = await findOrderByKode(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const history = await getHistory(order.order_id);
    return res.json({ timeline: history });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// CUSTOMER: estimasi hari kerja, tanggal selesai, flag warning.
async function getEstimation(req, res) {
  const { kode_tracking } = req.params;
  try {
    const order = await findOrderByKode(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const cert = await getCertificateRow(order.order_id);
    return res.json(buildEstimasi(order, cert));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// ADMIN: detail order mentah.
async function getOrderDetail(req, res) {
  const { kode_tracking } = req.params;
  try {
    const order = await findOrderByKode(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const cert = await getCertificateRow(order.order_id);
    return res.json({
      order,
      estimasi: buildEstimasi(order, cert),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

module.exports = {
  getTrackingStatus,
  getStatus,
  getTimeline,
  getEstimation,
  getOrderDetail,
};
