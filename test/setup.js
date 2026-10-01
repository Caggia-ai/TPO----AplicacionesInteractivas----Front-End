/* Preparación común de las pruebas de la interfaz (jsdom no trae <dialog> modal completo) */
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup, configure } from '@testing-library/react';
import { resetMercadoPagoCache } from '../src/lib/mercadopago.js';

configure({ asyncUtilTimeout: 5000 });

HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute('open', ''); };
HTMLDialogElement.prototype.close = function close() {
  if (!this.hasAttribute('open')) return;
  this.removeAttribute('open');
  this.dispatchEvent(new Event('close'));
};
window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
window.scrollTo = () => {};

beforeEach(() => {
  localStorage.clear();
  resetMercadoPagoCache();
  globalThis.__DEMO__ = false;                 // por defecto, la tienda real
  document.documentElement.setAttribute('data-theme', 'manga');
  document.documentElement.setAttribute('data-saga', 'mix');
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete window.MercadoPago;
});
