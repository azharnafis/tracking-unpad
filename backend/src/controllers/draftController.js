const { pool } = require('../config/db');
const { updateOrderStatus } = require('../services/statusService');
const { findRowByKodeTracking, updateCell } = require('../services/sheetsSyncService');

const MAX_VERSI_DRAFT = 3; // versi 1 = draft awal, 2 & 3 = maksimal 2 kali revisi

// Admin upload draft baru (pertama kali, atau setelah revisi)
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
    const [orders] = await pool.query('SELECT order_id FROM orders WHERE kode_tracking = ?', [kode_tracking]);
    if (orders.length === 0) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });
    const orderId = orders[0].order_id;

    const [[latest]] = await pool.query(
      'SELECT versi_draft FROM drafts WHERE order_id = ? ORDER BY versi_draft DESC LIMIT 1',
      [orderId]
    );
    const versiBaru = latest ? latest.versi_draft + 1 : 1;

    if (versiBaru > MAX_VERSI_DRAFT) {
      return res.status(400).json({ message: 'Batas maksimal 2 kali revisi sudah tercapai.' });
    }

    await pool.query(
      `INSERT INTO drafts (order_id, versi_draft, link_draft, tanggal_upload, status_draft)
       VALUES (?, ?, ?, NOW(), 'MENUNGGU_REVIEW')`,
      [orderId, versiBaru, link_draft]
    );

    // Upload draft pertama kali -> status order pindah ke REVIEW_DRAFT
    if (versiBaru === 1) {
      await updateOrderStatus(orderId, 'REVIEW_DRAFT', 'Draft pertama diupload admin', 'ADMIN_MANUAL');
    }

    return res.status(201).json({ message: `Draft versi ${versiBaru} berhasil diupload.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// Customer klik "Lanjutkan ke Pengesahan"
async function approveDraft(req, res) {
  const { kode_tracking } = req.params;
  try {
    const [orders] = await pool.query('SELECT order_id FROM orders WHERE kode_tracking = ?', [kode_tracking]);
    if (orders.length === 0) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });
    const orderId = orders[0].order_id;

    await pool.query(
      `UPDATE drafts SET status_draft = 'DISETUJUI'
       WHERE order_id = ? ORDER BY versi_draft DESC LIMIT 1`,
      [orderId]
    );

    // Tulis tanggal persetujuan ke kolom F sheet Draft (Disetujui_Customer)
    const found = await findRowByKodeTracking('Draft', kode_tracking);
    if (found) {
      const tanggalSekarang = new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      await updateCell('Draft', found.rowNumber, 'F', tanggalSekarang);
    }

    return res.json({ message: 'Persetujuan Anda telah dikirim, menunggu verifikasi admin.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

// Customer klik "Ajukan Catatan Revisi"
async function requestRevision(req, res) {
  const { kode_tracking } = req.params;
  try {
    const [orders] = await pool.query('SELECT order_id FROM orders WHERE kode_tracking = ?', [kode_tracking]);
    if (orders.length === 0) return res.status(404).json({ message: 'Kode tracking tidak ditemukan.' });
    const orderId = orders[0].order_id;

    const [[latest]] = await pool.query(
      'SELECT versi_draft FROM drafts WHERE order_id = ? ORDER BY versi_draft DESC LIMIT 1',
      [orderId]
    );

    if (latest && latest.versi_draft >= MAX_VERSI_DRAFT) {
      return res.status(400).json({ message: 'Batas maksimal 2 kali revisi sudah tercapai.' });
    }

    await pool.query(
      `UPDATE drafts SET status_draft = 'REVISI'
       WHERE order_id = ? ORDER BY versi_draft DESC LIMIT 1`,
      [orderId]
    );

    const found = await findRowByKodeTracking('Draft', kode_tracking);
    if (found) {
      await updateCell('Draft', found.rowNumber, 'E', 'Revisi');
    }

    const whatsappUrl = `https://wa.me/${process.env.ADMIN_WA_NUMBER}?text=${encodeURIComponent('Revisi draft untuk kode tracking ' + kode_tracking)}`;

    return res.json({ message: 'Silakan lanjutkan ke WhatsApp admin untuk detail revisi.', whatsapp_url: whatsappUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}

module.exports = { uploadDraft, approveDraft, requestRevision };