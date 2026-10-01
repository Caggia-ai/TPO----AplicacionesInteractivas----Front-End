/* Paso 3: elegir cómo pagar y pagar.
   Mercado Pago: el servidor crea el pago y el navegador va a Mercado Pago.
   Tarjeta: formulario de tarjeta. Transferencia: se registra el pedido y se muestran los datos. */
import { useRef, useState } from 'react';
import { api } from '../api.js';
import { ModalHead } from '../components/Modal.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { errMsg, isTaken, METHODS, payMsg, save } from '../lib/format.js';
import CardPanel from './CardPanel.jsx';
import { AlertBox, BusyLabel, Steps, Summary } from './parts.jsx';

export default function PayStep({ buyer, method, setMethod, onClose, onBack, onRedirect, onResult }) {
  const { itemsPayload, finalize, total } = useStore();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const panelRef = useRef(null);

  const pick = (m) => { setMethod(m); setErr(''); setBusy(false); };
  const scrollToPanel = () => {
    window.requestAnimationFrame(() => panelRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }));
  };

  /* --- Mercado Pago (Checkout Pro) --- */
  async function payMP() {
    setErr('');
    setBusy(true);
    const order = { items: itemsPayload(), buyer };
    try {
      const r = await api('/api/preference', { method: 'POST', body: order });
      save('gg_pending', { ref: r.ref, items: order.items, total: r.total });
      onRedirect(r.url);
      if (__DEMO__) setBusy(false);
    } catch (e) {
      setBusy(false);
      setErr(errMsg(e));
    }
  }

  /* --- Transferencia --- */
  async function payTransfer() {
    setErr('');
    setBusy(true);
    try {
      const r = await api('/api/transfer', { method: 'POST', body: { items: itemsPayload(), buyer } });
      finalize();
      onResult('pending', { no: r.ref, total: r.total, method: 'tr', alias: r.alias });
    } catch (e) {
      setBusy(false);
      setErr(errMsg(e));
    }
  }

  /* --- Tarjeta: la llama el formulario. Si rechaza el pago, tira un error para que el formulario deje reintentar --- */
  async function payCard(formData) {
    setErr('');
    const items = itemsPayload();
    try {
      const r = await api('/api/pay', { method: 'POST', body: { items, buyer, formData } });
      if (isTaken(r.status)) {
        // se cambia de pantalla recién cuando el formulario terminó de procesar la respuesta
        setTimeout(() => {
          finalize(items);
          onResult(r.status === 'approved' ? 'ok' : 'pending', { no: r.ref, total: r.total, method: 'card' });
        }, 80);
        return;
      }
      setErr(payMsg(r.status_detail));
      throw new Error('rejected');
    } catch (e) {
      if (e.message !== 'rejected') setErr(errMsg(e));
      throw e;
    }
  }

  return (
    <>
      <ModalHead title="Medio de pago" onClose={onClose} />
      <Steps n={3} />
      <Summary />
      <fieldset className="grid gap-2 mb-4">
        <legend className="font-black mb-1">Elegí cómo pagar</legend>
        {METHODS.map((m) => (
          <label key={m.id} className="flex items-start gap-3 cursor-pointer shot p-3">
            <input type="radio" className="radio mt-1" name="paym" value={m.id} checked={method === m.id} onChange={() => pick(m.id)} />
            <span><b className="font-black block">{m.title}</b><span className="text-sm font-bold">{m.hint}</span></span>
          </label>
        ))}
      </fieldset>
      <div id="payErr" role="alert" aria-live="assertive" className="mb-3">{err && <AlertBox>{err}</AlertBox>}</div>
      <div id="payPanel" ref={panelRef}>
        {method === 'mp' && (
          <>
            <button className="btn btn-primary w-full" type="button" disabled={busy} onClick={payMP}>
              <BusyLabel busy={busy}>Pagar con Mercado Pago</BusyLabel>
            </button>
            <p className="text-sm font-bold mt-2">Vas a salir de esta página para pagar y volvés al terminar.</p>
          </>
        )}
        {method === 'tr' && (
          <button className="btn btn-primary w-full" type="button" disabled={busy} onClick={payTransfer}>
            <BusyLabel busy={busy}>Confirmar pedido</BusyLabel>
          </button>
        )}
        {method === 'card' && <CardPanel amount={total} email={buyer.email} onSubmit={payCard} onReady={scrollToPanel} />}
      </div>
      <div className="mt-4"><button className="btn btn-outline" type="button" onClick={onBack}>Volver</button></div>
    </>
  );
}
