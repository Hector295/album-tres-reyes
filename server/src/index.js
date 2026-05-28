require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const initializeSchema = require('./db/schema');
const seedStickers = require('./db/seed');
const auth = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const stickerRoutes = require('./routes/stickers');
const tradeRoutes = require('./routes/trades');
const profileRoutes = require('./routes/profile');

initializeSchema();
seedStickers();

const app = express();
const port = process.env.PORT || 3001;
const clientDist = path.resolve(__dirname, '../../client/dist');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/stickers', auth, stickerRoutes);
app.use('/api/trades', auth, tradeRoutes);
app.use('/api/profile', auth, profileRoutes);

app.use(express.static(clientDist));
app.get('*', (_req, res, next) => {
  if (_req.path.startsWith('/api')) return next();
  return res.sendFile(path.join(clientDist, 'index.html'), (error) => {
    if (error) next();
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
