// Utilidades de DOM compartidas por todas las vistas.
export const $ = (s) => document.querySelector(s);

// Crea un elemento: el('p', { class: 'msg', onclick: fn }, 'texto', otroNodo).
export function el(tag, props = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null) n.append(c.nodeType ? c : document.createTextNode(c));
  return n;
}

// Campo de formulario con su etiqueta encima.
export const field = (label, input) => el('div', {}, el('label', {}, label), input);

// Íconos propios de trazo grueso (sin emojis).
const ICONOS = {
  alerta: '<path d="M12 3 2 20.5h20L12 3Z"/><path d="M12 10v4.5"/><path d="M12 17.5h.01"/>',
  ok: '<path d="M4 12.5l5 5L20 6.5"/>',
};
export function icono(nombre) {
  const s = el('span', { class: 'icono', 'aria-hidden': 'true' });
  s.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${ICONOS[nombre]}</svg>`;
  return s;
}
