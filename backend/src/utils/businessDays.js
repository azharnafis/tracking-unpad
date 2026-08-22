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
function hitungEstimasi(tanggalMasuk, estimasiHariKerja, currentStatus) {
  const mulai = startOfDay(tanggalMasuk);
  const targetSelesai = addBusinessDays(mulai, estimasiHariKerja);
  const hariIni = startOfDay(new Date());

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

  return {
    estimasi_hari_kerja: Number(estimasiHariKerja) || 0,
    tanggal_estimasi_selesai: toIsoDate(targetSelesai),
    sisa_hari_kerja: sisaHariKerja,
    label,
    warning:
      currentStatus === 'ANALISIS' && sisaHariKerja <= 2,
  };
}

module.exports = {
  isWeekend,
  addBusinessDays,
  countBusinessDaysBetween,
  hitungEstimasi,
  startOfDaySafe: startOfDay,
  toIsoDate,
};
