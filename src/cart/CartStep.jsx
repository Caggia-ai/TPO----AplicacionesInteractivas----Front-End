/* Paso 1: el carrito */
import { FREE_FROM } from '../../shared/products.js';
import FigureArt from '../components/FigureArt.jsx';
import { ModalHead } from '../components/Modal.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { fmt } from '../lib/format.js';
import { Actions, Steps, Summary } from './parts.jsx';

export function EmptyCart({ onClose, onGoShop }) {
  return (
    <>
      <ModalHead title="Tu carrito" onClose={onClose} />
      <div className="shot border-dashed text-center px-5 py-9">
        <h3 className="font-display text-2xl mb-2">Tu carrito está vacío</h3>
        <p className="mb-4 font-bold">Elegí una figura y agregala para empezar.</p>
        <button className="btn btn-primary" type="button" onClick={onGoShop}>Ver figuras</button>
      </div>
    </>
  );
}

export function CartStep({ onClose, onNext }) {
  const { lines, subtotal, changeQty, removeItem, left } = useStore();
  const faltan = Math.max(0, FREE_FROM - subtotal);

  return (
    <>
      <ModalHead title="Tu carrito" onClose={onClose} />
      <Steps n={1} />
      <ul>
        {lines.map(({ product: p, qty }) => (
          <li key={p.id} className="flex items-center gap-3 py-3 border-b-2 border-dashed border-base-content">
            <div className="w-16 shrink-0 shot"><FigureArt pose={p.pose} bg={p.bg} sfx={p.sfx} className="mini" /></div>
            <div className="grow min-w-0">
              <p className="font-black leading-tight">{p.title}</p>
              <p className="text-sm font-bold">{fmt(p.price)} cada una</p>
              <button className="link text-sm font-bold" type="button" onClick={() => removeItem(p.id)}>Quitar</button>
            </div>
            <div className="join">
              <button className="btn btn-outline btn-sm join-item" type="button" aria-label="Una menos" onClick={() => changeQty(p.id, -1)}>−</button>
              <span className="btn btn-outline btn-sm join-item pointer-events-none" aria-live="polite">{qty}</span>
              <button className="btn btn-outline btn-sm join-item" type="button" aria-label="Una más" disabled={qty >= left(p)} onClick={() => changeQty(p.id, 1)}>+</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <p className="font-bold text-sm mb-1">{faltan === 0 ? '¡Tenés envío gratis!' : `Te faltan ${fmt(faltan)} para el envío gratis`}</p>
        <progress className="progress progress-primary w-full" value={Math.min(subtotal, FREE_FROM)} max={FREE_FROM} aria-label="Avance hacia el envío gratis" />
      </div>
      <Summary />
      <Actions>
        <button className="btn btn-outline" type="button" onClick={onClose}>Seguir comprando</button>
        <button className="btn btn-primary" type="button" onClick={onNext}>Continuar</button>
      </Actions>
    </>
  );
}
