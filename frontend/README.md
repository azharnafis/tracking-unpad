# Frontend Lab KTNT UNPAD

Frontend ini menggunakan Vite + ReactJS + TailwindCSS, dengan animasi dari Framer Motion dan ikon dari Lucide React.

## Menjalankan frontend

```bash
cd frontend
npm install
npm run dev
```

URL lokal biasanya: `http://127.0.0.1:5173/`.

## Build production

```bash
npm run build
```

Folder `dist/` adalah hasil build dan tidak perlu di-commit.

## Struktur utama

```text
frontend/
  index.html
  package.json
  tailwind.config.js
  postcss.config.js
  public/
    assets/
      images/
        hero-lab.jpg
        logo-lab-ktnt.png
        campus-map.jpg
  src/
    App.jsx
    main.jsx
    index.css
    components/
      AnimatedSection.jsx
      Footer.jsx
      Header.jsx
      Logo.jsx
    data/
      siteData.js
    hooks/
      useHashRoute.js
    pages/
      HomePage.jsx
      TrackingPage.jsx
```

## Halaman

- `#beranda`: landing page sesuai desain `landingpadge`.
- `#lacak-sampel`: halaman pencarian tracking dan alur proses sesuai desain `Lacak sampel`.

## Aset gambar

Simpan aset publik di:

```text
frontend/public/assets/images/
```

Nama file yang sudah disiapkan di kode:

- `hero-lab.jpg` untuk background hero landing page.
- `logo-lab-ktnt.png` jika nanti logo header ingin diganti menjadi gambar asli.
- `campus-map.jpg` jika ingin mengganti placeholder peta dengan gambar statis.

## Google Maps

Di `src/data/siteData.js`, isi nilai berikut dengan link embed Google Maps:

```js
export const googleMapsEmbedUrl = 'https://www.google.com/maps/embed?...'
```

Kalau kosong, UI akan memakai placeholder peta.