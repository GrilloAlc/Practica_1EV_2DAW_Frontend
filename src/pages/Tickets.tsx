import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTickets } from '../api/tickets';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/useAuth';
import { TICKET_PRIORITIES, TICKET_STATUSES, categoryLabels, formatDate, priorityLabels, statusLabels } from '../utils/labels';
import type { Ticket } from '../types';

// Lista compartida por cliente, agente y admin. Las columnas cambian según el rol
function Tickets({ title, subtitle }: { title: string; subtitle: string }) {
  const { user } = useAuth();
  const isCustomer = user!.role === 'CLIENTE' || user!.role === 'PROPIETARIO';
  const isAdmin = user!.role === 'ADMIN';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadTickets() {
      try {
        const result = await getTickets({ limit: 50 });
        setTickets(result.data);
      } catch (err) {
        setError(getErrorMessage(err));
      }
      setLoading(false);
    }
    loadTickets();
  }, []);

  let visible = tickets;
  if (status) {
    visible = visible.filter((t) => t.status === status);
  }
  if (priority) {
    visible = visible.filter((t) => t.priority === priority);
  }
  if (search) {
    visible = visible.filter((t) => {
      const text = t.code + t.subject + t.customer.name + t.agent?.name;
      return text.toLowerCase().includes(search.toLowerCase());
    });
  }

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        {isCustomer && <Link to="/mis-tickets/nuevo" className="btn">+ Nuevo ticket</Link>}
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p className="field-error">{error}</p>}

      <div className="table-box">
        <div className="table-tools">
          <div className="tabs">
            <button className={status === '' ? 'tab tab-active' : 'tab'} onClick={() => setStatus('')}>Todos</button>
            {TICKET_STATUSES.map((s) => (
              <button key={s} className={status === s ? 'tab tab-active' : 'tab'} onClick={() => setStatus(s)}>
                {statusLabels[s]}
              </button>
            ))}
          </div>
          <div className="tabs">
            <select className="table-search" aria-label="Filtrar por prioridad" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">Toda prioridad</option>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>{priorityLabels[p]}</option>
              ))}
            </select>
            <input className="table-search" type="search" aria-label="Buscar ticket" placeholder="Buscar ticket..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="empty">
            <strong>Sin resultados</strong>
            No hay tickets que coincidan con esa búsqueda.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Asunto</th>
                {!isCustomer && <th>Cliente</th>}
                <th>Categoría</th>
                <th>Prioridad</th>
                <th>Estado</th>
                {isAdmin && <th>Agente</th>}
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t._id}>
                  {/* Enlace relativo: lleva al detalle dentro de la ruta actual */}
                  <td><Link to={t._id}>{t.code}</Link></td>
                  <td>{t.subject}</td>
                  {!isCustomer && <td>{t.customer.name}</td>}
                  <td>{categoryLabels[t.category]}</td>
                  <td>{priorityLabels[t.priority]}</td>
                  <td><span className="status-badge">{statusLabels[t.status]}</span></td>
                  {isAdmin && <td>{t.agent ? t.agent.name : 'Sin asignar'}</td>}
                  <td>{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="table-foot">Mostrando {visible.length} de {tickets.length} tickets</p>
    </main>
  );
}

export default Tickets;
