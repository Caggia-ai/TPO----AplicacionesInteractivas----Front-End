/* Ir a otra dirección (por ejemplo, a Mercado Pago).
   Está en su propio archivo para poder reemplazarlo en las pruebas. */
export function redirect(url) {
  window.location.href = url;
}
