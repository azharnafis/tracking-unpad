const { pool } = require('../config/db');
const { sheets, SPREADSHEET_ID } = require('../config/sheets');
const { updateOrderStatus } = require('./statusService');

// Baca semua baris di sheet Pembayaran, cek mana yang statusnya VALID
// tapi order-nya di MySQL belum PROSES_ANALISIS (berarti belum diproses)
async function syncPaymentValidations() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Pembayaran!A2:H1000', // mulai baris 2 (data pertama), lewati header baris 1
  });

  const rows = res.data.values || [];

  for (const row of rows) {
    const kodeTracking = row[0];
    const statusValidasi = row[3]; // kolom D = Status_Validasi
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

// Baca sheet Draft, cek mana yang statusnya Disetujui tapi order-nya
// di MySQL belum PENGESAHAN
async function syncDraftApprovals() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Draft!A2:E1000',
  });

  const rows = res.data.values || [];

  for (const row of rows) {
    const kodeTracking = row[0];
    const statusDraft = row[4]; // kolom E = Status_Draft
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

async function runSync() {
  console.log('[SYNC] Menjalankan sinkronisasi Sheets -> MySQL...');
  await syncPaymentValidations();
  await syncDraftApprovals();
}

module.exports = { runSync };