(() => {
  const API = '/api';
  const $ = (s) => document.querySelector(s);
  const store = {
    get token() { return sessionStorage.getItem('germa_token'); },
    set token(v) { v ? sessionStorage.setItem('germa_token', v) : sessionStorage.removeItem('germa_token'); },
  };
  let me = null;

  // Módulos del sistema. "sprint" indica cuándo se construye (SRS / plan Scrum).
  // Cada capítulo lleva el color de un hermano Vinsmoke (ver DESIGN.md).
  const MODULES = [
    {
      id: 'inventario', name: 'Inventario', color: 'var(--rojo)', onomato: 'ガシャン!', rf: 'RF-02', sprint: 'Sprint 2 (30 sep al 19 oct)', ready: true,
      desc: 'Stock de armamento y Raid Suits: código, categoría, cantidad, estado y ubicación.'
    },
    {
      id: 'cyborgs', name: 'Cyborgs', color: 'var(--azul-mar)', onomato: 'ビリビリ!', rf: 'RF-03', sprint: 'Sprint 2 (30 sep al 19 oct)', ready: true,
      desc: 'Ficha de cada unidad y asignación de equipamiento con stock disponible.'
    },
    {
      id: 'clientes', name: 'Reinos clientes', color: 'var(--dorado)', texto: 'var(--tinta)', onomato: 'ドン!', rf: 'RF-04', sprint: 'Sprint 3 (20 oct al 8 nov)', ready: true,
      desc: 'Directorio de reinos, contacto, ubicación y estado de cuenta.'
    },
    {
      id: 'pedidos', name: 'Pedidos', color: 'var(--verde)', onomato: 'ザッ!', rf: 'RF-05', sprint: 'Sprint 3 (20 oct al 8 nov)',
      desc: 'Solicitudes de recursos; descuenta o reserva stock al confirmar.'
    },
    {
      id: 'reportes', name: 'Reportes', color: 'var(--rosa)', onomato: 'ジャーン!', rf: 'RF-06', sprint: 'Sprint 3 (20 oct al 8 nov)', ready: true,
      desc: 'Indicadores de stock, cyborgs y pedidos, calculados por el motor en C++.'
    },
  ];
  const ADMIN_VIEWS = [
    { id: 'usuarios', name: 'Usuarios y roles', color: 'var(--tinta-suave)', onomato: 'コン!' },
    { id: 'auditoria', name: 'Auditoría de accesos', color: 'var(--tinta-suave)', onomato: 'ギロッ' },
  ];
  const INICIO = { id: 'inicio', name: 'Inicio', color: 'var(--papel-claro)', texto: 'var(--tinta)', sombra: 'var(--rojo)' };
  // Índice de capítulos: Inicio es el prólogo; el resto se numera en orden.
  const CAPITULOS = [INICIO, ...MODULES, ...ADMIN_VIEWS].map((v, i) =>
    ({ ...v, cap: i === 0 ? 'Prólogo' : `Cap. ${String(i).padStart(2, '0')}` }));
  const capitulo = (id) => CAPITULOS.find((v) => v.id === id);
  const capVars = (v) => `--cap-color:${v.color};--cap-texto:${v.texto || 'var(--papel-claro)'};--cap-sombra:${v.sombra || v.color}`;

  // Tono del sello según el estado (pendiente dorado, en proceso azul, completado verde, cancelado gris).
  const TONO = {
    disponible: 'verde', activo: 'verde', al_dia: 'verde', completado: 'verde',
    en_mantenimiento: 'azul', en_proceso: 'azul',
    pendiente: 'dorado', en_mora: 'dorado',
    agotado: 'rojo',
    baja: 'gris', suspendida: 'gris', cancelado: 'gris',
  };

  // ---------- movimiento (GSAP) y trazos (Rough.js); todo es opcional si la CDN falla ----------
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const anim = () => !reducir && !!window.gsap;
  const token = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const NS = 'http://www.w3.org/2000/svg';

  function entrada(nodes) {
    if (!anim() || !nodes.length) return;
    gsap.from(nodes, { opacity: 0, y: 16, scale: 0.96, duration: 0.45, ease: 'back.out(1.6)', stagger: 0.08, clearProps: 'opacity,transform' });
  }
  // Sacudida de impacto: 4 golpes de ±4px en 0.25s.
  function impacto(node, delay = 0) {
    if (!anim() || !node) return;
    gsap.timeline({ delay })
      .to(node, { x: -4, duration: 0.05 }).to(node, { x: 4, duration: 0.05 })
      .to(node, { x: -4, duration: 0.05 }).to(node, { x: 4, duration: 0.05 })
      .to(node, { x: 0, duration: 0.05 });
  }
  function animarVista(c) {
    if (!anim()) return;
    entrada(c.querySelectorAll(':scope > :not(.portada), .portada > *'));
    const letras = c.querySelectorAll('.titulo-modulo .letra');
    if (letras.length) gsap.from(letras, {
      yPercent: -80, rotation: () => gsap.utils.random(-25, 25), opacity: 0,
      duration: 0.4, ease: 'back.out(2.2)', stagger: 0.035, delay: 0.1, clearProps: 'all',
    });
    const ono = c.querySelector('.cabecera .onomato');
    if (ono) gsap.from(ono, { scale: 2.2, opacity: 0, duration: 0.35, ease: 'back.out(2)', delay: 0.3 });
  }

  function trazoCircular(svg) {
    if (!window.rough || !svg) return;
    svg.replaceChildren();
    const rc = rough.svg(svg);
    svg.append(rc.circle(50, 50, 112, { stroke: token('--tinta'), strokeWidth: 2.5, roughness: 1.6 }));
    svg.append(rc.circle(50, 50, 104, { stroke: token('--rojo'), strokeWidth: 1.5, roughness: 2.4 }));
  }
  // Borde irregular de "globo de grito" para los errores.
  function bordeRugoso(node) {
    if (!window.rough || !node.offsetWidth) return;
    node.querySelector(':scope > svg.rugoso')?.remove();
    const w = node.offsetWidth + 14, h = node.offsetHeight + 14;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'rugoso'); svg.setAttribute('width', w); svg.setAttribute('height', h);
    svg.setAttribute('aria-hidden', 'true');
    svg.append(rough.svg(svg).rectangle(3, 3, w - 6, h - 6, { stroke: token('--tinta'), strokeWidth: 2.5, roughness: 2.6, bowing: 2.5 }));
    node.prepend(svg);
  }
  // <svg><use href="#id"></svg> de los símbolos definidos en index.html.
  function simbolo(id, clase) {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('class', clase); s.setAttribute('viewBox', '0 0 100 100'); s.setAttribute('aria-hidden', 'true');
    const u = document.createElementNS(NS, 'use'); u.setAttribute('href', '#' + id);
    s.append(u);
    return s;
  }
  function emblema(conTrazo) {
    const caja = el('div', { class: 'emblema', 'aria-hidden': 'true' });
    caja.append(simbolo('emblema', 'em'));
    if (conTrazo) {
      const t = document.createElementNS(NS, 'svg');
      t.setAttribute('class', 'trazo'); t.setAttribute('viewBox', '-10 -10 120 120');
      caja.append(t); trazoCircular(t);
    }
    return caja;
  }

  // Íconos propios de trazo grueso (sin emojis).
  const ICONOS = {
    alerta: '<path d="M12 3 2 20.5h20L12 3Z"/><path d="M12 10v4.5"/><path d="M12 17.5h.01"/>',
    ok: '<path d="M4 12.5l5 5L20 6.5"/>',
  };
  function icono(nombre) {
    const s = el('span', { class: 'icono', 'aria-hidden': 'true' });
    s.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${ICONOS[nombre]}</svg>`;
    return s;
  }

  // ---------- utilidades ----------
  function el(tag, props = {}, ...children) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) if (c != null) n.append(c.nodeType ? c : document.createTextNode(c));
    return n;
  }

  async function api(path, opts = {}) {
    const res = await fetch(API + path, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(store.token && { Authorization: 'Bearer ' + store.token }) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && store.token) { logout(false); throw new Error('Tu sesión expiró. Inicia sesión de nuevo.'); }
    if (!res.ok) throw new Error(data.error || 'Ocurrió un error inesperado.');
    return data;
  }

  const fmtDate = (s) => new Date(s).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

  // ---------- sesión ----------
  async function showApp() {
    $('#login-view').hidden = true;
    $('#app-view').hidden = false;
    $('#user-name').textContent = me.nombre;
    $('#user-role').textContent = me.rol;
    buildNav();
    go('inicio');
  }

  function showLogin() {
    $('#app-view').hidden = true;
    $('#login-view').hidden = false;
    $('#password').value = '';
    $('#email').focus();
    if (anim()) {
      gsap.timeline()
        .from('.login-brand, #login-form', { opacity: 0, y: 20, scale: 0.96, duration: 0.45, ease: 'back.out(1.6)', stagger: 0.08, clearProps: 'opacity,transform' })
        .from('.brand-number', { scale: 2.4, opacity: 0, duration: 0.35, ease: 'back.out(2)' }, '-=0.2')
        .from('.onomato-login', { scale: 0, rotation: -40, duration: 0.3, ease: 'back.out(2.5)' }, '<')
        .from('.hermanos i', { scaleY: 0, transformOrigin: 'bottom', stagger: 0.05, duration: 0.25, ease: 'back.out(2)' }, '<');
    }
  }
  trazoCircular($('.login-brand .trazo'));

  async function logout(notify = true) {
    if (notify && store.token) { try { await api('/auth/logout', { method: 'POST' }); } catch { } }
    store.token = null; me = null;
    showLogin();
  }

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#login-error'), btn = e.target.querySelector('button');
    err.hidden = true;
    btn.disabled = true;
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email: $('#email').value, password: $('#password').value } });
      store.token = data.token; me = data.user;
      await showApp();
    } catch (ex) {
      err.textContent = ex.message; err.hidden = false;
      bordeRugoso(err);
      impacto(err);
    } finally { btn.disabled = false; }
  });
  $('#logout-btn').addEventListener('click', () => logout());
  $('#menu-btn').addEventListener('click', () => {
    const open = $('#nav').classList.toggle('open');
    $('#menu-btn').setAttribute('aria-expanded', open);
  });

  // ---------- navegación (RBAC en la interfaz; el servidor es quien realmente protege) ----------
  function buildNav() {
    const nav = $('#nav');
    nav.replaceChildren(navBtn(capitulo('inicio')));
    nav.append(el('div', { class: 'nav-group' }, 'Módulos'));
    MODULES.forEach((m) => nav.append(navBtn(capitulo(m.id), m.ready ? null : 'Próximo')));
    if (me.rol === 'Administrador') {
      nav.append(el('div', { class: 'nav-group' }, 'Administración'));
      ADMIN_VIEWS.forEach((v) => nav.append(navBtn(capitulo(v.id))));
    }
  }
  function navBtn(v, tag) {
    return el('button', { type: 'button', 'data-view': v.id, style: capVars(v), onclick: () => go(v.id) },
      el('span', { class: 'cap' }, v.cap), el('span', {}, v.name), tag ? el('span', { class: 'tag' }, tag) : null);
  }

  // Cabecera de capítulo: pestaña con el número, título letra por letra y onomatopeya.
  function cabecera(id, sub) {
    const v = capitulo(id);
    const letras = [...v.name].map((ch) => el('span', { class: 'letra' }, ch === ' ' ? ' ' : ch));
    return el('header', { class: 'cabecera marco', style: `--acento:${v.color};--acento-texto:${v.texto || 'var(--papel-claro)'}` },
      el('div', { class: 'carta', 'aria-hidden': 'true' }),
      simbolo('rosa-vientos', 'rosa'),
      el('span', { class: 'pestana' }, v.cap),
      el('h1', { class: 'titulo-modulo' }, el('span', { class: 'sr-only' }, v.name), el('span', { 'aria-hidden': 'true' }, letras)),
      el('p', { class: 'cabecera-sub' }, sub),
      el('span', { class: 'onomato', 'aria-hidden': 'true' }, v.onomato || 'ドン!'));
  }
  const th = (h) => Array.isArray(h) ? el('th', { class: h[1] }, h[0]) : el('th', {}, h);
  const thead = (cols) => el('thead', {}, el('tr', {}, cols.map(th)));
  // Select de estado con un punto de tinta del color del sello delante.
  const selectEstado = (estado, props, opciones) =>
    el('span', { class: 'estado', 'data-tono': TONO[estado] || 'gris' },
      el('span', { class: 'punto', 'aria-hidden': 'true' }),
      el('select', props, opciones.map((v) => el('option', { value: v, selected: v === estado }, v))));

  function go(view) {
    document.querySelectorAll('.nav button').forEach((b) => {
      if (b.dataset.view === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    $('#nav').classList.remove('open'); $('#menu-btn').setAttribute('aria-expanded', 'false');
    const c = $('#content');
    if (view === 'inicio') renderHome(c);
    else if (view === 'inventario') renderInventario(c);
    else if (view === 'reportes') renderReportes(c);
    else if (view === 'cyborgs') renderCyborgs(c);
    else if (view === 'clientes') renderClientes(c);
    else if (view === 'usuarios') renderUsers(c);
    else if (view === 'auditoria') renderAudit(c);
    else renderPlaceholder(c, MODULES.find((m) => m.id === view));
    animarVista(c);
    c.focus();
  }

  // ---------- vistas ----------
  async function renderHome(c) {
    const admin = me.rol === 'Administrador';
    // Portada: una viñeta principal grande y cuatro indicadores pequeños alrededor.
    const valores = {};
    const stat = (key, label, color) => {
      valores[key] = el('p', { class: 'stat-valor' }, '…');
      return el('article', { class: 'vineta stat' },
        el('span', { class: 'pestana' }, el('span', { class: 'cap-mini', style: `--cap-color:${color}` }), label),
        valores[key]);
    };
    const statBajos = stat('bajos', 'Bajo el mínimo', 'var(--rojo)');
    c.replaceChildren(
      el('section', { class: 'portada' },
        el('article', { class: 'vineta bienvenida marco' },
          el('div', { class: 'velocidad', 'aria-hidden': 'true' }),
          el('div', { class: 'olas', 'aria-hidden': 'true' }),
          el('span', { class: 'pestana' }, 'Prólogo'),
          emblema(true),
          el('p', { class: 'bienvenida-kicker' }, admin ? 'Administrador' : 'Operativo'),
          el('h1', {}, `Hola, ${me.nombre}`),
          el('p', { class: 'bienvenida-texto' }, admin
            ? 'Tienes acceso total: administras usuarios, roles y la auditoría, además de todos los módulos.'
            : 'Tu perfil es Operativo: registras datos y procesas solicitudes en los módulos.')),
        stat('items', 'Ítems en inventario', 'var(--rojo)'),
        statBajos,
        stat('cyborgs', 'Cyborgs registrados', 'var(--azul-mar)'),
        stat('clientes', 'Reinos clientes', 'var(--dorado)')),
      el('h2', { class: 'titulo-seccion' }, 'Índice de capítulos'),
      el('ol', { class: 'indice' }, MODULES.map((m) => {
        const v = capitulo(m.id);
        return el('li', {}, el('button', { type: 'button', style: capVars(v), onclick: () => go(m.id) },
          el('span', { class: 'cap' }, v.cap),
          el('span', {}, el('span', { class: 'indice-nombre' }, m.name), el('span', { class: 'indice-desc' }, m.desc)),
          el('span', { class: 'indice-meta' },
            el('span', { class: 'sello ' + (m.ready ? 'verde' : 'dorado') }, m.ready ? 'En servicio' : 'Próximo'),
            `${m.rf} · ${m.sprint}`)));
      })));

    // Panel de mando: indicadores reales sacados de tus propias APIs (no son de adorno).
    const [inventario, cyborgs, clientes] = await Promise.all([
      api('/inventario').catch(() => []),
      api('/cyborgs').catch(() => []),
      api('/clientes').catch(() => []),
    ]);
    const bajoMinimo = inventario.filter((i) => i.bajo_minimo).length;
    valores.items.textContent = inventario.length;
    valores.bajos.textContent = bajoMinimo;
    valores.cyborgs.textContent = cyborgs.length;
    valores.clientes.textContent = clientes.length;
    if (bajoMinimo) { statBajos.classList.add('alerta'); impacto(statBajos, 0.5); }
  }

  function renderPlaceholder(c, m) {
    c.replaceChildren(
      cabecera(m.id, m.desc),
      el('div', { class: 'panel empty' },
        el('p', {}, `Este módulo (${m.rf}) se construye en el ${m.sprint}.`),
        el('p', {}, 'La ruta de la API y esta pantalla se agregan siguiendo el mismo patrón que Usuarios.')));
  }

  const INV_CATEGORIAS = ['arma', 'raid_suit', 'artefacto'];
  const INV_ESTADOS = ['disponible', 'en_mantenimiento', 'agotado', 'baja'];

  async function renderInventario(c) {
    c.replaceChildren(cabecera('inventario', 'Stock de armamento, Raid Suits y artefactos (RF-02).'));
    const msg = el('p', { class: 'msg', role: 'status' });

    const form = el('form', { class: 'panel', novalidate: true },
      el('h3', {}, 'Nuevo ítem'),
      el('div', { class: 'form-row' },
        field('Código', el('input', { name: 'codigo', required: true })),
        field('Nombre', el('input', { name: 'nombre', required: true })),
        field('Categoría', el('select', { name: 'categoria' }, INV_CATEGORIAS.map((v) => el('option', { value: v }, v)))),
        field('Cantidad', el('input', { name: 'cantidad', type: 'number', min: 0, required: true, value: 0 })),
        field('Mínimo', el('input', { name: 'minimo', type: 'number', min: 0, required: true, value: 5 })),
        field('Ubicación', el('input', { name: 'ubicacion' })),
        el('button', { class: 'btn primary', type: 'submit' }, 'Registrar')),
      msg);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(form));
      try {
        await api('/inventario', { method: 'POST', body });
        form.reset();
        impacto(form);
        mostrarPopup(`Ítem ${body.codigo} registrado con éxito.`, 'success');
        await loadTable();
      } catch (ex) {
        mostrarPopup(ex.message, 'error');
      }
    });

    const alertaBox = el('p', { class: 'msg' });
    const tableBox = el('div', { class: 'panel table-wrap' });
    c.append(form, alertaBox, tableBox);
    await loadTable();

    async function loadTable() {
      try {
        const items = await api('/inventario');
        const bajos = items.filter((it) => it.bajo_minimo).length;
        alertaBox.className = bajos ? 'msg err' : 'msg ok';
        alertaBox.replaceChildren(icono(bajos ? 'alerta' : 'ok'), bajos
          ? `${bajos} ítem(s) por debajo del mínimo (RF-06).`
          : 'Todo el inventario está por encima de su mínimo.');
        tableBox.replaceChildren(items.length ? el('table', {},
          thead(['Código', 'Nombre', 'Categoría', ['Cantidad', 'num'], ['Mínimo', 'num'], 'Estado', 'Ubicación', '']),
          el('tbody', {}, items.map((it) => el('tr', { class: it.bajo_minimo ? 'row-alerta' : '' },
            el('td', {}, it.codigo, it.bajo_minimo ? el('span', { class: 'sello rojo', title: 'Por debajo del mínimo (RF-06)' }, 'Bajo mínimo') : ''),
            el('td', {}, it.nombre),
            el('td', {}, el('select', { 'aria-label': `Categoría de ${it.codigo}`, onchange: (e) => patch(it.id, { categoria: e.target.value }) },
              INV_CATEGORIAS.map((v) => el('option', { value: v, selected: v === it.categoria }, v)))),
            el('td', { class: 'num' }, el('input', {
              type: 'number', min: 0, value: it.cantidad, style: 'width:5.5rem',
              'aria-label': `Cantidad de ${it.codigo}`, onchange: (e) => patch(it.id, { cantidad: e.target.value })
            })),
            el('td', { class: 'num' }, el('input', {
              type: 'number', min: 0, value: it.minimo, style: 'width:5.5rem',
              'aria-label': `Mínimo de ${it.codigo}`, onchange: (e) => patch(it.id, { minimo: e.target.value })
            })),
            el('td', {}, selectEstado(it.estado,
              { 'aria-label': `Estado de ${it.codigo}`, onchange: (e) => patch(it.id, { estado: e.target.value }) }, INV_ESTADOS)),
            el('td', {}, it.ubicacion || ''),
            el('td', {}, el('button', { class: 'btn small', type: 'button', onclick: () => remove(it.id, it.codigo) }, 'Eliminar'))))))
          : el('p', { class: 'empty' }, 'Aún no hay ítems registrados.'));
      } catch (ex) { tableBox.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
    }
    async function patch(id, body) {
      try { await api('/inventario/' + id, { method: 'PATCH', body }); impacto(tableBox); mostrarPopup('Cambios guardados con éxito.', 'success'); }
      catch (ex) { mostrarPopup(ex.message, 'error'); }
      await loadTable();
    }
    async function remove(id, codigo) {
      if (!confirm(`¿Eliminar el ítem ${codigo} del inventario?`)) return;
      try {
        await api('/inventario/' + id, { method: 'DELETE' });
        mostrarPopup(`Ítem ${codigo} eliminado con éxito.`, 'success');
      }
      catch (ex) {
        mostrarPopup(ex.message, 'error');
      }
      await loadTable();
    }
  }

  const CYB_ESTADOS = ['activo', 'en_mantenimiento', 'baja'];

  async function renderCyborgs(c) {
    c.replaceChildren(cabecera('cyborgs', 'Registro de unidades y asignación de equipamiento (RF-03).'));
    const msg = el('p', { class: 'msg', role: 'status' });

    const form = el('form', { class: 'panel', novalidate: true },
      el('h3', {}, 'Nuevo cyborg'),
      el('div', { class: 'form-row' },
        field('Código', el('input', { name: 'codigo', required: true })),
        field('Serie', el('input', { name: 'serie', required: true })),
        field('Nombre', el('input', { name: 'nombre' })),
        el('button', { class: 'btn primary', type: 'submit' }, 'Registrar')),
      msg);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(form));
      try {
        await api('/cyborgs', { method: 'POST', body });
        form.reset();
        impacto(form);
        mostrarPopup(`Cyborg ${body.codigo} registrado con éxito.`, 'success');
        await loadTable();
      } catch (ex) {
        mostrarPopup(ex.message, 'error');
      }
    });

    const tableBox = el('div', { class: 'panel table-wrap' });
    const equipoBox = el('div');
    c.append(form, tableBox, equipoBox);
    await loadTable();

    async function loadTable() {
      try {
        const cyborgs = await api('/cyborgs');
        tableBox.replaceChildren(cyborgs.length ? el('table', {},
          thead(['Código', 'Serie', 'Nombre', 'Estado', ['Ítems asignados', 'num'], '']),
          el('tbody', {}, cyborgs.map((cy) => el('tr', {},
            el('td', {}, cy.codigo), el('td', {}, cy.serie), el('td', {}, cy.nombre || ''),
            el('td', {}, selectEstado(cy.estado,
              { 'aria-label': `Estado de ${cy.codigo}`, onchange: (e) => patchEstado(cy.id, e.target.value) }, CYB_ESTADOS)),
            el('td', { class: 'num' }, String(cy.items_asignados)),
            el('td', {}, el('button', { class: 'btn small', type: 'button', onclick: () => renderEquipo(cy) }, 'Equipamiento'))))))
          : el('p', { class: 'empty' }, 'Aún no hay cyborgs registrados.'));
      } catch (ex) { tableBox.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
    }
    async function patchEstado(id, estado) {
      try { await api('/cyborgs/' + id, { method: 'PATCH', body: { estado } }); impacto(tableBox); mostrarPopup('Cambios guardados con éxito.', 'success'); }
      catch (ex) { mostrarPopup(ex.message, 'error'); }
      await loadTable();
    }

    // Panel de equipamiento de un cyborg concreto: se abre al pulsar "Equipamiento" en la tabla.
    async function renderEquipo(cyborg) {
      const equipoMsg = el('p', { class: 'msg', role: 'status' });
      const inventario = await api('/inventario').catch(() => []);

      const asignarForm = el('form', { class: 'panel', novalidate: true },
        el('h3', {}, `Asignar equipamiento a ${cyborg.codigo}`),
        el('div', { class: 'form-row' },
          field('Ítem', el('select', { name: 'itemId', required: true },
            inventario.map((it) => el('option', { value: it.id }, `${it.codigo} — ${it.nombre} (disp: ${it.cantidad})`)))),
          field('Cantidad', el('input', { name: 'cantidad', type: 'number', min: 1, value: 1, required: true })),
          el('button', { class: 'btn primary', type: 'submit' }, 'Asignar')),
        equipoMsg);
      asignarForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = Object.fromEntries(new FormData(asignarForm));
        try {
          await api(`/cyborgs/${cyborg.id}/equipamiento`, { method: 'POST', body });
          impacto(asignarForm);
          mostrarPopup('Equipamiento asignado y stock descontado.', 'success');
          await loadEquipoTable();
          await loadTable();
        } catch (ex) {
          mostrarPopup(ex.message, 'error');
        }
      });

      const equipoTableBox = el('div', { class: 'panel table-wrap' });
      equipoBox.replaceChildren(asignarForm, equipoTableBox);
      entrada([asignarForm, equipoTableBox]);
      await loadEquipoTable();

      async function loadEquipoTable() {
        try {
          const items = await api(`/cyborgs/${cyborg.id}/equipamiento`);
          equipoTableBox.replaceChildren(items.length ? el('table', {},
            thead(['Código', 'Nombre', ['Cantidad', 'num'], '']),
            el('tbody', {}, items.map((it) => el('tr', {},
              el('td', {}, it.item_codigo), el('td', {}, it.item_nombre), el('td', { class: 'num' }, String(it.cantidad)),
              el('td', {}, el('button', { class: 'btn small', type: 'button', onclick: () => quitar(it.id) }, 'Quitar'))))))
            : el('p', { class: 'empty' }, 'Este cyborg no tiene equipamiento asignado.'));
        } catch (ex) { equipoTableBox.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
      }
      async function quitar(equipId) {
        try {
          await api(`/cyborgs/${cyborg.id}/equipamiento/${equipId}`, { method: 'DELETE' });
          mostrarPopup('Equipamiento devuelto al inventario con éxito.', 'success');
        } catch (ex) {
          mostrarPopup(ex.message, 'error');
        }
        await loadEquipoTable();
        await loadTable();
      }
    }
  }

  const CLI_ESTADOS = ['al_dia', 'en_mora', 'suspendida'];

  async function renderClientes(c) {
    c.replaceChildren(cabecera('clientes', 'Directorio de reinos y su estado de cuenta (RF-04).'));
    const msg = el('p', { class: 'msg', role: 'status' });

    const form = el('form', { class: 'panel', novalidate: true },
      el('h3', {}, 'Nuevo reino cliente'),
      el('div', { class: 'form-row' },
        field('Nombre del reino', el('input', { name: 'nombre', required: true })),
        field('Contacto', el('input', { name: 'contacto' })),
        field('Ubicación', el('input', { name: 'ubicacion' })),
        el('button', { class: 'btn primary', type: 'submit' }, 'Registrar')),
      msg);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(form));
      try {
        await api('/clientes', { method: 'POST', body });
        form.reset();
        impacto(form);
        mostrarPopup(`Cliente ${body.nombre} registrado con éxito.`, 'success');
        await loadTable();
      } catch (ex) {
        mostrarPopup(ex.message, 'error');
      }
    });

    const tableBox = el('div', { class: 'panel table-wrap' });
    c.append(form, tableBox);
    await loadTable();

    async function loadTable() {
      try {
        const clientes = await api('/clientes');
        tableBox.replaceChildren(clientes.length ? el('table', {},
          thead(['Reino', 'Contacto', 'Ubicación', 'Estado de cuenta']),
          el('tbody', {}, clientes.map((cl) => el('tr', {},
            el('td', {}, cl.nombre),
            el('td', {}, el('input', {
              value: cl.contacto || '', 'aria-label': `Contacto de ${cl.nombre}`,
              onchange: (e) => patch(cl.id, { contacto: e.target.value })
            })),
            el('td', {}, el('input', {
              value: cl.ubicacion || '', 'aria-label': `Ubicación de ${cl.nombre}`,
              onchange: (e) => patch(cl.id, { ubicacion: e.target.value })
            })),
            el('td', {}, selectEstado(cl.estado_cuenta,
              { 'aria-label': `Estado de cuenta de ${cl.nombre}`, onchange: (e) => patch(cl.id, { estadoCuenta: e.target.value }) }, CLI_ESTADOS))))))
          : el('p', { class: 'empty' }, 'Aún no hay reinos clientes registrados.'));
      } catch (ex) { tableBox.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
    }
    async function patch(id, body) {
      try { await api('/clientes/' + id, { method: 'PATCH', body }); impacto(tableBox); mostrarPopup('Cambios guardados con éxito.', 'success'); }
      catch (ex) { mostrarPopup(ex.message, 'error'); }
      await loadTable();
    }
  }

  async function renderReportes(c) {
    c.replaceChildren(cabecera('reportes', 'Indicadores calculados por el motor en C++ a partir de tus datos reales (RF-06).'));
    const box = el('div');
    c.append(box);
    await cargar();

    async function cargar() {
      box.replaceChildren(el('p', { class: 'muted' }, 'Calculando…'));
      try {
        const r = await api('/reportes');
        const tablaConteo = (titulo, grupo, datos) => el('div', { class: 'panel table-wrap' },
          el('h3', {}, titulo),
          Object.keys(datos).length
            ? el('table', {}, thead([grupo, ['Total', 'num']]), el('tbody', {}, Object.entries(datos).map(([k, v]) =>
              el('tr', {}, el('td', {}, k), el('td', { class: 'num' }, String(v))))))
            : el('p', { class: 'empty' }, 'Sin datos todavía.'));

        const mosaico = el('div', { class: 'mosaico' },
          el('article', { class: 'panel destacada' }, el('h3', {}, 'Total de unidades en inventario'),
            el('p', { class: 'cifra' }, String(r.totalUnidadesInventario))),
          el('article', { class: 'panel' + (r.itemCritico ? ' alerta' : '') }, el('h3', {}, 'Ítem más crítico'),
            r.itemCritico
              ? [el('p', { class: 'critico-nombre' }, r.itemCritico.nombre),
                el('p', {}, `${r.itemCritico.id}: ${r.itemCritico.cantidad} de ${r.itemCritico.minimo} mínimo`),
                el('span', { class: 'sello rojo' }, 'Bajo mínimo')]
              : el('p', { class: 'empty' }, 'Ningún ítem está bajo su mínimo.')),
          tablaConteo('Stock por categoría', 'Categoría', r.stockPorCategoria),
          tablaConteo('Cyborgs por estado', 'Estado', r.cyborgsPorEstado),
          tablaConteo('Pedidos por estado', 'Estado', r.pedidosPorEstado),
          el('div', { class: 'panel table-wrap ancha' },
            el('h3', {}, 'Ítems bajo el mínimo'),
            r.itemsBajoMinimo.length ? el('table', {},
              thead(['Código', 'Nombre', ['Cantidad', 'num'], ['Mínimo', 'num']]),
              el('tbody', {}, r.itemsBajoMinimo.map((it) => el('tr', {},
                el('td', {}, it.id), el('td', {}, it.nombre), el('td', { class: 'num' }, String(it.cantidad)), el('td', { class: 'num' }, String(it.minimo))))))
              : el('p', { class: 'empty' }, 'Ningún ítem está bajo el mínimo.')));
        box.replaceChildren(mosaico);
        entrada(mosaico.children);
      } catch (ex) {
        box.replaceChildren(el('p', { class: 'msg err' }, ex.message),
          el('button', { class: 'btn', type: 'button', onclick: cargar }, 'Reintentar'));
      }
    }
  }

  async function renderUsers(c) {
    c.replaceChildren(cabecera('usuarios', 'Crea cuentas y define si son Administrador u Operativo.'));
    const msg = el('p', { class: 'msg', role: 'status' });

    const form = el('form', { class: 'panel', novalidate: true },
      el('h3', {}, 'Nuevo usuario'),
      el('div', { class: 'form-row' },
        field('Nombre', el('input', { name: 'nombre', required: true })),
        field('Correo', el('input', { name: 'email', type: 'email', required: true })),
        field('Contraseña (mínimo 8)', el('input', { name: 'password', type: 'password', minlength: 8, required: true, autocomplete: 'new-password' })),
        field('Rol', el('select', { name: 'rol' }, el('option', { value: 'Operativo' }, 'Operativo'), el('option', { value: 'Administrador' }, 'Administrador'))),
        el('button', { class: 'btn primary', type: 'submit' }, 'Crear usuario')),
      msg);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(form));
      try {
        await api('/users', { method: 'POST', body });
        form.reset();
        impacto(form);
        mostrarPopup(`Usuario ${body.email} creado con éxito.`, 'success');
        await loadTable();
      } catch (ex) {
        mostrarPopup(ex.message, 'error');
      }
    });

    const tableBox = el('div', { class: 'panel table-wrap' });
    c.append(form, tableBox);
    await loadTable();

    async function loadTable() {
      try {
        const users = await api('/users');
        tableBox.replaceChildren(el('table', {},
          thead(['Nombre', 'Correo', 'Rol', 'Estado', 'Creado', '']),
          el('tbody', {}, users.map((u) => el('tr', {},
            el('td', {}, u.nombre), el('td', {}, u.email),
            el('td', {}, el('select', { 'aria-label': `Rol de ${u.nombre}`, disabled: u.id === me.id, onchange: (e) => patch(u.id, { rol: e.target.value }) },
              ['Administrador', 'Operativo'].map((r) => el('option', { value: r, selected: r === u.rol }, r)))),
            el('td', {}, el('span', { class: 'sello ' + (u.activo ? 'verde' : 'gris') }, u.activo ? 'Activo' : 'Desactivado')),
            el('td', {}, fmtDate(u.creado_en)),
            el('td', {}, u.id === me.id ? '' : el('button', { class: 'btn small', type: 'button', onclick: () => patch(u.id, { activo: !u.activo }) }, u.activo ? 'Desactivar' : 'Activar')))))));
      } catch (ex) { tableBox.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
    }
    async function patch(id, body) {
      try { await api('/users/' + id, { method: 'PATCH', body }); impacto(tableBox); mostrarPopup('Cambios guardados con éxito.', 'success'); }
      catch (ex) { mostrarPopup(ex.message, 'error'); }
      await loadTable();
    }
  }

  async function renderAudit(c) {
    c.replaceChildren(cabecera('auditoria', 'Últimos 50 eventos de seguridad.'));
    const box = el('div', { class: 'panel table-wrap' });
    c.append(box);
    try {
      const rows = await api('/auditoria?limit=50');
      box.replaceChildren(rows.length ? el('table', {},
        thead(['Fecha', 'Usuario', 'Acción', 'IP']),
        el('tbody', {}, rows.map((r) => el('tr', {},
          el('td', {}, fmtDate(r.fecha_hora)), el('td', {}, r.usuario || 'Desconocido'),
          el('td', {}, r.accion_realizada), el('td', {}, r.direccion_ip || '')))))
        : el('p', { class: 'empty' }, 'Aún no hay eventos registrados.'));
    } catch (ex) { box.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
  }

  function field(label, input) { return el('div', {}, el('label', {}, label), input); }
  function setMsg(node, text, ok) { node.textContent = text; node.className = 'msg ' + (ok ? 'ok' : 'err'); }
  function mostrarPopup(mensaje, tipo = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    // Globo de manga: éxito con borde verde, error como globo de grito rojo.
    const error = tipo === 'error';
    const toast = el('div', { class: `toast ${tipo}`, role: error ? 'alert' : 'status' },
      icono(error ? 'alerta' : 'ok'), el('span', {}, mensaje));
    container.appendChild(toast);
    if (error) bordeRugoso(toast);
    if (anim()) {
      gsap.fromTo(toast, { opacity: 0, scale: 0.5, y: 24 }, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(2.2)' });
      if (error) impacto(toast, 0.3);
    } else toast.classList.add('show');
    setTimeout(() => {
      if (anim()) gsap.to(toast, { opacity: 0, y: 12, scale: 0.9, duration: 0.2, ease: 'power2.in', onComplete: () => toast.remove() });
      else { toast.classList.remove('show'); setTimeout(() => toast.remove(), 250); }
    }, 3200);
  }

  // ---------- arranque: restaurar sesión ----------
  (async () => {
    if (!store.token) return showLogin();
    try { me = await api('/auth/me'); await showApp(); } catch { store.token = null; showLogin(); }
  })();
})();