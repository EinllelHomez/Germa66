// Cliente HTTP de la API. Los modelos (js/modelos/) son los únicos que lo usan.
import { sesion } from './sesion.js';

const API = '/api';
let alExpirar = () => {};
// main.js registra aquí qué hacer cuando el servidor responde 401 (volver al login).
export const cuandoExpire = (fn) => { alExpirar = fn; };

export async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(sesion.token && { Authorization: 'Bearer ' + sesion.token }) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && sesion.token) { alExpirar(); throw new Error('Tu sesión expiró. Inicia sesión de nuevo.'); }
  if (!res.ok) throw new Error(data.error || 'Ocurrió un error inesperado.');
  return data;
}
