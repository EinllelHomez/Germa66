// Modelo de cyborgs y su equipamiento (RF-03).
import { api } from '../core/api.js';

export const listar = () => api('/cyborgs');
export const crear = (datos) => api('/cyborgs', { method: 'POST', body: datos });
export const actualizar = (id, cambios) => api('/cyborgs/' + id, { method: 'PATCH', body: cambios });

export const listarEquipo = (cyborgId) => api(`/cyborgs/${cyborgId}/equipamiento`);
export const asignarEquipo = (cyborgId, datos) => api(`/cyborgs/${cyborgId}/equipamiento`, { method: 'POST', body: datos });
export const quitarEquipo = (cyborgId, equipId) => api(`/cyborgs/${cyborgId}/equipamiento/${equipId}`, { method: 'DELETE' });
