/* La tienda completa: junta las secciones y controla las ventanas (detalle, carrito, Mercado Pago simulado) */
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import CartModal from './cart/CartModal.jsx';
import Catalog from './components/Catalog.jsx';
import DemoBar from './components/DemoBar.jsx';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import HowTo from './components/HowTo.jsx';
import ProductModal from './components/ProductModal.jsx';
import SvgDefs from './components/SvgDefs.jsx';
import Toast from './components/Toast.jsx';
import { useStore } from './context/StoreContext.jsx';
import FakeMercadoPago from './demo/FakeMercadoPago.jsx';
import { errMsg, isTaken, load, payMsg } from './lib/format.js';
import { redirect } from './lib/nav.js';

const RETURN_KEYS = ['status', 'collection_status', 'payment_id', 'collection_id'];

export default function App() {
  const { add, cart, finalize } = useStore();
  const [productId, setProductId] = useState(null);                                  // figura abierta en el detalle
  const [checkout, setCheckout] = useState({ open: false, view: 'cart', order: null }); // ventana del carrito
  const [fakeMP, setFakeMP] = useState(null);                                        // pedido en la pantalla de MP simulada (demo)

  const openCart = useCallback((view = 'cart', order = null) => {
    setCheckout((c) => ({ open: true, view, order: order || c.order }));
  }, []);
  const closeCart = useCallback(() => setCheckout((c) => ({ ...c, open: false })), []);
  const setView = useCallback((view) => setCheckout((c) => ({ ...c, view })), []);
  const closeProduct = useCallback(() => setProductId(null), []);

  /* "Comprar ahora": si todavía no está en el carrito la agrega, y abre el carrito */
  function buyNow(id) {
    if ((cart[id] || 0) === 0 && !add(id)) return;
    setProductId(null);
    openCart('cart');
  }

  /* Ir a pagar a Mercado Pago. En la demo se abre la pantalla simulada en lugar de salir de la página. */
  function goToPayment(url) {
    if (__DEMO__) {
      const m = String(url).match(/^demo:\/\/mercadopago\/(.+)$/);
      if (m) setFakeMP(m[1]);
      return;
    }
    redirect(url);
  }

  /* Vuelta desde Mercado Pago: se verifica el pago con el servidor, no con lo que dice la URL */
  const handleReturn = useCallback(async (params) => {
    const fromUrl = !params;
    const q = params || new URLSearchParams(window.location.search);
    if (!RETURN_KEYS.some((k) => q.has(k))) return;
    const pid = q.get('payment_id') || q.get('collection_id');
    if (fromUrl) {
      try { window.history.replaceState(null, '', window.location.pathname + window.location.hash); } catch (e) { /* sin historial */ }
    }
    const pending = load('gg_pending', null);
    if (!pid || pid === 'null') {
      openCart('fail', { msg: 'No se completó el pago en Mercado Pago. Tu carrito sigue como estaba.' });
      return;
    }
    try {
      const p = await api('/api/payment/' + encodeURIComponent(pid));
      if (isTaken(p.status)) {
        finalize(pending && pending.items);
        openCart(p.status === 'approved' ? 'ok' : 'pending', { no: p.ref || (pending && pending.ref) || pid, total: p.amount, method: 'mp' });
      } else {
        openCart('fail', { msg: payMsg(p.status_detail) });
      }
    } catch (e) {
      openCart('fail', { msg: errMsg(e) });
    }
  }, [finalize, openCart]);

  // al abrir la tienda: si venimos de Mercado Pago, procesar la vuelta (una sola vez)
  const returned = useRef(false);
  useEffect(() => {
    if (returned.current) return;
    returned.current = true;
    handleReturn();
  }, [handleReturn]);

  // si el navegador restaura la página desde su memoria (botón "atrás"), recargar para no mostrar un estado viejo
  useEffect(() => {
    const onShow = (e) => { if (e.persisted) window.location.reload(); };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  return (
    <>
      <SvgDefs />
      <Header onOpenCart={openCart} />
      {__DEMO__ && <DemoBar />}
      <main>
        <Hero />
        <Catalog onOpen={setProductId} />
        <HowTo />
      </main>
      <Footer />

      <ProductModal id={productId} onClose={closeProduct} onBuyNow={buyNow} />
      <CartModal open={checkout.open} view={checkout.view} order={checkout.order}
        setView={setView} onClose={closeCart} onRedirect={goToPayment} onResult={openCart} />
      {__DEMO__ && (
        <FakeMercadoPago orderRef={fakeMP} onDismiss={() => setFakeMP(null)}
          onFinish={(params) => { setFakeMP(null); handleReturn(params); }} />
      )}
      <Toast />
    </>
  );
}
