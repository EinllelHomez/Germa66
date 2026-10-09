// Movimiento (GSAP) y trazos (Rough.js). Todo es opcional: si la CDN falla, la app funciona igual.
const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const anim = () => !reducir && !!window.gsap;
const token = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const NS = 'http://www.w3.org/2000/svg';

export function entrada(nodes) {
  if (!anim() || !nodes.length) return;
  // El escalonado se detiene en el 6.º elemento: con muchas viñetas la entrada no pasa de ~0.85s.
  gsap.from(nodes, { opacity: 0, y: 16, scale: 0.96, duration: 0.45, ease: 'back.out(1.6)', stagger: (i) => Math.min(i, 5) * 0.08, clearProps: 'opacity,transform' });
}

// Sacudida de impacto: 4 golpes de ±4px en 0.25s.
export function impacto(node, delay = 0) {
  if (!anim() || !node) return;
  gsap.timeline({ delay })
    .to(node, { x: -4, duration: 0.05 }).to(node, { x: 4, duration: 0.05 })
    .to(node, { x: -4, duration: 0.05 }).to(node, { x: 4, duration: 0.05 })
    .to(node, { x: 0, duration: 0.05 });
}

export function animarVista(c) {
  if (!anim()) return;
  entrada(c.querySelectorAll(':scope > :not(.portada):not(.carteles), .portada > *, .carteles > li'));
  const letras = c.querySelectorAll('.titulo-modulo .letra');
  if (letras.length) gsap.from(letras, {
    yPercent: -80, rotation: () => gsap.utils.random(-25, 25), opacity: 0,
    duration: 0.3, ease: 'back.out(2.2)', stagger: { amount: 0.25 }, delay: 0.1, clearProps: 'all',
  });
  const ono = c.querySelector('.cabecera .onomato');
  if (ono) gsap.from(ono, { scale: 2.2, opacity: 0, duration: 0.35, ease: 'back.out(2)', delay: 0.3 });
}

export function animarLogin() {
  if (!anim()) return;
  gsap.timeline()
    .from('.login-brand, #login-form', { opacity: 0, y: 20, scale: 0.96, duration: 0.45, ease: 'back.out(1.6)', stagger: 0.08, clearProps: 'opacity,transform' })
    .from('.brand-number', { scale: 2.4, opacity: 0, duration: 0.35, ease: 'back.out(2)' }, '-=0.2')
    .from('.onomato-login', { scale: 0, rotation: -40, duration: 0.3, ease: 'back.out(2.5)' }, '<')
    .from('.hermanos i', { scaleY: 0, transformOrigin: 'bottom', stagger: 0.05, duration: 0.25, ease: 'back.out(2)' }, '<');
}

// Borde irregular de "globo de grito" para los errores.
export function bordeRugoso(node) {
  if (!window.rough || !node.offsetWidth) return;
  node.querySelector(':scope > svg.rugoso')?.remove();
  const w = node.offsetWidth + 14, h = node.offsetHeight + 14;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'rugoso'); svg.setAttribute('width', w); svg.setAttribute('height', h);
  svg.setAttribute('aria-hidden', 'true');
  svg.append(rough.svg(svg).rectangle(3, 3, w - 6, h - 6, { stroke: token('--tinta'), strokeWidth: 2.5, roughness: 2.6, bowing: 2.5 }));
  node.prepend(svg);
}
