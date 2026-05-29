# Album de Figuritas — 3 Reyes del Mundial 2026

App web multi-usuario para gestionar el álbum "3 Reyes del Mundial 2026".
Desplegada con Dokploy usando imagen Docker publicada en GHCR.

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js + Express (CommonJS) |
| Base de datos | SQLite via `better-sqlite3` (embebida, sin servidor externo) |
| Auth | JWT (`jsonwebtoken`) + hash de contraseñas (`bcryptjs`) |
| Frontend | React 18 + Vite + Tailwind CSS |
| HTTP client | `fetch` nativo con wrapper en `client/src/api/client.js` |
| Dev | `concurrently` — levanta server (:3001) y client (:5173) juntos |

---

## Comandos

```bash
npm run install:all   # instala dependencias en raíz + server + client
npm run dev           # inicia server en :3001 y client en :5173
npm run build         # compila React a client/dist (Vite)
npm run start         # inicia solo el server (para producción)
```

En producción el server sirve `client/dist` como archivos estáticos.

---

## Estructura de archivos

```
album/
├── Dockerfile                          # multi-stage: build React → imagen final
├── .github/workflows/docker-publish.yml
├── package.json                        # scripts raíz con concurrently
├── server/src/
│   ├── index.js                        # Express: middlewares, rutas, SPA fallback
│   ├── db/
│   │   ├── database.js                 # conexión SQLite (WAL mode, FK on)
│   │   ├── schema.js                   # CREATE TABLE + migraciones automáticas
│   │   └── seed.js                     # INSERT OR IGNORE de las 699 figuritas
│   ├── middleware/auth.js              # verifica JWT en Authorization: Bearer
│   └── routes/
│       ├── auth.js                     # POST /api/auth/register|login
│       ├── stickers.js                 # GET|POST /api/stickers (+ /stats, /bulk-add)
│       ├── trades.js                   # GET /api/trades (+ /:userId)
│       └── profile.js                  # GET|PUT /api/profile
└── client/src/
    ├── api/client.js                   # fetch wrapper, mantiene interfaz { data }
    ├── context/AuthContext.jsx         # token/user en localStorage, login/logout
    ├── App.jsx                         # navegación por estado (sin react-router-dom)
    └── pages/
        ├── Login.jsx / Register.jsx
        └── Album.jsx                   # vista principal con tabs: álbum|intercambios|perfil|exportar
            └── Album/components/
                ├── QuickAdd.jsx        # ingreso rápido (una a una / lista)
                ├── StatsBar.jsx        # Tengo / Faltan / Duplicadas
                ├── FilterBar.jsx       # tabs estado + tipo + búsqueda
                ├── StickerList.jsx     # lista con scroll CSS
                ├── Trades.jsx          # intercambios entre usuarios
                ├── Profile.jsx         # teléfono y correo de contacto
                └── ExportPDF.jsx       # reporte imprimible (ventana print)
```

---

## Base de datos

```sql
users         — id, username, password_hash, phone, email, created_at
stickers      — id, number, type, display_code, name       ← seed, no modifica el usuario
user_stickers — user_id, sticker_id, quantity              ← colección del usuario
```

La DB se persiste en `/app/server/data/album.sqlite` dentro del contenedor.
**Requiere volumen en Dokploy**: montar `/opt/album-data` → `/app/server/data`.

---

## Catálogo de figuritas (699 total)

| Tipo | Rango | Código | Total |
|---|---|---|---|
| `normal` | 1–584 | `001`…`584` | 584 |
| `troquelada` | 1–48 | `T01`…`T48` | 48 |
| `repechaje` | 1–67 | `E01`…`E67` | 67 |

El seed corre siempre con `INSERT OR IGNORE` — es seguro relanzar.
Las migraciones de schema también corren en cada arranque (idempotentes).

---

## API REST

Todas las rutas bajo `/api/`. Las de stickers, trades y profile requieren `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Crea usuario |
| POST | `/auth/login` | Devuelve JWT (7 días) |
| GET | `/stickers` | Lista con `?search=&type=&status=` |
| GET | `/stickers/stats` | `{ total, owned, missing, duplicates }` |
| POST | `/stickers/:id/add` | quantity +1 |
| POST | `/stickers/:id/remove` | quantity -1 (mín 0) |
| POST | `/stickers/bulk-add` | `{ items:[{number,type}] }` → agrega lista |
| GET | `/trades` | Resumen de intercambios posibles con otros usuarios |
| GET | `/trades/:userId` | Detalle de figuritas intercambiables con un usuario |
| GET | `/profile` | Datos de contacto del usuario actual |
| PUT | `/profile` | Actualiza `phone` y/o `email` |

---

## Lógica de colección

- **Tengo**: `quantity >= 1`
- **Me faltan**: `total - tengo`
- **Duplicadas**: `SUM(quantity - 1)` donde `quantity > 1`
- **Intercambios**: cruza `user_stickers` de dos usuarios via CROSS JOIN sobre `stickers`

---

## Ingreso de figuritas

**Una a una**: campo numérico + toggle N/T/E + Enter o botón. El teclado no se oculta en mobile (focus sincrónico antes de la operación async).

**Lista**: textarea con números separados por coma, punto y coma o salto de línea. Aplica el tipo seleccionado (N/T/E) a todos. Llama a `/stickers/bulk-add`. Si el mismo número aparece varias veces, suma esa cantidad.

Límites por tipo: Normal 1–584 (3 dígitos máx), Troquelada 1–48 (2 dígitos), Repechaje 1–67 (2 dígitos).

---

## CI/CD

`.github/workflows/docker-publish.yml`:
1. Build multi-stage Docker image
2. Push a `ghcr.io/<owner>/album:<branch-name>` (las `/` de la rama se reemplazan por `-`)
3. Llama el webhook de Dokploy para redesplegar (variable de entorno `WEBHOOK` en GitHub Secrets)

---

## Variables de entorno (server)

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `3001` | Puerto del servidor |
| `JWT_SECRET` | `dev-secret-change-me` | **Cambiar en producción** |
| `DB_PATH` | `server/data/album.sqlite` | Ruta de la base de datos |
| `CLIENT_ORIGIN` | `true` (todo) | Origen permitido para CORS |
| `NODE_ENV` | — | `production` activa el SPA fallback |
