#ifndef RECURSO_MILITAR_H
#define RECURSO_MILITAR_H

#include <string>


class RecursoMilitar {
protected:
    std::string idRecurso;
    std::string nombre;
    std::string categoria;     
    int cantidadDisponible;
    int limiteMinimoStock;     
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

    void actualizarStock(int cantidad);      
    bool verificarStockMinimo() const;       

    virtual std::string describir() const;   
};

#endif
