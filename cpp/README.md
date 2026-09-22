# Módulo C++ — Motor de Reportes (RF-06)

Calcula los indicadores de Inventario y Pedidos que se muestran en el panel
de Reportes: stock por categoría, ítems bajo el mínimo y pedidos por estado.
Es un programa independiente: no depende del backend ni de la base de datos.
Lee dos archivos CSV y devuelve un JSON.

## Diseño (según el diagrama de clases UML del SRS)

```
RecursoMilitar (clase base)
 ├── TrajeCombate    (Raid Suits)
 └── ArmamentoPesado (armas)
```

- `RecursoMilitar`: atributos y comportamiento comunes (`actualizarStock`,
  `verificarStockMinimo`), igual que en el diagrama.
- `MotorReportes`: carga los CSV, calcula los indicadores (RF-06) y arma el JSON.

## Cómo compilar y ejecutar

### Opción A: línea de comandos (g++/MinGW), Windows o Linux
```
make run
```
Eso compila y ejecuta con los datos de ejemplo en `data/`. Para usar otros
datos: `./reportes ruta/inventario.csv ruta/pedidos.csv`

Si no tienes `make`, compílalo directo:
```
g++ -std=c++17 -Iinclude src/*.cpp -o reportes
./reportes data/inventario.csv data/pedidos.csv
```

### Opción B: Dev-C++ / Code::Blocks
1. Crea un proyecto nuevo de consola en C++.
2. Agrega todos los `.cpp` de `src/` al proyecto.
3. En las opciones del proyecto, agrega `include/` como carpeta de encabezados
   (Project options > Directories > Include Directories).
4. Compila y ejecuta (F9 o F11). Al pedir argumentos, usa
   `data/inventario.csv data/pedidos.csv`, o dile al programa que ejecute
   sin argumentos: usará esas rutas por defecto si corres desde la carpeta `cpp/`.

## Formato de los CSV

`data/inventario.csv`: `id,nombre,categoria,cantidad,minimo,ubicacion,extra`
`categoria` es `arma`, `raid_suit` o `artefacto`.

`data/pedidos.csv`: `id,cliente,estado`
`estado` es `pendiente`, `confirmado`, `en_preparacion`, `entregado` o `cancelado`.

## Pruebas
```
make probar
```
Corre 4 pruebas sin librerías externas: que el stock nunca baja de cero, que
detecta bien el stock mínimo, que la herencia funciona y que el reporte agrupa
bien los datos de ejemplo.

## Pendiente para conectarlo con el panel web (Sprint 3)

1. El backend exporta el inventario y los pedidos de MySQL a estos mismos CSV
   (una consulta simple, ya con los datos reales).
2. Node ejecuta `reportes.exe` con `child_process.execFile` y captura la salida.
3. Esa salida (el JSON) se manda tal cual al frontend, en la ruta
   `GET /api/reportes`, para que el panel de Reportes la muestre.
