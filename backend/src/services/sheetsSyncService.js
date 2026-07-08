const { sheets, SPREADSHEET_ID } = require('../config/sheets');

// Cari baris tertentu di sebuah sheet berdasarkan Kode_Tracking (ada di kolom A selalu)
async function findRowByKodeTracking(sheetName, kodeTracking, headerRow = 1) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${headerRow + 1}:Z1000`,
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((row) => row[0] === kodeTracking);

  if (rowIndex === -1) return null;

  // baris asli di sheet = headerRow + 1 (baris data pertama) + posisi ditemukan
  return { rowNumber: headerRow + 1 + rowIndex, rowData: rows[rowIndex] };
}

// Tulis 1 nilai ke sel tertentu (misal kolom C di baris tertentu)
async function updateCell(sheetName, rowNumber, columnLetter, value) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${columnLetter}${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[value]] },
  });
}

module.exports = { findRowByKodeTracking, updateCell };