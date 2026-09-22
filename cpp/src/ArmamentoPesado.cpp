#include "ArmamentoPesado.h"

ArmamentoPesado::ArmamentoPesado(std::string id, std::string nombre, int cantidad, int minimo,
                                   std::string ubicacion, std::string calibre, float calibracion)
    : RecursoMilitar(std::move(id), std::move(nombre), "arma", cantidad, minimo, std::move(ubicacion)),
      calibreTipo(std::move(calibre)), nivelCalibracion(calibracion) {}

std::string ArmamentoPesado::describir() const {
    return RecursoMilitar::describir() + " | calibre: " + calibreTipo;
}
