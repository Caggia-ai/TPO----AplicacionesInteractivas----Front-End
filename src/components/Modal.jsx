/* Ventana modal de DaisyUI sobre el <dialog> nativo del navegador (foco atrapado y Esc gratis).
   El contenido solo existe mientras está abierta: al cerrarla, todo lo de adentro se desmonta. */
import { useEffect, useRef, useSyncExternalStore } from 'react';

/* Pila de diálogos abiertos. El aviso (Toast) se dibuja dentro del de más arriba,
   porque un <dialog> modal tapa todo lo que está fuera de él. */
let stack = [];
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
export const useTopLayerHost = () =>
  useSyncExternalStore(subscribe, () => stack[stack.length - 1] || null, () => null);

export default function Modal({ open, onClose, label, boxClass = '', children }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return undefined;
    if (open && !d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    } else if (!open && d.open) {
      d.close();
    }
    if (!open) return undefined;
    stack = [...stack, d];
    emit();
    return () => { stack = stack.filter((x) => x !== d); emit(); };
  }, [open]);

  /* Esc o cierre nativo -> avisamos al padre */
  useEffect(() => {
    const d = ref.current;
    if (!d) return undefined;
    const h = () => onClose && onClose();
    d.addEventListener('close', h);
    return () => d.removeEventListener('close', h);
  }, [onClose]);

  return (
    <dialog ref={ref} className="modal modal-bottom sm:modal-middle" aria-label={label}>
      <div className={`modal-box w-full sm:w-11/12 p-4 sm:p-6 ${boxClass}`}>{open ? children : null}</div>
      <div className="modal-backdrop">
        {/* toca-afuera-para-cerrar: no es un botón "real" para teclado ni lector de pantalla (para eso están Esc y la ✕) */}
        <button type="button" tabIndex={-1} aria-hidden="true" onClick={onClose}>cerrar</button>
      </div>
    </dialog>
  );
}

/* Cabecera común de los modales: título y botón de cerrar */
export function ModalHead({ title = '', onClose }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="font-display text-2xl leading-tight">{title}</h2>
      <button type="button" className="btn btn-primary btn-square btn-sm" aria-label="Cerrar" onClick={onClose}>✕</button>
    </div>
  );
}
