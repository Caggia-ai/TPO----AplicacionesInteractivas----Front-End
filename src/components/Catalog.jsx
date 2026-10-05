/* Catálogo: filtros (obra, texto, precio, orden, solo con stock) y grilla de figuras */
import { useMemo, useState } from 'react';
import { PRODUCTS } from '../../shared/products.js';
import { useStore } from '../context/StoreContext.jsx';
import { norm, SAGAS } from '../lib/format.js';
import ProductCard from './ProductCard.jsx';

const TABS = [
  ['all', 'Todas'],
  ['val', 'Valkyrie'],
  ['jojo', 'JoJo'],
  ['otro', 'Otros'],
];
const INITIAL = { saga: 'all', q: '', price: 'all', sort: 'rel', stock: false };

export function Catalog({ onOpen }) {
  const { left, add } = useStore();
  const [f, setF] = useState(INITIAL);
  const set = (patch) => setF((cur) => ({ ...cur, ...patch }));

  const list = useMemo(() => {
    const q = f.q.trim();
    let a = PRODUCTS.filter((p) => {
      if (f.saga !== 'all' && p.saga !== f.saga) return false;
      if (f.stock && left(p) === 0) return false;
      if (f.price === 'lt120' && p.price > 120000) return false;
      if (f.price === 'mid' && (p.price <= 120000 || p.price > 200000)) return false;
      if (f.price === 'gt200' && p.price <= 200000) return false;
      if (q && !norm(`${p.title} ${SAGAS[p.saga].name}`).includes(norm(q))) return false;
      return true;
    });
    if (f.sort === 'asc') a = [...a].sort((x, y) => x.price - y.price);
    if (f.sort === 'desc') a = [...a].sort((x, y) => y.price - x.price);
    if (f.sort === 'rating') a = [...a].sort((x, y) => y.rating - x.rating);
    return a;
  }, [f, left]);

  return (
    <section className="mx-auto max-w-[1100px] px-4 pt-10 pb-2" id="comprar" aria-labelledby="t-comprar">
      <h2 className="sec-h" id="t-comprar">Figuras en venta</h2>

      <div className="grid gap-3 mb-5">
        <div role="tablist" aria-label="Filtrar por obra" className="tabs tabs-boxed w-full">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" type="button" aria-selected={f.saga === id} aria-controls="grid"
              className={`tab flex-1${f.saga === id ? ' tab-active' : ''}`} onClick={() => set({ saga: id })}>
              {label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="input input-bordered flex items-center gap-2 sm:col-span-2 lg:col-span-1">
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" />
            </svg>
            <input id="q" type="search" className="grow min-w-0 font-bold" placeholder="Buscar personaje"
              aria-label="Buscar figuras" value={f.q} onChange={(e) => set({ q: e.target.value })} />
          </label>
          <select className="select select-bordered font-bold" id="fprice" aria-label="Rango de precio"
            value={f.price} onChange={(e) => set({ price: e.target.value })}>
            <option value="all">Cualquier precio</option>
            <option value="lt120">Hasta $120.000</option>
            <option value="mid">$120.000 a $200.000</option>
            <option value="gt200">Más de $200.000</option>
          </select>
          <select className="select select-bordered font-bold" id="fsort" aria-label="Ordenar"
            value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
            <option value="rel">Destacadas</option>
            <option value="asc">Precio: menor a mayor</option>
            <option value="desc">Precio: mayor a menor</option>
            <option value="rating">Mejor valoradas</option>
          </select>
          <label className="flex items-center gap-3 cursor-pointer shot px-3 min-h-12">
            <input type="checkbox" className="toggle toggle-primary" id="fstock" checked={f.stock}
              onChange={(e) => set({ stock: e.target.checked })} />
            <span className="font-black">Solo con stock</span>
          </label>
        </div>
        <p className="font-black" id="count" aria-live="polite">{list.length === 1 ? '1 figura' : `${list.length} figuras`}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4" id="grid">
        {list.length ? (
          list.map((p) => <ProductCard key={p.id} product={p} left={left(p)} onOpen={onOpen} onAdd={add} />)
        ) : (
          <div className="col-span-full shot border-dashed text-center px-5 py-9">
            <h3 className="font-display text-2xl mb-2">No hay figuras con ese filtro</h3>
            <p className="mb-4 font-bold">Probá con otra obra, otro rango de precio o una búsqueda más corta.</p>
            <button className="btn btn-primary" type="button" onClick={() => setF(INITIAL)}>Ver todas</button>
          </div>
        )}
      </div>
    </section>
  );
}
