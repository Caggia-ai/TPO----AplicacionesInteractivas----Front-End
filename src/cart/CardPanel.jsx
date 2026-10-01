/* Pago con tarjeta.
   - Tienda real: monta el formulario seguro de Mercado Pago (Card Payment Brick). Los datos de la tarjeta
     viajan directo a Mercado Pago; a nuestro servidor solo llega un token.
   - Demo: muestra un formulario simulado que solo acepta tarjetas de prueba. */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import DemoCardForm from '../demo/DemoCardForm.jsx';
import { errMsg } from '../lib/format.js';
import { brickStyle, getConfig, loadSDK } from '../lib/mercadopago.js';
import { AlertBox } from './parts.jsx';

export default function CardPanel({ amount, email, onSubmit, onReady }) {
  // siempre se llama a la versión más nueva de los manejadores, sin volver a montar el formulario
  const submitRef = useRef(onSubmit);
  const readyRef = useRef(onReady);
  submitRef.current = onSubmit;
  readyRef.current = onReady;
  const first = useRef({ amount, email });   // lo que se le pasa al formulario al crearlo
  const [state, setState] = useState({ loading: true, error: '' });
  const controllerRef = useRef(null);   // el formulario de Mercado Pago ya creado

  /* Al salir, se desmonta el formulario de Mercado Pago ANTES de que React saque su contenedor del DOM
     (los efectos normales limpian después, con el contenedor ya borrado). */
  useLayoutEffect(() => () => {
    const c = controllerRef.current;
    controllerRef.current = null;
    if (c) { try { c.unmount(); } catch (e) { /* ya no está */ } }
  }, []);

  useEffect(() => {
    if (__DEMO__) return undefined;
    let cancelled = false;
    // el setTimeout evita crear el formulario dos veces cuando React monta, desmonta y vuelve a montar en desarrollo
    const timer = setTimeout(async () => {
      try {
        const cfg = await getConfig();
        if (!cfg.publicKey) throw new Error('Falta configurar MP_PUBLIC_KEY en el servidor (archivo .env).');
        await loadSDK();
        if (cancelled) return;
        const mp = new window.MercadoPago(cfg.publicKey, { locale: 'es-AR' });
        const c = await mp.bricks().create('cardPayment', 'cardBrick', {
          initialization: { amount: first.current.amount, payer: { email: first.current.email } },
          customization: { visual: { style: brickStyle(), hideFormTitle: true }, paymentMethods: { maxInstallments: 12 } },
          callbacks: {
            onReady: () => { if (!cancelled) { setState({ loading: false, error: '' }); readyRef.current?.(); } },
            onSubmit: (data) => submitRef.current(data && data.formData ? data.formData : data),
            onError: (err) => console.error('Brick:', err),
          },
        });
        if (cancelled) { try { c.unmount(); } catch (e) { /* ya no está */ } return; }
        controllerRef.current = c;
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: errMsg(e) });
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (__DEMO__) return <DemoCardForm amount={amount} email={email} onSubmit={(fd) => submitRef.current(fd)} onReady={onReady} />;

  return (
    <>
      {state.loading && (
        <p className="font-bold mb-2"><span className="loading loading-spinner loading-md align-middle" /> Cargando formulario de tarjeta…</p>
      )}
      {state.error && <AlertBox>{state.error}</AlertBox>}
      <div id="cardBrick" />
    </>
  );
}
