#include "MotorReportes.h"
#include "TrajeCombate.h"
#include "ArmamentoPesado.h"
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <iostream>

// Separa una línea de CSV por comas (formato simple, sin comas dentro de los campos).
static std::vector<std::string> splitCSV(const std::string& linea) {
    std::vector<std::string> campos;
    std::stringstream ss(linea);
    std::string campo;
    while (std::getline(ss, campo, ',')) campos.push_back(campo);
    return campos;
}

// Formato esperado: id,nombre,categoria,cantidad,minimo,ubicacion
// arma y raid_suit llevan además un dato extra (calibre o modelo) al final.
void MotorReportes::cargarInventarioCSV(const std::string& ruta) {
    std::ifstream archivo(ruta);
    if (!archivo.is_open()) throw std::runtime_error("No se pudo abrir " + ruta);

    std::string linea;
    std::getline(archivo, linea); // encabezado
    while (std::getline(archivo, linea)) {
        if (linea.empty()) continue;
        auto c = splitCSV(linea);
        if (c.size() < 6) continue;
        const std::string& categoria = c[2];
        int cantidad = std::stoi(c[3]);
        int minimo = std::stoi(c[4]);

        if (categoria == "raid_suit") {
            std::string modelo = c.size() > 6 ? c[6] : "estandar";
            inventario.push_back(std::make_shared<TrajeCombate>(
                c[0], c[1], cantidad, minimo, c[5], modelo, "operativo"));
        } else if (categoria == "arma") {
            std::string calibre = c.size() > 6 ? c[6] : "estandar";
            inventario.push_back(std::make_shared<ArmamentoPesado>(
                c[0], c[1], cantidad, minimo, c[5], calibre, 1.0f));
        } else {
            inventario.push_back(std::make_shared<RecursoMilitar>(
                c[0], c[1], categoria, cantidad, minimo, c[5]));
        }
    }
}

// Formato esperado: id,cliente,estado
void MotorReportes::cargarPedidosCSV(const std::string& ruta) {
    std::ifstream archivo(ruta);
    if (!archivo.is_open()) throw std::runtime_error("No se pudo abrir " + ruta);

    std::string linea;
    std::getline(archivo, linea); // encabezado
    while (std::getline(archivo, linea)) {
        if (linea.empty()) continue;
        auto c = splitCSV(linea);
        if (c.size() < 3) continue;
        pedidos.push_back({c[0], c[1], c[2]});
    }
}

std::map<std::string, int> MotorReportes::stockPorCategoria() const {
    std::map<std::string, int> resultado;
    for (const auto& item : inventario) resultado[item->getCategoria()] += item->getCantidad();
    return resultado;
}

std::vector<std::shared_ptr<RecursoMilitar>> MotorReportes::itemsBajoMinimo() const {
    std::vector<std::shared_ptr<RecursoMilitar>> resultado;
    for (const auto& item : inventario) if (item->verificarStockMinimo()) resultado.push_back(item);
    return resultado;
}

std::map<std::string, int> MotorReportes::pedidosPorEstado() const {
    std::map<std::string, int> resultado;
    for (const auto& p : pedidos) resultado[p.estado]++;
    return resultado;
}

static std::string jsonEscape(const std::string& s) {
    std::string out;
    for (char c : s) { if (c == '"' || c == '\\') out += '\\'; out += c; }
    return out;
}

std::string MotorReportes::generarReporteJSON() const {
    std::ostringstream json;
    json << "{\n  \"stockPorCategoria\": {";
    bool primero = true;
    for (const auto& [categoria, total] : stockPorCategoria()) {
        json << (primero ? "" : ",") << "\n    \"" << jsonEscape(categoria) << "\": " << total;
        primero = false;
    }
    json << "\n  },\n  \"itemsBajoMinimo\": [";
    primero = true;
    for (const auto& item : itemsBajoMinimo()) {
        json << (primero ? "" : ",") << "\n    {\"id\": \"" << jsonEscape(item->getId())
             << "\", \"nombre\": \"" << jsonEscape(item->getNombre())
             << "\", \"cantidad\": " << item->getCantidad()
             << ", \"minimo\": " << item->getLimiteMinimo() << "}";
        primero = false;
    }
    json << "\n  ],\n  \"pedidosPorEstado\": {";
    primero = true;
    for (const auto& [estado, total] : pedidosPorEstado()) {
        json << (primero ? "" : ",") << "\n    \"" << jsonEscape(estado) << "\": " << total;
        primero = false;
    }
    json << "\n  }\n}\n";
    return json.str();
}
