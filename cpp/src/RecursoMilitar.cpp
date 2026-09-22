#include "RecursoMilitar.h"

RecursoMilitar::RecursoMilitar(std::string id, std::string nombre, std::string categoria,
                                int cantidad, int minimo, std::string ubicacion)
    : idRecurso(std::move(id)), nombre(std::move(nombre)), categoria(std::move(categoria)),
      cantidadDisponible(cantidad), limiteMinimoStock(minimo), ubicacionFlota(std::move(ubicacion)) {}

std::string RecursoMilitar::getId() const { return idRecurso; }
std::string RecursoMilitar::getNombre() const { return nombre; }
std::string RecursoMilitar::getCategoria() const { return categoria; }
int RecursoMilitar::getCantidad() const { return cantidadDisponible; }
int RecursoMilitar::getLimiteMinimo() const { return limiteMinimoStock; }

void RecursoMilitar::actualizarStock(int cantidad) {
    cantidadDisponible += cantidad;
    if (cantidadDisponible < 0) cantidadDisponible = 0; // RF-02: nunca negativo
}

bool RecursoMilitar::verificarStockMinimo() const {
    return cantidadDisponible <= limiteMinimoStock;
}

std::string RecursoMilitar::describir() const {
    return nombre + " (" + categoria + ") - stock: " + std::to_string(cantidadDisponible);
}
