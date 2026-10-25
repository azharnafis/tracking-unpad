const { sheets, SPREADSHEET_ID } = require('../config/sheets');
const { pool } = require('../config/db');

// Peta struktur final spreadsheet (Spreadsheet_Reference_Final.xlsx).
// Identifier kode tracking TIDAK selalu berada di kolom A:
//   ORDER -> kolom H (NO SAMPLE / ORDER NO, format: NNNN/MM/YYYY(CODE))
//   PENERIMAAN -> kolom C (CODE OF SAMPLE; D = KODE alternatif)
//   PAYMENT / DRAFT / SURVEY -> kolom E (blok identifier formula PARAMETER!E)
// Baris data semua sheet inti dimulai di baris 3 (baris 1-2 header/legend;
// terbukti dari formula silang ORDER!I3 / PENERIMAAN!A3 antar sheet).
const SHEETS_CONFIG = {
  ORDER: {
    name: 'ORDER',
    kodeColumn: 'H',
    dataStartRow: 3,
    endColumn: 'AJ',
    fields: {
      codeSample: 'B',
      codeLetter: 'C',
      orderNumber: 'D',
      tanggalMasuk: 'E',
      workDays: 'G',
      namaPerusahaan: 'I',
      email: 'K',
      noHp: 'L',
      jenisAnalisisSampel: 'AC',
      statusTracking: 'AG',
      linkSertifikat: 'AH',
      tanggalTerbitSertifikat: 'AI',
    },
  },
  PENERIMAAN: {
    name: 'PENERIMAAN',
    kodeColumn: 'C',
    dataStartRow: 3,
    endColumn: 'AI',
    fields: {
      receivedOn: 'F',
      dateOfAnalysis: 'G',
      workDays: 'I',
    },
  },
  PAYMENT: {
    name: 'PAYMENT',
    kodeColumn: 'D',
    dataStartRow: 3,
    endColumn: 'AD',
    fields: {
      nama: 'B',
      code: 'C',
      orderTracking: 'D',
      total: 'E',
      jenisFaktur: 'L',
      npwp: 'M',
      rekeningPembayaran: 'N',
      linkBuktiBayar: 'O',
      statusValidasi: 'P',
      cara: 'T',
      linkKwitansi: 'Z',
      keterangan: 'AA',
      linkInvoice: 'AB',
      noInvoice: 'AC',
      tanggalInvoice: 'AD',
    },
  },
  DRAFT: {
    name: 'DRAFT',
    kodeColumn: 'D',
    dataStartRow: 3,
    endColumn: 'J',
    fields: {
      nama: 'B',
      code: 'C',
      orderTracking: 'D',
      linkDraft: 'E',
      tanggalUpload: 'F',
      keputusanCustomer: 'G',
      tanggalKeputusan: 'H',
      tindakLanjutAdmin: 'I',
      tanggalTindakLanjut: 'J',
    },
  },
  SURVEY: {
    name: 'SURVEY',
    kodeColumn: 'D',
    dataStartRow: 3,
    endColumn: 'S',
    // Survey bersifat API-only; mapping ini hanya untuk pembacaan jika suatu
    // saat dibutuhkan. Tidak ada write-back MySQL -> SURVEY.
    fields: {
      nama: 'B',
      code: 'C',
      orderTracking: 'D',
      q01: 'E', q02: 'F', q03: 'G', q04: 'H',
      q05: 'I', q06: 'J', q07: 'K',
      q08: 'L', q09: 'M', q10: 'N', q11: 'O', q12: 'P', q13: 'Q',
      q14: 'R',
      feedback: 'S',
    },
  },
};

function columnToIndex(columnLetter) {
  return (
    columnLetter.split('').reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1
  );
}

function getCell(rowValues, columnLetter) {
  const value = rowValues[columnToIndex(columnLetter)];
  return value === undefined ? '' : value;
}

function buildRange(sheetKey) {
  const config = SHEETS_CONFIG[sheetKey];
  if (!config) throw new Error(`Sheet tidak dikenal: ${sheetKey}`);
  return `${config.name}!A${config.dataStartRow}:${config.endColumn}`;
}

async function fetchSheetRows(sheetKey) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: buildRange(sheetKey),
  });
  const rows = res.data.values || [];
  const startRow = SHEETS_CONFIG[sheetKey].dataStartRow;
  return rows.map((values, idx) => ({ rowNumber: startRow + idx, values }));
}

async function findByKodeTracking(sheetKey, kodeTracking) {
  const rows = await fetchSheetRows(sheetKey);
  const target = String(kodeTracking).replace(/\s+/g, '').trim();
  const hit = rows.find(
    (row) =>
      getCell(row.values, SHEETS_CONFIG[sheetKey].kodeColumn).toString().replace(/\s+/g, '').trim() === target
  );
  return hit || null;
}

function resolveFieldColumn(config, field) {
  if (config.fields[field]) return config.fields[field];
  if (/^[A-Z]+$/.test(field)) return field;
  throw new Error(`Field/kolom tidak dikenal di ${config.name}: ${field}`);
}

function buildBatchUpdateRequest(sheetKey, rowNumber, fieldValues) {
  const config = SHEETS_CONFIG[sheetKey];
  if (!config) throw new Error(`Sheet tidak dikenal: ${sheetKey}`);
  const data = Object.entries(fieldValues).map(([field, value]) => ({
    range: `${config.name}!${resolveFieldColumn(config, field)}${rowNumber}`,
    values: [[value]],
  }));
  // RAW agar Sheets tidak mem-parsing otomatis (mis. "0084" menjadi angka,
  // link menjadi formula). MySQL adalah sumber kebenaran nilai final.
  return { valueInputOption: 'RAW', data };
}

async function writeFields(sheetKey, rowNumber, fieldValues) {
  const resource = buildBatchUpdateRequest(sheetKey, rowNumber, fieldValues);
  if (resource.data.length === 0) return;
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource,
  });
}

/**
 * Menulis nilai field ke baris spreadsheet berdasarkan kode tracking.
 * Mencari baris dengan findByKodeTracking, lalu mengeksekusi batchUpdate
 * hanya pada sel-sel fieldValues yang ditentukan, dan mencatat sync_logs (MYSQL_TO_SHEET).
 *
 * @param {string} sheetKey - Kunci konfigurasi sheet (mis. 'PAYMENT', 'DRAFT')
 * @param {string} kodeTracking - Kode tracking untuk pencarian baris
 * @param {Object} fieldValues - Pasangan nama field (atau kolom) dan nilainya
 * @returns {Promise<{success: boolean, sheetName: string, rowNumber: number|null, updatedFields: string[], error: string|null}>}
 */
async function writeBackByKodeTracking(sheetKey, kodeTracking, fieldValues) {
  const config = SHEETS_CONFIG[sheetKey];
  const sheetName = config ? config.name : String(sheetKey);
  const updatedFields = Object.keys(fieldValues || {});

  if (!config) {
    const errorMsg = `Sheet tidak dikenal: ${sheetKey}`;
    console.error(`[WRITE_BACK] ${errorMsg}`);
    await recordSyncLog({
      sheetName,
      kodeTracking,
      direction: 'MYSQL_TO_SHEET',
      status: 'FAILED',
      errorMessage: errorMsg,
    });
    return {
      success: false,
      sheetName,
      rowNumber: null,
      updatedFields: [],
      error: errorMsg,
    };
  }

  if (!kodeTracking || !fieldValues || updatedFields.length === 0) {
    const errorMsg = 'kodeTracking dan fieldValues tidak boleh kosong';
    console.warn(`[WRITE_BACK] ${sheetName}: ${errorMsg}`);
    await recordSyncLog({
      sheetName,
      kodeTracking,
      direction: 'MYSQL_TO_SHEET',
      status: 'FAILED',
      errorMessage: errorMsg,
    });
    return {
      success: false,
      sheetName,
      rowNumber: null,
      updatedFields: [],
      error: errorMsg,
    };
  }

  try {
    const targetRow = await findByKodeTracking(sheetKey, kodeTracking);
    if (!targetRow) {
      const errorMsg = `Row dengan kode tracking ${kodeTracking} tidak ditemukan di sheet ${sheetName}`;
      console.warn(`[WRITE_BACK] ${sheetName}: ${errorMsg}`);
      await recordSyncLog({
        sheetName,
        kodeTracking,
        direction: 'MYSQL_TO_SHEET',
        status: 'FAILED',
        errorMessage: errorMsg,
      });
      return {
        success: false,
        sheetName,
        rowNumber: null,
        updatedFields: [],
        error: errorMsg,
      };
    }

    await writeFields(sheetKey, targetRow.rowNumber, fieldValues);

    await recordSyncLog({
      sheetName,
      kodeTracking,
      direction: 'MYSQL_TO_SHEET',
      status: 'SUCCESS',
      errorMessage: null,
    });

    console.log(
      `[WRITE_BACK] ${sheetName} row ${targetRow.rowNumber} (${kodeTracking}): berhasil update [${updatedFields.join(', ')}]`
    );

    return {
      success: true,
      sheetName,
      rowNumber: targetRow.rowNumber,
      updatedFields,
      error: null,
    };
  } catch (err) {
    const errorMsg = `Gagal write-back ke sheet ${sheetName}: ${err.message}`;
    console.error(`[WRITE_BACK] ${sheetName} (${kodeTracking}):`, err.message);
    await recordSyncLog({
      sheetName,
      kodeTracking,
      direction: 'MYSQL_TO_SHEET',
      status: 'FAILED',
      errorMessage: errorMsg,
    });
    return {
      success: false,
      sheetName,
      rowNumber: null,
      updatedFields: [],
      error: errorMsg,
    };
  }
}

// Pencatat sync_logs — sengaja tidak melempar error agar kegagalan logging
// tidak menghentikan alur sinkronisasi.
async function recordSyncLog({ sheetName, kodeTracking, direction, status, errorMessage }) {
  try {
    await pool.query(
      'INSERT INTO sync_logs (sheet_name, kode_tracking, direction, sync_status, error_message) VALUES (?, ?, ?, ?, ?)',
      [
        String(sheetName || '').slice(0, 50),
        String(kodeTracking || '').slice(0, 30),
        direction === 'MYSQL_TO_SHEET' ? 'MYSQL_TO_SHEET' : 'SHEET_TO_MYSQL',
        status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        String(errorMessage || '').slice(0, 500) || null,
      ]
    );
  } catch (err) {
    console.error('[SYNC_LOG] Gagal mencatat sync_logs:', err.message);
  }
}

module.exports = {
  SHEETS_CONFIG,
  columnToIndex,
  getCell,
  buildRange,
  fetchSheetRows,
  findByKodeTracking,
  buildBatchUpdateRequest,
  writeFields,
  writeBackByKodeTracking,
  recordSyncLog,
};
