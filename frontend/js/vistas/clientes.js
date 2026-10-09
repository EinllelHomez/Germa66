// Vista Reinos clientes (RF-04): alta de reinos y tabla editable de contacto y estado de cuenta.
import { el, field } from '../core/dom.js';
import { impacto } from '../core/movimiento.js';
import { cabecera } from '../componentes/cabecera.js';
import { thead, selectEstado, recargarFila } from '../componentes/tabla.js';
import { mostrarPopup } from '../componentes/toast.js';
import { catalogos } from '../modelos/catalogos.js';
import * as Clientes from '../modelos/clientes.js';

export async function renderClientes(c) {
  c.replaceChildren(cabecera('clientes', 'Reinos que compran armas y tropas a Germa, y su estado de cuenta (RF-04).'));
  const msg = el('p', { class: 'msg', role: 'status' });

  const form = el('form', { class: 'panel', novalidate: true },
    el('h2', {}, 'Nuevo reino cliente'),
    el('div', { class: 'form-row' },
      field('Nombre del reino', el('input', { name: 'nombre', required: true })),
      field('Contacto', el('input', { name: 'contacto' })),
      field('Ubicación', el('input', { name: 'ubicacion' })),
      el('button', { class: 'btn primary', type: 'submit' }, 'Registrar')),
    msg);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(form));
    try {
      await Clientes.crear(body);
      form.reset();
      impacto(form);
      mostrarPopup(`Cliente ${body.nombre} registrado con éxito.`, 'success');
      await loadTable();
    } catch (ex) {
      mostrarPopup(ex.message, 'error');
    }
  });

  const tableBox = el('div', { class: 'panel table-wrap' });
  c.append(form, tableBox);
  await loadTable();

  async function loadTable() {
    try {
      const clientes = await Clientes.listar();
      tableBox.replaceChildren(clientes.length ? el('table', {},
        thead(['Reino', 'Contacto', 'Ubicación', 'Estado de cuenta']),
        el('tbody', {}, clientes.map((cl) => el('tr', { 'data-id': cl.id },
          el('td', {}, cl.nombre),
          el('td', {}, el('input', {
            value: cl.contacto || '', title: cl.contacto || '', 'aria-label': `Contacto de ${cl.nombre}`,
            onchange: (e) => patch(cl.id, { contacto: e.target.value })
          })),
          el('td', {}, el('input', {
            value: cl.ubicacion || '', title: cl.ubicacion || '', 'aria-label': `Ubicación de ${cl.nombre}`,
            onchange: (e) => patch(cl.id, { ubicacion: e.target.value })
          })),
          el('td', {}, selectEstado(cl.estado_cuenta,
            { 'aria-label': `Estado de cuenta de ${cl.nombre}`, onchange: (e) => patch(cl.id, { estadoCuenta: e.target.value }) }, catalogos.estadosCuenta))))))
        : el('p', { class: 'empty' }, 'Aún no hay reinos clientes registrados.'));
    } catch (ex) { tableBox.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
  }
  async function patch(id, body) {
    let ok = false;
    try { await Clientes.actualizar(id, body); ok = true; mostrarPopup('Cambios guardados con éxito.', 'success'); }
    catch (ex) { mostrarPopup(ex.message, 'error'); }
    await recargarFila(tableBox, loadTable, id, ok);
  }
}
