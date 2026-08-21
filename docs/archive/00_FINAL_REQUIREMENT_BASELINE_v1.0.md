# FINAL REQUIREMENT BASELINE v1.0
## Sistem Tracking Sampel Laboratorium Kimia Tanah dan Nutrisi Tanaman (KTNT) — Fakultas Pertanian, UNPAD

*Dokumen ini adalah single source of truth hasil konsolidasi seluruh Requirement Review, klarifikasi laboratorium, dan analisis spreadsheet. Dokumen ini menjadi dasar tahap System Design berikutnya.*

---

## BAGIAN 1 — Final Business Flow

**1. Sampel Diterima**
Kondisi masuk: Admin menginput order baru di sheet ORDER (ORDER NO., RECEIVED ON, WORK, data customer, dsb.). Pelaku: Admin. Status berubah saat baris order baru lengkap tersimpan. Customer melihat: order tercatat, estimasi hari kerja & tanggal selesai. Notifikasi: Email + WhatsApp.

**2. Pembayaran**
Kondisi masuk: Admin melengkapi data Invoice (link/no/tanggal) untuk order tersebut. Pelaku: Admin (menyediakan invoice), Customer (memilih Faktur/Non Faktur, isi NPWP bila perlu, upload bukti bayar). Status berubah saat data Invoice tersedia. Customer melihat: card Invoice, info rekening sesuai kategori, form Faktur/NPWP, form upload bukti bayar. Notifikasi: tidak ada notifikasi otomatis khusus di titik masuk status ini.

**3. Analisis**
Kondisi masuk: Admin memvalidasi pembayaran (Status Validasi = VALID). Pelaku: Admin. Status berubah otomatis begitu validasi dicatat. Customer melihat: info progres, estimasi hari kerja & tanggal selesai, warning bila sisa estimasi ≤2 hari kerja dan status masih di tahap ini; kwitansi (bila sudah diunggah admin) muncul pada event Pembayaran Terverifikasi di Timeline. Notifikasi: Email + WhatsApp.

**4. Review Draft**
Kondisi masuk: Admin mengunggah link Draft versi 1. Pelaku: Admin (upload draft), Customer (menentukan Setuju/Minta Revisi). Status berubah otomatis begitu draft v1 terdeteksi. Customer melihat: draft, tombol Setuju/Minta Revisi. Notifikasi: Email + WhatsApp saat draft v1 tersedia, dan saat draft revisi tersedia (wording berbeda).

Sub-alur di dalam status ini (tidak mengubah status, lihat Bagian 8 untuk detail):
- Customer pilih Setuju → keputusan tercatat, status tetap Review Draft, menunggu action admin.
- Customer pilih Minta Revisi → keputusan tercatat REVISI, admin proses revisi, upload draft baru, status tetap Review Draft.

**5. Pengesahan**
Kondisi masuk: **Kombinasi** — Customer sudah mencatatkan keputusan SETUJU **dan** Admin memilih business action "Lanjut ke Pengesahan" pada sheet DRAFT. Pelaku: Admin (pemicu transisi terakhir). Status berubah otomatis begitu kedua syarat terpenuhi. Customer melihat: info sedang diproses pengesahan. Notifikasi: Email + WhatsApp.

**6. Survey Kepuasan**
Kondisi masuk: Admin mengunggah link Sertifikat. Pelaku: Customer (mengisi survey). Bukan status tracking terpisah dalam arti lifecycle 6-tahap teknis, melainkan gate wajib sebelum tombol download aktif, ditempatkan pada tahap Download Sertifikat. Customer melihat: halaman Download Sertifikat dengan Survey sebagai syarat wajib sebelum tombol download aktif. Notifikasi: tidak ada notifikasi otomatis khusus untuk submit survey.

**7. Download Sertifikat**
Kondisi masuk: Link Sertifikat tersedia (sama dengan trigger masuk status 6 di atas). Pelaku: Admin (upload sertifikat), Customer (isi survey lalu download). Status berubah otomatis begitu link sertifikat terisi. Customer melihat: info tanggal terbit, batas revisi (14 hari kerja), kontak WhatsApp admin, tombol download (aktif setelah survey terisi). Notifikasi: Email + WhatsApp saat sertifikat tersedia.

*Catatan konsistensi: Survey Kepuasan bukan status ke-6 yang terpisah secara teknis dari Download Sertifikat — keduanya terjadi pada satu status lifecycle yang sama (Download Sertifikat), dengan Survey sebagai gate di dalamnya. Ini konsisten dengan keputusan final sebelumnya bahwa lifecycle status inti berjumlah 6 tahap (Sampel Diterima → Pembayaran → Analisis → Review Draft → Pengesahan → Download Sertifikat).*

---

## BAGIAN 2 — Final Status Lifecycle

| No | Status | Trigger Masuk | Pelaku | Kondisi Customer | Notifikasi | Trigger Keluar |
|---|---|---|---|---|---|---|
| 1 | Sampel Diterima | Order baru tersimpan (RECEIVED ON + ORDER NO. terisi) | Admin | Status awal + estimasi | Email + WA | Data Invoice tersedia |
| 2 | Pembayaran | Data Invoice tersedia | Admin | Invoice, form Faktur/NPWP, rekening, upload bukti bayar | Tidak ada | Status Validasi Pembayaran = VALID |
| 3 | Analisis | Status Validasi = VALID | Admin | Progres, estimasi, warning ≤2 hari kerja, kwitansi di Timeline | Email + WA | Draft v1 tersedia |
| 4 | Review Draft | Draft v1 tersedia | Admin (upload) | Draft, tombol Setuju/Minta Revisi | Email + WA | Kombinasi: Customer SETUJU + Admin "Lanjut ke Pengesahan" |
| 5 | Pengesahan | Customer SETUJU **dan** Admin pilih "Lanjut ke Pengesahan" | Admin (pemicu akhir) | Info diproses pengesahan | Email + WA | Link Sertifikat tersedia |
| 6 | Download Sertifikat | Link Sertifikat tersedia | Admin (upload) | Survey wajib → lalu download; info batas revisi 14 hari kerja | Email + WA | (akhir lifecycle) |

**Penegasan khusus Draft → Pengesahan (FINAL, tidak dapat diubah tanpa persetujuan ulang):**
```
Customer SETUJU  ≠  langsung Pengesahan
Customer SETUJU → status TETAP Review Draft
Admin pilih "Lanjut ke Pengesahan" (business action, bukan dropdown status)
→ BARU status berubah otomatis menjadi Pengesahan
```

---

## BAGIAN 3 — Final Requirement 1–17 (Ringkasan)

| No | Requirement | Keputusan Final | Dampak Business Flow | Data Diperlukan | Status |
|---|---|---|---|---|---|
| 1 | Merge status Proses Analisis + Input Data Hasil | Digabung jadi status tunggal "Analisis" | Lifecycle 7→6 tahap | — | FINAL |
| 2 | Hapus Jenis Analisis dari tampilan customer | Dihapus dari UI customer; data internal (CODE, parameter) tetap ada di spreadsheet | Tidak ada perubahan logic/alur | — | FINAL |
| 3 | Estimasi Hari Kerja | Sabtu/Minggu tidak dihitung; tampilkan Estimasi Hari Kerja + Tanggal Selesai | Ubah cara hitung, bukan lifecycle | WORK (existing, cara olah baru) | FINAL |
| 4 | Otomatisasi status penuh | Seluruh transisi otomatis berbasis event, admin tidak ubah dropdown | Fundamental — dasar Bagian 5 | — | FINAL |
| 5 | Format kode tracking | ORDER NO. `NNNN/MM/YYYY(CODE)` dari spreadsheet dipakai untuk tracking | Kredensial akses customer | ORDER NO. (existing) | FINAL (format), PENDING MAPPING (relasi CODE dgn tampilan customer — lihat Bagian 15) |
| 6 | Faktur Pajak/NPWP | Dipilih di halaman Pembayaran; NPWP wajib bila Faktur Pajak | +1 langkah di alur Pembayaran | JENIS_FAKTUR, NPWP (baru) | FINAL |
| 7 | Rekening | Rekanan UNPAD→BNI, Umum→Mandiri; admin tentukan kategori; CASH tidak dipakai di web | Tampilan rekening otomatis | KATEGORI_CUSTOMER (baru) | FINAL |
| 8 | Invoice UX | Card info + tombol Lihat/Download | Tampilan halaman Pembayaran | LINK_INVOICE dkk (baru) | FINAL |
| 9 | Notifikasi pasca-validasi | Email+WA existing; tanpa notifikasi tambahan di website | Tidak ada perubahan alur | — | FINAL |
| 10 | Kwitansi | Tampil di Timeline pada event Pembayaran Terverifikasi | Tambahan info di Timeline | LINK_KWITANSI (baru) | FINAL |
| 11 | Draft revisi | Notifikasi khusus beda wording dari draft awal | Tambahan notifikasi | Sheet DRAFT (baru) | FINAL (riwayat versi = OPTIONAL) |
| 12 | Warning estimasi | Tampil saat sisa ≤2 hari kerja & status Analisis | Tampilan pasif | — | FINAL |
| 13 | Revisi sertifikat 14 hari | Website hanya info + kontak WA, tanpa form pengajuan | Murni informational | Tanggal terbit (baru) | FINAL |
| 14 | Spreadsheet | Struktur mengikuti format terbaru Lab; boleh tambah kolom/sheet | — | Sudah dipetakan (Bagian 4) | FINAL |
| 15 | Revisi Halaman Tracking | Konsolidasi #1,2,3,5,12 | Tampilan tracking | — | FINAL |
| 16 | Revisi Landing Page | Identitas, Logo KAN, kontak terbaru | Konten statis | Materi dari Lab | FINAL (requirement); PENDING MAPPING (materi fisik) |
| 17 | Survey resmi | Flow tidak berubah, isi pertanyaan resmi Lab | Tidak ada perubahan alur | Sudah final (Bagian 10) | FINAL |

*Catatan: Requirement #5 dan #16 tidak diberi status OPEN karena keputusan bisnisnya sudah final — yang tersisa murni pemetaan data/materi teknis, sesuai aturan bahwa pending mapping bukan blocker requirement.*

---

## BAGIAN 4 — Final Spreadsheet Requirement

### ORDER
**Existing (dipertahankan):** CODE OF SAMPLE, CODE (I/L/P dst.), NO, RECEIVED ON, WORK, ORDER NO. (kolom H — sumber tracking), NAME, ADDRESS, CONTACT, dan seluruh kolom administratif sampling lainnya.
**New:**
- `KATEGORI_CUSTOMER` (Rekanan UNPAD / Umum) — diisi Admin, menentukan rekening otomatis.

### PENERIMAAN
**Existing (dipertahankan):** ORDER NO., KODE, RECEIVED ON, DATE OF ANALYSIS, WORK, ANALYSIS FINISH, dan kolom lookup lainnya dari ORDER.
**New:** Tidak ada — DATE OF ANALYSIS existing sudah cukup sebagai data pendukung sinyal tahap Analisis.

### PAYMENT
**Existing (dipertahankan):** Nama, CODE, ORDER NO., TOTAL, DISKON, PERCEPATAN, REFORMULA, PAJAK, JUMLAH, SISA, NO (cicilan), NOMINAL, TANGGAL, CARA, NO. KWITANSI, TANGGAL TEXT, KETERANGAN.
**New:**
- `LINK_INVOICE`, `NO_INVOICE`, `TANGGAL_INVOICE`
- `STATUS_VALIDASI` (PENDING/VALID/INVALID) — eksplisit, bukan proxy dari SISA=0
- `JENIS_FAKTUR` (Faktur Pajak/Non Faktur)
- `NPWP`
- `LINK_KWITANSI` (nomor kwitansi sudah ada; link dokumen baru)

### DRAFT (Sheet Baru — diperlukan)
Diperlukan karena sifat data repeatable (1 order bisa memiliki beberapa versi draft/revisi), tidak cocok dipaksakan sebagai kolom di sheet existing.

| Field | Diisi Oleh | Keterangan |
|---|---|---|
| Order No. | Admin | Key penghubung ke ORDER |
| Versi Draft | Admin | Bertambah tiap draft baru/revisi |
| Link Draft | Admin | |
| Tanggal Upload | Admin | |
| Keputusan Customer | Sistem | SETUJU / REVISI, ditulis otomatis dari aksi customer |
| Tanggal Keputusan | Sistem | Otomatis saat customer memilih |
| Tindak Lanjut Admin | Admin | MENUNGGU TINDAKAN / LANJUT KE PENGESAHAN — business action, bukan status tracking |
| Tanggal Tindak Lanjut | Sistem | Dicatat otomatis saat admin memilih action |

### SURVEY (Sheet Baru — diperlukan)
Diperlukan karena struktur data sama sekali berbeda (banyak jawaban per pertanyaan), tidak cocok sebagai kolom di sheet operasional manapun.

Kebutuhan data konseptual:
- Order No. (penghubung)
- Data konteks dari Order untuk pelaporan (Nama Customer, Jenis Sampel — sumber kolom: PENDING MAPPING)
- Tanggal pengisian
- 14 jawaban pertanyaan skala (Bagian I–IV)
- Kritik dan Saran

### SERTIFIKAT
Kebutuhan data konseptual: Link Sertifikat, Tanggal Terbit. Tidak memerlukan histori versi untuk requirement saat ini (sesuai keputusan final Bagian D) — cukup field yang di-overwrite saat admin unggah ulang hasil revisi. Dapat ditambahkan sebagai kolom baru di ORDER/PENERIMAAN, tidak memerlukan sheet terpisah kecuali ada kebutuhan baru dari Lab di masa depan.

### Sheet Lain
Tidak ada sheet tambahan lain yang diperlukan di luar DRAFT dan SURVEY berdasarkan requirement yang sudah final saat ini.

---

## BAGIAN 5 — Automation Trigger Matrix

| Aktivitas | Pelaku | Data/Event | Status Sebelum | Status Sesudah | Notifikasi |
|---|---|---|---|---|---|
| Input Order Baru | Admin | ORDER NO. + RECEIVED ON terisi | — | Sampel Diterima | Email + WA |
| Invoice Tersedia | Admin | LINK_INVOICE terisi | Sampel Diterima | Pembayaran | Tidak ada |
| Customer Upload Bukti Bayar | Customer | Data pembayaran tersimpan | Pembayaran | Pembayaran (tetap) | Tidak ada |
| Validasi Pembayaran | Admin | STATUS_VALIDASI = VALID | Pembayaran | Analisis | Email + WA |
| Upload Kwitansi | Admin | LINK_KWITANSI terisi | Analisis | Analisis (tetap; muncul di Timeline) | Tidak ada |
| Upload Draft v1 | Admin | Baris baru di sheet DRAFT | Analisis | Review Draft | Email + WA |
| Customer Setuju | Customer | KEPUTUSAN CUSTOMER = SETUJU | Review Draft | Review Draft (tetap) | Feedback in-app, bukan Email/WA |
| Customer Minta Revisi | Customer | KEPUTUSAN CUSTOMER = REVISI | Review Draft | Review Draft (tetap) | Tidak ada |
| Upload Draft Revisi | Admin | Baris versi baru di sheet DRAFT | Review Draft | Review Draft (tetap) | Email + WA (wording khusus draft revisi) |
| Admin "Lanjut ke Pengesahan" | Admin | TINDAK LANJUT ADMIN = LANJUT KE PENGESAHAN (syarat: Keputusan Customer sudah SETUJU) | Review Draft | Pengesahan | Email + WA |
| Upload Sertifikat | Admin | LINK_SERTIFIKAT terisi | Pengesahan | Download Sertifikat | Email + WA |
| Submit Survey | Customer | Data survey tersimpan | Download Sertifikat | Download Sertifikat (tetap; membuka akses download) | Tidak ada |
| Upload Sertifikat Revisi (di luar sistem via WA) | Admin | LINK_SERTIFIKAT ter-update | Download Sertifikat | Download Sertifikat (tetap) | Tidak ada notifikasi otomatis baru |

*Tidak ada satu pun baris di atas yang membutuhkan admin mengubah dropdown status tracking secara manual — seluruh transisi berbasis event/data/business action.*

---

## BAGIAN 6 — Admin vs Customer

### ADMIN (manual)
- Input order baru di ORDER.
- Menentukan Kategori Customer (Rekanan UNPAD/Umum).
- Mengisi data Invoice (link, nomor, tanggal).
- Memvalidasi pembayaran.
- Mengisi Tanggal Mulai Analisis (data pendukung di PENERIMAAN).
- Upload Kwitansi.
- Upload Draft (versi awal & revisi).
- Melihat Keputusan Customer pada sheet DRAFT.
- Memilih business action "Lanjut ke Pengesahan".
- Upload Sertifikat (awal & hasil revisi; revisi diproses di luar sistem via WhatsApp).

### CUSTOMER (via website)
- Melihat status & estimasi.
- Memilih Faktur Pajak/Non Faktur, mengisi NPWP bila perlu.
- Upload bukti pembayaran.
- Melihat Invoice & Kwitansi.
- Melihat Draft; memilih Setuju atau Minta Revisi.
- Mengisi Survey Kepuasan.
- Mengunduh Sertifikat.
- Menghubungi admin via WhatsApp bila butuh revisi sertifikat (di luar sistem).

---

## BAGIAN 7 — Payment Final

```
Admin tentukan Kategori Customer (Rekanan UNPAD / Umum)
        ↓
Sistem tentukan rekening otomatis:
   Rekanan UNPAD → BNI
   Umum → Mandiri
   (CASH tidak tersedia sebagai opsi di website)
        ↓
Admin sediakan data Invoice
        ↓
Customer lihat Invoice (card + tombol Lihat/Download)
        ↓
Customer pilih Faktur Pajak / Non Faktur
        ↓
   [Jika Faktur Pajak] Customer isi NPWP
        ↓
Customer melakukan pembayaran (transfer manual ke rekening yang tampil)
        ↓
Customer upload bukti pembayaran
        ↓
Admin validasi pembayaran
        ↓
Status otomatis → Analisis
        ↓
Notifikasi Email + WhatsApp
```

---

## BAGIAN 8 — Draft & Pengesahan Final

```
Admin upload Draft (v1)
→ Status otomatis: Review Draft + Notifikasi
→ Customer buka draft, pilih:

   SETUJU
   → Keputusan tercatat (SETUJU + tanggal)
   → Status TETAP Review Draft
   → Customer dapat feedback: persetujuan tercatat, menunggu admin
   → Admin melihat keputusan customer
   → Admin pilih business action "Lanjut ke Pengesahan"
   → BARU Status berubah otomatis: Pengesahan + Notifikasi

   MINTA REVISI
   → Keputusan tercatat (REVISI + tanggal)
   → Status TETAP Review Draft
   → Admin melakukan revisi
   → Admin upload Draft baru (versi berikutnya)
   → Customer dapat notifikasi khusus ("Draft hasil revisi telah tersedia")
   → Customer review ulang (kembali ke titik pilihan SETUJU/REVISI)
```

**Penegasan FINAL:** "Customer Setuju" **bukan** trigger langsung ke status Pengesahan. Trigger Pengesahan adalah kombinasi Keputusan Customer = SETUJU **dan** Admin melakukan business action "Lanjut ke Pengesahan". Admin tidak pernah mengedit dropdown status tracking secara langsung.

---

## BAGIAN 9 — Sertifikat Final

```
Admin upload Sertifikat
→ Status otomatis: Download Sertifikat + Notifikasi
→ Customer wajib isi Survey Kepuasan
→ Setelah Survey terkirim → tombol Download aktif
→ Customer download Sertifikat
→ Website tampilkan: tanggal terbit + batas revisi (14 hari kerja) + kontak WA admin

[Jika ada kesalahan, dalam 14 hari kerja]
Customer hubungi Admin via WhatsApp (DI LUAR SISTEM)
Admin proses revisi secara internal (DI LUAR SISTEM)
Admin upload ulang Link Sertifikat
Website otomatis tampilkan Sertifikat terbaru
Customer download ulang
```

**FINAL, tidak dapat dibuka kembali:** Tidak ada tombol/form/status/ticketing pengajuan revisi sertifikat di website. Tidak ada histori versi sertifikat untuk requirement saat ini.

---

## BAGIAN 10 — Survey Final

- Business flow **tidak berubah**: Sertifikat tersedia → Customer buka halaman Download Sertifikat → Isi Survey → Survey terkirim → Tombol Download aktif.
- **Identitas responden tidak diinput ulang** — ditampilkan sebagai header konteks read-only (Order No., Customer, Jenis Sampel), diambil dari data Order.
- **No. Handphone tidak menjadi field input wajib customer** — sumber datanya akan dipetakan dari spreadsheet pada tahap System Design (PENDING MAPPING, bukan blocker).
- Survey otomatis terkait dengan Order yang sedang dibuka — tidak ada input Order No. manual.
- **Pertanyaan resmi Lab, tanpa pertanyaan dummy**: 14 pertanyaan skala (Bagian I: 4, Bagian II: 3, Bagian III: 6, Bagian IV: 1) + 1 Kritik & Saran.
- **Skala: kombinasi bintang + teks.** Teks adalah representasi resmi jawaban tersimpan; bintang murni elemen visual.
  - Bagian I–III: 5=Sangat Puas, 4=Puas, 3=Cukup Puas/Biasa, 2=Tidak Puas, 1=Sangat Tidak Puas.
  - Bagian IV (Akurasi Hasil Uji): 5=Sangat Baik, 4=Baik, 3=Cukup Puas/Biasa, 2=Tidak Puas, 1=Sangat Tidak Puas — dipertahankan berbeda sesuai formulir asli, tidak diseragamkan.

---

## BAGIAN 11 — Estimasi Final

- **WORK = Estimasi Hari Kerja** (input dari Admin, existing di ORDER/PENERIMAAN).
- Requirement baru: perhitungan tanggal selesai **skip Sabtu/Minggu secara dinamis**.
- **Perbedaan dengan spreadsheet existing:** Formula `ANALYSIS FINISH` saat ini memakai **lookup tetap** (WORK=7→+10 hari kalender, 10→+14, 14→+18, 21→+27, 30→+38) — bukan perhitungan hari kerja dinamis. WORK saat ini juga hanya menerima 5 nilai tetap (7/10/14/21/30), bukan angka bebas. Requirement baru meminta logika pengolahan berbeda dari yang ada, meski input WORK tetap dipakai.
- Website menampilkan: **Estimasi Hari Kerja** + **Estimasi Tanggal Selesai**.
- **Warning:** ditampilkan bila sisa estimasi ≤2 hari kerja **dan** status masih Analisis. Wording final: *"Estimasi penyelesaian tinggal 2 hari kerja. Jika Anda memiliki pertanyaan mengenai progres pengujian, silakan hubungi admin Lab KTNT."*
- Formula teknis tidak dibahas pada tahap ini.

---

## BAGIAN 12 — UI/UX Requirement (Business-Level)

**Landing Page:** identitas resmi Lab KTNT, Logo KAN, background foto laboratorium terbaru, nama & deskripsi resmi, penjelasan tracking real-time, kontak (alamat/email/WA/lokasi) terbaru, footer sesuai identitas terbaru.

**Tracking Page:** menggunakan Nomor Order, timeline 6 tahap (tanpa "Input Data" terpisah, tanpa "Proses Analisis" terpisah), tanpa info Jenis Analisis, Card Estimasi Hari Kerja + Tanggal Selesai, warning saat estimasi ≤2 hari kerja, akses Invoice, Kwitansi (di Timeline), Draft, Sertifikat.

**Payment Page:** pilihan Faktur Pajak/Non Faktur, form NPWP kondisional, info rekening otomatis sesuai kategori, card Invoice, upload bukti bayar.

**Draft Review:** tampilan draft terbaru, tombol Setuju/Minta Revisi, info status keputusan tercatat (khususnya setelah Setuju: info "menunggu admin").

**Survey:** header konteks read-only (Order No./Customer/Jenis Sampel), 14 pertanyaan skala (kombinasi bintang+teks), 1 pertanyaan Kritik & Saran.

**Certificate:** tombol download (aktif setelah survey), info tanggal terbit, info batas revisi 14 hari kerja + kontak WhatsApp admin.

---

## BAGIAN 13 — Notification Requirement

| Event | Email | WhatsApp | In-app Feedback |
|---|---|---|---|
| Order baru (Sampel Diterima) | ✓ | ✓ | — |
| Pembayaran tervalidasi (masuk Analisis) | ✓ | ✓ | — |
| Draft (v1) tersedia | ✓ | ✓ | — |
| Draft revisi tersedia | ✓ | ✓ (wording khusus, beda dari draft awal) | — |
| Customer approval (Setuju) tercatat | — | — | ✓ (feedback bahwa persetujuan tercatat, menunggu admin) |
| Admin "Lanjut ke Pengesahan" (masuk Pengesahan) | ✓ | ✓ | — |
| Sertifikat tersedia | ✓ | ✓ | — |

---

## BAGIAN 14 — Final Data Ownership

| Data | Sumber | Diisi Oleh | Manual/Automatic | Digunakan Untuk |
|---|---|---|---|---|
| Order No., RECEIVED ON, WORK | ORDER (existing) | Admin | Manual | Identitas order, estimasi |
| Kategori Customer | ORDER (baru) | Admin | Manual | Penentu rekening |
| Link/No/Tanggal Invoice | PAYMENT (baru) | Admin | Manual | Trigger status Pembayaran, tampilan Invoice |
| Jenis Faktur, NPWP | PAYMENT (baru) | Customer | Manual (input web) | Data pembayaran |
| Bukti Pembayaran | PAYMENT (existing/proses) | Customer | Manual (upload web) | Validasi admin |
| Status Validasi | PAYMENT (baru) | Admin | Manual | Trigger status Analisis |
| Link Kwitansi | PAYMENT (baru) | Admin | Manual (link) | Tampilan Timeline |
| DATE OF ANALYSIS | PENERIMAAN (existing) | Admin | Manual | Sinyal pendukung status Analisis |
| Versi/Link/Tanggal Draft | DRAFT (baru) | Admin | Manual | Trigger Review Draft |
| Keputusan Customer, Tanggal Keputusan | DRAFT (baru) | Sistem | Otomatis (dari aksi web) | Trigger menuju Pengesahan |
| Tindak Lanjut Admin, Tanggal Tindak Lanjut | DRAFT (baru) | Admin (action) / Sistem (catat tanggal) | Manual (action) + Otomatis (pencatatan) | Trigger status Pengesahan |
| Link/Tanggal Terbit Sertifikat | ORDER/PENERIMAAN (baru) | Admin | Manual (link) | Trigger status Download Sertifikat |
| Data Survey (jawaban, saran) | SURVEY (baru) | Customer | Manual (input web) | Syarat gate download, pelaporan Lab |
| Konteks Survey (Order No., Nama, Jenis Sampel) | ORDER (existing) | Sistem | Otomatis (tarik dari Order) | Tampilan read-only survey |

---

## BAGIAN 15 — Final Open / Pending Items

### A. Requirement yang masih perlu keputusan Lab
1. Trigger konkret status Sampel Diterima → Pembayaran (kandidat: Link Invoice terisi) — belum dikonfirmasi eksplisit sebagai keputusan final oleh Lab.
2. Relasi CODE (I/L/P dst.) yang terbukti merepresentasikan Jenis Analisis Sampel, terhadap Requirement #2 (Jenis Analisis diminta dihapus dari tampilan customer) — karena CODE melekat di ORDER NO. yang dipakai untuk tracking.
3. Skala "Sangat Baik/Baik" pada pertanyaan Akurasi Hasil Uji — apakah memang sengaja berbeda dari skala "Sangat Puas/Puas" di bagian lain, atau ketidaksengajaan formulir.
4. Duplikasi teks pertanyaan Bagian I No.1 dan Bagian II No.1 (hampir identik) — apakah disengaja.
5. Status wajib/opsional (required) untuk tiap pertanyaan survey dan Kritik & Saran.
6. Nama final status gabungan "Analisis" — apakah "Analisis Sampel" (kandidat kuat) sudah final secara redaksional.
7. Materi konten Landing Page (foto, deskripsi resmi, kontak terbaru, izin penggunaan Logo KAN).

### B. Pemetaan data yang bisa diselesaikan saat System Design (bukan blocker)
1. Sumber kolom untuk data "Jenis Sampel" dan "No. Handphone" pada konteks Survey.
2. Struktur Sertifikat — kolom sederhana vs kebutuhan histori (saat ini diputuskan cukup kolom, tanpa histori).
3. Penamaan teknis kolom baru di spreadsheet (working title saat ini dapat disesuaikan).
4. Detail UX kecil (placeholder contoh format input tracking, dsb.).

### C. Optional / Future Enhancement
1. Riwayat versi Draft yang dapat dilihat customer.
2. Indikator "terakhir diperbarui pada [waktu]" di halaman status.
3. Hari libur nasional dalam perhitungan estimasi hari kerja.
4. Wording terpisah untuk kondisi estimasi sudah terlambat (bukan hanya "tinggal 2 hari").
5. Histori versi Sertifikat (bila suatu saat dibutuhkan Lab).

---

## BAGIAN 16 — Final Decision Checklist

```
[FINAL] Business Flow
[FINAL] Status Lifecycle
[FINAL] Payment Flow
[FINAL] Draft Flow
[FINAL] Pengesahan Flow
[FINAL] Certificate Flow
[FINAL] Survey Flow
[FINAL] Tracking UX
[FINAL] Landing Page Requirement
[FINAL] Automation Principle
[FINAL] Spreadsheet Direction
[FINAL] Notification Requirement
```

```
[PENDING] Trigger Sampel Diterima → Pembayaran (konfirmasi Lab)
[PENDING] Relasi CODE/Jenis Analisis dengan ORDER NO. sebagai kode tracking (konfirmasi Lab)
[PENDING] Inkonsistensi skala Akurasi Hasil Uji (konfirmasi Lab)
[PENDING] Duplikasi pertanyaan Bagian I/II No.1 (konfirmasi Lab)
[PENDING] Status required tiap pertanyaan survey (konfirmasi Lab)
[PENDING] Nama final status gabungan "Analisis" (konfirmasi redaksional Lab)
[PENDING] Materi konten Landing Page (dari Lab)
[PENDING MAPPING] Sumber kolom Jenis Sampel & No. Handphone untuk Survey
[PENDING MAPPING] Struktur data Sertifikat (kolom vs sheet)
```

---

## BAGIAN 17 — Readiness Check

# READY FOR SYSTEM DESIGN?

**YES**

Seluruh business flow inti, status lifecycle, automation trigger, payment flow, draft flow, pengesahan flow, certificate flow, survey flow, tracking UX, landing page requirement, prinsip otomatisasi, arah spreadsheet, dan notification requirement sudah **FINAL** dan konsisten satu sama lain. Item yang tersisa (Bagian 15.A dan 15.B) bersifat **klarifikasi lanjutan dan pemetaan data teknis**, bukan hal yang menghalangi dimulainya tahap System Design — sesuai prinsip bahwa pending mapping bukan blocker requirement.

Requirement sudah cukup matang untuk masuk ke tahap berikutnya:
1. System Architecture
2. Data Model
3. Spreadsheet Architecture
4. API Contract
5. Frontend Flow
6. Implementation Planning

*(Keenam hal di atas tidak dibahas pada dokumen ini sesuai batasan tahap Consolidation.)*
