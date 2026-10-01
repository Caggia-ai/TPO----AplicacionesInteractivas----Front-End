/* Servidor simulado para la versión demo: vive dentro de la página y no hace ninguna llamada de red.
   Responde lo mismo que server/server.js (mismo contrato) para que la interfaz no note la diferencia. */
import { quote } from '../../shared/products.js';

const orders = {};    // "base de datos" del servidor simulado
const payments = {};
const soldSrv = {};

/* Tarjetas de prueba de Mercado Pago Argentina. Cualquier otro número se rechaza en la simulación
   para que nadie escriba una tarjeta real. */
export const TEST_CARDS = {
  5031755734530604: 'master',
  4509953566233704: 'visa',
  371180303257522: 'amex',
  5287338310253304: 'debmaster',
  4002768694395619: 'debvisa',
};
/* El nombre del titular decide el resultado, igual que con las tarjetas de prueba reales */
export const SCEN = {
  APRO: ['approved', 'accredited'],
  OTHE: ['rejected', 'cc_rejected_other_reason'],
  CONT: ['in_process', 'pending_contingency'],
  CALL: ['rejected', 'cc_rejected_call_for_authorize'],
  FUND: ['rejected', 'cc_rejected_insufficient_amount'],
  SECU: ['rejected', 'cc_rejected_bad_filled_security_code'],
};
const TAKEN = ['approved', 'in_process', 'pending'];

const wait = (v, ms = 350) => new Promise((r) => setTimeout(() => r(v), ms));
const fail = (msg, status = 400) =>
  new Promise((_, rej) => {
    const e = new Error(msg);
    e.status = status;
    setTimeout(() => rej(e), 250);
  });
const newRef = () => 'GG-' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 65536).toString(16).toUpperCase();
const newId = () => String(Math.floor(1e9 + Math.random() * 9e9));

function reserve(o) {
  if (o.reserved) return;
  o.reserved = true;
  o.lines.forEach((l) => {
    soldSrv[l.product.id] = (soldSrv[l.product.id] || 0) + l.qty;
  });
}
function checkBuyer(b = {}) {
  if (String(b.name || '').trim().length < 2) return 'Falta el nombre.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(b.email || '').trim())) return 'El email no es válido.';
  if (String(b.addr || '').trim().length < 3) return 'Falta la dirección de entrega.';
  if (String(b.city || '').trim().length < 2) return 'Falta la ciudad.';
  return '';
}

export function demoApi(path, opts = {}) {
  /* la interfaz puede mandar el cuerpo como objeto o como texto JSON */
  let body = {};
  try {
    body = opts.body ? (typeof opts.body === 'string' ? JSON.parse(opts.body) : opts.body) : {};
  } catch (e) {
    body = {};
  }

  if (path === '/api/config') return wait({ configured: true, publicKey: 'DEMO', transferAlias: 'gogogo.market' }, 120);

  if (path === '/api/preference' || path === '/api/transfer' || path === '/api/pay') {
    const be = checkBuyer(body.buyer);
    if (be) return fail(be, 400);
    let q;
    try {
      q = quote(body.items, soldSrv);
    } catch (e) {
      return fail(e.message, e.status);
    }
    const ref = newRef();

    if (path === '/api/preference') {
      orders[ref] = { ref, lines: q.lines, total: q.total, reserved: false };
      return wait({ ref, id: 'DEMO-PREF-' + ref, url: 'demo://mercadopago/' + ref, total: q.total });
    }
    if (path === '/api/transfer') {
      const o = { ref, lines: q.lines, total: q.total, reserved: false };
      orders[ref] = o;
      reserve(o);
      return wait({ ref, total: q.total, alias: 'gogogo.market' });
    }
    /* /api/pay: el "token" de la demo lleva el escenario elegido con el nombre del titular */
    const fd = body.formData || {};
    const sc = String(fd.token || '').startsWith('demo:') ? SCEN[String(fd.token).slice(5)] : null;
    if (!sc) return fail('Faltan los datos de la tarjeta.', 400);
    const id = newId();
    const o = { ref, lines: q.lines, total: q.total, reserved: false };
    orders[ref] = o;
    payments[id] = { status: sc[0], status_detail: sc[1], ref, amount: q.total };
    if (TAKEN.includes(sc[0])) reserve(o);
    return wait({ ref, id, status: sc[0], status_detail: sc[1], total: q.total }, 700);
  }

  const m = path.match(/^\/api\/payment\/(\d+)$/);
  if (m) {
    const p = payments[m[1]];
    if (!p) return fail('No se encontró el pago.', 404);
    return wait({ status: p.status, status_detail: p.status_detail, ref: p.ref, amount: p.amount }, 250);
  }
  return fail('Ruta no encontrada.', 404);
}

/* ---- Lo que usa la pantalla simulada de Mercado Pago ---- */
export const getDemoOrder = (ref) => orders[ref] || null;

const OUTCOMES = {
  approved: ['approved', 'accredited'],
  rejected: ['rejected', 'cc_rejected_other_reason'],
  pending: ['pending', 'pending_waiting_payment'],
};

/* Devuelve los parámetros con los que Mercado Pago "vuelve" a la tienda */
export function settleDemoMP(ref, outcome) {
  const o = orders[ref];
  if (!OUTCOMES[outcome] || !o) {
    return new URLSearchParams({
      collection_id: 'null', collection_status: 'null', payment_id: 'null', status: 'null', external_reference: ref,
    });
  }
  const id = newId();
  const [status, detail] = OUTCOMES[outcome];
  payments[id] = { status, status_detail: detail, ref, amount: o.total };
  if (TAKEN.includes(status)) reserve(o);
  return new URLSearchParams({
    collection_id: id, collection_status: status, payment_id: id, status, external_reference: ref,
  });
}
