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

## Módulo C++  -- Solo se decarga el instalador de C++, Si van a editar el C++, si no lo van a tocar, no es necesario, ya que es un .exe

Abrir el descargador de c++, que estta en el repositorio.
Despues de descargar seguir estos pasos.
1. Crear un proyecto nuevo
En Dev-C++, ve al menú de arriba: File → New → Project...
2
2. Elegir tipo de proyecto
En la ventana que aparece, selecciona el ícono 'Console Application'. Abajo, donde dice 'C' y 'C++', marca 'C++'. En el campo 'Name' escribe: reportes . Dale clic en 'OK'.
3
3. Guardarlo dentro de tu carpeta cpp/
Te va a pedir dónde guardar el proyecto. Navega hasta la carpeta de tu proyecto Germa66 y guárdalo DENTRO de la carpeta cpp/ que ya tienes (por ejemplo, como 'reportes.dev'). Dale Guardar.
4
4. Borrar el archivo de ejemplo
Se abre un archivo llamado main.cpp con un código de ejemplo ('Hello World') que Dev-C++ crea automáticamente. Borra TODO ese contenido de adentro (Ctrl+A para seleccionar todo, luego Suprimir) — lo vamos a reemplazar con tu main.cpp real en el siguiente paso.
5
5. Agregar los archivos .cpp de src/
En el panel izquierdo ('Project'), haz clic derecho sobre 'reportes' (el nombre del proyecto) → 'Add to Project...'. Se abre un explorador de archivos: navega a tu carpeta cpp/src/ y selecciona estos 4 archivos a la vez (con Ctrl+clic): ArmamentoPesado.cpp, MotorReportes.cpp, RecursoMilitar.cpp, TrajeCombate.cpp. Dale Abrir.
6
6. Pegar el contenido real de main.cpp
Ahora sí, en el archivo main.cpp que quedó vacío, tenemos que pegar el contenido real de tu cpp/src/main.cpp. Ábrelo en VS Code, copia todo su contenido (Ctrl+A, Ctrl+C), y pégalo dentro del main.cpp vacío en Dev-C++ (Ctrl+V). Guarda con Ctrl+S.
7
7. Indicarle dónde están los .h (include)
Dev-C++ necesita saber dónde están los archivos .h (las carpetas 'include'). Ve a Project → Project Options → pestaña 'Directories' → sub-pestaña 'Include Directories'. Dale clic al botón con los tres puntos (...) y selecciona tu carpeta cpp/include/. Dale Add, luego OK.
8
8. Compilar
Ve al menú Execute → Compile (o presiona F9). Debería decir 'Compiling succesful' sin errores rojos. Si sale algún error, mandame una captura de pantalla completa de esa ventana.
 



Si sale advertencias pero no errores, seguir estos paso, Si no sale nada malo, como errores o advertencias, saltar estos pasos.



 1. Abrir Project Options → Compiler
Ve a Project → Project Options. Busca la pestaña 'Compiler' (o 'Settings', según la versión).
2
2. Buscar 'Language Standard'
Dentro de esa pestaña hay una lista de opciones organizadas en categorías. Busca una que diga algo como 'Language Standard' o 'C++ Standard' (puede estar bajo 'Code Generation').
3
3. Elegir C++17
En el menú desplegable de esa opción, elige 'ISO C++17 (-std=c++17)'.
4
4. Recompilar
Dale OK, y luego Execute → Compile (F9) de nuevo. Ahora no debería salir ninguna advertencia.
