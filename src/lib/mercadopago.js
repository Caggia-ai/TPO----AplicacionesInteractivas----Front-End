/* Ayudas para el formulario de tarjeta de Mercado Pago (Card Payment Brick) */
import { api } from '../api.js';

let cfg = null;
let sdk = null;

/* Solo para las pruebas: olvida la configuración y el SDK ya cargados */
export function resetMercadoPagoCache() {
  cfg = null;
  sdk = null;
}

/* Datos públicos que da el servidor: la clave pública (nunca el access token) */
export function getConfig() {
  if (cfg) return Promise.resolve(cfg);
  return api('/api/config').then((c) => { cfg = c; return c; });
}

/* Carga el SDK de Mercado Pago una sola vez */
export function loadSDK() {
  if (window.MercadoPago) return Promise.resolve();
  if (sdk) return sdk;
  sdk = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://sdk.mercadopago.com/js/v2';
    s.onload = resolve;
    s.onerror = () => {
      sdk = null;
      reject(new Error('No se pudo cargar el formulario de tarjeta de Mercado Pago. Revisá tu conexión.'));
    };
    document.head.appendChild(s);
  });
  return sdk;
}

/* El formulario lo dibuja Mercado Pago en un iframe: solo deja cambiar colores y bordes */
export function brickStyle() {
  const dark = document.documentElement.getAttribute('data-theme') === 'mangadark';
  const ink = dark ? '#ffffff' : '#000000';
  const paper = dark ? '#000000' : '#ffffff';
  return {
    theme: 'default',
    customVariables: {
      baseColor: ink, baseColorFirstVariant: ink, baseColorSecondVariant: ink,
      textPrimaryColor: ink, textSecondaryColor: ink,
      inputBackgroundColor: paper, formBackgroundColor: paper,
      outlinePrimaryColor: ink, outlineSecondaryColor: ink, buttonTextColor: paper,
      borderRadiusSmall: '0px', borderRadiusMedium: '0px', borderRadiusLarge: '0px', borderRadiusFull: '0px',
    },
  };
}
