// Vista Pedidos (RF-05): crear pedido para un reino, agregar ítems con control de stock y avanzar su estado en orden.
import { el, field } from '../core/dom.js';
import { impacto } from '../core/movimiento.js';
import { cabecera } from '../componentes/cabecera.js';
import { thead } from '../componentes/tabla.js';
import { mostrarPopup } from '../componentes/toast.js';
import { confirmar } from '../componentes/confirmar.js';
import * as Pedidos from '../modelos/pedidos.js';
import * as Clientes from '../modelos/clientes.js';
import * as Inventario from '../modelos/inventario.js';

const ESTADOS = ['pendiente', 'confirmado', 'en_preparacion', 'entregado', 'cancelado'];
const etiqueta = (e) => { const t = e.replace('_', ' '); return t.charAt(0).toUpperCase() + t.slice(1); };
// Siguiente paso del flujo y texto del botón que lo ejecuta.
const AVANCE = {
  pendiente: { estado: 'confirmado', boton: 'Confirmar pedido' },
  confirmado: { estado: 'en_preparacion', boton: 'Pasar a preparación' },
  en_preparacion: { estado: 'entregado', boton: 'Marcar como entregado' },
};
const CANCELABLES = ['pendiente', 'confirmado', 'en_preparacion'];
const fecha = (f) => (f ? new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '');

export async function renderPedidos(c) {
  c.replaceChildren(cabecera('pedidos', 'Encargos de armamento y tropas; descuentan o reservan stock al confirmar.'));

  let clientes = [];
  try { clientes = await Clientes.listar(); }
  catch (ex) { c.append(el('p', { class: 'msg err' }, ex.message)); return; }

  let abiertoId = null;

  // ---------- nuevo pedido ----------
  const form = el('form', { class: 'panel', novalidate: true },
    el('h2', {}, 'Nuevo pedido'),
    clientes.length
      ? el('div', { class: 'form-row' },
        field('Reino cliente', el('select', { name: 'clienteId', required: true },
          clientes.map((cl) => el('option', { value: cl.id }, cl.nombre)))),
        el('button', { class: 'btn primary', type: 'submit' }, 'Crear pedido'))
      : el('p', { class: 'empty' }, 'Primero registra un reino cliente para poder crear pedidos.'));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(form));
    try {
      const nuevo = await Pedidos.crear({ clienteId: Number(datos.clienteId) });
      form.reset();
      impacto(form);
      mostrarPopup(`Pedido #${nuevo.id} creado con éxito.`, 'success');
      await loadTable();
      await abrir(nuevo.id);
    } catch (ex) {
      mostrarPopup(ex.message, 'error');
    }
  });

  // ---------- listado ----------
  const filtro = el('select', { 'aria-label': 'Filtrar por estado', onchange: () => loadTable() },
    el('option', { value: '' }, 'Todos los estados'),
    ESTADOS.map((s) => el('option', { value: s }, etiqueta(s))));
  const tableBox = el('div', { class: 'panel table-wrap' });
  const detalleBox = el('div', { class: 'panel', hidden: true });
  c.append(form, el('div', { class: 'panel' }, el('h2', {}, 'Pedidos'), field('Estado', filtro)), tableBox, detalleBox);
  await loadTable();

  async function loadTable() {
    try {
      const pedidos = await Pedidos.listar(filtro.value);
      tableBox.replaceChildren(pedidos.length ? el('table', {},
        thead(['N.º', 'Reino', 'Estado', ['Ítems', 'num'], ['Unidades', 'num'], 'Creado', '']),
        el('tbody', {}, pedidos.map((p) => el('tr', { 'data-id': p.id },
          el('td', {}, '#' + p.id),
          el('td', {}, p.cliente_nombre),
          el('td', {}, el('span', { class: 'sello' }, etiqueta(p.estado))),
          el('td', { class: 'num' }, String(p.total_items)),
          el('td', { class: 'num' }, String(p.total_unidades)),
          el('td', {}, fecha(p.fecha)),
          el('td', {}, el('button', { class: 'btn small', type: 'button', onclick: () => abrir(p.id) },
            p.id === abiertoId ? 'Actualizar' : 'Abrir'))))))
        : el('p', { class: 'empty' }, 'No hay pedidos para mostrar.'));
    } catch (ex) { tableBox.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
  }

  // ---------- detalle ----------
  async function abrir(id) {
    abiertoId = id;
    try {
      const [pedido, inventario] = await Promise.all([Pedidos.obtener(id), Inventario.listar()]);
      pintarDetalle(pedido, inventario);
    } catch (ex) {
      mostrarPopup(ex.message, 'error');
    }
  }

  function pintarDetalle(p, inventario) {
    const editable = p.estado === 'pendiente';
    const avance = AVANCE[p.estado];

    const items = p.items.length
      ? el('div', { class: 'table-wrap' }, el('table', {},
        thead(['Código', 'Nombre', ['Cantidad', 'num'], ['Stock actual', 'num'], editable ? '' : null].filter((x) => x !== null)),
        el('tbody', {}, p.items.map((it) => el('tr', {},
          el('td', {}, it.codigo),
          el('td', { class: 'col-nombre' }, it.nombre),
          el('td', { class: 'num' }, String(it.cantidad)),
          el('td', { class: 'num' }, String(it.stock_actual)),
          editable ? el('td', {}, el('button', {
            class: 'btn small', type: 'button', onclick: () => quitar(p.id, it.inventario_id, it.codigo),
          }, 'Quitar')) : null)))))
      : el('p', { class: 'empty' }, 'Este pedido aún no tiene ítems.');

    let agregar = null;
    if (editable) {
      const disponibles = inventario.filter((it) => it.cantidad > 0);
      agregar = disponibles.length
        ? el('form', { class: 'form-row', novalidate: true, onsubmit: (e) => { e.preventDefault(); agregarItem(p.id, e.target); } },
          field('Ítem', el('select', { name: 'inventarioId', required: true },
            disponibles.map((it) => el('option', { value: it.id }, `${it.codigo} — ${it.nombre} (stock ${it.cantidad})`)))),
          field('Cantidad', el('input', { name: 'cantidad', type: 'number', min: 1, value: 1, required: true })),
          el('button', { class: 'btn primary', type: 'submit' }, 'Agregar ítem'))
        : el('p', { class: 'empty' }, 'No hay ítems con stock disponible en el inventario.');
    }

    const acciones = el('div', { class: 'form-row' },
      avance ? el('button', { class: 'btn primary', type: 'button', onclick: () => avanzar(p, avance) }, avance.boton) : null,
      CANCELABLES.includes(p.estado) ? el('button', { class: 'btn', type: 'button', onclick: () => cancelar(p) }, 'Cancelar pedido') : null,
      el('button', { class: 'btn', type: 'button', onclick: () => { abiertoId = null; detalleBox.hidden = true; loadTable(); } }, 'Cerrar'));

    detalleBox.replaceChildren(
      el('h2', {}, `Pedido #${p.id} · ${p.cliente_nombre}`),
      el('p', {}, el('span', { class: 'sello' }, etiqueta(p.estado)), ' ', el('span', { class: 'muted' }, 'Creado ' + fecha(p.fecha))),
      items,
      agregar,
      acciones);
    detalleBox.hidden = false;
    detalleBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function agregarItem(pedidoId, formEl) {
    const datos = Object.fromEntries(new FormData(formEl));
    try {
      await Pedidos.agregarItem(pedidoId, Number(datos.inventarioId), Number(datos.cantidad));
      mostrarPopup('Ítem agregado con éxito.', 'success');
    } catch (ex) { mostrarPopup(ex.message, 'error'); }
    await loadTable();
    await abrir(pedidoId);
  }

  async function quitar(pedidoId, inventarioId, codigo) {
    try {
      await Pedidos.quitarItem(pedidoId, inventarioId);
      mostrarPopup(`Ítem ${codigo} quitado del pedido.`, 'success');
    } catch (ex) { mostrarPopup(ex.message, 'error'); }
    await loadTable();
    await abrir(pedidoId);
  }

  async function avanzar(p, avance) {
    if (avance.estado === 'confirmado') {
      const ok = await confirmar({
        titulo: `¿Confirmar el pedido #${p.id}?`,
        mensaje: 'Al confirmarlo se descontará del inventario el stock de todos sus ítems y ya no podrá modificarse.',
        boton: 'Confirmar',
      });
      if (!ok) return;
    }
    await cambiar(p.id, avance.estado, `Pedido #${p.id}: ${etiqueta(avance.estado).toLowerCase()}.`);
  }

  async function cancelar(p) {
    const ok = await confirmar({
      titulo: `¿Cancelar el pedido #${p.id}?`,
      mensaje: p.estado !== 'pendiente'
        ? 'El stock descontado volverá al inventario. Esta acción no se puede deshacer.'
        : 'El pedido quedará cancelado. Esta acción no se puede deshacer.',
      boton: 'Cancelar pedido',
    });
    if (!ok) return;
    await cambiar(p.id, 'cancelado', `Pedido #${p.id} cancelado.`);
  }

  async function cambiar(id, estado, exito) {
    try {
      await Pedidos.cambiarEstado(id, estado);
      mostrarPopup(exito, 'success');
    } catch (ex) { mostrarPopup(ex.message, 'error'); }
    await loadTable();
    await abrir(id);
  }
}
