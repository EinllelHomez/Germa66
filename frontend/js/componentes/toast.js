// Avisos flotantes con forma de globo de manga: éxito con borde verde, error como globo de grito rojo.
import { el, icono } from '../core/dom.js';
import { anim, bordeRugoso, impacto } from '../core/movimiento.js';

export function mostrarPopup(mensaje, tipo = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = el('div', { id: 'toast-container' });
    document.body.appendChild(container);
  }
  const error = tipo === 'error';
  const toast = el('div', { class: `toast ${tipo}`, role: error ? 'alert' : 'status' },
    icono(error ? 'alerta' : 'ok'), el('span', {}, mensaje));
  const cerrar = () => {
    if (toast.dataset.cerrando) return;
    toast.dataset.cerrando = '';
    if (anim()) gsap.to(toast, { opacity: 0, y: 12, scale: 0.95, duration: 0.2, ease: 'power2.out', onComplete: () => toast.remove() });
    else { toast.classList.remove('show'); setTimeout(() => toast.remove(), 250); }
  };
  // Los errores se quedan hasta que se cierran; los avisos de éxito se van solos, salvo con el ratón encima.
  if (error) toast.append(el('button', { class: 'toast-cerrar', type: 'button', onclick: cerrar }, 'Cerrar'));
  container.appendChild(toast);
  if (error) bordeRugoso(toast);
  if (anim()) {
    gsap.fromTo(toast, { opacity: 0, scale: 0.9, y: 24 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'back.out(1.8)' });
    if (error) impacto(toast, 0.3);
  } else toast.classList.add('show');
  if (!error) {
    let espera = setTimeout(cerrar, 3200);
    toast.addEventListener('mouseenter', () => clearTimeout(espera));
    toast.addEventListener('mouseleave', () => { espera = setTimeout(cerrar, 1500); });
  }
}
