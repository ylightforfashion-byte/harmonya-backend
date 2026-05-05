const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

async function getDb() {
  return open({
    filename: "./database.db",
    driver: sqlite3.Database,
  });
}

async function initDb() {
  const db = await getDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE,
      product_slug TEXT,
      expires_at TEXT,
      max_downloads INTEGER,
      downloads_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

module.exports = { getDb, initDb };
