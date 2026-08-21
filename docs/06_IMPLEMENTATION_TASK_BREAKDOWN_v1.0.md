# IMPLEMENTATION TASK BREAKDOWN v1.0
## Sistem Tracking Sampel Laboratorium KTNT UNPAD

*Sumber: FINAL REQUIREMENT BASELINE v1.0, SYSTEM DESIGN SPECIFICATION v1.0, DATA MODEL & SPREADSHEET MAPPING SPECIFICATION v1.0, API CONTRACT SPECIFICATION v1.0, FRONTEND STATE & FLOW SPECIFICATION v1.0, AUTOMATION SPECIFICATION v1.0. Dokumen ini murni breakdown pekerjaan — tanpa kode, tanpa SQL, tanpa Prompt OpenCode.*

---

## BAGIAN 1 — Implementation Strategy

Pendekatan implementasi mengikuti prinsip **Minimal Change** yang sudah dipilih di Data Model Specification, diterapkan konsisten ke seluruh layer:

- **Spreadsheet existing (ORDER, PENERIMAAN, PAYMENT) dipertahankan sepenuhnya** — hanya ditambah kolom sesuai mapping final, tidak ada struktur/formula existing yang dihapus atau diubah tanpa alasan yang sudah didokumentasikan.
- **Sheet DRAFT dan SURVEY dibuat baru** sesuai struktur konseptual yang sudah final di Data Model Specification — tidak ada sheet tambahan lain yang dikarang.
- **Status Tracking tidak pernah diedit manual** di layer manapun (Sheets, Database, Admin API) — satu-satunya cara status berubah adalah lewat business event yang tervalidasi oleh Automation Layer, sesuai AR-001 s/d AR-014.
- **Backend menjadi pengaman business rule** — seluruh validasi kritis (syarat AND Pengesahan, larangan CASH, gate Survey, dsb.) ditegakkan di Backend, bukan diasumsikan aman karena Frontend sudah menyembunyikan opsi terlarang.
- **Frontend murni menampilkan dan mengirim aksi yang diizinkan** — tidak ada logika bisnis yang hanya hidup di Frontend tanpa penegakan ulang di Backend.
- **Automation Layer sebagai penerjemah event → status**, mengikuti pola sinkronisasi yang sudah terbukti bekerja pada sistem sebelumnya (baca berkala dari Sheets, tulis balik terbatas ke Sheets untuk data yang berasal dari aksi Customer).

Tidak ada keputusan arsitektur baru yang diambil di bagian ini — seluruhnya merangkum ulang keputusan yang sudah dikunci di lima dokumen sebelumnya, sebagai dasar penyusunan breakdown pekerjaan.

---

## BAGIAN 2 — Project Work Breakdown

### Phase 0 — Preparation

| ID | Phase | Task | Tujuan | Dependency | Priority | Output |
|---|---|---|---|---|---|---|
| P0-01 | 0 | Audit project existing (backend & frontend) | Memahami kondisi kode berjalan sebelum diubah | — | Wajib | Laporan kondisi existing |
| P0-02 | 0 | Audit spreadsheet Lab terbaru | Konfirmasi struktur ORDER/PENERIMAAN/PAYMENT/DB/PAR belum berubah sejak analisis terakhir | — | Wajib | Konfirmasi struktur terkini |
| P0-03 | 0 | Audit environment (Node version, dependency, .env) | Memastikan environment pengembangan siap dipakai | P0-01 | Wajib | Daftar environment siap/tidak |
| P0-04 | 0 | Audit database existing (skema tersirat dari query) | Memetakan tabel yang sudah ada sebagai basis penyesuaian | P0-01 | Wajib | Daftar tabel & kolom existing |
| P0-05 | 0 | Audit API existing (endpoint yang sudah berjalan) | Menentukan endpoint mana yang dipertahankan vs diubah | P0-01 | Wajib | Daftar endpoint existing |
| P0-06 | 0 | Audit frontend existing (halaman & komponen) | Menentukan bagian mana yang dipertahankan vs diubah | P0-01 | Wajib | Daftar halaman/komponen existing |
| P0-07 | 0 | Backup project & spreadsheet sebelum perubahan apa pun | Mitigasi risiko sebelum modifikasi struktur | P0-01 s/d P0-06 | Wajib | Salinan backup |

### Phase 1 — Data & Spreadsheet

| ID | Phase | Task | Tujuan | Dependency | Priority | Output |
|---|---|---|---|---|---|---|
| P1-01 | 1 | Tambah kolom baru di ORDER sesuai Data Model Bagian 14 | Menyediakan KATEGORI_CUSTOMER, LINK_SERTIFIKAT, TANGGAL_TERBIT_SERTIFIKAT | P0-02, P0-07 | Wajib | ORDER terupdate |
| P1-02 | 1 | Tambah kolom baru di PAYMENT | Menyediakan LINK_INVOICE, NO_INVOICE, TANGGAL_INVOICE, LINK_BUKTI_BAYAR, STATUS_VALIDASI, JENIS_FAKTUR, NPWP, LINK_KWITANSI | P0-02, P0-07 | Wajib | PAYMENT terupdate |
| P1-03 | 1 | Buat sheet DRAFT baru | Menyediakan struktur data draft/revisi/keputusan | P0-07 | Wajib | Sheet DRAFT siap |
| P1-04 | 1 | Buat sheet SURVEY baru | Menyediakan struktur data hasil survey | P0-07 | Wajib | Sheet SURVEY siap |
| P1-05 | 1 | Verifikasi PENERIMAAN tidak memerlukan kolom baru | Konfirmasi DATE OF ANALYSIS existing sudah cukup | P0-02 | Wajib | Konfirmasi tertulis |
| P1-06 | 1 | Dokumentasikan header final tiap kolom baru | Menghindari ambiguitas penamaan saat sinkronisasi dibangun | P1-01 s/d P1-04 | Wajib | Dokumen header final |

### Phase 2 — Backend

| ID | Phase | Task | Tujuan | Dependency | Priority | Output |
|---|---|---|---|---|---|---|
| P2-01 | 2 | Sesuaikan koneksi database dengan tabel/kolom baru | Menyediakan akses data untuk domain baru | P1-01 s/d P1-04 | Wajib | Koneksi data siap |
| P2-02 | 2 | Bangun/perbarui service pembacaan Sheets → Database | Menyalurkan data spreadsheet terbaru ke Database | P1-01 s/d P1-06 | Wajib | Service sinkronisasi baca |
| P2-03 | 2 | Bangun service tulis balik Database/API → Sheets | Menulis Keputusan Customer, Faktur/NPWP, Bukti Bayar, Survey ke Sheets | P2-01, P2-02 | Wajib | Service tulis balik |
| P2-04 | 2 | Implementasikan endpoint sesuai API Contract Bagian 3–12 | Menyediakan seluruh kontrak API yang sudah didefinisikan | P2-01 | Wajib | Endpoint tersedia |
| P2-05 | 2 | Implementasikan validasi & error handling sesuai API Contract Bagian 15 | Menegakkan business rule di level Backend | P2-04 | Wajib | Validasi aktif |

### Phase 3 — Automation

| ID | Phase | Task | Tujuan | Dependency | Priority | Output |
|---|---|---|---|---|---|---|
| P3-01 | 3 | Implementasikan AR-001 s/d AR-014 (lihat Bagian 6) | Menerjemahkan business event menjadi status transition | P2-02, P2-03 | Wajib | Automation Layer aktif |
| P3-02 | 3 | Implementasikan idempotency rule (Automation Spec Bagian 15) | Mencegah status/notifikasi ganda | P3-01 | Wajib | Duplicate protection aktif |
| P3-03 | 3 | Implementasikan failure/recovery behavior (Automation Spec Bagian 16) | Menangani kondisi data tidak lengkap/link kosong | P3-01 | Wajib | Recovery behavior aktif |

### Phase 4 — Frontend

| ID | Phase | Task | Tujuan | Dependency | Priority | Output |
|---|---|---|---|---|---|---|
| P4-01 | 4 | Sesuaikan/bangun halaman sesuai Frontend Spec Bagian 1 (Information Architecture) | Menyediakan struktur halaman final | P2-04 | Wajib | Struktur halaman siap |
| P4-02 | 4 | Implementasikan state per status (Bagian 3, 15, 16 Frontend Spec) | Menampilkan konten kontekstual sesuai status aktif | P4-01 | Wajib | State management aktif |
| P4-03 | 4 | Implementasikan Payment UI (Bagian 7 Frontend Spec) | Faktur/NPWP/rekening/upload bukti bayar | P4-02 | Wajib | Payment UI selesai |
| P4-04 | 4 | Implementasikan Draft Review UI (Bagian 8, 9) | Setuju/Minta Revisi, feedback, versi terbaru | P4-02 | Wajib | Draft UI selesai |
| P4-05 | 4 | Implementasikan Certificate & Survey UI (Bagian 11, 12, 13) | Gate survey, download sertifikat | P4-02 | Wajib | Certificate/Survey UI selesai |
| P4-06 | 4 | Implementasikan Timeline & Estimation UI (Bagian 4, 6) | Menampilkan progres dan estimasi | P4-02 | Wajib | Timeline/Estimation UI selesai |

### Phase 5 — Notification

| ID | Phase | Task | Tujuan | Dependency | Priority | Output |
|---|---|---|---|---|---|---|
| P5-01 | 5 | Sesuaikan template Email untuk seluruh event di Notification Matrix | Menyediakan konten notifikasi sesuai Bagian 12 Automation Spec | P3-01 | Wajib | Template Email siap |
| P5-02 | 5 | Sesuaikan template WhatsApp untuk seluruh event | Sama seperti di atas, kanal WA | P3-01 | Wajib | Template WA siap |
| P5-03 | 5 | Implementasikan in-app feedback (Bagian 14 Frontend Spec) | Feedback langsung di halaman untuk aksi tertentu | P4-02 | Wajib | In-app feedback aktif |

### Phase 6 — Testing

*(Lihat Bagian 13 untuk breakdown detail.)*

| ID | Phase | Task | Tujuan | Dependency | Priority | Output |
|---|---|---|---|---|---|---|
| P6-01 | 6 | Jalankan seluruh kategori testing (Bagian 13) | Verifikasi seluruh business rule berjalan sesuai spesifikasi | Phase 1–5 selesai | Wajib | Laporan hasil testing |

### Phase 7 — Deployment

| ID | Phase | Task | Tujuan | Dependency | Priority | Output |
|---|---|---|---|---|---|---|
| P7-01 | 7 | Deploy backend & database ke hosting | Sistem dapat diakses publik | P6-01 | Wajib | Backend live |
| P7-02 | 7 | Deploy frontend ke hosting | Sistem dapat diakses customer | P7-01 | Wajib | Frontend live |
| P7-03 | 7 | Verifikasi koneksi Sheets/Drive/Notification di environment produksi | Memastikan integrasi eksternal berjalan di produksi | P7-01, P7-02 | Wajib | Integrasi terverifikasi |

### Phase 8 — Documentation

| ID | Phase | Task | Tujuan | Dependency | Priority | Output |
|---|---|---|---|---|---|---|
| P8-01 | 8 | Susun panduan penggunaan Admin (Sheets & Admin API) | Membantu Admin bekerja dengan struktur baru | P7-03 | Wajib | User guide Admin |
| P8-02 | 8 | Susun dokumentasi teknis sistem final | Referensi pemeliharaan ke depan | P7-03 | Wajib | Dokumentasi teknis |

---

## BAGIAN 3 — Spreadsheet Implementation Tasks

### ORDER
- **Existing field yang dipertahankan:** CODE OF SAMPLE, CODE (I/L/P dst.), NO, RECEIVED ON, WORK, ORDER NO. (kolom H — formula existing tidak diubah), NAME, ADDRESS, CONTACT, dan seluruh kolom administratif sampling lainnya.
- **Field baru:** KATEGORI_CUSTOMER, LINK_SERTIFIKAT, TANGGAL_TERBIT_SERTIFIKAT.
- **Data yang diisi Admin:** Seluruh field existing + KATEGORI_CUSTOMER + LINK_SERTIFIKAT + TANGGAL_TERBIT_SERTIFIKAT.
- **Data yang dibaca sistem:** ORDER NO., RECEIVED ON, WORK, KATEGORI_CUSTOMER, LINK_SERTIFIKAT, TANGGAL_TERBIT_SERTIFIKAT (untuk trigger AR-001, AR-010).

### PENERIMAAN
- **Existing field:** ORDER NO., KODE, RECEIVED ON, DATE OF ANALYSIS, WORK, ANALYSIS FINISH — seluruhnya dipertahankan tanpa perubahan struktur.
- **Field yang digunakan untuk automation:** DATE OF ANALYSIS (sinyal pendukung status Analisis, bukan trigger utama).
- **Field yang tidak boleh diubah:** Formula ANALYSIS FINISH existing (lookup tetap) — **tidak dihapus**, meski Backend akan mengolah estimasi dengan logika berbeda (Bagian 10); formula lama tetap ada di spreadsheet untuk kebutuhan internal Lab yang mungkin masih memakainya secara terpisah.

### PAYMENT
- **Existing field:** Nama, CODE, ORDER NO., TOTAL, DISKON, PERCEPATAN, REFORMULA, PAJAK, JUMLAH, SISA, NO (cicilan), NOMINAL, TANGGAL, CARA, NO. KWITANSI, TANGGAL TEXT, KETERANGAN — dipertahankan seluruhnya termasuk dukungan nilai CASH pada CARA (untuk transaksi non-web).
- **Field baru:** LINK_INVOICE, NO_INVOICE, TANGGAL_INVOICE, LINK_BUKTI_BAYAR, STATUS_VALIDASI, JENIS_FAKTUR, NPWP, LINK_KWITANSI.
- **Data customer:** JENIS_FAKTUR, NPWP, LINK_BUKTI_BAYAR (ditulis balik dari aksi Customer di web).
- **Data admin:** LINK_INVOICE, NO_INVOICE, TANGGAL_INVOICE, STATUS_VALIDASI, LINK_KWITANSI.
- **Data sistem:** Tidak ada field yang murni ditulis sistem di PAYMENT — seluruh kolom baru berasal dari input Admin atau Customer, hanya *disalurkan* oleh sistem.

### DRAFT (sheet baru)
- **Struktur sheet baru:** Order No., Versi Draft, Link Draft, Tanggal Upload, Keputusan Customer, Tanggal Keputusan, Tindak Lanjut Admin, Tanggal Tindak Lanjut.
- **Versi Draft:** diisi Admin, bertambah tiap draft baru/revisi.
- **Link Draft:** diisi Admin.
- **Keputusan Customer:** ditulis Sistem dari aksi Customer di web (nilai SETUJU/REVISI).
- **Tanggal Keputusan:** ditulis Sistem, otomatis saat Keputusan Customer tercatat.
- **Tindak Lanjut Admin:** diisi Admin (MENUNGGU TINDAKAN/LANJUT KE PENGESAHAN) — business action, bukan status tracking.
- **Tanggal Tindak Lanjut:** ditulis Sistem, otomatis saat Admin memilih action.

### SURVEY (sheet baru)
- **Struktur sheet baru:** Order No., konteks read-only (Nama, Jenis Sampel), Tanggal Submit, 14 jawaban skala, Kritik & Saran.
- **Relasi dengan Order:** via Order No., diisi otomatis oleh Sistem dari konteks tracking yang sedang dibuka Customer (bukan input manual).
- **Data identitas read-only:** Nama Customer, Jenis Sampel — ditarik Sistem dari ORDER, ditulis ke SURVEY saat submit sebagai bagian arsip.
- **14 pertanyaan skala:** diisi Customer, disimpan sebagai teks resmi (bukan angka bintang).
- **Kritik & Saran:** diisi Customer, teks bebas.
- **Status survey:** direpresentasikan oleh keberadaan baris (satu row per Order, sesuai Data Model Bagian 6) — tidak ada kolom status terpisah yang diperlukan.

Tidak ada SQL atau kode Google Sheets dibuat di bagian ini, murni daftar task implementasi.

---

## BAGIAN 4 — Database Implementation Tasks

- **Existing table yang dipertahankan:** `customers`, `orders`, `tracking_log`, `payments`, `drafts`, `certificates`, `questionnaires`, `notifications`.
- **Table/field yang perlu ditambahkan atau disesuaikan:**
  - `orders` — tambah kolom untuk KATEGORI_CUSTOMER, LINK_SERTIFIKAT, TANGGAL_TERBIT_SERTIFIKAT.
  - `payments` — tambah kolom untuk LINK_INVOICE, NO_INVOICE, TANGGAL_INVOICE, LINK_BUKTI_BAYAR (bila belum ada), STATUS_VALIDASI (bila belum eksplisit), JENIS_FAKTUR, NPWP, LINK_KWITANSI.
  - `drafts` — tinjau apakah struktur existing (versi_draft, link_draft, status_draft) sudah mencakup Keputusan Customer, Tanggal Keputusan, Tindak Lanjut Admin, Tanggal Tindak Lanjut sesuai Data Model Bagian 5; tambahkan kolom bila belum ada.
  - `questionnaires` — tinjau apakah struktur existing sesuai 14 pertanyaan formulir resmi (baseline mencatat struktur lama memakai 6 pertanyaan dummy `q1_kecepatan_proses` dst.) — **perlu penyesuaian struktur kolom** agar sesuai 14 pertanyaan resmi.
- **Data relationship:** Seluruh domain baru tetap terhubung ke `orders` melalui `order_id`, konsisten dengan pola relasi existing (Data Model Specification Bagian 17).
- **Tracking/status:** Tidak perlu tabel baru — `orders.current_status` dan `tracking_log` existing sudah cukup, mekanismenya yang berubah (hanya diisi oleh Automation Layer, bukan input manual).
- **Draft:** disesuaikan sesuai poin di atas.
- **Survey:** disesuaikan sesuai poin `questionnaires` di atas.
- **Payment:** disesuaikan sesuai poin di atas.
- **Notification:** `notifications` existing sudah cukup untuk mencatat log — tidak perlu tabel baru (konsisten dengan Data Model Specification Bagian 8, Notification Log murni internal Database).
- **Certificate:** `certificates` existing ditinjau apakah cukup atau perlu tambahan kolom (LINK_SERTIFIKAT dan TANGGAL_TERBIT sudah punya padanan `link_sertifikat`/`tanggal_terbit` di skema existing — kemungkinan besar cukup disesuaikan, bukan dibuat ulang).

Tidak ada SQL dibuat — seluruh poin di atas murni daftar task penyesuaian struktur data, mengacu istilah yang konsisten dengan Data Model Specification.

---

## BAGIAN 5 — Backend Implementation Tasks

### Order/Tracking
- Endpoint: `GET /tracking/{order_no}`, `GET /tracking/{order_no}/status`.
- Business rule: mengembalikan data gabungan status+timeline+estimasi+ringkasan dokumen.
- Validation: Order No. harus ditemukan.
- Status effect: tidak ada (read-only).
- Error scenario: Order tidak ditemukan (404-setara), format Order No. tidak valid.
- Dependency: P2-01, P2-02.

### Payment
- Endpoint: `GET /tracking/{order_no}/payment`, `POST /tracking/{order_no}/payment/faktur`, `POST /tracking/{order_no}/payment/upload-proof`.
- Business rule: rekening ditentukan otomatis dari KATEGORI_CUSTOMER; CASH tidak pernah dikembalikan sebagai opsi.
- Validation: NPWP wajib bila Faktur Pajak; file bukti bayar sesuai format/ukuran yang berlaku.
- Status effect: tidak ada perubahan status langsung dari endpoint ini.
- Error scenario: Invoice belum tersedia, NPWP kosong.
- Dependency: P1-02, P2-01.

### Invoice
- Endpoint: `POST /admin/orders/{order_no}/payment/invoice` (bagian dari Admin API).
- Business rule: mengisi LINK_INVOICE memicu AR-002.
- Validation: link harus valid.
- Status effect: Sampel Diterima → Pembayaran (mengikuti ASSUMPTION Bagian 17).
- Error scenario: link kosong/tidak valid.
- Dependency: P1-02, P3-01.

### Draft
- Endpoint: `POST /admin/orders/{order_no}/draft`, `GET /admin/orders/{order_no}/draft`, `GET /tracking/{order_no}/draft/latest`.
- Business rule: versi 1 memicu AR-005; versi>1 memicu AR-008, mensyaratkan versi sebelumnya berkeputusan REVISI.
- Validation: link draft valid; versi berurutan.
- Status effect: Analisis → Review Draft (v1); status tetap untuk revisi.
- Error scenario: draft belum tersedia, versi tidak berurutan.
- Dependency: P1-03, P2-01.

### Draft Approval
- Endpoint: `POST /tracking/{order_no}/draft/decision`.
- Business rule: Keputusan Customer melekat pada versi draft terbaru (AR-006, AR-007).
- Validation: belum ada keputusan pada versi yang sama.
- Status effect: tidak ada (status tetap Review Draft).
- Error scenario: keputusan sudah pernah tercatat untuk versi ini.
- Dependency: P1-03, P2-01.

### Pengesahan
- Endpoint: `POST /admin/orders/{order_no}/draft/proceed-to-pengesahan`.
- Business rule: **AR-009** — wajib validasi Keputusan Customer = SETUJU sebelum menerapkan transisi.
- Validation: Keputusan Customer pada versi draft terbaru harus SETUJU.
- Status effect: Review Draft → Pengesahan **hanya bila valid**; ditolak bila tidak.
- Error scenario: Customer belum SETUJU — sistem menolak dan tidak mengubah status.
- Dependency: P1-03, P2-01, P3-01.

### Certificate
- Endpoint: `POST /admin/orders/{order_no}/certificate`, `GET /tracking/{order_no}/certificate`.
- Business rule: upload pertama memicu AR-010; upload ulang (revisi) memicu AR-014, murni overwrite tanpa syarat tambahan.
- Validation: link valid; download hanya diberikan bila survey_completed = true.
- Status effect: Pengesahan → Download Sertifikat (upload pertama); status tetap untuk revisi.
- Error scenario: sertifikat belum tersedia, survey belum selesai (memblokir link download, bukan error keras).
- Dependency: P1-01, P2-01.

### Survey
- Endpoint: `GET /tracking/{order_no}/survey`, `POST /tracking/{order_no}/survey`, `GET /tracking/{order_no}/survey/completion`.
- Business rule: AR-011 — satu entri per Order, membuka gate download.
- Validation: seluruh 14 jawaban terisi (status wajib per pertanyaan: **OPEN**, lihat Bagian 17); belum pernah submit sebelumnya.
- Status effect: tidak ada — murni gate.
- Error scenario: sudah pernah submit, jawaban belum lengkap.
- Dependency: P1-04, P2-01.

### Notification
- Tidak ada endpoint publik (murni internal, dipicu oleh domain lain sesuai API Contract Bagian 11).
- Business rule: dipicu sebagai efek samping AR-001, AR-003, AR-005, AR-008, AR-009 (bila valid), AR-010.
- Dependency: P3-01, P5-01, P5-02.

### Estimation
- Bagian dari respons `GET /tracking/{order_no}` atau `GET /tracking/{order_no}/estimation`.
- Business rule: hitung hari kerja dinamis (skip Sabtu/Minggu) dari WORK + RECEIVED ON.
- Validation: WORK dan RECEIVED ON harus tersedia.
- Status effect: tidak ada — murni data turunan.
- Error scenario: WORK/RECEIVED ON kosong (data tidak lengkap, lihat Bagian 12).
- Dependency: P2-01.

### Timeline
- Endpoint: `GET /tracking/{order_no}/timeline`.
- Business rule: mengembalikan riwayat status + timestamp dari log yang ditulis Automation Layer.
- Validation: Order harus ditemukan.
- Status effect: tidak ada — read-only.
- Error scenario: Order tidak ditemukan.
- Dependency: P2-01, P3-01.

Tidak ada kode ditulis di bagian ini.

---

## BAGIAN 6 — Automation Implementation Tasks

| Rule | Trigger | Validation | Action | Status Effect | Notification | Implementation Task |
|---|---|---|---|---|---|---|
| AR-001 | Order baru tersimpan | ORDER NO. + RECEIVED ON terisi | Buat tracking record | → Sampel Diterima | Email+WA | Bangun detector perubahan ORDER, hubungkan ke status writer |
| AR-002 | LINK_INVOICE terisi | Link valid | Update status | → Pembayaran | Tidak ada | Bangun detector perubahan PAYMENT (kolom invoice) |
| AR-003 | STATUS_VALIDASI = VALID | Bukti ada; belum pernah VALID | Update status, notifikasi | → Analisis | Email+WA | Bangun endpoint validasi + pengecekan duplikasi |
| AR-004 | STATUS_VALIDASI = INVALID | Bukti ada | Catat status | Tetap Pembayaran | Tidak ada | Bangun endpoint validasi (nilai INVALID) |
| AR-005 | Draft v1 diupload | Link valid | Update status, notifikasi | → Review Draft | Email+WA | Bangun detector baris DRAFT baru versi=1 |
| AR-006 | Customer submit SETUJU | Belum ada keputusan versi ini | Catat keputusan | Tetap Review Draft | In-app feedback | Bangun endpoint decision + validasi versi terbaru |
| AR-007 | Customer submit REVISI | Belum ada keputusan versi ini | Catat keputusan | Tetap Review Draft | Tidak ada | Sama seperti AR-006, nilai berbeda |
| AR-008 | Draft revisi diupload | Versi sebelumnya REVISI | Update draft aktif, notifikasi khusus | Tetap Review Draft | Email+WA (wording revisi) | Bangun detector versi>1 + validasi versi sebelumnya |
| AR-009 | Admin pilih "Lanjut ke Pengesahan" | **Keputusan Customer = SETUJU** | Update status (bersyarat), notifikasi | → Pengesahan (bila valid) | Email+WA (bila valid) | Bangun endpoint business action + validasi wajib syarat SETUJU + penolakan eksplisit |
| AR-010 | LINK_SERTIFIKAT terisi | Link valid | Update status, notifikasi | → Download Sertifikat | Email+WA | Bangun detector kolom sertifikat |
| AR-011 | Customer submit Survey | Belum pernah submit; 14 jawaban terisi | Simpan data, buka gate | Tidak ada (gate) | Tidak ada | Bangun endpoint survey + validasi kelengkapan (status wajib: OPEN) |
| AR-012 | Perhitungan estimasi (tiap request) | Sisa ≤2 hari kerja DAN status=Analisis | Set flag warning | Tidak ada | Tidak ada (tampil pasif) | Bangun kalkulator estimasi + flag warning |
| AR-013 | LINK_KWITANSI terisi | Link valid | Tampilkan di Timeline | Tidak ada | Tidak ada | Bangun detector kolom kwitansi + render Timeline |
| AR-014 | Admin upload ulang sertifikat | Link baru valid | Overwrite link | Tetap Download Sertifikat | Tidak ada | Bangun endpoint upload sertifikat (mode overwrite) |

**Penegasan implementasi (tidak boleh dilanggar):**
- Tidak ada task apa pun di atas yang mengizinkan status di-set langsung dari input manual — setiap "Status Effect" hanya terjadi sebagai hasil validasi rule.
- AR-006 (Draft SETUJU) **tidak** memiliki Status Effect menuju Pengesahan — hanya AR-009 yang punya wewenang itu, dan hanya bila tervalidasi.
- AR-009 wajib mengimplementasikan **jalur penolakan eksplisit** (bukan silent no-op) bila syarat SETUJU belum terpenuhi.
- Survey (AR-011) tidak pernah diberi Status Effect apa pun — murni gate.
- Certificate revision (AR-014) tidak memiliki endpoint pengajuan dari Customer — hanya Admin API.
- AR-004 (Payment INVALID) — task implementasi mengikuti **ASSUMPTION** yang sudah ada (perilaku lanjutan belum final), tidak dibuat keputusan baru di sini.

---

## BAGIAN 7 — Frontend Implementation Tasks

### Public Pages
- **Landing:** implementasikan konten statis identitas Lab, Logo KAN, kontak, CTA ke Tracking.
- **Tracking (pencarian):** implementasikan form input Order No., state loading/error/empty (Frontend Spec Bagian 3).

### Tracking States
- **Sampel Diterima:** tampilkan estimasi, tanpa aksi customer.
- **Pembayaran:** tampilkan Invoice, form Faktur/NPWP, upload bukti bayar (state sesuai Bagian 7 Frontend Spec).
- **Analisis:** tampilkan progres, warning kondisional, kwitansi di Timeline.
- **Review Draft:** tampilkan draft, tombol Setuju/Minta Revisi, state pasca-keputusan (Bagian 8 Frontend Spec).
- **Pengesahan:** tampilkan info pasif, **tanpa CTA apa pun**.
- **Download Sertifikat:** tampilkan gate Survey / tombol Download.

### Payment UI
- Faktur/Non Faktur: implementasikan pilihan dua opsi.
- NPWP: field kondisional wajib saat Faktur Pajak dipilih.
- Rekening otomatis: tampilkan rekening dari respons API, **tidak ada elemen UI untuk memilih rekening/CASH**.
- Invoice: card info + tombol lihat/download.
- Upload bukti pembayaran: form upload dengan state loading/success/error.

### Draft UI
- View Draft: tampilkan draft terbaru saja (default), riwayat versi = OPTIONAL (tidak wajib diimplementasikan MVP).
- Setuju: tombol dengan state disabled setelah tercatat.
- Minta Revisi: tombol dengan state disabled setelah tercatat.
- Feedback setelah Setuju: pesan eksplisit "tercatat, menunggu proses pengesahan admin" — **wajib**, mencegah kesan status langsung berubah.
- Draft versi terbaru: logika pengambilan versi tertinggi otomatis.

### Certificate UI
- Survey gate: implementasikan logika locked/unlocked berbasis flag survey_completed.
- Certificate: tampilkan tanggal terbit, info periode revisi, kontak WA — **tanpa tombol ajukan revisi**.
- Download: tombol aktif hanya setelah gate terbuka.

### Other UI
- Timeline: implementasikan 6 status dengan state completed/current/upcoming (Bagian 4 Frontend Spec).
- Estimation: tampilkan Hari Kerja + Tanggal Selesai + Warning kondisional.
- Warning: wording final sesuai Automation Spec Bagian 11.
- Notification (in-app): implementasikan pesan feedback sesuai Bagian 14 Frontend Spec.

Tidak ada kode React/CSS dibuat di bagian ini — seluruhnya murni daftar task berbasis state dan behavior yang sudah didefinisikan di Frontend State & Flow Specification.

---

## BAGIAN 8 — Admin Workflow Implementation

| Task | Media | Catatan |
|---|---|---|
| Input Order | Sheet ORDER | Existing, tidak berubah caranya |
| Menentukan Kategori Customer | Sheet ORDER (kolom baru) | Task baru — perlu panduan bagi Admin |
| Input Invoice | Sheet PAYMENT (kolom baru) atau Admin API | Task baru |
| Validasi pembayaran | Sheet PAYMENT (kolom baru) atau Admin API | Task baru, menggantikan validasi via API mentah lama |
| Upload Draft | Sheet DRAFT (baru) atau Admin API | Task baru |
| Melihat keputusan Customer | Sheet DRAFT (baru) | Task baru — murni membaca, tidak ada input |
| Upload Draft Revisi | Sheet DRAFT (baru) atau Admin API | Task baru |
| Business action "Lanjut ke Pengesahan" | Sheet DRAFT (kolom Tindak Lanjut Admin) atau Admin API | Task baru — **bukan** perubahan status tracking |
| Upload Sertifikat | Sheet ORDER (kolom baru) atau Admin API | Task baru |
| Upload Kwitansi | Sheet PAYMENT (kolom baru) atau Admin API | Task baru |

**Penegasan wajib:** Tidak ada satu task pun di atas yang melibatkan Admin mengubah dropdown Status Tracking secara langsung — seluruh task Admin murni mengisi data operasional; status selalu dihasilkan Sistem sebagai efek samping.

---

## BAGIAN 9 — Notification Implementation

### Email

| Event | Recipient | Content/Context | Dependency | Failure Behavior |
|---|---|---|---|---|
| Order baru | Customer (email dari data Order) | "Sampel Anda telah diterima" | AR-001 | Dicatat sebagai FAILED, tidak memblokir status |
| Validasi VALID | Customer | "Pembayaran Terverifikasi - Analisis Dimulai" | AR-003 | Sama |
| Draft v1 tersedia | Customer | "Draft Hasil Siap Ditinjau" | AR-005 | Sama |
| Draft revisi tersedia | Customer | "Draft hasil revisi telah tersedia" (wording khusus) | AR-008 | Sama |
| Pengesahan dimulai | Customer | Notifikasi status Pengesahan | AR-009 (bila valid) | Sama |
| Sertifikat tersedia | Customer | "Sertifikat Anda Siap Diunduh" | AR-010 | Sama |

### WhatsApp

| Event | Recipient | Content/Context | Dependency | Failure Behavior |
|---|---|---|---|---|
| Sama seperti Email (6 event di atas) | Customer (No HP dari data Order) | Sama seperti Email, format pesan WA | Sama seperti Email | Dicatat sebagai FAILED, notifikasi Email tetap berjalan independen |

### In-App Feedback

| Event | Recipient | Content/Context | Dependency | Failure Behavior |
|---|---|---|---|---|
| Setuju draft tercatat | Customer (di halaman) | "Persetujuan Anda telah tercatat dan sedang menunggu proses pengesahan." | AR-006 | Ditampilkan langsung sebagai hasil respons API, tidak ada mekanisme "gagal terkirim" terpisah |
| Bukti pembayaran diupload | Customer | "Pembayaran sedang diperiksa" | Upload berhasil | Sama |
| Survey terkirim | Customer | "Survei berhasil dikirim." | AR-011 | Sama |
| Warning estimasi | Customer | Wording Bagian 11 Automation Spec | AR-012 | Sama, murni tampilan pasif |

Tidak ada notifikasi baru dikarang — seluruhnya mengacu persis pada Notification Matrix Automation Specification Bagian 12.

---

## BAGIAN 10 — Estimation Implementation

Task konseptual (tanpa formula/kode):
1. Membaca nilai WORK dari data Order.
2. Menggunakan RECEIVED ON sebagai titik awal perhitungan.
3. Menghitung maju sejumlah WORK hari, dengan aturan: hari yang jatuh pada Sabtu atau Minggu tidak dihitung sebagai salah satu dari WORK hari tersebut (dilewati).
4. Menghasilkan Estimasi Tanggal Selesai sebagai output akhir perhitungan.
5. Menghasilkan Sisa Hari Kerja sebagai selisih antara tanggal saat ini dan Estimasi Tanggal Selesai, dihitung dengan aturan skip Sabtu/Minggu yang sama.
6. Menampilkan warning bila Sisa Hari Kerja ≤2 **dan** status saat ini = Analisis (AR-012).

Task ini menggantikan logika lookup tetap yang ada di formula `ANALYSIS FINISH` existing (Bagian 3 — formula lama tidak dihapus dari spreadsheet, tapi tidak lagi dipakai sebagai sumber estimasi yang ditampilkan ke Customer).

---

## BAGIAN 11 — Security & Validation Tasks

| Task | Tujuan |
|---|---|
| Scoping seluruh endpoint Customer berdasarkan Order No. pada path | Customer hanya dapat mengakses order yang sedang mereka buka |
| Tidak menyediakan endpoint pengubah status langsung (`PATCH/PUT status`) | Customer/Admin tidak dapat mengubah status secara manual |
| Validasi Keputusan Customer hanya berlaku terhadap versi draft terbaru | Customer hanya dapat memberi keputusan pada Draft yang aktif |
| Cek keberadaan keputusan sebelum menerima keputusan baru pada versi yang sama | Customer tidak dapat submit keputusan dua kali pada versi yang sama (AR-006/007) |
| Cek keberadaan entri Survey sebelum menerima submission baru | Survey tidak dapat disubmit dua kali (AR-011) |
| Validasi wajib Keputusan Customer = SETUJU sebelum menerapkan "Lanjut ke Pengesahan" | Admin tidak dapat memaksa Pengesahan sebelum SETUJU (AR-009) |
| Validasi format link (Invoice, Draft, Sertifikat, Kwitansi, Bukti Bayar) sebelum dianggap "tersedia" | Mencegah trigger status keliru dari data rusak/kosong |
| Validasi format input (NPWP, file upload) | Mencegah data tidak valid tersimpan |
| Deteksi perubahan data (bukan pembacaan berulang) sebagai syarat memproses event | Mencegah duplicate event (Automation Spec Bagian 15) |

Tidak ada implementasi kode dibuat — murni daftar task validasi yang harus ditegakkan Backend.

---

## BAGIAN 12 — Error & Recovery Tasks

| Kondisi | Kategori | Task |
|---|---|---|
| Spreadsheet belum sinkron | Wait/Retry | Pastikan sinkronisasi berkala tetap berjalan, tampilkan data hasil sinkronisasi terakhir tanpa error |
| Data tidak lengkap (field wajib kosong) | Must Reject (baris dilewati) | Bangun validasi baris saat sinkronisasi, lewati baris tidak valid tanpa menghentikan proses lain |
| Link kosong | Must Reject | Jangan anggap event valid sampai link benar-benar terisi |
| Link invalid (format salah) | Must Reject | Validasi format sebelum memproses sebagai trigger |
| Payment INVALID | Warning (mengikuti ASSUMPTION) | Tampilkan info penolakan; perilaku lanjutan menunggu konfirmasi Lab, jangan diimplementasikan sebagai keputusan final |
| Notification gagal terkirim | Non-blocking failure | Catat sebagai FAILED, jangan gagalkan transisi status |
| Draft belum tersedia | Wait | Tampilkan state "belum tersedia", bukan error |
| Certificate belum tersedia | Wait | Sama seperti di atas |
| Customer mengirim action tidak valid (mis. keputusan dua kali) | Must Reject | Tolak dengan pesan jelas, sesuai Bagian 11 |
| Duplicate event | Non-blocking (dilewati diam-diam di level pemrosesan, tapi tidak menyebabkan error ke pengguna) | Terapkan idempotency check (Automation Spec Bagian 15) |

---

## BAGIAN 13 — Testing Task Breakdown

### Functional Test
- Verifikasi seluruh endpoint API mengembalikan data sesuai kontrak.
- Verifikasi seluruh halaman Frontend menampilkan state yang benar sesuai status.

### Business Rule Test
- Verifikasi status hanya berubah lewat business event (tidak ada jalur lain).
- Verifikasi AR-009 menolak transisi bila Customer belum SETUJU.
- Verifikasi CASH tidak pernah muncul sebagai opsi.
- Verifikasi NPWP wajib saat Faktur Pajak.

### API Test
- Uji setiap endpoint dengan input valid dan tidak valid.
- Uji response error sesuai Error & Validation Contract.

### Spreadsheet Integration Test
- Uji sinkronisasi baca dari ORDER/PAYMENT/DRAFT ke Database.
- Uji tulis balik dari aksi Customer ke Sheets (Keputusan, Faktur/NPWP, Survey).
- Uji baris data tidak lengkap dilewati tanpa menghentikan sinkronisasi lain.

### Automation Test
- Uji seluruh AR-001 s/d AR-014 satu per satu dengan skenario positif dan negatif.
- Uji idempotency: event yang sama dikirim dua kali tidak menghasilkan efek ganda.

### Frontend Flow Test
- Uji Customer Journey end-to-end (Bagian 2 Frontend Spec) dari Landing hingga Download Sertifikat.
- Uji CTA Matrix — tombol aktif/nonaktif sesuai kondisi.

### Notification Test
- Uji setiap event pada Notification Matrix mengirim Email/WA sesuai wording.
- Uji kegagalan pengiriman tidak menggagalkan transisi status.

### Security Test
- Uji Customer tidak dapat mengakses order lain lewat manipulasi Order No.
- Uji tidak ada endpoint yang mengizinkan perubahan status manual.

### Edge Case Test
- Uji seluruh edge case yang sudah dipetakan di System Design Specification Bagian 16 (invoice belum tersedia, admin coba lanjut pengesahan sebelum setuju, file tidak valid, dsb.).

### Regression Test
- Uji fitur existing yang dipertahankan (tracking dasar, upload bukti bayar, dsb.) tidak rusak setelah perubahan.

Expected result untuk seluruh test mengacu pada spesifikasi di lima dokumen sebelumnya — tidak ada skenario baru yang dikarang di luar yang sudah didokumentasikan.

---

## BAGIAN 14 — Implementation Order

```
1. Audit existing project & spreadsheet (Phase 0)
   Alasan: wajib memahami kondisi nyata sebelum mengubah apa pun,
   mencegah asumsi keliru terhadap struktur yang sudah berjalan.

2. Backup project & spreadsheet (Phase 0)
   Alasan: mitigasi risiko sebelum modifikasi struktur data yang sudah dipakai Lab.

3. Spreadsheet preparation — tambah kolom & sheet baru (Phase 1)
   Alasan: seluruh layer di atasnya (Database, Backend, Automation) bergantung
   pada struktur data final tersedia lebih dulu.

4. Database adjustment (Phase 2 awal)
   Alasan: Backend membutuhkan struktur data matang sebelum endpoint dibangun.

5. Backend foundation — koneksi data, service baca Sheets (Phase 2)
   Alasan: Automation dan API bergantung pada data yang sudah tersalur ke Database.

6. Automation Layer — AR-001 s/d AR-014 (Phase 3)
   Alasan: API perlu automation sudah berjalan agar endpoint yang memicu status
   (validasi, draft, dsb.) dapat diuji end-to-end, bukan hanya CRUD kosong.

7. API — implementasi endpoint & validasi (Phase 2 lanjutan, paralel dgn 6)
   Alasan: sebagian endpoint (read-only) dapat dibangun paralel dengan Automation,
   tapi endpoint yang memicu status harus menunggu Automation Layer siap.

8. Frontend (Phase 4)
   Alasan: bergantung penuh pada API yang sudah berfungsi — membangun Frontend
   sebelum API siap berisiko UI tidak mencerminkan behavior nyata.

9. Notification (Phase 5)
   Alasan: terintegrasi dengan Automation Layer (Phase 6/3) — realistis dibangun
   setelah automation trigger sudah ada tempat memanggilnya.

10. Testing menyeluruh (Phase 6)
    Alasan: baru bermakna setelah seluruh layer (Spreadsheet–Database–Backend–
    Automation–Frontend–Notification) terhubung.

11. Deployment (Phase 7)
    Alasan: hanya dilakukan setelah testing memberi keyakinan sistem berjalan sesuai spesifikasi.

12. Documentation (Phase 8)
    Alasan: paling akurat disusun setelah sistem final berjalan di produksi,
    bukan sebelum ada perubahan di tengah jalan.
```

Urutan ini konsisten dengan dependency alami yang sudah tersirat di seluruh dokumen sebelumnya (Sheets → Database → Backend → Automation → API → Frontend → Notification → Testing) — tidak ada penyesuaian besar diperlukan dari urutan referensi yang diberikan, karena dependency yang terpetakan memang secara alami mengikuti urutan tersebut.

---

## BAGIAN 15 — MVP vs Post-MVP

### MVP / WAJIB
Seluruh task di Bagian 2 Phase 0–8 **kecuali** yang eksplisit ditandai OPTIONAL di dokumen-dokumen sebelumnya:
- Seluruh perubahan spreadsheet (Bagian 3).
- Seluruh penyesuaian database (Bagian 4).
- Seluruh endpoint API Bagian 5.
- AR-001 s/d AR-014 penuh (Bagian 6).
- Seluruh Frontend state wajib (Bagian 7) **kecuali** riwayat versi Draft.
- Seluruh Admin workflow (Bagian 8).
- Seluruh Notification pada matrix final (Bagian 9), **kecuali** in-app feedback untuk "Minta Revisi" yang berstatus DESIGN DECISION.
- Estimation Implementation penuh (Bagian 10), **kecuali** wording kondisi terlambat.
- Seluruh Security & Validation (Bagian 11).
- Seluruh Error & Recovery wajib (Bagian 12), **kecuali** perilaku final Payment INVALID (tetap ASSUMPTION sampai dikonfirmasi).

### POST-MVP
Hanya fitur yang sudah eksplisit ditandai OPTIONAL di dokumen sebelumnya:
- Riwayat versi Draft yang dapat dilihat Customer di Frontend.
- Indikator "terakhir diperbarui pada [waktu]" di halaman tracking.
- Wording khusus untuk kondisi estimasi sudah terlambat.
- Histori versi Sertifikat (bila kelak dibutuhkan Lab).
- In-app feedback untuk aksi "Minta Revisi" (masih DESIGN DECISION, dapat masuk MVP bila diputuskan sebelum implementasi, tapi tidak wajib).

Tidak ada fitur baru yang ditambahkan ke daftar ini di luar yang sudah tercatat di dokumen-dokumen sebelumnya.

---

## BAGIAN 16 — Implementation Dependency Map

```
Spreadsheet (Phase 1)
   ↓ (struktur kolom/sheet harus final sebelum dibaca)
Database (Phase 2 awal)
   ↓ (skema harus sesuai sebelum service baca dibangun)
Backend — foundation & service sinkronisasi (Phase 2)
   ↓ (data harus mengalir sebelum automation dapat mendeteksi event)
Automation (Phase 3)
   ↓ (business event harus dapat diproses sebelum endpoint yang memicu status bermakna diuji)
API — endpoint lengkap (Phase 2 lanjutan)
   ↓ (kontrak harus stabil sebelum Frontend dapat dibangun dengan andal)
Frontend (Phase 4)
   ↓ (halaman harus dapat memicu event sebelum notifikasi dapat diuji end-to-end)
Notification (Phase 5)
   ↓ (seluruh layer harus terhubung sebelum testing menyeluruh bermakna)
Testing (Phase 6)
   ↓
Deployment (Phase 7)
```

**Task mana yang harus selesai sebelum task lain dimulai:**
- Struktur Spreadsheet (Bagian 3) **harus** final sebelum Database Task (Bagian 4) dapat disesuaikan secara akurat.
- Database Task **harus** selesai sebelum Backend Task domain apa pun (Bagian 5) dapat dibangun secara utuh (meski endpoint read-only sederhana bisa dimulai paralel selama skema dasar sudah ada).
- Automation Rules (Bagian 6) **harus** berfungsi sebelum endpoint yang memicu status (validasi pembayaran, Lanjut ke Pengesahan, dsb.) dapat dianggap selesai — endpoint tanpa Automation Layer hanya CRUD kosong tanpa efek bisnis.
- Frontend (Bagian 7) **bergantung penuh** pada API yang sudah stabil — perubahan kontrak API di tengah pembangunan Frontend akan menyebabkan pengerjaan ulang.
- Notification (Bagian 9) **bergantung** pada Automation Layer sudah punya titik pemicu (event) yang jelas.
- Testing menyeluruh (Bagian 13) baru bermakna penuh setelah **seluruh** layer di atas saling terhubung — testing parsial per-layer dapat dilakukan lebih awal secara paralel, tapi Regression/Frontend Flow Test memerlukan seluruh rantai selesai.

---

## BAGIAN 17 — Blocker & Assumption

| Item | Status | Dampak | Apakah Blocker? | Tindakan |
|---|---|---|---|---|
| Trigger Sampel Diterima → Pembayaran (Invoice tersedia) | ASSUMPTION | Menentukan validasi AR-002 | Tidak | Implementasikan sesuai assumption; siap disesuaikan bila Lab memberi konfirmasi berbeda |
| Perilaku lanjutan Payment INVALID | ASSUMPTION | Menentukan UX & validasi setelah bukti ditolak | Tidak | Implementasikan perilaku minimal (tampilkan penolakan), tunda fitur upload-ulang otomatis sampai dikonfirmasi |
| Status wajib/opsional per pertanyaan Survey | OPEN | Menentukan validasi AR-011 | Tidak | Implementasikan seluruh 14 pertanyaan sebagai wajib sebagai default aman, dapat disesuaikan kemudian tanpa mengubah struktur data |
| Sumber kolom Jenis Sampel & No. Handphone untuk Survey | OPEN (Pending Mapping) | Menentukan field yang ditarik otomatis ke konteks Survey | Tidak | Petakan saat implementasi P1-04/P2-02, gunakan kolom terdekat yang sudah teridentifikasi sebagai kandidat |
| Relasi CODE (I/L/P) terhadap ORDER NO. sebagai kode tracking | OPEN | Berpotensi menyentuh tampilan Jenis Analisis tersirat di kode tracking | Tidak | Tidak menghalangi implementasi awal — ORDER NO. tetap dipakai apa adanya sesuai FINAL, isu ini dicatat untuk didiskusikan ulang dengan Lab secara terpisah |
| Materi konten Landing Page (foto, deskripsi resmi, Logo KAN) | OPEN | Konten statis Landing Page | Tidak (untuk backend/automation), Ya (untuk penyelesaian Landing Page final) | Bangun struktur halaman dengan placeholder, isi materi begitu tersedia dari Lab |
| Nama teknis final kolom spreadsheet | DESIGN DECISION | Konsistensi penamaan | Tidak | Tentukan saat P1-06 (dokumentasi header final), sebelum sinkronisasi dibangun |
| Notifikasi in-app "Minta Revisi" | DESIGN DECISION | UX konsistensi | Tidak | Dapat diputuskan sebelum P4-04, tidak menghalangi task lain |

Tidak ada satu pun item di atas berstatus BLOCKER — seluruh item ASSUMPTION/OPEN/DESIGN DECISION sudah memiliki jalur implementasi yang aman tanpa perlu menunggu keputusan final terlebih dahulu.

---

## BAGIAN 18 — Implementation Readiness

```
[x] Requirement tersedia
[x] System Design tersedia
[x] Data Model tersedia
[x] Spreadsheet Mapping tersedia
[x] API Contract tersedia
[x] Frontend Specification tersedia
[x] Automation Specification tersedia
[x] Implementation tasks tersedia
[x] Tidak ada blocker
[x] Semua assumption ditandai
[x] Semua open question ditandai
```

# READY FOR CODING?

**YES**

Seluruh breakdown pekerjaan (18 bagian) sudah tersusun konsisten dengan keenam dokumen sebelumnya, mencakup spreadsheet, database, backend, automation, frontend, admin workflow, notification, estimation, security, error handling, testing, urutan implementasi, MVP/Post-MVP, dependency map, hingga daftar blocker/assumption — tanpa satu pun item berstatus BLOCKER, dan tanpa mengubah ASSUMPTION menjadi FINAL secara diam-diam.

Tahap berikutnya:
1. Audit existing code/project (Phase 0 — dimulai secara nyata, bukan lagi dokumen)
2. Final implementation plan (penyesuaian detail teknis berdasarkan hasil audit nyata)
3. Baru membuat prompt OpenCode secara bertahap, mengikuti urutan Phase 1 → Phase 8 di Bagian 14

*(Prompt OpenCode dan kode tidak dibuat pada dokumen ini, sesuai batasan tahap Implementation Task Breakdown.)*
