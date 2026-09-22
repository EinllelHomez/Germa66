#ifndef ARMAMENTO_PESADO_H
#define ARMAMENTO_PESADO_H

#include "RecursoMilitar.h"

// Arma del RF-02. Hereda de RecursoMilitar (igual que en el diagrama UML).
class ArmamentoPesado : public RecursoMilitar {
    std::string calibreTipo;
    float nivelCalibracion;

public:
    ArmamentoPesado(std::string id, std::string nombre, int cantidad, int minimo,
                     std::string ubicacion, std::string calibre, float calibracion);

    std::string describir() const override;
};

#endif
