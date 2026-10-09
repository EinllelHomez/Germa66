// Vista Login: el HTML está en index.html (#login-view); aquí se muestra y se maneja el formulario.
import { $ } from '../core/dom.js';
import { sesion } from '../core/sesion.js';
import { animarLogin, bordeRugoso, impacto } from '../core/movimiento.js';
import * as Auth from '../modelos/auth.js';

export function mostrarLogin() {
  $('#app-view').hidden = true;
  $('#login-view').hidden = false;
  $('#password').value = '';
  $('#email').focus();
  animarLogin();
}

// alEntrar se llama cuando el login es correcto (main.js abre la app).
export function prepararLogin(alEntrar) {
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#login-error'), btn = e.target.querySelector('button');
    err.hidden = true;
    btn.disabled = true;
    try {
      const data = await Auth.login($('#email').value, $('#password').value);
      sesion.token = data.token; sesion.me = data.user;
      await alEntrar();
    } catch (ex) {
      err.textContent = ex.message; err.hidden = false;
      bordeRugoso(err);
      impacto(err);
    } finally { btn.disabled = false; }
  });
}
