// Vista de un módulo que aún no está construido (por ejemplo, Pedidos).
import { el } from '../core/dom.js';
import { cabecera } from '../componentes/cabecera.js';

export function renderProximamente(c, m) {
  c.replaceChildren(
    cabecera(m.id, m.desc),
    el('div', { class: 'panel empty' },
      el('p', {}, `Este módulo (${m.rf}) se construye en el ${m.sprint}.`),
      el('p', {}, 'La ruta de la API y esta pantalla se agregan siguiendo el mismo patrón que Usuarios.')));
}
