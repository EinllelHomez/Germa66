// Ventana de confirmación con el estilo del sistema (reemplaza al confirm() del navegador).
// Una capa fija cubre toda la pantalla, difumina el fondo y centra el aviso.
// Uso: if (await confirmar({ titulo, mensaje, detalle: ['CY-01 (2 u.)'], boton: 'Eliminar' })) { ... }
import { el, icono } from '../core/dom.js';
import { anim, impacto } from '../core/movimiento.js';

export function confirmar({ titulo, mensaje, detalle = [], boton = 'Eliminar' }) {
  return new Promise((resolve) => {
    const antes = document.activeElement; // para devolver el foco al cerrar
    const cancelar = el('button', { class: 'btn', type: 'button', onclick: () => cerrar(false) }, 'Cancelar');
    const aceptar = el('button', { class: 'btn peligro', type: 'button', onclick: () => cerrar(true) }, boton);
    const caja = el('div', { class: 'confirmar', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'confirmar-titulo' },
      el('h2', { id: 'confirmar-titulo' }, icono('alerta'), titulo),
      el('p', {}, mensaje),
      detalle.length ? el('ul', { class: 'confirmar-lista' }, detalle.map((d) => el('li', {}, d))) : null,
      el('div', { class: 'confirmar-botones' }, cancelar, aceptar));
    const capa = el('div', { class: 'confirmar-capa' }, caja);

    function teclas(e) {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(false); }
      // Tab no se sale de la ventana mientras está abierta.
      if (e.key === 'Tab') {
        e.preventDefault();
        (document.activeElement === cancelar ? aceptar : cancelar).focus();
      }
    }
    function cerrar(valor) {
      document.removeEventListener('keydown', teclas, true);
      document.body.classList.remove('con-confirmar');
      const fin = () => { capa.remove(); antes?.focus?.(); resolve(valor); };
      if (anim()) gsap.to(capa, { opacity: 0, duration: 0.15, onComplete: fin });
      else fin();
    }

    capa.addEventListener('mousedown', (e) => { if (e.target === capa) cerrar(false); }); // clic fuera = cancelar
    document.addEventListener('keydown', teclas, true);
    document.body.classList.add('con-confirmar'); // bloquea el scroll de la página de fondo
    document.body.append(capa);
    cancelar.focus(); // el foco empieza en la opción segura
    if (anim()) {
      gsap.fromTo(capa, { opacity: 0 }, { opacity: 1, duration: 0.15 });
      gsap.fromTo(caja, { scale: 0.9, y: 16 }, { scale: 1, y: 0, duration: 0.3, ease: 'back.out(1.8)' });
    }
    impacto(caja, 0.3);
  });
}
