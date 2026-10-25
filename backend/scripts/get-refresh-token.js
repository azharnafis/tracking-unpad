const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const PORT = process.env.OAUTH_CALLBACK_PORT || 3000;
const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || `http://localhost:${PORT}/oauth2callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('[ERROR] GOOGLE_OAUTH_CLIENT_ID atau GOOGLE_OAUTH_CLIENT_SECRET belum ada di file backend/.env');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
});

console.log('================================================================');
console.log('  GOOGLE DRIVE OAUTH2 RE-AUTHORIZATION HELPER');
console.log('================================================================');
console.log('\nLangkah 1:');
console.log('Buka tautan Authorization URL berikut di browser Anda:\n');
console.log(authUrl);
console.log('\n----------------------------------------------------------------');
console.log('Langkah 2:');
console.log('- Login dengan Akun Google pemilik folder Drive (Test User).');
console.log('- Klik "Lanjutkan" / "Allow" untuk memberikan izin akses Google Drive.');
console.log('----------------------------------------------------------------\n');

// Buat server HTTP lokal untuk menangkap redirect code secara otomatis
let serverHandled = false;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.pathname === '/oauth2callback' || parsedUrl.pathname === '/') {
    const code = parsedUrl.query.code;
    const error = parsedUrl.query.error;

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>Otorisasi Ditolak</h1><p>Error: ${error}</p>`);
      console.error(`\n[ERROR] Otorisasi ditolak Google: ${error}`);
      server.close();
      process.exit(1);
      return;
    }

    if (code && !serverHandled) {
      serverHandled = true;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <div style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h1 style="color: #2e7d32;">Otorisasi Berhasil!</h1>
          <p>Refresh token berhasil diperoleh dan disimpan di server lokal.</p>
          <p>Anda dapat menutup halaman browser ini dan kembali ke terminal.</p>
        </div>
      `);

      await exchangeCodeAndSave(code);
      server.close();
      process.exit(0);
    }
  }
});

server.listen(PORT, () => {
  console.log(`[INFO] Menunggu callback otomatis di http://localhost:${PORT}/oauth2callback ...`);
  console.log('Jika Google me-redirect ke halaman yang menampilkan Authorization Code,');
  console.log('Anda juga dapat menyalin kode tersebut dan menempelkannya di bawah ini:');
  askManualCode();
});

server.on('error', (err) => {
  console.warn(`[WARN] Port ${PORT} sibuk: ${err.message}. Beralih ke mode input manual.`);
  askManualCode();
});

function askManualCode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('\nTempelkan Authorization Code di sini (atau biarkan jika otomatis via browser): ', async (input) => {
    rl.close();
    const code = input ? input.trim() : '';
    if (code && !serverHandled) {
      serverHandled = true;
      try {
        server.close();
      } catch (_) {}
      await exchangeCodeAndSave(code);
      process.exit(0);
    }
  });
}

async function exchangeCodeAndSave(code) {
  try {
    console.log('\n[INFO] Menukarkan authorization code dengan Refresh Token...');
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.warn('\n[WARN] Google tidak mengembalikan refresh_token.');
      console.warn('Hal ini terjadi jika izin akun sudah pernah diberikan sebelumnya tanpa prompt consent.');
      console.warn('Solusi: Buka https://myaccount.google.com/permissions, hapus akses aplikasi, lalu jalankan script ini lagi.');
      return;
    }

    const outputDir = path.join(__dirname, '..', 'credentials');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, 'new_refresh_token.txt');
    fs.writeFileSync(outputFile, tokens.refresh_token.trim(), 'utf8');

    console.log('\n================================================================');
    console.log('  BERHASIL! REFRESH TOKEN TELAH DIPEROLEH');
    console.log('================================================================');
    console.log(`Token telah disimpan dengan aman di file:`);
    console.log(`  backend/credentials/new_refresh_token.txt`);
    console.log('\nLangkah selanjutnya:');
    console.log('1. Buka file `backend/credentials/new_refresh_token.txt`.');
    console.log('2. Salin isinya ke variabel `GOOGLE_OAUTH_REFRESH_TOKEN` di file `backend/.env`.');
    console.log('3. Hapus file `backend/credentials/new_refresh_token.txt` setelah disalin.');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n[ERROR] Gagal menukarkan code:', err.message);
    if (err.response && err.response.data) {
      console.error('Detail:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

