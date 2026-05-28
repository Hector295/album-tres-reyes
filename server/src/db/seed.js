const db = require('./database');

function seedStickers() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM stickers').get().count;
  if (count >= 632) return;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO stickers (number, type, display_code, name)
    VALUES (@number, @type, @displayCode, @name)
  `);

  const run = db.transaction(() => {
    for (let number = 1; number <= 584; number += 1) {
      insert.run({
        number,
        type: 'normal',
        displayCode: String(number).padStart(3, '0'),
        name: null
      });
    }

    for (let number = 1; number <= 48; number += 1) {
      insert.run({
        number,
        type: 'troquelada',
        displayCode: `T${String(number).padStart(2, '0')}`,
        name: null
      });
    }
  });

  run();
}

module.exports = seedStickers;
