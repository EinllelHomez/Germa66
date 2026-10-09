// Modelo de auditoría de accesos (solo Administrador).
import { api } from '../core/api.js';

export const ultimos = (limite = 50) => api('/auditoria?limit=' + limite);
