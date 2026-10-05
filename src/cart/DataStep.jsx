/* Paso 2: datos de envío. Se valida a mano (sin depender del envío nativo del formulario,
   que algunos visores bloquean), y Enter pasa al campo siguiente. */
import { useRef, useState } from 'react';
import { ModalHead } from '../components/Modal.jsx';
import { Actions, Steps, Summary } from './parts.jsx';

const FIELDS = [
  { key: 'name', label: 'Nombre y apellido', type: 'text', auto: 'name', max: 60 },
  { key: 'email', label: 'Email', type: 'email', auto: 'email', max: 80 },
  { key: 'addr', label: 'Dirección de entrega', type: 'text', auto: 'street-address', max: 90 },
  { key: 'city', label: 'Ciudad', type: 'text', auto: 'address-level2', max: 40 },
];

export function validate(v) {
  const errs = {};
  if (v.name.trim().length < 2) errs.name = 'Escribí tu nombre y apellido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errs.email = 'Escribí un email válido, por ejemplo nombre@correo.com.';
  if (v.addr.trim().length < 3) errs.addr = 'Escribí la dirección de entrega.';
  if (v.city.trim().length < 2) errs.city = 'Escribí la ciudad.';
  return errs;
}

export function DataStep({ initial, onClose, onBack, onNext }) {
  const [v, setV] = useState({ name: '', email: '', addr: '', city: '', ...initial });
  const [errs, setErrs] = useState({});
  const refs = useRef({});

  function submit() {
    const e = validate(v);
    setErrs(e);
    const firstBad = FIELDS.find((f) => e[f.key]);
    if (firstBad) { refs.current[firstBad.key]?.focus(); return; }
    onNext({ name: v.name.trim(), email: v.email.trim(), addr: v.addr.trim(), city: v.city.trim() });
  }
  function onKeyDown(e, i) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (i < FIELDS.length - 1) refs.current[FIELDS[i + 1].key]?.focus();
    else submit();
  }

  return (
    <>
      <ModalHead title="Tus datos" onClose={onClose} />
      <Steps n={2} />
      <form id="chk" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
        {FIELDS.map((f, i) => (
          <div key={f.key} className="form-control w-full mb-3">
            <label className="label-text font-black mb-1" htmlFor={`f-${f.key}`}>{f.label}</label>
            <input className="input input-bordered w-full font-bold" id={`f-${f.key}`} type={f.type} name={f.key}
              required aria-required="true" aria-describedby={`e-${f.key}`} aria-invalid={errs[f.key] ? 'true' : 'false'}
              enterKeyHint={i === FIELDS.length - 1 ? 'go' : 'next'} autoComplete={f.auto} maxLength={f.max}
              ref={(el) => { refs.current[f.key] = el; }} value={v[f.key]}
              onChange={(e) => setV((cur) => ({ ...cur, [f.key]: e.target.value }))}
              onKeyDown={(e) => onKeyDown(e, i)} />
            <p className="text-sm font-black mt-1" id={`e-${f.key}`} data-err={f.key} role="alert">{errs[f.key] || ''}</p>
          </div>
        ))}
        <Summary />
        <Actions>
          <button className="btn btn-outline" type="button" onClick={onBack}>Volver</button>
          <button className="btn btn-primary" type="button" onClick={submit}>Continuar al pago</button>
        </Actions>
      </form>
    </>
  );
}
