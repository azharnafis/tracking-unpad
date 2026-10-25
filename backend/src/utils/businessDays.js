function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Tambah n hari kerja (lewati Sabtu/Minggu) secara dinamis.
function addBusinessDays(startDate, days) {
  const result = startOfDay(startDate);
  let remaining = Number(days) || 0;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) remaining--;
  }
  return result;
}

// Hitung hari kerja dalam rentang (startExclusive, endInclusive].
function countBusinessDaysBetween(startExclusive, endInclusive) {
  let count = 0;
  const cur = startOfDay(startExclusive);
  const end = startOfDay(endInclusive);
  while (cur < end) {
    cur.setDate(cur.getDate() + 1);
    if (!isWeekend(cur)) count++;
  }
  return count;
}

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// WORK = estimasi hari kerja dari tanggal masuk, skip Sabtu/Minggu.
// Warning hanya relevan saat status masih ANALISIS.
function hitungEstimasi(tanggalMasuk, estimasiHariKerja, currentStatus, cert = null) {
  const mulai = startOfDay(tanggalMasuk);
  const targetSelesai = addBusinessDays(mulai, estimasiHariKerja);
  const hariIni = startOfDay(new Date());

  // Validasi sertifikat & tanggal terbit aktual dari ORDER!AI
  const hasCertLink = Boolean(
    cert && typeof cert.link_sertifikat === 'string' && cert.link_sertifikat.trim().length > 0
  );
  const tanggalSelesaiAktual =
    cert && cert.tanggal_terbit ? parseDateIndonesian(cert.tanggal_terbit) : null;
  const hasValidCert = hasCertLink && Boolean(tanggalSelesaiAktual);

  // KASUS 1: Pengujian selesai resmi (DOWNLOAD_SERTIFIKAT dan sertifikat valid)
  // Hentikan perhitungan keterlambatan dan gunakan tanggal terbit sertifikat sebagai tanggal selesai aktual.
  if (currentStatus === 'DOWNLOAD_SERTIFIKAT' && hasValidCert) {
    return {
      estimasi_hari_kerja: Number(estimasiHariKerja) || 0,
      tanggal_estimasi_selesai: toIsoDate(targetSelesai),
      tanggal_selesai_aktual: tanggalSelesaiAktual,
      sisa_hari_kerja: 0,
      label: 'Pengujian Selesai',
      is_selesai: true,
      data_inkonsisten: false,
      warning: false,
      is_warning: false,
    };
  }

  // KASUS 2: Status DOWNLOAD_SERTIFIKAT tetapi link atau tanggal belum lengkap/invalid
  // Jangan merekayasa tanggal penyelesaian aktual (set null), dan laporkan kondisi inkonsisten.
  if (currentStatus === 'DOWNLOAD_SERTIFIKAT' && !hasValidCert) {
    return {
      estimasi_hari_kerja: Number(estimasiHariKerja) || 0,
      tanggal_estimasi_selesai: toIsoDate(targetSelesai),
      tanggal_selesai_aktual: null,
      sisa_hari_kerja: 0,
      label: 'Menunggu Kelengkapan Sertifikat',
      is_selesai: false,
      data_inkonsisten: true,
      warning: false,
      is_warning: false,
    };
  }

  // KASUS 3: Order yang belum selesai (currentStatus !== 'DOWNLOAD_SERTIFIKAT')
  // Lanjutkan perhitungan hari kerja dinamis.
  let sisaHariKerja;
  if (targetSelesai >= hariIni) {
    sisaHariKerja = countBusinessDaysBetween(hariIni, targetSelesai);
  } else {
    sisaHariKerja = -countBusinessDaysBetween(targetSelesai, hariIni);
  }

  let label;
  if (sisaHariKerja > 0) {
    label = `${sisaHariKerja} Hari Kerja Lagi`;
  } else if (sisaHariKerja === 0) {
    label = 'Estimasi Selesai Hari Ini';
  } else {
    label = `Terlambat ${Math.abs(sisaHariKerja)} Hari Kerja`;
  }

  const isWarning = currentStatus === 'ANALISIS' && sisaHariKerja <= 2;

  return {
    estimasi_hari_kerja: Number(estimasiHariKerja) || 0,
    tanggal_estimasi_selesai: toIsoDate(targetSelesai),
    tanggal_selesai_aktual: null,
    sisa_hari_kerja: sisaHariKerja,
    label,
    is_selesai: false,
    data_inkonsisten: false,
    warning: isWarning,
    is_warning: isWarning,
  };
}

function parseDateIndonesian(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    return toIsoDate(val);
  }
  const str = String(val).trim();
  if (!str) return null;

  // DD/MM/YYYY or DD-MM-YYYY (Indonesian / Sheets standard)
  const slashMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    const day = String(slashMatch[1]).padStart(2, '0');
    const month = String(slashMatch[2]).padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Month names in ID / EN
  const months = {
    januari: '01', january: '01', jan: '01',
    februari: '02', february: '02', feb: '02',
    maret: '03', march: '03', mar: '03',
    april: '04', apr: '04',
    mei: '05', may: '05',
    juni: '06', june: '06', jun: '06',
    juli: '07', july: '07', jul: '07',
    agustus: '08', august: '08', agu: '08', aug: '08',
    september: '09', sep: '09', sept: '09',
    oktober: '10', october: '10', okt: '10', oct: '10',
    november: '11', nov: '11',
    desember: '12', december: '12', des: '12', dec: '12',
  };

  // e.g. "19 Januari 2026"
  const textMatch1 = str.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (textMatch1) {
    const day = String(textMatch1[1]).padStart(2, '0');
    const monthName = textMatch1[2].toLowerCase();
    const month = months[monthName];
    const year = textMatch1[3];
    if (month) return `${year}-${month}-${day}`;
  }

  // e.g. "September 1, 2026"
  const textMatch2 = str.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (textMatch2) {
    const monthName = textMatch2[1].toLowerCase();
    const month = months[monthName];
    const day = String(textMatch2[2]).padStart(2, '0');
    const year = textMatch2[3];
    if (month) return `${year}-${month}-${day}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return toIsoDate(parsed);
  }

  return null;
}

module.exports = {
  isWeekend,
  addBusinessDays,
  countBusinessDaysBetween,
  hitungEstimasi,
  startOfDaySafe: startOfDay,
  toIsoDate,
  parseDateIndonesian,
};
