const db = require('./database');

function seedStickers() {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO stickers (number, type, display_code, name) VALUES (@number, @type, @displayCode, @name)'
  );

  db.transaction(() => {
    for (let number = 1; number <= 584; number++) {
      insert.run({ number, type: 'normal', displayCode: String(number).padStart(3, '0'), name: null });
    }
    for (let number = 1; number <= 48; number++) {
      insert.run({ number, type: 'troquelada', displayCode: `T${String(number).padStart(2, '0')}`, name: null });
    }
    for (let number = 1; number <= 67; number++) {
      insert.run({ number, type: 'repechaje', displayCode: `E${String(number).padStart(2, '0')}`, name: null });
    }
  })();
}

module.exports = seedStickers;
