const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");

// El motor C++ se compila distinto según el sistema operativo:
// - Windows (computadores del equipo): cpp/Reportes.exe, compilado con Dev-C++.
// - Linux (servidor de Render): cpp/reportes, compilado con g++ por el Dockerfile.
// REPORTES_EXE permite indicar otra ruta si hace falta.
const NOMBRE_EXE = process.platform === "win32" ? "Reportes.exe" : "reportes";
const RUTA_EXE = process.env.REPORTES_EXE || path.join(__dirname, "..", "..", "..", "cpp", NOMBRE_EXE);

// Quita comas (rompen el CSV) y cambia los campos vacíos por "-".
// Un campo vacío al final de la línea hacía que el motor C++ saltara la fila
// (por ejemplo, un ítem sin ubicación no salía en el reporte).
function csvSafe(valor) {
  const texto = String(valor ?? "").replace(/[,\r\n]/g, " ").trim();
  return texto === "" ? "-" : texto;
}

function filaCSV(campos) {
  return campos.map(csvSafe).join(",");
}

async function generarReporte({ inventario, pedidos, cyborgs }) {
  const dirTemporal = fs.mkdtempSync(path.join(os.tmpdir(), "germa66-reportes-"));
  const rutaInventario = path.join(dirTemporal, "inventario.csv");
  const rutaPedidos = path.join(dirTemporal, "pedidos.csv");
  const rutaCyborgs = path.join(dirTemporal, "cyborgs.csv");

  try {
    fs.writeFileSync(rutaInventario, [
      "id,nombre,categoria,cantidad,minimo,ubicacion",
      ...inventario.map((i) => filaCSV([i.codigo, i.nombre, i.categoria, i.cantidad, i.minimo, i.ubicacion])),
    ].join("\n"));

    fs.writeFileSync(rutaPedidos, [
      "id,cliente,estado",
      ...pedidos.map((p) => filaCSV([p.id, p.cliente, p.estado])),
    ].join("\n"));

    fs.writeFileSync(rutaCyborgs, [
      "id,codigo,estado",
      ...cyborgs.map((c) => filaCSV([c.id, c.codigo, c.estado])),
    ].join("\n"));

    return await ejecutarMotor(rutaInventario, rutaPedidos, rutaCyborgs);
  } finally {
    fs.rm(dirTemporal, { recursive: true, force: true }, () => {});
  }
}

function ejecutarMotor(rutaInventario, rutaPedidos, rutaCyborgs) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(RUTA_EXE)) {
      return reject(new Error(
        process.platform === "win32"
          ? "No se encontró cpp/Reportes.exe. Compílalo en Dev-C++ y asegúrate de que quede en la carpeta cpp/ del proyecto."
          : "No se encontró el motor de reportes en " + RUTA_EXE + ". Compílalo con: g++ -std=c++17 -O2 -Icpp/include cpp/src/*.cpp -o cpp/reportes"
      ));
    }
    execFile(RUTA_EXE, [rutaInventario, rutaPedidos, rutaCyborgs], { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error("El motor de reportes (C++) falló: " + (stderr || error.message)));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error("El motor de reportes devolvió una salida que no es JSON válido."));
      }
    });
  });
}

module.exports = { generarReporte };
