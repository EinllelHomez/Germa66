# Germa 66 — Sistema de información (MVP)

Node.js + Express + MySQL + JWT/RBAC. Frontend en HTML/CSS/JS (sin build) servido por el mismo backend.

## Arranque rápido

1. Crear la base y un usuario en MySQL:
   ```sql
   CREATE DATABASE germa66 CHARACTER SET utf8mb4;
   CREATE USER 'germa'@'localhost' IDENTIFIED BY 'germa123';
   GRANT ALL ON germa66.* TO 'germa'@'localhost';
   ```
2. Configurar y arrancar:
   ```bash
   cd backend
   cp .env.example .env      # ajusta JWT_SECRET y credenciales de BD
   npm install
   npm run seed              # crea tablas, roles y el Administrador inicial
   npm start                 # http://localhost:3000
   ```
3. Entrar con `admin@germa66.local` / `Admin123*` (cámbiala en `.env` antes del seed).

Pruebas: `npm test` (usa la base `germa66_test`, dale permisos al usuario sobre ella).

## Estructura

```
backend/src/
  config/       variables de entorno
  db/           schema.sql (todas las tablas del MVP), init.js, seed.js, pool.js
  middleware/   authenticate (JWT) y authorize (RBAC)
  controllers/  auth, users, audit
  routes/       una ruta por módulo (montadas en app.js)
  services/     auditoría de seguridad
frontend/       index.html, styles.css, app.js
```

## API disponible (Sprint 0)

| Método | Ruta | Rol |
|---|---|---|
| POST | /api/auth/login | público |
| GET | /api/auth/me | autenticado |
| POST | /api/auth/logout | autenticado |
| GET/POST/PATCH | /api/users | Administrador |
| GET | /api/auditoria | Administrador |

## Cómo agregar un módulo (Sprint 2 y 3)

1. `controllers/<modulo>.controller.js` con la lógica (usa consultas con `?`, nunca concatenes).
2. `routes/<modulo>.routes.js` con `authenticate` y `authorize(...)`.
3. Montarla en `app.js` (ya hay líneas comentadas).
4. Reemplazar el placeholder del módulo en `frontend/app.js`.
Las tablas de inventario, cyborgs, reinos_clientes y pedidos ya existen en `schema.sql`.
