/* Ventana del carrito y de toda la compra: carrito -> datos -> pago -> resultado */
import { useState } from 'react';
import Modal from '../components/Modal.jsx';
import { useStore } from '../context/StoreContext.jsx';
import CartStep, { EmptyCart } from './CartStep.jsx';
import DataStep from './DataStep.jsx';
import PayStep from './PayStep.jsx';
import ResultStep from './ResultStep.jsx';

const RESULTS = ['ok', 'pending', 'fail'];

export default function CartModal({ open, view, order, setView, onClose, onRedirect, onResult }) {
  const { lines } = useStore();
  const [buyer, setBuyer] = useState({});
  const [method, setMethod] = useState('mp');

  // sin figuras en el carrito no tiene sentido estar en "datos" o "pago"
  const v = !RESULTS.includes(view) && lines.length === 0 ? 'cart' : view;
  const goShop = () => { onClose(); document.getElementById('comprar')?.scrollIntoView?.(); };

  let body = null;
  if (RESULTS.includes(v)) {
    body = <ResultStep view={v} order={order} canRetry={lines.length > 0} onClose={onClose} onRetry={() => setView('pay')} />;
  } else if (lines.length === 0) {
    body = <EmptyCart onClose={onClose} onGoShop={goShop} />;
  } else if (v === 'data') {
    body = <DataStep initial={buyer} onClose={onClose} onBack={() => setView('cart')} onNext={(b) => { setBuyer(b); setView('pay'); }} />;
  } else if (v === 'pay') {
    body = (
      <PayStep buyer={buyer} method={method} setMethod={setMethod} onClose={onClose}
        onBack={() => setView('data')} onRedirect={onRedirect} onResult={onResult} />
    );
  } else {
    body = <CartStep onClose={onClose} onNext={() => setView('data')} />;
  }

  return (
    <Modal open={open} onClose={onClose} label="Carrito de compras" boxClass="!max-w-2xl">
      <div id="cartBox">{body}</div>
    </Modal>
  );
}
