const crypto = require("crypto");
const { getDb } = require("./database");

function nowIso() {
  return new Date().toISOString();
}

function inHours(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

async function createToken(productSlug) {
  const db = await getDb();
  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = inHours(24); // lien valable 24h
  const maxDownloads = 3;        // 3 téléchargements max

  await db.run(
    `INSERT INTO tokens (token, product_slug, expires_at, max_downloads, downloads_count)
     VALUES (?, ?, ?, ?, 0)`,
    [token, productSlug, expiresAt, maxDownloads]
  );

  return token;
}

async function validateAndConsumeToken(token) {
  const db = await getDb();
  const row = await db.get(`SELECT * FROM tokens WHERE token = ?`, [token]);

  if (!row) return { valid: false, reason: "not_found" };

  const now = nowIso();
  if (row.expires_at && row.expires_at < now) {
    return { valid: false, reason: "expired" };
  }

  if (row.downloads_count >= row.max_downloads) {
    return { valid: false, reason: "limit" };
  }

  await db.run(
    `UPDATE tokens SET downloads_count = downloads_count + 1 WHERE token = ?`,
    [token]
  );

  return { valid: true, productSlug: row.product_slug };
}

module.exports = { createToken, validateAndConsumeToken };
