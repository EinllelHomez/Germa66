// Ventana de confirmación con el estilo del sistema (reemplaza al confirm() del navegador).
// Uso: if (await confirmar({ titulo, mensaje, detalle: ['CY-01 (2 u.)'], boton: 'Eliminar' })) { ... }
import { el, icono } from '../core/dom.js';
import { impacto } from '../core/movimiento.js';

export function confirmar({ titulo, mensaje, detalle = [], boton = 'Eliminar' }) {
  return new Promise((resolve) => {
    const cerrar = (valor) => { dlg.close(); dlg.remove(); resolve(valor); };
    const cancelar = el('button', { class: 'btn', type: 'button', onclick: () => cerrar(false) }, 'Cancelar');
    const dlg = el('dialog', { class: 'confirmar', 'aria-labelledby': 'confirmar-titulo' },
      el('h2', { id: 'confirmar-titulo' }, icono('alerta'), titulo),
      el('p', {}, mensaje),
      detalle.length ? el('ul', { class: 'confirmar-lista' }, detalle.map((d) => el('li', {}, d))) : null,
      el('div', { class: 'confirmar-botones' },
        cancelar,
        el('button', { class: 'btn peligro', type: 'button', onclick: () => cerrar(true) }, boton)));
    // Esc o clic fuera de la ventana = cancelar.
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); cerrar(false); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) cerrar(false); });
    document.body.append(dlg);
    dlg.showModal();
    cancelar.focus(); // el foco empieza en la opción segura
    impacto(dlg);
  });
}
