const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const router = express.Router();
const usernamePattern = /^[a-zA-Z0-9_.-]{3,32}$/;

function publicUser(user) {
  return { id: user.id, username: user.username };
}

function signToken(user) {
  return jwt.sign(publicUser(user), process.env.JWT_SECRET || 'dev-secret-change-me', {
    expiresIn: '7d'
  });
}

router.post('/register', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (!usernamePattern.test(username)) {
    return res.status(400).json({ message: 'Nombre de usuario inválido' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const passwordHash = bcrypt.hashSync(password, 12);

  try {
    const result = db
      .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
      .run(username, passwordHash);
    const user = { id: result.lastInsertRowid, username };

    return res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ message: 'El usuario ya existe' });
    }

    return res.status(500).json({ message: 'No se pudo crear el usuario' });
  }
});

router.post('/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  return res.json({ token: signToken(user), user: publicUser(user) });
});

module.exports = router;
