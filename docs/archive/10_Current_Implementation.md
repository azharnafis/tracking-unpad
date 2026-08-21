# 10. Current Implementation

Dokumen ini menggambarkan **kondisi project saat ini** berdasarkan analisis kode di repositori. Informasi ini merupakan *snapshot* dan harus diperbarui seiring perkembangan project.

---

## Status Umum

Project berada pada tahap **pengembangan / prototipe fungsional**. Alur inti sudah dapat berjalan (tracking → pembayaran → draft → pengesahan → sertifikat), tetapi **belum siap produksi** karena beberapa kekurangan besar (keamanan, UI admin, skema DB, testing).

---

## Fitur yang Sudah Selesai

### Frontend
- [x] Landing page (`HomePage`) — hero, layanan, kontak, peta placeholder.
- [x] Halaman pencarian tracking (`TrackingPage`) — input kode + tampilan alur proses.
- [x] Halaman status (`StatusPage`) — stepper 7 tahap, estimasi SLA, riwayat, aksi kontekstual per status.
- [x] Upload bukti pembayaran dengan validasi klien (tipe & ukuran file).
- [x] Download invoice.
- [x] Review draft: buka link, setujui, atau minta revisi (dialihkan ke WhatsApp).
- [x] Kuesioner kepuasan 6 pertanyaan + saran (`SurveyPage`).
- [x] Download sertifikat setelah kuesioner diisi.
- [x] Responsif (Tailwind), animasi Framer Motion.

### Backend
- [x] REST API: tracking, payment (upload & validate), draft (upload, approve, revisi), questionnaire.
- [x] Cron sinkronisasi Sheets → MySQL setiap 30 detik (6 modul).
- [x] Upload file ke Google Drive + set izin publik.
- [x] Notifikasi email (Nodemailer) & WhatsApp (Fonnte) untuk 5 status.
- [x] Logging `tracking_log` & `notifications`.
- [x] Rate limiting, validasi kode tracking, batas ukuran file 5MB.

### Integrasi
- [x] Google Sheets: baca `Data_Order`, `Status_Tracking`, `Pembayaran`, `Draft`, `Sertifikat`; tulis balik beberapa sel.
- [x] Google Drive: folder bukti pembayaran.
- [x] SMTP Gmail & Fonnte WhatsApp.

---

## Fitur yang Belum Selesai / Tidak Ada

| Fitur | Kondisi |
|-------|---------|
| **Admin panel / dashboard admin** | ❌ Tidak ada UI admin. Admin bekerja via Google Sheets + API manual |
| **Autentikasi & otorisasi** | ❌ Tidak ada login/role; semua endpoint publik |
| **UI validasi pembayaran** | ❌ Endpoint `PATCH /validate` ada, tanpa halaman |
| **UI upload draft** | ❌ Endpoint `POST /draft/upload` ada, tanpa halaman |
| **Migrasi/skema database** | ❌ Tidak ada file SQL/migration di repo |
| **Upload invoice/draft/sertifikat dari frontend** | ❌ Link dimasukkan manual ke Sheets |
| **Vite config file** | ❌ Tidak ada `vite.config.js` (menggunakan default) |
| **Script `start`/`dev` backend** | ❌ `package.json` backend hanya placeholder `test` |
| **Test otomatis** | ❌ Tidak ada (frontend & backend) |
| **CI/CD & deployment** | ❌ Tidak ada konfigurasi |
| **Docker** | ❌ Tidak ada Dockerfile/docker-compose |

---

## Known Issues

| # | Isu | Lokasi | Dampak |
|---|-----|--------|--------|
| 1 | **Dead code `getLatestDraft()`** — memanggil `GET /api/draft/:kode/latest` yang **tidak ada** di backend | `frontend/src/services/api.js` | Jika dipanggil → 404. Saat ini tidak dipakai, tapi membingungkan |
| 2 | **Transisi `REVIEW_DRAFT → PENGESAHAN` tidak instan & bergantung dua langkah** — pelanggan klik approve hanya menulis tanggal di kolom F sheet `Draft`; status baru berubah saat admin menandai kolom E `Disetujui` (dibaca cron) | `draftController.js` + `cronSyncService.js` | Order bisa "tertahan" di REVIEW_DRAFT jika admin tidak menandai |
| 3 | **`syncCertificates` tidak mengubah status order** — sertifikat masuk DB tetapi `current_status` tetap (admin harus ubah manual di `Status_Tracking`) | `cronSyncService.js` | Status bisa tidak sinkron dengan ketersediaan sertifikat |
| 4 | **Tidak ada pembatasan pengisian kuesioner** — `survey_completed` hanya cek "minimal 1 baris ada"; pelanggan bisa submit berkali-kali | `questionnaireController.js` | Data survei bisa duplikat |
| 5 | **`findRowByKodeTracking` hanya cocokkan kolom A persis** — jika ada kode duplikat di sheet, hanya baris pertama yang ditulis | `sheetsSyncService.js` | Update salah baris |
| 6 | **Status label di Sheets case-sensitive** — `Disetujui` (draft) dan `VALID` (pembayaran) harus persis; salah ketik = tidak diproses (tanpa peringatan yang terlihat) | `cronSyncService.js` | Status tidak berubah |
| 7 | **Cron tanpa try/catch per modul** — satu error (mis. sheet tidak ada) menghentikan seluruh `runSync` pada iterasi itu | `cronSyncService.js` | Modul lain tidak diproses |
| 8 | **`runSync` tidak idempotent penuh untuk notifikasi** — order baru memicu notifikasi tiap kali? *(Perlu diverifikasi)* — sebenarnya `syncNewOrders` hanya memanggil `updateOrderStatus` saat order baru dibuat, jadi aman | `cronSyncService.js` | — |
| 9 | **File `tes.png` dan log dev** tertinggal di repo | `backend/tes.png`, `frontend/vite-dev*.log` | Kebersihan repo |
| 10 | **Rekening bank di-hardcode di UI** | `StatusPage.jsx` (`TransferDetail`) | Perlu dipindah ke konfigurasi |
| 11 | **Frontend & backend saling tidak konsisten** — contoh: frontend README menyebut nama aset (`hero-lab.jpg`, `logo-lab-ktnt.png`) yang tidak ada (file asli: `landingpage.jpg`, `logo.png`) | `frontend/README.md` | Dokumentasi internal usang |

---

## Technical Debt

1. **Keamanan: tidak ada autentikasi.** Semua endpoint dapat diakses publik (termasuk validasi pembayaran & upload draft). Kode tracking mudah ditebak. **Prioritas tertinggi sebelum produksi.**
2. **Kredensial asli di `.env`** — SMTP password, refresh token OAuth, token Fonnte, Service Account. Harus dirotasi bila pernah terekspos; jangan pernah commit.
3. **Tanpa lapisan skema/migration DB** — schema hanya tersirat di query. Menyulitkan kolaborasi & deployment.
4. **Tanpa transaksi database** — `updateOrderStatus` memodifikasi `orders`, `tracking_log`, lalu kirim notifikasi tanpa transaksi; kegagalan bisa membuat data tidak konsisten.
5. **Dua metode auth Google berbeda** (Service Account untuk Sheets, OAuth2 untuk Drive) — rawan kebingungan dan dua set kredensial harus dikelola.
6. **Tidak ada validasi status urutan di API** — hanya cron yang menegakkan "hanya maju"; endpoint API bisa mengubah status bebas (mis. langsung `DOWNLOAD_SERTIFIKAT`).
7. **Tidak ada test** — perubahan bisa merusak alur tanpa disadari.
8. **Pengulangan pola "insert lalu ambil terbaru"** di payments/drafts tanpa cleanup.
9. **Duplikasi dependency di root `package.json`** — `googleapis`, `multer`, `node-cron`, `nodemailer` juga ada di root (tidak dipakai runtime backend).

---

## TODO (Rekomendasi)

- [ ] Buat **admin panel** (validasi pembayaran, upload draft, kelola status).
- [ ] Tambahkan **autentikasi** (minimal: admin login + token; ideal: role user).
- [ ] Pindahkan **rekening bank & konfigurasi dinamis** dari hardcode ke backend/config.
- [ ] Buat **file migration SQL** untuk skema database.
- [ ] Bungkus `updateOrderStatus` dengan **transaksi**.
- [ ] Tambahkan **try/catch per modul** di `runSync`.
- [ ] Tambahkan **endpoint `GET /draft/:kode/latest`** atau hapus `getLatestDraft` di frontend.
- [ ] Buat **otomatisasi transisi final**: saat sertifikat masuk, set status `DOWNLOAD_SERTIFIKAT` (atau dokumentasikan alur manual).
- [ ] Tambahkan **batasan unik**: `orders.kode_tracking`, `customers.email`, `questionnaires.order_id` (opsional).
- [ ] Hapus file sisa: `tes.png`, `vite-dev*.log`, `backend.zip`, `frontend (2).zip` (bila tidak diperlukan).
- [ ] Perbarui `frontend/README.md` dan `.env.example` agar akurat.
- [ ] Tambahkan CI + unit/integration test.

---

## Catatan Penting Developer

1. **Jangan commit** `backend/.env`, `backend/credentials/service-account.json`, dan folder `node_modules` — sudah di-ignore di `.gitignore`, pastikan tetap.
2. **Backend tidak punya `npm start`** — jalankan dengan:
   ```bash
   cd backend
   npm install
   node server.js        # atau: npx nodemon server.js
   ```
   Server menunggu `testConnection()` (MySQL) lalu menjalankan cron & listen di port 3000.
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev           # http://127.0.0.1:5173
   ```
4. **Dependensi eksternal yang harus ada**: MySQL server dengan database `lab_tracking` (tabel harus dibuat manual), Google Sheets (di-share ke Service Account email), Google Drive folder ID, SMTP Gmail dengan app password, token Fonnte.
5. **Alur approval draft tidak instan** — setelah pelanggan approve, perlu admin menandai `Disetujui` di kolom E sheet `Draft`, baru cron mengubah status ke `PENGESAHAN` (maks 30 detik).
6. **Status order berubah lewat banyak jalur** (API & cron). Jika menambah jalur, gunakan `updateOrderStatus` agar `tracking_log` & notifikasi konsisten.
7. **Bahasa UI & template notifikasi**: Bahasa Indonesia.

---

## Matriks Ketersediaan Per Komponen

| Komponen | Status |
|----------|--------|
| API tracking | ✅ Lengkap |
| API pembayaran | ✅ Backend selesai; UI pelanggan selesai; UI admin ❌ |
| API draft | ✅ Backend selesai; UI pelanggan selesai; UI admin ❌ |
| API kuesioner | ✅ Lengkap |
| Cron sinkronisasi | ✅ Berjalan, perlu penguatan error handling |
| Notifikasi | ✅ Email & WA (5 status) |
| Google Drive | ✅ Bukti pembayaran (upload); folder lain disiapkan, belum dipakai |
| Database | ⚠️ Skema ada di runtime, tanpa file migration |
| Keamanan | ❌ Belum ada autentikasi |
| Deployment | ❌ Belum ada |
