// Estado de la sesión: el token vive en sessionStorage; el usuario, en memoria.
export const sesion = {
  get token() { return sessionStorage.getItem('germa_token'); },
  set token(v) { v ? sessionStorage.setItem('germa_token', v) : sessionStorage.removeItem('germa_token'); },
  me: null,
  get esAdmin() { return this.me?.rol === 'Administrador'; },
};
