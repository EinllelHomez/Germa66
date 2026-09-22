#include "TrajeCombate.h"

TrajeCombate::TrajeCombate(std::string id, std::string nombre, int cantidad, int minimo,
                            std::string ubicacion, std::string modelo, std::string estado)
    : RecursoMilitar(std::move(id), std::move(nombre), "raid_suit", cantidad, minimo, std::move(ubicacion)),
      modeloTecnologico(std::move(modelo)), estadoMantenimiento(std::move(estado)) {}

void TrajeCombate::registrarMantenimiento(std::string nuevoEstado) {
    estadoMantenimiento = std::move(nuevoEstado);
}

std::string TrajeCombate::describir() const {
    return RecursoMilitar::describir() + " | modelo: " + modeloTecnologico + " | mantenimiento: " + estadoMantenimiento;
}
