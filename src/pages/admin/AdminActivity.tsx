import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getActivityPage } from '../../api/stats';
import type { ActivityEntry } from '../../api/stats';
import { getErrorMessage } from '../../api/client';
import { formatDateTime, formatNumber, roleLabels, statusLabels } from '../../utils/labels';
import { TableSkeleton } from '../../components/Skeleton';
import type { Page } from '../../types';

const PER_PAGE = 25;

// Actividad: todos los cambios de estado de todos los tickets (GET /ticket-history), del más reciente al
// más antiguo. Sirve de auditoría: quién cambió qué y cuándo
function AdminActivity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Math.floor(Number(searchParams.get('pagina'))) || 1);
  const [result, setResult] = useState<{ page: number; data: Page<ActivityEntry> } | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    getActivityPage(page, PER_PAGE).then(
      (res) => {
        if (!current) return;
        setResult({ page, data: res });
        setError('');
      },
      (err) => {
        if (current) setError(getErrorMessage(err));
      },
    );
    return () => {
      current = false;
    };
  }, [page, attempt]);

  function goTo(n: number) {
    setSearchParams(n > 1 ? { pagina: String(n) } : {}, { replace: true });
  }

  const loading = result?.page !== page && !error;
  const entries = result?.data.data || [];
  const total = result?.data.pagesData.total ?? 0;
  const totalPages = Math.max(1, result?.data.pagesData.totalPages || 1);

  return (
    <main className="page">
      <title>Actividad · Administración · CataHome</title>
      <h1 className="page-title">Actividad</h1>
      <p className="page-subtitle">Todos los cambios de estado de los tickets: quién los hizo y cuándo. Lo más reciente, arriba.</p>

      {error && (
        <div className="empty table-box" role="alert">
          <strong>No hemos podido cargar la actividad</strong>
          <p>{error}</p>
          <button type="button" className="btn btn-outline" onClick={() => setAttempt(attempt + 1)}>Volver a intentarlo</button>
        </div>
      )}

      {!error && (
        <div className="table-box">
          {!result ? (
            <TableSkeleton />
          ) : entries.length === 0 ? (
            <div className="empty"><strong>Todavía no hay cambios de estado</strong>Aparecerán aquí en cuanto un agente o un cliente mueva un ticket.</div>
          ) : (
            <table className={loading ? 'table admin-loading' : 'table'} aria-busy={loading}>
              <thead>
                <tr><th>Fecha</th><th>Ticket</th><th>Cambio</th><th>Hecho por</th></tr>
              </thead>
              <tbody>
                {entries.map((h) => (
                  <tr key={h._id}>
                    <td className="cell-muted cell-code">{formatDateTime(h.changedAt || h.createdAt || '')}</td>
                    <td data-label="Ticket" className="cell-title">
                      {h.ticket ? <Link to={`/admin/tickets/${h.ticket._id}`}>{h.ticket.code} · {h.ticket.subject}</Link> : <span className="cell-muted">Ticket eliminado</span>}
                    </td>
                    <td data-label="Cambio">
                      <span className="admin-history-change">
                        {h.oldStatus ? <span className={'status-badge status-' + h.oldStatus.toLowerCase()}>{statusLabels[h.oldStatus]}</span> : <span className="cell-muted">Creado</span>}
                        <span className="cell-muted">pasa a</span>
                        <span className={'status-badge status-' + h.newStatus.toLowerCase()}>{statusLabels[h.newStatus]}</span>
                      </span>
                    </td>
                    <td data-label="Hecho por">
                      {h.changedBy ? <>{h.changedBy.name}{h.changedBy.role && <span className="cell-muted"> · {roleLabels[h.changedBy.role]}</span>}</> : <span className="cell-muted">Usuario eliminado</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="table-foot">
        <p>{formatNumber(total)} {total === 1 ? 'cambio' : 'cambios'}</p>
        {totalPages > 1 && (
          <div className="pager">
            <button className="btn btn-outline" disabled={page <= 1} onClick={() => goTo(page - 1)}>Anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => goTo(page + 1)}>Siguiente</button>
          </div>
        )}
      </div>
    </main>
  );
}

export default AdminActivity;
