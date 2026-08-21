# FRONTEND STATE & FLOW SPECIFICATION v1.0
## Sistem Tracking Sampel Laboratorium KTNT UNPAD

*Sumber: FINAL REQUIREMENT BASELINE v1.0, SYSTEM DESIGN SPECIFICATION v1.0, DATA MODEL & SPREADSHEET MAPPING SPECIFICATION v1.0, API CONTRACT SPECIFICATION v1.0. Dokumen ini murni behavior/state/flow — tanpa kode React, CSS, atau implementasi.*

---

## BAGIAN 1 — Frontend Information Architecture

| Halaman | Publik? | Butuh Order No.? | Terikat Lifecycle? | Hubungan |
|---|---|---|---|---|
| Landing Page | Ya | Tidak | Tidak | Entry point → Tracking |
| Tracking/Cek Status | Ya (input) | Ya (setelah submit) | Tidak (halaman pencarian itu sendiri) | Landing → sini; sini → Status Detail |
| Status Detail (mencakup Payment, Draft, Pengesahan info sebagai section kontekstual) | Ya | Ya | Ya — konten berubah sesuai status aktif | Pusat seluruh interaksi customer |
| Survey | Ya | Ya | Ya — hanya relevan saat status Download Sertifikat & belum submit | Diakses dari Status Detail saat gate aktif |
| Certificate (bagian dari Status Detail, dapat juga berdiri sebagai section tersendiri) | Ya | Ya | Ya — hanya relevan saat status Download Sertifikat | Diakses dari Status Detail |
| Error/Not Found | Ya | — | — | Fallback dari Tracking bila Order No. tidak valid |

**DESIGN DECISION:** Payment, Draft Review, dan Pengesahan **tidak dirancang sebagai halaman terpisah**, melainkan **section kontekstual di dalam satu halaman Status Detail** yang berganti konten sesuai status aktif — ini konsisten dengan pola sistem sebelumnya (`StatusPage` tunggal dengan komponen kontekstual per status) dan dengan API Contract Bagian 3 yang merancang satu endpoint tracking gabungan. Certificate dan Survey tetap relevan disebut sebagai "halaman" karena punya alur perpindahan (redirect) yang jelas dari Status Detail.

---

## BAGIAN 2 — Customer Journey

**Landing Page**
Melihat: identitas Lab, layanan, penjelasan tracking real-time. Bisa: navigasi ke Tracking. Tidak bisa: melakukan aksi terkait order (belum ada order dalam konteks). CTA utama: "Cek Status Pengujian". Notifikasi: tidak ada (halaman statis).

**Tracking (pencarian)**
Melihat: form input Order No. Bisa: submit pencarian. Tidak bisa: melihat data order sebelum submit valid. CTA utama: "Cek Status". CTA disabled: input kosong.

**Sampel Diterima**
Melihat: status awal, estimasi hari kerja & tanggal selesai, timeline posisi 1/6. Bisa: memantau saja. Tidak bisa: melakukan aksi apa pun (tidak ada trigger dari customer di tahap ini). CTA utama: tidak ada. Notifikasi: Email+WA sudah terkirim di titik ini (di luar halaman), halaman menampilkan info status terkini saja.

**Pembayaran**
Melihat: Invoice, pilihan Faktur/Non Faktur, rekening (otomatis), form upload bukti bayar. Bisa: pilih faktur, isi NPWP, upload bukti bayar. Tidak bisa: memilih rekening sendiri, memilih CASH. CTA utama: "Upload Bukti Pembayaran" (aktif setelah faktur dipilih dan NPWP valid bila perlu). CTA disabled: sebelum Invoice tersedia. Notifikasi: tidak ada Email/WA di titik masuk status ini (sesuai baseline).

**Analisis**
Melihat: info progres, estimasi, warning bila ≤2 hari kerja tersisa, kwitansi (bila tersedia) pada Timeline. Bisa: memantau saja. Tidak bisa: aksi apa pun. CTA utama: tidak ada. Notifikasi: Email+WA terkirim saat masuk status ini.

**Review Draft**
Melihat: draft terbaru, tombol Setuju/Minta Revisi. Bisa: memilih Setuju atau Minta Revisi (satu kali per versi draft). Tidak bisa: memilih dua-duanya, mengubah keputusan setelah tercatat (lihat Bagian 8). CTA utama: "Setuju" / CTA sekunder: "Minta Revisi" — keduanya hilang/disabled setelah keputusan tercatat. Notifikasi: Email+WA saat draft v1 & draft revisi tersedia; in-page feedback saat Setuju tercatat.

**Pengesahan**
Melihat: info bahwa draft telah disetujui dan sedang diproses pengesahan. Bisa: memantau saja. Tidak bisa: memicu apa pun — **tidak ada tombol "Ajukan Pengesahan"**. CTA utama: tidak ada. Notifikasi: Email+WA saat status ini dimulai (dipicu Admin, bukan customer).

**Sertifikat / Survey**
Melihat: info sertifikat tersedia, form Survey (bila belum diisi). Bisa: mengisi dan submit Survey. Tidak bisa: mengunduh sebelum Survey selesai. CTA utama: "Isi Survey". Notifikasi: Email+WA saat sertifikat tersedia.

**Download Sertifikat**
Melihat: tombol download, tanggal terbit, info periode revisi 14 hari kerja + kontak WA admin. Bisa: download, hubungi admin via WA (di luar sistem) bila perlu revisi. Tidak bisa: mengajukan revisi lewat sistem. CTA utama: "Download Sertifikat" (aktif setelah Survey selesai).

---

## BAGIAN 3 — Tracking Page State

**Loading:** indikator dimuat, tanpa konten placeholder yang menyesatkan.

**Success:** data lengkap ditampilkan sesuai status aktif.

**Empty/Not Found:** pesan "Order No. tidak ditemukan", opsi coba lagi/kembali ke pencarian.

**Error (API gagal):** pesan generik ("Terjadi kendala, silakan coba lagi"), opsi retry.

### Status-Specific State

| Status | Timeline Position | Headline | Informasi Utama | Action Tersedia | Action Tidak Tersedia |
|---|---|---|---|---|---|
| Sampel Diterima | 1/6 | "Sampel Anda telah diterima" | Estimasi hari kerja & tanggal selesai | — | Semua aksi |
| Pembayaran | 2/6 | "Menunggu pembayaran" | Invoice, rekening, form faktur/NPWP | Pilih faktur, isi NPWP, upload bukti | Approve draft, dsb (belum relevan) |
| Analisis | 3/6 | "Sampel sedang dianalisis" | Estimasi, warning (kondisional), kwitansi | — | Semua aksi customer |
| Review Draft | 4/6 | "Draft hasil siap direview" (atau "Menunggu proses pengesahan" bila sudah SETUJU) | Draft, keputusan | Setuju/Minta Revisi (bila belum ada keputusan) | Aksi lain di luar draft |
| Pengesahan | 5/6 | "Draft disetujui, proses pengesahan berjalan" | Info status saja | — | Semua aksi customer |
| Download Sertifikat | 6/6 | "Sertifikat siap" atau "Lengkapi survei" | Sertifikat, survey/download | Isi Survey / Download (kondisional) | — |

---

## BAGIAN 4 — Timeline UI

6 status lifecycle: Sampel Diterima → Pembayaran → Analisis → Review Draft → Pengesahan → Download Sertifikat. **Survey bukan entri timeline** — sesuai baseline dan API Contract, ia adalah gate di dalam status Download Sertifikat.

| Konsep | Definisi |
|---|---|
| Completed | Status dengan urutan lebih kecil dari status aktif saat ini |
| Current | Status yang sedang aktif |
| Upcoming | Status dengan urutan lebih besar dari status aktif |
| Disabled/Locked | Sama seperti Upcoming — belum ada interaksi apa pun sebelum status tersebut tercapai |

**Timestamp:** ditampilkan untuk status Completed dan Current (diambil dari data timeline API — `GET /tracking/{order_no}/timeline`), tidak tersedia untuk Upcoming.

**Bila data event belum tersedia** (mis. tanggal validasi belum ada karena belum divalidasi): UI menampilkan status sebagai Upcoming tanpa timestamp, tidak menampilkan tanggal kosong/placeholder yang membingungkan (mis. bukan "—" tanpa konteks, melainkan disembunyikan sepenuhnya sampai data tersedia).

---

## BAGIAN 5 — Tracking Information

**Ditampilkan:**
- Nomor Order (**FINAL**, terikat Requirement #5 — format sesuai baseline, lihat catatan Bagian 17 soal ASSUMPTION)
- Nama Customer/Perusahaan
- Status saat ini
- Timeline (Bagian 4)
- Estimasi Hari Kerja + Estimasi Tanggal Selesai
- Warning estimasi (kondisional)
- Invoice (card + tombol lihat/download)
- Kwitansi (di Timeline, event Pembayaran Terverifikasi)
- Draft terbaru
- Sertifikat (setelah tersedia)
- Info status Survey (sudah/belum diisi)

**TIDAK ditampilkan (FINAL, ditegaskan ulang):**
- Jenis Analisis
- CODE (I/L/P dst.)
- Informasi internal Lab lain yang tidak ditujukan untuk customer (data administratif sampling di luar yang disebut di atas)

Seluruh data bersumber dari `GET /tracking/{order_no}` sesuai API Contract Bagian 3.

---

## BAGIAN 6 — Estimation UI

**Ditampilkan:** Estimasi Hari Kerja (angka), Estimasi Tanggal Selesai (tanggal kalender), tidak menampilkan formula/logika perhitungan ke customer.

**Warning muncul saat:** Sisa Hari Kerja ≤2 **dan** status = Analisis (flag dari API, bukan dihitung ulang di Frontend).

**Bila estimasi sudah lewat (Sisa Hari Kerja negatif) sementara status masih Analisis:** UI menampilkan estimasi tanggal selesai apa adanya (bisa berupa tanggal yang sudah lewat) — **wording khusus untuk kondisi ini adalah OPTIONAL/Future Enhancement** sesuai baseline (belum ada requirement wording terpisah untuk kondisi terlambat), bukan diasumsikan/dikarang di sini.

**Bila proses sudah selesai (status sudah lanjut dari Analisis):** Card Estimasi tetap dapat ditampilkan sebagai riwayat informatif (opsional), namun Warning tidak lagi muncul karena syarat "status = Analisis" tidak lagi terpenuhi.

---

## BAGIAN 7 — Payment Page Flow

```
Customer masuk Pembayaran
→ [Invoice belum tersedia] → tampilkan "menunggu admin", sembunyikan form
→ [Invoice tersedia] → tampilkan card Invoice
→ pilih Faktur Pajak / Non Faktur
   → [Faktur Pajak] → field NPWP wajib muncul
→ lihat rekening (otomatis sesuai kategori — Rekanan UNPAD→BNI, Umum→Mandiri)
→ upload bukti pembayaran
→ [upload berhasil] → tampilkan "menunggu validasi"
→ [Admin validasi] → VALID → lanjut ke status Analisis (halaman otomatis mencerminkan status baru saat reload/refresh)
                    → INVALID → tetap di Pembayaran
```

### State Definitions

| State | Kondisi | Tampilan |
|---|---|---|
| Invoice belum tersedia | LINK_INVOICE kosong | Pesan menunggu admin, form tersembunyi |
| Invoice tersedia | LINK_INVOICE terisi | Card Invoice + form faktur muncul |
| Form Faktur | Customer belum submit pilihan | Pilihan Faktur Pajak/Non Faktur |
| NPWP invalid | NPWP kosong padahal Faktur Pajak dipilih | Pesan error, tombol lanjut disabled |
| Upload bukti | Faktur/NPWP sudah valid | Form upload aktif |
| Upload berhasil | File tersimpan | Pesan "Pembayaran sedang diperiksa" |
| Menunggu validasi | STATUS_VALIDASI = PENDING | Info status pasif |
| Valid | STATUS_VALIDASI = VALID | Status berpindah ke Analisis (bagian ini bukan lagi Payment Page) |
| **Invalid** [ASSUMPTION] | STATUS_VALIDASI = INVALID | Info bahwa bukti bayar ditolak; **perilaku upload ulang masih ASSUMPTION** (belum keputusan bisnis final — lihat Bagian 22), Frontend menampilkan opsi upload ulang sebagai desain sementara yang perlu dikonfirmasi |

**FINAL, ditegaskan ulang:** Customer tidak pernah melihat opsi CASH atau opsi memilih rekening — rekening selalu ditampilkan sebagai info tetap berdasarkan kategori yang sudah ditentukan Admin.

---

## BAGIAN 8 — Draft Review Flow

```
Admin upload Draft v1 → Customer notifikasi (Email+WA)
→ Customer buka Draft
→ Customer pilih: SETUJU atau MINTA REVISI

[SETUJU]
→ Status TETAP Review Draft (TIDAK pindah ke Pengesahan)
→ In-page feedback: "Persetujuan Anda telah tercatat dan sedang menunggu proses pengesahan."
→ Tombol Setuju/Minta Revisi hilang/disabled
→ Admin melihat keputusan SETUJU di sisinya
→ Admin memilih "Lanjut ke Pengesahan" (aksi Admin, bukan customer)
→ BARU Status → Pengesahan

[MINTA REVISI]
→ Status TETAP Review Draft
→ Admin melihat permintaan revisi
→ Admin upload Draft v2 → Customer notifikasi khusus ("Draft hasil revisi telah tersedia")
→ Customer melihat Draft terbaru (v2)
→ Customer pilih lagi: SETUJU atau MINTA REVISI (siklus dapat berulang)
```

### State UI

| State | Kondisi |
|---|---|
| Draft belum tersedia | Belum ada baris draft untuk order ini — status belum Review Draft |
| Draft tersedia, belum ada keputusan | Versi draft terbaru belum punya Keputusan Customer | Tombol Setuju/Minta Revisi aktif |
| Customer sudah SETUJU | Keputusan Customer = SETUJU pada versi terbaru | Feedback tercatat, tombol hilang, pesan "menunggu admin" |
| Customer sudah minta revisi | Keputusan Customer = REVISI pada versi terbaru | Pesan "permintaan revisi Anda telah diteruskan ke admin", tombol hilang, menunggu draft baru |
| Draft revisi tersedia | Versi baru muncul setelah keputusan REVISI sebelumnya | Notifikasi khusus, kembali ke state "belum ada keputusan" untuk versi baru |
| Menunggu tindakan Admin | Keputusan Customer = SETUJU, Tindak Lanjut Admin belum LANJUT KE PENGESAHAN | Pesan status pasif, tidak ada aksi customer |
| Menunggu Pengesahan | Sama seperti di atas — istilah dipakai bergantian, merujuk kondisi yang sama | — |

**FINAL, penegasan kritis:** Tidak pernah ada state UI yang menampilkan status "Pengesahan" segera setelah klik Setuju. Perpindahan visual ke status Pengesahan **hanya** terjadi setelah data API mengonfirmasi status benar-benar berubah (hasil aksi Admin), bukan optimistic UI update berdasarkan aksi customer semata.

---

## BAGIAN 9 — Draft Version UI

Customer secara default **hanya melihat Draft terbaru** (**FINAL**, sesuai baseline dan API Contract `GET /tracking/{order_no}/draft/latest`).

Riwayat seluruh versi draft di Frontend adalah **OPTIONAL** (tidak wajib) — sesuai keputusan final baseline bahwa ini nice-to-have, bukan requirement.

**RECOMMENDATION:** Bila suatu saat ditambahkan, riwayat versi sebaiknya ditampilkan sebagai daftar ringkas collapsible (versi, tanggal, keputusan) di bawah panel draft utama — bukan halaman terpisah — agar tidak menambah kompleksitas navigasi. Ini murni saran, bukan bagian dari scope wajib dokumen ini.

---

## BAGIAN 10 — Pengesahan Page

Customer melihat: informasi bahwa draft telah disetujui, informasi bahwa proses pengesahan sedang berjalan, posisi timeline (5/6).

**Tidak ada aksi customer di tahap ini** — **FINAL, ditegaskan eksplisit:** tidak ada tombol "Ajukan Pengesahan" atau CTA apa pun yang dapat mengubah status dari sisi customer. Perpindahan ke status Download Sertifikat murni menunggu Admin mengunggah sertifikat (di luar kendali customer).

Ini konsisten dengan State Machine di System Design Specification: transisi keluar dari Pengesahan dipicu oleh `LINK_SERTIFIKAT` terisi (aksi Admin), bukan aksi customer.

---

## BAGIAN 11 — Certificate Page

```
Sertifikat tersedia (Admin upload)
→ Customer buka halaman
→ [Survey belum diisi] → gate aktif, arahkan ke Survey
→ [Survey selesai] → tombol Download aktif
```

**Ditampilkan:**
- Tanggal sertifikat terbit
- Link/tombol sertifikat terbaru (selalu versi terkini, tidak pernah menampilkan versi lama)
- Tombol Download (aktif hanya bila gate Survey terpenuhi)
- Status periode revisi (dihitung dari tanggal terbit + 14 hari kerja) — ditampilkan sebagai informasi pasif
- Informasi kontak WhatsApp Admin untuk kebutuhan revisi

**TIDAK ADA (FINAL, ditegaskan ulang):**
- Tombol "Ajukan Revisi Sertifikat"
- Form revisi sertifikat
- Histori versi sertifikat

**Alur revisi (murni informasi, bukan aksi di halaman ini):** Customer → hubungi Admin via WhatsApp (di luar sistem) → Admin revisi di luar website → Admin upload sertifikat terbaru → halaman otomatis menampilkan versi terbaru saat dimuat ulang.

---

## BAGIAN 12 — Survey UI

14 pertanyaan skala (Bagian I: 4, II: 3, III: 6, IV: 1 — Akurasi) + Kritik & Saran. Skala resmi teks: Sangat Puas/Puas/Cukup Puas-Biasa/Tidak Puas/Sangat Tidak Puas (Bagian I–III); Sangat Baik/Baik/Cukup Puas-Biasa/Tidak Puas/Sangat Tidak Puas (Bagian IV — dipertahankan berbeda sesuai formulir asli).

**UI:** Setiap pilihan jawaban ditampilkan sebagai satu unit ★1–5 + label teks yang dipilih bersamaan (bukan dua kontrol terpisah). **Nilai yang dikirim ke API adalah teks resmi**, bintang murni visual — ditegaskan ulang sesuai API Contract Bagian 8.

**Identitas:** Nama Customer dan Jenis Sampel ditampilkan **read-only** dari data Order, tidak diinput ulang. No. Handphone **tidak** dijadikan field input wajib (FINAL, tidak dibuka kembali).

### State Definitions

| State | Kondisi | Tampilan |
|---|---|---|
| Survey loading | Data sedang diambil | Indikator muat |
| Survey ready | Data & konteks siap | Form 14 pertanyaan + Kritik&Saran + header read-only |
| Validation error | Jawaban belum lengkap saat submit (status wajib per pertanyaan: **PENDING** dari baseline — lihat Bagian 22) | Highlight pertanyaan belum terjawab |
| Submit loading | Sedang mengirim | Tombol disabled + indikator proses |
| Submit success | Tersimpan | Redirect/tampilkan akses Download Sertifikat |
| Already submitted | Order sudah punya entri Survey | Form tidak ditampilkan lagi, langsung arahkan ke Certificate Page |
| API error | Gagal simpan | Pesan error, opsi coba lagi, data isian tidak hilang (preservasi input) |

---

## BAGIAN 13 — Download Gate

| Kondisi | State | Pesan | Tombol Download |
|---|---|---|---|
| Survey belum selesai | Locked | "Lengkapi survei kepuasan untuk membuka akses download sertifikat." | Disabled |
| Survey sudah selesai | Unlocked | — | Aktif |
| Sertifikat belum tersedia | Not Available | "Sertifikat belum diterbitkan" | Tidak ditampilkan / Disabled |
| Sertifikat tersedia + Survey selesai | Ready | — | Aktif |

**Penegasan FINAL:** Gate ini murni logika UI berbasis flag `survey_completed` dari API — **tidak pernah mengubah status tracking lifecycle**. Status tetap Download Sertifikat baik sebelum maupun sesudah gate terbuka.

---

## BAGIAN 14 — Notification UI

### In-Page Feedback (ditampilkan langsung di Frontend)
- "Persetujuan draft berhasil dicatat, menunggu proses pengesahan admin." (saat Setuju)
- "Permintaan revisi Anda telah diteruskan ke admin." (saat Minta Revisi — bila ditampilkan; baseline tidak eksplisit mewajibkan feedback pada aksi ini, ditandai **DESIGN DECISION** apakah ditambahkan untuk konsistensi UX)
- "Bukti pembayaran berhasil diunggah, menunggu validasi admin." (saat upload bukti bayar)
- "Survei berhasil dikirim." (saat submit survey)

### Email/WhatsApp (tidak diimplementasikan di Frontend — Frontend hanya mencerminkan hasil akhirnya)
- Order diterima
- Pembayaran tervalidasi
- Draft tersedia
- Draft revisi tersedia
- Pengesahan dimulai
- Sertifikat tersedia

**Catatan:** "Invoice tersedia" **tidak** memiliki notifikasi Email/WA (sesuai baseline & API Contract) — Frontend hanya mencerminkan perubahan tampilan (Invoice muncul di halaman), tanpa elemen notifikasi apa pun untuk event ini.

---

## BAGIAN 15 — CTA Matrix

| Status | CTA Utama | CTA Sekunder | Disabled | Kondisi |
|---|---|---|---|---|
| Sampel Diterima | — | — | — | Tidak ada aksi customer |
| Pembayaran (invoice belum ada) | — | — | Upload bukti bayar | Invoice belum tersedia |
| Pembayaran (invoice ada) | "Upload Bukti Pembayaran" | — | Sebelum faktur/NPWP valid | NPWP kosong padahal Faktur Pajak |
| Analisis | — | — | — | Tidak ada aksi customer |
| Review Draft (belum keputusan) | "Setuju" | "Minta Revisi" | — | Draft tersedia, belum ada keputusan |
| Review Draft (sudah SETUJU) | — | — | Setuju/Minta Revisi | Keputusan sudah tercatat |
| Review Draft (sudah REVISI) | — | — | Setuju/Minta Revisi | Menunggu draft baru dari Admin |
| Pengesahan | — | — | — | Tidak ada aksi customer sama sekali |
| Download Sertifikat (survey belum) | "Isi Survey" | — | Download | Survey belum disubmit |
| Download Sertifikat (survey selesai) | "Download Sertifikat" | — | — | Gate terbuka |

---

## BAGIAN 16 — Frontend State Machine

**Lifecycle State (Business Status — 6 nilai, dari Backend):** Sampel Diterima, Pembayaran, Analisis, Review Draft, Pengesahan, Download Sertifikat.

**UI State (independen dari Business Status, muncul di setiap halaman/section):** loading, success, error, empty, locked, waiting, action-required, completed.

**Perbedaan mendasar:** Lifecycle State adalah data bisnis yang berasal dari Backend dan hanya berubah lewat event tervalidasi (lihat API Contract). UI State adalah kondisi tampilan Frontend yang bisa berubah lebih sering dan lokal — misalnya, dalam satu Lifecycle State "Review Draft", UI State bisa berpindah antara `action-required` (belum ada keputusan) → `loading` (saat submit) → `waiting` (setelah Setuju tercatat), tanpa Lifecycle State itu sendiri berubah sama sekali.

**Contoh kombinasi:**
- Lifecycle=Pembayaran + UI=`action-required` → form upload aktif menunggu input.
- Lifecycle=Pembayaran + UI=`waiting` → bukti sudah diupload, menunggu validasi Admin.
- Lifecycle=ReviewDraft + UI=`waiting` → Customer sudah Setuju, menunggu Admin.
- Lifecycle=DownloadSertifikat + UI=`locked` → gate Survey belum terbuka.
- Lifecycle=DownloadSertifikat + UI=`completed` → gate terbuka, siap download.

---

## BAGIAN 17 — Access & Security UX

| Skenario | Perilaku |
|---|---|
| Invalid Order No. (format salah) | Pesan error format, tidak melakukan request ke API |
| Order tidak ditemukan | Pesan "Order No. tidak ditemukan", opsi coba lagi |
| Akses halaman langsung (deep link dengan Order No. di URL) | Diizinkan — halaman tracking selalu dapat diakses langsung tanpa harus lewat form pencarian, karena Order No. adalah kredensial itu sendiri |
| Refresh halaman | Data dimuat ulang dari API (tidak ada state tersimpan di sisi client yang perlu dipulihkan) |
| Membuka Payment section tanpa lifecycle sesuai (mis. saat status masih Sampel Diterima) | Section tersebut tidak ditampilkan / ditampilkan sebagai "belum relevan pada tahap ini" — bukan error, murni penyesuaian konten berdasarkan status aktif |
| Membuka Draft sebelum tersedia | Sama seperti di atas — section Draft tidak muncul sebelum status Review Draft |
| Membuka Certificate sebelum tersedia | Sama — section Certificate tidak muncul sebelum status Download Sertifikat |
| Mencoba mengakses file order lain | Tidak mungkin terjadi melalui UI normal karena seluruh link file di-scope oleh Order No. yang sedang dibuka (sesuai API Contract Bagian 14); bila dicoba lewat manipulasi URL, permintaan akan ditolak di level API, bukan dicegah di Frontend |

**ASSUMPTION (ditegaskan ulang dari API Contract Bagian 16):** Keamanan sistem ini bergantung sepenuhnya pada Order No. sebagai satu-satunya kredensial akses, tanpa login/sesi. Ini adalah kondisi yang **sudah ada di sistem sebelumnya** dan dibawa serta sebagai asumsi berkelanjutan — bukan keputusan baru yang diambil di tahap ini, dan bukan requirement yang diubah.

---

## BAGIAN 18 — Responsive/Accessibility Requirement

- **Desktop/Tablet/Mobile:** seluruh halaman harus tetap fungsional penuh (bukan versi terbatas) di ketiga ukuran layar — konten dapat disusun ulang (reflow), tapi tidak ada fitur yang hilang di layar kecil.
- **Keyboard navigation:** seluruh elemen interaktif (tombol, pilihan survey, form) harus dapat diakses dan dioperasikan tanpa mouse.
- **Readable contrast:** teks dan elemen status/warning harus tetap terbaca jelas, khususnya untuk warning estimasi dan pesan error.
- **Form error:** pesan error ditampilkan berdekatan dengan field terkait (mis. NPWP invalid), bukan hanya di bagian atas halaman.
- **Loading state:** setiap pemuatan data asinkron (tracking, submit draft decision, submit survey) harus punya indikator visual, mencegah pengguna mengira aplikasi macet.
- **Disabled state:** tombol yang tidak dapat diklik harus terlihat jelas berbeda dari tombol aktif (bukan sekadar tidak merespons klik).
- **Focus state:** elemen yang sedang difokus (terutama saat navigasi keyboard) harus punya indikator visual jelas.
- **File link usability:** link dokumen (Invoice, Draft, Sertifikat, Kwitansi) harus jelas menunjukkan bahwa itu adalah tautan ke file eksternal (Google Drive), termasuk indikasi bila file gagal dimuat.

Tidak ada spesifikasi CSS/warna/ukuran piksel di dokumen ini, sesuai batasan.

---

## BAGIAN 19 — Frontend Error State Matrix

| Scenario | UI State | Message | Available Action |
|---|---|---|---|
| Order tidak ditemukan | Empty/Not Found | "Order No. tidak ditemukan." | Coba lagi / kembali ke pencarian |
| API error | Error | "Terjadi kendala, silakan coba lagi." | Retry |
| Invoice belum tersedia | Waiting | "Invoice sedang diproses admin." | — |
| NPWP belum diisi | Validation Error | "NPWP wajib diisi untuk Faktur Pajak." | Lengkapi NPWP |
| Bukti pembayaran belum diupload | Action Required | "Silakan upload bukti pembayaran." | Upload |
| Payment INVALID [ASSUMPTION] | Action Required (asumsi) | Pesan bahwa bukti bayar ditolak, arahan upload ulang (ASSUMPTION) | Upload ulang (ASSUMPTION) |
| Draft belum tersedia | Waiting | "Draft hasil sedang disiapkan." | — |
| Draft decision sudah tercatat | Completed (untuk aksi ini) | Pesan sesuai keputusan (Setuju/Revisi) | — |
| Admin belum melanjutkan Pengesahan | Waiting | "Menunggu proses pengesahan oleh admin." | — |
| Sertifikat belum tersedia | Waiting | "Sertifikat sedang diproses." | — |
| Survey belum selesai | Locked | "Lengkapi survei kepuasan untuk membuka akses download sertifikat." | Isi Survey |
| Survey sudah selesai | Completed | — | Download |
| Sertifikat download tersedia | Completed | — | Download |
| Sertifikat periode revisi lewat | Informational (bukan error/blocker) | Info kontak Admin tetap ditampilkan; **tidak ada larangan aksi apa pun**, murni informasi | Hubungi Admin (WA, di luar sistem) |

---

## BAGIAN 20 — Frontend API Dependency

| Screen | API Endpoint | Data Dibutuhkan | UI State |
|---|---|---|---|
| Landing Page | Tidak ada (statis) | Konten statis | — |
| Tracking (pencarian) | Tidak ada hingga submit | Input Order No. | Idle → Loading (setelah submit) |
| Status Detail | `GET /tracking/{order_no}` | status, timeline, estimasi, invoice ringkas, draft terbaru, sertifikat, survey_completed | loading/success/error/empty |
| Status Detail — Payment section | `GET /tracking/{order_no}/payment` | invoice detail, rekening, status validasi | loading/success |
| Payment — submit faktur | `POST /tracking/{order_no}/payment/faktur` | jenis faktur, NPWP | loading/success/error |
| Payment — upload bukti | `POST /tracking/{order_no}/payment/upload-proof` | file | loading/success/error |
| Status Detail — Draft section | `GET /tracking/{order_no}/draft/latest` | link, versi, status keputusan | loading/success |
| Draft — submit decision | `POST /tracking/{order_no}/draft/decision` | keputusan (SETUJU/REVISI) | loading/success/error |
| Status Detail — Timeline | `GET /tracking/{order_no}/timeline` | riwayat status + timestamp | loading/success |
| Status Detail — Estimation | `GET /tracking/{order_no}/estimation` (atau bagian dari tracking utama) | estimasi hari kerja, tanggal selesai, flag warning | success |
| Certificate Page | `GET /tracking/{order_no}/certificate` | link, tanggal terbit, flag periode revisi | loading/success/locked |
| Survey Page | `GET /tracking/{order_no}/survey` | pertanyaan, konteks read-only, status sudah diisi | loading/success/already-submitted |
| Survey — submit | `POST /tracking/{order_no}/survey` | 14 jawaban + saran | loading/success/error |
| — Survey completion check | `GET /tracking/{order_no}/survey/completion` | flag selesai | success (dipakai untuk gate) |

---

## BAGIAN 21 — Frontend Component/Section Blueprint

**Landing Page:**
- Header/Navigasi
- Hero Section (identitas, CTA ke Tracking)
- Layanan Section
- Penjelasan Tracking Real-time
- Kontak Section
- Footer

**Tracking (pencarian):**
- Header
- Form Pencarian Order No.
- Footer

**Status Detail:**
- Header
- Order Information (Nomor Order, Nama Customer)
- Timeline (6 status)
- Estimation Card (Hari Kerja, Tanggal Selesai, Warning kondisional)
- Payment Section (kontekstual — hanya muncul saat relevan)
- Document Section (Invoice, Kwitansi — kontekstual)
- Draft Section (kontekstual)
- Pengesahan Info Section (kontekstual)
- Certificate/Survey Section (kontekstual)
- Footer

**Survey Page:**
- Header
- Konteks Read-only (Order No., Customer, Jenis Sampel)
- Bagian I–IV (pertanyaan skala)
- Kritik & Saran
- Tombol Submit
- Footer

**Certificate Page (bila berdiri sendiri, atau sebagai section):**
- Header
- Info Sertifikat (tanggal terbit)
- Tombol Download (kondisional)
- Info Periode Revisi + Kontak WhatsApp
- Footer

Tidak ada komponen React atau CSS ditentukan, sesuai batasan.

---

## BAGIAN 22 — Frontend Open Items

### BLOCKER
*(Tidak ada.)*

### NON-BLOCKER
- Format placeholder input Order No. pada form pencarian (menunggu finalisasi Requirement #5).
- Sumber kolom presisi Jenis Sampel & No. Handphone untuk konteks Survey.
- Status wajib/opsional per pertanyaan Survey (memengaruhi Validation Error di Bagian 12).

### DESIGN DECISION
- Apakah In-page feedback ditambahkan untuk aksi "Minta Revisi" (Bagian 14).
- Apakah Certificate ditampilkan sebagai halaman berdiri sendiri atau murni section di Status Detail.
- Wording khusus untuk kondisi estimasi sudah terlambat (Bagian 6) — belum ada requirement, akan ditentukan bila dibutuhkan.

### ASSUMPTION
- Perilaku upload ulang bukti bayar setelah Payment INVALID (Bagian 7, 19) — dibawa serta dari dokumen-dokumen sebelumnya, belum dikonfirmasi final oleh Lab.
- Keamanan berbasis Order No. tanpa login (Bagian 17) — kondisi existing yang dilanjutkan, bukan keputusan baru.

### OPTIONAL
- Riwayat versi Draft di Frontend (Bagian 9).
- Indikator "terakhir diperbarui pada [waktu]" di halaman tracking.

---

## BAGIAN 23 — Final Frontend Decision Checklist

```
[FINAL] Information Architecture
[FINAL] Customer Journey
[FINAL] Tracking State
[FINAL] Timeline
[FINAL] Payment Flow (kecuali perilaku INVALID = ASSUMPTION)
[FINAL] Draft Flow
[FINAL] Pengesahan Flow
[FINAL] Certificate Flow
[FINAL] Survey Flow
[FINAL] Download Gate
[FINAL] CTA Behavior
[FINAL] Error State
[FINAL] API Dependency
[FINAL] Responsive Requirement
```

```
[OPEN] Status wajib/opsional per pertanyaan Survey
[OPEN] Sumber kolom Jenis Sampel & No. Handphone untuk Survey
[OPEN] Format placeholder Order No. (terikat Requirement #5)

[ASSUMPTION] Perilaku upload ulang bukti bayar setelah Payment INVALID
[ASSUMPTION] Keamanan berbasis Order No. tanpa login

[OPTIONAL] Riwayat versi Draft di Frontend
[OPTIONAL] Indikator waktu update terakhir
[OPTIONAL] Wording khusus estimasi terlambat
```

---

## BAGIAN 24 — Readiness

# READY FOR AUTOMATION SPECIFICATION?

**YES**

Seluruh Information Architecture, Customer Journey, state per halaman, Timeline UI, CTA Matrix, State Machine konseptual, Error State Matrix, dan API Dependency sudah dipetakan konsisten dengan tiga dokumen sebelumnya, tanpa satu pun item BLOCKER dan tanpa membuka kembali requirement bisnis yang sudah final. Prinsip paling kritis (Setuju Draft tidak langsung memicu Pengesahan; tidak ada tombol Ajukan Pengesahan/Ajukan Revisi Sertifikat; Survey sebagai gate bukan status; rekening tanpa pilihan customer/CASH) ditegaskan berulang di seluruh bagian relevan.

Tahap berikutnya:
1. Automation Specification
2. Implementation Task Breakdown

*(Kedua hal di atas tidak dibahas pada dokumen ini sesuai batasan tahap Frontend State & Flow Specification.)*
