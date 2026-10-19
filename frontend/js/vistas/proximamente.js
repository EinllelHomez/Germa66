// Vista de un módulo que aún no está construido (por ejemplo, Pedidos).
import { el } from '../core/dom.js';
import { cabecera } from '../componentes/cabecera.js';

export function renderProximamente(c, m) {
  c.replaceChildren(
    cabecera(m.id, m.desc),
    el('div', { class: 'panel empty' },
      el('p', {}, 'Este módulo estará disponible muy pronto.')));
}
