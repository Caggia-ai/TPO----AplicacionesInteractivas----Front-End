/**
 * Servidor de Gogogo Market.
 *  - Sirve la carpeta /dist (la tienda de React ya compilada con "npm run build").
 *  - Habla con Mercado Pago usando el ACCESS TOKEN, que es secreto y nunca sale de acá.
 *  - Calcula SIEMPRE el total con los precios de products.js; ignora los montos que manda el navegador.
 */
import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { quote } from '../shared/products.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
const IS_HTTPS = PUBLIC_URL.startsWith('https://');
const TOKEN = process.env.MP_ACCESS_TOKEN || '';
const PUBLIC_KEY = process.env.MP_PUBLIC_KEY || '';
const MP_API = (process.env.MP_API_BASE || 'https://api.mercadopago.com').replace(/\/+$/, '');
const USE_SANDBOX_URL = process.env.MP_SANDBOX === '1';
const TRANSFER_ALIAS = process.env.TRANSFER_ALIAS || 'gogogo.market';

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/* ---------- "Base de datos" en memoria (se pierde al reiniciar) ---------- */
const orders = new Map();      // ref -> { ref, lines, buyer, total, status, method, reserved }
const soldServer = {};         // id -> unidades vendidas o reservadas

function newRef() {
  return 'GG-' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
}
/* Reserva el stock una sola vez por pedido */
function reserve(order) {
  if (!order || order.reserved) return;
  order.reserved = true;
  order.lines.forEach((l) => { soldServer[l.product.id] = (soldServer[l.product.id] || 0) + l.qty; });
}
const TAKEN = ['approved', 'in_process', 'pending'];

/* ---------- Validaciones ---------- */
function cleanBuyer(b) {
  b = b || {};
  const out = {
    name: String(b.name || '').trim().slice(0, 60),
    email: String(b.email || '').trim().slice(0, 80),
    addr: String(b.addr || '').trim().slice(0, 90),
    city: String(b.city || '').trim().slice(0, 40),
  };
  if (out.name.length < 2) throw new HttpError(400, 'Falta el nombre.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) throw new HttpError(400, 'El email no es válido.');
  if (out.addr.length < 3) throw new HttpError(400, 'Falta la dirección de entrega.');
  if (out.city.length < 2) throw new HttpError(400, 'Falta la ciudad.');
  return out;
}
function makeQuote(items) {
  try { return quote(items, soldServer); }
  catch (e) { throw new HttpError(e.status || 400, e.message); }
}

/* ---------- Cliente de la API de Mercado Pago ---------- */
async function mp(pathname, { method = 'GET', body, idempotencyKey } = {}) {
  if (!TOKEN) throw new HttpError(503, 'Falta configurar MP_ACCESS_TOKEN en el servidor (archivo .env).');
  const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
  if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;
  let res;
  try {
    res = await fetch(MP_API + pathname, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch (e) {
    throw new HttpError(502, 'No se pudo conectar con Mercado Pago.');
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
function mpError(r, fallback) {
  const d = r.data || {};
  const cause = Array.isArray(d.cause) && d.cause[0] && (d.cause[0].description || d.cause[0].code);
  console.error('Mercado Pago respondió', r.status, JSON.stringify(d));
  return new HttpError(502, `${fallback}${d.message ? ' (' + d.message + ')' : ''}${cause ? ' — ' + cause : ''}`);
}

/* ---------- App ---------- */
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* Datos públicos para el navegador (nunca el access token) */
app.get('/api/config', (req, res) => {
  res.json({ configured: Boolean(TOKEN), publicKey: PUBLIC_KEY, transferAlias: TRANSFER_ALIAS });
});

/* 1) Mercado Pago (Checkout Pro): crea la preferencia y devuelve la URL a la que ir */
app.post('/api/preference', wrap(async (req, res) => {
  const buyer = cleanBuyer(req.body.buyer);
  const q = makeQuote(req.body.items);
  const ref = newRef();

  const items = q.lines.map((l) => ({
    id: l.product.id,
    title: l.product.title,
    quantity: l.qty,
    unit_price: l.product.price,
    currency_id: 'ARS',
  }));
  if (q.shipping > 0) items.push({ id: 'envio', title: 'Envío', quantity: 1, unit_price: q.shipping, currency_id: 'ARS' });

  const body = {
    items,
    payer: { name: buyer.name, email: buyer.email },
    external_reference: ref,
    statement_descriptor: 'GOGOGO MARKET',
    back_urls: { success: PUBLIC_URL + '/', failure: PUBLIC_URL + '/', pending: PUBLIC_URL + '/' },
  };
  /* Mercado Pago rechaza auto_return y notification_url con direcciones que no sean públicas (https) */
  if (IS_HTTPS) {
    body.auto_return = 'approved';
    body.notification_url = PUBLIC_URL + '/api/webhook';
  }

  const r = await mp('/checkout/preferences', { method: 'POST', body });
  if (!r.ok) throw mpError(r, 'Mercado Pago no pudo crear el pago.');

  orders.set(ref, { ref, lines: q.lines, buyer, total: q.total, status: 'created', method: 'mp', reserved: false });
  const url = USE_SANDBOX_URL ? r.data.sandbox_init_point : r.data.init_point;
  if (!url) throw new HttpError(502, 'Mercado Pago no devolvió el enlace de pago.');
  res.json({ ref, id: r.data.id, url, total: q.total });
}));

/* 2) Tarjeta (Card Payment Brick): recibe el token del formulario y crea el pago */
app.post('/api/pay', wrap(async (req, res) => {
  const buyer = cleanBuyer(req.body.buyer);
  const q = makeQuote(req.body.items);
  const fd = req.body.formData || {};
  const payerIn = fd.payer || {};
  if (!fd.token || !fd.payment_method_id) throw new HttpError(400, 'Faltan los datos de la tarjeta.');
  const ref = newRef();

  const body = {
    transaction_amount: q.total,                       // el monto sale del servidor, no del navegador
    token: fd.token,
    description: 'Gogogo Market — pedido ' + ref,
    installments: Number(fd.installments) || 1,
    payment_method_id: fd.payment_method_id,
    payer: { email: payerIn.email || buyer.email },
    external_reference: ref,
    statement_descriptor: 'GOGOGO MARKET',
  };
  if (fd.issuer_id) body.issuer_id = Number(fd.issuer_id) || fd.issuer_id;
  if (payerIn.identification && payerIn.identification.number) {
    body.payer.identification = { type: payerIn.identification.type, number: payerIn.identification.number };
  }
  if (IS_HTTPS) body.notification_url = PUBLIC_URL + '/api/webhook';

  /* una clave nueva por intento: si el pago se rechaza y la persona reintenta, no se reutiliza la respuesta anterior */
  const r = await mp('/v1/payments', { method: 'POST', body, idempotencyKey: crypto.randomUUID() });
  if (!r.ok) throw mpError(r, 'Mercado Pago no pudo procesar el pago.');

  const order = { ref, lines: q.lines, buyer, total: q.total, status: r.data.status, method: 'card', reserved: false };
  orders.set(ref, order);
  if (TAKEN.includes(r.data.status)) reserve(order);
  res.json({ ref, id: r.data.id, status: r.data.status, status_detail: r.data.status_detail, total: q.total });
}));

/* 3) Transferencia: se registra el pedido y se devuelven los datos para transferir */
app.post('/api/transfer', wrap(async (req, res) => {
  const buyer = cleanBuyer(req.body.buyer);
  const q = makeQuote(req.body.items);
  const ref = newRef();
  const order = { ref, lines: q.lines, buyer, total: q.total, status: 'pending', method: 'transfer', reserved: false };
  orders.set(ref, order);
  reserve(order);
  res.json({ ref, total: q.total, alias: TRANSFER_ALIAS });
}));

/* 4) Verificar un pago por su id (lo usa la página al volver de Mercado Pago) */
app.get('/api/payment/:id', wrap(async (req, res) => {
  if (!/^\d{3,20}$/.test(req.params.id)) throw new HttpError(400, 'Identificador de pago inválido.');
  const r = await mp('/v1/payments/' + req.params.id);
  if (!r.ok) throw mpError(r, 'No se pudo verificar el pago.');
  const d = r.data;
  const order = orders.get(d.external_reference);
  if (order) { order.status = d.status; if (TAKEN.includes(d.status)) reserve(order); }
  res.json({ status: d.status, status_detail: d.status_detail, ref: d.external_reference, amount: d.transaction_amount });
}));

/* 5) Webhook: Mercado Pago avisa cuando cambia un pago. Se vuelve a consultar el pago por id,
      así nadie puede falsear el estado mandando una notificación inventada. */
app.post('/api/webhook', (req, res) => {
  res.sendStatus(200);
  const id = (req.body && req.body.data && req.body.data.id) || req.query['data.id'] || req.query.id;
  const type = (req.body && req.body.type) || req.query.type || req.query.topic;
  if (!id || type !== 'payment' || !/^\d{3,20}$/.test(String(id)) || !TOKEN) return;
  mp('/v1/payments/' + id).then((r) => {
    if (!r.ok) return;
    const order = orders.get(r.data.external_reference);
    if (!order) return;
    order.status = r.data.status;
    if (TAKEN.includes(r.data.status)) reserve(order);
    console.log(`Webhook: pedido ${order.ref} -> ${order.status}`);
  }).catch(() => {});
});

/* ---------- Tienda estática y errores ---------- */
app.use(express.static(DIST));

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  if (status >= 500 && !(err instanceof HttpError)) console.error(err);
  res.status(status).json({ error: err instanceof HttpError ? err.message : 'Error interno del servidor.' });
});

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  app.listen(PORT, () => {
    console.log(`Gogogo Market en ${PUBLIC_URL}`);
    if (!fs.existsSync(path.join(DIST, 'index.html'))) console.warn('AVISO: falta la carpeta dist. Corré "npm run build" (o usá "npm start", que compila y arranca).');
    if (!TOKEN) console.warn('AVISO: falta MP_ACCESS_TOKEN. La tienda funciona, pero los pagos con Mercado Pago y tarjeta no. Mirá el README.');
    if (!PUBLIC_KEY) console.warn('AVISO: falta MP_PUBLIC_KEY. El formulario de tarjeta no se va a poder mostrar.');
  });
}
export default app;
