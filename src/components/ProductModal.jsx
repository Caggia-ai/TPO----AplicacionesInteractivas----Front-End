/* Detalle de una figura: descripción, ficha técnica, gráfico de parámetros y botones de compra */
import { byId } from '../../shared/products.js';
import { useStore } from '../context/StoreContext.jsx';
import { fmt, SAGAS } from '../lib/format.js';
import FigureArt from './FigureArt.jsx';
import Modal, { ModalHead } from './Modal.jsx';
import Radar from './Radar.jsx';
import Stars from './Stars.jsx';

function Detail({ product: p, onClose, onBuyNow }) {
  const { left, cart, add } = useStore();
  const n = left(p);
  const inCart = cart[p.id] || 0;
  const full = n === 0 || inCart >= n;

  return (
    <>
      <ModalHead onClose={onClose} />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="shot self-start"><FigureArt pose={p.pose} bg={p.bg} sfx={p.sfx} /></div>
        <div>
          <span className="badge badge-primary">{SAGAS[p.saga].name}</span>
          <h2 className="font-display text-[26px] sm:text-3xl leading-tight my-2">{p.title}</h2>
          <div className="flex items-center gap-2 mb-3">
            <Stars id={p.id} rating={p.rating} />
            <span className="text-sm font-black">{p.rating.toFixed(1)} ({p.sales} ventas)</span>
          </div>
          <p className="font-bold mb-3">{p.desc}</p>
          <div className="overflow-x-auto">
            <table className="table table-sm mb-3">
              <tbody>
                <tr><th>Escala</th><td>{p.scale}</td></tr>
                <tr><th>Altura</th><td>{p.height} cm</td></tr>
                <tr><th>Material</th><td>PVC y ABS</td></tr>
                <tr><th>Disponibles</th><td>{n}</td></tr>
              </tbody>
            </table>
          </div>
          <h3 className="font-display text-xl mt-2">Parámetros</h3>
          <Radar stats={p.stats} />
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="price text-[32px] mr-auto">{fmt(p.price)}</span>
            <button className="btn btn-outline" type="button" disabled={n === 0} onClick={() => onBuyNow(p.id)}>Comprar ahora</button>
            <button className="btn btn-primary" type="button" disabled={full} onClick={() => add(p.id)}>
              {n === 0 ? 'Agotada' : inCart >= n ? 'Stock en carrito' : 'Agregar al carrito'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProductModal({ id, onClose, onBuyNow }) {
  const product = id ? byId(id) : null;
  return (
    <Modal open={Boolean(product)} onClose={onClose} label="Detalle de la figura" boxClass="!max-w-4xl">
      {product && <Detail product={product} onClose={onClose} onBuyNow={onBuyNow} />}
    </Modal>
  );
}
