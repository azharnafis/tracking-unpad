const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '..', '..', process.env.GOOGLE_SERVICE_ACCOUNT_PATH),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

module.exports = { sheets, SPREADSHEET_ID };