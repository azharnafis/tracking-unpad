const { pool } = require('../config/db');
const { uploadToDrive } = require('../services/driveService');
const { updateOrderStatus } = require('../services/statusService');
const { writeBackByKodeTracking } = require('../services/sheetsSyncService');
const { toIsoDate } = require('../utils/businessDays');
const {
  STATUS_ORDER,
  JENIS_FAKTUR,
  STATUS_VALIDASI,
  REKENING_PEMBAYARAN,
  REKENING_MAP,
} = require('../constants');

async function findOrder(kodeTracking) {
  const [rows] = await pool.query(
    'SELECT order_id, current_status FROM orders WHERE kode_tracking = ?',
    [kodeTracking]
  );
  return rows[0] || null;
}

async function findLatestPayment(orderId) {
  const [rows] = await pool.query(
    `SELECT payment_id, bukti_pembayaran_url, tanggal_upload_bukti, status_validasi,
            tanggal_validasi, keterangan, validated_by,
            link_invoice, no_invoice, tanggal_invoice,
            jenis_faktur, npwp, link_kwitansi, rekening_pembayaran
     FROM payments WHERE order_id = ?
     ORDER BY payment_id DESC LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
}

function statusRank(status) {
  return STATUS_ORDER.indexOf(status);
}

// CUSTOMER: detail pembayaran — invoice, rekening pilihan Admin, status validasi.
async function getPaymentDetail(req, res) {
  const { kode_tracking } = req.params;
  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    if (statusRank(order.current_status) < statusRank('PEMBAYARAN')) {
      return res.status(400).json({ message: 'Payment belum tersedia untuk order ini.' });
    }

    const payment = await findLatestPayment(order.order_id);

    return res.json({
      invoice: payment && payment.link_invoice
        ? {
            link_invoice: payment.link_invoice,
            no_invoice: payment.no_invoice,
            tanggal_invoice: payment.tanggal_invoice
              ? toIsoDate(new Date(payment.tanggal_invoice))
              : null,
          }
        : null,
      rekening: payment && payment.rekening_pembayaran ? REKENING_MAP[payment.rekening_pembayaran] : null,
      jenis_faktur: payment ? payment.jenis_faktur : null,
      npwp: payment ? payment.npwp : null,
      link_kwitansi: payment ? (payment.link_kwitansi || null) : null,
      keterangan: payment ? (payment.keterangan || null) : null,
      status_validasi: payment ? payment.status_validasi : null,
      tanggal_upload_bukti: payment ? payment.tanggal_upload_bukti : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// CUSTOMER: simpan pilihan Faktur Pajak/Non Faktur + NPWP kondisional.
async function submitFaktur(req, res) {
  const { kode_tracking } = req.params;
  const { jenis_faktur, npwp } = req.body;

  if (!JENIS_FAKTUR.includes(jenis_faktur)) {
    return res.status(400).json({ message: 'jenis_faktur harus FAKTUR_PAJAK atau NON_FAKTUR.' });
  }

  let npwpValue = null;
  if (jenis_faktur === 'FAKTUR_PAJAK') {
    if (!npwp || !String(npwp).trim()) {
      return res.status(400).json({ message: 'NPWP wajib diisi bila jenis faktur FAKTUR_PAJAK.' });
    }
    npwpValue = String(npwp).trim();
  }

  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const payment = await findLatestPayment(order.order_id);
    if (payment) {
      await pool.query(
        'UPDATE payments SET jenis_faktur = ?, npwp = ? WHERE payment_id = ?',
        [jenis_faktur, npwpValue, payment.payment_id]
      );
    } else {
      await pool.query(
        `INSERT INTO payments (order_id, jenis_faktur, npwp, status_validasi)
         VALUES (?, ?, ?, 'PENDING')`,
        [order.order_id, jenis_faktur, npwpValue]
      );
    }

    // Tulis-balik ke Google Sheets (non-blocking, tidak menggagalkan response API bila sheets gagal)
    try {
      await writeBackByKodeTracking('PAYMENT', kode_tracking, {
        jenisFaktur: jenis_faktur,
        npwp: npwpValue || '',
      });
    } catch (sheetErr) {
      console.error(`[WRITE_BACK] submitFaktur gagal sync Sheets (${kode_tracking}):`, sheetErr.message);
    }

    return res.json({
      message: 'Data faktur berhasil disimpan.',
      jenis_faktur,
      npwp: npwpValue,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// CUSTOMER: upload bukti pembayaran. Syarat: invoice sudah tersedia.
// Upload ulang setelah INVALID diperbolehkan — status kembali PENDING.
async function uploadPaymentProof(req, res) {
  const { kode_tracking } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'File bukti pembayaran wajib diupload.' });
  }

  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const payment = await findLatestPayment(order.order_id);
    if (!payment || !payment.link_invoice) {
      return res.status(400).json({
        message: 'Invoice belum tersedia. Bukti pembayaran dapat diupload setelah invoice diterbitkan admin.',
      });
    }

    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
    const fileName = `${kode_tracking}_${Date.now()}_${safeName}`;
    const buktiUrl = await uploadToDrive(
      req.file.buffer,
      fileName,
      req.file.mimetype,
      process.env.GOOGLE_DRIVE_FOLDER_BUKTI_PEMBAYARAN
    );

    await pool.query(
      `UPDATE payments SET bukti_pembayaran_url = ?, tanggal_upload_bukti = NOW(), status_validasi = 'PENDING'
       WHERE payment_id = ?`,
      [buktiUrl, payment.payment_id]
    );

    // Tulis-balik link bukti bayar ke sheet PAYMENT (non-blocking)
    try {
      await writeBackByKodeTracking('PAYMENT', kode_tracking, {
        linkBuktiBayar: buktiUrl,
      });
    } catch (sheetErr) {
      console.error(`[WRITE_BACK] uploadPaymentProof gagal sync Sheets (${kode_tracking}):`, sheetErr.message);
    }

    return res.status(201).json({
      message: 'Bukti pembayaran berhasil diupload, menunggu validasi admin.',
      link: buktiUrl,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// ADMIN: isi/update data invoice (+kwitansi/rekening opsional).
// AR-002: invoice pertama tersedia memicu SAMPEL_DITERIMA -> PEMBAYARAN.
async function setInvoiceDetails(req, res) {
  const { kode_tracking } = req.params;
  const { link_invoice, no_invoice, tanggal_invoice, link_kwitansi, rekening_pembayaran } = req.body;

  if (!link_invoice) {
    return res.status(400).json({ message: 'link_invoice wajib diisi.' });
  }
  try {
    new URL(link_invoice);
  } catch {
    return res.status(400).json({ message: 'link_invoice harus berupa URL valid.' });
  }
  if (link_kwitansi) {
    try {
      new URL(link_kwitansi);
    } catch {
      return res.status(400).json({ message: 'link_kwitansi harus berupa URL valid.' });
    }
  }
  if (rekening_pembayaran && !REKENING_PEMBAYARAN.includes(rekening_pembayaran)) {
    return res.status(400).json({ message: 'rekening_pembayaran harus BNI atau MANDIRI.' });
  }

  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const payment = await findLatestPayment(order.order_id);
    if (payment) {
      await pool.query(
        `UPDATE payments
         SET link_invoice = ?, no_invoice = ?, tanggal_invoice = ?,
             link_kwitansi = COALESCE(?, link_kwitansi),
             rekening_pembayaran = COALESCE(?, rekening_pembayaran)
         WHERE payment_id = ?`,
        [link_invoice, no_invoice || null, tanggal_invoice || null, link_kwitansi || null, rekening_pembayaran || null, payment.payment_id]
      );
    } else {
      await pool.query(
        `INSERT INTO payments (order_id, link_invoice, no_invoice, tanggal_invoice, link_kwitansi, rekening_pembayaran, status_validasi)
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
        [order.order_id, link_invoice, no_invoice || null, tanggal_invoice || null, link_kwitansi || null, rekening_pembayaran || null]
      );
    }

    if (order.current_status === 'SAMPEL_DITERIMA') {
      await updateOrderStatus(order.order_id, 'PEMBAYARAN', 'Invoice tersedia', 'ADMIN_MANUAL');
    }

    return res.json({ message: 'Data invoice berhasil disimpan.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// ADMIN: validasi pembayaran dengan 3 syarat:
// 1) bukti pembayaran harus sudah ada, 2) belum pernah VALID (anti duplikat),
// 3) hanya nilai VALID yang memicu ANALISIS + notifikasi.
async function validatePayment(req, res) {
  const { kode_tracking } = req.params;
  const { status_validasi, keterangan } = req.body;

  if (!STATUS_VALIDASI.slice(1).includes(status_validasi)) {
    return res.status(400).json({ message: 'status_validasi harus VALID atau INVALID.' });
  }

  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const payment = await findLatestPayment(order.order_id);
    if (!payment) {
      return res.status(400).json({ message: 'Belum ada data pembayaran untuk order ini.' });
    }
    if (!payment.bukti_pembayaran_url) {
      return res.status(400).json({ message: 'Validasi ditolak: bukti pembayaran belum ada.' });
    }
    if (payment.status_validasi === 'VALID') {
      return res.status(409).json({ message: 'Pembayaran untuk order ini sudah divalidasi sebelumnya.' });
    }

    await pool.query(
      `UPDATE payments SET status_validasi = ?, tanggal_validasi = NOW(), validated_by = ?, keterangan = ?
       WHERE payment_id = ?`,
      [status_validasi, 'ADMIN', keterangan || null, payment.payment_id]
    );

    if (status_validasi === 'VALID') {
      await updateOrderStatus(order.order_id, 'ANALISIS', 'Pembayaran divalidasi admin', 'ADMIN_MANUAL');
    }

    return res.json({ message: `Pembayaran ditandai ${status_validasi}.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// ADMIN: lihat data pembayaran lengkap termasuk link bukti bayar.
async function getAdminPaymentDetail(req, res) {
  const { kode_tracking } = req.params;
  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const payment = await findLatestPayment(order.order_id);
    return res.json({ payment: payment || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

module.exports = {
  getPaymentDetail,
  submitFaktur,
  uploadPaymentProof,
  setInvoiceDetails,
  validatePayment,
  getAdminPaymentDetail,
};
