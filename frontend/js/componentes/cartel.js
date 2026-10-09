// Cartel de "SE BUSCA" de un capítulo, para el tablón de Inicio.
import { el } from '../core/dom.js';
import { ARTE, capitulo, capVars, imgArte } from '../core/capitulos.js';

export function cartel(m, alAbrir) {
  const v = capitulo(m.id);
  return el('button', { type: 'button', class: 'cartel', style: capVars(v), onclick: alAbrir },
    el('span', { class: 'cartel-cabeza', 'aria-hidden': 'true' }, 'Se busca'),
    el('span', { class: 'cartel-foto' + (m.arte ? '' : ' sin-foto'), 'aria-hidden': 'true' },
      imgArte(m.arte || ARTE.bandera, { loading: 'lazy' })),
    el('span', { class: 'cartel-vivo', 'aria-hidden': 'true' }, 'Vivo o muerto'),
    el('span', { class: 'cartel-nombre' }, m.name),
    el('span', { class: 'cartel-alias' }, `${m.alias} · ${m.hermano}`),
    el('span', { class: 'cartel-desc' }, m.desc),
    el('span', { class: 'cartel-pie' },
      el('span', { class: 'cap' }, v.cap),
      el('span', { class: 'sello ' + (m.ready ? 'verde' : 'dorado') }, m.ready ? 'En servicio' : 'Próximo')),
    el('span', { class: 'cartel-rf' }, `${m.rf} · ${m.sprint}`));
}
