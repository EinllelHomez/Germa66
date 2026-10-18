#ifndef MOTOR_REPORTES_H
#define MOTOR_REPORTES_H

#include <vector>
#include <map>
#include <memory>
#include <string>
#include "RecursoMilitar.h"
#include "Pedido.h"
#include "Cyborg.h"


class MotorReportes {
    std::vector<std::shared_ptr<RecursoMilitar>> inventario;
    std::vector<Pedido> pedidos;
    std::vector<Cyborg> cyborgs;

public:
    void cargarInventarioCSV(const std::string& ruta);
    void cargarPedidosCSV(const std::string& ruta);
    void cargarCyborgsCSV(const std::string& ruta);

    std::map<std::string, int> stockPorCategoria() const;
    std::vector<std::shared_ptr<RecursoMilitar>> itemsBajoMinimo() const;
    std::map<std::string, int> pedidosPorEstado() const;
    std::map<std::string, int> cyborgsPorEstado() const;

    int totalUnidadesInventario() const;
    
    std::shared_ptr<RecursoMilitar> itemCritico() const;

    
    std::string generarReporteJSON() const;
};

#endif