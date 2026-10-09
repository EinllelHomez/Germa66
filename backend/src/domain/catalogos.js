// Catálogos del negocio: los valores válidos de cada campo con lista cerrada.
// Es la única fuente: los controladores validan con estas listas y el frontend
// las recibe por GET /api/catalogos (deben coincidir con los ENUM de database/schema.sql).
module.exports = Object.freeze({
  categoriasInventario: ["arma", "raid_suit", "artefacto"],
  estadosInventario: ["disponible", "en_mantenimiento", "agotado", "baja"],
  estadosCyborg: ["activo", "en_mantenimiento", "baja"],
  estadosCuenta: ["al_dia", "en_mora", "suspendida"],
  roles: ["Administrador", "Operativo"],
});
