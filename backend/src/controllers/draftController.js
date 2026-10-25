const { pool } = require('../config/db');
const { updateOrderStatus } = require('../services/statusService');
const { sendDraftRevisionNotification } = require('../services/notificationService');
const { writeBackByKodeTracking } = require('../services/sheetsSyncService');
const { KEPUTUSAN_CUSTOMER } = require('../constants');

async function findOrder(kodeTracking) {
  const [rows] = await pool.query(
    'SELECT order_id, current_status FROM orders WHERE kode_tracking = ?',
    [kodeTracking]
  );
  return rows[0] || null;
}

async function findLatestDraft(orderId) {
  const [rows] = await pool.query(
    `SELECT draft_id, versi_draft, link_draft, tanggal_upload,
            keputusan_customer, tanggal_keputusan,
            tindak_lanjut_admin, tanggal_tindak_lanjut
     FROM drafts WHERE order_id = ?
     ORDER BY versi_draft DESC LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
}

// ADMIN: upload draft baru (versi awal atau revisi).
// Revisi hanya sah bila versi terbaru berkeputusan REVISI dari customer.
async function uploadDraft(req, res) {
  const { kode_tracking } = req.params;
  const { link_draft } = req.body;

  if (!link_draft) {
    return res.status(400).json({ message: 'link_draft wajib diisi.' });
  }
  try {
    new URL(link_draft);
  } catch {
    return res.status(400).json({ message: 'link_draft harus berupa URL valid.' });
  }

  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const latest = await findLatestDraft(order.order_id);
    if (latest && latest.keputusan_customer !== 'REVISI') {
      return res.status(400).json({
        message: 'Draft revisi hanya dapat diupload setelah customer mengajukan revisi pada versi terbaru.',
      });
    }

    const versiBaru = latest ? latest.versi_draft + 1 : 1;
    await pool.query(
      `INSERT INTO drafts (order_id, versi_draft, link_draft, tanggal_upload, tindak_lanjut_admin)
       VALUES (?, ?, ?, NOW(), 'MENUNGGU_TINDAKAN')`,
      [order.order_id, versiBaru, link_draft]
    );

    if (versiBaru === 1) {
      await updateOrderStatus(order.order_id, 'REVIEW_DRAFT', 'Draft pertama diupload admin', 'ADMIN_MANUAL');
    } else {
      await sendDraftRevisionNotification(order.order_id);
    }

    try {
      await writeBackByKodeTracking('DRAFT', kode_tracking, {
        linkDraft: link_draft,
        tanggalUpload: new Date().toISOString().slice(0, 10),
        keputusanCustomer: '',
        tanggalKeputusan: '',
        tindakLanjutAdmin: 'MENUNGGU TINDAKAN',
        tanggalTindakLanjut: '',
      });
    } catch (sheetErr) {
      console.error(`[WRITE_BACK] uploadDraft gagal sync Sheets (${kode_tracking}):`, sheetErr.message);
    }

    return res.status(201).json({ message: `Draft versi ${versiBaru} berhasil diupload.`, versi_draft: versiBaru });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// CUSTOMER: lihat draft terbaru.
async function getLatestDraft(req, res) {
  const { kode_tracking } = req.params;
  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const latest = await findLatestDraft(order.order_id);
    if (!latest) return res.status(404).json({ message: 'Draft belum tersedia.' });

    return res.json({
      versi_draft: latest.versi_draft,
      link_draft: latest.link_draft,
      tanggal_upload: latest.tanggal_upload,
      keputusan_customer: latest.keputusan_customer,
      tindak_lanjut_admin: latest.tindak_lanjut_admin,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// CUSTOMER: catat keputusan SETUJU/REVISI pada versi terbaru.
// Endpoint ini TIDAK pernah mengubah status tracking.
async function recordDecision(req, res) {
  const { kode_tracking } = req.params;
  const { keputusan } = req.body;

  if (!KEPUTUSAN_CUSTOMER.includes(keputusan)) {
    return res.status(400).json({ message: 'keputusan harus SETUJU atau REVISI.' });
  }

  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const latest = await findLatestDraft(order.order_id);
    if (!latest) return res.status(404).json({ message: 'Draft belum tersedia.' });

    if (latest.keputusan_customer) {
      return res.status(409).json({
        message: `Keputusan untuk versi draft ${latest.versi_draft} sudah tercatat dan tidak dapat diubah.`,
      });
    }

    const now = new Date();
    const tanggalKeputusan = now.toISOString().slice(0, 10);

    await pool.query(
      'UPDATE drafts SET keputusan_customer = ?, tanggal_keputusan = NOW() WHERE draft_id = ?',
      [keputusan, latest.draft_id]
    );

    // Tulis-balik ke Google Sheets (non-blocking)
    try {
      await writeBackByKodeTracking('DRAFT', kode_tracking, {
        keputusanCustomer: keputusan,
        tanggalKeputusan: tanggalKeputusan,
      });
    } catch (sheetErr) {
      console.error(`[WRITE_BACK] recordDecision gagal sync Sheets (${kode_tracking}):`, sheetErr.message);
    }

    if (keputusan === 'SETUJU') {
      return res.json({
        message: 'Persetujuan Anda telah tercatat dan sedang menunggu proses pengesahan oleh admin.',
        keputusan_customer: keputusan,
      });
    }
    return res.json({
      message: 'Catatan revisi Anda telah tercatat. Silakan hubungi admin via WhatsApp untuk detail revisi.',
      keputusan_customer: keputusan,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// ADMIN: riwayat seluruh versi draft + keputusan customer per versi.
async function listDrafts(req, res) {
  const { kode_tracking } = req.params;
  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const [rows] = await pool.query(
      `SELECT versi_draft, link_draft, tanggal_upload,
              keputusan_customer, tanggal_keputusan,
              tindak_lanjut_admin, tanggal_tindak_lanjut
       FROM drafts WHERE order_id = ?
       ORDER BY versi_draft ASC`,
      [order.order_id]
    );

    return res.json({ drafts: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// ADMIN: satu-satunya jalur menuju status PENGESAHAN.
// Wajib: keputusan customer pada versi terbaru = SETUJU.
async function proceedToPengesahan(req, res) {
  const { kode_tracking } = req.params;
  try {
    const order = await findOrder(kode_tracking);
    if (!order) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });

    const latest = await findLatestDraft(order.order_id);
    if (!latest) {
      return res.status(400).json({ message: 'Draft belum tersedia.' });
    }
    if (latest.keputusan_customer !== 'SETUJU') {
      return res.status(409).json({
        message: 'Tidak dapat lanjut ke Pengesahan: customer belum menyetujui draft terbaru.',
      });
    }
    if (latest.tindak_lanjut_admin === 'LANJUT_KE_PENGESAHAN') {
      return res.status(409).json({ message: 'Draft ini sudah dilanjutkan ke Pengesahan sebelumnya.' });
    }
    if (order.current_status !== 'REVIEW_DRAFT') {
      return res.status(409).json({
        message: `Lanjut ke Pengesahan hanya berlaku saat status REVIEW_DRAFT (status saat ini: ${order.current_status}).`,
      });
    }

    const now = new Date();
    const tanggalTindakLanjut = now.toISOString().slice(0, 10);

    await pool.query(
      `UPDATE drafts SET tindak_lanjut_admin = 'LANJUT_KE_PENGESAHAN', tanggal_tindak_lanjut = NOW()
       WHERE draft_id = ?`,
      [latest.draft_id]
    );

    await updateOrderStatus(
      order.order_id,
      'PENGESAHAN',
      'Draft disetujui customer, dilanjutkan admin ke Pengesahan',
      'ADMIN_MANUAL'
    );

    // Tulis-balik ke Google Sheets (non-blocking)
    try {
      await writeBackByKodeTracking('DRAFT', kode_tracking, {
        tindakLanjutAdmin: 'LANJUT_KE_PENGESAHAN',
        tanggalTindakLanjut: tanggalTindakLanjut,
      });
    } catch (sheetErr) {
      console.error(`[WRITE_BACK] proceedToPengesahan gagal sync Sheets (${kode_tracking}):`, sheetErr.message);
    }

    return res.json({ message: 'Order dilanjutkan ke tahap Pengesahan.', current_status: 'PENGESAHAN' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

module.exports = {
  uploadDraft,
  getLatestDraft,
  recordDecision,
  listDrafts,
  proceedToPengesahan,
};
