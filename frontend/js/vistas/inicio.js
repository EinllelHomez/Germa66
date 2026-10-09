// Vista Inicio (prólogo): bienvenida, cuatro indicadores reales y el tablón de carteles.
import { el } from '../core/dom.js';
import { sesion } from '../core/sesion.js';
import { fmtNum } from '../core/formato.js';
import { impacto } from '../core/movimiento.js';
import { ARTE, MODULES, imgArte } from '../core/capitulos.js';
import { cartel } from '../componentes/cartel.js';
import * as Inventario from '../modelos/inventario.js';
import * as Cyborgs from '../modelos/cyborgs.js';
import * as Clientes from '../modelos/clientes.js';

let avisoBajosMostrado = false;

export async function renderInicio(c, { go }) {
  const { me, esAdmin } = sesion;
  // Portada: una viñeta principal grande y cuatro indicadores pequeños alrededor.
  const valores = {}, notas = {};
  const stat = (key, label, color) => {
    valores[key] = el('p', { class: 'stat-valor' }, '…');
    notas[key] = el('p', { class: 'stat-nota' });
    return el('article', { class: 'vineta stat' },
      el('span', { class: 'pestana' }, el('span', { class: 'cap-mini', style: `--cap-color:${color}` }), label),
      valores[key], notas[key]);
  };
  const statBajos = stat('bajos', 'Bajo el mínimo', 'var(--rojo)');
  c.replaceChildren(
    el('section', { class: 'portada' },
      el('article', { class: 'vineta bienvenida' },
        el('div', { class: 'velocidad', 'aria-hidden': 'true' }),
        el('div', { class: 'olas', 'aria-hidden': 'true' }),
        el('span', { class: 'pestana' }, 'Prólogo'),
        el('div', { class: 'tono', 'aria-hidden': 'true' }),
        imgArte(ARTE.judge, { class: 'bienvenida-personaje', 'aria-hidden': 'true' }),
        el('p', { class: 'bienvenida-kicker' }, esAdmin ? 'Administrador · Mando del reino' : 'Operativo · Tropa del reino'),
        // Un nombre largo baja de tamaño para no estirar la bienvenida.
        el('h1', me.nombre.length > 22 ? { class: 'nombre-largo' } : {}, `Hola, ${me.nombre}`),
        el('p', { class: 'bienvenida-texto' }, esAdmin
          ? 'Tienes acceso total: administras usuarios, roles y la auditoría, además de todos los módulos.'
          : 'Tu perfil es Operativo: registras datos y procesas solicitudes en los módulos.')),
      stat('items', 'Ítems en inventario', 'var(--rojo)'),
      statBajos,
      stat('cyborgs', 'Cyborgs registrados', 'var(--azul-mar)'),
      stat('clientes', 'Reinos clientes', 'var(--dorado)')),
    el('h2', { class: 'titulo-seccion' }, 'Carteles de los capítulos'),
    // Tablón de carteles de "SE BUSCA": un cartel por capítulo, con su hermano Vinsmoke.
    // El Arsenal es la actividad principal de Germa: su cartel es el destacado.
    el('ol', { class: 'carteles' }, MODULES.map((m) =>
      el('li', m.id === 'inventario' ? { class: 'destacado' } : {}, cartel(m, () => go(m.id))))));

  // Panel de mando: indicadores reales sacados de tus propias APIs (no son de adorno).
  const [inventario, cyborgs, clientes] = await Promise.all([
    Inventario.listar().catch(() => []),
    Cyborgs.listar().catch(() => []),
    Clientes.listar().catch(() => []),
  ]);
  const bajoMinimo = inventario.filter((i) => i.bajo_minimo).length;
  valores.items.textContent = fmtNum(inventario.length);
  valores.bajos.textContent = fmtNum(bajoMinimo);
  valores.cyborgs.textContent = fmtNum(cyborgs.length);
  valores.clientes.textContent = fmtNum(clientes.length);
  // Notas con datos reales, para que cada cifra diga algo del negocio.
  const unidades = inventario.reduce((t, i) => t + (Number(i.cantidad) || 0), 0);
  const activos = cyborgs.filter((cy) => cy.estado === 'activo').length;
  const enMora = clientes.filter((cl) => cl.estado_cuenta === 'en_mora').length;
  notas.items.textContent = `${fmtNum(unidades)} ${unidades === 1 ? 'unidad' : 'unidades'} en el arsenal`;
  notas.bajos.textContent = bajoMinimo ? 'Requieren reposición' : 'Todo el arsenal en orden';
  notas.cyborgs.textContent = `${activos} en servicio activo`;
  notas.clientes.textContent = enMora ? `${enMora} con pagos atrasados` : 'Todos al día';
  if (bajoMinimo) {
    statBajos.classList.add('alerta');
    // La sacudida de aviso sale una vez por sesión, no en cada visita a Inicio.
    if (!avisoBajosMostrado) { avisoBajosMostrado = true; impacto(statBajos, 0.5); }
  }
}
