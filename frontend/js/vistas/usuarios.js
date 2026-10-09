// Vista Usuarios y roles (solo Administrador): alta de cuentas, rol y activación.
import { el, field } from '../core/dom.js';
import { sesion } from '../core/sesion.js';
import { fmtDate } from '../core/formato.js';
import { impacto } from '../core/movimiento.js';
import { cabecera } from '../componentes/cabecera.js';
import { thead, recargarFila } from '../componentes/tabla.js';
import { mostrarPopup } from '../componentes/toast.js';
import { catalogos } from '../modelos/catalogos.js';
import * as Usuarios from '../modelos/usuarios.js';

const opcionesRol = (actual) => catalogos.roles.map((r) => el('option', { value: r, selected: r === actual }, r));

export async function renderUsuarios(c) {
  const { me } = sesion;
  c.replaceChildren(cabecera('usuarios', 'Crea cuentas y define si son Administrador u Operativo.'));
  const msg = el('p', { class: 'msg', role: 'status' });

  const form = el('form', { class: 'panel', novalidate: true },
    el('h2', {}, 'Nuevo usuario'),
    el('div', { class: 'form-row' },
      field('Nombre', el('input', { name: 'nombre', required: true })),
      field('Correo', el('input', { name: 'email', type: 'email', required: true })),
      field('Contraseña (mínimo 8)', el('input', { name: 'password', type: 'password', minlength: 8, required: true, autocomplete: 'new-password' })),
      field('Rol', el('select', { name: 'rol' }, opcionesRol('Operativo'))),
      el('button', { class: 'btn primary', type: 'submit' }, 'Crear usuario')),
    msg);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(form));
    try {
      await Usuarios.crear(body);
      form.reset();
      impacto(form);
      mostrarPopup(`Usuario ${body.email} creado con éxito.`, 'success');
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
      const users = await Usuarios.listar();
      tableBox.replaceChildren(el('table', {},
        thead(['Nombre', 'Correo', 'Rol', 'Estado', 'Creado', '']),
        el('tbody', {}, users.map((u) => el('tr', { 'data-id': u.id },
          el('td', {}, u.nombre), el('td', {}, u.email),
          el('td', {}, el('select', { 'aria-label': `Rol de ${u.nombre}`, disabled: u.id === me.id, onchange: (e) => patch(u.id, { rol: e.target.value }) },
            opcionesRol(u.rol))),
          el('td', {}, el('span', { class: 'sello ' + (u.activo ? 'verde' : 'gris') }, u.activo ? 'Activo' : 'Desactivado')),
          el('td', {}, fmtDate(u.creado_en)),
          el('td', {}, u.id === me.id ? '' : el('button', { class: 'btn small', type: 'button', onclick: () => patch(u.id, { activo: !u.activo }) }, u.activo ? 'Desactivar' : 'Activar')))))));
    } catch (ex) { tableBox.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
  }
  async function patch(id, body) {
    let ok = false;
    try { await Usuarios.actualizar(id, body); ok = true; mostrarPopup('Cambios guardados con éxito.', 'success'); }
    catch (ex) { mostrarPopup(ex.message, 'error'); }
    await recargarFila(tableBox, loadTable, id, ok);
  }
}
