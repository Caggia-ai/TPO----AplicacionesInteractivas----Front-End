/* Piezas que repiten varios pasos del carrito */
import { useStore } from '../context/StoreContext.jsx';
import { fmt } from '../lib/format.js';

/* Los cuatro pasos de la compra (DaisyUI steps) */
export function Steps({ n }) {
  const names = ['Carrito', 'Datos', 'Pago', 'Listo'];
  return (
    <ul className="steps w-full mb-5 text-xs font-black">
      {names.map((nm, i) => <li key={nm} className={`step${n >= i + 1 ? ' step-primary' : ''}`}>{nm}</li>)}
    </ul>
  );
}

/* Subtotal, envío y total */
export function Summary() {
  const { subtotal, shipping, total } = useStore();
  return (
    <dl className="grid gap-1 font-bold my-4">
      <div className="flex justify-between"><dt>Subtotal</dt><dd>{fmt(subtotal)}</dd></div>
      <div className="flex justify-between"><dt>Envío</dt><dd>{shipping === 0 ? 'Gratis' : fmt(shipping)}</dd></div>
      <div className="flex justify-between items-baseline font-display text-2xl mt-1 pt-2 border-t-[3px] border-base-content">
        <dt>Total</dt><dd>{fmt(total)}</dd>
      </div>
    </dl>
  );
}

/* Barra de botones fija abajo del cuadro: siempre a la vista, aunque el contenido sea largo */
export function Actions({ children }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 mt-4 px-4 sm:px-6 py-3 bg-base-100 border-t-[3px] border-base-content flex flex-wrap gap-3 justify-end">
      {children}
    </div>
  );
}

export function AlertBox({ children }) {
  return (
    <div role="alert" className="alert border-[3px] border-base-content bg-base-100 text-base-content font-bold py-2 px-3">
      <span>{children}</span>
    </div>
  );
}

/* Botón que muestra "Un momento…" mientras espera al servidor */
export function BusyLabel({ busy, children }) {
  if (!busy) return children;
  return (<><span className="loading loading-spinner loading-sm" /> Un momento…</>);
}
