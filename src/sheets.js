import { google } from "googleapis";
import { CONFIG } from "./config.js";

async function getAuth() {
  const auth = new google.auth.GoogleAuth({
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.readonly"
    ]
  });
  return auth;
}

export async function findProductByPriceId(priceId) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: CONFIG.SHEET_ID,
    range: `${CONFIG.PRODUCTS_SHEET_NAME}!A2:E`
  });

  const rows = res.data.values || [];
  for (const row of rows) {
    const [ref, name, pId, driveFileId] = row;
    if (pId === priceId) {
      return { ref, name, priceId: pId, driveFileId };
    }
  }
  return null;
}

export async function appendDownloadRow(download) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const values = [[
    download.timestamp.toISOString(),
    download.email,
    download.priceId,
    download.ref,
    download.productName,
    download.token,
    download.expiresAt.toISOString(),
    download.downloadedAt || "",
    download.downloadCount || 0
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: CONFIG.SHEET_ID,
    range: `${CONFIG.DOWNLOADS_SHEET_NAME}!A2`,
    valueInputOption: "RAW",
    requestBody: { values }
  });
}

export async function findDownloadByToken(token) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: CONFIG.SHEET_ID,
    range: `${CONFIG.DOWNLOADS_SHEET_NAME}!A2:I`
  });

  const rows = res.data.values || [];
  let rowIndex = 2;
  for (const row of rows) {
    const [timestamp, email, priceId, ref, productName, t, expiresAt, downloadedAt, downloadCount] = row;
    if (t === token) {
      return {
        rowIndex,
        timestamp,
        email,
        priceId,
        ref,
        productName,
        token: t,
        expiresAt,
        downloadedAt,
        downloadCount: Number(downloadCount || 0)
      };
    }
    rowIndex++;
  }
  return null;
}

export async function updateDownloadRow(token, updates) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const dl = await findDownloadByToken(token);
  if (!dl) return;

  const newDownloadedAt = updates.downloadedAt
    ? updates.downloadedAt.toISOString()
    : dl.downloadedAt;
  const newCount = updates.downloadCount ?? dl.downloadCount;

  const values = [[
    dl.timestamp,
    dl.email,
    dl.priceId,
    dl.ref,
    dl.productName,
    dl.token,
    dl.expiresAt,
    newDownloadedAt,
    newCount
  ]];

  await sheets.spreadsheets.values.update({
    spreadsheetId: CONFIG.SHEET_ID,
    range: `${CONFIG.DOWNLOADS_SHEET_NAME}!A${dl.rowIndex}:I${dl.rowIndex}`,
    valueInputOption: "RAW",
    requestBody: { values }
  });
}

export async function logSaleToGoogleSheet({ email, priceId, fileId, amount, currency }) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const now = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: "1O-jUEkL9J5JV6sqM6x3FyJ20V30yXo6uZ1ezYOMv0uQ",
    range: "Sales!A2:G",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        now,
        email,
        priceId,
        fileId,
        amount,
        currency,
        "SUCCESS"
      ]]
    }
  });
}
