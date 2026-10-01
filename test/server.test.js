/* Prueba del servidor contra un "Mercado Pago falso" local. No usa internet ni credenciales reales. */
import assert from 'node:assert';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const calls = [];              // lo que el servidor le mandó al MP falso
let nextPayment = { status: 'approved', status_detail: 'accredited' };

const fakeMP = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    const body = raw ? JSON.parse(raw) : null;
    calls.push({ method: req.method, url: req.url, headers: req.headers, body });
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/checkout/preferences') {
      return res.end(JSON.stringify({ id: 'PREF-1', init_point: 'https://mp.test/checkout/start?pref_id=PREF-1', sandbox_init_point: 'https://sandbox.mp.test/x' }));
    }
    if (req.url === '/v1/payments' && req.method === 'POST') {
      return res.end(JSON.stringify({ id: 555001, ...nextPayment, external_reference: body.external_reference }));
    }
    const m = req.url.match(/^\/v1\/payments\/(\d+)$/);
    if (m) return res.end(JSON.stringify({ id: Number(m[1]), status: 'approved', status_detail: 'accredited', external_reference: 'GG-XYZ', transaction_amount: 1234 }));
    res.statusCode = 404; res.end('{}');
  });
});

const buyer = { name: 'Luka Prueba', email: 'luka@example.com', addr: 'Calle 123', city: 'Buenos Aires' };
const post = (base, p, body) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => ({})) }));

async function main() {
  await new Promise((r) => fakeMP.listen(0, r));
  process.env.MP_API_BASE = 'http://127.0.0.1:' + fakeMP.address().port;
  process.env.MP_ACCESS_TOKEN = 'TEST-token-falso';
  process.env.MP_PUBLIC_KEY = 'TEST-public-falsa';
  process.env.TRANSFER_ALIAS = 'mi.alias.test';
  process.env.PUBLIC_URL = 'http://localhost:3999';

  const { default: app } = await import('../server/server.js');
  const srv = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const base = 'http://127.0.0.1:' + srv.address().port;
  let n = 0; const ok = (name) => console.log('  ok', ++n, '-', name);

  /* config: no filtra el token */
  let r = await fetch(base + '/api/config').then((x) => x.json());
  assert.strictEqual(r.configured, true); assert.strictEqual(r.publicKey, 'TEST-public-falsa');
  assert.ok(!JSON.stringify(r).includes('token')); ok('/api/config expone la clave pública y no el access token');

  /* Mercado Pago (Checkout Pro) */
  calls.length = 0;
  r = await post(base, '/api/preference', { items: [{ id: '7', qty: 1 }], buyer, total: 1, price: 1, items_prices: [1] });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.json.url, 'https://mp.test/checkout/start?pref_id=PREF-1');
  assert.strictEqual(r.json.total, 189900 + 8500);
  const pref = calls.find((c) => c.url === '/checkout/preferences');
  assert.strictEqual(pref.headers.authorization, 'Bearer TEST-token-falso');
  assert.strictEqual(pref.body.items[0].unit_price, 189900, 'precio del servidor, no del navegador');
  assert.strictEqual(pref.body.items[1].title, 'Envío'); assert.strictEqual(pref.body.items[1].unit_price, 8500);
  assert.ok(pref.body.external_reference.startsWith('GG-'));
  assert.strictEqual(pref.body.back_urls.success, 'http://localhost:3999/');
  assert.strictEqual(pref.body.auto_return, undefined, 'sin auto_return con http://localhost');
  assert.strictEqual(pref.body.notification_url, undefined);
  ok('preferencia: precios del servidor, envío incluido, sin auto_return en localhost');

  r = await post(base, '/api/preference', { items: [{ id: '3', qty: 1 }], buyer });   // 249000 -> envío 8500
  assert.strictEqual(r.json.total, 249000 + 8500);
  r = await post(base, '/api/preference', { items: [{ id: '3', qty: 1 }, { id: '4', qty: 1 }], buyer }); // supera 250000 -> gratis
  assert.strictEqual(r.json.total, 249000 + 98500); ok('envío gratis desde $250.000');

  /* validaciones */
  assert.strictEqual((await post(base, '/api/preference', { items: [{ id: '99', qty: 1 }], buyer })).status, 400);
  assert.strictEqual((await post(base, '/api/preference', { items: [{ id: '7', qty: 0 }], buyer })).status, 400);
  assert.strictEqual((await post(base, '/api/preference', { items: [{ id: '7', qty: 1.5 }], buyer })).status, 400);
  assert.strictEqual((await post(base, '/api/preference', { items: [{ id: '7', qty: 1 }, { id: '7', qty: 1 }], buyer })).status, 400);
  assert.strictEqual((await post(base, '/api/preference', { items: [], buyer })).status, 400);
  assert.strictEqual((await post(base, '/api/preference', { items: [{ id: '8', qty: 2 }], buyer })).status, 409);
  assert.strictEqual((await post(base, '/api/preference', { items: [{ id: '7', qty: 1 }], buyer: { ...buyer, email: 'malo' } })).status, 400);
  assert.strictEqual((await post(base, '/api/preference', { items: [{ id: '7', qty: 1 }], buyer: { ...buyer, name: '' } })).status, 400);
  ok('validaciones: figura inexistente, cantidad inválida, repetida, carrito vacío, sin stock, email y nombre');

  /* Tarjeta */
  calls.length = 0; nextPayment = { status: 'approved', status_detail: 'accredited' };
  const formData = { token: 'tok_123', issuer_id: '24', payment_method_id: 'master', transaction_amount: 1, installments: 3, payer: { email: 'luka@example.com', identification: { type: 'DNI', number: '12345678' } } };
  r = await post(base, '/api/pay', { items: [{ id: '8', qty: 1 }], buyer, formData });
  assert.strictEqual(r.status, 200); assert.strictEqual(r.json.status, 'approved');
  assert.strictEqual(r.json.total, 235000 + 8500);
  const pay = calls.find((c) => c.url === '/v1/payments');
  assert.strictEqual(pay.body.transaction_amount, 235000 + 8500, 'el monto que manda el navegador (1) se ignora');
  assert.strictEqual(pay.body.token, 'tok_123'); assert.strictEqual(pay.body.installments, 3);
  assert.strictEqual(pay.body.issuer_id, 24); assert.strictEqual(pay.body.payer.identification.number, '12345678');
  assert.ok(pay.headers['x-idempotency-key'], 'lleva clave de idempotencia');
  ok('tarjeta aprobada: monto calculado en el servidor, token e identificación reenviados, idempotencia');

  r = await post(base, '/api/preference', { items: [{ id: '8', qty: 1 }], buyer });
  assert.strictEqual(r.status, 409); ok('tras un pago aprobado se descuenta el stock en el servidor (dio 409 la última unidad)');

  calls.length = 0; nextPayment = { status: 'rejected', status_detail: 'cc_rejected_insufficient_amount' };
  r = await post(base, '/api/pay', { items: [{ id: '9', qty: 1 }], buyer, formData });
  assert.strictEqual(r.json.status, 'rejected'); assert.strictEqual(r.json.status_detail, 'cc_rejected_insufficient_amount');
  r = await post(base, '/api/preference', { items: [{ id: '9', qty: 4 }], buyer });
  assert.strictEqual(r.status, 200); ok('pago rechazado: no descuenta stock (se podían comprar las 4 unidades)');

  const k1 = calls[0].headers['x-idempotency-key']; nextPayment = { status: 'approved', status_detail: 'accredited' };
  await post(base, '/api/pay', { items: [{ id: '10', qty: 1 }], buyer, formData });
  assert.notStrictEqual(calls[calls.length - 1].headers['x-idempotency-key'], k1); ok('cada intento usa una clave de idempotencia nueva');

  assert.strictEqual((await post(base, '/api/pay', { items: [{ id: '7', qty: 1 }], buyer, formData: {} })).status, 400); ok('sin token de tarjeta: 400');

  /* Transferencia */
  r = await post(base, '/api/transfer', { items: [{ id: '15', qty: 1 }], buyer });
  assert.strictEqual(r.json.alias, 'mi.alias.test'); assert.strictEqual(r.json.total, 84900 + 8500); assert.ok(r.json.ref.startsWith('GG-'));
  ok('transferencia: devuelve alias, total y referencia');

  /* Verificación y webhook */
  r = await fetch(base + '/api/payment/987654').then((x) => x.json());
  assert.strictEqual(r.status, 'approved'); assert.strictEqual(r.ref, 'GG-XYZ'); assert.strictEqual(r.amount, 1234);
  assert.strictEqual((await fetch(base + '/api/payment/abc')).status, 400); ok('/api/payment/:id verifica contra Mercado Pago y rechaza ids raros');

  calls.length = 0;
  const wh = await fetch(base + '/api/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'payment', data: { id: '4242' } }) });
  assert.strictEqual(wh.status, 200); await new Promise((x) => setTimeout(x, 150));
  assert.ok(calls.some((c) => c.url === '/v1/payments/4242' && c.method === 'GET')); ok('webhook: responde 200 y vuelve a consultar el pago por id');

  /* estáticos (la tienda compilada en dist/) y seguridad de archivos */
  const home = await fetch(base + '/'); const html = await home.text();
  assert.strictEqual(home.status, 200); assert.ok(html.includes('id="root"')); assert.ok(html.includes('Gogogo'));
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(assets.some((a) => a.endsWith('.js')) && assets.some((a) => a.endsWith('.css')), 'index.html enlaza el JS y el CSS compilados');
  for (const a of assets) assert.strictEqual((await fetch(base + a)).status, 200, a + ' se sirve');
  for (const p of ['/server/server.js', '/shared/products.js', '/src/main.jsx', '/.env', '/package.json', '/../.env', '/%2e%2e/.env']) {
    assert.strictEqual((await fetch(base + p)).status, 404, p + ' no debe estar expuesto');
  }
  assert.strictEqual((await fetch(base + '/api/nada')).status, 404); ok('sirve dist/ y no expone server.js, el código fuente, .env ni package.json');

  srv.close(); fakeMP.close();

  /* Sin credenciales: mensaje claro (503), sin caerse */
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'server.js')], { env: { ...process.env, PORT: '3457', MP_ACCESS_TOKEN: '', MP_PUBLIC_KEY: '', MP_API_BASE: 'http://127.0.0.1:1' } });
  await new Promise((x) => setTimeout(x, 700));
  const r2 = await post('http://127.0.0.1:3457', '/api/preference', { items: [{ id: '7', qty: 1 }], buyer });
  child.kill();
  assert.strictEqual(r2.status, 503); assert.ok(/MP_ACCESS_TOKEN/.test(r2.json.error)); ok('sin MP_ACCESS_TOKEN: 503 con mensaje claro');

  console.log('\n' + n + ' pruebas OK');
}
main().catch((e) => { console.error('\nFALLÓ:', e.message, '\n', e.stack.split('\n').slice(0, 4).join('\n')); process.exit(1); });
