const { pool } = require('../config/db');
const { sheets, SPREADSHEET_ID } = require('../config/sheets');
const { updateOrderStatus } = require('./statusService');

const STATUS_LABEL_TO_ENUM = {
  'Sampel Diterima': 'SAMPEL_DITERIMA',
  'Pembayaran': 'PEMBAYARAN',
  'Proses Analisis': 'PROSES_ANALISIS',
  'Input Data Hasil': 'INPUT_DATA_HASIL',
  'Review Draft': 'REVIEW_DRAFT',
  'Pengesahan': 'PENGESAHAN',
  'Download Sertifikat': 'DOWNLOAD_SERTIFIKAT',
};

const STATUS_ORDER = [
  'SAMPEL_DITERIMA', 'PEMBAYARAN', 'PROSES_ANALISIS', 'INPUT_DATA_HASIL',
  'REVIEW_DRAFT', 'PENGESAHAN', 'DOWNLOAD_SERTIFIKAT',
];

const MAX_VERSI_DRAFT = 3;
const VALID_DRAFT_STATUSES = ['MENUNGGU_REVIEW', 'DISETUJUI', 'REVISI'];

async function syncNewOrders() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Data_Order!A2:J1000',
  });

  const rows = res.data.values || [];

  for (const row of rows) {
    const kodeTracking = row[0];
    if (!kodeTracking) continue;

    const tanggalMasuk = row[1];
    const namaPerusahaan = row[2];
    const jenisAnalisisSampel = row[3];
    const noHp = row[4];
    const email = row[5];
    const estimasiHariRaw = row[6];
    const kodeInvoice = row[7];
    const hargaTotalRaw = row[8];
    const linkInvoice = row[9];

    if (!namaPerusahaan || !email) continue;

    const estimasiHari = parseInt(String(estimasiHariRaw).replace(/[^0-9]/g, ''), 10) || 0;
    const hargaTotal = parseFloat(String(hargaTotalRaw).replace(/[^0-9.]/g, '')) || 0;

    let customerId;
    const [existingCustomer] = await pool.query(
      'SELECT customer_id FROM customers WHERE email = ?',
      [email]
    );
    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].customer_id;
      await pool.query(
        'UPDATE customers SET nama_perusahaan = ?, no_hp = ? WHERE customer_id = ?',
        [namaPerusahaan, noHp, customerId]
      );
    } else {
      const [insertResult] = await pool.query(
        'INSERT INTO customers (nama_perusahaan, no_hp, email) VALUES (?, ?, ?)',
        [namaPerusahaan, noHp, email]
      );
      customerId = insertResult.insertId;
    }

    const [existingOrder] = await pool.query(
      'SELECT order_id FROM orders WHERE kode_tracking = ?',
      [kodeTracking]
    );

    if (existingOrder.length > 0) {
      await pool.query(
        `UPDATE orders SET
           customer_id = ?, jenis_analisis_sampel = ?, tanggal_masuk = ?,
           estimasi_hari = ?, kode_invoice = ?, harga_total = ?, invoice_file_url = ?
         WHERE kode_tracking = ?`,
        [customerId, jenisAnalisisSampel, new Date(tanggalMasuk),
         estimasiHari, kodeInvoice, hargaTotal, linkInvoice, kodeTracking]
      );
    } else {
      const [orderResult] = await pool.query(
        `INSERT INTO orders (kode_tracking, customer_id, jenis_analisis_sampel, tanggal_masuk,
                              estimasi_hari, kode_invoice, harga_total, invoice_file_url, current_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SAMPEL_DITERIMA')`,
        [kodeTracking, customerId, jenisAnalisisSampel, new Date(tanggalMasuk),
         estimasiHari, kodeInvoice, hargaTotal, linkInvoice]
      );

      await updateOrderStatus(
        orderResult.insertId,
        'SAMPEL_DITERIMA',
        'Order baru terdeteksi dari Google Sheets',
        'AUTO_SCRIPT'
      );

      console.log(`[SYNC] Order baru dibuat: ${kodeTracking}`);
    }
  }
}

// BARU: sinkronisasi umum dropdown Status_Tracking -> current_status di MySQL
// Cuma boleh MAJU (mengikuti urutan STATUS_ORDER), tidak pernah mundur.
async function syncManualStatusChanges() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Status_Tracking!A2:E1000',
  });

  const rows = res.data.values || [];

  for (const row of rows) {
    const kodeTracking = row[0];
    const statusLabel = row[1];
    const keterangan = row[2];
    if (!kodeTracking || !statusLabel) continue;

    const sheetStatus = STATUS_LABEL_TO_ENUM[statusLabel];
    if (!sheetStatus) continue; // label di sheet tidak dikenali, lewati

    const [orders] = await pool.query(
      'SELECT order_id, current_status FROM orders WHERE kode_tracking = ?',
      [kodeTracking]
    );
    if (orders.length === 0) continue;
    const order = orders[0];

    const currentIndex = STATUS_ORDER.indexOf(order.current_status);
    const sheetIndex = STATUS_ORDER.indexOf(sheetStatus);

    if (sheetIndex > currentIndex) {
      await updateOrderStatus(
        order.order_id,
        sheetStatus,
        keterangan || 'Status diubah admin via Google Sheets',
        'AUTO_SCRIPT'
      );
      console.log(`[SYNC] ${kodeTracking}: ${order.current_status} -> ${sheetStatus} (manual dari Status_Tracking)`);
    }
  }
}

async function syncPaymentValidations() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Pembayaran!A2:H1000',
  });

  const rows = res.data.values || [];

  for (const row of rows) {
    const kodeTracking = row[0];
    const statusValidasi = row[3];
    if (!kodeTracking || statusValidasi !== 'VALID') continue;

    const [orders] = await pool.query(
      'SELECT order_id, current_status FROM orders WHERE kode_tracking = ?',
      [kodeTracking]
    );
    if (orders.length === 0) continue;

    const order = orders[0];
    if (order.current_status === 'PEMBAYARAN') {
      await updateOrderStatus(order.order_id, 'PROSES_ANALISIS', 'Pembayaran divalidasi admin via Sheets', 'AUTO_SCRIPT');
      console.log(`[SYNC] ${kodeTracking}: PEMBAYARAN -> PROSES_ANALISIS`);
    }
  }
}

async function syncDraftUploads() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Draft!A2:F1000',
  });

  const rows = res.data.values || [];

  for (const row of rows) {
    const kodeTracking = row[0];
    if (!kodeTracking) continue;

    const versiRaw = parseInt(String(row[1]).replace(/[^0-9]/g, ''), 10);
    if (!versiRaw || versiRaw <= 0 || versiRaw > MAX_VERSI_DRAFT) continue;

    const linkDraft = row[2];
    if (!linkDraft) continue;

    const tanggalRaw = row[3];
    const parsedDate = new Date(tanggalRaw);
    if (isNaN(parsedDate.getTime())) {
      console.log(`[SYNC] Draft: skip ${kodeTracking} — format tanggal tidak valid: "${tanggalRaw}"`);
      continue;
    }

    const statusDraftRaw = row[4];
    let statusDraft = 'MENUNGGU_REVIEW';
    if (statusDraftRaw) {
      const normalized = String(statusDraftRaw).trim().toUpperCase();
      if (VALID_DRAFT_STATUSES.includes(normalized)) {
        statusDraft = normalized;
      } else {
        console.log(`[SYNC] Draft: status tidak valid "${statusDraftRaw}" untuk ${kodeTracking} → fallback ke MENUNGGU_REVIEW`);
      }
    }

    const [orders] = await pool.query(
      'SELECT order_id, current_status FROM orders WHERE kode_tracking = ?',
      [kodeTracking]
    );
    if (orders.length === 0) continue;

    const order = orders[0];

    const [existing] = await pool.query(
      'SELECT draft_id FROM drafts WHERE order_id = ? AND versi_draft = ?',
      [order.order_id, versiRaw]
    );
    if (existing.length > 0) continue;

    await pool.query(
      `INSERT INTO drafts (order_id, versi_draft, link_draft, tanggal_upload, status_draft)
       VALUES (?, ?, ?, ?, ?)`,
      [order.order_id, versiRaw, linkDraft, parsedDate, statusDraft]
    );
    console.log(`[SYNC] Draft ditambahkan: ${kodeTracking} versi ${versiRaw}`);

    if (versiRaw === 1 && order.current_status !== 'REVIEW_DRAFT') {
      await updateOrderStatus(order.order_id, 'REVIEW_DRAFT', 'Draft pertama terdeteksi dari Google Sheets', 'AUTO_SCRIPT');
      console.log(`[SYNC] ${kodeTracking}: -> REVIEW_DRAFT (draft versi 1 dari Sheets)`);
    }
  }
}

async function syncDraftApprovals() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Draft!A2:E1000',
  });

  const rows = res.data.values || [];

  for (const row of rows) {
    const kodeTracking = row[0];
    const statusDraft = row[4];
    if (!kodeTracking || statusDraft !== 'Disetujui') continue;

    const [orders] = await pool.query(
      'SELECT order_id, current_status FROM orders WHERE kode_tracking = ?',
      [kodeTracking]
    );
    if (orders.length === 0) continue;

    const order = orders[0];
    if (order.current_status === 'REVIEW_DRAFT') {
      await updateOrderStatus(order.order_id, 'PENGESAHAN', 'Draft disetujui via Sheets', 'AUTO_SCRIPT');
      console.log(`[SYNC] ${kodeTracking}: REVIEW_DRAFT -> PENGESAHAN`);
    }
  }
}

async function syncCertificates() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sertifikat!A2:C1000',
  });

  const rows = res.data.values || [];

  for (const row of rows) {
    const kodeTracking = row[0];
    const linkSertifikat = row[1];
    const tanggalTerbitRaw = row[2];
    if (!kodeTracking || !linkSertifikat) continue;

    const parsedDate = new Date(tanggalTerbitRaw);
    if (isNaN(parsedDate.getTime())) {
      console.log(`[SYNC] Sertifikat: skip ${kodeTracking} — format tanggal tidak valid: "${tanggalTerbitRaw}"`);
      continue;
    }
    const tanggalTerbit = parsedDate.toISOString().slice(0, 10);

    const [orders] = await pool.query(
      'SELECT order_id FROM orders WHERE kode_tracking = ?',
      [kodeTracking]
    );
    if (orders.length === 0) continue;

    const orderId = orders[0].order_id;

    const [existing] = await pool.query(
      'SELECT certificate_id FROM certificates WHERE order_id = ?',
      [orderId]
    );
    if (existing.length > 0) continue;

    await pool.query(
      `INSERT INTO certificates (order_id, link_sertifikat, tanggal_terbit)
       VALUES (?, ?, ?)`,
      [orderId, linkSertifikat, tanggalTerbit]
    );
    console.log(`[SYNC] Sertifikat ditambahkan: ${kodeTracking}`);
  }
}

async function runSync() {
  console.log('[SYNC] Menjalankan sinkronisasi Sheets -> MySQL...');
  await syncNewOrders();
  await syncDraftUploads();
  await syncPaymentValidations();
  await syncDraftApprovals();
  await syncCertificates();
  await syncManualStatusChanges();
}

module.exports = { runSync };