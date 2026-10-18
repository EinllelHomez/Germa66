// Vista Cyborgs (RF-03): alta de cyborgs, tabla de estados y panel de equipamiento de cada uno.
import { el, field } from '../core/dom.js';
import { fmtNum } from '../core/formato.js';
import { entrada, impacto } from '../core/movimiento.js';
import { cabecera } from '../componentes/cabecera.js';
import { thead, selectEstado, recargarFila } from '../componentes/tabla.js';
import { mostrarPopup } from '../componentes/toast.js';
import { confirmar } from '../componentes/confirmar.js';
import { catalogos } from '../modelos/catalogos.js';
import * as Cyborgs from '../modelos/cyborgs.js';
import * as Inventario from '../modelos/inventario.js';

export async function renderCyborgs(c) {
  c.replaceChildren(cabecera('cyborgs', 'El ejército de clones del reino y el equipamiento asignado a cada soldado (RF-03).'));
  const msg = el('p', { class: 'msg', role: 'status' });

  const form = el('form', { class: 'panel', novalidate: true },
    el('h2', {}, 'Nuevo cyborg'),
    el('div', { class: 'form-row' },
      field('Código', el('input', { name: 'codigo', required: true })),
      field('Serie', el('input', { name: 'serie', required: true })),
      field('Nombre', el('input', { name: 'nombre' })),
      el('button', { class: 'btn primary', type: 'submit' }, 'Registrar')),
    msg);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(form));
    try {
      await Cyborgs.crear(body);
      form.reset();
      impacto(form);
      mostrarPopup(`Cyborg ${body.codigo} registrado con éxito.`, 'success');
      await loadTable();
    } catch (ex) {
      mostrarPopup(ex.message, 'error');
    }
  });

  const tableBox = el('div', { class: 'panel table-wrap' });
  const equipoBox = el('div');
  c.append(form, tableBox, equipoBox);
  await loadTable();

  async function loadTable() {
    try {
      const cyborgs = await Cyborgs.listar();
      tableBox.replaceChildren(cyborgs.length ? el('table', {},
        thead(['Código', 'Serie', 'Nombre', 'Estado', ['Ítems asignados', 'num'], '']),
        el('tbody', {}, cyborgs.map((cy) => el('tr', { 'data-id': cy.id },
          el('td', {}, cy.codigo), el('td', {}, cy.serie), el('td', {}, cy.nombre || ''),
          el('td', {}, selectEstado(cy.estado,
            { 'aria-label': `Estado de ${cy.codigo}`, onchange: (e) => patchEstado(cy.id, e.target.value) }, catalogos.estadosCyborg)),
          el('td', { class: 'num' }, fmtNum(cy.items_asignados)),
          el('td', {}, el('div', { class: 'acciones' },
            el('button', { class: 'btn small', type: 'button', onclick: () => renderEquipo(cy) }, 'Equipamiento'),
            el('button', { class: 'btn small', type: 'button', onclick: () => remove(cy) }, 'Eliminar')))))))
        : el('p', { class: 'empty' }, 'Aún no hay cyborgs registrados.'));
    } catch (ex) { tableBox.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
  }
  async function remove(cy) {
    const n = Number(cy.items_asignados) || 0;
    const ok = await confirmar({
      titulo: `¿Eliminar ${cy.codigo}?`,
      mensaje: n
        ? `Este cyborg tiene ${n} ítem(s) de equipamiento asignado(s). Al eliminarlo, ese equipamiento vuelve al inventario.`
        : 'El cyborg se eliminará. Esta acción no se puede deshacer.',
    });
    if (!ok) return;
    try {
      await Cyborgs.eliminar(cy.id);
      equipoBox.replaceChildren(); // por si estaba abierto el panel de equipamiento de este cyborg
      mostrarPopup(`Cyborg ${cy.codigo} eliminado${n ? '; su equipamiento volvió al inventario' : ''}.`, 'success');
    } catch (ex) {
      mostrarPopup(ex.message, 'error');
    }
    await loadTable();
  }
  async function patchEstado(id, estado) {
    let ok = false;
    try { await Cyborgs.actualizar(id, { estado }); ok = true; mostrarPopup('Cambios guardados con éxito.', 'success'); }
    catch (ex) { mostrarPopup(ex.message, 'error'); }
    await recargarFila(tableBox, loadTable, id, ok);
  }

  // Panel de equipamiento de un cyborg concreto: se abre al pulsar "Equipamiento" en la tabla.
  async function renderEquipo(cyborg) {
    const equipoMsg = el('p', { class: 'msg', role: 'status' });
    const inventario = await Inventario.listar().catch(() => []);

    const asignarForm = el('form', { class: 'panel', novalidate: true },
      el('h2', {}, `Asignar equipamiento a ${cyborg.codigo}`),
      el('div', { class: 'form-row' },
        field('Ítem', el('select', { name: 'itemId', required: true },
          inventario.map((it) => el('option', { value: it.id }, `${it.codigo} — ${it.nombre} (disp: ${it.cantidad})`)))),
        field('Cantidad', el('input', { name: 'cantidad', type: 'number', min: 1, value: 1, required: true })),
        el('button', { class: 'btn primary', type: 'submit' }, 'Asignar')),
      equipoMsg);
    asignarForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(asignarForm));
      try {
        await Cyborgs.asignarEquipo(cyborg.id, body);
        impacto(asignarForm);
        mostrarPopup('Equipamiento asignado y stock descontado.', 'success');
        await loadEquipoTable();
        await loadTable();
      } catch (ex) {
        mostrarPopup(ex.message, 'error');
      }
    });

    const equipoTableBox = el('div', { class: 'panel table-wrap' });
    equipoBox.replaceChildren(asignarForm, equipoTableBox);
    entrada([asignarForm, equipoTableBox]);
    await loadEquipoTable();

    async function loadEquipoTable() {
      try {
        const items = await Cyborgs.listarEquipo(cyborg.id);
        equipoTableBox.replaceChildren(items.length ? el('table', {},
          thead(['Código', 'Nombre', ['Cantidad', 'num'], '']),
          el('tbody', {}, items.map((it) => el('tr', {},
            el('td', {}, it.item_codigo), el('td', {}, it.item_nombre), el('td', { class: 'num' }, fmtNum(it.cantidad)),
            el('td', {}, el('button', { class: 'btn small', type: 'button', onclick: () => quitar(it.id) }, 'Quitar'))))))
          : el('p', { class: 'empty' }, 'Este cyborg no tiene equipamiento asignado.'));
      } catch (ex) { equipoTableBox.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
    }
    async function quitar(equipId) {
      try {
        await Cyborgs.quitarEquipo(cyborg.id, equipId);
        mostrarPopup('Equipamiento devuelto al inventario con éxito.', 'success');
      } catch (ex) {
        mostrarPopup(ex.message, 'error');
      }
      await loadEquipoTable();
      await loadTable();
    }
  }
}
