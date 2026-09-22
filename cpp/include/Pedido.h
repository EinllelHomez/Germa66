#ifndef PEDIDO_H
#define PEDIDO_H

#include <string>

// Representa una fila de la tabla pedidos (RF-05), simplificada para el reporte.
struct Pedido {
    std::string idPedido;
    std::string cliente;
    std::string estado;   // pendiente | confirmado | en_preparacion | entregado | cancelado
};

#endif
