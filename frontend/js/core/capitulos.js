// Índice de capítulos: qué módulos hay, su color de hermano Vinsmoke, su arte y su número.
import { el } from './dom.js';

// ARTE OFICIAL TEMPORAL (uso académico): personajes del anime. Sustituir por arte original.
// Sanji (Reinos clientes) aún no tiene imagen: su cartel usa la bandera.
// Versiones optimizadas (WebP) en assets/img/. w/h evitan saltos al cargar.
export const ARTE = {
  ichiji: { src: 'assets/img/personajes/ichiji.webp', w: 613, h: 1000 },  // más grande: es el cartel destacado
  niji: { src: 'assets/img/personajes/niji.webp', w: 600, h: 600 },
  yonji: { src: 'assets/img/personajes/yonji.webp', w: 645, h: 600 },
  reiju: { src: 'assets/img/personajes/reiju.webp', w: 256, h: 600 },
  judge: { src: 'assets/img/personajes/judge.webp', w: 480, h: 600 },
  bandera: { src: 'assets/img/marca/bandera.webp', w: 160, h: 163 },
};
// <img> decorativo de un arte del mapa ARTE.
export const imgArte = (a, props = {}) =>
  el('img', { src: a.src, width: a.w, height: a.h, alt: '', decoding: 'async', ...props });

// Módulos del sistema. "sprint" indica cuándo se construye (SRS / plan Scrum).
// Cada capítulo lleva el color y el cartel de un hermano Vinsmoke (ver DESIGN.md).
// "alias" es el papel del módulo en el negocio de Germa: armamento, cyborgs y contrabando.
export const MODULES = [
  {
    id: 'inventario', name: 'Inventario', alias: 'Arsenal', hermano: 'Vinsmoke Ichiji', arte: ARTE.ichiji,
    color: 'var(--rojo)', onomato: 'ガシャン!', rf: 'RF-02', sprint: 'Sprint 2 (30 sep al 19 oct)', ready: true,
    desc: 'Armamento, Raid Suits y artefactos listos para la venta: cantidad, estado y ubicación.'
  },
  {
    id: 'cyborgs', name: 'Cyborgs', alias: 'Ejército de clones', hermano: 'Vinsmoke Niji', arte: ARTE.niji,
    color: 'var(--azul-mar)', onomato: 'ビリビリ!', rf: 'RF-03', sprint: 'Sprint 2 (30 sep al 19 oct)', ready: true,
    desc: 'Ficha de cada soldado clon y el equipamiento que lleva asignado.'
  },
  {
    id: 'clientes', name: 'Reinos clientes', alias: 'Compradores', hermano: 'Vinsmoke Sanji', arte: null,
    color: 'var(--dorado)', texto: 'var(--tinta)', onomato: 'ドン!', rf: 'RF-04', sprint: 'Sprint 3 (20 oct al 8 nov)', ready: true,
    desc: 'Reinos que compran armas y tropas a Germa: contacto, ubicación y estado de cuenta.'
  },
  {
    id: 'pedidos', name: 'Pedidos', alias: 'Contrabando', hermano: 'Vinsmoke Yonji', arte: ARTE.yonji,
    color: 'var(--verde)', onomato: 'ザッ!', rf: 'RF-05', sprint: 'Sprint 3 (20 oct al 8 nov)',
    desc: 'Encargos de armamento y tropas; descuentan o reservan stock al confirmar.'
  },
  {
    id: 'reportes', name: 'Reportes', alias: 'Inteligencia', hermano: 'Vinsmoke Reiju', arte: ARTE.reiju,
    color: 'var(--rosa)', onomato: 'ジャーン!', rf: 'RF-06', sprint: 'Sprint 3 (20 oct al 8 nov)', ready: true,
    desc: 'Balance del negocio: stock, tropas y encargos, calculados por el motor en C++.'
  },
];
export const ADMIN_VIEWS = [
  { id: 'usuarios', name: 'Usuarios y roles', arte: ARTE.judge, color: 'var(--tinta-suave)', onomato: 'コン!' },
  { id: 'auditoria', name: 'Auditoría de accesos', arte: ARTE.judge, color: 'var(--tinta-suave)', onomato: 'ギロッ' },
];
const INICIO = { id: 'inicio', name: 'Inicio', color: 'var(--papel-claro)', texto: 'var(--tinta)', sombra: 'var(--rojo)' };

// Inicio es el prólogo; el resto se numera en orden.
const CAPITULOS = [INICIO, ...MODULES, ...ADMIN_VIEWS].map((v, i) =>
  ({ ...v, cap: i === 0 ? 'Prólogo' : `Cap. ${String(i).padStart(2, '0')}` }));
export const capitulo = (id) => CAPITULOS.find((v) => v.id === id);
export const capVars = (v) => `--cap-color:${v.color};--cap-texto:${v.texto || 'var(--papel-claro)'};--cap-sombra:${v.sombra || v.color}`;
