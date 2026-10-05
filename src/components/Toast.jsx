/* Aviso corto (agregado al carrito, sin stock…).
   - Se dibuja dentro del diálogo abierto, porque un <dialog> modal tapa todo lo que está fuera de él.
   - No intercepta toques (pointer-events-none) y, dentro de un diálogo, se sube por encima de la barra
     de botones fija de abajo: nunca tiene que tapar "Continuar" ni "Volver". */
import { createPortal } from 'react-dom';
import { useStore } from '../context/StoreContext.jsx';
import { useTopLayerHost } from './Modal.jsx';

export function Toast() {
  const { toast } = useStore();
  const dialog = useTopLayerHost();
  const bottom = dialog ? '5.5rem' : '1rem';   // 5.5rem = alto de la barra de botones fija + aire
  return createPortal(
    <div className="toast toast-center toast-bottom z-[100] pointer-events-none" role="status" aria-live="polite"
      style={{ paddingBottom: `calc(${bottom} + env(safe-area-inset-bottom,0px))` }}>
      {toast && (
        <div className="alert border-[3px] border-base-content bg-base-100 text-base-content font-black py-2 px-4">
          {toast.sfx && <span className="font-display font-normal">{toast.sfx}</span>}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>,
    dialog || document.body,
  );
}
