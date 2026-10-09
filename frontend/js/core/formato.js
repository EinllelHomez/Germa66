// Cómo se muestran los datos: nombres legibles, números, fechas y tono de los sellos.

// Tono del sello según el estado (pendiente dorado, en proceso azul, completado verde, cancelado gris).
export const TONO = {
  disponible: 'verde', activo: 'verde', al_dia: 'verde', completado: 'verde',
  en_mantenimiento: 'azul', en_proceso: 'azul',
  pendiente: 'dorado', en_mora: 'dorado',
  agotado: 'rojo',
  baja: 'gris', suspendida: 'gris', cancelado: 'gris',
};

// Nombres legibles de los valores internos de la base de datos (la API sigue recibiendo el valor).
const ETIQUETA = {
  arma: 'Arma', raid_suit: 'Raid Suit', artefacto: 'Artefacto',
  disponible: 'Disponible', en_mantenimiento: 'En mantenimiento', agotado: 'Agotado', baja: 'Baja',
  activo: 'Activo', al_dia: 'Al día', en_mora: 'En mora', suspendida: 'Suspendida',
  pendiente: 'Pendiente', confirmado: 'Confirmado', en_preparacion: 'En preparación', entregado: 'Entregado', cancelado: 'Cancelado',
};
export const etiqueta = (v) => ETIQUETA[v] || v;

export const fmtNum = (n) => Number(n).toLocaleString('es-CO');

export const fmtDate = (s) => {
  const d = new Date(s);
  return isNaN(d) ? '—' : d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
};
