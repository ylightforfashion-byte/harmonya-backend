import { google } from "googleapis";
import { CONFIG } from "./config.js";

function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(CONFIG.GOOGLE_SERVICE_ACCOUNT),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

// -------------------------------
// PRODUITS
// -------------------------------
export async function findProductByPriceId(priceId) {
  const sheets = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: CONFIG.SHEET_ID,
    range: `${CONFIG.PRODUCTS_SHEET_NAME}!A2:D`,
  });

  const rows = res.data.values || [];

  for (const row of rows) {
    const [pId, ref, name, fileId] = row;
    if (pId === priceId) {
      return { priceId: pId, ref, name, fileId };
    }
  }

  return null;
}

// -------------------------------
// DOWNLOADS
// -------------------------------
export async function appendDownloadRow(data) {
  const sheets = getSheetsClient();

  await sheets.spreadsheets.values.append({
    spreadsheetId: CONFIG.SHEET_ID,
    range: `${CONFIG.DOWNLOADS_SHEET_NAME}!A:J`,
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          data.timestamp,
          data.email,
          data.priceId,
          data.ref,
          data.productName,
          data.token,
          data.expiresAt,
          data.downloadedAt,
          data.downloadCount,
          data.fileId,
        ],
      ],
    },
  });
}

export async function findDownloadByToken(token) {
  const sheets = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: CONFIG.SHEET_ID,
    range: `${CONFIG.DOWNLOADS_SHEET_NAME}!A:J`,
  });

  const rows = res.data.values || [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[5] === token) {
      return {
        rowIndex: i + 1,
        timestamp: row[0],
        email: row[1],
        priceId: row[2],
        ref: row[3],
        productName: row[4],
        token: row[5],
        expiresAt: row[6],
        downloadedAt: row[7],
        downloadCount: row[8],
        fileId: row[9],
      };
    }
  }

  return null;
}

export async function updateDownloadRow(rowIndex, updates) {
  const sheets = getSheetsClient();

  const row = [];

  row[7] = updates.downloadedAt;
  row[8] = updates.downloadCount;

  await sheets.spreadsheets.values.update({
    spreadsheetId: CONFIG.SHEET_ID,
    range: `${CONFIG.DOWNLOADS_SHEET_NAME}!H${rowIndex}:I${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[updates.downloadedAt, updates.downloadCount]],
    },
  });
}
