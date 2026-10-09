// Modelo de inventario (RF-02).
import { api } from '../core/api.js';

export const listar = () => api('/inventario');
export const crear = (datos) => api('/inventario', { method: 'POST', body: datos });
export const actualizar = (id, cambios) => api('/inventario/' + id, { method: 'PATCH', body: cambios });
export const eliminar = (id) => api('/inventario/' + id, { method: 'DELETE' });
