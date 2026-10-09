// Modelo de reinos clientes (RF-04).
import { api } from '../core/api.js';

export const listar = () => api('/clientes');
export const crear = (datos) => api('/clientes', { method: 'POST', body: datos });
export const actualizar = (id, cambios) => api('/clientes/' + id, { method: 'PATCH', body: cambios });
