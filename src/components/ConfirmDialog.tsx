import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import './ConfirmDialog.css';

export interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  // Acciones que no tienen vuelta atrás fácil (cerrar, desactivar): botón en vino
  danger?: boolean;
}

// Ventana de confirmación antes de las acciones importantes (cerrar una consulta, desactivar una casa…).
// Es un <dialog> modal: el foco queda dentro, Esc cancela y al cerrar vuelve al botón que la abrió.
// Se usa con el hook useConfirm (components/useConfirm.tsx)
function ConfirmDialog({ title, message, confirmLabel, cancelLabel = 'Cancelar', danger, onAnswer }: ConfirmOptions & { onAnswer: (ok: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const answered = useRef(false);

  // Se abre al montarse y se cierra al desmontarse, devolviendo el foco al botón que la abrió.
  // Esc se recoge con "cancel" (no con "close": en desarrollo React monta dos veces y ese evento llega tarde)
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    if (dialog && !dialog.open) dialog.showModal();
    // El foco empieza en "Cancelar": así un Enter sin querer no ejecuta la acción
    cancelRef.current?.focus();
    return () => {
      if (dialog?.open) dialog.close();
      previous?.focus?.();
    };
  }, []);

  function answer(ok: boolean) {
    if (answered.current) return;
    answered.current = true;
    onAnswer(ok);
  }

  return (
    <dialog
      ref={ref}
      className="confirm"
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        answer(false);
      }}
    >
      <h2 id="confirm-title">{title}</h2>
      {message && <div className="confirm-message">{message}</div>}
      <div className="confirm-actions">
        <button type="button" className={danger ? 'btn btn-acento' : 'btn'} onClick={() => answer(true)}>
          {confirmLabel}
        </button>
        <button ref={cancelRef} type="button" className="btn btn-outline" onClick={() => answer(false)}>
          {cancelLabel}
        </button>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;
