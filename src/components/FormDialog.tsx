import { useEffect, useId, useRef } from 'react';
import type { ReactNode, SyntheticEvent } from 'react';
import './ConfirmDialog.css';

interface FormDialogProps {
  title: string;
  // Texto bajo el título (opcional)
  intro?: ReactNode;
  submitLabel: string;
  busy?: boolean;
  error?: string;
  onSubmit: () => void;
  onClose: () => void;
  children: ReactNode;
}

// Ventana con un formulario corto (crear usuario, cambiar contraseña…). Igual que ConfirmDialog:
// un <dialog> modal con el foco dentro, Esc cierra y al cerrar vuelve al botón que la abrió.
// Se pinta solo mientras está abierta: {open && <FormDialog … />}
function FormDialog({ title, intro, submitLabel, busy, error, onSubmit, onClose, children }: FormDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    if (dialog && !dialog.open) dialog.showModal();
    // El foco va al primer campo del formulario
    dialog?.querySelector<HTMLElement>('input, select, textarea')?.focus();
    return () => {
      if (dialog?.open) dialog.close();
      previous?.focus?.();
    };
  }, []);

  function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    if (!busy) onSubmit();
  }

  return (
    <dialog
      ref={ref}
      className="confirm form-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <form onSubmit={handleSubmit} noValidate>
        <h2 id={titleId}>{title}</h2>
        {intro && <div className="confirm-message">{intro}</div>}
        <div className="form-dialog-fields">{children}</div>
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="confirm-actions">
          <button type="submit" className="btn" disabled={busy}>{busy ? 'Guardando…' : submitLabel}</button>
          <button type="button" className="btn btn-outline" disabled={busy} onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </dialog>
  );
}

export default FormDialog;
