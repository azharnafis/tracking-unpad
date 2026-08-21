# FINAL IMPLEMENTATION PLAN v1.0
## Sistem Tracking Sampel Laboratorium KTNT UNPAD

*Sumber: seluruh 7 dokumen specification + PHASE 0 — AUDIT EXISTING PROJECT. Label dipakai konsisten: `[FINAL REQUIREMENT]`, `[DOCUMENTATION-BASED]`, `[VERIFY AT IMPLEMENTATION]`, `[RECOMMENDATION]`, `[ASSUMPTION]`. Tidak ada kode, SQL, migration, atau Prompt OpenCode di dokumen ini.*

---

## BAGIAN 1 — Implementation Strategy

Prinsip **MODIFY EXISTING > REBUILD** `[FINAL REQUIREMENT — Bagian 1 Implementation Task Breakdown]` tetap dipegang, dengan penyesuaian berdasarkan temuan audit nyata:

**Tetap MODIFY (bukan rebuild):**
- Status writer (`updateOrderStatus`), middleware, koneksi database, mekanisme notifikasi, tabel `notifications`/`certificates`, kolom `status_validasi`, gate Survey, pola idempotency draft, struktur hash-routing Frontend `[DOCUMENTATION-BASED — Audit Bagian 12]`.

**Harus di-REBUILD (bukan sekadar modify), berdasarkan audit:**
1. **Lapisan integrasi Google Sheets** — backend existing menargetkan sheet lama (`Data_Order`, `Status_Tracking`, `Pembayaran`, `Draft`, `Sertifikat`) yang berbeda total dari struktur baru (`ORDER`, `PENERIMAAN`, `PAYMENT`, `DRAFT` baru, `SURVEY` baru). Ini bukan "tambah kolom", melainkan re-pointing integrasi penuh `[DOCUMENTATION-BASED — Audit Bagian 7, Risiko High #1]`.
2. **Mekanisme status manual (`syncManualStatusChanges`)** — harus **dihapus sepenuhnya**, bukan dimodifikasi, karena keberadaannya sendiri bertentangan dengan prinsip final `[FINAL REQUIREMENT — Baseline Bagian 4]`.
3. **Struktur data Survey** (`questionnaires` + form Frontend) — 6 pertanyaan dummy vs 14 pertanyaan resmi adalah perbedaan struktural, bukan penggantian teks `[DOCUMENTATION-BASED — Audit Bagian 4]`.

Prinsip pengambilan keputusan bila terjadi konflik: **Final Specification selalu menang** atas behavior existing `[FINAL REQUIREMENT — instruksi tahap ini]`. Existing tidak dipertahankan hanya karena sudah berjalan.

---

## BAGIAN 2 — Implementation Phases

```
Phase 1 — Spreadsheet & Data Preparation
Phase 2 — Database
Phase 3 — Backend Core
Phase 4 — Spreadsheet Integration
Phase 5 — Automation
Phase 6 — Frontend
Phase 7 — Notification
Phase 8 — Testing
Phase 9 — Integration / End-to-End Testing
Phase 10 — Deployment / Final Verification
```

Urutan referensi ini **dipertahankan apa adanya** — konsisten dengan dependency alami yang sudah terverifikasi dua kali (Automation Specification Bagian 2, Implementation Task Breakdown Bagian 14/16), dan audit tidak menemukan alasan untuk mengubahnya. Satu penyesuaian kecil: **Phase 3 (Backend Core)** perlu eksplisit mencakup **penghapusan jalur status manual** sebagai bagian dari "core", bukan ditunda ke Phase 5 — karena membiarkan jalur lama tetap hidup selama Phase 4/5 dibangun berisiko dua mekanisme berjalan berdampingan secara tidak sengaja `[RECOMMENDATION, berdasar Audit Risiko High #2]`.

---

## BAGIAN 3 — Spreadsheet Implementation Plan

### ORDER

| Kolom | Status | Fungsi | Diisi Oleh | Manual/Otomatis |
|---|---|---|---|---|
| CODE OF SAMPLE, CODE, NO, RECEIVED ON, WORK, ORDER NO. (H), NAME, ADDRESS, CONTACT, dst. | Existing, dipertahankan | Data induk order `[FINAL REQUIREMENT — Data Model Bagian 14]` | Admin | Manual |
*(Tidak ada kolom Kategori Customer di ORDER — dikoreksi. Rekening ditangani langsung di PAYMENT melalui REKENING_PEMBAYARAN, lihat Bagian 3 PAYMENT.)*
| LINK_SERTIFIKAT | **Baru** | Trigger AR-010, tampilan sertifikat | Admin | Manual (isi), Otomatis (efek status) |
| TANGGAL_TERBIT_SERTIFIKAT | **Baru** | Basis hitung batas revisi 14 hari kerja | Admin | Manual |

`[VERIFY AT IMPLEMENTATION]`: nama teknis final kolom (working title, boleh disesuaikan gaya penamaan Admin — Data Model Bagian 18 DESIGN DECISION).

### PENERIMAAN

| Kolom | Status | Fungsi |
|---|---|---|
| ORDER NO., KODE, RECEIVED ON, DATE OF ANALYSIS, WORK, ANALYSIS FINISH | Existing, dipertahankan seluruhnya | View turunan ORDER + sinyal pendukung status Analisis (DATE OF ANALYSIS) `[FINAL REQUIREMENT]` |
| — | Tidak ada kolom baru | Data Model Specification Bagian 14 mengonfirmasi tidak perlu tambahan |

Formula `ANALYSIS FINISH` (lookup tetap) **tidak dihapus** dari sheet — tetap ada untuk kebutuhan internal Lab, tapi **tidak lagi dipakai sebagai sumber estimasi** yang ditampilkan ke customer `[FINAL REQUIREMENT — Automation Spec Bagian 10]`.

### PAYMENT

| Kolom | Status | Fungsi | Diisi Oleh |
|---|---|---|---|
| Nama, CODE, ORDER NO., TOTAL, DISKON, PERCEPATAN, REFORMULA, PAJAK, JUMLAH, SISA, NO, NOMINAL, TANGGAL, CARA, NO. KWITANSI, TANGGAL TEXT, KETERANGAN | Existing, dipertahankan (termasuk dukungan CASH pada CARA untuk transaksi non-web) | Ledger finansial | Admin |
| LINK_INVOICE, NO_INVOICE, TANGGAL_INVOICE | **Baru** | Trigger AR-002, tampilan Invoice | Admin |
| STATUS_VALIDASI | **Baru** (eksplisit, bukan proxy SISA=0) | Trigger AR-003/AR-004 | Admin |
| JENIS_FAKTUR | **Baru** | Faktur Pajak/Non Faktur | Customer (via web, tulis-balik) |
| NPWP | **Baru** | Wajib bila Faktur Pajak | Customer (via web, tulis-balik) |
| LINK_BUKTI_BAYAR | **Baru** | Bukti pembayaran | Customer (via web, tulis-balik) |
| LINK_KWITANSI | **Baru** | Trigger AR-013, tampil di Timeline | Admin |

**Rekening pembayaran** `[FINAL REQUIREMENT, dikoreksi]`: **disimpan sebagai kolom baru `REKENING_PEMBAYARAN` di PAYMENT** — diisi Admin secara langsung (BNI=55414267 atau Mandiri=63726257), bukan hasil turunan dari kategori customer. Tidak ada field Kategori Customer di manapun. Tabel referensi rekening di sheet `DB` (`CODE OF PAYMENT`/`REKENING`) **dipertahankan apa adanya**, tetap dipakai untuk pencatatan `CARA` transaksi aktual oleh Admin — dua mekanisme ini sengaja terpisah.

### DRAFT (sheet baru)

| Field | Diisi Oleh | Catatan |
|---|---|---|
| Order No. | Admin | Key penghubung |
| Versi Draft | Admin | Bertambah tiap draft/revisi |
| Link Draft | Admin | |
| Tanggal Upload | Admin | |
| **Keputusan Customer** (SETUJU/REVISI) | **Sistem** (tulis dari aksi web) | Melekat pada versi yang sama — **wajib**, mencegah ambiguitas siklus revisi `[FINAL REQUIREMENT — Draft & Revisi Baseline]` |
| **Tanggal Keputusan** | Sistem | Otomatis |
| **Tindak Lanjut Admin** (MENUNGGU TINDAKAN/LANJUT KE PENGESAHAN) | Admin | **Business action, bukan status tracking** `[FINAL REQUIREMENT — revisi flow Draft→Pengesahan]` |
| **Tanggal Tindak Lanjut** | Sistem | Otomatis |

### SURVEY (sheet baru)

| Field | Diisi Oleh | Catatan |
|---|---|---|
| Order No. | Sistem | Otomatis dari konteks tracking, **tidak diinput manual customer** `[FINAL REQUIREMENT]` |
| Konteks read-only (Nama, Jenis Sampel) | Sistem | Ditarik dari ORDER |
| Tanggal Submit | Sistem | Otomatis |
| 14 jawaban skala (Bagian I–IV) | Customer | **Nilai tersimpan = teks resmi**, bintang murni visual `[FINAL REQUIREMENT — Survey Requirement]` |
| Kritik & Saran | Customer | Isian bebas |

`[VERIFY AT IMPLEMENTATION]`: sumber kolom presisi Jenis Sampel & No. Handphone (Pending Mapping, bukan blocker).

Sheet lain (DB, PARAMETER, PAR, FORM, FORM KWITANSI, LABEL, CALC, KWITANSI) **dipertahankan tanpa modifikasi apa pun** — masih dipakai workflow internal Lab `[FINAL REQUIREMENT — Data Model Bagian 1]`.

---

## BAGIAN 4 — Database Implementation Plan

| Table | Action | Existing Reuse | Modification | New Field | Risk |
|---|---|---|---|---|---|
| `customers` | Modify | ✓ | — | Tidak ada | Low |
| `orders` | Modify | ✓ | `current_status` enum 7→6 nilai | LINK_SERTIFIKAT, TANGGAL_TERBIT_SERTIFIKAT | Medium — perubahan enum status berdampak ke seluruh query yang membandingkan status |
| `payments` | Modify | ✓ (`status_validasi` sudah cocok) | — | LINK_INVOICE, NO_INVOICE, TANGGAL_INVOICE, LINK_BUKTI_BAYAR, JENIS_FAKTUR, NPWP, LINK_KWITANSI, REKENING_PEMBAYARAN | Low |
| `drafts` | Modify | ✓ | Pisahkan konsep `status_draft` existing menjadi `keputusan_customer` + `tindak_lanjut_admin` terpisah | keputusan_customer, tanggal_keputusan, tindak_lanjut_admin, tanggal_tindak_lanjut | Medium — perlu memastikan tidak ada ambiguitas antara field lama `status_draft` dan field baru |
| `certificates` | Reuse | ✓ | Tidak ada (struktur sudah cocok 1:1 tanpa histori) | Tidak ada | Low |
| `questionnaires` | **Restrukturisasi** | Sebagian (relasi `order_id`, `submitted_at`, `saran` tetap relevan) | Ganti struktur 6 kolom dummy → representasi 14 jawaban | 14 kolom jawaban baru (nama final `[VERIFY AT IMPLEMENTATION]`) | **High** — lihat strategi migrasi di bawah |
| `tracking_log` | Reuse | ✓ | Nilai `source` tetap dipakai, tapi nilai `ADMIN_MANUAL` untuk transisi status **tidak lagi muncul** setelah jalur manual dihapus | Tidak ada | Low |
| `notifications` | Reuse | ✓ | Tidak ada — sudah sesuai konsep Notification Log | Tidak ada | Low |

**Strategi migrasi `questionnaires` (6→14 pertanyaan), konseptual:**
1. Struktur baru dirancang untuk menampung 14 jawaban + saran, bukan menyisipkan ke struktur lama `[FINAL REQUIREMENT — Survey final]`.
2. Data lama (bila ada entri tersimpan dengan 6 pertanyaan dummy) **tidak dipetakan otomatis** ke 14 pertanyaan baru — tidak ada korespondensi makna 1:1 antara pertanyaan dummy dan pertanyaan resmi Lab, sehingga pemetaan otomatis akan menghasilkan data palsu/menyesatkan. `[RECOMMENDATION]`: data lama diarsipkan terpisah (bukan dihapus) untuk keperluan referensi historis, tapi tidak dipakai sebagai bagian dataset survey baru.
3. Tidak ada SQL/migration script dibuat pada tahap ini, sesuai batasan.

---

## BAGIAN 5 — Backend Implementation Plan

| File/Module | Existing | Action | Perubahan | Dependency |
|---|---|---|---|---|
| `server.js` | Ya | Modify | Mount route domain baru (Certificate, Admin terpisah bila diperlukan), pastikan cron **tidak lagi memanggil** `syncManualStatusChanges` | Phase 2 selesai |
| `config/sheets.js` | Ya | Modify | `[VERIFY AT IMPLEMENTATION]` — pastikan `GOOGLE_SHEETS_ID` menunjuk file spreadsheet baru | Phase 1 selesai |
| `controllers/trackingController.js` | Ya | Modify | Tambah field respons (Faktur, Kwitansi, Rekening Pembayaran, estimasi hari kerja dinamis) | — |
| `controllers/paymentController.js` | Ya | Modify | Tambah endpoint/logic Faktur, NPWP, Invoice, Kwitansi; validasi tetap 3-kondisi (reuse) | — |
| `controllers/draftController.js` | Ya | Modify | Pisahkan logic Keputusan Customer dari Tindak Lanjut Admin; tambah endpoint `proceed-to-pengesahan` dengan validasi wajib | — |
| `controllers/questionnaireController.js` | Ya | Modify signifikan | Sesuaikan validasi & struktur data ke 14 pertanyaan | Phase 2 (skema baru) |
| `services/statusService.js` | Ya | Modify (lihat detail Status Service di bawah) | — | — |
| `services/sheetsSyncService.js` | Ya (target lama) | **Rebuild target** | Re-point ke ORDER/PENERIMAAN/PAYMENT/DRAFT/SURVEY | Phase 1 selesai |
| `services/cronSyncService.js` | Ya | **Modify signifikan** — hapus `syncManualStatusChanges`, sesuaikan 5 fungsi lain ke target baru, tambah 2 fungsi baru (sync Survey bila diperlukan tulis-balik) | — | Phase 4 |
| `services/notificationService.js` | Ya | Modify | Update nama status, tambah template Draft Revisi | — |
| `services/driveService.js` | Ya | Reuse | Tidak ada perubahan wajib — pola upload sudah sesuai | — |
| `middleware/*` | Ya | Reuse | Tidak ada perubahan wajib | — |

### Status Service — Penegasan Wajib
`[FINAL REQUIREMENT, tidak dapat dinegosiasikan]`:
- Tidak ada endpoint yang menerima nilai status secara langsung dari input manapun.
- Tidak ada lagi pemanggilan `updateOrderStatus` dari jalur yang membaca teks bebas admin (`syncManualStatusChanges` dihapus total).
- Status hanya berubah sebagai efek AR-001 s/d AR-014 yang tervalidasi.

### Payment
`[FINAL REQUIREMENT]`: Faktur Pajak/Non Faktur + NPWP kondisional di halaman Pembayaran; Invoice diisi Admin memicu status; validasi 3-kondisi (reuse `status_validasi` existing); rekening dipilih Admin langsung via REKENING_PEMBAYARAN (bukan hardcoded — **wajib dihapus** hardcode BNI di Frontend lama, lihat Bagian 7).

### Draft
`[FINAL REQUIREMENT]`: versioning tetap (reuse pola `(order_id, versi_draft)`); Keputusan Customer (SETUJU/REVISI) melekat per-versi; field Tindak Lanjut Admin terpisah dari status draft; validasi wajib — endpoint "Lanjut ke Pengesahan" **menolak** bila Keputusan Customer versi terbaru ≠ SETUJU (AR-009).

### Certificate
`[FINAL REQUIREMENT]`: upload/update link memicu AR-010 (pertama) atau AR-014 (revisi, overwrite tanpa syarat); **tidak ada** endpoint/route pengajuan revisi dari Customer; revisi murni via WhatsApp di luar sistem.

### Survey
`[FINAL REQUIREMENT]`: 14 pertanyaan resmi, order-linked otomatis (tanpa input Order No. manual), identitas read-only dari Order, teks resmi sebagai nilai sumber kebenaran (bintang murni tampilan Frontend).

---

## BAGIAN 6 — Spreadsheet Automation Plan

| Event | Source | Detection | Action | Status | Notification |
|---|---|---|---|---|---|
| Order baru | ORDER | ORDER NO.+RECEIVED ON terisi | Buat tracking record | → Sampel Diterima | Email+WA |
| Invoice tersedia | PAYMENT | LINK_INVOICE terisi | Update status | → Pembayaran | Tidak ada `[ASSUMPTION — trigger ini, dibawa dari Automation Spec]` |
| Validasi pembayaran VALID | PAYMENT | STATUS_VALIDASI=VALID | Update status | → Analisis | Email+WA |
| Draft baru (v1) | DRAFT | Baris baru versi=1 | Update status | → Review Draft | Email+WA |
| Draft revisi | DRAFT | Baris baru versi>1, versi sebelumnya=REVISI | Update draft aktif | Tetap Review Draft | Email+WA (wording khusus) |
| Customer SETUJU | DRAFT (tulis dari web) | Keputusan Customer=SETUJU | Catat keputusan | Tetap Review Draft | In-app feedback |
| Customer REVISI | DRAFT (tulis dari web) | Keputusan Customer=REVISI | Catat keputusan | Tetap Review Draft | Tidak ada |
| Admin Lanjut ke Pengesahan | DRAFT | TINDAK_LANJUT_ADMIN=LANJUT | **Validasi wajib** Keputusan=SETUJU | → Pengesahan (bila valid) | Email+WA (bila valid) |
| Sertifikat tersedia | ORDER | LINK_SERTIFIKAT terisi | Update status | → Download Sertifikat | Email+WA |
| Survey selesai | SURVEY | Entri baru tersimpan | Buka gate download | Tidak ada (gate) | Tidak ada |

**Penghapusan `syncManualStatusChanges`:** `[FINAL REQUIREMENT, eksplisit]` — fungsi ini dan sheet `Status_Tracking` yang menjadi sumbernya **tidak lagi dipakai sama sekali** dalam arsitektur baru. Tidak ada penggantian "versi otomatis" dari fungsi ini — seluruh transisi yang sebelumnya bergantung padanya (Sampel Diterima→Pembayaran, →Download Sertifikat) digantikan sepenuhnya oleh trigger data (Invoice tersedia, Sertifikat tersedia) di tabel event di atas. Sheet `Status_Tracking` **boleh dipertahankan sebagai sheet kosong/tidak dipakai** di file spreadsheet (tidak perlu dihapus fisik), tapi kode backend **tidak boleh lagi membacanya untuk tujuan apa pun**.

---

## BAGIAN 7 — Frontend Implementation Plan

| Halaman/Bagian | Perubahan |
|---|---|
| HomePage | Update identitas (Logo KAN, foto, deskripsi, kontak) `[FINAL REQUIREMENT — Landing Page]`; materi konten `[VERIFY AT IMPLEMENTATION — menunggu Lab]` |
| TrackingPage | Update judul, contoh format pencarian sesuai ORDER NO. final |
| StatusPage — Timeline | **7→6 langkah**, hapus tampilan terpisah Proses Analisis/Input Data Hasil |
| StatusPage — Payment (`PaymentReview`) | Tambah Faktur/NPWP; **hapus hardcode rekening BNI**, ganti tampilan dinamis dari API `[CONFLICT existing yang wajib diperbaiki — Audit Bagian 11.D]` |
| StatusPage — Draft (`DraftPreview`) | Tambah feedback eksplisit pasca-SETUJU ("tercatat, menunggu admin"); tombol nonaktif setelah keputusan tercatat |
| Pengesahan | Section baru — info pasif, **tanpa CTA** apa pun `[FINAL REQUIREMENT]` |
| Certificate (`ReadyDownload`) | Tambah info batas revisi 14 hari kerja + kontak WA; **tidak ada** tombol ajukan revisi |
| SurveyPage | Ganti 6 pertanyaan dummy → 14 pertanyaan resmi; ganti murni bintang → kombinasi bintang+teks; tambah header read-only (Order No., Customer, Jenis Sampel), hapus form isian identitas |
| Timeline | Sesuai 6 status, Survey **bukan** entri timeline (murni gate di dalam Download Sertifikat) `[FINAL REQUIREMENT]` |
| Notification (in-app) | Tambah feedback SETUJU, upload sukses, survey terkirim |
| Estimation | Tampilan Estimasi Hari Kerja + Tanggal Selesai (logika baru dari Backend, tampilan Frontend relatif reuse) |

---

## BAGIAN 8 — Notification Implementation Plan

| Event | Channel | Recipient | Template | Failure Handling |
|---|---|---|---|---|
| Order baru | Email+WA | Customer | "Sampel Anda telah diterima" (reuse pola existing) | Non-blocking, catat FAILED (reuse) |
| Validasi VALID | Email+WA | Customer | Update nama status ke "Analisis" | Reuse |
| Draft v1 | Email+WA | Customer | "Draft Hasil Siap Ditinjau" (reuse) | Reuse |
| **Draft Revisi** | Email+WA | Customer | **Baru** — "Draft hasil revisi telah tersedia" (wording khusus, beda dari draft awal) `[FINAL REQUIREMENT — gap existing yang wajib ditambahkan]` | Reuse |
| Pengesahan (setelah validasi ganda) | Email+WA | Customer | Baru sesuai status gabungan | Reuse |
| Sertifikat tersedia | Email+WA | Customer | "Sertifikat Anda Siap Diunduh" (reuse) | Reuse |
| SETUJU tercatat | In-app | Customer | "Persetujuan Anda telah tercatat dan sedang menunggu proses pengesahan." | — |
| Bukti bayar diupload | In-app | Customer | "Pembayaran sedang diperiksa" (reuse) | — |
| Survey terkirim | In-app | Customer | "Survei berhasil dikirim." (reuse) | — |

Mekanisme dispatch (Nodemailer, Fonnte) dan pencatatan `SENT/FAILED` non-blocking **di-reuse penuh** — tidak ada perubahan pada level infrastruktur pengiriman `[DOCUMENTATION-BASED — Audit Bagian 9]`.

---

## BAGIAN 9 — Security & Access

`[FINAL REQUIREMENT]`: Tidak ada sistem autentikasi baru — Order No. tetap satu-satunya kredensial akses, konsisten dengan seluruh dokumen sebelumnya (tidak ada requirement final yang meminta login/sesi).

| Aspek | Kondisi |
|---|---|
| Risiko existing | Tidak ada autentikasi di endpoint Admin (validasi pembayaran, upload draft) — `[DOCUMENTATION-BASED]`, `[VERIFY AT IMPLEMENTATION]` apakah masih demikian |
| Proteksi endpoint | Scoping berdasarkan Order No. pada path — reuse pola existing |
| Validasi tracking code | Regex existing (`validateTrackingCode`) — reuse, sesuaikan bila format ORDER NO. final berbeda (Bagian 5, masih Open) |
| Rate limiting | Reuse (`rateLimiter` existing) |
| Upload validation | Reuse (multer 5MB, JPG/PNG/PDF) |
| Admin action validation | **Baru** — validasi wajib Keputusan Customer=SETUJU sebelum "Lanjut ke Pengesahan" diterapkan |

**`[SECURITY RECOMMENDATION]`** (bukan requirement final, murni saran): pertimbangkan lapisan proteksi tambahan untuk endpoint Admin (mis. token sederhana) di masa depan — ini **bukan** bagian dari scope implementasi saat ini karena tidak ada requirement final yang memintanya.

**`[FUTURE ENHANCEMENT]`**: autentikasi penuh berbasis akun untuk Admin — di luar scope.

---

## BAGIAN 10 — Testing Plan

### Kategori
Unit Test, Integration Test, API Test, Spreadsheet Sync Test, Automation Test, Frontend Flow Test, End-to-End Test, Regression Test.

### Skenario Wajib (Business Event)

| # | Skenario | Expected Result |
|---|---|---|
| 1 | Order baru tersimpan di ORDER | Status=Sampel Diterima, Email+WA terkirim |
| 2 | LINK_INVOICE terisi | Status=Pembayaran |
| 3 | Payment VALID | Status=Analisis, Email+WA terkirim |
| 4 | Payment INVALID | Status tetap Pembayaran, tidak ada notifikasi `[ASSUMPTION — perilaku lanjutan belum final]` |
| 5 | Draft v1 diupload | Status=Review Draft, Email+WA terkirim |
| 6 | Customer SETUJU | Keputusan tercatat, status **tetap** Review Draft, in-app feedback muncul |
| 7 | Customer REVISI | Keputusan tercatat, status tetap Review Draft |
| 8 | Draft revisi diupload | Notifikasi khusus terkirim, status tetap Review Draft |
| 9 | **Admin coba "Lanjut ke Pengesahan" sebelum Customer SETUJU** | **Sistem menolak, status TIDAK berubah** — test paling kritis |
| 10 | Admin "Lanjut ke Pengesahan" setelah Customer SETUJU | Status=Pengesahan, Email+WA terkirim |
| 11 | LINK_SERTIFIKAT terisi | Status=Download Sertifikat, Email+WA terkirim |
| 12 | Survey belum diisi | Tombol download nonaktif/locked |
| 13 | Survey selesai | Tombol download aktif |
| 14 | Sertifikat direvisi via WA (Admin upload ulang link) | Link ter-overwrite, status tetap Download Sertifikat, tidak ada notifikasi otomatis baru |

Test tambahan wajib mencakup: idempotency (event sama dikirim dua kali tidak menghasilkan efek ganda), regression pada fitur reuse (tracking dasar, upload bukti bayar, gate survey lama).

Tidak ada test code ditulis, sesuai batasan.

---

## BAGIAN 11 — Migration / Data Transition

| Aspek | Rencana |
|---|---|
| Data dipertahankan | Seluruh data `orders`, `customers`, `payments`, `drafts`, `certificates`, `tracking_log`, `notifications` existing — tidak dihapus |
| Data perlu dipetakan | Nilai `orders.current_status` lama (7 enum) perlu dipetakan ke 6 status baru saat migrasi skema (mis. `PROSES_ANALISIS`/`INPUT_DATA_HASIL` → status gabungan baru) `[VERIFY AT IMPLEMENTATION]` |
| Data deprecated | Data `questionnaires` lama (6 pertanyaan dummy) — diarsipkan, tidak dipetakan otomatis ke struktur 14 pertanyaan (Bagian 4) |
| Migration diperlukan? | Ya, untuk skema `orders`, `payments`, `drafts`, `questionnaires` — detail teknis (script) tidak dibuat di tahap ini |
| Risiko kehilangan data | Rendah untuk data yang murni ditambah kolom (Payment, Order); **Medium** untuk `questionnaires` bila proses restrukturisasi tidak hati-hati memisahkan data lama sebelum mengubah struktur |
| Transisi aman | `[RECOMMENDATION]`: backup penuh database + spreadsheet sebelum Phase 2 dimulai; migrasi skema dilakukan bertahap (tambah kolom baru dulu, verifikasi, baru sesuaikan/nonaktifkan kolom lama) — bukan "ganti sekaligus" |

---

## BAGIAN 12 — Dependency Order

```
Spreadsheet Structure (Phase 1)
   ↓
Database (Phase 2)
   ↓
Backend Core — termasuk penghapusan jalur status manual (Phase 3)
   ↓
Spreadsheet Integration — re-pointing penuh ke sheet baru (Phase 4)
   ↓
Automation — AR-001 s/d AR-014 (Phase 5)
   ↓
Frontend (Phase 6)
   ↓
Notification (Phase 7)
   ↓
Testing (Phase 8)
   ↓
Integration/E2E Testing (Phase 9)
   ↓
Deployment/Final Verification (Phase 10)
```

Tidak ada phase yang dapat dimulai sebelum dependency langsungnya selesai — khususnya **Phase 4 tidak boleh dimulai sebelum Phase 1 (struktur spreadsheet final) dan Phase 3 (backend core, termasuk penghapusan jalur manual) selesai**, karena integrasi baru dan penghapusan mekanisme lama saling terkait erat (Audit Risiko High #2).

---

## BAGIAN 13 — Implementation Checklist

```
## DATA
[ ] Spreadsheet — kolom ORDER/PAYMENT baru, sheet DRAFT/SURVEY baru
[ ] Database — skema orders/payments/drafts/questionnaires disesuaikan
[ ] Mapping — header final didokumentasikan

## BACKEND
[ ] API — seluruh endpoint sesuai API Contract
[ ] Status — jalur manual dihapus, hanya event-driven
[ ] Payment — Faktur/NPWP/Invoice/Kwitansi/rekening dinamis
[ ] Draft — Keputusan Customer + Tindak Lanjut Admin terpisah
[ ] Certificate — upload/overwrite tanpa histori
[ ] Survey — 14 pertanyaan, order-linked otomatis
[ ] Notification — template diperbarui + Draft Revisi baru

## AUTOMATION
[ ] Spreadsheet Sync — target baru (ORDER/PENERIMAAN/PAYMENT/DRAFT/SURVEY)
[ ] Status Trigger — AR-001 s/d AR-014
[ ] Notification — terhubung ke Automation Layer
[ ] Idempotency — deteksi perubahan, bukan pembacaan berulang
[ ] Failure Recovery — non-blocking, baris tidak lengkap dilewati

## FRONTEND
[ ] Landing — identitas & konten baru
[ ] Tracking — timeline 6 status
[ ] Payment — hapus hardcode rekening, tambah Faktur/NPWP
[ ] Draft — feedback pasca-SETUJU, Pengesahan tanpa CTA
[ ] Certificate — info batas revisi, tanpa form pengajuan
[ ] Survey — 14 pertanyaan, header read-only
[ ] Timeline — Survey bukan entri status

## TESTING
[ ] Unit
[ ] Integration
[ ] E2E
[ ] Regression
```

---

## BAGIAN 14 — Risk & Rollback Plan

**1. Spreadsheet mismatch**
- Risiko: integrasi baru gagal membaca data karena struktur ORDER/PAYMENT sesungguhnya (formula, header) berbeda dari asumsi dokumentasi.
- Penyebab: backend belum pernah menargetkan sheet ini `[DOCUMENTATION-BASED]`.
- Dampak: sinkronisasi gagal total, tidak ada data mengalir ke Database.
- Mitigasi: verifikasi struktur sheet aktual langsung sebelum coding integrasi dimulai (bagian dari Phase 1); bangun integrasi bertahap per-sheet, uji satu-satu.
- Rollback: integrasi baru dibangun di jalur terpisah tanpa menghapus jalur lama sampai terverifikasi bekerja; jalur lama baru dinonaktifkan setelah jalur baru terbukti stabil.

**2. Manual status update**
- Risiko: penghapusan `syncManualStatusChanges` meninggalkan celah bila ada transisi yang ternyata masih bergantung padanya tanpa disadari.
- Penyebab: 3 dari 6 transisi lama bergantung pada jalur ini `[DOCUMENTATION-BASED — Audit Bagian 6]`.
- Dampak: status order stuck tanpa cara berpindah bila trigger otomatis pengganti belum benar-benar berfungsi.
- Mitigasi: pastikan AR-002 (Invoice→Pembayaran) dan AR-010 (Sertifikat→Download) benar-benar berfungsi dan teruji **sebelum** jalur manual dihapus, bukan sesudahnya.
- Rollback: nonaktifkan (bukan hapus permanen) fungsi lama di awal, baru dihapus total setelah beberapa siklus produksi berjalan stabil dengan mekanisme baru.

**3. Survey migration**
- Risiko: kehilangan/kesalahpahaman data survey lama, atau validasi 14 pertanyaan baru gagal menerima submission karena struktur belum sepenuhnya cocok.
- Penyebab: perbedaan struktural total antara 6 dummy vs 14 resmi.
- Dampak: gate download sertifikat gagal berfungsi bila validasi salah konfigurasi.
- Mitigasi: uji endpoint Survey secara terpisah dengan data dummy sebelum dihubungkan ke gate download nyata.
- Rollback: struktur lama diarsipkan (bukan dihapus) sehingga dapat dirujuk ulang bila diperlukan; skema baru dibangun sebagai penambahan, bukan overwrite langsung.

**4. Draft transition**
- Risiko: mekanisme Pengesahan baru (Keputusan Customer + Tindak Lanjut Admin terpisah) salah diimplementasikan sehingga tercampur dengan logic lama (teks "Disetujui").
- Penyebab: kemiripan konseptual antara mekanisme lama dan baru berisiko menimbulkan asumsi keliru bahwa "sudah sama".
- Dampak: transisi ke Pengesahan bisa terjadi tanpa validasi yang benar, atau sebaliknya gagal terjadi meski syarat terpenuhi.
- Mitigasi: test skenario #9 (Bagian 10) — Admin coba lanjut sebelum SETUJU — sebagai gerbang wajib lolos sebelum fitur ini dianggap selesai.
- Rollback: field baru (`keputusan_customer`, `tindak_lanjut_admin`) dibangun terpisah dari field lama (`status_draft`) sehingga tidak saling menimpa; field lama dapat tetap ada sebagai referensi selama masa transisi.

**5. Data migration (umum)**
- Risiko: perubahan skema `orders.current_status` (7→6 enum) merusak data historis atau query yang membandingkan status lama.
- Penyebab: perubahan enum bukan operasi aditif murni.
- Dampak: laporan/riwayat lama berpotensi tidak terbaca benar.
- Mitigasi: backup penuh sebelum perubahan skema; petakan nilai lama ke nilai baru secara eksplisit sebelum mengubah constraint/enum.
- Rollback: backup database lengkap tersedia sebelum Phase 2 dimulai — dapat dipulihkan penuh bila migrasi gagal di tengah jalan.

---

## BAGIAN 15 — Final Implementation Order

```
1. Backup project (kode) + database + spreadsheet — sebelum apa pun disentuh
2. Verifikasi langsung struktur spreadsheet aktual (GOOGLE_SHEETS_ID, header ORDER/PAYMENT)
   [VERIFY AT IMPLEMENTATION — tidak bisa dipastikan dari dokumentasi]
3. Finalisasi struktur spreadsheet — tambah kolom ORDER/PAYMENT, buat sheet DRAFT/SURVEY
4. Siapkan perubahan database — skema orders/payments/drafts/questionnaires
5. Implementasi backend domain core — termasuk PENGHAPUSAN jalur status manual
6. Implementasi ulang integrasi spreadsheet — target sheet baru
7. Implementasi automation — AR-001 s/d AR-014
8. Update frontend — timeline, payment, draft, certificate, survey
9. Update notification — template + event Draft Revisi baru
10. Testing menyeluruh (Bagian 10)
11. Verifikasi end-to-end (seluruh business flow dari Sampel Diterima s/d Download Sertifikat)
12. Deployment
```

Urutan ini konsisten dengan Bagian 12 (Dependency Order) — perbedaan dari contoh referensi di instruksi Anda hanya penambahan langkah 2 (verifikasi struktur nyata) sebagai langkah eksplisit terpisah, karena audit menemukan bahwa asumsi dokumentasi **tidak boleh** langsung dipercaya penuh untuk struktur Sheets yang sesungguhnya `[RECOMMENDATION, berdasar Audit Bagian 7]`.

---

## BAGIAN 16 — Implementation Readiness

# READY FOR IMPLEMENTATION?

**YES**

Seluruh rencana (16 bagian) sudah konsisten dengan ketujuh dokumen sebelumnya dan hasil audit nyata, tanpa membuka kembali requirement final, tanpa mempertahankan behavior existing yang bertentangan dengan spec (rekening hardcode, jalur status manual), dan dengan risiko-risiko utama sudah punya mitigasi serta rollback plan eksplisit.

**1. Next implementation phase:** Phase 1 — Spreadsheet & Data Preparation, dimulai dengan verifikasi langsung struktur spreadsheet aktual (Bagian 15 langkah 2).

**2. File/folder yang pertama kali akan disentuh:**
- `backend/.env` (verifikasi `GOOGLE_SHEETS_ID`) — **dibaca, tidak diubah** pada tahap verifikasi awal.
- Spreadsheet `Testing NEW TRIAL 2026 PENERIMAAN CONTOH LAB. KTNT.xlsx` — sheet ORDER dan PAYMENT (penambahan kolom).
- Sheet baru DRAFT dan SURVEY (pembuatan).

**3. Urutan pekerjaan pertama:**
1. Backup penuh (kode + database + spreadsheet).
2. Verifikasi `GOOGLE_SHEETS_ID` dan struktur sheet aktual.
3. Tambah kolom baru di ORDER dan PAYMENT sesuai Bagian 3.
4. Buat sheet DRAFT dan SURVEY baru.

**4. Hal yang harus di-backup sebelum perubahan:**
- Seluruh isi database (`customers`, `orders`, `payments`, `drafts`, `certificates`, `questionnaires`, `tracking_log`, `notifications`).
- File spreadsheet asli (salinan utuh sebelum kolom/sheet ditambahkan).
- Kode backend & frontend existing (snapshot/commit sebelum modifikasi dimulai).

Tahap berikutnya setelah ini: mulai eksekusi Phase 1 secara nyata, kemudian **baru** menyusun Prompt OpenCode bertahap mengikuti urutan di Bagian 15 — **tidak dibuat pada dokumen ini**, sesuai batasan tahap Final Implementation Plan.
