# Album de Figuritas — 3 Reyes del Mundial 2026

## Descripción

App web multi-usuario para gestionar el álbum "3 Reyes del Mundial 2026".
- **584** figuritas normales + **48** troqueladas = **632 total**
- Cada usuario tiene su propio álbum
- Registra las que tiene, ve las que le faltan y cuántas repetidas acumula

---

## Stack tecnológico

| Capa       | Tecnología                                      |
|------------|-------------------------------------------------|
| Backend    | Node.js + Express                               |
| Base datos | SQLite via `better-sqlite3` (embebida)          |
| Auth       | `jsonwebtoken` + `bcryptjs`                     |
| Frontend   | React + Vite + Tailwind CSS                     |
| HTTP       | Axios (con interceptor de JWT)                  |
| Dev runner | `concurrently` (server + client con un comando) |

---

## Estructura de archivos

```
album/
├── package.json                     # scripts raíz: dev, build
├── server/
│   ├── package.json
│   └── src/
│       ├── index.js                 # Express: cors, rutas, puerto 3001
│       ├── db/
│       │   ├── database.js          # conexión SQLite
│       │   ├── schema.js            # CREATE TABLE
│       │   └── seed.js              # inserta las 632 figuritas
│       ├── middleware/
│       │   └── auth.js              # verifica JWT en Authorization header
│       └── routes/
│           ├── auth.js              # /api/auth/register, /api/auth/login
│           └── stickers.js          # /api/stickers (list, stats, add, remove)
└── client/
    ├── package.json
    ├── vite.config.js               # proxy /api → localhost:3001
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                  # rutas: /login, /register, /album
        ├── api/
        │   └── client.js            # axios instance con interceptor de token
        ├── context/
        │   └── AuthContext.jsx      # token, user, login(), logout()
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            └── Album.jsx
                └── components/
                    ├── QuickAdd.jsx     # barra de ingreso rápido (sticky)
                    ├── StatsBar.jsx     # Tengo / Faltan / Repetidas
                    ├── FilterBar.jsx    # tabs + tipo + buscador
                    └── StickerList.jsx  # lista virtual (react-window)
```

---

## Base de datos

```sql
-- Usuarios
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- Catálogo completo de figuritas (seed fijo)
CREATE TABLE stickers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  number       INTEGER NOT NULL,        -- 1-584 normales / 1-48 troqueladas
  type         TEXT NOT NULL,           -- 'normal' | 'troquelada'
  display_code TEXT NOT NULL,           -- '001'...'584' o 'T01'...'T48'
  name         TEXT,                    -- opcional, null por defecto
  UNIQUE(number, type)
);

-- Colección de cada usuario
CREATE TABLE user_stickers (
  user_id    INTEGER NOT NULL,
  sticker_id INTEGER NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, sticker_id),
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (sticker_id) REFERENCES stickers(id)
);
```

**Seed:** figuritas 1–584 con `type='normal'` y display_code `'001'`…`'584'`;
figuritas 1–48 con `type='troquelada'` y display_code `'T01'`…`'T48'`.

---

## API REST

| Método | Ruta                       | Auth | Descripción                              |
|--------|----------------------------|------|------------------------------------------|
| POST   | /api/auth/register         | No   | Crea usuario con username + password     |
| POST   | /api/auth/login            | No   | Devuelve JWT + datos de usuario          |
| GET    | /api/stickers              | Sí   | Lista con quantity del usuario           |
| GET    | /api/stickers/stats        | Sí   | `{ total, owned, missing, duplicates }`  |
| POST   | /api/stickers/:id/add      | Sí   | Incrementa quantity en 1                 |
| POST   | /api/stickers/:id/remove   | Sí   | Decrementa quantity en 1 (mínimo 0)      |

**Filtros de GET /api/stickers:**
- `search` — filtra por `display_code` o `name`
- `type` — `normal` | `troquelada` | (vacío = todas)
- `status` — `owned` | `missing` | `duplicate` | (vacío = todas)

---

## Lógica de estadísticas

| Métrica    | Cálculo                                     |
|------------|---------------------------------------------|
| Tengo      | `COUNT` de stickers con `quantity >= 1`     |
| Me faltan  | `632 - tengo`                               |
| Repetidas  | `SUM(quantity - 1)` donde `quantity > 1`    |

---

## UX — Ingreso rápido (prioridad)

Barra sticky siempre visible en la parte superior de la pantalla:

```
[ 123 ]  [N / T]  [ Agregar ]
```

- **Campo numérico** con foco automático al cargar la página
- **Toggle N/T** para seleccionar Normal o Troquelada
- **Enter** agrega la figurita sin tocar el mouse
- Al agregar: campo se limpia y el foco vuelve listo para el siguiente número
- Feedback inmediato debajo del campo:
  - `"¡Agregada! #123"` si era nueva
  - `"Repetida ×2"` si ya la tenía
  - Shake visual si el número no existe
- En mobile: teclado numérico nativo, botones grandes (44px mínimo)

---

## UI — Wireframe

### Desktop

```
┌────────────────────────────────────────────────────────┐
│  3 Reyes del Mundial 2026              [Cerrar sesión] │
├────────────────────────────────────────────────────────┤
│  [ Número ]  [N][T]  [ Agregar ]   ← sticky           │
├──────────────┬──────────────┬──────────────────────────┤
│  Tengo       │  Me faltan   │  Repetidas               │
│  243 / 632   │    389       │     17                   │
├──────────────┴──────────────┴──────────────────────────┤
│  [Todas] [Tengo] [Me faltan] [Repetidas]               │
│  [Normales | Troqueladas]  [🔍 Buscar número...]       │
├────────────────────────────────────────────────────────┤
│  #001  Jugador A   [Normal]       [ − 1 + ]            │
│  #002  ----------  [Normal]       [   +   ]            │
│  T01   Troquelada  [Troquelada]   [ − 2 + ]  ×2       │
│  ...                                                   │
└────────────────────────────────────────────────────────┘
```

### Mobile

```
┌──────────────────────────────┐
│  3 Reyes 2026      [≡]       │
├──────────────────────────────┤
│  [ Núm ]  [N][T]  [Agregar] │  ← sticky
├──────────────────────────────┤
│  Tengo: 243  │  Faltan: 389  │
│  Repetidas: 17               │
├──────────────────────────────┤
│  [Todas][Tengo][Faltan][Rep] │
│  [🔍 Buscar...]              │
├──────────────────────────────┤
│  #001  Jugador A   [ − 1 + ] │
│  #002  ---------   [   +   ] │
│  T01   Troquelada  [ − 2 + ] │
└──────────────────────────────┘
```

---

## Comportamiento de la lista

- Filas con `quantity = 0` → atenuadas (gris)
- Filas con `quantity = 1` → destacadas (color normal)
- Filas con `quantity > 1` → badge `×N` en naranja/amarillo
- Scroll virtual con `react-window` para manejar 632 ítems sin lag
- Filtros y búsqueda se aplican en tiempo real sin recargar página

---

## CI/CD — GitHub Actions + GHCR

El repositorio incluye un workflow que construye una imagen Docker y la publica en `ghcr.io` con el nombre de la rama como tag.

### Archivos

```
album/
├── Dockerfile                        # imagen de producción (multi-stage)
└── .github/
    └── workflows/
        └── docker-publish.yml        # workflow de build + push
```

### Dockerfile (multi-stage)

```dockerfile
# Stage 1 — build del frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm run install:all && npm run build

# Stage 2 — imagen final solo con el server + dist
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist
COPY package.json .
RUN npm install --omit=dev
EXPOSE 3001
CMD ["node", "server/src/index.js"]
```

El server sirve el `client/dist` como archivos estáticos en producción, eliminando la necesidad de un servidor frontend separado.

### Workflow — docker-publish.yml

```yaml
name: Build & Push Docker Image

on:
  push:
    branches: ["**"]          # se dispara en cualquier rama

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract branch name as tag
        id: meta
        run: |
          BRANCH="${GITHUB_REF#refs/heads/}"
          # reemplaza / por - para nombres de rama compuestos (feat/algo → feat-algo)
          TAG="${BRANCH//\//-}"
          echo "tag=${TAG}" >> $GITHUB_OUTPUT

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:${{ steps.meta.outputs.tag }}
```

### Resultado

Cada push a cualquier rama genera y publica la imagen:

| Rama | Tag en GHCR |
|------|-------------|
| `main` | `ghcr.io/<owner>/album:main` |
| `develop` | `ghcr.io/<owner>/album:develop` |
| `feat/quick-add` | `ghcr.io/<owner>/album:feat-quick-add` |

La imagen es pública por defecto si el repo es público; privada si el repo es privado.

---

## Orden de implementación

1. Setup raíz (`package.json` + `concurrently`)
2. Backend: schema + seed + auth routes + sticker routes
3. Frontend base: Vite + Tailwind + routing + AuthContext
4. Páginas Login y Register
5. Componente QuickAdd (ingreso rápido)
6. Componente StatsBar
7. Componente FilterBar (tabs + tipo + buscador)
8. Componente StickerList con scroll virtual
9. Ajustes responsive mobile
10. `Dockerfile` multi-stage
11. Workflow `.github/workflows/docker-publish.yml`

---

## Cómo correr el proyecto

```bash
# Instalar dependencias (raíz + server + client)
npm run install:all

# Desarrollo (server en :3001, client en :5173)
npm run dev

# Build de producción
npm run build
```
