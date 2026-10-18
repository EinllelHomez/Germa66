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

Otros scripts:

| Script | Qué hace |
|---|---|
| `npm run dev` | Arranca el servidor y lo reinicia al guardar cambios |
| `npm run init-db` | Solo crea las tablas y los roles (sin usuario Administrador) |
| `npm test` | Corre las pruebas (`test/auth.test.js`, `test/Inventario.test.js`) |

Las pruebas usan la base `germa66_test`; dale permisos al usuario sobre ella:
```sql
CREATE DATABASE germa66_test CHARACTER SET utf8mb4;
GRANT ALL ON germa66_test.* TO 'germa'@'localhost';
```

## Estructura MVC

```
backend/
  src/
    models/       MODELO: solo SQL; es lo único que toca la base de datos
    controllers/  CONTROLADOR: recibe la petición, valida, llama al modelo, decide la respuesta
    routes/       mapa URL → controlador, con authenticate/authorize (montadas en src/app.js)
    services/     lógica que no es SQL: motorReportes.service.js (ejecuta el motor en C++)
    domain/       catalogos.js: categorías, estados y roles válidos (una sola lista)
    middleware/   authenticate (JWT) y authorize (RBAC)
    config/       env.js (variables de entorno) y db.js (pool de MySQL)
    app.js, server.js
  database/       schema.sql (todas las tablas del MVP), init.js, seed.js
  test/           pruebas con node --test
frontend/         VISTA: la SPA, sin build (módulos de JavaScript nativos)
  index.html
  css/            tokens · base · componentes · vistas · responsive (en ese orden)
  js/
    main.js       arranque, menú de capítulos y navegación
    core/         api, dom, sesión, formato, movimiento (GSAP/Rough), capítulos y arte
    modelos/      un archivo por recurso: solo llamadas a la API
    componentes/  cabecera, cartel, tabla, avisos
    vistas/       una pantalla por archivo: pinta el DOM y maneja sus eventos
  assets/img/     personajes/ y marca/ (WebP optimizados)
cpp/              Motor de reportes en C++ (independiente, ver cpp/README.md)
```

Flujo de una petición: `routes` recibe la llamada → revisa permisos con
`middleware/auth.js` → el `controller` decide qué hacer → le pide los datos
al `model` correspondiente (y, si hace falta, usa un `service`) → responde JSON.
En el navegador, cada vista pide sus datos a su `modelo` y pinta el resultado.

Fuera del repositorio: `arte-original/` (imágenes a tamaño completo; la interfaz usa las optimizadas).

Tablas (`database/schema.sql`): `roles`, `usuarios`, `auditoria_seguridad`, `inventario`,
`cyborgs`, `cyborg_equipamiento`, `reinos_clientes`, `pedidos`, `pedido_items`.

## Roles

| Rol | Acceso |
|---|---|
| **Administrador** | Todo: usuarios, auditoría y todos los módulos operativos |
| **Operativo** | Inventario, cyborgs, clientes y reportes |

## API disponible

Todas las rutas (menos el login) requieren el header `Authorization: Bearer <token>`.

| Método | Ruta | Rol |
|---|---|---|
| POST | /api/auth/login | público |
| GET | /api/auth/me | autenticado |
| POST | /api/auth/logout | autenticado |
| GET / POST | /api/users | Administrador |
| PATCH | /api/users/:id | Administrador |
| GET | /api/auditoria | Administrador |
| GET / POST | /api/inventario | Administrador, Operativo |
| PATCH / DELETE | /api/inventario/:id | Administrador, Operativo |
| GET / POST | /api/cyborgs | Administrador, Operativo |
| PATCH | /api/cyborgs/:id | Administrador, Operativo |
| GET / POST | /api/cyborgs/:id/equipamiento | Administrador, Operativo |
| DELETE | /api/cyborgs/:id/equipamiento/:equipId | Administrador, Operativo |
| GET / POST | /api/clientes | Administrador, Operativo |
| PATCH | /api/clientes/:id | Administrador, Operativo |
| GET | /api/reportes | Administrador, Operativo |
| GET | /api/catalogos | autenticado |

**Pendiente:** el módulo de **Pedidos** (`/api/pedidos`). Las tablas `pedidos` y
`pedido_items` ya existen y la ruta está comentada en `backend/src/app.js`.

## Cómo agregar un módulo

Sigue el patrón de los módulos existentes (por ejemplo Inventario), en este orden:
1. `models/<modulo>.model.js`: todas las consultas SQL de ese módulo.
2. `controllers/<modulo>.controller.js`: usa el modelo, valida datos, decide códigos de estado.
3. `routes/<modulo>.routes.js` con `authenticate` y `authorize(...)`.
4. Montar la ruta en `backend/src/app.js`.
5. Si tiene listas de valores cerradas, agregarlas en `domain/catalogos.js`.
6. Frontend: `js/modelos/<modulo>.js` (llamadas a la API) y `js/vistas/<modulo>.js`
   (la pantalla); registrar la vista en `VISTAS` de `js/main.js`.
7. Agregar sus pruebas en `backend/test/`.

## Módulo C++ (motor de reportes)

Calcula el stock por categoría, los ítems bajo el mínimo y los pedidos por estado
a partir de los CSV de `cpp/data/`. Detalles del diseño y la compilación por línea
de comandos (`make run` o `g++`) en [`cpp/README.md`](cpp/README.md).

> Solo necesitas Dev-C++ si vas a **editar** el código C++: ya está compilado en
> `cpp/Reportes.exe`, que es donde lo busca el backend. Si lo recompilas, déjalo con ese nombre.

El instalador está en el repositorio (`C++ Instalador/`). Después de instalarlo:

1. **Crear un proyecto nuevo.** En Dev-C++: *File → New → Project...*
2. **Elegir el tipo de proyecto.** Selecciona *Console Application*, marca *C++* y en
   *Name* escribe `reportes`. Clic en *OK*.
3. **Guardarlo dentro de `cpp/`.** Navega a la carpeta del proyecto Germa66 y guárdalo
   dentro de `cpp/` (por ejemplo como `reportes.dev`).
4. **Borrar el archivo de ejemplo.** Dev-C++ abre un `main.cpp` con un "Hello World".
   Borra todo su contenido (Ctrl+A, Suprimir).
5. **Agregar los `.cpp` de `src/`.** En el panel *Project*, clic derecho sobre `reportes`
   → *Add to Project...*, ve a `cpp/src/` y selecciona (Ctrl+clic) `ArmamentoPesado.cpp`,
   `MotorReportes.cpp`, `RecursoMilitar.cpp` y `TrajeCombate.cpp`. Clic en *Abrir*.
6. **Pegar el `main.cpp` real.** Abre `cpp/src/main.cpp` en VS Code, copia todo su
   contenido y pégalo en el `main.cpp` vacío de Dev-C++. Guarda con Ctrl+S.
7. **Indicar la carpeta de los `.h`.** *Project → Project Options → Directories →
   Include Directories*, clic en *(...)*, selecciona `cpp/include/`, *Add* y *OK*.
8. **Compilar.** *Execute → Compile* (F9). Debe decir *Compiling successful* sin errores.

### Si salen advertencias (pero no errores)

Si compiló sin errores ni advertencias, sáltate esta parte.

1. Ve a *Project → Project Options*, pestaña *Compiler* (o *Settings*, según la versión).
2. Busca la opción *Language Standard* (puede estar bajo *Code Generation*).
3. Elige *ISO C++17 (-std=c++17)*.
4. Clic en *OK* y vuelve a compilar con F9. Ya no deberían salir advertencias.



## Convenciones de nombres

- **Estructura y términos técnicos en inglés:** carpetas y capas (`controllers`, `routes`,
  `models`, `middleware`, `services`) y acciones genéricas (`list`, `create`, `update`).
- **Dominio del negocio en español:** entidades y reglas propias de Germa 66
  (`cliente`, `inventario`, `cyborg`, `auditoria`, `reportes`).
- **Interfaz en español:** todos los textos y mensajes que ve el usuario.
