const STATUS_ORDER = [
  'SAMPEL_DITERIMA',
  'PEMBAYARAN',
  'ANALISIS',
  'REVIEW_DRAFT',
  'PENGESAHAN',
  'DOWNLOAD_SERTIFIKAT',
];

const VALID_STATUSES = STATUS_ORDER;

const KEPUTUSAN_CUSTOMER = ['SETUJU', 'REVISI'];
const TINDAK_LANJUT_ADMIN = ['MENUNGGU_TINDAKAN', 'LANJUT_KE_PENGESAHAN'];
const JENIS_FAKTUR = ['FAKTUR_PAJAK', 'NON_FAKTUR'];
const STATUS_VALIDASI = ['PENDING', 'VALID', 'INVALID'];
const REKENING_PEMBAYARAN = ['BNI', 'MANDIRI'];

// Rekening ditentukan Admin langsung (PAYMENT.REKENING_PEMBAYARAN),
// tidak pernah menjadi input Customer. CASH tidak pernah muncul di API.
const REKENING_MAP = {
  BNI: { bank: 'BNI', nomor_rekening: '55414267' },
  MANDIRI: { bank: 'Mandiri', nomor_rekening: '63726257' },
};

// Skala resmi survey — teks adalah sumber kebenaran; angka hanya encoding
// internal di kolom tinyint q01-q14. Bintang murni visual di Frontend.
const SCALE_PUAS = {
  5: 'Sangat Puas',
  4: 'Puas',
  3: 'Cukup Puas/Biasa',
  2: 'Tidak Puas',
  1: 'Sangat Tidak Puas',
};

// Bagian IV (Akurasi Hasil Uji) sengaja berbeda sesuai formulir asli Lab.
const SCALE_BAIK = {
  5: 'Sangat Baik',
  4: 'Baik',
  3: 'Cukup Puas/Biasa',
  2: 'Tidak Puas',
  1: 'Sangat Tidak Puas',
};

const SURVEY_TEXT_TO_SCORE = {
  'Sangat Tidak Puas': 1,
  'Tidak Puas': 2,
  'Cukup Puas/Biasa': 3,
  Puas: 4,
  'Sangat Puas': 5,
  Baik: 4,
  'Sangat Baik': 5,
};

// Struktur resmi: Bagian I (q01-q04), II (q05-q07), III (q08-q13), IV (q14).
// Teks pertanyaan menunggu materi final dari Lab — diisi Frontend saat Phase 6.
const SURVEY_QUESTIONS = [
  { key: 'q01', bagian: 'I', skala: SCALE_PUAS },
  { key: 'q02', bagian: 'I', skala: SCALE_PUAS },
  { key: 'q03', bagian: 'I', skala: SCALE_PUAS },
  { key: 'q04', bagian: 'I', skala: SCALE_PUAS },
  { key: 'q05', bagian: 'II', skala: SCALE_PUAS },
  { key: 'q06', bagian: 'II', skala: SCALE_PUAS },
  { key: 'q07', bagian: 'II', skala: SCALE_PUAS },
  { key: 'q08', bagian: 'III', skala: SCALE_PUAS },
  { key: 'q09', bagian: 'III', skala: SCALE_PUAS },
  { key: 'q10', bagian: 'III', skala: SCALE_PUAS },
  { key: 'q11', bagian: 'III', skala: SCALE_PUAS },
  { key: 'q12', bagian: 'III', skala: SCALE_PUAS },
  { key: 'q13', bagian: 'III', skala: SCALE_PUAS },
  { key: 'q14', bagian: 'IV', skala: SCALE_BAIK },
];

function surveyScoreToText(key, score) {
  const q = SURVEY_QUESTIONS.find((item) => item.key === key);
  if (!q) return null;
  return q.skala[score] || null;
}

module.exports = {
  STATUS_ORDER,
  VALID_STATUSES,
  KEPUTUSAN_CUSTOMER,
  TINDAK_LANJUT_ADMIN,
  JENIS_FAKTUR,
  STATUS_VALIDASI,
  REKENING_PEMBAYARAN,
  REKENING_MAP,
  SCALE_PUAS,
  SCALE_BAIK,
  SURVEY_TEXT_TO_SCORE,
  SURVEY_QUESTIONS,
  surveyScoreToText,
};
