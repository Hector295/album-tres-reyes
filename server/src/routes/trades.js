const express = require('express');
const db = require('../db/database');

const router = express.Router();
const validTypes = new Set(['normal', 'troquelada', 'repechaje']);

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];

  const grouped = new Map();

  for (const item of items) {
    const number = Number(item?.number);
    const type = String(item?.type || '').trim();
    const quantity = Number(item?.quantity || 1);

    if (
      !Number.isInteger(number) ||
      number < 1 ||
      !validTypes.has(type) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return null;
    }

    const key = `${type}:${number}`;
    const current = grouped.get(key) || { number, type, quantity: 0 };
    current.quantity += quantity;
    grouped.set(key, current);
  }

  return [...grouped.values()];
}

function getStickerByNumber(number, type) {
  return db
    .prepare('SELECT id, number, type, display_code AS displayCode FROM stickers WHERE number = ? AND type = ?')
    .get(number, type);
}

function getUserQuantity(userId, stickerId) {
  const row = db
    .prepare('SELECT quantity FROM user_stickers WHERE user_id = ? AND sticker_id = ?')
    .get(userId, stickerId);
  return row?.quantity || 0;
}

// GET /api/trades — resumen de intercambios posibles con cada usuario
router.get('/', (req, res) => {
  const myId = req.user.id;

  const rows = db.prepare(`
    SELECT
      u.id,
      u.username,
      COUNT(DISTINCT CASE
        WHEN COALESCE(us_me.quantity, 0) = 0 AND COALESCE(us_other.quantity, 0) >= 1
        THEN s.id END) AS can_give_me,
      COUNT(DISTINCT CASE
        WHEN COALESCE(us_me.quantity, 0) > 1 AND COALESCE(us_other.quantity, 0) = 0
        THEN s.id END) AS i_can_give
    FROM users u
    CROSS JOIN stickers s
    LEFT JOIN user_stickers us_me    ON us_me.sticker_id    = s.id AND us_me.user_id    = ?
    LEFT JOIN user_stickers us_other ON us_other.sticker_id = s.id AND us_other.user_id = u.id
    WHERE u.id != ?
    GROUP BY u.id, u.username
    HAVING can_give_me > 0 OR i_can_give > 0
    ORDER BY (can_give_me + i_can_give) DESC
  `).all(myId, myId);

  res.json(rows);
});

// POST /api/trades/settle — aplica una operación libre: regalo, intercambio 1:1 o varios por uno.
router.post('/settle', (req, res) => {
  const myId = req.user.id;
  const give = normalizeItems(req.body.give);
  const receive = normalizeItems(req.body.receive);

  if (!give || !receive) {
    return res.status(400).json({ message: 'Figuritas inválidas' });
  }

  if (!give.length && !receive.length) {
    return res.status(400).json({ message: 'Agrega al menos una figurita' });
  }

  const resolvedGive = [];
  const resolvedReceive = [];

  for (const item of give) {
    const sticker = getStickerByNumber(item.number, item.type);
    if (!sticker) return res.status(404).json({ message: `No existe ${item.type} ${item.number}` });

    const currentQuantity = getUserQuantity(myId, sticker.id);
    if (currentQuantity < item.quantity) {
      return res.status(400).json({
        message: `No tienes suficientes ${sticker.displayCode}. Tienes ${currentQuantity} y quieres entregar ${item.quantity}.`
      });
    }

    resolvedGive.push({ ...item, sticker });
  }

  for (const item of receive) {
    const sticker = getStickerByNumber(item.number, item.type);
    if (!sticker) return res.status(404).json({ message: `No existe ${item.type} ${item.number}` });
    resolvedReceive.push({ ...item, sticker });
  }

  db.transaction(() => {
    for (const item of resolvedGive) {
      db.prepare(`
        INSERT INTO user_stickers (user_id, sticker_id, quantity)
        VALUES (?, ?, 0)
        ON CONFLICT(user_id, sticker_id)
        DO UPDATE SET quantity = MAX(quantity - ?, 0)
      `).run(myId, item.sticker.id, item.quantity);
    }

    for (const item of resolvedReceive) {
      db.prepare(`
        INSERT INTO user_stickers (user_id, sticker_id, quantity)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, sticker_id)
        DO UPDATE SET quantity = quantity + ?
      `).run(myId, item.sticker.id, item.quantity, item.quantity);
    }
  })();

  res.json({
    give: resolvedGive.map((item) => ({ ...item.sticker, quantity: item.quantity })),
    receive: resolvedReceive.map((item) => ({ ...item.sticker, quantity: item.quantity }))
  });
});

// GET /api/trades/:userId — detalle de figuritas intercambiables con un usuario
router.get('/:userId', (req, res) => {
  const myId = req.user.id;
  const otherId = Number(req.params.userId);

  if (!Number.isInteger(otherId) || otherId === myId) {
    return res.status(400).json({ message: 'Usuario inválido' });
  }

  const other = db.prepare('SELECT id, username, phone, email FROM users WHERE id = ?').get(otherId);
  if (!other) return res.status(404).json({ message: 'Usuario no encontrado' });

  // Figuritas que el otro tiene (qty >= 1) y yo no tengo (qty = 0)
  const theyHaveINeed = db.prepare(`
    SELECT s.id, s.number, s.type, s.display_code AS displayCode, s.name,
           us_other.quantity AS theirQuantity
    FROM stickers s
    JOIN user_stickers us_other
      ON us_other.sticker_id = s.id AND us_other.user_id = ? AND us_other.quantity >= 1
    LEFT JOIN user_stickers us_me
      ON us_me.sticker_id = s.id AND us_me.user_id = ?
    WHERE COALESCE(us_me.quantity, 0) = 0
    ORDER BY s.type, s.number
  `).all(otherId, myId);

  // Mis repetidas (qty > 1) que el otro no tiene (qty = 0)
  const iHaveTheyNeed = db.prepare(`
    SELECT s.id, s.number, s.type, s.display_code AS displayCode, s.name,
           us_me.quantity AS myQuantity
    FROM stickers s
    JOIN user_stickers us_me
      ON us_me.sticker_id = s.id AND us_me.user_id = ? AND us_me.quantity > 1
    LEFT JOIN user_stickers us_other
      ON us_other.sticker_id = s.id AND us_other.user_id = ?
    WHERE COALESCE(us_other.quantity, 0) = 0
    ORDER BY s.type, s.number
  `).all(myId, otherId);

  res.json({ user: other, theyHaveINeed, iHaveTheyNeed });
});

module.exports = router;
