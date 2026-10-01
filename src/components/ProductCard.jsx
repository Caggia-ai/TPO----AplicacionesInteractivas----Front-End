/* Tarjeta de una figura en el catálogo */
import FigureArt from './FigureArt.jsx';
import { fmt, SAGAS } from '../lib/format.js';

export default function ProductCard({ product: p, left, onOpen, onAdd }) {
  return (
    <article className="card card-compact shot bg-base-100">
      <figure className="block">
        <button className="thumb" type="button" aria-label={`Ver detalle de ${p.title}`} onClick={() => onOpen(p.id)}>
          <FigureArt pose={p.pose} bg={p.bg} sfx={p.sfx} />
          <span className="badge badge-primary absolute left-2 top-2 z-[3] outline outline-2 outline-base-100">{SAGAS[p.saga].tag}</span>
          {p.tag && left > 0 && <span className="badge badge-outline absolute left-2 bottom-2 z-[3]">{p.tag}</span>}
          {left > 0 && left <= 2 && (
            <span className="badge badge-outline absolute right-2 bottom-2 z-[3]">{left === 1 ? 'Última' : `Quedan ${left}`}</span>
          )}
          {left === 0 && <span className="sold"><b>Agotada</b></span>}
        </button>
      </figure>
      <div className="card-body gap-2 p-3">
        <h3 className="card-title items-start text-[15px] leading-tight font-black min-h-[2.5em]">{p.title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-primary badge-sm">{p.scale}</span>
          <span className="text-sm font-black">★ {p.rating.toFixed(1)}</span>
        </div>
        <div className="card-actions mt-auto items-center justify-between gap-2">
          <span className="price">{fmt(p.price)}</span>
          <button className="btn btn-primary btn-sm" type="button" disabled={left === 0} onClick={() => onAdd(p.id)}>Agregar</button>
        </div>
      </div>
    </article>
  );
}
