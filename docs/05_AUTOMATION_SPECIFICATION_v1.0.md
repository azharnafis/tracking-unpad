# AUTOMATION SPECIFICATION v1.0
## Sistem Tracking Sampel Laboratorium KTNT UNPAD

*Sumber: FINAL REQUIREMENT BASELINE v1.0, SYSTEM DESIGN SPECIFICATION v1.0, DATA MODEL & SPREADSHEET MAPPING SPECIFICATION v1.0, API CONTRACT SPECIFICATION v1.0, FRONTEND STATE & FLOW SPECIFICATION v1.0, dan file spreadsheet Lab yang sudah dianalisis. Dokumen ini murni business/system-level automation — tanpa kode, tanpa library, tanpa implementasi.*

---

## 1. Tujuan Automation

**Prinsip inti (FINAL, dari baseline):** Admin tidak mengubah Status Tracking secara manual lewat dropdown. Status Tracking berubah semata-mata sebagai **akibat** dari business event yang valid — bukan input langsung siapa pun.

**Alur konseptual:** Spreadsheet (dan aksi web Customer) menjadi sumber aktivitas administratif → Sistem membaca perubahan data yang relevan → Sistem memvalidasi kondisi → Bila kondisi terpenuhi, sistem menjalankan business action → Status diperbarui otomatis → Notifikasi dikirim bila requirement mengharuskan.

**Pembedaan istilah yang dipakai konsisten di seluruh dokumen ini:**

| Istilah | Definisi |
|---|---|
| **Data yang diinput manusia** | Data yang diisi Admin (di Sheets atau Admin API) atau Customer (di website) — mis. LINK_INVOICE, Keputusan Customer, jawaban Survey |
| **Data yang dihasilkan sistem** | Data turunan/computed yang tidak pernah diisi manusia — mis. Estimasi Tanggal Selesai, flag Warning, flag survey_completed |
| **Business event** | Perubahan data bermakna bisnis yang terjadi (mis. "Invoice tersedia", "Customer Setuju") |
| **Automation trigger** | Mekanisme yang mendeteksi business event dan mengevaluasi apakah kondisi transisi terpenuhi |
| **Status transition** | Perubahan nilai Status Tracking sebagai hasil automation trigger yang lolos validasi |
| **Notification** | Pengiriman Email/WhatsApp/in-app feedback sebagai efek samping status transition atau event tertentu (tidak semua event memicu notifikasi) |

---

## 2. Automation Architecture

```
Spreadsheet (Admin) / Website Action (Customer)
        ↓
Detection Event  — sistem mendeteksi data baru/berubah (baris baru di Sheets, atau request API dari Customer)
        ↓
Validation  — sistem memeriksa apakah data yang berubah memenuhi syarat sebagai business event yang sah (format valid, prasyarat terpenuhi)
        ↓
Business Rule  — sistem mengevaluasi apakah kondisi transisi status terpenuhi (termasuk kondisi majemuk seperti AND pada Pengesahan)
        ↓
Status Transition  — bila lolos, status tracking diperbarui (satu-satunya penulis: Sistem)
        ↓
Data Update  — data pendukung ditulis (tanggal event, log status, dan tulis-balik ke Sheets bila relevan)
        ↓
Notification  — dikirim bila event ini termasuk dalam Notification Matrix (Bagian 12)
        ↓
Customer Website  — mencerminkan status & data terbaru saat diakses/di-refresh
```

Tidak ada detail kode/library dibahas, sesuai batasan dokumen.

---

## 3. Master Automation Trigger Matrix

| No | Business Event | Source | Actor | Data yang Berubah | Validation | Status Sebelum | Status Sesudah | Notification | Keterangan |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Order/Sampel baru tersimpan | ORDER (Sheets) | Admin | ORDER NO., RECEIVED ON tercatat di Database | ORDER NO. + RECEIVED ON wajib terisi | (belum ada) | Sampel Diterima | Email + WA | FINAL |
| 2 | Invoice tersedia | PAYMENT (Sheets) | Admin | LINK_INVOICE terisi | Link harus valid (format URL) | Sampel Diterima | Pembayaran | Tidak ada | FINAL untuk data; trigger status ini **ASSUMPTION** (belum dikonfirmasi eksplisit Lab — dibawa serta dari dokumen sebelumnya) |
| 3 | Customer memilih Faktur/Non Faktur | Web (Customer) | Customer | JENIS_FAKTUR tersimpan + ditulis balik ke PAYMENT | — | Pembayaran (tidak berubah) | Pembayaran (tidak berubah) | Tidak ada | FINAL — tidak memicu transisi status |
| 4 | NPWP diisi (Faktur Pajak) | Web (Customer) | Customer | NPWP tersimpan | Wajib terisi bila JENIS_FAKTUR = Faktur Pajak | Pembayaran (tidak berubah) | Pembayaran (tidak berubah) | Tidak ada | FINAL — tidak memicu transisi status |
| 5 | Bukti pembayaran tersedia | Web (Customer) upload | Customer | LINK_BUKTI_BAYAR tersimpan | File format valid (sesuai batas existing) | Pembayaran (tidak berubah) | Pembayaran (tidak berubah) | Tidak ada (in-page feedback saja) | FINAL — tidak memicu transisi status |
| 6 | Admin validasi pembayaran = VALID | PAYMENT (Sheets/Admin API) | Admin | STATUS_VALIDASI = VALID | Bukti pembayaran harus sudah ada; belum pernah VALID sebelumnya (cegah duplikasi) | Pembayaran | Analisis | Email + WA | FINAL |
| 7 | Admin validasi pembayaran = INVALID | PAYMENT (Sheets/Admin API) | Admin | STATUS_VALIDASI = INVALID | Bukti pembayaran harus sudah ada | Pembayaran | Pembayaran (tetap) | Tidak ada | Status tetap **FINAL**; perilaku lanjutan (upload ulang) **ASSUMPTION** |
| 8 | Draft v1 diupload | DRAFT (Sheets/Admin API) | Admin | Baris DRAFT baru (Versi=1) | Link Draft valid | Analisis | Review Draft | Email + WA | FINAL |
| 9 | Customer menyetujui Draft | Web (Customer) | Customer | Keputusan Customer = SETUJU + Tanggal Keputusan (versi draft terbaru) | Berlaku terhadap versi draft terbaru; belum pernah ada keputusan pada versi ini | Review Draft | Review Draft (**tetap**) | In-app feedback | FINAL — bukan trigger status |
| 10 | Customer meminta revisi Draft | Web (Customer) | Customer | Keputusan Customer = REVISI + Tanggal Keputusan | Sama seperti di atas | Review Draft | Review Draft (**tetap**) | Tidak ada notifikasi ke Customer di titik ini | FINAL — bukan trigger status |
| 11 | Admin upload Draft Revisi | DRAFT (Sheets/Admin API) | Admin | Baris DRAFT baru (Versi bertambah) | Versi sebelumnya harus berkeputusan REVISI | Review Draft | Review Draft (**tetap**) | Email + WA (wording khusus) | FINAL |
| 12 | Admin memilih "Lanjut ke Pengesahan" | DRAFT (Sheets/Admin API) | Admin | TINDAK_LANJUT_ADMIN = LANJUT KE PENGESAHAN + tanggal | **Wajib**: Keputusan Customer pada versi draft terbaru = SETUJU | Review Draft | Pengesahan (hanya bila valid) | Email + WA (bila valid) | FINAL — lihat Bagian 4 & 7 untuk detail penolakan |
| 13 | Upload Sertifikat | ORDER/PENERIMAAN (Sheets/Admin API) | Admin | LINK_SERTIFIKAT + TANGGAL_TERBIT_SERTIFIKAT terisi | Link valid | Pengesahan | Download Sertifikat | Email + WA | FINAL |
| 14 | Customer membuka halaman sertifikat | Web (Customer) | Customer | Tidak ada perubahan data | — | Download Sertifikat (tidak berubah) | Download Sertifikat (tidak berubah) | Tidak ada | FINAL — murni aksi baca, bukan trigger apa pun |
| 15 | Customer menyelesaikan Survey | Web (Customer) | Customer | Data Survey tersimpan (SURVEY sheet) | 14 jawaban wajib terisi (status wajib per pertanyaan: **OPEN**, belum dikonfirmasi Lab) | Download Sertifikat (tidak berubah) | Download Sertifikat (tidak berubah) | Tidak ada | FINAL sebagai gate, bukan status |
| 16 | Customer dapat Download Sertifikat | Web (Customer) | Sistem (gate) | Flag survey_completed = true membuka akses | Survey harus sudah tersimpan | Download Sertifikat (tidak berubah) | Download Sertifikat (tidak berubah) | Tidak ada | FINAL — gate murni, bukan status baru |
| 17 | Warning estimasi | Sistem (computed) | Sistem | Flag warning aktif (tidak tersimpan permanen, dihitung tiap request) | Sisa Hari Kerja ≤2 **dan** status = Analisis | Analisis (tidak berubah) | Analisis (tidak berubah) | Tidak ada (tampil pasif di halaman) | FINAL |
| 18a | Upload Kwitansi | PAYMENT (Sheets/Admin API) | Admin | LINK_KWITANSI terisi | Link valid | Analisis (umumnya, tidak berubah) | Tidak berubah | Tidak ada | FINAL — muncul di Timeline pada event Pembayaran Terverifikasi, bukan trigger status |
| 18b | Admin upload ulang Sertifikat (revisi, via WA) | ORDER (Sheets/Admin API) | Admin | LINK_SERTIFIKAT ter-overwrite | Link valid | Download Sertifikat (tidak berubah) | Download Sertifikat (tidak berubah) | Tidak ada notifikasi otomatis baru | FINAL |

---

## 4. Status Transition Automation

| Current Status | Business Event | Condition | New Status | Siapa yang Memicu | Apakah Admin Mengubah Status? |
|---|---|---|---|---|---|
| (belum ada) | Order baru tersimpan | ORDER NO. + RECEIVED ON terisi | Sampel Diterima | Sistem (dipicu data Admin) | Tidak — Admin isi data, Sistem yang menetapkan status |
| Sampel Diterima | Invoice tersedia | LINK_INVOICE terisi | Pembayaran | Sistem (dipicu data Admin) | Tidak |
| Pembayaran | Validasi pembayaran | STATUS_VALIDASI = VALID | Analisis | Sistem (dipicu data Admin) | Tidak |
| Analisis | Draft v1 diupload | Baris DRAFT baru versi=1 | Review Draft | Sistem (dipicu data Admin) | Tidak |
| Review Draft | **Kombinasi**: Keputusan Customer = SETUJU **AND** Admin memilih "Lanjut ke Pengesahan" | Kedua syarat harus terpenuhi bersamaan pada versi draft yang sama | Pengesahan | Sistem (dipicu aksi Admin, **setelah** memvalidasi syarat Customer) | Tidak — Admin melakukan business action, bukan mengubah status secara langsung |
| Pengesahan | Sertifikat diupload | LINK_SERTIFIKAT terisi | Download Sertifikat | Sistem (dipicu data Admin) | Tidak |

**Penegasan FINAL, ditegaskan ulang sesuai instruksi:**
```
Customer klik SETUJU
→ Keputusan tercatat
→ Status TETAP Review Draft
→ Admin melihat keputusan SETUJU
→ Admin memilih "Lanjut ke Pengesahan"
→ Sistem memvalidasi Customer sudah SETUJU
→ Status berubah ke Pengesahan
```
Survey **tidak muncul** pada tabel di atas karena bukan status lifecycle — ia adalah gate di dalam status Download Sertifikat (dibahas terpisah di Bagian 9).

---

## 5. Payment Automation

**Faktur Pajak:** Customer memilih Faktur Pajak → field NPWP wajib muncul dan wajib diisi sebelum dapat melanjutkan ke upload bukti bayar (FINAL).

**Non Faktur:** Customer memilih Non Faktur → tidak ada field NPWP, dapat langsung lanjut ke upload bukti bayar (FINAL).

**Rekening:** Admin memilih Rekening Pembayaran (BNI/Mandiri) secara langsung di PAYMENT — BNI=55414267, Mandiri=63726257. Tidak ada field Kategori Customer. Customer **tidak pernah** memilih rekening sendiri. **CASH tidak tersedia sebagai opsi pembayaran di website** — meski field `CARA` di sheet PAYMENT existing tetap mendukung nilai CASH secara struktural untuk transaksi non-web (FINAL, dikoreksi dari Data Model Specification).

**Invoice:** Admin mengunggah Invoice melalui spreadsheet (LINK_INVOICE, NO_INVOICE, TANGGAL_INVOICE) — Customer melihat via website sebagai card info + tombol lihat/download (FINAL).

**Validasi Pembayaran:**
- **VALID** → status berubah ke Analisis (mengikuti lifecycle), notifikasi Email + WhatsApp terkirim (FINAL).
- **INVALID** → status **tetap** Pembayaran (FINAL, data ini konsisten di seluruh dokumen sebelumnya). Perilaku lanjutan (apakah Customer otomatis dapat upload ulang bukti bayar tanpa aksi Admin lain) tetap **ASSUMPTION** — tidak diubah menjadi FINAL di dokumen ini karena belum ada konfirmasi eksplisit dari Lab di baseline manapun.

---

## 6. Draft Automation

```
Admin upload Draft (v1)
→ Sistem mendeteksi baris DRAFT baru
→ Status = Review Draft
→ Customer mendapat notifikasi (Email + WA)
→ Customer membuka Draft

Customer memilih:

[SETUJU]
→ Keputusan Customer = SETUJU (melekat pada versi draft yang sedang direview)
→ Tanggal Keputusan tercatat
→ Status TETAP Review Draft
→ Customer mendapat feedback in-app bahwa persetujuan tercatat
→ Admin melihat keputusan SETUJU
→ Admin memilih "Lanjut ke Pengesahan"
→ Sistem memvalidasi Keputusan Customer = SETUJU pada versi yang sama
→ Status = Pengesahan (Email + WA)

[MINTA REVISI]
→ Keputusan Customer = REVISI (melekat pada versi draft yang sedang direview)
→ Status TETAP Review Draft
→ Admin mendapat informasi (terlihat di Sheets/Admin view)
→ Admin melakukan revisi secara internal
→ Admin upload Draft versi baru
→ Sistem mendeteksi versi baru
→ Customer mendapat notifikasi Email + WhatsApp (wording khusus, beda dari draft awal)
→ Customer review ulang draft versi baru
→ Siklus dapat berulang (kembali ke titik pilihan SETUJU/MINTA REVISI)
```

**Penegasan kritis (FINAL, ditegaskan ulang):** Keputusan Customer **harus melekat pada versi Draft yang sedang direview** — bukan pada level Order secara umum. Ini memastikan tidak ada ambiguitas ketika terjadi siklus revisi berulang: Draft v1 dapat berkeputusan REVISI, sementara Draft v2 (versi berikutnya untuk order yang sama) berkeputusan SETUJU — dua data terpisah pada dua baris berbeda, konsisten dengan Data Model Specification Bagian 5.

---

## 7. Pengesahan Automation

**Kondisi yang diperlukan untuk masuk Pengesahan:** Kombinasi **AND** — (1) Keputusan Customer = SETUJU pada versi draft terbaru, **dan** (2) Admin memilih business action "Lanjut ke Pengesahan" pada versi draft yang sama.

**Siapa yang melakukan business action:** Admin, melalui field `TINDAK_LANJUT_ADMIN` di sheet DRAFT (bukan dropdown status tracking).

**Validasi sistem:** Setiap kali Admin memilih "Lanjut ke Pengesahan", sistem **wajib** memeriksa Keputusan Customer pada versi draft yang sama sebelum menerapkan transisi status.

**Perubahan status:** Hanya diterapkan bila validasi lolos.

**Notifikasi:** Email + WhatsApp, dikirim hanya setelah status benar-benar berubah (bukan segera setelah Admin menekan aksi, bila validasi gagal).

**Kasus wajib — Admin mencoba melanjutkan sebelum Customer SETUJU:**
```
Customer belum SETUJU (Keputusan Customer kosong atau = REVISI)
+
Admin memilih "Lanjut ke Pengesahan"
→ Sistem MENOLAK transisi
→ Status TETAP Review Draft
→ Tidak ada notifikasi terkirim
→ Field TINDAK_LANJUT_ADMIN dapat tetap tercatat sebagai upaya Admin (untuk audit),
  namun TIDAK menghasilkan efek pada Status Tracking
```
**Admin tidak dapat memaksa status berubah** — ini adalah rule mengikat yang sudah ditegaskan di System Design Specification, API Contract, dan Frontend Specification, dan dikonfirmasi ulang di sini sebagai FINAL.

---

## 8. Sertifikat Automation — FINAL

```
Admin upload Sertifikat
→ Sistem mendeteksi LINK_SERTIFIKAT tersedia
→ Status = Download Sertifikat
→ Customer mendapat notifikasi (Email + WA)
→ Customer membuka halaman sertifikat
→ [Survey belum selesai] → Customer harus menyelesaikan Survey terlebih dahulu
→ [Survey selesai] → tombol Download aktif
```

**Revisi Sertifikat (FINAL, tidak dibuka kembali):**
- Customer **tidak** mengajukan revisi melalui website (tidak ada form/tombol apa pun).
- Customer menghubungi Admin melalui WhatsApp (di luar sistem).
- Admin melakukan revisi secara internal (di luar sistem).
- Admin mengunggah Sertifikat terbaru → LINK_SERTIFIKAT di-overwrite.
- Website otomatis menampilkan Sertifikat terbaru pada permintaan berikutnya.
- **Tidak ada workflow revisi sertifikat di website.**
- **Tidak ada histori versi sertifikat** untuk requirement saat ini.

---

## 9. Survey Automation

Survey adalah **GATE**, bukan status lifecycle (FINAL, ditegaskan berulang di seluruh dokumen).

```
Sertifikat tersedia (status = Download Sertifikat)
→ Customer membuka halaman Download Sertifikat
→ Survey ditampilkan (bila belum pernah diisi)
→ Customer mengisi Survey
→ Submit
→ survey_completed = true
→ Tombol Download Sertifikat aktif
```

**Requirement final (ditegaskan ulang, tidak berubah):**
- Tidak ada input Order No. manual pada form survey — survey otomatis terkait Order yang sedang dibuka.
- Identitas Customer tidak diinput ulang — ditampilkan read-only dari data Order (Nama, Jenis Sampel).
- Pertanyaan menggunakan formulir resmi Laboratorium (14 pertanyaan skala + Kritik & Saran), tanpa pertanyaan dummy.
- Jawaban resmi disimpan sebagai **teks**: Sangat Puas/Puas/Cukup Puas-Biasa/Tidak Puas/Sangat Tidak Puas (Bagian I–III), dan Sangat Baik/Baik/Cukup Puas-Biasa/Tidak Puas/Sangat Tidak Puas (Bagian IV — dipertahankan berbeda sesuai formulir asli).
- Bintang hanya elemen visual — **bukan** nilai yang tersimpan.
- Kritik & Saran berupa teks bebas.

Tidak ada perubahan terhadap flow Survey di dokumen ini.

---

## 10. Estimation Automation

**Business rule konseptual:** Input = WORK (jumlah hari kerja) + Tanggal Mulai (RECEIVED ON). Output = Estimasi Tanggal Selesai, dihitung dengan menghitung maju sejumlah WORK hari sambil melewati (skip) setiap hari yang jatuh pada Sabtu atau Minggu.

**Perbandingan dengan spreadsheet lama (dicatat, bukan diubah tanpa sadar):**

| Aspek | Spreadsheet Existing | Requirement Baru |
|---|---|---|
| Nilai WORK | Kategorikal tetap (7/10/14/21/30) | Tetap dipakai sebagai input, nilai sama |
| Cara olah menjadi Tanggal Selesai | Lookup tetap (mis. WORK=14 → +18 hari kalender) | Hitung dinamis, skip Sabtu/Minggu |
| Sifat perhitungan | Statis, tidak menyesuaikan hari dalam minggu | Dinamis, bergantung hari mulai |

Ini adalah **penggantian logika pengolahan**, bukan perubahan field input — konsisten dengan Data Model Specification Bagian 3 dan System Design Specification Bagian 12. Tidak dibuat formula teknis di dokumen ini, sesuai batasan.

---

## 11. Warning Automation

**Requirement (FINAL):** Jika estimasi tersisa 2 hari kerja **dan** status masih Analisis → website menampilkan warning kepada Customer agar menghubungi Admin.

**Kondisi:** `Sisa Hari Kerja ≤ 2` **DAN** `Status saat ini = Analisis`.

**Wording final (sudah direkomendasikan dan disetujui sebelumnya di baseline):**
> *"Estimasi penyelesaian tinggal 2 hari kerja. Jika Anda memiliki pertanyaan mengenai progres pengujian, silakan hubungi admin Lab KTNT."*

**Bukan status baru:** Warning adalah flag tampilan pasif yang dihitung ulang setiap kali data diminta (computed, bukan tersimpan permanen) — tidak pernah menjadi entri status/timeline baru, dan tidak memicu notifikasi Email/WhatsApp (murni tampil di halaman).

---

## 12. Notification Automation

| Event | Email | WhatsApp | Website Notification | Wording/Context | Status |
|---|---|---|---|---|---|
| Order baru (Sampel Diterima) | ✓ | ✓ | — | "Sampel Anda telah diterima" | FINAL |
| Invoice tersedia | — | — | — | Tidak ada notifikasi | FINAL |
| Pembayaran tervalidasi (VALID) | ✓ | ✓ | — | "Pembayaran Terverifikasi - Analisis Dimulai" (mengikuti pola existing) | FINAL |
| Draft v1 tersedia | ✓ | ✓ | — | "Draft Hasil Siap Ditinjau" | FINAL |
| Draft Revisi tersedia | ✓ | ✓ | — | "Draft hasil revisi telah tersedia" (wording khusus, beda dari draft awal) | FINAL |
| Customer approval (SETUJU) tercatat | — | — | ✓ | "Persetujuan Anda telah tercatat dan sedang menunggu proses pengesahan." | FINAL |
| Pengesahan dimulai | ✓ | ✓ | — | Notifikasi status Pengesahan | FINAL |
| Sertifikat tersedia | ✓ | ✓ | — | "Sertifikat Anda Siap Diunduh" | FINAL |
| Warning estimasi | — | — | ✓ (pasif di halaman) | Lihat Bagian 11 | FINAL |
| Minta Revisi tercatat | — | — | (Bila ditambahkan: in-page feedback) | "Permintaan revisi Anda telah diteruskan ke admin." | **DESIGN DECISION** (dari Frontend Specification — belum wajib) |
| Bukti pembayaran diupload | — | — | ✓ | "Pembayaran sedang diperiksa" | FINAL (in-page saja) |
| Survey terkirim | — | — | ✓ | "Survei berhasil dikirim." | FINAL (in-page saja) |
| Payment INVALID | — | — | (belum ditentukan) | — | **ASSUMPTION/OPEN** — belum ada wording final |

Tidak ada notifikasi baru yang dikarang di luar daftar ini.

---

## 13. Spreadsheet Automation

| Sheet | Data yang Dibaca Sistem | Data yang Ditulis Sistem | Data yang Diisi Admin | Trigger |
|---|---|---|---|---|
| ORDER | ORDER NO., RECEIVED ON, WORK, LINK_SERTIFIKAT, TANGGAL_TERBIT_SERTIFIKAT | Tidak ada (murni dibaca) | ORDER NO., RECEIVED ON, WORK, LINK_SERTIFIKAT | Event #1, #13 |
| PENERIMAAN | DATE OF ANALYSIS | Tidak ada | DATE OF ANALYSIS | Sinyal pendukung status Analisis (bukan trigger utama) |
| PAYMENT | LINK_INVOICE, STATUS_VALIDASI, LINK_KWITANSI, REKENING_PEMBAYARAN | JENIS_FAKTUR, NPWP, LINK_BUKTI_BAYAR (tulis balik dari aksi Customer) | LINK_INVOICE, STATUS_VALIDASI, LINK_KWITANSI, REKENING_PEMBAYARAN | Event #2, #6, #7, #18a |
| DRAFT (baru) | Versi Draft, Link Draft, Tindak Lanjut Admin | Keputusan Customer, Tanggal Keputusan, Tanggal Tindak Lanjut (tulis balik dari aksi Customer/proses validasi) | Versi Draft, Link Draft, Tindak Lanjut Admin | Event #8, #9, #10, #11, #12 |
| SURVEY (baru) | (tidak dibaca untuk trigger status) | Seluruh data survey (14 jawaban + saran, konteks) | Tidak ada (murni ditulis sistem dari input Customer) | Event #15 |

**Prinsip Minimal Change Version tetap dipertahankan** — tidak ada struktur existing (ORDER, PENERIMAAN, PAYMENT) yang dihapus; hanya penambahan kolom sesuai Data Model Specification Bagian 14.

---

## 14. Admin Action vs System Automation

| Aktivitas | Admin Manual | Customer Manual | Sistem Otomatis |
|---|---|---|---|
| Input Order baru | ✓ | | |
| Tentukan Rekening Pembayaran (BNI/Mandiri) | ✓ | | |
| Isi data Invoice | ✓ | | |
| Pilih Faktur/Non Faktur + NPWP | | ✓ | |
| Upload bukti pembayaran | | ✓ | |
| Validasi pembayaran (VALID/INVALID) | ✓ | | |
| **Status Analisis muncul** | | | ✓ |
| Isi Tanggal Mulai Analisis | ✓ | | |
| Upload Draft (awal/revisi) | ✓ | | |
| **Status Review Draft muncul** | | | ✓ |
| Setuju/Minta Revisi Draft | | ✓ | |
| **Pencatatan Keputusan Customer** | | | ✓ (menulis dari aksi Customer) |
| "Lanjut ke Pengesahan" (business action) | ✓ | | |
| **Validasi syarat SETUJU sebelum transisi** | | | ✓ |
| **Status Pengesahan muncul** | | | ✓ |
| Upload Sertifikat (awal/revisi) | ✓ | | |
| **Status Download Sertifikat muncul** | | | ✓ |
| Isi Survey | | ✓ | |
| **Buka gate download** | | | ✓ |
| Upload Kwitansi | ✓ | | |
| Hitung Estimasi & Warning | | | ✓ |
| Kirim Notifikasi | | | ✓ |

Tidak ada satu pun baris "Status ... muncul" yang berada di kolom Admin Manual — seluruh perubahan status murni kolom Sistem Otomatis, konsisten dengan prinsip inti Bagian 1.

---

## 15. Idempotency & Duplicate Event

| Skenario | Business Rule |
|---|---|
| Invoice terdeteksi dua kali (mis. Admin edit ulang link yang sama) | Sistem hanya memproses sebagai event baru bila **nilai LINK_INVOICE berubah** dari kosong menjadi terisi (transisi pertama kali) — pembacaan berulang atas nilai yang sudah tercatat tidak memicu ulang trigger status/notifikasi |
| Draft terdeteksi dua kali | Setiap baris Draft diidentifikasi oleh kombinasi Order No. + Versi Draft (Data Model Bagian 5) — bila kombinasi ini sudah pernah diproses, sistem tidak memproses ulang (idempotent per versi) |
| Draft Revisi terupload ulang (dengan versi yang sama karena kesalahan Admin) | Sama seperti di atas — kombinasi Order No.+Versi yang sudah ada dilewati, tidak menghasilkan notifikasi ganda; Admin perlu menaikkan nomor versi untuk draft yang benar-benar baru |
| Sertifikat terdeteksi ulang (Admin edit ulang link yang sama) | Sama seperti Invoice — hanya perubahan nilai (dari kosong ke terisi, atau dari satu link ke link berbeda saat revisi) yang memicu event; nilai yang identik dengan sebelumnya tidak memicu notifikasi ulang |
| Customer klik Setuju dua kali | Setelah Keputusan Customer tercatat pada suatu versi draft, permintaan keputusan berikutnya pada versi yang sama **ditolak** (sesuai API Contract Bagian 6) — mencegah keputusan tertimpa atau notifikasi ganda |
| Customer submit Survey dua kali | Setelah entri Survey untuk suatu Order tersimpan, permintaan submit berikutnya **ditolak** (satu row per survey/order, Data Model Bagian 6) |
| Admin memilih "Lanjut ke Pengesahan" dua kali | Panggilan pertama (bila valid) memproses transisi status. Panggilan kedua terhadap Order yang statusnya **sudah** Pengesahan tidak menghasilkan efek tambahan (status sudah berubah, tidak ada transisi ulang atau notifikasi ganda) |

Tidak ada detail implementasi (locking, transaction, dsb.) dibahas — murni business rule yang harus dipenuhi.

---

## 16. Failure/Recovery Scenario

| Kondisi | Kategori | Perilaku |
|---|---|---|
| Spreadsheet belum tersinkronisasi (jeda antara Admin input dan sistem membaca) | **Boleh menunggu** | Customer melihat data terkini hasil sinkronisasi terakhir; tidak ada error, murni keterlambatan wajar (konsisten dengan pola existing — cron berkala) |
| Link Draft kosong | **Harus ditolak** | Baris draft dengan link kosong tidak dianggap sebagai event valid (Bagian 15 — validasi format), tidak memicu status Review Draft |
| Link Invoice kosong | **Harus ditolak** | Sama — tidak dianggap "Invoice tersedia" sampai link benar-benar terisi valid |
| Link Sertifikat kosong | **Harus ditolak** | Sama — tidak memicu status Download Sertifikat |
| Notification gagal terkirim (Email/WA down) | **Boleh menunggu/dicatat sebagai gagal** | Status tracking **tetap berubah** (transisi status tidak bergantung pada keberhasilan notifikasi) — notifikasi yang gagal dicatat sebagai FAILED (konsisten dengan pola existing `notifications.status`), tidak memblokir alur utama |
| Customer membuka halaman ketika data belum tersedia (mis. draft belum ada) | **Ditampilkan sebagai warning/info pasif** | Section terkait tidak ditampilkan atau ditampilkan sebagai "belum tersedia", bukan error (sesuai Frontend Specification Bagian 17) |
| Admin melakukan action tidak sesuai kondisi (mis. "Lanjut ke Pengesahan" sebelum Customer SETUJU) | **Harus ditolak** | Sesuai Bagian 7 — sistem menolak transisi, status tetap tidak berubah |
| Data spreadsheet tidak lengkap (field wajib kosong pada suatu baris) | **Harus ditolak (baris dilewati)** | Konsisten dengan pola existing "skip baris tidak valid" — baris tersebut dilewati saat sinkronisasi, tidak menghentikan proses sinkronisasi baris/data lain |

---

## 17. Automation Rules — Final

**AR-001**
- Trigger: Order baru tersimpan (ORDER NO. + RECEIVED ON terisi)
- Condition: Kedua field wajib terisi
- Action: Buat tracking record, tetapkan status
- Result: Status = Sampel Diterima; Notifikasi Email+WA
- Status: FINAL

**AR-002**
- Trigger: LINK_INVOICE terisi
- Condition: Link valid
- Action: Update status
- Result: Status = Pembayaran; tidak ada notifikasi
- Status: FINAL (data), trigger sebagai pemicu status = **ASSUMPTION**

**AR-003**
- Trigger: STATUS_VALIDASI = VALID
- Condition: Bukti pembayaran sudah ada; belum pernah VALID sebelumnya
- Action: Update status, kirim notifikasi
- Result: Status = Analisis; Email+WA
- Status: FINAL

**AR-004**
- Trigger: STATUS_VALIDASI = INVALID
- Condition: Bukti pembayaran sudah ada
- Action: Catat status validasi
- Result: Status tetap Pembayaran; tidak ada notifikasi
- Status: FINAL (status tetap), perilaku lanjutan = ASSUMPTION

**AR-005**
- Trigger: Baris DRAFT baru dengan Versi=1
- Condition: Link Draft valid
- Action: Update status, kirim notifikasi
- Result: Status = Review Draft; Email+WA
- Status: FINAL

**AR-006**
- Trigger: Customer submit Keputusan = SETUJU
- Condition: Belum ada keputusan pada versi draft yang sama
- Action: Catat keputusan + tanggal
- Result: Status TETAP Review Draft; in-app feedback
- Status: FINAL

**AR-007**
- Trigger: Customer submit Keputusan = REVISI
- Condition: Belum ada keputusan pada versi draft yang sama
- Action: Catat keputusan + tanggal
- Result: Status TETAP Review Draft; tidak ada notifikasi ke Customer
- Status: FINAL

**AR-008**
- Trigger: Baris DRAFT baru dengan Versi>1
- Condition: Versi sebelumnya berkeputusan REVISI
- Action: Update draft aktif, kirim notifikasi khusus
- Result: Status TETAP Review Draft; Email+WA (wording revisi)
- Status: FINAL

**AR-009**
- Trigger: Admin submit TINDAK_LANJUT_ADMIN = LANJUT KE PENGESAHAN
- Condition: **Keputusan Customer pada versi draft terbaru = SETUJU**
- Action: Update status, kirim notifikasi
- Result: **Bila valid** → Status = Pengesahan; Email+WA. **Bila tidak valid** → Status TETAP Review Draft, tidak ada notifikasi, transisi ditolak
- Status: FINAL

**AR-010**
- Trigger: LINK_SERTIFIKAT terisi
- Condition: Link valid; Order berstatus Pengesahan
- Action: Update status, kirim notifikasi
- Result: Status = Download Sertifikat; Email+WA
- Status: FINAL

**AR-011**
- Trigger: Customer submit Survey
- Condition: Belum ada entri Survey untuk Order ini; seluruh 14 jawaban terisi (status wajib per pertanyaan: OPEN)
- Action: Simpan data survey, buka gate
- Result: survey_completed = true; status tracking TIDAK berubah
- Status: FINAL (sebagai gate)

**AR-012**
- Trigger: Perhitungan estimasi (setiap request)
- Condition: Sisa Hari Kerja ≤2 DAN status = Analisis
- Action: Set flag warning aktif
- Result: Warning tampil di halaman; tidak ada perubahan status/notifikasi
- Status: FINAL

**AR-013**
- Trigger: LINK_KWITANSI terisi
- Condition: Link valid
- Action: Tampilkan pada event Pembayaran Terverifikasi di Timeline
- Result: Tidak ada perubahan status
- Status: FINAL

**AR-014**
- Trigger: Admin upload ulang LINK_SERTIFIKAT (revisi, via WA di luar sistem)
- Condition: Link baru valid
- Action: Overwrite link sertifikat
- Result: Status TETAP Download Sertifikat; tidak ada notifikasi otomatis baru
- Status: FINAL

---

## 18. Traceability

| Requirement (Baseline) | Business Event | Automation Rule | Status Transition | Notification |
|---|---|---|---|---|
| #1 Merge status Analisis | Draft v1 diupload | AR-005 | Analisis → Review Draft | Email+WA |
| #3 Estimasi Hari Kerja | Perhitungan estimasi | AR-012 (bagian estimasi) | Tidak ada | — |
| #4 Otomatisasi status penuh | Seluruh event di Bagian 3 | AR-001 s/d AR-014 | Seluruh transisi | Sesuai Bagian 12 |
| #6 Faktur Pajak/NPWP | Customer isi faktur/NPWP | (Bagian 3 event #3, #4) | Tidak mengubah status | Tidak ada |
| #7 Rekening | Rekening Pembayaran ditentukan Admin langsung | (Bagian 5) | Tidak mengubah status | Tidak ada |
| #8 Invoice | Invoice tersedia | AR-002 | Sampel Diterima → Pembayaran | Tidak ada |
| #9 Notifikasi validasi | Validasi VALID | AR-003 | Pembayaran → Analisis | Email+WA |
| #10 Kwitansi | Kwitansi tersedia | AR-013 | Tidak ada | Tidak ada (tampil di Timeline) |
| #11 Draft revisi | Draft revisi diupload | AR-008 | Tetap Review Draft | Email+WA khusus |
| #12 Warning estimasi | Perhitungan estimasi | AR-012 | Tidak ada | Tampil pasif |
| #13 Revisi sertifikat 14 hari | Upload ulang sertifikat | AR-014 | Tetap Download Sertifikat | Tidak ada |
| Draft→Pengesahan (revisi flow) | Keputusan SETUJU + Lanjut ke Pengesahan | AR-006, AR-009 | Review Draft → Pengesahan (bersyarat) | Email+WA (bila valid) |
| Sertifikat (Baseline Bagian D) | Sertifikat diupload | AR-010 | Pengesahan → Download Sertifikat | Email+WA |
| Survey (Baseline Bagian E) | Survey disubmit | AR-011 | Tidak ada (gate) | Tidak ada |

Seluruh requirement final yang memiliki dimensi automation sudah memiliki Automation Rule yang memetakannya — tidak ditemukan requirement final yang kehilangan automation rule.

---

## 19. Open / Assumption / Optional

### FINAL
- Seluruh 6 status lifecycle dan trigger-nya (kecuali dicatat sebagai ASSUMPTION di bawah).
- Syarat ganda AND untuk Pengesahan.
- Penolakan transisi bila Admin melanjutkan sebelum Customer SETUJU.
- Survey sebagai gate, bukan status.
- Rekening dipilih Admin langsung (BNI/Mandiri), tanpa CASH di website.
- Sertifikat revisi murni via WhatsApp, tanpa workflow di sistem.
- Notification Matrix sesuai Bagian 12 (kecuali item bertanda DESIGN DECISION/OPEN).

### ASSUMPTION
- Trigger pasti Sampel Diterima → Pembayaran (LINK_INVOICE terisi) — dipakai sebagai basis desain, belum dikonfirmasi eksplisit oleh Lab.
- Perilaku lanjutan setelah STATUS_VALIDASI = INVALID (apakah Customer otomatis dapat upload ulang).
- Wording notifikasi untuk kondisi Payment INVALID — belum ditentukan.

### OPEN
- Status wajib/opsional per pertanyaan Survey (memengaruhi validasi AR-011).
- Sumber kolom presisi untuk Jenis Sampel & No. Handphone pada konteks Survey.
- Relasi CODE (I/L/P) terhadap ORDER NO. sebagai kode tracking dan implikasinya terhadap Requirement #2.

### OPTIONAL
- Notifikasi in-app untuk aksi "Minta Revisi" (DESIGN DECISION dari Frontend Specification, belum wajib).
- Riwayat versi Draft di Frontend.
- Histori versi Sertifikat (bila kelak dibutuhkan Lab).
- Wording terpisah untuk kondisi estimasi sudah terlambat.

Tidak ada ASSUMPTION yang diubah menjadi FINAL di dokumen ini.

---

## 20. Automation Readiness Check

```
[x] Seluruh status memiliki trigger
[x] Tidak ada status yang diubah manual
[x] Draft flow sudah lengkap
[x] Pengesahan memiliki validasi SETUJU + Admin Action
[x] Payment flow lengkap
[x] Invoice flow lengkap
[x] Kwitansi flow lengkap
[x] Sertifikat flow lengkap
[x] Survey gate lengkap
[x] Warning estimasi lengkap
[x] Notification terpetakan
[x] Spreadsheet trigger terpetakan
[x] Duplicate event dipertimbangkan
[x] Failure/recovery dipetakan
[x] Open/Assumption/Optional dipisahkan
```

# READY FOR IMPLEMENTATION PLANNING?

**YES**

Seluruh automation trigger, status transition, payment/draft/pengesahan/certificate/survey automation, notification matrix, spreadsheet automation, idempotency rule, dan failure/recovery scenario sudah didokumentasikan secara konsisten dengan kelima dokumen sebelumnya, tanpa satu pun BLOCKER, dan tanpa mengubah ASSUMPTION menjadi FINAL secara diam-diam. Prinsip paling kritis (status hanya berubah lewat business event tervalidasi; syarat ganda AND untuk Pengesahan; penolakan eksplisit bila syarat belum terpenuhi; Survey sebagai gate bukan status) sudah ditegaskan berulang dan konsisten di seluruh bagian.

Tahap berikutnya:
1. Implementation Task Breakdown
2. Backend Implementation Plan
3. Frontend Implementation Plan
4. Spreadsheet Automation Implementation Plan
5. Testing Plan

*(Kelima hal di atas tidak dibahas pada dokumen ini sesuai batasan tahap Automation Specification.)*
