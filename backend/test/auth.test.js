process.env.DB_NAME = 'germa66_test';
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const { createPool } = require('../src/db/pool');
const { initDatabase } = require('../src/db/init');
const { createApp } = require('../src/app');

let pool, server, base;

async function call(method, path, body, token) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}
const login = async (email, password) => (await call('POST', '/api/auth/login', { email, password })).data.token;

before(async () => {
  pool = createPool();
  await initDatabase(pool);
  await pool.query('SET FOREIGN_KEY_CHECKS=0');
  for (const t of ['auditoria_seguridad', 'usuarios']) await pool.query(`TRUNCATE TABLE ${t}`);
  await pool.query('SET FOREIGN_KEY_CHECKS=1');
  const [[rol]] = await pool.query("SELECT id FROM roles WHERE nombre='Administrador'");
  await pool.query('INSERT INTO usuarios (nombre,email,clave_hash,rol_id) VALUES (?,?,?,?)',
    ['Admin', 'admin@test.com', await bcrypt.hash('Admin123*', 4), rol.id]);
  server = createApp(pool).listen(0);
  base = `http://localhost:${server.address().port}`;
});

after(async () => { server.close(); await pool.end(); });

test('login correcto devuelve token y rol (RF-01)', async () => {
  const { status, data } = await call('POST', '/api/auth/login', { email: 'admin@test.com', password: 'Admin123*' });
  assert.strictEqual(status, 200);
  assert.ok(data.token);
  assert.strictEqual(data.user.rol, 'Administrador');
});

test('credenciales incorrectas bloquean el acceso con 401', async () => {
  const { status } = await call('POST', '/api/auth/login', { email: 'admin@test.com', password: 'mala' });
  assert.strictEqual(status, 401);
});

test('ruta protegida sin token da 401', async () => {
  assert.strictEqual((await call('GET', '/api/users')).status, 401);
});

test('RBAC: Operativo recibe 403, Administrador 200', async () => {
  const admin = await login('admin@test.com', 'Admin123*');
  const nuevo = await call('POST', '/api/users', { nombre: 'Op', email: 'op@test.com', password: 'Operativo1*', rol: 'Operativo' }, admin);
  assert.strictEqual(nuevo.status, 201);
  const op = await login('op@test.com', 'Operativo1*');
  assert.strictEqual((await call('GET', '/api/users', null, op)).status, 403);
  assert.strictEqual((await call('GET', '/api/auditoria', null, op)).status, 403);
  assert.strictEqual((await call('GET', '/api/users', null, admin)).status, 200);
});

test('correo duplicado da 409; usuario desactivado no entra', async () => {
  const admin = await login('admin@test.com', 'Admin123*');
  const dup = await call('POST', '/api/users', { nombre: 'X', email: 'op@test.com', password: 'Operativo1*', rol: 'Operativo' }, admin);
  assert.strictEqual(dup.status, 409);
  const [[u]] = await pool.query("SELECT id FROM usuarios WHERE email='op@test.com'");
  await call('PATCH', `/api/users/${u.id}`, { activo: false }, admin);
  const r = await call('POST', '/api/auth/login', { email: 'op@test.com', password: 'Operativo1*' });
  assert.strictEqual(r.status, 403);
});

test('la auditoría registra accesos exitosos y fallidos', async () => {
  const admin = await login('admin@test.com', 'Admin123*');
  const { data } = await call('GET', '/api/auditoria', null, admin);
  const acciones = data.map((a) => a.accion_realizada).join('|');
  assert.match(acciones, /Login exitoso/);
  assert.match(acciones, /Login fallido/);
});

test('autenticación responde en menos de 1 segundo (RNF-03)', async () => {
  const t0 = Date.now();
  await login('admin@test.com', 'Admin123*');
  assert.ok(Date.now() - t0 < 1000, 'tardó ' + (Date.now() - t0) + ' ms');
});
