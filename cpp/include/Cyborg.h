#ifndef CYBORG_H
#define CYBORG_H

#include <string>

// Representa una fila de la tabla cyborgs (RF-03), simplificada para el reporte.
struct Cyborg {
    std::string idCyborg;
    std::string codigo;
    std::string estado;   // activo | en_mantenimiento | baja
};

#endif