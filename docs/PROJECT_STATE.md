# PROJECT STATE — Tracking Unpad (KTNT Lab Sample Tracking)

> Checkpoint dibuat 2026-08-22 agar sesi OpenCode baru bisa lanjut TANPA riwayat percakapan.
> Semua informasi di bawah sudah diverifikasi langsung (DB live, git, spreadsheet reference).

## 1. Arsitektur Proyek
Google Sheets (file final) → Google Sheets API → `cronSyncService`/`sheetsSyncService` → MySQL (`lab_tracking`) → Backend API (Express 5, port 3000) → Frontend.
Dokumen baseline: `docs/00` requirement, `docs/01` system design, `docs/02` data model/sheet mapping, `docs/03` API contract, `docs/05` automation spec (AR-001..AR-014), `docs/06` task breakdown, `docs/07` implementation plan. Referensi spreadsheet: `docs/references/Spreadsheet_Reference_Final.xlsx`.

## 2. Status Database Migration (Phase 2)
SELESAI & terverifikasi live. 10 tabel: `customers, orders, payments, drafts, questionnaires, certificates, tracking_log, notifications, sync_logs, questionnaires_archive_demo`.
Fakta schema final (JANGAN diubah):
- `orders.current_status` enum 6 status: SAMPEL_DITERIMA, PEMBAYARAN, ANALISIS, REVIEW_DRAFT, PENGESAHAN, DOWNLOAD_SERTIFIKAT.
- `payments`: link_invoice, no_invoice, tanggal_invoice, jenis_faktur enum(FAKTUR_PAJAK,NON_FAKTUR), npwp, link_kwitansi, rekening_pembayaran enum(BNI,MANDIRI), status, bukti fields.
- `drafts`: versi_draft, link_draft, tanggal_upload, keputusan_customer enum(SETUJU,REVISI), tanggal_keputusan, tindak_lanjut_admin enum(MENUNGGU_TINDAKAN,LANJUT_KE_PENGESAHAN), tanggal_tindak_lanjut. (Tidak ada status_draft.)
- `questionnaires`: q01–q14 tinyint + feedback text. q01–q13 SCALE_PUAS, q14 (IV1_AKURASI_HASIL_UJI) SCALE_BAIK.
- `certificates`: UNIQUE(order_id), link_sertifikat, tanggal_terbit.
- `sync_logs`: sheet_name(50), kode_tracking(30), direction enum(SHEET_TO_MYSQL,MYSQL_TO_SHEET), sync_status enum(SUCCESS,FAILED), error_message(500), synced_at.

## 3. Status Implementasi Phase 3
SELESAI & SUDAH DI-COMMIT+PUSH (commit `8f4bdeb feat: implement backend core`).
- `src/constants/index.js` (VALID_STATUSES 6 status, REKENING_MAP BNI/Mandiri, skala survey), `src/utils/businessDays.js`.
- Controllers rewritten: draft/payment/questionnaire/tracking + certificateController baru; adminRoutes baru; routes pakai `{ mergeParams: true }`; server.js mount `/api/tracking` + `/api/admin`.
- `statusService.updateOrderStatus()` satu-satunya jalur ubah status + guard enum.
- notificationService: key ANALISIS + template DRAFT_REVISI (non-blocking).
- Cron masih target sheet LAMA (dibersihkan sebagian; sisanya = tugas Phase 4B).

## 4. Hasil Audit Phase 3
Semua seksi PASS, verdict **READY**. Findings tersisa:
- MEDIUM: cronSyncService target sheet lama (ditangani Phase 4B); legacy invoice fallback `trackingController.js` (~line 118–126, kolom orders.invoice_file_url/kode_invoice).
- LOW: formatting `draftRoutes.js` line 8 (dua statement satu baris); `MAX_VERSI_DRAFT` sisa filter; `validated_by='ADMIN'` hardcoded.

## 5. Hasil Audit Phase 4
Struktur `Spreadsheet_Reference_Final.xlsx` diekstrak langsung dari file xlsx (TERVERIFIKASI):
- **13 sheet**: DB, ORDER, PARAMETER, FORM, PENERIMAAN, PAYMENT, DRAFT, SURVEY, LABEL, FORM KWITANSI, CALC, PAR, `KWITANSI ` (trailing space). TIDAK ada sheet Sertifikat → sertifikat = kolom ORDER.
- Identifier kode: ORDER = kolom **B** (CODE OF SAMPLE; C = huruf jenis "I"/"L"); PENERIMAAN = C (alternatif D); PAYMENT/DRAFT/SURVEY = **E** (blok formula PARAMETER!E). Kode TIDAK selalu di kolom A.
- Semua sheet inti: baris data mulai **baris 3** (baris 1–2 header/legend; terbukti formula silang).
- ORDER: E RECEIVED ON, G WORK(estimasi hari kerja; F=D split), I NAME, K EMAIL, L NO_WHATSAPP, AC PARAMETER, AG STATUS_TRACKING, AH LINK_SERTIFIKAT, AI TANGGAL_TERBIT_SERTIFIKAT.
- PENERIMAAN: F RECEIVED ON, G DATE OF ANALYSIS, I WORK. Header L/M numerik (508/458) berisi Nama/Alamat (tercatat di docs/02 Bag. restandarisasi).
- PAYMENT: M JENIS_FAKTUR, N NPWP, O REKENING_PEMBAYARAN, P LINK_BUKTI_BAYAR, Q STATUS_VALIDASI, U CARA, AA LINK_KWITANSI, AB KETERANGAN, AC LINK_INVOICE, AD NO_INVOICE, AE TANGGAL_INVOICE; F/G/H/I/J/K/L/R/S/T/V/W/X/Y/Z sebagian formula (TOTAL, PAJAK 11%, JUMLAH, kwitansi). Kolom W ada formula legacy yang memuat string `"CASH"` (remnant, tidak dipakai backend).
- DRAFT: F LINK DRAFT, G TANGGAL UPLOAD, H KEPUTUSAN CUSTOMER, I TANGGAL KEPUTUSAN, J TINDAK LANJUT ADMIN, K TANGGAL TINDAK LANJUT. Satu row per order, TANPA kolom versi.
- SURVEY: row2 field names F–S = 14 pertanyaan (I1–I4, II1–II3, III1–III6, IV1) = q01–q14; T KRITIK_DAN_SARAN. API-only.
Verdict audit: struktur PASS, mapping PASS, kode existing NEEDS FIX (target lama + phantom dependency).

## 6. Hasil Implementasi Phase 4A (SELESAI, BELUM di-commit)
- `backend/src/services/sheetsSyncService.js` di-rebuild penuh:
  - `SHEETS_CONFIG` (mapping di atas, termasuk kodeColumn + dataStartRow=3 + endColumn per sheet),
  - `columnToIndex`, `getCell`, `buildRange`, `fetchSheetRows` (return {rowNumber, values}), `findByKodeTracking`,
  - write-back: `buildBatchUpdateRequest` (pure builder, valueInputOption **RAW**) + `writeFields` (satu call values.batchUpdate),
  - `recordSyncLog` (INSERT sync_logs, truncation 50/30/500, non-throwing).
- `backend/package.json`: tambah `"googleapis": "173.0.0"` (exact match root node_modules).
- Verifikasi: `node --check` OK; smoke test stub 7/7 PASS (tanpa network/DB/API/cron).
- **BELUM**: `npm install` (package-lock.json masih stale — googleapis belum ter-lock).

## 7. Git State Saat Ini
- Commit terakhir: `8f4bdeb` (Phase 3). Working tree bersih kecuali **3 file modified BELUM di-commit**:
  - `backend/package.json`
  - `backend/src/services/sheetsSyncService.js`
  - `backend/src/services/cronSyncService.js`
- JANGAN commit/push tanpa approval eksplisit user.

## 8. Aturan Keamanan Database & Testing (WAJIB)
- Tanpa approval: JANGAN INSERT/UPDATE/DELETE DB, JANGAN migration/DDL, JANGAN POST/PUT/PATCH/DELETE API, JANGAN kirim email/WhatsApp, JANGAN commit/push, JANGAN jalankan cron produksi, JANGAN tulis Google Sheets/Drive.
- Read-only (SELECT/DESCRIBE/SHOW, node --check, dry-run dengan stub) BOLEH.
- Perubahan status order HANYA lewat `updateOrderStatus()` (guard enum) sebagai efek business event AR-001..AR-014.
- Quirk environment: command PowerShell panjang (>~2KB) membuat shell hang → gunakan command pendek atau script di `C:\Users\Hp\AppData\Local\Temp\opencode\` (pola terbukti untuk parse xlsx & smoke test).

## 9. Keputusan Desain Phase 4 (SUDAH DIAPPROVE USER)
1. **Draft versioning**: LINK_DRAFT berubah dari link terakhir di MySQL → insert versi baru = MAX(versi_draft)+1; link sama → skip; TANPA batas MAX_VERSI_DRAFT.
2. **Payment validation via Sheets**: Q=VALID hanya memproses payment row yang SUDAH ADA; jika tidak ada → SKIP + catat FAILED di sync_logs; TIDAK boleh auto-create payment dari Sheets.
3. **Survey**: API-only (Customer→API→MySQL); tidak ada write-back MySQL→SURVEY.
4. **Cron**: tetap tiap 30 detik + overlap guard (dua sync tidak boleh jalan bersamaan).

## 10. Status Implementasi Phase 4B (COMPLETE)
SELESAI & terverifikasi penuh via dry-run/mock testing (BELUM di-commit).
- **Phase 4A: COMPLETE** (rebuild `sheetsSyncService.js`, `SHEETS_CONFIG`, dynamic mapping, safe batch update builder, non-throwing `recordSyncLog`).
- **Phase 4B: COMPLETE** (rebuild `cronSyncService.js` orchestration & sync modules):
  - **Phase 4B.1 ORDER/PENERIMAAN: COMPLETE** (membaca sheet `ORDER` kolom B, E, G, I, K, L, AC; upsert customer berbasis email; insert order baru dengan `current_status = SAMPEL_DITERIMA` + `updateOrderStatus()`; preserve status order existing; per-row try/catch & sync_logs).
  - **Phase 4B.2 PAYMENT validation: COMPLETE** (membaca sheet `PAYMENT` kolom E, Q; filter Q=VALID; validasi row payment existing; transisi `PEMBAYARAN -> ANALISIS` via `updateOrderStatus()`; idempotensi payment; catat FAILED jika order/payment tidak ditemukan).
  - **Phase 4B.3 DRAFT versioning + AR-008: COMPLETE** (membaca sheet `DRAFT` kolom E, F, G; dynamic versioning tanpa MAX_VERSI_DRAFT; link sama = no-op; link baru = MAX(versi)+1; validasi ketat tanggal upload tanpa fallback server time; versi 1 -> transisi `REVIEW_DRAFT`; versi > 1 -> `sendDraftRevisionNotification()` sesuai AR-008 tanpa mengubah lifecycle status).
  - **Phase 4B.4 CERTIFICATE sync: COMPLETE** (membaca sheet `ORDER` kolom B, AH, AI; validasi ketat tanggal terbit; insert `certificates` baru; transisi status order -> `DOWNLOAD_SERTIFIKAT` via `updateOrderStatus()`; idempotensi tanpa duplikasi insert/log).
  - **Phase 4B.5 runSync + overlap guard + error isolation: COMPLETE** (orchestration terurut: `syncNewOrders -> syncPaymentValidations -> syncDraftUploads -> syncCertificates`; module-level guard `isSyncRunning` mencegah concurrent run; guard selalu dilepas via `finally`; per-function error isolation).
- **Phase 4B verification: 62/62 assertions PASS** (Phase 4B.1: 7, Phase 4B.2: 10, Phase 4B.3: 18, Phase 4B.4: 15, Phase 4B.5: 12).
- **Final read-only audit: READY**
  - CRITICAL: 0
  - HIGH: 0
  - MEDIUM: 1 — backend/package-lock.json stale terhadap package.json; jangan diperbaiki tanpa approval/network access.
  - LOW: 0

## 11. Tugas Berikutnya — Phase 4C (NOT STARTED)
Scope yang disepakati:
- Write-Back Service dari API/MySQL ke Google Sheets sesuai ownership dan requirement final lab (Customer actions / API mutations ditulis kembali ke sheet terkait seperti bukti pembayaran, faktur/NPWP, keputusan draft customer).

## 12. Isu Ditunda (deferred)
- `backend/package-lock.json` stale → perlu `npm install` saat user approve (network).
- Legacy invoice fallback di `trackingController.js` (~118–126) → putuskan di Phase 4E/6.
- Formula `"CASH"` remnant di PAYMENT kolom W (kwitansi) — biarkan (Minimal Change), backend tidak membaca W.
- Formatting dua-statement `draftRoutes.js:8`.
- `validated_by='ADMIN'` hardcoded (belum ada auth layer).
- Header numerik PENERIMAAN L/M (508/458) — quirk terdokumentasi, hindari bergantung padanya.

## 13. Path Penting
- Docs: `docs/00..07_*.md`, `docs/references/Spreadsheet_Reference_Final.xlsx`
- Backend: `backend/server.js` (cron :47), `backend/src/config/{db,sheets}.js`, `backend/src/constants/index.js`, `backend/src/utils/businessDays.js`, `backend/src/services/{sheetsSyncService,cronSyncService,statusService,notificationService,driveService}.js`, controllers & routes di `backend/src/…`
- Backup DB: `database/backups/lab_tracking_before_build_2026-08-22.sql` (pre-migration, WITH data)
- Smoke test Phase 4A: `C:\Users\Hp\AppData\Local\Temp\opencode\phase4a-smoke.js`

## 14. Riwayat Insiden (pengaruhi aturan safety)
2026-08-22: negative-test POST `/api/admin/orders/LAB-2026-9001/payment/validate` ternyata berhasil menulis DB live (row payment legacy punya bukti) → status berubah ANALISIS, notifikasi email NYATA terkirim, tracking_log & notifications bertambah. Rollback dilakukan & terverifikasi penuh terhadap backup `lab_tracking_before_build_2026-08-22.sql`. Email yang sudah terkirim tidak dapat ditarik. Akibatnya: write-test terhadap DB live DILARANG tanpa approval eksplisit; semua verifikasi memakai stub/dry-run.
