// Pruebas simples, sin librerías externas, para no depender de nada
// que el equipo no tenga instalado. Uso: probar
#include <cassert>
#include <iostream>
#include "RecursoMilitar.h"
#include "TrajeCombate.h"
#include "ArmamentoPesado.h"
#include "MotorReportes.h"

static void test_stock_no_baja_de_cero() {
    RecursoMilitar r("X", "Prueba", "artefacto", 3, 5, "Sitio");
    r.actualizarStock(-10);
    assert(r.getCantidad() == 0);
    std::cout << "OK: el stock nunca queda negativo (RF-02)\n";
}

static void test_verifica_stock_minimo() {
    RecursoMilitar r("X", "Prueba", "arma", 2, 5, "Sitio");
    assert(r.verificarStockMinimo() == true);
    r.actualizarStock(10);
    assert(r.verificarStockMinimo() == false);
    std::cout << "OK: detecta stock bajo el mínimo\n";
}

static void test_herencia_describe_distinto() {
    TrajeCombate t("RS-1", "Traje", 5, 2, "Hangar", "Mark II", "operativo");
    ArmamentoPesado a("ARM-1", "Rifle", 5, 2, "Buque", "calibre-40", 1.0f);
    assert(t.describir() != a.describir());
    std::cout << "OK: cada subclase describe distinto (herencia real)\n";
}

static void test_reporte_completo() {
    MotorReportes motor;
    motor.cargarInventarioCSV("data/inventario.csv");
    motor.cargarPedidosCSV("data/pedidos.csv");
    assert(motor.itemsBajoMinimo().size() == 2);
    assert(motor.pedidosPorEstado().at("entregado") == 2);
    std::cout << "OK: el reporte agrupa correctamente los datos de ejemplo\n";
}

static void test_indicadores_ampliados() {
    MotorReportes motor;
    motor.cargarInventarioCSV("data/inventario.csv");
    motor.cargarPedidosCSV("data/pedidos.csv");
    motor.cargarCyborgsCSV("data/cyborgs.csv");

    // 15+2+8+1+20 = 46 unidades en total, sin importar la categoría.
    assert(motor.totalUnidadesInventario() == 46);

    // ARM-002 (2/5, déficit 3) está más lejos de su mínimo que RS-002 (1/3, déficit 2).
    auto critico = motor.itemCritico();
    assert(critico != nullptr);
    assert(critico->getId() == "ARM-002");

    auto porEstado = motor.cyborgsPorEstado();
    assert(porEstado.at("activo") == 2);
    assert(porEstado.at("en_mantenimiento") == 1);
    std::cout << "OK: calcula total de inventario, ítem crítico y cyborgs por estado\n";
}

int main() {
    test_stock_no_baja_de_cero();
    test_verifica_stock_minimo();
    test_herencia_describe_distinto();
    test_reporte_completo();
    test_indicadores_ampliados();
    std::cout << "\nTodas las pruebas pasaron.\n";
    return 0;
}