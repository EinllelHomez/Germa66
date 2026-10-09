// Arranque de la SPA: sesión, menú de capítulos y navegación entre vistas.
// Capas: core/ (utilidades), modelos/ (datos de la API), componentes/ (piezas de interfaz), vistas/ (pantallas).
import { $, el } from './core/dom.js';
import { sesion } from './core/sesion.js';
import { cuandoExpire } from './core/api.js';
import { animarVista } from './core/movimiento.js';
import { MODULES, ADMIN_VIEWS, capitulo, capVars } from './core/capitulos.js';
import { etiquetarTablas } from './componentes/tabla.js';
import * as Auth from './modelos/auth.js';
import { cargarCatalogos } from './modelos/catalogos.js';
import { mostrarLogin, prepararLogin } from './vistas/login.js';
import { renderInicio } from './vistas/inicio.js';
import { renderInventario } from './vistas/inventario.js';
import { renderCyborgs } from './vistas/cyborgs.js';
import { renderClientes } from './vistas/clientes.js';
import { renderReportes } from './vistas/reportes.js';
import { renderUsuarios } from './vistas/usuarios.js';
import { renderAuditoria } from './vistas/auditoria.js';
import { renderProximamente } from './vistas/proximamente.js';

const VISTAS = {
  inicio: (c) => renderInicio(c, { go }),
  inventario: renderInventario,
  cyborgs: renderCyborgs,
  clientes: renderClientes,
  reportes: renderReportes,
  usuarios: renderUsuarios,
  auditoria: renderAuditoria,
};

// ---------- sesión ----------
async function mostrarApp() {
  await cargarCatalogos();
  $('#login-view').hidden = true;
  $('#app-view').hidden = false;
  $('#user-name').textContent = sesion.me.nombre;
  $('#user-role').textContent = sesion.me.rol;
  buildNav();
  go('inicio');
}

async function logout(avisar = true) {
  if (avisar && sesion.token) { try { await Auth.logout(); } catch { } }
  sesion.token = null; sesion.me = null;
  mostrarLogin();
}
cuandoExpire(() => logout(false));

// ---------- navegación (RBAC en la interfaz; el servidor es quien realmente protege) ----------
function buildNav() {
  const nav = $('#nav');
  nav.replaceChildren(navBtn(capitulo('inicio')));
  nav.append(el('div', { class: 'nav-group' }, 'Módulos'));
  MODULES.forEach((m) => nav.append(navBtn(capitulo(m.id), m.ready ? null : 'Próximo')));
  if (sesion.esAdmin) {
    nav.append(el('div', { class: 'nav-group' }, 'Administración'));
    ADMIN_VIEWS.forEach((v) => nav.append(navBtn(capitulo(v.id))));
  }
}
function navBtn(v, tag) {
  return el('button', { type: 'button', 'data-view': v.id, style: capVars(v), onclick: () => go(v.id) },
    el('span', { class: 'cap' }, v.cap), el('span', {}, v.name), tag ? el('span', { class: 'tag' }, tag) : null);
}

function go(view) {
  document.querySelectorAll('.nav button').forEach((b) => {
    if (b.dataset.view === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  $('#nav').classList.remove('open'); $('#menu-btn').setAttribute('aria-expanded', 'false');
  const c = $('#content');
  const render = VISTAS[view];
  if (render) render(c); else renderProximamente(c, MODULES.find((m) => m.id === view));
  animarVista(c);
  c.focus();
}

// ---------- eventos globales ----------
prepararLogin(mostrarApp);
$('#logout-btn').addEventListener('click', () => logout());
$('#menu-btn').addEventListener('click', () => {
  const open = $('#nav').classList.toggle('open');
  $('#menu-btn').setAttribute('aria-expanded', open);
});
new MutationObserver(() => etiquetarTablas($('#content'))).observe($('#content'), { childList: true, subtree: true });

// ---------- arranque: restaurar sesión ----------
(async () => {
  if (!sesion.token) return mostrarLogin();
  try { sesion.me = await Auth.yo(); await mostrarApp(); } catch { sesion.token = null; mostrarLogin(); }
})();
