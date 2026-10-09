// Modelo de usuarios y roles (solo Administrador).
import { api } from '../core/api.js';

export const listar = () => api('/users');
export const crear = (datos) => api('/users', { method: 'POST', body: datos });
export const actualizar = (id, cambios) => api('/users/' + id, { method: 'PATCH', body: cambios });
