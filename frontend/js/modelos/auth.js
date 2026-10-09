// Modelo de autenticación: login, usuario actual y cierre de sesión.
import { api } from '../core/api.js';

export const login = (email, password) => api('/auth/login', { method: 'POST', body: { email, password } });
export const yo = () => api('/auth/me');
export const logout = () => api('/auth/logout', { method: 'POST' });
