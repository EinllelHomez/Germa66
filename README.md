# Germa 66 — Sistema de información (MVP)

Backend en **MVC**: Node.js + Express + MySQL + JWT/RBAC.
Frontend en HTML/CSS/JS (sin build), servido por el mismo backend.
Módulo adicional en **C++** para el motor de reportes (carpeta `cpp/`).

## Arranque rápido (backend + frontend)

1. Crear la base y un usuario en MySQL (WampServer):
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
   npm start                 # http://localhost:4444
   ```
3. Entrar con el correo y clave que hayas puesto en `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Pruebas: `npm test` (usa la base `germa66_test`, dale permisos al usuario sobre ella).

## Estructura MVC del backend

```
backend/src/
  config/       variables de entorno
  db/           schema.sql (todas las tablas del MVP), init.js, seed.js, pool.js
  models/       Modelo: toda consulta SQL vive aquí (usuario, rol, auditoría)
  controllers/  Controlador: recibe la petición, llama al modelo, decide la respuesta
  routes/       una ruta por módulo, con authenticate/authorize (montadas en app.js)
  middleware/   authenticate (JWT) y authorize (RBAC)
frontend/       Vista: index.html, styles.css, app.js
cpp/            Motor de reportes en C++ (independiente, ver cpp/README.md)
```

Flujo de una petición: `routes` recibe la llamada → revisa permisos con
`middleware/auth.js` → el `controller` decide qué hacer → le pide los datos
al `model` correspondiente → el `model` es el único que toca la base de datos.

## API disponible (Sprint 0)

| Método | Ruta | Rol |
|---|---|---|
| POST | /api/auth/login | público |
| GET | /api/auth/me | autenticado |
| POST | /api/auth/logout | autenticado |
| GET/POST/PATCH | /api/users | Administrador |
| GET | /api/auditoria | Administrador |

## Cómo agregar un módulo (Sprint 2 y 3)

Sigue el patrón de Usuarios, en este orden:
1. `models/<modulo>.model.js`: todas las consultas SQL de ese módulo.
2. `controllers/<modulo>.controller.js`: usa el modelo, valida datos, decide códigos de estado.
3. `routes/<modulo>.routes.js` con `authenticate` y `authorize(...)`.
4. Montar la ruta en `app.js` (ya hay líneas comentadas).
5. Reemplazar el placeholder del módulo en `frontend/app.js`.

Las tablas de inventario, cyborgs, reinos_clientes y pedidos ya existen en `schema.sql`.

## Módulo C++

Ver `cpp/README.md`. Calcula los indicadores de Reportes (RF-06) leyendo CSV
y devolviendo JSON; es independiente del backend hasta que se conecte en el Sprint 3.
