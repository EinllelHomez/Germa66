#ifndef RECURSO_MILITAR_H
#define RECURSO_MILITAR_H

#include <string>

// Clase base del diagrama UML (SRS, sección "Diagramas de Clases UML").
// TrajeCombate y ArmamentoPesado heredan de aquí, igual que en el diagrama.
class RecursoMilitar {
protected:
    std::string idRecurso;
    std::string nombre;
    std::string categoria;     // "arma" | "raid_suit" | "artefacto" (RF-02)
    int cantidadDisponible;
    int limiteMinimoStock;     // usado para las alertas de stock bajo
    std::string ubicacionFlota;

public:
    RecursoMilitar(std::string id, std::string nombre, std::string categoria,
                   int cantidad, int minimo, std::string ubicacion);
    virtual ~RecursoMilitar() = default;

    std::string getId() const;
    std::string getNombre() const;
    std::string getCategoria() const;
    int getCantidad() const;
    int getLimiteMinimo() const;

    void actualizarStock(int cantidad);      // += cantidad (puede ser negativo)
    bool verificarStockMinimo() const;       // true si está por debajo del mínimo

    virtual std::string describir() const;   // cada subclase la ajusta
};

#endif
