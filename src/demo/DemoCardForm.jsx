/* Formulario de tarjeta SIMULADO (solo en la versión demo).
   Solo acepta las tarjetas de prueba de Mercado Pago, así nadie escribe una tarjeta real,
   y nada de lo que se escribe sale del navegador. El nombre del titular decide el resultado. */
import { useEffect, useState } from 'react';
import { fmt } from '../lib/format.js';
import { AlertBox } from '../cart/parts.jsx';
import { SCEN, TEST_CARDS } from './demoServer.js';

const PRESETS = {
  approved: ['5031 7557 3453 0604', '11/30', '123', 'APRO'],
  rejected: ['4509 9535 6623 3704', '11/30', '123', 'OTHE'],
  pending: ['5031 7557 3453 0604', '11/30', '123', 'CONT'],
  funds: ['4509 9535 6623 3704', '11/30', '123', 'FUND'],
  call: ['5031 7557 3453 0604', '11/30', '123', 'CALL'],
};
const EMPTY = { preset: '', num: '', exp: '', cvv: '', holder: '', doc: '', inst: '1' };

function Field({ label, className = '', children }) {
  return (
    <label className={`form-control w-full ${className}`}>
      <span className="label-text font-black mb-1">{label}</span>
      {children}
    </label>
  );
}

export default function DemoCardForm({ amount, email, onSubmit, onReady }) {
  const [v, setV] = useState(EMPTY);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch) => setV((cur) => ({ ...cur, ...patch }));

  useEffect(() => { onReady?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function choosePreset(key) {
    const p = PRESETS[key];
    if (!p) { set({ preset: '' }); return; }
    set({ preset: key, num: p[0], exp: p[1], cvv: p[2], holder: p[3], doc: '12345678' });
    setErr('');
  }

  /* se valida a mano: no depende del envío nativo del formulario */
  function trySubmit() {
    if (busy) return;
    const num = v.num.replace(/\s+/g, '');
    const holder = v.holder.trim().toUpperCase();
    const em = v.exp.trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!/^\d{15,16}$/.test(num)) return setErr('Revisá el número de la tarjeta.');
    if (!TEST_CARDS[num]) return setErr('En esta simulación solo se aceptan las tarjetas de prueba de Mercado Pago, por ejemplo 5031 7557 3453 0604.');
    if (!em) return setErr('Revisá la fecha de vencimiento (MM/AA).');
    const now = new Date();
    const yy = now.getFullYear() % 100;
    const mm = now.getMonth() + 1;
    if (Number(em[2]) < yy || (Number(em[2]) === yy && Number(em[1]) < mm)) return setErr('La tarjeta está vencida.');
    if (!/^\d{3,4}$/.test(v.cvv.trim())) return setErr('Revisá el código de seguridad.');
    if (!SCEN[holder]) return setErr('Poné como titular APRO, OTHE, CONT, CALL, FUND o SECU para elegir el resultado.');
    if (!/^\d{7,9}$/.test(v.doc.trim())) return setErr('Revisá el número de documento.');
    setErr('');
    setBusy(true);
    Promise.resolve(onSubmit({
      token: `demo:${holder}`, issuer_id: '24', payment_method_id: TEST_CARDS[num],
      installments: Number(v.inst) || 1,
      payer: { email, identification: { type: 'DNI', number: v.doc.trim() } },
    })).then(() => setBusy(false), () => setBusy(false));
  }
  const enter = (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); trySubmit(); } };

  return (
    <div id="cardBrick" className="grid gap-3" onKeyDown={enter}>
      <div role="note" className="alert border-[3px] border-base-content bg-base-100 text-base-content font-bold py-2 px-3">
        <span>SIMULACIÓN: no escribas datos de tu tarjeta real. Solo se aceptan tarjetas de prueba y nada sale de tu navegador.</span>
      </div>
      <Field label="Completar con datos de prueba">
        <select className="select select-bordered font-bold" name="preset" value={v.preset} onChange={(e) => choosePreset(e.target.value)}>
          <option value="">Elegí un escenario…</option>
          <option value="approved">Pago aprobado</option>
          <option value="rejected">Rechazado (error general)</option>
          <option value="pending">Pendiente</option>
          <option value="funds">Rechazado: fondos insuficientes</option>
          <option value="call">Rechazado: hay que autorizar con el banco</option>
        </select>
      </Field>
      <Field label="Número de tarjeta">
        <input className="input input-bordered w-full font-bold" name="num" autoComplete="off" inputMode="numeric" maxLength={23}
          placeholder="5031 7557 3453 0604" value={v.num} onChange={(e) => set({ num: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Vencimiento">
          <input className="input input-bordered w-full font-bold" name="exp" autoComplete="off" inputMode="numeric" maxLength={5}
            placeholder="11/30" value={v.exp} onChange={(e) => set({ exp: e.target.value })} />
        </Field>
        <Field label="Código de seguridad">
          <input className="input input-bordered w-full font-bold" name="cvv" autoComplete="off" inputMode="numeric" maxLength={4}
            placeholder="123" value={v.cvv} onChange={(e) => set({ cvv: e.target.value })} />
        </Field>
      </div>
      <Field label="Titular (define el resultado)">
        <input className="input input-bordered w-full font-bold" name="holder" autoComplete="off" maxLength={30}
          placeholder="APRO" value={v.holder} onChange={(e) => set({ holder: e.target.value })} />
      </Field>
      <p className="text-sm font-bold -mt-2">
        En la simulación el titular decide qué pasa: APRO aprueba, OTHE rechaza, CONT deja pendiente, CALL pide autorizar, FUND es sin fondos, SECU es código inválido.
      </p>
      <div className="grid grid-cols-[6rem_1fr] gap-3">
        <Field label="Tipo">
          <select className="select select-bordered font-bold" name="dt" defaultValue="DNI"><option>DNI</option></select>
        </Field>
        <Field label="Número de documento">
          <input className="input input-bordered w-full font-bold" name="doc" autoComplete="off" inputMode="numeric" maxLength={9}
            placeholder="12345678" value={v.doc} onChange={(e) => set({ doc: e.target.value })} />
        </Field>
      </div>
      <Field label="Cuotas">
        <select className="select select-bordered font-bold" name="inst" value={v.inst} onChange={(e) => set({ inst: e.target.value })}>
          {[1, 3, 6, 12].map((n) => (
            <option key={n} value={n}>{n} {n > 1 ? 'cuotas' : 'cuota'} de {fmt(amount / n)}</option>
          ))}
        </select>
      </Field>
      <div role="alert" aria-live="assertive">{err && <AlertBox>{err}</AlertBox>}</div>
      <button className="btn btn-primary w-full" type="button" disabled={busy} onClick={trySubmit}>
        {busy ? (<><span className="loading loading-spinner loading-sm" /> Un momento…</>) : `Pagar ${fmt(amount)}`}
      </button>
    </div>
  );
}
