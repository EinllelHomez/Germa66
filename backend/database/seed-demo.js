// Carga datos de ejemplo para que las pantallas no se vean vacías. Uso: npm run seed:demo
// Se puede ejecutar varias veces: no duplica ítems, cyborgs ni reinos, y solo crea pedidos si no hay ninguno.
// Requiere haber corrido antes "npm run seed" (necesita el usuario Administrador).
const env = require("../src/config/env");
const { createPool } = require("../src/config/db");
const { initDatabase } = require("./init");

const ITEMS = [
  // código, nombre, categoría, cantidad, mínimo, estado, ubicación
  ["ARM-001", "Cañón de plasma pesado", "arma", 12, 5, "disponible", "Arsenal A"],
  ["ARM-002", "Lanza eléctrica Vinsmoke", "arma", 20, 5, "disponible", "Arsenal A"],
  ["ARM-003", "Rifle de asalto Germa", "arma", 35, 10, "disponible", "Arsenal B"],
  ["ARM-004", "Misiles de largo alcance", "arma", 4, 8, "disponible", "Arsenal C"],
  ["RS-001", "Raid Suit Mk1", "raid_suit", 15, 5, "disponible", "Hangar 1"],
  ["RS-002", "Raid Suit Mk2", "raid_suit", 10, 5, "disponible", "Hangar 1"],
  ["RS-003", "Raid Suit Mk3", "raid_suit", 3, 5, "en_mantenimiento", "Taller"],
  ["ART-001", "Generador de campo eléctrico", "artefacto", 8, 3, "disponible", "Laboratorio"],
  ["ART-002", "Escudo de energía portátil", "artefacto", 14, 5, "disponible", "Laboratorio"],
  ["ART-003", "Sensor térmico de largo alcance", "artefacto", 25, 10, "disponible", "Laboratorio"],
  ["ART-004", "Módulo de propulsión", "artefacto", 0, 5, "agotado", "Taller"],
];

const CYBORGS = [
  // código, serie, nombre, modelo, especificaciones, estado
  ["CY-001", "SN-66-0001", "Ichiji Vinsmoke", "Raid Suit Mk1", "Fuerza sobrehumana, descargas eléctricas, armadura reforzada", "activo"],
  ["CY-002", "SN-66-0002", "Niji Vinsmoke", "Raid Suit Mk2", "Velocidad aumentada, propulsores en las piernas, sensores térmicos", "activo"],
  ["CY-003", "SN-66-0003", "Yonji Vinsmoke", "Raid Suit Mk3", "Brazos con propulsión y resistencia al calor", "activo"],
  ["CY-004", "SN-66-0004", "Reiju Vinsmoke", "Raid Suit Mk1", "Resistencia a venenos y camuflaje táctico", "activo"],
  ["CY-005", "SN-66-0005", "Soldado clon 05", "Raid Suit Mk3", "Unidad de infantería estándar", "en_mantenimiento"],
];

// cyborg → [código de ítem, cantidad]
const EQUIPAMIENTO = {
  "CY-001": [["ARM-002", 1], ["RS-001", 1]],
  "CY-002": [["RS-002", 1], ["ART-003", 2]],
  "CY-003": [["ARM-001", 1], ["ART-002", 1]],
  "CY-004": [["RS-001", 1], ["ARM-003", 2]],
};

const REINOS = [
  // nombre, representante, contacto, ubicación, estado de cuenta
  ["Reino de Dressrosa", "Rey Riku", "dressrosa@reino.com", "Mar del Norte", "al_dia"],
  ["Reino de Sorbet", "Rey Cobra", "sorbet@reino.com", "Mar del Este", "en_mora"],
  ["Reino de Wano", "Shogun Kozuki", "wano@reino.com", "Mar del Sur", "al_dia"],
  ["Reino de Alabasta", "Princesa Vivi", "alabasta@reino.com", "Mar del Oeste", "suspendida"],
];

// reino, estado, [código de ítem, cantidad]
const PEDIDOS = [
  ["Reino de Dressrosa", "pendiente", [["ARM-003", 5], ["RS-001", 2]]],
  ["Reino de Sorbet", "en_preparacion", [["ART-002", 3]]],
  ["Reino de Wano", "despachado", [["ARM-002", 4], ["ART-001", 1]]],
  ["Reino de Alabasta", "cancelado", [["RS-002", 1]]],
];

(async () => {
  const pool = createPool();
  try {
    await initDatabase(pool);
    const [[admin]] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [env.adminEmail]);
    if (!admin) throw new Error("No existe el Administrador. Corre primero: npm run seed");

    for (const it of ITEMS) {
      await pool.query(
        "INSERT IGNORE INTO inventario (codigo, nombre, categoria, cantidad, minimo, estado, ubicacion) VALUES (?,?,?,?,?,?,?)", it);
    }
    for (const cy of CYBORGS) {
      await pool.query(
        "INSERT IGNORE INTO cyborgs (codigo, serie, nombre, modelo, especificaciones, estado) VALUES (?,?,?,?,?,?)", cy);
    }
    for (const r of REINOS) {
      await pool.query(
        "INSERT IGNORE INTO reinos_clientes (nombre, representante, contacto, ubicacion, estado_cuenta) VALUES (?,?,?,?,?)", r);
    }

    // Equipamiento: solo a cyborgs que aún no tienen; descuenta el stock como lo hace la aplicación.
    for (const [codigo, lista] of Object.entries(EQUIPAMIENTO)) {
      const [[cy]] = await pool.query("SELECT id FROM cyborgs WHERE codigo = ?", [codigo]);
      const [[{ n }]] = await pool.query("SELECT COUNT(*) AS n FROM cyborg_equipamiento WHERE cyborg_id = ?", [cy.id]);
      if (n > 0) continue;
      for (const [codItem, cantidad] of lista) {
        const [[item]] = await pool.query("SELECT id FROM inventario WHERE codigo = ?", [codItem]);
        const [r] = await pool.query("UPDATE inventario SET cantidad = cantidad - ? WHERE id = ? AND cantidad >= ?", [cantidad, item.id, cantidad]);
        if (r.affectedRows) {
          await pool.query("INSERT INTO cyborg_equipamiento (cyborg_id, item_id, cantidad) VALUES (?,?,?)", [cy.id, item.id, cantidad]);
        }
      }
    }

    // Pedidos: solo si la tabla está vacía (no tienen código único para detectar duplicados).
    const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM pedidos");
    if (total === 0) {
      for (const [reino, estado, lista] of PEDIDOS) {
        const [[cl]] = await pool.query("SELECT id FROM reinos_clientes WHERE nombre = ?", [reino]);
        const [ped] = await pool.query("INSERT INTO pedidos (cliente_id, usuario_id, estado) VALUES (?,?,?)", [cl.id, admin.id, estado]);
        for (const [codItem, cantidad] of lista) {
          const [[item]] = await pool.query("SELECT id FROM inventario WHERE codigo = ?", [codItem]);
          await pool.query("INSERT INTO pedido_items (pedido_id, item_id, cantidad) VALUES (?,?,?)", [ped.insertId, item.id, cantidad]);
        }
      }
    }

    const cuenta = async (t) => (await pool.query("SELECT COUNT(*) AS n FROM " + t))[0][0].n;
    console.log(`Datos de ejemplo listos: ${await cuenta("inventario")} ítems, ${await cuenta("cyborgs")} cyborgs, ` +
      `${await cuenta("reinos_clientes")} reinos, ${await cuenta("pedidos")} pedidos.`);
  } catch (e) {
    console.error("Error en seed:demo:", e.message); process.exitCode = 1;
  } finally { await pool.end(); }
})();
