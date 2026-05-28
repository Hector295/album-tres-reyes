const express = require('express');
const db = require('../db/database');

const router = express.Router();

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
