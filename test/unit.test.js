/* Piezas sueltas: reglas de precio compartidas, formato, validación y el servidor simulado de la demo */
import { describe, expect, it } from 'vitest';
import { FREE_FROM, PRODUCTS, SHIP, quote } from '../shared/products.js';
import { validate } from '../src/cart/DataStep.jsx';
import { demoApi } from '../src/demo/demoServer.js';
import { fmt, isTaken, norm, payMsg } from '../src/lib/format.js';

describe('reglas de precio (shared/products.js)', () => {
  it('calcula subtotal, envío y total', () => {
    const q = quote([{ id: '7', qty: 1 }]);
    expect(q).toMatchObject({ subtotal: 189900, shipping: SHIP, total: 189900 + SHIP });
  });
  it('el envío es gratis desde el mínimo', () => {
    expect(quote([{ id: '3', qty: 1 }, { id: '4', qty: 1 }]).shipping).toBe(0);
    expect(FREE_FROM).toBe(250000);
  });
  it('rechaza cantidades, figuras y stock inválidos', () => {
    const status = (items) => { try { quote(items); return 200; } catch (e) { return e.status; } };
    expect(status([])).toBe(400);
    expect(status([{ id: '99', qty: 1 }])).toBe(400);
    expect(status([{ id: '7', qty: 0 }])).toBe(400);
    expect(status([{ id: '7', qty: 1.5 }])).toBe(400);
    expect(status([{ id: '7', qty: 1 }, { id: '7', qty: 1 }])).toBe(400);
    expect(status([{ id: '8', qty: 2 }])).toBe(409);
  });
  it('tiene en cuenta lo ya vendido', () => {
    expect(() => quote([{ id: '8', qty: 1 }], { 8: 1 })).toThrow(/No hay stock suficiente/);
  });
  it('el catálogo es consistente', () => {
    expect(PRODUCTS).toHaveLength(15);
    expect(new Set(PRODUCTS.map((p) => p.id)).size).toBe(15);
    PRODUCTS.forEach((p) => {
      expect(p.stats).toHaveLength(6);
      expect(p.stats.every((n) => n >= 1 && n <= 5)).toBe(true);
      expect(['a', 'b', 'c']).toContain(p.pose);
      expect(['focus', 'speed', 'tone', 'ink']).toContain(p.bg);
    });
  });
});

describe('formato', () => {
  it('fmt usa puntos de miles', () => expect(fmt(189900)).toBe('$189.900'));
  it('norm ignora tildes y mayúsculas', () => expect(norm('Kojirō ÁÉ')).toBe('kojiro ae'));
  it('isTaken', () => {
    expect(['approved', 'in_process', 'pending'].every(isTaken)).toBe(true);
    expect(isTaken('rejected')).toBe(false);
  });
  it('payMsg traduce el motivo o da uno genérico', () => {
    expect(payMsg('cc_rejected_call_for_authorize')).toMatch(/autorizar/);
    expect(payMsg('algo_raro')).toMatch(/no se pudo completar/);
  });
});

describe('validación de datos de envío', () => {
  it('detecta los cuatro campos vacíos y acepta datos buenos', () => {
    expect(Object.keys(validate({ name: '', email: '', addr: '', city: '' }))).toEqual(['name', 'email', 'addr', 'city']);
    expect(validate({ name: 'Ana', email: 'a@b.co', addr: 'Calle 1', city: 'Rosario' })).toEqual({});
    expect(validate({ name: 'Ana', email: 'a@b', addr: 'Calle 1', city: 'Rosario' })).toHaveProperty('email');
  });
});

describe('servidor simulado de la demo', () => {
  const buyer = { name: 'Ana', email: 'ana@example.com', addr: 'Calle 1', city: 'Rosario' };
  const call = (path, body) => demoApi(path, { method: 'POST', body: JSON.stringify(body) });

  it('calcula el total con los precios del catálogo', async () => {
    const r = await call('/api/transfer', { items: [{ id: '15', qty: 1 }], buyer });
    expect(r.total).toBe(84900 + 8500);
    expect(r.alias).toBe('gogogo.market');
  });
  it('rechaza datos inválidos', async () => {
    await expect(call('/api/transfer', { items: [{ id: '15', qty: 1 }], buyer: { ...buyer, email: 'x' } })).rejects.toThrow(/email/);
    await expect(call('/api/transfer', { items: [{ id: '99', qty: 1 }], buyer })).rejects.toThrow(/ya no existe/);
  });
  it('sin token de demo no procesa la tarjeta', async () => {
    await expect(call('/api/pay', { items: [{ id: '15', qty: 1 }], buyer, formData: { token: 'tok_real' } })).rejects.toThrow(/Faltan los datos/);
  });
  it('el titular decide el resultado y el pago se puede consultar', async () => {
    const r = await call('/api/pay', { items: [{ id: '14', qty: 1 }], buyer, formData: { token: 'demo:FUND' } });
    expect(r).toMatchObject({ status: 'rejected', status_detail: 'cc_rejected_insufficient_amount' });
    const ok = await call('/api/pay', { items: [{ id: '14', qty: 1 }], buyer, formData: { token: 'demo:APRO' } });
    const p = await demoApi(`/api/payment/${ok.id}`);
    expect(p).toMatchObject({ status: 'approved', ref: ok.ref });
  });
});
