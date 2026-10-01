/* Barra de arriba (DaisyUI navbar): logo, estilo de tinta, modo claro/oscuro y carrito */
import { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';

export default function Header({ onOpenCart }) {
  const { count, theme, setTheme, ink, setInk, addTick } = useStore();
  const [bump, setBump] = useState(false);

  // el carrito "salta" un momento cada vez que se agrega algo
  useEffect(() => {
    if (!addTick) return undefined;
    setBump(true);
    const t = setTimeout(() => setBump(false), 320);
    return () => clearTimeout(t);
  }, [addTick]);

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 bg-base-100 border-b-[3px] border-base-content">
      <div className="navbar mx-auto max-w-[1100px] gap-2 px-3 min-h-16">
        <div className="navbar-start">
          <a className="flex items-center gap-2 no-underline text-base-content" href="#top" aria-label="Gogogo Market, inicio">
            <span className="bg-base-content text-base-100 font-display text-2xl leading-none px-2 py-1.5" aria-hidden="true">ゴ</span>
            <span className="font-display text-[19px] leading-[.95]">
              Gogogo<span className="block font-body font-black text-[10px] tracking-[.34em] mt-[3px]">MARKET</span>
            </span>
          </a>
        </div>
        <div className="navbar-end gap-2">
          <select className="select select-bordered select-sm font-bold w-[6.75rem] sm:w-36" id="inkSel"
            aria-label="Estilo de tinta" value={ink} onChange={(e) => setInk(e.target.value)}>
            <option value="mix">Tinta: Mix</option>
            <option value="ragnarok">Tinta: Ragnarok</option>
            <option value="jojo">Tinta: JoJo</option>
          </select>
          <label className="btn btn-outline btn-square btn-sm swap swap-rotate" aria-label="Cambiar entre modo claro y oscuro">
            <input type="checkbox" id="themeSw" checked={theme === 'mangadark'}
              onChange={(e) => setTheme(e.target.checked ? 'mangadark' : 'manga')} />
            <svg className="swap-off h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
            </svg>
            <svg className="swap-on h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
            </svg>
          </label>
          <div className="indicator">
            <span id="cnt" className={`indicator-item badge bg-base-100 text-base-content border-2 border-base-content font-black${count === 0 ? ' hidden' : ''}`}>{count}</span>
            <button className={`btn btn-primary btn-sm px-2 sm:px-4${bump ? ' bump' : ''}`} id="cartBtn" type="button"
              aria-label="Abrir carrito" onClick={() => onOpenCart('cart')}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 4h2.5l2.2 10.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H6.3" /><circle cx="9.5" cy="19.5" r="1.4" /><circle cx="17" cy="19.5" r="1.4" />
              </svg>
              <span className="hidden sm:inline">Carrito</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
