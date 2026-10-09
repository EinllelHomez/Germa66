// Cabecera de capítulo: pestaña con el número, personaje, título letra por letra y onomatopeya.
import { el } from '../core/dom.js';
import { capitulo, imgArte } from '../core/capitulos.js';

export function cabecera(id, sub) {
  const v = capitulo(id);
  // Cada letra es un span (para animarla); los espacios van como no separables o se colapsarían.
  const letras = [...v.name].map((ch) => el('span', { class: 'letra' }, ch === ' ' ? ' ' : ch));
  return el('header', { class: 'cabecera' + (v.arte ? ' con-personaje' : ''), style: `--acento:${v.color};--acento-texto:${v.texto || 'var(--papel-claro)'}` },
    el('span', { class: 'pestana' }, v.alias ? `${v.cap} · ${v.alias}` : v.cap),
    // El personaje del capítulo "rompe" la viñeta por arriba, como en el manga.
    v.arte ? imgArte(v.arte, { class: 'cabecera-personaje', 'aria-hidden': 'true' }) : null,
    el('h1', { class: 'titulo-modulo' }, el('span', { class: 'sr-only' }, v.name), el('span', { 'aria-hidden': 'true' }, letras)),
    el('p', { class: 'cabecera-sub' }, sub),
    el('span', { class: 'onomato', 'aria-hidden': 'true' }, v.onomato || 'ドン!'));
}
