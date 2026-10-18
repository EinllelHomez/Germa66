const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");

const RUTA_EXE = path.join(__dirname, "..", "..", "..", "cpp", "Reportes.exe");

function csvSafe(valor) {
  return String(valor ?? "").replace(/,/g, " ");
}

function filaCSV(campos) {
  return campos.map(csvSafe).join(",");
}

async function generarReporte({ inventario, cyborgs }) {
  const dirTemporal = fs.mkdtempSync(path.join(os.tmpdir(), "germa66-reportes-"));
  const rutaInventario = path.join(dirTemporal, "inventario.csv");
  const rutaPedidos = path.join(dirTemporal, "pedidos.csv");
  const rutaCyborgs = path.join(dirTemporal, "cyborgs.csv");

  try {
    fs.writeFileSync(rutaInventario, [
      "id,nombre,categoria,cantidad,minimo,ubicacion",
      ...inventario.map((i) => filaCSV([i.codigo, i.nombre, i.categoria, i.cantidad, i.minimo, i.ubicacion])),
    ].join("\n"));

    fs.writeFileSync(rutaPedidos, "id,cliente,estado");

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
        "No se encontró cpp/Reportes.exe. Compílalo en Dev-C++ y asegúrate de que quede en la carpeta cpp/ del proyecto."
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
