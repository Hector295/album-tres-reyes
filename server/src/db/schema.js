const db = require('./database');

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stickers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER NOT NULL,
      type TEXT NOT NULL,
      display_code TEXT NOT NULL,
      name TEXT,
      UNIQUE(number, type)
    );

    CREATE TABLE IF NOT EXISTS user_stickers (
      user_id INTEGER NOT NULL,
      sticker_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
      PRIMARY KEY (user_id, sticker_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (sticker_id) REFERENCES stickers(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_stickers_display_code ON stickers(display_code);
    CREATE INDEX IF NOT EXISTS idx_stickers_type_number ON stickers(type, number);
    CREATE INDEX IF NOT EXISTS idx_user_stickers_user ON user_stickers(user_id);
  `);

  // Migración: agrega columnas de contacto si no existen
  const columns = db.pragma('table_info(users)').map((c) => c.name);
  if (!columns.includes('phone')) db.exec('ALTER TABLE users ADD COLUMN phone TEXT');
  if (!columns.includes('email')) db.exec('ALTER TABLE users ADD COLUMN email TEXT');

  // Migración: elimina el CHECK constraint restrictivo de stickers para permitir 'repechaje'
  const stickersDef = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='stickers'").get();
  if (stickersDef && stickersDef.sql.includes("CHECK(type IN ('normal', 'troquelada'))")) {
    db.pragma('foreign_keys = OFF');
    db.exec(`
      CREATE TABLE stickers_new (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        number       INTEGER NOT NULL,
        type         TEXT NOT NULL,
        display_code TEXT NOT NULL,
        name         TEXT,
        UNIQUE(number, type)
      );
      INSERT INTO stickers_new (id, number, type, display_code, name)
        SELECT id, number, type, display_code, name FROM stickers;
      DROP TABLE stickers;
      ALTER TABLE stickers_new RENAME TO stickers;
      CREATE INDEX IF NOT EXISTS idx_stickers_display_code ON stickers(display_code);
      CREATE INDEX IF NOT EXISTS idx_stickers_type_number  ON stickers(type, number);
    `);
    db.pragma('foreign_keys = ON');
  }
}

module.exports = initializeSchema;
