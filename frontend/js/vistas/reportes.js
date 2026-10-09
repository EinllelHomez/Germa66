// Vista Reportes (RF-06): mosaico con el balance calculado por el motor en C++.
import { el } from '../core/dom.js';
import { etiqueta, fmtNum } from '../core/formato.js';
import { entrada } from '../core/movimiento.js';
import { cabecera } from '../componentes/cabecera.js';
import { thead } from '../componentes/tabla.js';
import * as Reportes from '../modelos/reportes.js';

export async function renderReportes(c) {
  c.replaceChildren(cabecera('reportes', 'Inteligencia del negocio, calculada por el motor en C++ con tus datos reales (RF-06).'));
  const box = el('div');
  c.append(box);
  await cargar();

  async function cargar() {
    box.replaceChildren(el('p', { class: 'muted' }, 'Calculando…'));
    try {
      const r = await Reportes.generar();
      const tablaConteo = (titulo, grupo, datos) => el('div', { class: 'panel table-wrap' },
        el('h2', {}, titulo),
        Object.keys(datos).length
          ? el('table', {}, thead([grupo, ['Total', 'num']]), el('tbody', {}, Object.entries(datos).map(([k, v]) =>
            el('tr', {}, el('td', {}, etiqueta(k)), el('td', { class: 'num' }, fmtNum(v))))))
          : el('p', { class: 'empty' }, 'Sin datos todavía.'));

      const mosaico = el('div', { class: 'mosaico' },
        el('article', { class: 'panel destacada' }, el('h2', {}, 'Total de unidades en inventario'),
          el('p', { class: 'cifra' }, fmtNum(r.totalUnidadesInventario))),
        el('article', { class: 'panel' + (r.itemCritico ? ' alerta' : '') }, el('h2', {}, 'Ítem más crítico'),
          r.itemCritico
            ? [el('p', { class: 'critico-nombre', title: r.itemCritico.nombre }, r.itemCritico.nombre),
              el('p', {}, `${r.itemCritico.id}: ${fmtNum(r.itemCritico.cantidad)} de ${fmtNum(r.itemCritico.minimo)} mínimo`),
              el('span', { class: 'sello rojo' }, 'Bajo mínimo')]
            : el('p', { class: 'empty' }, 'Ningún ítem está bajo su mínimo.')),
        tablaConteo('Stock por categoría', 'Categoría', r.stockPorCategoria),
        tablaConteo('Cyborgs por estado', 'Estado', r.cyborgsPorEstado),
        tablaConteo('Pedidos por estado', 'Estado', r.pedidosPorEstado),
        el('div', { class: 'panel table-wrap ancha' },
          el('h2', {}, 'Ítems bajo el mínimo'),
          r.itemsBajoMinimo.length ? el('table', {},
            thead(['Código', 'Nombre', ['Cantidad', 'num'], ['Mínimo', 'num']]),
            el('tbody', {}, r.itemsBajoMinimo.map((it) => el('tr', {},
              el('td', {}, it.id), el('td', {}, it.nombre), el('td', { class: 'num' }, fmtNum(it.cantidad)), el('td', { class: 'num' }, fmtNum(it.minimo))))))
            : el('p', { class: 'empty' }, 'Ningún ítem está bajo el mínimo.')));
      box.replaceChildren(mosaico);
      entrada(mosaico.children);
    } catch (ex) {
      box.replaceChildren(el('p', { class: 'msg err' }, ex.message),
        el('button', { class: 'btn', type: 'button', onclick: cargar }, 'Reintentar'));
    }
  }
}
