#include <iostream>
#include "MotorReportes.h"

// Uso: reportes <inventario.csv> <pedidos.csv> [cyborgs.csv]
// El tercer archivo es opcional: si no existe o no se pasa, el reporte
// simplemente sale con "cyborgsPorEstado" vacío, sin fallar.
// Imprime el reporte en formato JSON por consola (Node lo captura y lo muestra).
int main(int argc, char* argv[]) {
    std::string rutaInventario = argc > 1 ? argv[1] : "data/inventario.csv";
    std::string rutaPedidos    = argc > 2 ? argv[2] : "data/pedidos.csv";
    std::string rutaCyborgs    = argc > 3 ? argv[3] : "data/cyborgs.csv";

    MotorReportes motor;
    try {
        motor.cargarInventarioCSV(rutaInventario);
        motor.cargarPedidosCSV(rutaPedidos);
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    try {
        motor.cargarCyborgsCSV(rutaCyborgs);
    } catch (const std::exception&) {
        // Opcional: si no hay archivo de cyborgs todavía, seguimos sin él.
    }

    std::cout << motor.generarReporteJSON();
    return 0;
}