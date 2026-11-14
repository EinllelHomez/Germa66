# Imagen para publicar Germa 66 en Render (o en cualquier servicio que use Docker).
# Render la construye solo cada vez que se suben cambios a GitHub.
FROM node:20-bookworm-slim

# Compilador de C++ para el motor de reportes
RUN apt-get update \
 && apt-get install -y --no-install-recommends g++ \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencias del backend: se instalan aquí (no se usa la carpeta node_modules del repositorio)
COPY backend/package.json backend/package-lock.json backend/
RUN cd backend && npm ci --omit=dev

# Código de la aplicación
COPY backend/ backend/
COPY frontend/ frontend/
COPY cpp/ cpp/

# Compila el motor C++ para Linux. Queda en cpp/reportes (en Windows se sigue usando cpp/Reportes.exe)
RUN g++ -std=c++17 -O2 -Icpp/include cpp/src/*.cpp -o cpp/reportes

ENV NODE_ENV=production
WORKDIR /app/backend

# Al arrancar: crea las tablas y el Administrador si no existen (seed), y luego inicia el servidor.
# El puerto lo pone Render en la variable PORT; el backend ya la lee en src/config/env.js.
CMD ["sh", "-c", "node database/seed.js && node src/server.js"]
