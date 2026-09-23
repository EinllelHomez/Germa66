// Modelo Reportes (RF-06). No guarda nada en MySQL: su trabajo es exportar los
// datos reales a CSV y delegarle el cálculo al motor en C++ (cpp/Reportes.exe),
// que es quien realmente arma el reporte. Node solo hace de mensajero.
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");

// cpp/ es hermana de backend/ dentro de la carpeta del proyecto (Germa66/).
const RUTA_EXE = path.join(__dirname, "..", "..", "..", "cpp", "Reportes.exe");

// El parser de CSV del C++ es simple (no entiende comillas), así que evitamos
// que una coma dentro de un nombre rompa el formato quitándola en vez de escaparla.
function csvSafe(valor) {
  return String(valor ?? "").replace(/,/g, " ");
}

function filaCSV(campos) {
  return campos.map(csvSafe).join(",");
}

module.exports = (pool) => ({
  async generarReporte() {
    const [inventario] = await pool.query(
      "SELECT codigo, nombre, categoria, cantidad, minimo, ubicacion FROM inventario"
    );
    const [cyborgs] = await pool.query("SELECT id, codigo, estado FROM cyborgs");
    // RF-05 (Pedidos) todavía no existe: exportamos el archivo solo con encabezado.
    // El motor en C++ está preparado para eso (ver README de cpp/).

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

      return await this._ejecutarMotor(rutaInventario, rutaPedidos, rutaCyborgs);
    } finally {
      fs.rm(dirTemporal, { recursive: true, force: true }, () => {});
    }
  },

  _ejecutarMotor(rutaInventario, rutaPedidos, rutaCyborgs) {
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
  },
});