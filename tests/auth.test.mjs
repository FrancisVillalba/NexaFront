import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { SESSION_KEY, SESSION_ENDED_EVENT, saveSession, getSession, clearSession } from '../src/services/authSession.js';
import { api } from '../src/services/api.js';
import { login, restoreSession } from '../src/services/authService.js';

class Storage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}
const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
const user = { usuarioId: 7, nombreUsuario: 'prueba', nombre: 'Persona', apellido: 'Prueba', documento: null, perfilId: 2, perfil: 'Administrador' };
const response = () => ({ token: 'token-de-prueba', tipoToken: 'Bearer', expiraEn: new Date(Date.now() + 900000).toISOString(), usuario: user });
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  const target = new EventTarget();
  target.sessionStorage = new Storage();
  target.localStorage = new Storage();
  globalThis.window = target;
});
afterEach(() => { globalThis.fetch = originalFetch; globalThis.window = originalWindow; });

test('Sesión temporal guarda solo token y vencimiento, sin contraseña ni datos personales', () => {
  saveSession(response());
  const saved = JSON.parse(window.sessionStorage.getItem(SESSION_KEY));
  assert.deepEqual(Object.keys(saved).sort(), ['expiraEn', 'token']);
  assert.equal(window.localStorage.getItem(SESSION_KEY), null);
  assert.equal(getSession().token, 'token-de-prueba');
});

test('Recordar sesión elige localStorage y elimina cualquier sesión anterior', () => {
  saveSession(response());
  saveSession(response(), true);
  assert.equal(window.sessionStorage.getItem(SESSION_KEY), null);
  assert.ok(window.localStorage.getItem(SESSION_KEY));
});

test('Sesión vencida se elimina y notifica a la interfaz', () => {
  let ended;
  window.addEventListener(SESSION_ENDED_EVENT, event => { ended = event.detail.reason; });
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'viejo', expiraEn: new Date(Date.now() - 1000).toISOString() }));
  assert.equal(getSession(), null);
  assert.equal(ended, 'expired');
  assert.equal(window.sessionStorage.getItem(SESSION_KEY), null);
});

test('API envía Bearer y no envía cookies al backend', async () => {
  saveSession(response());
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/usuarios/perfiles');
    assert.equal(options.headers.Authorization, 'Bearer token-de-prueba');
    assert.equal(options.credentials, 'omit');
    return json([]);
  };
  assert.deepEqual(await api('/api/usuarios/perfiles'), []);
});

test('Un 401 protegido limpia el token; un login incorrecto no borra una sesión por accidente', async () => {
  saveSession(response());
  globalThis.fetch = async () => json({ detail: 'Credenciales incorrectas.' }, 401);
  await assert.rejects(api('/api/usuarios/auth/login', {}, { authenticated: false }), /Credenciales incorrectas/);
  assert.ok(getSession());
  await assert.rejects(api('/api/usuarios/perfiles'), /Credenciales incorrectas/);
  assert.equal(getSession(), null);
});

test('API interpreta Problem Details y rechaza una página HTML como respuesta de API', async () => {
  globalThis.fetch = async () => json({ errors: { NombreUsuario: ['Usuario obligatorio.'] } }, 400);
  await assert.rejects(api('/api/usuarios/auth/login', {}, { authenticated: false }), /Usuario obligatorio/);
  globalThis.fetch = async () => new Response('<html>Frontend</html>', { status: 200 });
  await assert.rejects(api('/api/usuarios/auth/login', {}, { authenticated: false }), /no devolvió JSON/);
});

test('Login usa el contrato real de NexaBack y guarda el token sin almacenar la contraseña', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/usuarios/auth/login');
    assert.deepEqual(JSON.parse(options.body), { nombreUsuario: 'prueba', password: 'Solo-para-la-prueba!' });
    assert.equal(options.headers.Authorization, undefined);
    return json(response());
  };
  const result = await login(' prueba ', 'Solo-para-la-prueba!');
  assert.equal(result.id, 7);
  assert.equal(result.name, 'Persona Prueba');
  assert.equal(result.role, 'Administrador');
  assert.ok(!window.sessionStorage.getItem(SESSION_KEY).includes('Solo-para-la-prueba!'));
});

test('Restauración verifica el token en me y no se basa en datos de usuario del navegador', async () => {
  saveSession(response());
  globalThis.fetch = async url => { assert.equal(url, '/api/usuarios/auth/me'); return json(user); };
  assert.equal((await restoreSession()).id, 7);
});

test('Cerrar sesión mientras se restaura no permite que una respuesta antigua vuelva a abrirla', async () => {
  saveSession(response());
  globalThis.fetch = async () => { clearSession(); return json(user); };
  assert.equal(await restoreSession(), null);
});

test('Nunca se envía el token a una dirección externa ni se guarda una sesión ya vencida', async () => {
  saveSession(response());
  await assert.rejects(api('https://otro-servidor.example/api'), /Dirección de API inválida/);
  assert.throws(() => saveSession({ ...response(), expiraEn: '2000-01-01T00:00:00Z' }), /sesión inválida/);
});
