/* Paso final: pedido confirmado, pendiente o pago que no se pudo completar */
import { ModalHead } from '../components/Modal.jsx';
import { fmt } from '../lib/format.js';
import { Steps } from './parts.jsx';

function OrderLine({ order }) {
  return (
    <p className="font-bold">
      Pedido <b>{order.no}</b>{order.total ? <> por <b>{fmt(order.total)}</b></> : null}.
    </p>
  );
}

export function ResultStep({ view, order, canRetry, onClose, onRetry }) {
  if (view === 'ok') {
    return (
      <>
        <ModalHead onClose={onClose} />
        <Steps n={4} />
        <div className="text-center py-3">
          <div className="text-[64px] leading-none jit" aria-hidden="true"
            style={{ fontFamily: 'var(--font-jp)', WebkitTextStroke: '5px var(--paper)', paintOrder: 'stroke fill' }}>ドドドド</div>
          <h2 className="font-display text-4xl leading-tight my-3">¡Compra confirmada!</h2>
          <OrderLine order={order} />
          <button className="btn btn-primary mt-5" type="button" onClick={onClose}>Seguir comprando</button>
        </div>
      </>
    );
  }
  if (view === 'pending') {
    const transfer = order.method === 'tr';
    return (
      <>
        <ModalHead onClose={onClose} />
        <Steps n={4} />
        <div className="text-center py-3">
          <h2 className="font-display text-3xl leading-tight my-3">Pedido recibido</h2>
          <OrderLine order={order} />
          {transfer ? (
            <>
              <p className="font-bold mt-3">Transferí el total al alias <b>{order.alias}</b> y poné <b>{order.no}</b> como referencia.</p>
              <p className="text-sm font-bold mt-2">Este proyecto no verifica transferencias de forma automática.</p>
            </>
          ) : (
            <p className="font-bold mt-3">Tu pago está pendiente de acreditación. Cuando se acredite, el pedido queda confirmado.</p>
          )}
          <button className="btn btn-primary mt-5" type="button" onClick={onClose}>Seguir comprando</button>
        </div>
      </>
    );
  }
  return (
    <>
      <ModalHead onClose={onClose} />
      <div className="text-center py-3">
        <h2 className="font-display text-3xl leading-tight my-3">No pudimos completar el pago</h2>
        <p className="font-bold">{(order && order.msg) || 'Probá de nuevo o elegí otro medio de pago.'}</p>
        <div className="flex flex-wrap gap-3 justify-center mt-5">
          <button className="btn btn-outline" type="button" onClick={onClose}>Cerrar</button>
          {canRetry && <button className="btn btn-primary" type="button" onClick={onRetry}>Elegir otro medio de pago</button>}
        </div>
      </div>
    </>
  );
}
