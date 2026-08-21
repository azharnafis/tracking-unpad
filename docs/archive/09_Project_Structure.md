# 09. Project Structure

## Struktur Root

```
Tracking Unpad/                        # Root workspace
├── docs/                              # 📘 Dokumentasi (folder ini)
├── backend/                           # Backend Node.js + Express + MySQL
├── frontend/                          # Frontend React + Vite + Tailwind
├── backend.zip                        # 📦 Arsip backend (asal mula, bukan bagian runtime)
├── frontend (2).zip                   # 📦 Arsip frontend (asal mula, bukan bagian runtime)
├── package.json                       # Dependencies root (duplikat dari backend, tidak dipakai server.js)
├── package-lock.json                  # Lock file root
└── .gitignore                         # Pola file yang diabaikan git
```

---

## Backend (`backend/`)

```
backend/
├── server.js                    # ENTRY POINT — Express app, routes, cron, error handler
├── package.json                 # Dependencies & scripts backend
├── package-lock.json
├── .env                         # 🔒 Konfigurasi lingkungan (RAHASIA — di-ignore git)
├── .env.example                 # Contoh env (saat ini hanya ADMIN_WA_NUMBER)
├── .gitignore
├── tes.png                      # File uji coba (bukan bagian sistem)
├── credentials/
│   └── service-account.json     # 🔒 Kredensial Google Service Account (RAHASIA — di-ignore git)
└── src/
    ├── config/                  # Inisialisasi koneksi eksternal
    │   ├── db.js                # Pool MySQL
    │   ├── mailer.js            # Transporter Nodemailer (SMTP)
    │   └── sheets.js            # Klien Google Sheets API
    ├── controllers/             # Logika handler endpoint
    │   ├── trackingController.js
    │   ├── paymentController.js
    │   ├── draftController.js
    │   └── questionnaireController.js
    ├── middleware/              # Middleware Express
    │   ├── rateLimiter.js
    │   ├── upload.js            # Multer (memory storage, 5MB, JPG/PNG/PDF)
    │   └── validateTrackingCode.js
    ├── routes/                  # Definisi route per modul
    │   ├── trackingRoutes.js
    │   ├── paymentRoutes.js
    │   ├── draftRoutes.js
    │   └── questionnaireRoutes.js
    └── services/                # Logika bisnis & integrasi
        ├── statusService.js     # updateOrderStatus (inti transisi status)
        ├── notificationService.js
        ├── driveService.js
        ├── sheetsSyncService.js
        └── cronSyncService.js   # Sinkronisasi Sheets → MySQL (dipanggil cron)
```

## Frontend (`frontend/`)

```
frontend/
├── index.html                  # HTML entry (font Inter, #root, /src/main.jsx)
├── package.json
├── package-lock.json
├── .env                        # VITE_API_URL (arah ke backend)
├── tailwind.config.js          # Tema warna (leaf, soil, sun)
├── postcss.config.js
├── vite-dev.log                # Log proses dev (bukan bagian sistem)
├── vite-dev.err.log            # Log error dev (bukan bagian sistem)
├── README.md                   # Catatan internal frontend
├── public/
│   └── assets/images/          # logo.png, landingpage.jpg, landingpage-reference.png
├── dist/                       # 🔨 Hasil build production (dihasilkan, di-ignore git)
└── src/
    ├── main.jsx                # Entry React
    ├── App.jsx                 # Routing halaman (hash-based)
    ├── index.css               # Global CSS + Tailwind
    ├── components/             # Komponen reusable
    │   ├── Header.jsx
    │   ├── Footer.jsx
    │   ├── Logo.jsx
    │   └── AnimatedSection.jsx
    ├── data/
    │   └── siteData.js         # Konten statis (layanan, proses, nav, maps)
    ├── hooks/
    │   └── useHashRoute.js     # Hash router
    ├── pages/                  # Halaman utama
    │   ├── HomePage.jsx
    │   ├── TrackingPage.jsx
    │   ├── StatusPage.jsx
    │   └── SurveyPage.jsx
    └── services/
        └── api.js              # Axios client + fungsi API
```

---

## Klasifikasi Folder

### 🔴 Sangat Penting (inti sistem)

| Folder/File | Alasan |
|-------------|--------|
| `backend/server.js` | Entry point backend; mount semua route & cron |
| `backend/src/routes/` | Definisi seluruh endpoint |
| `backend/src/controllers/` | Logika handler endpoint |
| `backend/src/services/` | Logika bisnis: status, notifikasi, Drive, Sheets, cron |
| `backend/src/config/` | Koneksi DB, SMTP, Sheets |
| `backend/src/middleware/` | Rate limit, upload, validasi kode |
| `frontend/src/pages/` | Seluruh halaman UI |
| `frontend/src/components/` | Komponen reusable |
| `frontend/src/services/api.js` | Client API |
| `frontend/src/hooks/useHashRoute.js` | Router |
| `frontend/src/data/siteData.js` | Konten statis UI |
| `docs/` | Dokumentasi ini |

### 🟡 Boleh Diubah (konfigurasi/penyesuaian)

| Folder/File | Catatan |
|-------------|---------|
| `frontend/tailwind.config.js` | Tema warna/font |
| `frontend/src/index.css` | Gaya global |
| `frontend/index.html` | Metadata, font, title |
| `frontend/.env` | `VITE_API_URL` (bukan rahasia) |
| `backend/.env` | Konfigurasi lingkungan (RAHASIA, jangan di-commit) |
| `frontend/public/assets/images/` | Aset gambar publik |

### 🟢 Hanya Dependency / Artefak (jangan diedit)

| Folder/File | Alasan |
|-------------|--------|
| `node_modules/` (root, `backend/`, `frontend/`) | Dependencies; hasil `npm install` |
| `frontend/dist/` | Hasil build; diregenerasi `npm run build` |
| `package-lock.json` / `package-lock.json` (backend & frontend) | Lock file; dikelola npm |
| `backend.zip`, `frontend (2).zip` | Arsip; bukan bagian runtime |
| `frontend/vite-dev*.log` | Log dev |
| `backend/tes.png` | File uji coba |

### 🔒 Jangan Pernah Diubah / Di-commit

| File | Alasan |
|------|--------|
| `backend/credentials/service-account.json` | Kredensial Service Account Google — rahasia |
| `backend/.env` | Berisi token, password SMTP, refresh token OAuth, API token WhatsApp — rahasia |
| `.gitignore` (root & backend) | Memastikan file rahasia & build tidak ter-commit |

> ⚠️ **Catatan keamanan penting**: `backend/.env` saat ini berisi kredensial asli (SMTP password, Google OAuth refresh token, token Fonnte, Service Account). Jika repositori sudah pernah dibagikan, segera rotasi kredensial. `backend/credentials/` dan `backend/.env` sudah di-ignore oleh `.gitignore`.

---

## Dependency yang Dipakai

| Paket | Lokasi | Fungsi |
|-------|--------|--------|
| `express` ^5.2.1 | backend | Web framework |
| `mysql2` ^3.22.6 | backend | Driver MySQL (promise) |
| `googleapis` | backend | Google Sheets & Drive API |
| `nodemailer` ^9 | backend | Kirim email SMTP |
| `node-cron` | backend | Cron sinkronisasi |
| `multer` | backend | Upload file |
| `express-rate-limit` | backend | Rate limiting |
| `dotenv`, `cors` | backend | Env & CORS |
| `react`, `react-dom` | frontend | UI |
| `vite`, `@vitejs/plugin-react` | frontend | Build/dev server |
| `tailwindcss` ^3.4, `autoprefixer`, `postcss` | frontend | Styling |
| `framer-motion` | frontend | Animasi |
| `lucide-react` | frontend | Ikon |
| `axios` | frontend | HTTP client |

> **Catatan**: `package.json` di root berisi dependency `googleapis`, `multer`, `node-cron`, `nodemailer` — tampaknya duplikat dari backend dan **tidak digunakan** oleh `server.js` (backend memiliki `package.json` sendiri). Root `node_modules/` tidak dipakai runtime.

---

## Panduan: Folder Mana yang Boleh Diubah Saat Pengembangan

| Yang Ingin Anda Kerjakan | Edit di |
|--------------------------|---------|
| Menambah halaman/UI | `frontend/src/pages/`, `frontend/src/components/` |
| Menambah endpoint | `backend/src/routes/`, `backend/src/controllers/`, `backend/src/services/` |
| Menambah integrasi baru | `backend/src/services/` + `backend/src/config/` |
| Menambah kolom/tabel DB | Tidak ada migration — buat SQL manual + ubah query terkait |
| Menambah aturan sinkronisasi | `backend/src/services/cronSyncService.js` |
| Mengubah template notifikasi | `backend/src/services/notificationService.js` |
| Mengubah alur status | `backend/src/services/statusService.js` + `cronSyncService.js` |

---

## Catatan Akhir

1. **Tidak ada file konfigurasi Vite terpisah** (`vite.config.js`) — Vite berjalan dengan default; `.env` membawa `VITE_API_URL`.
2. **Backend belum punya script `start`/`dev`** di `package.json` (hanya placeholder `test`). Backend dijalankan dengan `node server.js` (atau `npx nodemon server.js`).
3. **Tidak ada Dockerfile / konfigurasi deploy** di kedua aplikasi.
4. **Skema database tidak ada di repositori** — hanya bisa di-rekonstruksi dari query (lihat `05_Database_Documentation.md`).
