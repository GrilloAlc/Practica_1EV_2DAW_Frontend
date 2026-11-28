import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog';

// Avisa antes de salir de un formulario con cambios sin guardar:
// - dentro de la web (enlaces, botón Atrás), con la ventana de confirmación propia
// - al cerrar o recargar la pestaña, con el aviso del navegador
function UnsavedChangesGuard({ when }: { when: boolean }) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => when && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    if (!when) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [when]);

  if (blocker.state !== 'blocked') return null;
  return (
    <ConfirmDialog
      title="¿Salir sin guardar?"
      message={<p>Lo que has escrito en este formulario se perderá.</p>}
      confirmLabel="Salir sin guardar"
      cancelLabel="Seguir editando"
      danger
      onAnswer={(leave) => (leave ? blocker.proceed() : blocker.reset())}
    />
  );
}

export default UnsavedChangesGuard;
