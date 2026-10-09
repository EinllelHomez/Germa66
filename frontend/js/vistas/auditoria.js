// Vista Auditoría de accesos (solo Administrador): últimos eventos de seguridad.
import { el } from '../core/dom.js';
import { fmtDate } from '../core/formato.js';
import { cabecera } from '../componentes/cabecera.js';
import { thead } from '../componentes/tabla.js';
import * as Auditoria from '../modelos/auditoria.js';

export async function renderAuditoria(c) {
  c.replaceChildren(cabecera('auditoria', 'Últimos 50 eventos de seguridad.'));
  const box = el('div', { class: 'panel table-wrap' });
  c.append(box);
  try {
    const rows = await Auditoria.ultimos(50);
    box.replaceChildren(rows.length ? el('table', {},
      thead(['Fecha', 'Usuario', 'Acción', 'IP']),
      el('tbody', {}, rows.map((r) => el('tr', {},
        el('td', {}, fmtDate(r.fecha_hora)), el('td', {}, r.usuario || 'Desconocido'),
        el('td', {}, r.accion_realizada), el('td', {}, r.direccion_ip || '')))))
      : el('p', { class: 'empty' }, 'Aún no hay eventos registrados.'));
  } catch (ex) { box.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
}
