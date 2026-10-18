#ifndef TRAJE_COMBATE_H
#define TRAJE_COMBATE_H

#include "RecursoMilitar.h"


class TrajeCombate : public RecursoMilitar {
    std::string modeloTecnologico;
    std::string estadoMantenimiento;

public:
    TrajeCombate(std::string id, std::string nombre, int cantidad, int minimo,
                 std::string ubicacion, std::string modelo, std::string estado);

    void registrarMantenimiento(std::string nuevoEstado);
    std::string describir() const override;
};

#endif
