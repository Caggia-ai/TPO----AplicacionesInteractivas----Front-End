/* Estado compartido de toda la tienda: carrito, stock vendido, tema, tinta y avisos.
   Lo que se guarda en localStorage sobrevive a recargar la página. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { byId, SHIP, FREE_FROM } from '../../shared/products.js';
import { load, save } from '../lib/format.js';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

/* descarta del carrito guardado las figuras que ya no existen */
function cleanCart(c) {
  const out = {};
  Object.keys(c || {}).forEach((id) => {
    if (byId(id) && c[id] > 0) out[id] = c[id];
  });
  return out;
}

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(() => cleanCart(load('gg_cart', {})));   // { id: cantidad }
  const [sold, setSold] = useState(() => load('gg_sold', {}));              // { id: unidades vendidas }
  const [theme, setThemeState] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'mangadark' ? 'mangadark' : 'manga');
  const [ink, setInkState] = useState(() => document.documentElement.getAttribute('data-saga') || 'mix');
  const [toast, setToast] = useState(null);
  const [addTick, setAddTick] = useState(0);   // sube cada vez que se agrega algo (anima el carrito)
  const timer = useRef(null);

  // el carrito y lo vendido se guardan en cada cambio
  useEffect(() => { save('gg_cart', cart); }, [cart]);
  useEffect(() => { save('gg_sold', sold); }, [sold]);

  /* cambiar el tema/tinta toca el <html> y lo recuerda solo cuando la persona lo elige */
  const setTheme = useCallback((t) => {
    document.documentElement.setAttribute('data-theme', t);
    save('gg_theme', t);
    setThemeState(t);
  }, []);
  const setInk = useCallback((s) => {
    document.documentElement.setAttribute('data-saga', s);
    save('gg_saga', s);
    setInkState(s);
  }, []);

  const notify = useCallback((msg, sfx) => {
    setToast({ msg, sfx });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const left = useCallback((p) => Math.max(0, p.stock - (sold[p.id] || 0)), [sold]);

  /* líneas del carrito: nunca más unidades que el stock que queda */
  const lines = useMemo(
    () =>
      Object.keys(cart)
        .map((id) => {
          const p = byId(id);
          if (!p) return null;
          const qty = Math.min(cart[id], Math.max(0, p.stock - (sold[id] || 0)));
          return qty > 0 ? { product: p, qty } : null;
        })
        .filter(Boolean),
    [cart, sold],
  );
  const subtotal = lines.reduce((a, l) => a + l.product.price * l.qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_FROM ? 0 : SHIP;
  const total = subtotal + shipping;
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const itemsPayload = useCallback(() => lines.map((l) => ({ id: l.product.id, qty: l.qty })), [lines]);

  const add = useCallback(
    (id) => {
      const p = byId(id);
      if (!p) return false;
      const n = left(p);
      if (n <= 0) { notify('Esta figura está agotada'); return false; }
      if ((cart[id] || 0) >= n) { notify('Ya tenés todo el stock de esta figura'); return false; }
      setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
      setAddTick((t) => t + 1);
      notify('Agregada al carrito', 'ドン');
      return true;
    },
    [cart, left, notify],
  );

  const changeQty = useCallback(
    (id, delta) => {
      const p = byId(id);
      if (!p) return;
      setCart((c) => {
        const q = (c[id] || 0) + delta;
        const next = { ...c };
        if (q <= 0) delete next[id];
        else next[id] = Math.min(q, left(p));
        return next;
      });
    },
    [left],
  );
  const removeItem = useCallback((id) => setCart((c) => { const n = { ...c }; delete n[id]; return n; }), []);

  /* Cuando un pedido queda tomado (aprobado, en proceso o pendiente) se descuenta el stock y se vacía el carrito */
  const finalize = useCallback(
    (items) => {
      const list = items || lines.map((l) => ({ id: l.product.id, qty: l.qty }));
      setSold((s) => {
        const n = { ...s };
        list.forEach((i) => { n[i.id] = (n[i.id] || 0) + i.qty; });
        return n;
      });
      setCart({});
      save('gg_pending', null);
    },
    [lines],
  );

  const value = useMemo(
    () => ({
      cart, lines, subtotal, shipping, total, count, left, itemsPayload,
      add, changeQty, removeItem, finalize,
      theme, setTheme, ink, setInk, toast, notify, addTick,
    }),
    [cart, lines, subtotal, shipping, total, count, left, itemsPayload, add, changeQty, removeItem, finalize, theme, setTheme, ink, setInk, toast, notify, addTick],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
