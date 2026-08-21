# DATA MODEL & SPREADSHEET MAPPING SPECIFICATION v1.0
## Sistem Tracking Sampel Laboratorium KTNT UNPAD

*Sumber: FINAL REQUIREMENT BASELINE v1.0, SYSTEM DESIGN SPECIFICATION v1.0, dan file `Testing NEW TRIAL 2026 PENERIMAAN CONTOH LAB. KTNT.xlsx` (diverifikasi ulang langsung dari file). Tidak ada kode, SQL, atau API contract di dokumen ini.*

---

## BAGIAN 1 — Spreadsheet Inventory

Terverifikasi ulang: file memiliki 11 sheet — `DB`, `ORDER`, `PARAMETER`, `FORM`, `PENERIMAAN`, `PAYMENT`, `LABEL`, `FORM KWITANSI`, `CALC`, `PAR`, `KWITANSI ` (nama sheet ini memiliki spasi trailing pada file asli).

| Sheet | Fungsi Existing | Digunakan Sistem Tracking? | Dipertahankan? | Perlu Perubahan? |
|---|---|---|---|---|
| ORDER | Entri order/sampel baru — sumber data induk | Ya, inti | Ya | Ya — tambah kolom |
| PENERIMAAN | View turunan ORDER + data estimasi (WORK, DATE OF ANALYSIS, ANALYSIS FINISH) | Ya, inti | Ya | Tidak wajib (lihat Bagian 3) |
| PAYMENT | Ledger pembayaran, kwitansi | Ya, inti | Ya | Ya — tambah kolom |
| PARAMETER | Matriks parameter uji per order (231 kolom) | Tidak langsung | Ya | Tidak |
| DB | Tabel referensi lintas domain (staf, brand, komoditas, rekening) | Tidak langsung, tapi jadi rujukan pemahaman | Ya | Tidak |
| PAR | Legenda kode huruf sampel (S/O/L/I/C/B/M/P/A) → parameter uji | Tidak langsung, tapi relevan untuk memahami CODE | Ya | Tidak |
| KWITANSI (spasi) | Data detail kwitansi untuk dokumen cetak | Sebagian — sumber data kwitansi | Ya | Tidak wajib |
| FORM | Template surat/dokumen resmi cetak | Tidak | Ya | Tidak |
| FORM KWITANSI | Template cetak kwitansi | Tidak | Ya | Tidak |
| LABEL | Template label/stiker (data terstruktur tidak ditemukan) | Tidak | Ya | Tidak |
| CALC | Sheet kalkulasi pendukung PARAMETER (406 kolom) | Tidak | Ya | Tidak |

**Prinsip:** Seluruh sheet existing **dipertahankan** — tidak ada satu pun yang dihapus, termasuk yang tidak dipakai langsung oleh sistem tracking, karena tetap dipakai untuk keperluan operasional Lab lainnya (cetak dokumen, parameter uji, dsb.).

---

## BAGIAN 2 — ORDER Sheet Mapping

| Field Existing | Fungsi | Dipakai Sistem? | Sumber | Pemilik Data | Perlu Perubahan? |
|---|---|---|---|---|---|
| CODE OF SAMPLE (kolom B) | Header ada, tidak terisi pada data nyata | Tidak | Admin (tidak aktif dipakai) | Admin | Tidak |
| CODE (kolom C, header kosong pada file) | Kode huruf jenis analisis (I/L/P dst.) | Ya — bagian pembentuk ORDER NO. | Admin | Admin | Tidak — EXISTING & SUFFICIENT |
| NO (kolom D) | Nomor urut order | Ya — komponen ORDER NO. | Admin | Admin | Tidak |
| RECEIVED ON (kolom E) | Tanggal sampel diterima | Ya — trigger status Sampel Diterima, basis estimasi | Admin | Admin | Tidak |
| D (kolom F) | Duplikat tanggal (=E) | Tidak dipakai sistem | Admin | Admin | Tidak |
| WORK (kolom G) | Nilai kategori hari kerja (7/10/14/21/30) | Ya — input estimasi | Admin | Admin | Tidak, tapi cara olah berbeda (lihat Bagian 3) |
| NO SAMPLE — mislabeled (kolom H) | **ORDER NO. sesungguhnya**, formula gabungan `D & tanggal & (C)` | Ya — kredensial tracking | Formula (auto dari D,E/F,C) | System (formula spreadsheet) | Tidak diubah — FINAL sesuai baseline |
| NAME (kolom I) | Nama customer/perusahaan | Ya | Admin | Admin | Tidak |
| ADDRESS (kolom J) | Alamat customer | Tidak untuk tracking inti | Admin | Admin | Tidak |
| CONTACT s/d RECEIVER (kolom K–AD) | Data administratif sampling | Tidak untuk tracking inti (kecuali sebagian untuk Pending Mapping Survey) | Admin | Admin | Tidak |

### Field Baru yang Diperlukan

| Field (nama konseptual) | Tujuan | Diisi Oleh | Manual/Automatic | Requirement Terkait |
|---|---|---|---|---|
*(Tidak ada field Kategori Customer di ORDER — dikoreksi. Rekening Pembayaran dipindahkan ke domain PAYMENT, lihat Bagian 4.)*

---

## BAGIAN 3 — PENERIMAAN Sheet Mapping

| Aspek | Kondisi |
|---|---|
| Data existing yang masih digunakan | ORDER NO. (kunci lookup ke ORDER), KODE, RECEIVED ON, DATE OF ANALYSIS, WORK, ANALYSIS FINISH |
| Data yang perlu dipertahankan | Seluruhnya — tidak ada penghapusan |
| Data yang perlu ditambahkan | Tidak ada kolom baru wajib di PENERIMAAN |
| Data sumber estimasi | WORK (input), RECEIVED ON (titik mulai) |
| Data trigger status | **DATE OF ANALYSIS** — sinyal pendukung bahwa proses analisis telah dimulai admin |

**WORK existing vs Estimasi Hari Kerja (requirement baru):**
- **WORK existing:** nilai kategorikal tetap, hanya menerima 5 nilai (7/10/14/21/30). Diolah lewat formula `ANALYSIS FINISH` yang memakai **lookup tetap** (mis. WORK=14 → RECEIVED ON + 18 hari kalender) — bukan penghitungan hari kerja dinamis, dan tidak melewati (skip) Sabtu/Minggu secara live.
- **Estimasi Hari Kerja (requirement baru):** WORK tetap dipakai sebagai **input** (jumlah hari kerja), namun **cara mengolahnya menjadi Tanggal Selesai berbeda** — harus menghitung maju sejumlah WORK hari sambil melewati Sabtu/Minggu secara dinamis, bukan memakai tabel lookup tetap yang ada sekarang.
- **GAP:** Ini bukan sekadar "pakai data yang sudah ada", melainkan **penggantian logika pengolahan** dari lookup tetap menjadi perhitungan dinamis. Field WORK itu sendiri **tidak perlu diubah** — hanya cara sistem membaca dan mengolahnya yang berbeda dari formula existing di PENERIMAAN.
- Tidak dibahas formula teknis pada dokumen ini, sesuai batasan.

**Status penerimaan / Order No. di PENERIMAAN:** Tidak ditemukan kolom "status" eksplisit di PENERIMAAN — konsisten dengan prinsip baseline bahwa status tidak lagi disimpan sebagai dropdown manual, melainkan diturunkan dari event data (DATE OF ANALYSIS terisi, dsb.).

---

## BAGIAN 4 — PAYMENT Sheet Mapping

| Data | Existing/New | Sumber | Diisi Oleh | Digunakan Untuk |
|---|---|---|---|---|
| Nama, CODE, ORDER NO. | Existing | PAYMENT | Admin (formula sebagian) | Identitas transaksi |
| TOTAL, DISKON, PERCEPATAN, REFORMULA, PAJAK, JUMLAH | Existing | PAYMENT | Admin | Perhitungan tagihan |
| SISA | Existing (formula) | PAYMENT | System (formula) | Indikator sisa tagihan — **bukan** dipakai sebagai trigger validasi (lihat Bagian 9) |
| NOMINAL, TANGGAL | Existing | PAYMENT | Admin | Rincian pembayaran per entri |
| CARA | Existing | PAYMENT | Admin | Metode transaksi tercatat — **berbeda konteks** dari kebutuhan tampilan rekening pra-bayar (lihat catatan Rekening di bawah) |
| NO. KWITANSI (nomor) | Existing | PAYMENT (formula gabungan) | Admin/System | Identitas kwitansi |
| **Faktur Pajak / Non Faktur** | **New Field** — `JENIS_FAKTUR` | — | Customer | Requirement F baseline |
| **NPWP** | **New Field** — `NPWP` | — | Customer | Wajib bila Faktur Pajak |
| **Link/No/Tanggal Invoice** | **New Field** — `LINK_INVOICE`, `NO_INVOICE`, `TANGGAL_INVOICE` | — | Admin | Trigger status Pembayaran; tampilan Invoice ke customer |
| **Bukti Pembayaran (file)** | Belum ada field link eksplisit — **New Field** `LINK_BUKTI_BAYAR` | — | Customer (upload) | Dasar Admin melakukan validasi |
| **Status Validasi Pembayaran** | **New Field** — `STATUS_VALIDASI` (PENDING/VALID/INVALID) | — | Admin | Trigger status Analisis |
| **Link Kwitansi (dokumen)** | **New Field** — `LINK_KWITANSI` | — | Admin | Tampilan Timeline (kwitansi) |
| **Rekening Pembayaran** | **New Field** — `REKENING_PEMBAYARAN` (BNI/Mandiri) | — | Admin | Tampilan rekening ke Customer (BNI=55414267, Mandiri=63726257); dipilih langsung, bukan hasil kategori |

### Rekening Pembayaran

`[DIKOREKSI]` Tidak ada field Kategori Customer. Admin memilih **Rekening Pembayaran** secara langsung per order: BNI (No. 55414267) atau Mandiri (No. 63726257). Customer tidak memilih kategori maupun rekening — website hanya menampilkan rekening yang sudah dipilih Admin.

**Temuan existing:** Sheet `DB` memiliki tabel referensi `CODE OF PAYMENT` → `REKENING` (01/M→Bank Mandiri, 02/C→Cash, 03/B→BNI). Mapping ini terikat ke kolom `CARA` di PAYMENT yang dipilih Admin **setelah** pembayaran terjadi — berbeda konteks dari field `REKENING_PEMBAYARAN` baru yang perlu diketahui **sebelum** customer membayar. Tabel referensi rekening di `DB` **tetap dipertahankan apa adanya** (tidak dihapus/diubah), tetap relevan untuk pencatatan `CARA` transaksi aktual oleh Admin.

**NEED NEW FIELD:** `REKENING_PEMBAYARAN` (BNI/Mandiri) di sheet PAYMENT, diisi Admin langsung.

**CASH:** Field `CARA` existing tetap mendukung nilai CASH secara struktural (dipakai untuk transaksi non-web/internal Lab), namun **tidak ditampilkan sebagai opsi di Frontend Customer** — ini murni batasan tampilan, bukan perubahan struktur data existing.

---

## BAGIAN 5 — DRAFT Sheet

**NEED NEW SHEET.** Alasan: data draft bersifat repeatable (0–N versi per order termasuk revisi); memaksakan ke kolom di sheet existing akan menciptakan pola tidak scalable (`link_v1, status_v1, link_v2, ...`).

| Field (konseptual) | Diisi Oleh | Automatic/Manual |
|---|---|---|
| Order No. | Admin | Manual |
| Versi Draft | Admin | Manual (bertambah tiap draft baru) |
| Link Draft | Admin | Manual |
| Tanggal Upload | Admin | Manual |
| Keputusan Customer (SETUJU/REVISI) | System | Otomatis (ditulis dari aksi Customer di web) |
| Tanggal Keputusan | System | Otomatis |
| Tindak Lanjut Admin (MENUNGGU TINDAKAN/LANJUT KE PENGESAHAN) | Admin | Manual (business action, bukan status tracking) |
| Tanggal Tindak Lanjut | System | Otomatis |

**Primary business key konseptual:** kombinasi `Order No. + Versi Draft` — setiap baris merepresentasikan satu versi draft spesifik untuk satu order.

**Relasi dengan Order:** N:1 — satu Order dapat memiliki banyak baris Draft (satu per versi).

**Relasi antar versi:** Tidak ada relasi eksplisit antar baris versi (bukan rantai/linked-list) — sistem cukup mengidentifikasi "draft aktif/terbaru" sebagai baris dengan Versi Draft tertinggi untuk Order NO. yang sama. Keputusan Customer **melekat pada baris versi yang sama** yang sedang direview, sehingga tidak ambigu ketika terjadi siklus revisi berulang (contoh: Draft v1 → Customer REVISI; Draft v2 → Customer SETUJU — dua keputusan berbeda tersimpan pada dua baris berbeda, bukan menimpa satu sama lain).

**Diisi Admin:** Order No., Versi Draft, Link Draft, Tanggal Upload, Tindak Lanjut Admin.
**Ditulis System:** Keputusan Customer, Tanggal Keputusan, Tanggal Tindak Lanjut.

---

## BAGIAN 6 — SURVEY Sheet

**NEED NEW SHEET.** Alasan: struktur data (14 jawaban + saran per order) sama sekali berbeda dari sheet operasional manapun.

**Data konseptual yang perlu disimpan** (nama field final belum ditentukan, ini murni daftar kebutuhan data):
- Order No. (penghubung, otomatis dari konteks tracking yang sedang dibuka — tidak diinput manual customer)
- Konteks read-only: Nama Customer, Jenis Sampel (diambil dari Order — sumber kolom presisi: PENDING MAPPING, lihat Bagian 18)
- Tanggal Submit
- Jawaban Pertanyaan Bagian I (4 jawaban)
- Jawaban Pertanyaan Bagian II (3 jawaban)
- Jawaban Pertanyaan Bagian III (6 jawaban)
- Jawaban Pertanyaan Bagian IV — Akurasi Hasil Uji (1 jawaban)
- Kritik & Saran (isian bebas)

### A. Satu Row per Survey/Order — vs — B. Satu Row per Jawaban

| Kriteria | A. Satu Row per Survey | B. Satu Row per Jawaban |
|---|---|---|
| Kesesuaian dengan pola sheet existing (ORDER, PAYMENT, PENERIMAAN semuanya "satu baris = satu entitas/transaksi") | Tinggi — konsisten | Rendah — pola baru yang berbeda dari kebiasaan spreadsheet Lab |
| Kemudahan Admin membaca hasil satu customer | Tinggi — semua jawaban dalam satu baris, mudah discan | Rendah — harus filter/gabung 15 baris untuk satu customer |
| Kemudahan pelaporan rekap (rata-rata per pertanyaan, dsb.) | Sedang — butuh olah kolom | Tinggi secara teori, tapi Lab kemungkinan besar tidak punya tooling pivot otomatis di luar Excel manual |
| Kesesuaian dengan flow submit (satu kali submit = satu entri) | Tinggi — natural, satu submit = satu baris | Rendah — satu submit menghasilkan 15 baris sekaligus, tidak natural |

**Rekomendasi: A — Satu row per Survey/Order.** Alasan utama: pola ini konsisten dengan seluruh sheet existing yang sudah dipakai Lab (ORDER, PAYMENT, PENERIMAAN semuanya memakai pola "satu baris = satu entitas"), sehingga lebih mudah dipahami Admin tanpa perlu belajar pola baru, dan selaras dengan prinsip Minimal Change (Bagian 13).

---

## BAGIAN 7 — Certificate Data

**Requirement:** Link Sertifikat, Tanggal Sertifikat, status ketersediaan, info batas revisi 14 hari kerja (dihitung, bukan disimpan sebagai field terpisah), akses ke sertifikat terbaru. Tanpa histori versi.

**Rekomendasi: COLUMN EXISTING (bukan New Sheet).**

**Alasan:** Sertifikat bersifat 1:1 terhadap Order (tidak repeatable seperti Draft) — sesuai keputusan final baseline bahwa histori versi sertifikat tidak diperlukan untuk requirement saat ini. Sheet baru hanya dijustifikasi untuk data yang bersifat repeatable/berulang; karena sertifikat cukup di-overwrite saat revisi, kolom biasa di ORDER (atau PENERIMAAN) sudah memadai dan lebih sederhana — konsisten dengan prinsip Minimal Change.

**NEED NEW FIELD:** `LINK_SERTIFIKAT`, `TANGGAL_TERBIT_SERTIFIKAT` **[DESIGN DECISION — nama sementara, lokasi ORDER vs PENERIMAAN masih bisa ditentukan saat implementasi]**.

**Batas revisi 14 hari kerja:** dihitung dari `TANGGAL_TERBIT_SERTIFIKAT` + 14 hari kerja — tidak memerlukan field tambahan (hasil hitung, bukan data tersimpan).

---

## BAGIAN 8 — Notification Data

**Bedakan Notification Event vs Notification Log:**
- **Notification Event** — pemicu bisnis (mis. "Pembayaran tervalidasi") yang **bukan data tersimpan**, melainkan hasil turunan dari perubahan data lain (Status Validasi = VALID, dsb.) yang sudah tercakup di domain Payment/Draft/Certificate. Tidak memerlukan sheet/field tersendiri untuk merepresentasikan event itu sendiri.
- **Notification Log** — catatan bahwa notifikasi **benar-benar terkirim** (Email/WhatsApp), untuk keperluan audit/troubleshooting. Ini data konseptual yang **terpisah** dari event pemicunya.

**Rekomendasi:** Notification Log **tidak perlu sheet spreadsheet tersendiri** — ini murni kebutuhan pencatatan sistem (Backend/Database), bukan sesuatu yang perlu dilihat/diisi Admin di Google Sheets. Sesuai batasan dokumen ini (fokus spreadsheet & data model konseptual, bukan database), Notification Log dicatat sebagai kebutuhan data konseptual yang **penempatan teknisnya (spreadsheet vs database-only) adalah DESIGN DECISION** untuk tahap Automation Specification berikutnya, bukan keputusan yang perlu diputuskan sekarang.

**Data konseptual Notification Log (bila dibutuhkan):** Order No. terkait, Event pemicu, Kanal (Email/WhatsApp), Waktu kirim, Status kirim (terkirim/gagal).

---

## BAGIAN 9 — Status Data

| Status | Data/Activity Trigger | Sumber Data | Pelaku | Automatic? |
|---|---|---|---|---|
| Sampel Diterima | ORDER NO. + RECEIVED ON tersimpan | ORDER | Admin | Ya |
| Pembayaran | `LINK_INVOICE` terisi | PAYMENT (baru) | Admin | Ya |
| Analisis | `STATUS_VALIDASI` = VALID | PAYMENT (baru) | Admin | Ya |
| Review Draft | Draft v1 tersedia (baris baru di sheet DRAFT) | DRAFT (baru) | Admin | Ya |
| **Pengesahan** | **Customer Decision = SETUJU AND Admin Action = LANJUT KE PENGESAHAN** | DRAFT (baru) — kedua field pada baris versi draft terbaru | Customer (syarat 1) + Admin (syarat 2, pemicu akhir) | Ya, dengan syarat ganda — Customer SETUJU sendiri **tidak cukup** |
| Download Sertifikat | `LINK_SERTIFIKAT` terisi | ORDER/PENERIMAAN (baru) | Admin | Ya |

*(Survey adalah gate di dalam status Download Sertifikat, bukan status lifecycle terpisah — konsisten dengan State Machine di System Design Specification.)*

---

## BAGIAN 10 — Data Ownership Matrix

| Data | Customer | Admin | System | Existing Spreadsheet? |
|---|---|---|---|---|
| Order | Read | Create/Update | Read | Ya (ORDER) |
| Customer (Nama/Alamat/Kontak) | Read | Create/Update | Read | Ya (ORDER) |
| Rekening Pembayaran | Read | Create/Update | Read | Tidak — NEED NEW FIELD (di PAYMENT) |
| Invoice | Read | Create/Update | Read | Tidak — NEED NEW FIELD (di PAYMENT) |
| Bukti Pembayaran | Create | Read | Read/Store | Tidak — NEED NEW FIELD |
| Status Validasi Pembayaran | Read | Create/Update | Read (pemicu status) | Tidak — NEED NEW FIELD |
| NPWP | Create | Read | Read | Tidak — NEED NEW FIELD |
| Jenis Faktur | Create | Read | Read | Tidak — NEED NEW FIELD |
| Kwitansi | Read | Create/Update | Read | Tidak — NEED NEW FIELD |
| Draft (link, versi) | Read | Create/Update | Read | Tidak — NEED NEW SHEET |
| Keputusan Draft (Customer) | Create | Read | Create (menulis dari aksi Customer) | Tidak — NEED NEW SHEET |
| Tindak Lanjut Admin | Read | Create/Update | Read (validasi syarat) | Tidak — NEED NEW SHEET |
| Certificate | Read | Create/Update | Read | Tidak — NEED NEW FIELD |
| Survey | Create | Read | Create (konteks read-only) | Tidak — NEED NEW SHEET |
| Notification | — | — | Create/Read | Tidak berlaku langsung (lihat Bagian 8) |
| Tracking Status | Read | — (tidak boleh Update manual) | Create/Update (satu-satunya penulis) | Diturunkan, bukan disimpan sebagai field manual |

---

## BAGIAN 11 — Data Flow Matrix

| Data | Initial Source | Destination | Trigger | Perubahan Berikutnya |
|---|---|---|---|---|
| Order | Admin (ORDER sheet) | System → Customer Tracking | Baris ORDER baru lengkap | Status: Sampel Diterima |
| Invoice | Admin (PAYMENT sheet) | System → Customer (tampilan) | `LINK_INVOICE` terisi | Status: Pembayaran |
| Bukti Pembayaran | Customer (upload web) | System/Storage (Drive) → Admin (terlihat di Sheets) | Upload berhasil | Menunggu Admin validasi |
| Status Validasi | Admin (PAYMENT sheet) | System → Customer (notifikasi) | Admin set VALID | Status: Analisis |
| Draft | Admin (DRAFT sheet) | System/Storage → Customer | Baris draft baru | Status: Review Draft (bila v1) |
| Keputusan Customer | Customer (web) | System → DRAFT sheet (tulis balik) | Klik Setuju/Revisi | Status tetap; menunggu Admin (bila SETUJU) atau Admin proses revisi (bila REVISI) |
| Tindak Lanjut Admin | Admin (DRAFT sheet) | System → Customer (notifikasi) | Admin pilih "Lanjut ke Pengesahan" + syarat Keputusan Customer=SETUJU terpenuhi | Status: Pengesahan |
| Sertifikat | Admin (ORDER/PENERIMAAN) | System → Customer | `LINK_SERTIFIKAT` terisi | Status: Download Sertifikat |
| Survey | Customer (web) | System → SURVEY sheet (tulis) | Submit survey | Gate Download terbuka (bukan perubahan status) |

---

## BAGIAN 12 — Gap Analysis

### GAP 1 — Existing field sudah cukup
- ORDER NO. (kredensial tracking) — kolom H ORDER.
- RECEIVED ON, WORK (input estimasi) — ORDER/PENERIMAAN.
- DATE OF ANALYSIS — sinyal pendukung status Analisis, PENERIMAAN.
- Nomor Kwitansi — PAYMENT (formula existing).
- Data customer dasar (Nama, Alamat, Kontak) — ORDER.

### GAP 2 — Need New Field
- `REKENING_PEMBAYARAN` (PAYMENT).
- `LINK_INVOICE`, `NO_INVOICE`, `TANGGAL_INVOICE` (PAYMENT).
- `LINK_BUKTI_BAYAR` (PAYMENT).
- `STATUS_VALIDASI` (PAYMENT).
- `JENIS_FAKTUR`, `NPWP` (PAYMENT).
- `LINK_KWITANSI` (PAYMENT).
- `LINK_SERTIFIKAT`, `TANGGAL_TERBIT_SERTIFIKAT` (ORDER/PENERIMAAN).

### GAP 3 — Need New Sheet
- DRAFT (versi, link, keputusan, tindak lanjut admin).
- SURVEY (jawaban 14 pertanyaan + saran, konteks Order).

### GAP 4 — Existing data tetapi perlu perubahan workflow
- WORK: field tetap, tapi **cara pengolahan** menjadi Tanggal Selesai berubah dari lookup tetap menjadi hitung hari-kerja dinamis (skip Sabtu/Minggu).
- CARA (metode pembayaran di PAYMENT): field tetap dipertahankan apa adanya (masih mendukung CASH secara struktural untuk transaksi non-web), tapi **tidak lagi menjadi acuan tampilan rekening ke customer** — digantikan field baru `REKENING_PEMBAYARAN` yang dipilih Admin langsung.

### GAP 5 — Tidak perlu perubahan spreadsheet
- Seluruh sheet PARAMETER, DB, PAR, FORM, FORM KWITANSI, LABEL, CALC, KWITANSI — dipertahankan seluruhnya tanpa modifikasi, karena masih relevan untuk kebutuhan operasional Lab lainnya.

---

## BAGIAN 13 — Minimal Change Principle

### MINIMAL CHANGE VERSION
- ORDER: tidak ada kolom tambahan untuk rekening (dipindahkan ke PAYMENT).
- PAYMENT: +7 kolom (Invoice x3, Bukti Bayar, Status Validasi, Faktur x2, Kwitansi).
- ORDER/PENERIMAAN: +2 kolom (Sertifikat).
- +2 sheet baru (DRAFT, SURVEY) — hanya untuk data yang genuinely repeatable/berstruktur berbeda.
- Tidak ada formula existing yang diubah; tidak ada kolom/sheet existing yang dihapus.

### IDEAL STRUCTURE VERSION
- Serupa Minimal Change Version, namun dengan tambahan: sheet terpisah untuk Certificate (mendukung histori versi meski belum dibutuhkan), sheet terpisah untuk Notification Log (agar seluruh riwayat notifikasi terlihat langsung oleh Admin di Sheets), serta kemungkinan menstandarkan ulang beberapa header yang saat ini tidak akurat (mis. kolom di PENERIMAAN berlabel angka "508.0"/"458.0" yang sebenarnya berisi Nama/Alamat).

### Rekomendasi
**MINIMAL CHANGE VERSION** adalah pilihan paling aman untuk project ini. Alasan: seluruh requirement final saat ini (baseline) secara eksplisit **tidak membutuhkan** histori sertifikat maupun notification log yang terlihat Admin di Sheets — menambahkannya sekarang berarti membangun struktur untuk kebutuhan yang belum ada, bertentangan dengan prinsip yang sudah disepakati ("jangan membuat perubahan struktur yang tidak perlu"). Perbaikan header yang tidak akurat di sheet existing juga **tidak termasuk requirement saat ini** dan berisiko mengganggu formula existing yang sudah berjalan — sebaiknya tidak disentuh kecuali ada kebutuhan eksplisit dari Lab.

---

## BAGIAN 14 — Final Spreadsheet Structure

### ORDER
**Existing:** CODE OF SAMPLE, CODE (I/L/P), NO, RECEIVED ON, WORK, ORDER NO. (kolom H), NAME, ADDRESS, CONTACT, dan seluruh kolom administratif sampling lainnya.
**New:** `LINK_SERTIFIKAT`, `TANGGAL_TERBIT_SERTIFIKAT`. *(Tidak ada kolom kategori/rekening di ORDER — lihat PAYMENT.)*
*Alasan: nilai tunggal per order, tidak repeatable, paling dekat secara siklus hidup dengan data order induk.*

### PENERIMAAN
**Existing:** ORDER NO., KODE, RECEIVED ON, DATE OF ANALYSIS, WORK, ANALYSIS FINISH.
**New:** Tidak ada.
*Alasan: seluruh kebutuhan baru sudah tercakup di ORDER/PAYMENT/DRAFT; PENERIMAAN tetap berperan sebagai view pendukung estimasi.*

### PAYMENT
**Existing:** Nama, CODE, ORDER NO., TOTAL, DISKON, PERCEPATAN, REFORMULA, PAJAK, JUMLAH, SISA, NO, NOMINAL, TANGGAL, CARA, NO. KWITANSI, TANGGAL TEXT, KETERANGAN.
**New:** `LINK_INVOICE`, `NO_INVOICE`, `TANGGAL_INVOICE`, `LINK_BUKTI_BAYAR`, `STATUS_VALIDASI`, `JENIS_FAKTUR`, `NPWP`, `LINK_KWITANSI`.
*Alasan: seluruh data ini nilai tunggal per transaksi pembayaran, menyambung alami ke data finansial existing.*

### DRAFT (New Sheet)
Order No., Versi Draft, Link Draft, Tanggal Upload, Keputusan Customer, Tanggal Keputusan, Tindak Lanjut Admin, Tanggal Tindak Lanjut.
*Alasan: data repeatable (0–N versi per order), tidak scalable sebagai kolom.*

### SURVEY (New Sheet)
Order No., konteks (Nama, Jenis Sampel — dari Order), Tanggal Submit, 14 jawaban skala, Kritik & Saran.
*Alasan: struktur data sama sekali berbeda dari sheet operasional manapun; satu row per survey/order (Bagian 6).*

### CERTIFICATE
Cukup kolom di ORDER (`LINK_SERTIFIKAT`, `TANGGAL_TERBIT_SERTIFIKAT`) — **tidak perlu sheet baru**.
*Alasan: 1:1 terhadap order, tanpa histori versi sesuai keputusan final.*

### NOTIFICATION
Tidak memerlukan representasi di spreadsheet — murni kebutuhan Backend/Database (lihat Bagian 8). **DESIGN DECISION** untuk tahap Automation Specification apakah tetap perlu log terlihat di Sheets.

---

## BAGIAN 15 — Automation Data Dependency

| Event | Required Data | Source | Validation | Result |
|---|---|---|---|---|
| Order Baru | ORDER NO., RECEIVED ON | ORDER | Kedua field harus terisi | Status: Sampel Diterima |
| Invoice Tersedia | LINK_INVOICE | PAYMENT | Link valid (format URL) | Status: Pembayaran |
| Validasi Pembayaran | STATUS_VALIDASI = VALID | PAYMENT | Nilai harus persis "VALID" | Status: Analisis |
| Upload Draft | Order No., Link Draft, Versi Draft | DRAFT | Versi harus berurutan/valid; link valid | Status: Review Draft (bila versi=1) |
| Customer Setuju | Keputusan Customer = SETUJU | DRAFT (ditulis dari web) | Berlaku untuk versi draft terbaru | Status tetap Review Draft; menunggu Admin |
| Customer Minta Revisi | Keputusan Customer = REVISI | DRAFT (ditulis dari web) | Berlaku untuk versi draft terbaru | Status tetap Review Draft; Admin diberi sinyal |
| Upload Draft Revisi | Order No., Link Draft baru, Versi Draft (increment) | DRAFT | Versi sebelumnya harus berstatus REVISI | Status tetap Review Draft; notifikasi khusus |
| **Admin Lanjut Pengesahan** | **Keputusan Customer = SETUJU (pada versi draft terbaru) AND Tindak Lanjut Admin = LANJUT KE PENGESAHAN** | DRAFT | **Kedua syarat wajib terpenuhi bersamaan**; jika Keputusan Customer belum SETUJU, action Admin tidak menghasilkan perubahan status | Status: Pengesahan |
| Sertifikat Tersedia | LINK_SERTIFIKAT | ORDER | Link valid | Status: Download Sertifikat |
| Survey Selesai | Order No. + 14 jawaban terisi | SURVEY | Seluruh jawaban wajib terisi (lihat Bagian 16) | Gate Download terbuka (bukan perubahan status) |

---

## BAGIAN 16 — Data Validation Requirement

| Domain | Rule Bisnis |
|---|---|
| Order | ORDER NO. harus unik (mengikuti format existing `NNNN/MM/YYYY(CODE)`); RECEIVED ON wajib terisi sebelum order dianggap valid. |
| NPWP | Wajib terisi **hanya jika** Jenis Faktur = Faktur Pajak; format persis (jumlah digit) belum ditentukan di baseline — **PENDING MAPPING**. |
| Payment | STATUS_VALIDASI hanya boleh salah satu dari PENDING/VALID/INVALID; transisi ke Analisis hanya terjadi dari nilai VALID. |
| Invoice | LINK_INVOICE harus berupa link valid sebelum dianggap "tersedia" (mencegah trigger status keliru dari data kosong/rusak). |
| Draft | Versi Draft harus berurutan (tidak boleh loncat); Keputusan Customer hanya boleh diisi sekali per versi draft (mencegah perubahan keputusan setelah tercatat — **DESIGN DECISION**, perlu dikonfirmasi apakah customer boleh mengubah pikiran sebelum Admin bertindak). |
| Decision (Tindak Lanjut Admin) | "Lanjut ke Pengesahan" hanya valid diterapkan bila Keputusan Customer pada versi draft yang sama = SETUJU — validasi ini wajib dilakukan sistem, bukan diasumsikan benar dari input Admin. |
| Certificate | LINK_SERTIFIKAT harus berupa link valid; overwrite diperbolehkan tanpa validasi tambahan (sesuai keputusan tanpa histori). |
| Survey | Seluruh 14 pertanyaan skala harus terjawab sebelum submit diterima — **status wajib/opsional per pertanyaan masih PENDING (baseline Open Question)**; Kritik & Saran sifatnya isian bebas, status wajib/opsional juga PENDING. |

---

## BAGIAN 17 — Final Data Model Summary

| Domain | Data Utama | Source | Owner | Relationship Konseptual |
|---|---|---|---|---|
| Order | ORDER NO., RECEIVED ON, WORK | ORDER | Admin | Induk bagi seluruh domain lain |
| Customer | Nama, Alamat, Kontak | ORDER | Admin | 1 Customer : N Order |
| Payment | Invoice, Faktur/NPWP, Bukti Bayar, Status Validasi, Kwitansi | PAYMENT | Admin (sebagian) + Customer (sebagian) | N Payment : 1 Order |
| Draft | Versi, Link, Keputusan Customer, Tindak Lanjut Admin | DRAFT (baru) | Admin (sebagian) + Customer (sebagian) + System (sebagian) | N Draft : 1 Order |
| Certificate | Link, Tanggal Terbit | ORDER (kolom baru) | Admin | 1 Certificate : 1 Order |
| Survey | 14 jawaban, Kritik & Saran | SURVEY (baru) | Customer | 1 Survey : 1 Order |
| Notification | Event, Kanal, Status Kirim | Backend/Database (bukan Sheets) | System | N Notification : 1 Order |
| Tracking/Status | Status aktif, riwayat transisi | Diturunkan dari seluruh domain di atas | System (satu-satunya penulis) | 1 Status aktif + N riwayat : 1 Order |

---

## BAGIAN 18 — Pending Mapping

### BLOCKER
*(Tidak ada — tidak ditemukan hal yang benar-benar menghalangi tahap berikutnya.)*

### NON-BLOCKER
- Sumber kolom presisi untuk "Jenis Sampel" dan "No. Handphone" pada konteks Survey.
- Trigger pasti Sampel Diterima → Pembayaran (working assumption: LINK_INVOICE terisi) — masih menunggu konfirmasi eksplisit Lab, namun sudah cukup jelas untuk dipakai sebagai basis desain berikutnya.
- Relasi CODE (I/L/P) terhadap ORDER NO. sebagai kode tracking dan implikasinya terhadap Requirement #2.
- Format/panjang digit NPWP yang valid.
- Materi konten Landing Page.

### DESIGN DECISION
- Nama final seluruh field baru (working title di dokumen ini bersifat sementara, bisa disesuaikan gaya penamaan Admin).
- Lokasi kolom Sertifikat — di ORDER atau PENERIMAAN (keduanya memungkinkan, tinggal pilih salah satu untuk konsistensi).
- Apakah Notification Log perlu representasi di Sheets atau cukup Database-only.
- Apakah Keputusan Customer pada Draft boleh diubah sebelum Admin bertindak, atau terkunci setelah submit pertama.

### OPTIONAL
- Struktur histori/log tambahan untuk Sertifikat (bila kelak dibutuhkan Lab).
- Riwayat versi Draft yang ditampilkan ke Customer di Frontend.

---

## BAGIAN 19 — Readiness

# READY FOR API + FRONTEND + AUTOMATION DESIGN?

**YES**

Seluruh data model, mapping spreadsheet, ownership, data flow, gap analysis, dan automation data dependency sudah dipetakan secara konsisten dengan FINAL REQUIREMENT BASELINE v1.0 dan SYSTEM DESIGN SPECIFICATION v1.0, tanpa satu pun item berstatus BLOCKER. Seluruh item PENDING bersifat detail teknis lanjutan yang dapat diselesaikan secara paralel dengan tahap berikutnya, bukan penghalang.

Tahap berikutnya:
1. API Contract
2. Frontend State/Flow Specification
3. Automation Specification
4. Implementation Task Breakdown

*(Keempat hal di atas tidak dibahas pada dokumen ini sesuai batasan tahap Data Model & Spreadsheet Mapping.)*
