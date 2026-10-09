// Modelo de catálogos: las listas de valores válidos vienen del backend (domain/catalogos.js),
// así los selectores nunca se desincronizan de lo que el servidor acepta.
import { api } from '../core/api.js';

export const catalogos = {
  categoriasInventario: [], estadosInventario: [], estadosCyborg: [], estadosCuenta: [], roles: [],
};

export async function cargarCatalogos() {
  Object.assign(catalogos, await api('/catalogos'));
}
