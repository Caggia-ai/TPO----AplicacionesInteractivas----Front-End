import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from '../src/App.jsx';
import { StoreProvider } from '../src/context/StoreContext.jsx';

export function renderShop() {
  const user = userEvent.setup();
  const utils = render(<StoreProvider><App /></StoreProvider>);
  return { user, ...utils };
}

/* Servidor falso: responde lo mismo que server/server.js y guarda cada llamada para poder revisarla */
export function mockApi(overrides = {}) {
  const calls = [];
  const defaults = {
    '/api/config': () => ({ configured: true, publicKey: 'TEST-pk', transferAlias: 'alias.test' }),
    '/api/preference': () => ({ ref: 'GG-REF1', id: 'P1', url: 'https://mp.test/start?ref=GG-REF1', total: 198400 }),
    '/api/transfer': (b) => ({ ref: 'GG-TR1', total: 84900 + 8500, alias: 'alias.test', echo: b }),
    '/api/pay': () => ({ ref: 'GG-CARD1', id: '777', status: 'approved', status_detail: 'accredited', total: 168400 }),
    '/api/payment/555': () => ({ status: 'approved', status_detail: 'accredited', ref: 'GG-REF1', amount: 198400 }),
    '/api/payment/999': () => ({ status: 'rejected', status_detail: 'cc_rejected_other_reason', ref: 'GG-REF1', amount: 198400 }),
  };
  const routes = { ...defaults, ...overrides };
  globalThis.fetch = vi.fn(async (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url, method: init.method || 'GET', body });
    const h = routes[url];
    if (!h) return { ok: false, status: 404, json: async () => ({ error: 'Ruta no encontrada.' }) };
    const out = await h(body);
    if (out && out.__error) return { ok: false, status: out.status || 400, json: async () => ({ error: out.__error }) };
    return { ok: true, status: 200, json: async () => out };
  });
  return calls;
}

/* Un <dialog> cerrado no tiene nombre accesible, así que se busca por su aria-label */
const dialogByLabel = (label) => {
  const d = [...document.querySelectorAll('dialog')].find((x) => x.getAttribute('aria-label') === label);
  if (!d) throw new Error(`No hay un diálogo "${label}"`);
  return d;
};
export const cartDialog = () => dialogByLabel('Carrito de compras');
export const productDialog = () => dialogByLabel('Detalle de la figura');
export const mpDialog = () => dialogByLabel('Simulación de Mercado Pago');
export const cardOf = (title) => screen.getByRole('heading', { name: title }).closest('article');

export async function addFigure(user, title) {
  await user.click(within(cardOf(title)).getByRole('button', { name: 'Agregar' }));
}
export async function openCart(user) {
  await user.click(screen.getByRole('button', { name: 'Abrir carrito' }));
}
export async function fillBuyer(user, scope) {
  const q = (label) => within(scope).getByLabelText(label);
  await user.type(q('Nombre y apellido'), 'Luka Prueba');
  await user.type(q('Email'), 'luka@example.com');
  await user.type(q('Dirección de entrega'), 'Calle 123');
  await user.type(q('Ciudad'), 'Buenos Aires');
}
/* Deja la compra en el paso de pago con una figura en el carrito */
export async function goToPay(user, title = /Jotaro/) {
  await addFigure(user, title);
  await openCart(user);
  await user.click(within(cartDialog()).getByRole('button', { name: 'Continuar' }));
  await fillBuyer(user, cartDialog());
  await user.click(within(cartDialog()).getByRole('button', { name: 'Continuar al pago' }));
  return cartDialog();
}
export async function choosePayment(user, name) {
  await user.click(within(cartDialog()).getByRole('radio', { name: new RegExp(name) }));
}
