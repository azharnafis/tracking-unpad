const { pool } = require('../config/db');
const { updateOrderStatus } = require('./statusService');
const { sendDraftRevisionNotification } = require('./notificationService');
const { parseDateIndonesian } = require('../utils/businessDays');
const {
  SHEETS_CONFIG,
  getCell,
  fetchSheetRows,
  recordSyncLog,
  writeBackByKodeTracking,
} = require('./sheetsSyncService');

let isSyncRunning = false;

async function syncNewOrders() {
  const rows = await fetchSheetRows('ORDER');

  for (const row of rows) {
    const { values } = row;
    const kodeTracking = String(getCell(values, SHEETS_CONFIG.ORDER.kodeColumn) || '').replace(/\s+/g, '').trim();
    if (!kodeTracking) continue;

    try {
      const tanggalMasukRaw = getCell(values, SHEETS_CONFIG.ORDER.fields.tanggalMasuk);
      const workDaysRaw = getCell(values, SHEETS_CONFIG.ORDER.fields.workDays);
      const namaPerusahaan = String(getCell(values, SHEETS_CONFIG.ORDER.fields.namaPerusahaan) || '').trim();
      const email = String(getCell(values, SHEETS_CONFIG.ORDER.fields.email) || '').trim();
      const noHp = String(getCell(values, SHEETS_CONFIG.ORDER.fields.noHp) || '').trim();
      const jenisAnalisisSampel = String(getCell(values, SHEETS_CONFIG.ORDER.fields.jenisAnalisisSampel) || '').trim();

      if (!namaPerusahaan || !email) {
        console.warn(`[SYNC] ORDER: skip ${kodeTracking} — nama perusahaan atau email tidak lengkap`);
        await recordSyncLog({
          sheetName: 'ORDER',
          kodeTracking,
          direction: 'SHEET_TO_MYSQL',
          status: 'FAILED',
          errorMessage: 'Nama perusahaan atau email tidak lengkap',
        });
        continue;
      }

      const estimasiHari = parseInt(String(workDaysRaw).replace(/[^0-9]/g, ''), 10) || 0;

      let tanggalMasuk = null;
      if (tanggalMasukRaw) {
        const parsed = new Date(tanggalMasukRaw);
        if (!isNaN(parsed.getTime())) {
          tanggalMasuk = parsed;
        }
      }
      if (!tanggalMasuk) {
        tanggalMasuk = new Date();
      }

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

      const [existingOrders] = await pool.query(
        'SELECT order_id, current_status FROM orders WHERE kode_tracking = ?',
        [kodeTracking]
      );

      if (existingOrders.length > 0) {
        await pool.query(
          `UPDATE orders SET
             customer_id = ?,
             jenis_analisis_sampel = ?,
             tanggal_masuk = ?,
             estimasi_hari = ?
           WHERE kode_tracking = ?`,
          [customerId, jenisAnalisisSampel, tanggalMasuk, estimasiHari, kodeTracking]
        );
      } else {
        const [orderResult] = await pool.query(
          `INSERT INTO orders (kode_tracking, customer_id, jenis_analisis_sampel, tanggal_masuk,
                                estimasi_hari, harga_total, current_status)
           VALUES (?, ?, ?, ?, ?, 0, 'SAMPEL_DITERIMA')`,
          [kodeTracking, customerId, jenisAnalisisSampel, tanggalMasuk, estimasiHari]
        );

        const orderId = orderResult.insertId;

        await updateOrderStatus(
          orderId,
          'SAMPEL_DITERIMA',
          'Order baru terdeteksi dari Google Sheets',
          'AUTO_SCRIPT'
        );

        await recordSyncLog({
          sheetName: 'ORDER',
          kodeTracking,
          direction: 'SHEET_TO_MYSQL',
          status: 'SUCCESS',
          errorMessage: null,
        });

        console.log(`[SYNC] Order baru dibuat: ${kodeTracking}`);
      }
    } catch (rowErr) {
      console.error(`[SYNC] Error memproses row ${kodeTracking}:`, rowErr.message);
      await recordSyncLog({
        sheetName: 'ORDER',
        kodeTracking,
        direction: 'SHEET_TO_MYSQL',
        status: 'FAILED',
        errorMessage: rowErr.message,
      });
    }
  }
}

async function syncPaymentValidations() {
  const rows = await fetchSheetRows('PAYMENT');

  for (const row of rows) {
    const { values } = row;
    const kodeTracking = String(getCell(values, SHEETS_CONFIG.PAYMENT.kodeColumn) || '').replace(/\s+/g, '').trim();
    if (!kodeTracking) continue;

    try {
      const linkInvoice = String(getCell(values, SHEETS_CONFIG.PAYMENT.fields.linkInvoice) || '').trim();
      const noInvoice = String(getCell(values, SHEETS_CONFIG.PAYMENT.fields.noInvoice) || '').trim();
      const tanggalInvoiceRaw = getCell(values, SHEETS_CONFIG.PAYMENT.fields.tanggalInvoice);
      const rekeningRaw = String(getCell(values, SHEETS_CONFIG.PAYMENT.fields.rekeningPembayaran) || '').trim().toUpperCase();
      const linkKwitansi = String(getCell(values, SHEETS_CONFIG.PAYMENT.fields.linkKwitansi) || '').trim();
      const keterangan = String(getCell(values, SHEETS_CONFIG.PAYMENT.fields.keterangan) || '').trim();
      const statusValidasi = String(getCell(values, SHEETS_CONFIG.PAYMENT.fields.statusValidasi) || '').trim().toUpperCase();

      const [orders] = await pool.query(
        'SELECT order_id, current_status FROM orders WHERE kode_tracking = ?',
        [kodeTracking]
      );

      if (orders.length === 0) {
        continue;
      }

      const order = orders[0];

      let rekening = null;
      if (rekeningRaw.includes('BNI')) rekening = 'BNI';
      else if (rekeningRaw.includes('MANDIRI')) rekening = 'MANDIRI';

      const tanggalInvoice = parseDateIndonesian(tanggalInvoiceRaw);

      const [payments] = await pool.query(
        `SELECT payment_id, status_validasi, link_invoice, rekening_pembayaran
         FROM payments
         WHERE order_id = ?
         ORDER BY payment_id DESC LIMIT 1`,
        [order.order_id]
      );

      let paymentId = null;
      if (payments.length > 0) {
        paymentId = payments[0].payment_id;
        await pool.query(
          `UPDATE payments SET
             link_invoice = COALESCE(NULLIF(?, ''), link_invoice),
             no_invoice = COALESCE(NULLIF(?, ''), no_invoice),
             tanggal_invoice = COALESCE(?, tanggal_invoice),
             rekening_pembayaran = COALESCE(?, rekening_pembayaran),
             link_kwitansi = COALESCE(NULLIF(?, ''), link_kwitansi),
             keterangan = COALESCE(NULLIF(?, ''), keterangan)
           WHERE payment_id = ?`,
          [linkInvoice, noInvoice, tanggalInvoice, rekening, linkKwitansi, keterangan, paymentId]
        );
      } else if (linkInvoice || noInvoice || rekening || statusValidasi || keterangan) {
        const [insertResult] = await pool.query(
          `INSERT INTO payments (order_id, link_invoice, no_invoice, tanggal_invoice, rekening_pembayaran, link_kwitansi, keterangan, status_validasi)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [order.order_id, linkInvoice || null, noInvoice || null, tanggalInvoice, rekening, linkKwitansi || null, keterangan || null, statusValidasi === 'VALID' ? 'VALID' : 'PENDING']
        );
        paymentId = insertResult.insertId;
      }

      if (linkInvoice || noInvoice) {
        await pool.query(
          `UPDATE orders SET
             kode_invoice = COALESCE(NULLIF(?, ''), kode_invoice),
             invoice_file_url = COALESCE(NULLIF(?, ''), invoice_file_url)
           WHERE order_id = ?`,
          [noInvoice, linkInvoice, order.order_id]
        );
      }

      // Transisi status: SAMPEL_DITERIMA -> PEMBAYARAN jika linkInvoice tersedia
      if (order.current_status === 'SAMPEL_DITERIMA' && linkInvoice) {
        await updateOrderStatus(
          order.order_id,
          'PEMBAYARAN',
          'Data invoice tersedia di Google Sheets',
          'AUTO_SCRIPT'
        );
        console.log(`[SYNC] ${kodeTracking}: SAMPEL_DITERIMA -> PEMBAYARAN`);
      }

      // Transisi status: PEMBAYARAN -> ANALISIS jika status_validasi VALID
      if (statusValidasi === 'VALID') {
        if (paymentId) {
          await pool.query(
            `UPDATE payments SET status_validasi = 'VALID', tanggal_validasi = NOW(), validated_by = 'ADMIN'
             WHERE payment_id = ? AND status_validasi != 'VALID'`,
            [paymentId]
          );
        }

        if (order.current_status === 'PEMBAYARAN') {
          await updateOrderStatus(
            order.order_id,
            'ANALISIS',
            'Pembayaran divalidasi admin via Sheets',
            'AUTO_SCRIPT'
          );
          console.log(`[SYNC] ${kodeTracking}: PEMBAYARAN -> ANALISIS`);
        }
      }

      await recordSyncLog({
        sheetName: 'PAYMENT',
        kodeTracking,
        direction: 'SHEET_TO_MYSQL',
        status: 'SUCCESS',
        errorMessage: null,
      });
    } catch (rowErr) {
      console.error(`[SYNC] Error memproses payment row ${kodeTracking}:`, rowErr.message);
      await recordSyncLog({
        sheetName: 'PAYMENT',
        kodeTracking,
        direction: 'SHEET_TO_MYSQL',
        status: 'FAILED',
        errorMessage: rowErr.message,
      });
    }
  }
}

async function syncDraftUploads() {
  const rows = await fetchSheetRows('DRAFT');

  for (const row of rows) {
    const { values } = row;
    const kodeTracking = String(getCell(values, SHEETS_CONFIG.DRAFT.kodeColumn) || '').replace(/\s+/g, '').trim();
    const linkDraft = String(getCell(values, SHEETS_CONFIG.DRAFT.fields.linkDraft) || '').trim();
    if (!kodeTracking || !linkDraft) continue;

    try {
      const tanggalUploadRaw = getCell(values, SHEETS_CONFIG.DRAFT.fields.tanggalUpload);
      const keputusanCustomerRaw = String(getCell(values, SHEETS_CONFIG.DRAFT.fields.keputusanCustomer) || '').trim().toUpperCase();
      const tanggalKeputusanRaw = getCell(values, SHEETS_CONFIG.DRAFT.fields.tanggalKeputusan);
      const tindakLanjutAdminRaw = String(getCell(values, SHEETS_CONFIG.DRAFT.fields.tindakLanjutAdmin) || '').trim().toUpperCase();
      const tanggalTindakLanjutRaw = getCell(values, SHEETS_CONFIG.DRAFT.fields.tanggalTindakLanjut);

      const [orders] = await pool.query(
        'SELECT order_id, current_status FROM orders WHERE kode_tracking = ?',
        [kodeTracking]
      );

      if (orders.length === 0) {
        console.warn(`[SYNC] DRAFT: skip ${kodeTracking} — order tidak ditemukan di database`);
        await recordSyncLog({
          sheetName: 'DRAFT',
          kodeTracking,
          direction: 'SHEET_TO_MYSQL',
          status: 'FAILED',
          errorMessage: `Order dengan kode tracking ${kodeTracking} tidak ditemukan`,
        });
        continue;
      }

      const order = orders[0];

      const [latestDrafts] = await pool.query(
        `SELECT draft_id, versi_draft, link_draft, keputusan_customer, tindak_lanjut_admin
         FROM drafts
         WHERE order_id = ?
         ORDER BY versi_draft DESC LIMIT 1`,
        [order.order_id]
      );

      let tindakLanjutAdmin = null;
      if (tindakLanjutAdminRaw.includes('PENGESAHAN')) {
        tindakLanjutAdmin = 'LANJUT_KE_PENGESAHAN';
      } else if (tindakLanjutAdminRaw.includes('MENUNGGU')) {
        tindakLanjutAdmin = 'MENUNGGU_TINDAKAN';
      }

      let keputusanCustomer = null;
      if (keputusanCustomerRaw.includes('SETUJU')) {
        keputusanCustomer = 'SETUJU';
      } else if (keputusanCustomerRaw.includes('REVISI')) {
        keputusanCustomer = 'REVISI';
      }

      const tanggalKeputusan = parseDateIndonesian(tanggalKeputusanRaw);
      const tanggalTindakLanjut = parseDateIndonesian(tanggalTindakLanjutRaw);

      // Jika link draft sama dengan versi terakhir di DB -> sinkronisasi status keputusan & tindak lanjut
      if (latestDrafts.length > 0 && latestDrafts[0].link_draft === linkDraft) {
        const currentDraft = latestDrafts[0];

        // Pengamanan: Deteksi apakah keputusan di Sheet adalah keputusan basi dari draft versi sebelumnya
        let isStaleDecision = false;
        if (currentDraft.versi_draft > 1 && !currentDraft.keputusan_customer && keputusanCustomer) {
          const [prevDrafts] = await pool.query(
            `SELECT keputusan_customer, tanggal_keputusan FROM drafts
             WHERE order_id = ? AND versi_draft < ?
             ORDER BY versi_draft DESC LIMIT 1`,
            [order.order_id, currentDraft.versi_draft]
          );
          if (prevDrafts.length > 0) {
            const prev = prevDrafts[0];
            if (prev.keputusan_customer === keputusanCustomer) {
              const prevTime = prev.tanggal_keputusan ? new Date(prev.tanggal_keputusan).getTime() : 0;
              const sheetTime = tanggalKeputusan ? new Date(tanggalKeputusan).getTime() : 0;
              if (sheetTime <= prevTime) {
                isStaleDecision = true;
                console.warn(
                  `[SYNC] DRAFT: ${kodeTracking} v${currentDraft.versi_draft} mengabaikan keputusan '${keputusanCustomer}' karena terindikasi residu versi sebelumnya.`
                );
                // Bersihkan residu keputusan lama dari Sheet
                try {
                  await writeBackByKodeTracking('DRAFT', kodeTracking, {
                    keputusanCustomer: '',
                    tanggalKeputusan: '',
                    tindakLanjutAdmin: 'MENUNGGU TINDAKAN',
                    tanggalTindakLanjut: '',
                  });
                } catch (wbErr) {
                  console.error(`[SYNC] Gagal membersihkan residu Sheet DRAFT (${kodeTracking}):`, wbErr.message);
                }
              }
            }
          }
        }

        // Sinkronisasi keputusan customer dari Sheet hanya jika bukan residu dari versi sebelumnya
        if (keputusanCustomer && currentDraft.keputusan_customer !== keputusanCustomer && !isStaleDecision) {
          await pool.query(
            `UPDATE drafts SET keputusan_customer = ?, tanggal_keputusan = COALESCE(?, NOW())
             WHERE draft_id = ?`,
            [keputusanCustomer, tanggalKeputusan, currentDraft.draft_id]
          );
          currentDraft.keputusan_customer = keputusanCustomer;
        }

        // Sinkronisasi tindak lanjut admin dari Sheet jika ada dan berbeda di DB (hanya jika bukan residu)
        if (tindakLanjutAdmin && currentDraft.tindak_lanjut_admin !== tindakLanjutAdmin && !isStaleDecision) {
          await pool.query(
            `UPDATE drafts SET tindak_lanjut_admin = ?, tanggal_tindak_lanjut = COALESCE(?, NOW())
             WHERE draft_id = ?`,
            [tindakLanjutAdmin, tanggalTindakLanjut, currentDraft.draft_id]
          );
          currentDraft.tindak_lanjut_admin = tindakLanjutAdmin;
        }

        // Transisi status ke PENGESAHAN jika:
        // 1. Keputusan customer = SETUJU
        // 2. Tindak lanjut admin = LANJUT_KE_PENGESAHAN
        // 3. Status order saat ini = REVIEW_DRAFT
        const effectiveKeputusan = currentDraft.keputusan_customer || keputusanCustomer;
        const effectiveTindakLanjut = currentDraft.tindak_lanjut_admin || tindakLanjutAdmin;

        if (
          effectiveKeputusan === 'SETUJU' &&
          effectiveTindakLanjut === 'LANJUT_KE_PENGESAHAN' &&
          order.current_status === 'REVIEW_DRAFT' &&
          !isStaleDecision
        ) {
          await updateOrderStatus(
            order.order_id,
            'PENGESAHAN',
            'Draft disetujui customer, dilanjutkan admin ke Pengesahan via Sheets',
            'AUTO_SCRIPT'
          );
          console.log(`[SYNC] ${kodeTracking}: REVIEW_DRAFT -> PENGESAHAN (via Sheets tindak lanjut admin)`);
        }

        await recordSyncLog({
          sheetName: 'DRAFT',
          kodeTracking,
          direction: 'SHEET_TO_MYSQL',
          status: 'SUCCESS',
          errorMessage: null,
        });

        continue;
      }

      // Jika link draft baru (versi baru atau draft pertama)
      const versiBaru = latestDrafts.length > 0 ? latestDrafts[0].versi_draft + 1 : 1;

      if (!tanggalUploadRaw) {
        console.warn(`[SYNC] DRAFT: skip ${kodeTracking} — tanggal upload kosong`);
        await recordSyncLog({
          sheetName: 'DRAFT',
          kodeTracking,
          direction: 'SHEET_TO_MYSQL',
          status: 'FAILED',
          errorMessage: 'Tanggal upload draft kosong',
        });
        continue;
      }

      const parsedDate = parseDateIndonesian(tanggalUploadRaw) || new Date(tanggalUploadRaw);
      if (!parsedDate || (parsedDate instanceof Date && isNaN(parsedDate.getTime()))) {
        console.warn(`[SYNC] DRAFT: skip ${kodeTracking} — format tanggal upload tidak valid: "${tanggalUploadRaw}"`);
        await recordSyncLog({
          sheetName: 'DRAFT',
          kodeTracking,
          direction: 'SHEET_TO_MYSQL',
          status: 'FAILED',
          errorMessage: `Format tanggal upload draft tidak valid: "${tanggalUploadRaw}"`,
        });
        continue;
      }
      const tanggalUpload = parsedDate;

      await pool.query(
        `INSERT INTO drafts (order_id, versi_draft, link_draft, tanggal_upload, tindak_lanjut_admin)
         VALUES (?, ?, ?, ?, 'MENUNGGU_TINDAKAN')`,
        [order.order_id, versiBaru, linkDraft, tanggalUpload]
      );

      console.log(`[SYNC] Draft ditambahkan: ${kodeTracking} versi ${versiBaru}`);

      // Reset kolom keputusan dan tindak lanjut di Google Sheets jika ini adalah draft revisi baru (versi > 1)
      if (versiBaru > 1) {
        try {
          await writeBackByKodeTracking('DRAFT', kodeTracking, {
            keputusanCustomer: '',
            tanggalKeputusan: '',
            tindakLanjutAdmin: 'MENUNGGU TINDAKAN',
            tanggalTindakLanjut: '',
          });
          console.log(`[SYNC] Kolom keputusan di Sheet DRAFT di-reset untuk ${kodeTracking} versi ${versiBaru}`);
        } catch (wbErr) {
          console.error(`[SYNC] Gagal reset kolom DRAFT Sheet untuk ${kodeTracking}:`, wbErr.message);
        }
      }

      // Hanya draft versi 1 yang memicu transisi status ke REVIEW_DRAFT
      if (versiBaru === 1) {
        if (order.current_status !== 'REVIEW_DRAFT') {
          await updateOrderStatus(
            order.order_id,
            'REVIEW_DRAFT',
            'Draft pertama terdeteksi dari Google Sheets',
            'AUTO_SCRIPT'
          );
          console.log(`[SYNC] ${kodeTracking}: -> REVIEW_DRAFT (draft versi 1 dari Sheets)`);
        }
      } else {
        // Draft revisi (versi > 1): kirim notifikasi revisi tanpa mengubah status order
        await sendDraftRevisionNotification(order.order_id);
      }

      await recordSyncLog({
        sheetName: 'DRAFT',
        kodeTracking,
        direction: 'SHEET_TO_MYSQL',
        status: 'SUCCESS',
        errorMessage: null,
      });
    } catch (rowErr) {
      console.error(`[SYNC] Error memproses draft row ${kodeTracking}:`, rowErr.message);
      await recordSyncLog({
        sheetName: 'DRAFT',
        kodeTracking,
        direction: 'SHEET_TO_MYSQL',
        status: 'FAILED',
        errorMessage: rowErr.message,
      });
    }
  }
}

async function syncCertificates() {
  const rows = await fetchSheetRows('ORDER');

  for (const row of rows) {
    const { values } = row;
    const kodeTracking = String(getCell(values, SHEETS_CONFIG.ORDER.kodeColumn) || '').replace(/\s+/g, '').trim();
    const linkSertifikat = String(getCell(values, SHEETS_CONFIG.ORDER.fields.linkSertifikat) || '').trim();
    if (!kodeTracking || !linkSertifikat) continue;

    try {
      const tanggalTerbitRaw = getCell(values, SHEETS_CONFIG.ORDER.fields.tanggalTerbitSertifikat);
      if (!tanggalTerbitRaw) {
        console.warn(`[SYNC] Sertifikat: skip ${kodeTracking} — tanggal terbit sertifikat kosong`);
        await recordSyncLog({
          sheetName: 'ORDER',
          kodeTracking,
          direction: 'SHEET_TO_MYSQL',
          status: 'FAILED',
          errorMessage: 'Tanggal terbit sertifikat kosong',
        });
        continue;
      }

      const parsedDate = new Date(tanggalTerbitRaw);
      if (isNaN(parsedDate.getTime())) {
        console.warn(`[SYNC] Sertifikat: skip ${kodeTracking} — format tanggal terbit sertifikat tidak valid: "${tanggalTerbitRaw}"`);
        await recordSyncLog({
          sheetName: 'ORDER',
          kodeTracking,
          direction: 'SHEET_TO_MYSQL',
          status: 'FAILED',
          errorMessage: `Format tanggal terbit sertifikat tidak valid: "${tanggalTerbitRaw}"`,
        });
        continue;
      }
      const tanggalTerbit = parsedDate.toISOString().slice(0, 10);

      const [orders] = await pool.query(
        'SELECT order_id, current_status FROM orders WHERE kode_tracking = ?',
        [kodeTracking]
      );

      if (orders.length === 0) {
        console.warn(`[SYNC] Sertifikat: skip ${kodeTracking} — order tidak ditemukan di database`);
        await recordSyncLog({
          sheetName: 'ORDER',
          kodeTracking,
          direction: 'SHEET_TO_MYSQL',
          status: 'FAILED',
          errorMessage: `Order dengan kode tracking ${kodeTracking} tidak ditemukan`,
        });
        continue;
      }

      const order = orders[0];

      const [existingCerts] = await pool.query(
        'SELECT certificate_id FROM certificates WHERE order_id = ?',
        [order.order_id]
      );

      if (existingCerts.length > 0) {
        // Sudah ada sertifikat -> no-op / idempotent (jangan buat duplicate/log berulang)
        continue;
      }

      await pool.query(
        `INSERT INTO certificates (order_id, link_sertifikat, tanggal_terbit)
         VALUES (?, ?, ?)`,
        [order.order_id, linkSertifikat, tanggalTerbit]
      );

      console.log(`[SYNC] Sertifikat ditambahkan: ${kodeTracking}`);

      if (order.current_status !== 'DOWNLOAD_SERTIFIKAT') {
        await updateOrderStatus(
          order.order_id,
          'DOWNLOAD_SERTIFIKAT',
          'Sertifikat tersedia di Google Sheets',
          'AUTO_SCRIPT'
        );
        console.log(`[SYNC] ${kodeTracking}: -> DOWNLOAD_SERTIFIKAT`);
      }

      await recordSyncLog({
        sheetName: 'ORDER',
        kodeTracking,
        direction: 'SHEET_TO_MYSQL',
        status: 'SUCCESS',
        errorMessage: null,
      });
    } catch (rowErr) {
      console.error(`[SYNC] Error memproses sertifikat row ${kodeTracking}:`, rowErr.message);
      await recordSyncLog({
        sheetName: 'ORDER',
        kodeTracking,
        direction: 'SHEET_TO_MYSQL',
        status: 'FAILED',
        errorMessage: rowErr.message,
      });
    }
  }
}

async function runSync() {
  if (isSyncRunning) {
    console.log('[SYNC] Sinkronisasi sebelumnya masih berjalan, skip run kali ini.');
    return;
  }

  isSyncRunning = true;
  console.log('[SYNC] Menjalankan sinkronisasi Sheets -> MySQL...');

  try {
    try {
      await syncNewOrders();
    } catch (err) {
      console.error('[SYNC] Error pada syncNewOrders:', err.message);
    }

    try {
      await syncPaymentValidations();
    } catch (err) {
      console.error('[SYNC] Error pada syncPaymentValidations:', err.message);
    }

    try {
      await syncDraftUploads();
    } catch (err) {
      console.error('[SYNC] Error pada syncDraftUploads:', err.message);
    }

    try {
      await syncCertificates();
    } catch (err) {
      console.error('[SYNC] Error pada syncCertificates:', err.message);
    }
  } finally {
    isSyncRunning = false;
    console.log('[SYNC] Sinkronisasi selesai.');
  }
}

module.exports = { runSync, syncNewOrders, syncPaymentValidations, syncDraftUploads, syncCertificates };