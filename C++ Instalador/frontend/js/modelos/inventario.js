// Modelo de inventario (RF-02).
import { api } from '../core/api.js';

export const listar = () => api('/inventario');
export const crear = (datos) => api('/inventario', { method: 'POST', body: datos });
export const actualizar = (id, cambios) => api('/inventario/' + id, { method: 'PATCH', body: cambios });
// Cyborgs que tienen asignado el ítem (para avisar antes de eliminarlo).
export const asignaciones = (id) => api(`/inventario/${id}/asignaciones`);
// forzar = true: el usuario ya vio el aviso y confirmó que se le quite a esos cyborgs.
export const eliminar = (id, forzar = false) => api('/inventario/' + id + (forzar ? '?forzar=1' : ''), { method: 'DELETE' });
