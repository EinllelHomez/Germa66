(() => {
  const API = '/api';
  const $ = (s) => document.querySelector(s);
  const store = {
    get token() { return sessionStorage.getItem('germa_token'); },
    set token(v) { v ? sessionStorage.setItem('germa_token', v) : sessionStorage.removeItem('germa_token'); },
  };
  let me = null;

  // Módulos del sistema. "sprint" indica cuándo se construye (SRS / plan Scrum).
  const MODULES = [
    { id: 'inventario', name: 'Inventario', color: 'var(--suit-red)', rf: 'RF-02', sprint: 'Sprint 2 (30 sep al 19 oct)', ready: true,
      desc: 'Stock de armamento y Raid Suits: código, categoría, cantidad, estado y ubicación.' },
    { id: 'cyborgs', name: 'Cyborgs', color: 'var(--suit-blue)', rf: 'RF-03', sprint: 'Sprint 2 (30 sep al 19 oct)', ready: true,
      desc: 'Ficha de cada unidad y asignación de equipamiento con stock disponible.' },
    { id: 'clientes', name: 'Reinos clientes', color: 'var(--suit-yellow)', rf: 'RF-04', sprint: 'Sprint 3 (20 oct al 8 nov)', ready: true,
      desc: 'Directorio de reinos, contacto, ubicación y estado de cuenta.' },
    { id: 'pedidos', name: 'Pedidos', color: 'var(--suit-green)', rf: 'RF-05', sprint: 'Sprint 3 (20 oct al 8 nov)',
      desc: 'Solicitudes de recursos; descuenta o reserva stock al confirmar.' },
    { id: 'reportes', name: 'Reportes', color: 'var(--suit-pink)', rf: 'RF-06', sprint: 'Sprint 3 (20 oct al 8 nov)',
      desc: 'Indicadores de stock, cyborgs y pedidos con filtros.' },
  ];
  const ADMIN_VIEWS = [
    { id: 'usuarios', name: 'Usuarios y roles' },
    { id: 'auditoria', name: 'Auditoría de accesos' },
  ];

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
  }

  async function logout(notify = true) {
    if (notify && store.token) { try { await api('/auth/logout', { method: 'POST' }); } catch {} }
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
    nav.replaceChildren(navBtn({ id: 'inicio', name: 'Inicio', color: 'var(--primary)' }));
    nav.append(el('div', { class: 'nav-group' }, 'Módulos'));
    MODULES.forEach((m) => nav.append(navBtn(m, m.ready ? null : 'Próximo')));
    if (me.rol === 'Administrador') {
      nav.append(el('div', { class: 'nav-group' }, 'Administración'));
      ADMIN_VIEWS.forEach((v) => nav.append(navBtn(v)));
    }
  }
  function navBtn(v, tag) {
    return el('button', { type: 'button', 'data-view': v.id, style: `--dot:${v.color || 'var(--line)'}`, onclick: () => go(v.id) },
      el('span', { class: 'dot' }), v.name, tag ? el('span', { class: 'tag' }, tag) : null);
  }

  function go(view) {
    document.querySelectorAll('.nav button').forEach((b) => {
      if (b.dataset.view === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    $('#nav').classList.remove('open'); $('#menu-btn').setAttribute('aria-expanded', 'false');
    const c = $('#content');
    if (view === 'inicio') renderHome(c);
    else if (view === 'inventario') renderInventario(c);
    else if (view === 'cyborgs') renderCyborgs(c);
    else if (view === 'clientes') renderClientes(c);
    else if (view === 'usuarios') renderUsers(c);
    else if (view === 'auditoria') renderAudit(c);
    else renderPlaceholder(c, MODULES.find((m) => m.id === view));
    c.focus();
  }

  // ---------- vistas ----------
  function renderHome(c) {
    const admin = me.rol === 'Administrador';
    c.replaceChildren(
      el('h2', {}, `Hola, ${me.nombre}`),
      el('p', { class: 'muted' }, admin
        ? 'Tienes acceso total: administras usuarios, roles y la auditoría, además de todos los módulos.'
        : 'Tu perfil es Operativo: registras datos y procesas solicitudes en los módulos.'),
      el('div', { class: 'grid' }, MODULES.map((m) =>
        el('article', { class: 'card', style: `--dot:${m.color}` },
          el('h3', {}, m.name), el('p', {}, m.desc),
          el('span', { class: 'chip' }, `${m.rf} · ${m.sprint}`)))));
  }

  function renderPlaceholder(c, m) {
    c.replaceChildren(
      el('h2', {}, m.name),
      el('div', { class: 'panel empty' },
        el('p', {}, `Este módulo (${m.rf}) se construye en el ${m.sprint}.`),
        el('p', {}, 'La ruta de la API y esta pantalla se agregan siguiendo el mismo patrón que Usuarios.')));
  }

  const INV_CATEGORIAS = ['arma', 'raid_suit', 'artefacto'];
  const INV_ESTADOS = ['disponible', 'en_mantenimiento', 'agotado', 'baja'];

  async function renderInventario(c) {
    c.replaceChildren(el('h2', {}, 'Inventario'), el('p', { class: 'muted' }, 'Stock de armamento, Raid Suits y artefactos (RF-02).'));
    const msg = el('p', { class: 'msg', role: 'status' });

    const form = el('form', { class: 'panel', novalidate: true },
      el('h3', {}, 'Nuevo ítem'),
      el('div', { class: 'form-row' },
        field('Código', el('input', { name: 'codigo', required: true })),
        field('Nombre', el('input', { name: 'nombre', required: true })),
        field('Categoría', el('select', { name: 'categoria' }, INV_CATEGORIAS.map((v) => el('option', { value: v }, v)))),
        field('Cantidad', el('input', { name: 'cantidad', type: 'number', min: 0, required: true, value: 0 })),
        field('Ubicación', el('input', { name: 'ubicacion' })),
        el('button', { class: 'btn primary', type: 'submit' }, 'Registrar')),
      msg);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(form));
      try {
        await api('/inventario', { method: 'POST', body });
        form.reset(); setMsg(msg, `Ítem ${body.codigo} registrado.`, true); await loadTable();
      } catch (ex) { setMsg(msg, ex.message, false); }
    });

    const tableBox = el('div', { class: 'panel table-wrap' });
    c.append(form, tableBox);
    await loadTable();

    async function loadTable() {
      try {
        const items = await api('/inventario');
        tableBox.replaceChildren(items.length ? el('table', {},
          el('thead', {}, el('tr', {}, ['Código', 'Nombre', 'Categoría', 'Cantidad', 'Estado', 'Ubicación', ''].map((h) => el('th', {}, h)))),
          el('tbody', {}, items.map((it) => el('tr', {},
            el('td', {}, it.codigo), el('td', {}, it.nombre),
            el('td', {}, el('select', { 'aria-label': `Categoría de ${it.codigo}`, onchange: (e) => patch(it.id, { categoria: e.target.value }) },
              INV_CATEGORIAS.map((v) => el('option', { value: v, selected: v === it.categoria }, v)))),
            el('td', {}, el('input', { type: 'number', min: 0, value: it.cantidad, style: 'width:5.5rem',
              'aria-label': `Cantidad de ${it.codigo}`, onchange: (e) => patch(it.id, { cantidad: e.target.value }) })),
            el('td', {}, el('select', { 'aria-label': `Estado de ${it.codigo}`, onchange: (e) => patch(it.id, { estado: e.target.value }) },
              INV_ESTADOS.map((v) => el('option', { value: v, selected: v === it.estado }, v)))),
            el('td', {}, it.ubicacion || ''),
            el('td', {}, el('button', { class: 'btn small', type: 'button', onclick: () => remove(it.id, it.codigo) }, 'Eliminar'))))))
          : el('p', { class: 'empty' }, 'Aún no hay ítems registrados.'));
      } catch (ex) { tableBox.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
    }
    async function patch(id, body) {
      try { await api('/inventario/' + id, { method: 'PATCH', body }); setMsg(msg, 'Cambios guardados.', true); }
      catch (ex) { setMsg(msg, ex.message, false); }
      await loadTable();
    }
    async function remove(id, codigo) {
      if (!confirm(`¿Eliminar el ítem ${codigo} del inventario?`)) return;
      try { await api('/inventario/' + id, { method: 'DELETE' }); setMsg(msg, `Ítem ${codigo} eliminado.`, true); }
      catch (ex) { setMsg(msg, ex.message, false); }
      await loadTable();
    }
  }

  const CYB_ESTADOS = ['activo', 'en_mantenimiento', 'baja'];

  async function renderCyborgs(c) {
    c.replaceChildren(el('h2', {}, 'Cyborgs'), el('p', { class: 'muted' }, 'Registro de unidades y asignación de equipamiento (RF-03).'));
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
        form.reset(); setMsg(msg, `Cyborg ${body.codigo} registrado.`, true); await loadTable();
      } catch (ex) { setMsg(msg, ex.message, false); }
    });

    const tableBox = el('div', { class: 'panel table-wrap' });
    const equipoBox = el('div');
    c.append(form, tableBox, equipoBox);
    await loadTable();

    async function loadTable() {
      try {
        const cyborgs = await api('/cyborgs');
        tableBox.replaceChildren(cyborgs.length ? el('table', {},
          el('thead', {}, el('tr', {}, ['Código', 'Serie', 'Nombre', 'Estado', 'Ítems asignados', ''].map((h) => el('th', {}, h)))),
          el('tbody', {}, cyborgs.map((cy) => el('tr', {},
            el('td', {}, cy.codigo), el('td', {}, cy.serie), el('td', {}, cy.nombre || ''),
            el('td', {}, el('select', { 'aria-label': `Estado de ${cy.codigo}`, onchange: (e) => patchEstado(cy.id, e.target.value) },
              CYB_ESTADOS.map((v) => el('option', { value: v, selected: v === cy.estado }, v)))),
            el('td', {}, String(cy.items_asignados)),
            el('td', {}, el('button', { class: 'btn small', type: 'button', onclick: () => renderEquipo(cy) }, 'Equipamiento'))))))
          : el('p', { class: 'empty' }, 'Aún no hay cyborgs registrados.'));
      } catch (ex) { tableBox.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
    }
    async function patchEstado(id, estado) {
      try { await api('/cyborgs/' + id, { method: 'PATCH', body: { estado } }); setMsg(msg, 'Cambios guardados.', true); }
      catch (ex) { setMsg(msg, ex.message, false); }
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
          setMsg(equipoMsg, 'Equipamiento asignado.', true);
          await loadEquipoTable(); await loadTable();
        } catch (ex) { setMsg(equipoMsg, ex.message, false); }
      });

      const equipoTableBox = el('div', { class: 'panel table-wrap' });
      equipoBox.replaceChildren(asignarForm, equipoTableBox);
      await loadEquipoTable();

      async function loadEquipoTable() {
        try {
          const items = await api(`/cyborgs/${cyborg.id}/equipamiento`);
          equipoTableBox.replaceChildren(items.length ? el('table', {},
            el('thead', {}, el('tr', {}, ['Código', 'Nombre', 'Cantidad', ''].map((h) => el('th', {}, h)))),
            el('tbody', {}, items.map((it) => el('tr', {},
              el('td', {}, it.item_codigo), el('td', {}, it.item_nombre), el('td', {}, String(it.cantidad)),
              el('td', {}, el('button', { class: 'btn small', type: 'button', onclick: () => quitar(it.id) }, 'Quitar'))))))
            : el('p', { class: 'empty' }, 'Este cyborg no tiene equipamiento asignado.'));
        } catch (ex) { equipoTableBox.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
      }
      async function quitar(equipId) {
        try {
          await api(`/cyborgs/${cyborg.id}/equipamiento/${equipId}`, { method: 'DELETE' });
          setMsg(equipoMsg, 'Equipamiento devuelto al inventario.', true);
        } catch (ex) { setMsg(equipoMsg, ex.message, false); }
        await loadEquipoTable(); await loadTable();
      }
    }
  }

  const CLI_ESTADOS = ['al_dia', 'en_mora', 'suspendida'];

  async function renderClientes(c) {
    c.replaceChildren(el('h2', {}, 'Reinos clientes'), el('p', { class: 'muted' }, 'Directorio de reinos y su estado de cuenta (RF-04).'));
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
        form.reset(); setMsg(msg, `Cliente ${body.nombre} registrado.`, true); await loadTable();
      } catch (ex) { setMsg(msg, ex.message, false); }
    });

    const tableBox = el('div', { class: 'panel table-wrap' });
    c.append(form, tableBox);
    await loadTable();

    async function loadTable() {
      try {
        const clientes = await api('/clientes');
        tableBox.replaceChildren(clientes.length ? el('table', {},
          el('thead', {}, el('tr', {}, ['Reino', 'Contacto', 'Ubicación', 'Estado de cuenta'].map((h) => el('th', {}, h)))),
          el('tbody', {}, clientes.map((cl) => el('tr', {},
            el('td', {}, cl.nombre),
            el('td', {}, el('input', { value: cl.contacto || '', 'aria-label': `Contacto de ${cl.nombre}`,
              onchange: (e) => patch(cl.id, { contacto: e.target.value }) })),
            el('td', {}, el('input', { value: cl.ubicacion || '', 'aria-label': `Ubicación de ${cl.nombre}`,
              onchange: (e) => patch(cl.id, { ubicacion: e.target.value }) })),
            el('td', {}, el('select', { 'aria-label': `Estado de cuenta de ${cl.nombre}`, onchange: (e) => patch(cl.id, { estadoCuenta: e.target.value }) },
              CLI_ESTADOS.map((v) => el('option', { value: v, selected: v === cl.estado_cuenta }, v))))))))
          : el('p', { class: 'empty' }, 'Aún no hay reinos clientes registrados.'));
      } catch (ex) { tableBox.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
    }
    async function patch(id, body) {
      try { await api('/clientes/' + id, { method: 'PATCH', body }); setMsg(msg, 'Cambios guardados.', true); }
      catch (ex) { setMsg(msg, ex.message, false); }
      await loadTable();
    }
  }

  async function renderUsers(c) {
    c.replaceChildren(el('h2', {}, 'Usuarios y roles'), el('p', { class: 'muted' }, 'Crea cuentas y define si son Administrador u Operativo.'));
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
        form.reset(); setMsg(msg, `Usuario ${body.email} creado.`, true); await loadTable();
      } catch (ex) { setMsg(msg, ex.message, false); }
    });

    const tableBox = el('div', { class: 'panel table-wrap' });
    c.append(form, tableBox);
    await loadTable();

    async function loadTable() {
      try {
        const users = await api('/users');
        tableBox.replaceChildren(el('table', {},
          el('thead', {}, el('tr', {}, ['Nombre', 'Correo', 'Rol', 'Estado', 'Creado', ''].map((h) => el('th', {}, h)))),
          el('tbody', {}, users.map((u) => el('tr', {},
            el('td', {}, u.nombre), el('td', {}, u.email),
            el('td', {}, el('select', { 'aria-label': `Rol de ${u.nombre}`, disabled: u.id === me.id, onchange: (e) => patch(u.id, { rol: e.target.value }) },
              ['Administrador', 'Operativo'].map((r) => el('option', { value: r, selected: r === u.rol }, r)))),
            el('td', {}, el('span', { class: 'chip ' + (u.activo ? 'ok' : 'off') }, u.activo ? 'Activo' : 'Desactivado')),
            el('td', {}, fmtDate(u.creado_en)),
            el('td', {}, u.id === me.id ? '' : el('button', { class: 'btn small', type: 'button', onclick: () => patch(u.id, { activo: !u.activo }) }, u.activo ? 'Desactivar' : 'Activar')))))));
      } catch (ex) { tableBox.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
    }
    async function patch(id, body) {
      try { await api('/users/' + id, { method: 'PATCH', body }); setMsg(msg, 'Cambios guardados.', true); }
      catch (ex) { setMsg(msg, ex.message, false); }
      await loadTable();
    }
  }

  async function renderAudit(c) {
    c.replaceChildren(el('h2', {}, 'Auditoría de accesos'), el('p', { class: 'muted' }, 'Últimos 50 eventos de seguridad.'));
    const box = el('div', { class: 'panel table-wrap' });
    c.append(box);
    try {
      const rows = await api('/auditoria?limit=50');
      box.replaceChildren(rows.length ? el('table', {},
        el('thead', {}, el('tr', {}, ['Fecha', 'Usuario', 'Acción', 'IP'].map((h) => el('th', {}, h)))),
        el('tbody', {}, rows.map((r) => el('tr', {},
          el('td', {}, fmtDate(r.fecha_hora)), el('td', {}, r.usuario || 'Desconocido'),
          el('td', {}, r.accion_realizada), el('td', {}, r.direccion_ip || '')))))
        : el('p', { class: 'empty' }, 'Aún no hay eventos registrados.'));
    } catch (ex) { box.replaceChildren(el('p', { class: 'msg err' }, ex.message)); }
  }

  function field(label, input) { return el('div', {}, el('label', {}, label), input); }
  function setMsg(node, text, ok) { node.textContent = text; node.className = 'msg ' + (ok ? 'ok' : 'err'); }

  // ---------- arranque: restaurar sesión ----------
  (async () => {
    if (!store.token) return showLogin();
    try { me = await api('/auth/me'); await showApp(); } catch { store.token = null; showLogin(); }
  })();
})();