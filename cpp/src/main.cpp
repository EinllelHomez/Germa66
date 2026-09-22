#include <iostream>
#include "MotorReportes.h"

// Uso: reportes <inventario.csv> <pedidos.csv>
// Imprime el reporte en formato JSON por consola (Node lo captura y lo muestra).
int main(int argc, char* argv[]) {
    std::string rutaInventario = argc > 1 ? argv[1] : "data/inventario.csv";
    std::string rutaPedidos    = argc > 2 ? argv[2] : "data/pedidos.csv";

    MotorReportes motor;
    try {
        motor.cargarInventarioCSV(rutaInventario);
        motor.cargarPedidosCSV(rutaPedidos);
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }

    std::cout << motor.generarReporteJSON();
    return 0;
}
