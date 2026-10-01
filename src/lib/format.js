/* Funciones y textos chicos que usan varios componentes. */

export const fmt = (n) => '$' + new Intl.NumberFormat('es-AR').format(Math.round(n));

/* minúsculas y sin tildes, para que "kojiro" encuentre "Kojirō" */
export const norm = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/* localStorage con try/catch: en algunos visores está bloqueado y no debe romper la tienda */
export function load(key, fallback) {
  try {
    const v = window.localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}
export function save(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* sin almacenamiento: la tienda sigue funcionando, solo que no recuerda */
  }
}

export const SAGAS = {
  val: { name: 'Shuumatsu no Valkyrie', tag: 'RAGNAROK' },
  jojo: { name: "JoJo's Bizarre Adventure", tag: 'JOJO' },
  otro: { name: 'Otros animes', tag: 'ANIME' },
};
export const STAT_NAMES = ['Detalle', 'Pintura', 'Articulación', 'Rareza', 'Acabado', 'Valor'];
export const GRADES = ['E', 'D', 'C', 'B', 'A'];

export const METHODS = [
  { id: 'mp', title: 'Mercado Pago', hint: 'Te llevamos a Mercado Pago para pagar con tu cuenta, tarjeta o efectivo.' },
  { id: 'card', title: 'Tarjeta de crédito o débito', hint: 'Cargás los datos de la tarjeta acá mismo.' },
  { id: 'tr', title: 'Transferencia bancaria', hint: 'Confirmás el pedido y te damos los datos para transferir.' },
];

const PAYMSG = {
  cc_rejected_insufficient_amount: 'La tarjeta no tiene fondos suficientes.',
  cc_rejected_bad_filled_card_number: 'Revisá el número de la tarjeta.',
  cc_rejected_bad_filled_date: 'Revisá la fecha de vencimiento.',
  cc_rejected_bad_filled_security_code: 'Revisá el código de seguridad.',
  cc_rejected_bad_filled_other: 'Revisá los datos de la tarjeta.',
  cc_rejected_call_for_authorize: 'Tenés que autorizar el pago con tu banco. Llamalo y volvé a intentar.',
  cc_rejected_card_disabled: 'La tarjeta está inactiva. Llamá a tu banco para activarla.',
  cc_rejected_duplicated_payment: 'Ya hiciste un pago por este valor. Usá otra tarjeta u otro medio de pago.',
  cc_rejected_high_risk: 'El pago fue rechazado por seguridad. Probá con otro medio de pago.',
  cc_rejected_max_attempts: 'Llegaste al límite de intentos. Probá con otra tarjeta u otro medio de pago.',
  cc_rejected_other_reason: 'La tarjeta no procesó el pago. Probá con otra tarjeta u otro medio de pago.',
};
export const payMsg = (detail) =>
  PAYMSG[detail] || 'El pago no se pudo completar. Probá de nuevo o elegí otro medio de pago.';

/* un pedido "queda tomado" si el pago se aprobó o está en camino */
export const isTaken = (status) => status === 'approved' || status === 'in_process' || status === 'pending';

export function errMsg(e) {
  if (e && e.message === 'file')
    return 'Para pagar, abrí la tienda desde http://localhost:3000 (con "npm start") y no desde el archivo.';
  if (e && e.name === 'TypeError')
    return 'No se pudo conectar con el servidor de pagos. ¿Está corriendo "npm start"?';
  return (e && e.message) || 'Ocurrió un error inesperado.';
}
