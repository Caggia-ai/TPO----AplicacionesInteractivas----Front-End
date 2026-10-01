/* Pantalla que SIMULA el sitio de Mercado Pago (solo en la versión demo).
   Elegís cómo termina el pago y la tienda "vuelve" como lo haría Mercado Pago. */
import Modal from '../components/Modal.jsx';
import { fmt } from '../lib/format.js';
import { getDemoOrder, settleDemoMP } from './demoServer.js';

export default function FakeMercadoPago({ orderRef, onFinish, onDismiss }) {
  const order = orderRef ? getDemoOrder(orderRef) : null;
  const finish = (outcome) => onFinish(settleDemoMP(orderRef, outcome));

  return (
    <Modal open={Boolean(order)} onClose={onDismiss} label="Simulación de Mercado Pago" boxClass="!max-w-lg">
      {order && (
        <>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-display text-2xl leading-tight">Mercado Pago</h2>
            <span className="badge badge-primary">SIMULACIÓN</span>
          </div>
          <p className="font-bold mb-3">
            Esta pantalla simula el sitio de Mercado Pago. Elegí cómo termina el pago para probar la vuelta a la tienda.
          </p>
          <ul className="mb-3">
            {order.lines.map((l) => (
              <li key={l.product.id} className="flex justify-between gap-3 py-1 border-b-2 border-dashed border-base-content font-bold">
                <span>{l.product.title} × {l.qty}</span>
                <span>{fmt(l.product.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between items-baseline font-display text-2xl mb-4"><span>Total</span><span>{fmt(order.total)}</span></p>
          <div className="grid gap-2">
            <button className="btn btn-primary" type="button" onClick={() => finish('approved')}>Pagar (aprobado)</button>
            <button className="btn btn-outline" type="button" onClick={() => finish('rejected')}>Simular pago rechazado</button>
            <button className="btn btn-outline" type="button" onClick={() => finish('pending')}>Simular pago pendiente (efectivo)</button>
            <button className="btn btn-outline" type="button" onClick={() => finish('cancel')}>Volver al sitio sin pagar</button>
          </div>
        </>
      )}
    </Modal>
  );
}
