// Piezas de las tablas de datos: encabezados, selectores de estado, campos numéricos y recarga de filas.
import { el } from '../core/dom.js';
import { TONO, etiqueta } from '../core/formato.js';
import { impacto } from '../core/movimiento.js';

const th = (h) => Array.isArray(h) ? el('th', { class: h[1] }, h[0]) : el('th', {}, h);
// thead(['Código', ['Cantidad', 'num']]): una columna con clase se pasa como [texto, clase].
export const thead = (cols) => el('thead', {}, el('tr', {}, cols.map(th)));

// Selector con los valores de un catálogo, mostrados con su nombre legible.
export const opciones = (valores, actual) =>
  valores.map((v) => el('option', { value: v, selected: v === actual }, etiqueta(v)));

// Select de estado con un punto de tinta del color del sello delante.
export const selectEstado = (estado, props, valores) =>
  el('span', { class: 'estado', 'data-tono': TONO[estado] || 'gris' },
    el('span', { class: 'punto', 'aria-hidden': 'true' }),
    el('select', props, opciones(valores, estado)));

// Campo numérico de tabla: toda la columna toma el ancho de su cifra más larga, para que ninguna
// se vea recortada y la columna quede alineada; si al escribir la cifra crece, el campo crece.
const anchoNum = (digitos) => `width:${Math.max(digitos, 3) + 4}ch`;
export const digitosMax = (valores) => Math.max(...valores.map((v) => String(v ?? '').length));
export const inputNum = (valor, digitos, props) => el('input', {
  type: 'number', min: 0, value: valor, style: anchoNum(digitos),
  oninput: (e) => { e.target.style.cssText = anchoNum(Math.max(digitos, e.target.value.length)); }, ...props,
});

// Tras editar una fila la tabla se recarga: el foco vuelve al mismo control y solo esa fila se sacude.
export async function recargarFila(box, cargar, id, ok) {
  // Con Tab, el cambio se guarda antes de que el foco llegue al siguiente campo: se espera un turno.
  await new Promise((r) => setTimeout(r));
  const foco = document.activeElement?.getAttribute('aria-label');
  await cargar();
  const fila = box.querySelector(`tr[data-id="${id}"]`);
  if (foco) fila?.querySelector(`[aria-label="${CSS.escape(foco)}"]`)?.focus();
  if (ok) impacto(fila || box);
}

// Tablas de 4+ columnas: en tablet y móvil se apilan como fichas, y cada celda lleva el nombre
// de su columna (data-label). main.js lo aplica a toda tabla que entre en #content.
export function etiquetarTablas(raiz) {
  raiz.querySelectorAll('table:not([data-etiquetada])').forEach((t) => {
    t.dataset.etiquetada = '';
    const cols = [...t.querySelectorAll('thead th')].map((h) => h.textContent.trim());
    if (cols.length < 4) return;
    t.classList.add('apilable');
    t.querySelectorAll('tbody tr').forEach((tr) =>
      [...tr.children].forEach((td, i) => td.setAttribute('data-label', cols[i] || '')));
  });
}
