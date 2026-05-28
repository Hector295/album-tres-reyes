const express = require('express');
const db = require('../db/database');

const router = express.Router();
const TOTAL_STICKERS = 632;
const validTypes = new Set(['normal', 'troquelada']);
const validStatuses = new Set(['owned', 'missing', 'duplicate']);

function getStickerForUser(userId, stickerId) {
  return db
    .prepare(
      `
      SELECT s.id, s.number, s.type, s.display_code AS displayCode, s.name,
        COALESCE(us.quantity, 0) AS quantity
      FROM stickers s
      LEFT JOIN user_stickers us ON us.sticker_id = s.id AND us.user_id = ?
      WHERE s.id = ?
    `
    )
    .get(userId, stickerId);
}

router.get('/', (req, res) => {
  const search = String(req.query.search || '').trim();
  const type = String(req.query.type || '').trim();
  const status = String(req.query.status || '').trim();
  const conditions = [];
  const params = { userId: req.user.id };

  if (type) {
    if (!validTypes.has(type)) return res.status(400).json({ message: 'Tipo inválido' });
    conditions.push('s.type = @type');
    params.type = type;
  }

  if (search) {
    conditions.push("(s.display_code LIKE @search OR COALESCE(s.name, '') LIKE @search)");
    params.search = `%${search}%`;
  }

  if (status) {
    if (!validStatuses.has(status)) return res.status(400).json({ message: 'Estado inválido' });
    if (status === 'owned') conditions.push('COALESCE(us.quantity, 0) >= 1');
    if (status === 'missing') conditions.push('COALESCE(us.quantity, 0) = 0');
    if (status === 'duplicate') conditions.push('COALESCE(us.quantity, 0) > 1');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const stickers = db
    .prepare(
      `
      SELECT s.id, s.number, s.type, s.display_code AS displayCode, s.name,
        COALESCE(us.quantity, 0) AS quantity
      FROM stickers s
      LEFT JOIN user_stickers us ON us.sticker_id = s.id AND us.user_id = @userId
      ${where}
      ORDER BY CASE s.type WHEN 'normal' THEN 0 ELSE 1 END, s.number ASC
    `
    )
    .all(params);

  return res.json(stickers);
});

router.get('/stats', (req, res) => {
  const stats = db
    .prepare(
      `
      SELECT
        COUNT(CASE WHEN quantity >= 1 THEN 1 END) AS owned,
        COALESCE(SUM(CASE WHEN quantity > 1 THEN quantity - 1 ELSE 0 END), 0) AS duplicates
      FROM user_stickers
      WHERE user_id = ?
    `
    )
    .get(req.user.id);

  return res.json({
    total: TOTAL_STICKERS,
    owned: stats.owned || 0,
    missing: TOTAL_STICKERS - (stats.owned || 0),
    duplicates: stats.duplicates || 0
  });
});

router.post('/:id/add', (req, res) => {
  const stickerId = Number(req.params.id);
  const sticker = db.prepare('SELECT id FROM stickers WHERE id = ?').get(stickerId);
  if (!Number.isInteger(stickerId) || !sticker) {
    return res.status(404).json({ message: 'Figurita no encontrada' });
  }

  db.prepare(
    `
    INSERT INTO user_stickers (user_id, sticker_id, quantity)
    VALUES (?, ?, 1)
    ON CONFLICT(user_id, sticker_id)
    DO UPDATE SET quantity = quantity + 1
  `
  ).run(req.user.id, stickerId);

  return res.json(getStickerForUser(req.user.id, stickerId));
});

router.post('/:id/remove', (req, res) => {
  const stickerId = Number(req.params.id);
  const sticker = db.prepare('SELECT id FROM stickers WHERE id = ?').get(stickerId);
  if (!Number.isInteger(stickerId) || !sticker) {
    return res.status(404).json({ message: 'Figurita no encontrada' });
  }

  db.prepare(
    `
    INSERT INTO user_stickers (user_id, sticker_id, quantity)
    VALUES (?, ?, 0)
    ON CONFLICT(user_id, sticker_id)
    DO UPDATE SET quantity = MAX(quantity - 1, 0)
  `
  ).run(req.user.id, stickerId);

  return res.json(getStickerForUser(req.user.id, stickerId));
});

module.exports = router;
