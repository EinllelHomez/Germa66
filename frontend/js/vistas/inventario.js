// Vista Inventario (RF-02): alta de ítems y tabla editable con aviso de stock bajo el mínimo.
import { el, field, icono } from '../core/dom.js';
import { impacto } from '../core/movimiento.js';
import { cabecera } from '../componentes/cabecera.js';
import { thead, opciones, selectEstado, inputNum, digitosMax, recargarFila } from '../componentes/tabla.js';
import { mostrarPopup } from '../componentes/toast.js';
import { confirmar } from '../componentes/confirmar.js';
import { catalogos } from '../modelos/catalogos.js';
import * as Inventario from '../modelos/inventario.js';

export async function renderInventario(c) {
  c.replaceChildren(cabecera('inventario', 'El arsenal de Germa: armamento, Raid Suits y artefactos para la venta (RF-02).'));
  const msg = el('p', { class: 'msg', role: 'status' });

  const form = el('form', { class: 'panel', novalidate: true },
    el('h2', {}, 'Nuevo ítem'),
    el('div', { class: 'form-row' },
      field('Código', el('input', { name: 'codigo', required: true })),
      field('Nombre', el('input', { name: 'nombre', required: true })),
      field('Categoría', el('select', { name: 'categoria' }, opciones(catalogos.categoriasInventario))),
      field('Cantidad', el('input', { name: 'cantidad', type: 'number', min: 0, required: true, value: 0 })),
      field('Mínimo', el('input', { name: 'minimo', type: 'number', min: 0, required: true, value: 5 })),
      field('Ubicación', el('input', { name: 'ubicacion' })),
      el('button', { class: 'btn primary', type: 'submit' }, 'Registrar')),
    msg);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(form));
    try {
      await Inventario.crear(body);
      form.reset();
      impacto(form);
      mostrarPopup(`Ítem ${body.codigo} registrado con éxito.`, 'success');
      await loadTable();
    } catch (ex) {
      mostrarPopup(ex.message, 'error');
    }
  });

  const alertaBox = el('p', { class: 'msg' });
  const tableBox = el('div', { class: 'panel table-wrap' });
  c.append(form, alertaBox, tableBox);
  await loadTable();

  async function loadTable() {
    try {
      const items = await Inventario.listar();
      const bajos = items.filter((it) => it.bajo_minimo).length;
      const digitos = { cantidad: digitosMax(items.map((it) => it.cantidad)), minimo: digitosMax(items.map((it) => it.minimo)) };
      alertaBox.className = bajos ? 'msg err' : 'msg ok';
      alertaBox.replaceChildren(icono(bajos ? 'alerta' : 'ok'), bajos
        ? `${bajos} ítem(s) por debajo del mínimo (RF-06).`
        : 'Todo el inventario está por encima de su mínimo.');
      tableBox.replaceChildren(items.length ? el('table', {},
        thead(['Código', 'Nombre', 'Categoría', ['Cantidad', 'num'], ['Mínimo', 'num'], 'Estado', 'Ubicación', '']),
        el('tbody', {}, items.map((it) => el('tr', { 'data-id': it.id, class: it.bajo_minimo ? 'row-alerta' : '' },
          el('td', {}, it.codigo, it.bajo_minimo ? el('span', { class: 'sello rojo', title: 'Por debajo del mínimo (RF-06)' }, 'Bajo mínimo') : ''),
          el('td', { class: 'col-nombre' }, it.nombre),
          el('td', {}, el('select', { 'aria-label': `Categoría de ${it.codigo}`, onchange: (e) => patch(it.id, { categoria: e.target.value }) },
            opciones(catalogos.categoriasInventario, it.categoria))),
          el('td', { class: 'num' }, inputNum(it.cantidad, digitos.cantidad,
            { 'aria-label': `Cantidad de ${it.codigo}`, onchange: (e) => patch(it.id, { cantidad: e.target.value }) })),
          el('td', { class: 'num' }, inputNum(it.minimo, digitos.minimo,
            { 'aria-label': `Mínimo de ${it.codigo}`, onchange: (e) => patch(it.id, { minimo: e.target.value }) })),
          el('td', {}, selectEstado(it.estado,
            { 'aria-label': `Estado de ${it.codigo}`, onchange: (e) => patch(it.id, { estado: e.target.value }) }, catalogos.estadosInventario)),
          el('td', {}, it.ubicacion || ''),
          el('td', {}, el('button', { class: 'btn small', type: 'button', onclick: () => remove(it.id, it.codigo) }, 'Eliminar'))))))
        : el('p', { class: 'empty' }, 'Aún no hay ítems registrados.'));
    } catch (ex) { tableBox.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
  }
  async function patch(id, body) {
    let ok = false;
    try { await Inventario.actualizar(id, body); ok = true; mostrarPopup('Cambios guardados con éxito.', 'success'); }
    catch (ex) { mostrarPopup(ex.message, 'error'); }
    await recargarFila(tableBox, loadTable, id, ok);
  }
  // Antes de eliminar se consulta si el ítem está asignado a cyborgs; si lo está, el aviso los lista.
  async function remove(id, codigo) {
    let asignado;
    try { asignado = await Inventario.asignaciones(id); }
    catch (ex) { return mostrarPopup(ex.message, 'error'); }

    const ok = asignado.length
      ? await confirmar({
        titulo: `${codigo} está asignado`,
        mensaje: `Este ítem lo tienen ${asignado.length} cyborg(s). Si continúas, se les quitará y el ítem se eliminará del inventario.`,
        detalle: asignado.map((a) => `${a.cyborg_codigo}${a.cyborg_nombre ? ' — ' + a.cyborg_nombre : ''} (${a.cantidad} u.)`),
        boton: 'Eliminar igualmente',
      })
      : await confirmar({ titulo: `¿Eliminar ${codigo}?`, mensaje: 'El ítem se eliminará del inventario. Esta acción no se puede deshacer.' });
    if (!ok) return;
    try {
      await Inventario.eliminar(id, asignado.length > 0);
      mostrarPopup(`Ítem ${codigo} eliminado con éxito.`, 'success');
    } catch (ex) {
      mostrarPopup(ex.message, 'error');
    }
    await loadTable();
  }
}
