const express = require('express');
const db = require('../db/database');

const router = express.Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+\d][\d\s\-().]{5,19}$/;

function getProfile(userId) {
  return db.prepare('SELECT id, username, phone, email FROM users WHERE id = ?').get(userId);
}

// GET /api/profile — datos de contacto del usuario actual
router.get('/', (req, res) => {
  res.json(getProfile(req.user.id));
});

// PUT /api/profile — actualiza teléfono y/o correo
router.put('/', (req, res) => {
  const phone = req.body.phone != null ? String(req.body.phone).trim() : null;
  const email = req.body.email != null ? String(req.body.email).trim() : null;

  if (phone && !phonePattern.test(phone)) {
    return res.status(400).json({ message: 'Número de teléfono inválido' });
  }
  if (email && !emailPattern.test(email)) {
    return res.status(400).json({ message: 'Correo electrónico inválido' });
  }

  db.prepare('UPDATE users SET phone = ?, email = ? WHERE id = ?').run(
    phone || null,
    email || null,
    req.user.id
  );

  res.json(getProfile(req.user.id));
});

module.exports = router;
