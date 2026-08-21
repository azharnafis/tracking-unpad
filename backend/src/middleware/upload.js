const multer = require('multer');

// Simpan file sementara di memori (bukan disimpan permanen di disk server kita),
// karena tujuan akhirnya langsung diteruskan ke Google Drive
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // maksimal 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipe file tidak didukung. Gunakan JPG, PNG, atau PDF.'));
    }
  },
});

module.exports = { upload };