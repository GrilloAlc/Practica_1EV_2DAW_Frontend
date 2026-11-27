import { useCallback, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import type { ConfirmOptions } from './ConfirmDialog';

// Pide confirmación con una ventana propia en vez de window.confirm:
//   const [confirm, confirmDialog] = useConfirm();
//   if (await confirm({ title: '¿Cerrar la consulta?', confirmLabel: 'Cerrar' })) { ... }
// y en la página se pinta {confirmDialog}
export function useConfirm() {
  const [request, setRequest] = useState<{ options: ConfirmOptions; resolve: (ok: boolean) => void } | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setRequest({ options, resolve })),
    [],
  );

  const dialog = request ? (
    <ConfirmDialog
      {...request.options}
      onAnswer={(ok) => {
        request.resolve(ok);
        setRequest(null);
      }}
    />
  ) : null;

  return [confirm, dialog] as const;
}
