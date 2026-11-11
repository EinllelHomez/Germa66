// Modelo de pedidos (RF-05).
import { api } from '../core/api.js';

export const listar = (estado) => api('/pedidos' + (estado ? '?estado=' + encodeURIComponent(estado) : ''));
export const obtener = (id) => api('/pedidos/' + id);
export const crear = (datos) => api('/pedidos', { method: 'POST', body: datos });
export const agregarItem = (id, inventarioId, cantidad) =>
  api(`/pedidos/${id}/items`, { method: 'POST', body: { inventarioId, cantidad } });
export const quitarItem = (id, inventarioId) => api(`/pedidos/${id}/items/${inventarioId}`, { method: 'DELETE' });
export const cambiarEstado = (id, estado) => api(`/pedidos/${id}/estado`, { method: 'PATCH', body: { estado } });
