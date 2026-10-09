// Modelo de reportes (RF-06): el backend los calcula con el motor en C++.
import { api } from '../core/api.js';

export const generar = () => api('/reportes');
